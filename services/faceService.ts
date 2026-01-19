
import { alignFace, sharpenCanvas } from '../utils/imageUtils';
import { FaceAnalysisResult, RecognitionModelType } from '../types';

// Declare global TFLite types
declare const tflite: any;
declare const tf: any;

let detectionModel: any = null;
let recognitionModel: any = null;
let currentRecognizerType: RecognitionModelType = 'MOBILE_FACE_NET';

// --- Configuration ---
// Default values, will be updated dynamically based on loaded model
let DETECTOR_INPUT_SIZE = 128;
let RECOGNIZER_INPUT_SIZE = 112; 
const MIN_FACE_SIZE = 24;

export const MODELS_CONFIG = {
  detector: {
    name: 'face_detection_short_range.tflite',
    url: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
    inputSize: 128 // Hint, actual size read from model
  },
  recognizers: {
    MOBILE_FACE_NET: {
      name: 'mobile_face_net.tflite',
      url: 'https://raw.githubusercontent.com/MCarlomagno/FaceRecognitionAuth/refs/heads/master/assets/mobilefacenet.tflite',
      inputSize: 112,
      outputDim: 192
    },
    FACENET: {
      name: 'facenet.tflite',
      url: 'https://raw.githubusercontent.com/shubham0204/FaceRecognition_With_FaceNet_Android/master/app/src/main/assets/facenet.tflite',
      inputSize: 160,
      outputDim: 128
    }
  }
};

const CACHE_NAME = 'offline-ai-gallery-models-v3';

// --- Types ---
interface Point { x: number, y: number }
interface Detection {
  box: { xMin: number, yMin: number, width: number, height: number };
  landmarks: Point[];
  score: number;
}

// --- Anchors Generator ---
const anchors: number[][] = [];
const generateAnchors = () => {
  anchors.length = 0; // Clear existing
  const strides = [8, 16];
  const anchorsNum = [2, 6];
  strides.forEach((stride, layerId) => {
    const gridRows = Math.ceil(DETECTOR_INPUT_SIZE / stride);
    const gridCols = Math.ceil(DETECTOR_INPUT_SIZE / stride);
    const anchorCount = anchorsNum[layerId];
    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        for (let a = 0; a < anchorCount; a++) {
            anchors.push([(x + 0.5) / gridCols, (y + 0.5) / gridRows]);
        }
      }
    }
  });
};

const getModelFromCacheOrNetwork = async (modelConfig: { name: string, url: string }) => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(modelConfig.name);
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      if (blob.size > 1000) return await blob.arrayBuffer();
      await cache.delete(modelConfig.name);
    }
    const response = await fetch(modelConfig.url, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    if (blob.type.includes('text/html') || blob.size < 1000) throw new Error("Invalid model file");
    await cache.put(modelConfig.name, new Response(blob));
    return await blob.arrayBuffer();
  } catch (e) {
    console.error(`Failed to fetch model ${modelConfig.name}:`, e);
    throw e;
  }
};

export const loadManualModels = async (detectorFile: File, recognizerFile: File): Promise<boolean> => {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(MODELS_CONFIG.detector.name, new Response(detectorFile));
    // For manual loads, we overwrite the current active recognizer key
    await cache.put(MODELS_CONFIG.recognizers.MOBILE_FACE_NET.name, new Response(recognizerFile));
    detectionModel = null;
    recognitionModel = null;
    return await initializeFaceModel('MOBILE_FACE_NET');
  } catch (e) {
    return false;
  }
};

