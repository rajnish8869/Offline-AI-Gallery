
/**
 * Reads a File object and returns a Data URL string.
 */
export const readFile = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => resolve(e.target?.result as string);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

/**
 * Creates an HTMLImageElement from a source string.
 */
export const createImageElement = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

/**
 * Applies a convolution kernel to sharpen the image.
 * Useful for small faces before recognition.
 */
export const sharpenCanvas = (canvas: HTMLCanvasElement, amount: number = 0.5): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  
  // Create a temporary canvas for the operation
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return canvas;

  tempCtx.drawImage(canvas, 0, 0);
  
  const imgData = tempCtx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const copyData = new Uint8ClampedArray(data);

  // Simple unsharp mask kernel approx
  // Weights: Center 5, Neighbors -1
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  const side = Math.round(Math.sqrt(kernel.length));
  const halfSide = Math.floor(side / 2);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;
      
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = y + cy - halfSide;
          const scx = x + cx - halfSide;
          
          if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
            const srcOff = (scy * w + scx) * 4;
            const wt = kernel[cy * side + cx];
            r += copyData[srcOff] * wt;
            g += copyData[srcOff + 1] * wt;
            b += copyData[srcOff + 2] * wt;
          }
        }
      }
      
      const dstOff = (y * w + x) * 4;
      // Mix original with sharpened based on amount
      data[dstOff] = Math.min(255, Math.max(0, data[dstOff] * (1 - amount) + r * amount));
      data[dstOff + 1] = Math.min(255, Math.max(0, data[dstOff + 1] * (1 - amount) + g * amount));
      data[dstOff + 2] = Math.min(255, Math.max(0, data[dstOff + 2] * (1 - amount) + b * amount));
    }
  }

  tempCtx.putImageData(imgData, 0, 0);
  return tempCanvas;
};

/**
 * Extracts a cropped canvas of the face from the original image.
 */
export const extractFaceCrop = (image: HTMLImageElement, box: any): HTMLCanvasElement | null => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if(!ctx) return null;

  const padding = 0.25; // Increased context
  const width = box.width;
  const height = box.height;
  
  const centerX = box.originX + (width / 2);
  const centerY = box.originY + (height / 2);

  const paddedWidth = width * (1 + padding);
  const paddedHeight = height * (1 + padding);
  
  const x = Math.max(0, centerX - (paddedWidth / 2));
  const y = Math.max(0, centerY - (paddedHeight / 2));
  
  const finalWidth = Math.min(image.naturalWidth - x, paddedWidth);
  const finalHeight = Math.min(image.naturalHeight - y, paddedHeight);

  canvas.width = 224;
  canvas.height = 224;

  ctx.drawImage(image, x, y, finalWidth, finalHeight, 0, 0, 224, 224);
  return canvas;
};

/**
 * Aligns a face based on eye landmarks.
 * Rotates and scales to standard ArcFace 112x112 layout.
 */
export const alignFace = (
  image: HTMLImageElement, 
  landmarks: { x: number, y: number }[],
  targetSize: number = 112
): HTMLCanvasElement | null => {
  if (!landmarks || landmarks.length < 2) return null;

  const leftEye = landmarks[0];
  const rightEye = landmarks[1];

  const dy = rightEye.y - leftEye.y;
  const dx = rightEye.x - leftEye.x;
  const angle = Math.atan2(dy, dx);
  
  // Calculate center between eyes in source
  const eyesCenterX = (leftEye.x + rightEye.x) / 2;
  const eyesCenterY = (leftEye.y + rightEye.y) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // ArcFace standard: Eyes are at ~35-40% from top
  const targetEyeCenterY = targetSize * 0.38; 
  const targetEyeCenterX = targetSize * 0.5;

  // Distance between eyes in source
  const distSource = Math.sqrt(dx*dx + dy*dy);
  // Standard distance between eyes in 112x112 aligned face is approx 35-40px
  const distTarget = 40; 
  
  const scale = distSource > 0 ? distTarget / distSource : 1;

  ctx.translate(targetEyeCenterX, targetEyeCenterY);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.translate(-eyesCenterX, -eyesCenterY);

  // Use high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(image, 0, 0);

  return canvas;
};
