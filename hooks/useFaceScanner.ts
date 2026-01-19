
import { useState, useRef, useCallback } from 'react';
import { Photo, ProcessingStats, TargetPhoto, AppSettings } from '../types';
import { getEmbeddingsForImage, matchFace } from '../services/faceService';
import { createImageElement } from '../utils/imageUtils';

export const useFaceScanner = (
  settings: AppSettings, 
  targetPhotos: TargetPhoto[]
) => {
  const [galleryPhotos, setGalleryPhotos] = useState<Photo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [stats, setStats] = useState<ProcessingStats>({
    total: 0, processed: 0, matchesFound: 0, currentFile: '', startTime: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const startScanning = useCallback(async (photosToScan: Photo[]) => {
    if (targetPhotos.length === 0) return;

    setIsScanning(true);
    setGalleryPhotos(photosToScan);
    
    const allTargetEmbeddings = targetPhotos.flatMap(p => p.embeddings);
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    let processed = 0, matches = 0;
    setStats({ total: photosToScan.length, processed: 0, matchesFound: 0, currentFile: '', startTime: Date.now() });

    for (let i = 0; i < photosToScan.length; i++) {
      if (signal.aborted) break;
      
      const photo = photosToScan[i];
      setStats(s => ({ ...s, processed, matchesFound: matches, currentFile: photo.file.name }));

      try {
        if (settings.processDelay > 0) {
            await new Promise(r => setTimeout(r, settings.processDelay));
        } else {
            await new Promise(r => setTimeout(r, 0));
        }
        
        const img = await createImageElement(photo.url);
        const result = getEmbeddingsForImage(img);
        
        let isMatch = false;
        let bestMatch = 0;

        if (result && result.embeddings) {
            bestMatch = matchFace(result.embeddings, allTargetEmbeddings);
            
            // Adaptive Threshold Logic
            // If image quality/size is low, increase threshold to avoid false positives
            let dynamicThreshold = settings.threshold;
            
            if (result.qualityScore < 0.6) {
                // Low quality face (small or low confidence) -> Be Stricter
                dynamicThreshold += 0.05;
            } else if (result.qualityScore > 0.9) {
                // High quality face -> Can be slightly more lenient
                dynamicThreshold -= 0.02;
            }

            // Clamp threshold
            dynamicThreshold = Math.min(0.95, Math.max(0.4, dynamicThreshold));

            isMatch = bestMatch >= dynamicThreshold;
        }

        if (isMatch) matches++;
        processed++;

        setGalleryPhotos(prev => {
          const next = [...prev];
          next[i] = { 
              ...photo, 
              processed: true, 
              hasMatch: isMatch, 
              similarityScore: bestMatch,
              qualityScore: result?.qualityScore || 0
          };
          return next;
        });
      } catch (e) { 
          console.error(`Error processing ${photo.file.name}`, e); 
      }
    }

    setIsScanning(false);
  }, [targetPhotos, settings]);

  const stopScanning = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsScanning(false);
  }, []);

  const resetGallery = useCallback(() => {
    stopScanning();
    setGalleryPhotos([]);
    setStats({ total: 0, processed: 0, matchesFound: 0, currentFile: '', startTime: 0 });
  }, [stopScanning]);

  return {
    galleryPhotos,
    setGalleryPhotos,
    isScanning,
    stats,
    startScanning,
    stopScanning,
    resetGallery
  };
};