export const initializeFaceModel = async (modelType: RecognitionModelType = 'MOBILE_FACE_NET'): Promise<boolean> => {
  if (typeof tflite === 'undefined') return false;

  // Reset if switching models
  if (currentRecognizerType !== modelType) {
    recognitionModel = null;
  }
  
  if (detectionModel && recognitionModel) return true;

  try {
    tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.9/dist/');

    currentRecognizerType = modelType;
    const recognizerConfig = MODELS_CONFIG.recognizers[modelType];
    
    // We start with config defaults, but will update from loaded model properties
    RECOGNIZER_INPUT_SIZE = recognizerConfig.inputSize;

    const [detectorBuffer, recognizerBuffer] = await Promise.all([
      getModelFromCacheOrNetwork(MODELS_CONFIG.detector),
      getModelFromCacheOrNetwork(recognizerConfig)
    ]);

    const options = { numThreads: 2, delegates: ['gpu', 'nnapi'] };
    const createBlobUrl = (buffer: ArrayBuffer) => URL.createObjectURL(new Blob([buffer]));

    if (!detectionModel) {
       detectionModel = await tflite.loadTFLiteModel(createBlobUrl(detectorBuffer), options);
       
       // Dynamic Detector Input Sizing
       if (detectionModel.inputs && detectionModel.inputs[0] && detectionModel.inputs[0].shape) {
           const shape = detectionModel.inputs[0].shape;
           // shape is typically [batch, height, width, channels] e.g. [1, 128, 128, 3]
           // We assume square input
           const size = shape[1] || shape[2];
           if (size && size > 0) {
               DETECTOR_INPUT_SIZE = size;
               console.log(`Detector Input Size set to: ${DETECTOR_INPUT_SIZE}`);
           }
       }
       // Regenerate anchors based on potentially new size
       generateAnchors();
    }
    
    recognitionModel = await tflite.loadTFLiteModel(createBlobUrl(recognizerBuffer), options);
    
    // Dynamic Recognizer Input Sizing
    if (recognitionModel.inputs && recognitionModel.inputs[0] && recognitionModel.inputs[0].shape) {
        const shape = recognitionModel.inputs[0].shape;
        const size = shape[1] || shape[2];
        if (size && size > 0) {
            RECOGNIZER_INPUT_SIZE = size;
            console.log(`Recognizer Input Size set to: ${RECOGNIZER_INPUT_SIZE}`);
        }
    }

    return true;
  } catch (error) {
    console.error("Failed to load AI models:", error);
    return false;
  }
};

// --- Detection Logic ---
const decodeBounds = (boxOutputs: Float32Array, scoreOutputs: Float32Array, width: number, height: number): Detection[] => {
    const detections: Detection[] = [];
    const scoreThreshold = 0.70; 

    for (let i = 0; i < anchors.length; i++) {
        const score = scoreOutputs[i];
        if (score < scoreThreshold) continue;

        const anchor = anchors[i];
        const offset = i * 16;
        
        const dx = boxOutputs[offset + 0];
        const dy = boxOutputs[offset + 1];
        const dw = boxOutputs[offset + 2];
        const dh = boxOutputs[offset + 3];

        const cx = dx / DETECTOR_INPUT_SIZE + anchor[0];
        const cy = dy / DETECTOR_INPUT_SIZE + anchor[1];
        const w = dw / DETECTOR_INPUT_SIZE;
        const h = dh / DETECTOR_INPUT_SIZE;

        const xMin = (cx - w / 2) * width;
        const yMin = (cy - h / 2) * height;
        const finalW = w * width;
        const finalH = h * height;

        const landmarks: Point[] = [];
        for (let j = 0; j < 6; j++) {
            const lx = boxOutputs[offset + 4 + j * 2];
            const ly = boxOutputs[offset + 5 + j * 2];
            landmarks.push({
                x: (lx / DETECTOR_INPUT_SIZE + anchor[0]) * width,
                y: (ly / DETECTOR_INPUT_SIZE + anchor[1]) * height
            });
        }

        detections.push({
            box: { xMin, yMin, width: finalW, height: finalH },
            landmarks,
            score
        });
    }
    return detections;
};

const detectFaces = (imageElement: HTMLImageElement): Detection[] => {
    if (!detectionModel) return [];
    
    return tf.tidy(() => {
        const imgTensor = tf.browser.fromPixels(imageElement);
        // Resize to whatever the model actually expects
        const resized = tf.image.resizeBilinear(imgTensor, [DETECTOR_INPUT_SIZE, DETECTOR_INPUT_SIZE]);
        const normalized = tf.div(tf.sub(resized, 127.5), 127.5);
        const input = tf.expandDims(normalized, 0);

        const prediction = detectionModel.predict(input);
        
        let outputs: any[] = [];
        if (Array.isArray(prediction)) outputs = prediction;
        else if (prediction && typeof prediction === 'object' && prediction.shape) outputs = [prediction];
        else if (prediction && typeof prediction === 'object') outputs = Object.values(prediction);

        let regressors, classificators;
        for (const t of outputs) {
            const shape = t.shape;
            if (shape[shape.length - 1] === 16) regressors = t;
            else if (shape[shape.length - 1] === 1) classificators = t;
        }

        if (!regressors || !classificators) return [];
        
        return decodeBounds(
            regressors.dataSync(), 
            classificators.dataSync(), 
            imageElement.naturalWidth, 
            imageElement.naturalHeight
        );
    });
};

