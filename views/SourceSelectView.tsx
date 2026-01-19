
import React from 'react';
import { Settings, FolderSearch, ShieldCheck, FolderOpen, FileImage, X } from 'lucide-react';
import { Photo } from '../types';

interface SourceSelectViewProps {
  onScanStart: (photos: Photo[]) => void;
  onOpenSettings: () => void;
  onBack: () => void;
}

export const SourceSelectView: React.FC<SourceSelectViewProps> = ({ 
  onScanStart, 
  onOpenSettings, 
  onBack 
}) => {
  
  const handleGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const files = (Array.from(e.target.files) as File[]).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) {
      alert("No image files found.");
      return;
    }

    const initialPhotos: Photo[] = files.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(f),
      file: f,
      processed: false,
      hasMatch: false,
      similarityScore: 0
    }));

    onScanStart(initialPhotos);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-6 animate-fade-in pb-24 relative overflow-y-auto custom-scrollbar h-full">
      <button 
        onClick={onOpenSettings}
        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-all"
      >
        <Settings className="w-5 h-5" />
      </button>

      <div className="mb-8 w-20 h-20 glass-panel rounded-full flex items-center justify-center border border-white/10 shadow-2xl mt-8">
        <FolderSearch className="w-10 h-10 text-emerald-400" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 text-center">Source Gallery</h2>
      <p className="text-slate-400 text-center mb-10 text-sm max-w-xs">
        Select a folder or a set of photos to scan. <br/>
        <span className="text-slate-500 text-xs mt-1 block flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Processed locally on device
        </span>
      </p>

      <div className="w-full space-y-4">
        {/* Desktop: Folder Select */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
          <button 
            onClick={() => document.getElementById('folderInput')?.click()}
            className="relative w-full glass-panel hover:bg-white/10 p-6 rounded-xl flex items-center gap-4 transition-all border border-blue-500/30 group-hover:scale-[1.01]"
          >
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <FolderOpen className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-white">Select Folder</div>
              <div className="text-xs text-slate-400">Best for Desktop</div>
            </div>
          </button>
          <input 
            id="folderInput" type="file" multiple 
            // @ts-ignore
            webkitdirectory="" directory=""
            className="hidden" onChange={handleGallerySelect}
          />
        </div>

        {/* Mobile: File Select */}
        <button 
          onClick={() => document.getElementById('fileInput')?.click()}
          className="w-full bg-slate-800 hover:bg-slate-700 p-6 rounded-xl flex items-center gap-4 transition-all border border-slate-700"
        >
          <div className="bg-emerald-500/20 p-3 rounded-lg">
            <FileImage className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-white">Select Photos</div>
            <div className="text-xs text-slate-400">Best for Mobile</div>
          </div>
        </button>
        <input 
          id="fileInput" type="file" multiple accept="image/*"
          className="hidden" onChange={handleGallerySelect}
        />
      </div>

      <button 
        onClick={onBack}
        className="mt-auto pt-8 text-slate-500 hover:text-white text-sm font-medium flex items-center gap-2 transition-colors"
      >
        <X className="w-4 h-4" />
        Change Target
      </button>
    </div>
  );
};
