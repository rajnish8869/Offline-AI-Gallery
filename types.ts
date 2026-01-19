
export interface Photo {
  id: string;
  url: string;
  file: File;
  processed: boolean;
  hasMatch: boolean;
  similarityScore: number;
  qualityScore?: number; // Added for quality filtering
  date?: Date;
}

export interface TargetPhoto {
  id: string;
  url: string;
  embeddings: Float32Array[];
}

// New interface for rich results from the service
export interface FaceAnalysisResult {
  embeddings: Float32Array[];
  qualityScore: number; // 0-1
  faceBox?: { width: number, height: number };
}

export interface FaceEmbeddingResult {
  embeddings: Float32Array[];
  photoId: string;
}

export enum AppStep {
  HOME = 'HOME',
  SETUP_TARGET = 'SETUP_TARGET',
  SCAN_GALLERY = 'SCAN_GALLERY',
  RESULTS = 'RESULTS',
  SETTINGS = 'SETTINGS',
}

export type RecognitionModelType = 'MOBILE_FACE_NET' | 'FACENET';

export interface AppSettings {
  threshold: number;
  processDelay: number;
  highPerformance: boolean;
  recognitionModel: RecognitionModelType;
}

export interface ProcessingStats {
  total: number;
  processed: number;
  matchesFound: number;
  currentFile: string;
  startTime: number;
}