export const getEmbeddingsForImage = (imageElement: HTMLImageElement): FaceAnalysisResult | null => {
  if (!detectionModel || !recognitionModel) return null;

  try {
    const detections = detectFaces(imageElement);
    if (detections.length === 0) return null;
    
    const bestFace = detections.reduce((prev, current) => (prev.score > current.score) ? prev : current);

    const faceSize = Math.min(bestFace.box.width, bestFace.box.height);
    if (faceSize < MIN_FACE_SIZE) return null; 

    const qualityScore = Math.min(1.0, faceSize / 100.0) * bestFace.score;

    // Use current dynamic input size
    let alignedCanvas = alignFace(imageElement, bestFace.landmarks, RECOGNIZER_INPUT_SIZE);
    if (!alignedCanvas) return null;

    if (faceSize < 64) {
        alignedCanvas = sharpenCanvas(alignedCanvas, 0.5);
    }

    let inputTensor = tf.tidy(() => {
        const tensor = tf.browser.fromPixels(alignedCanvas);
        
        // Resize to whatever the model actually expects
        const resized = tf.image.resizeBilinear(tensor, [RECOGNIZER_INPUT_SIZE, RECOGNIZER_INPUT_SIZE]);
        const sub = tf.sub(resized, 127.5);
        const div = tf.div(sub, 128.0);
        return tf.expandDims(div, 0);
    });

    let batchSize = 1;
    if (recognitionModel.inputs && recognitionModel.inputs[0]?.shape) {
        const shape = recognitionModel.inputs[0].shape;
        if (shape[0] > 1) {
            const oldTensor = inputTensor;
            inputTensor = tf.tidy(() => tf.tile(oldTensor, [shape[0], 1, 1, 1]));
            oldTensor.dispose();
            batchSize = shape[0];
        }
    }

    const result = recognitionModel.predict(inputTensor);
    
    let outputTensor;
    if (result.shape) outputTensor = result;
    else if (Array.isArray(result)) outputTensor = result[0];
    else outputTensor = Object.values(result)[0];
    
    const embedding = tf.tidy(() => {
        let raw = outputTensor;
        if (batchSize > 1) raw = tf.slice(raw, [0, 0], [1, -1]);
        raw = tf.squeeze(raw);
        return tf.div(raw, tf.norm(raw));
    });
    
    const data = embedding.dataSync();

    inputTensor.dispose();
    if (outputTensor) outputTensor.dispose();
    embedding.dispose();

    return {
        embeddings: [new Float32Array(data)],
        qualityScore,
        faceBox: { width: bestFace.box.width, height: bestFace.box.height }
    };

  } catch (e) {
      console.error("Pipeline Error:", e);
      return null;
  }
};

export const calculateCosineSimilarity = (u: Float32Array, v: Float32Array): number => {
  if (u.length !== v.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < u.length; i++) {
    dotProduct += u[i] * v[i];
  }
  return dotProduct;
};

export const matchFace = (candidateEmbeddings: Float32Array[], targetEmbeddings: Float32Array[]): number => {
  let maxSimilarity = -1;
  for (const candidate of candidateEmbeddings) {
    for (const target of targetEmbeddings) {
      // Dimension check is crucial when switching models
      if (candidate.length !== target.length) continue;
      
      const sim = calculateCosineSimilarity(candidate, target);
      if (sim > maxSimilarity) maxSimilarity = sim;
    }
  }
  return maxSimilarity;
};

export const MODELS = MODELS_CONFIG; // Backward compatibility alias
