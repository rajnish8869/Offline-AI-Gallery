
import React, { useState } from 'react';
import { TargetPhoto, AppSettings, AppStep } from '../types';
import { Button } from '../components/Button';
import { TargetPhotoList } from '../components/TargetPhotoList';
import { Settings, ScanFace, ImagePlus, ChevronRight } from 'lucide-react';
import { readFile, createImageElement } from '../utils/imageUtils';
import { getEmbeddingsForImage } from '../services/faceService';

interface SetupViewProps {
  modelReady: boolean;
  targetPhotos: TargetPhoto[];
  setTargetPhotos: React.Dispatch<React.SetStateAction<TargetPhoto[]>>;
  settings: AppSettings;
  onNext: () => void;
  onOpenSettings: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({
  modelReady,
  targetPhotos,
  setTargetPhotos,
  settings,
  onNext,
  onOpenSettings
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingTarget, setIsProcessingTarget] = useState(false);

  const processTargetFiles = async (files: File[]) => {
    if (!modelReady) {
      alert("Please wait for AI models to initialize.");
      return;
    }

    setIsProcessingTarget(true);
    const newTargets: TargetPhoto[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const url = await readFile(file);
        const img = await createImageElement(url);
        const result = getEmbeddingsForImage(img);
        
        if (result && result.embeddings.length > 0) {
          // Optional: Check quality of target photo
          if (result.qualityScore < 0.4) {
             console.warn("Low quality target face detected");
             // Could alert user here
          }
          newTargets.push({ 
              id: Math.random().toString(36).substr(2, 9), 
              url, 
              embeddings: result.embeddings 
          });
        }
      } catch (err) { console.error(err); }
    }

    if (newTargets.length > 0) {
      setTargetPhotos(prev => [...prev, ...newTargets]);
    } else if (files.length > 0) {
       alert("No faces detected. Please try clearer images with better lighting.");
    }
    setIsProcessingTarget(false);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-6 animate-fade-in pb-24 relative overflow-y-auto custom-scrollbar h-full">
      <button 
        onClick={onOpenSettings}
        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-all"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      <div className="mb-8 relative group mt-8">
        <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
        <div className="relative w-24 h-24 glass-panel rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl">
          <ScanFace className="w-12 h-12 text-blue-400" />
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${modelReady ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
        </div>
      </div>

      <div className="text-center mb-10 space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Who are we looking for?</h1>
        <p className="text-slate-400 text-sm">Upload one or more photos of the target face.</p>
      </div>

      <div 
        className={`w-full aspect-video rounded-2xl border-2 border-dashed transition-all duration-300 relative overflow-hidden group mb-6
          ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' : 'border-slate-700 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault(); setIsDragging(false);
          if(e.dataTransfer.files?.length) processTargetFiles(Array.from(e.dataTransfer.files) as File[]);
        }}
      >
        <input 
          type="file" multiple accept="image/*" 
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
          onChange={(e) => e.target.files && processTargetFiles(Array.from(e.target.files) as File[])}
          disabled={!modelReady || isProcessingTarget}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {isProcessingTarget ? (
            <div className="flex flex-col items-center gap-3">
              <ScanFace className="w-8 h-8 text-blue-400 animate-spin-slow" />
              <span className="text-xs font-medium text-blue-300">Analyzing faces...</span>
            </div>
          ) : (
            <>
              <div className="p-3 bg-slate-800 rounded-full mb-3 shadow-lg group-hover:scale-110 transition-transform">
                <ImagePlus className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-slate-300">Tap to Upload</span>
              <span className="text-xs text-slate-500 mt-1">or drag & drop</span>
            </>
          )}
        </div>
      </div>

      <TargetPhotoList photos={targetPhotos} onRemove={(id) => setTargetPhotos(prev => prev.filter(p => p.id !== id))} />

      <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-white/5">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        <span className="text-xs text-slate-400">Match Sensitivity: <span className="text-blue-300 font-semibold">{(settings.threshold * 100).toFixed(0)}%</span></span>
      </div>

      <div className="mt-auto w-full pt-8">
        <Button 
          onClick={onNext} 
          disabled={targetPhotos.length === 0}
          className="w-full"
          icon={<ChevronRight className="w-5 h-5" />}
          variant="primary"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
};
