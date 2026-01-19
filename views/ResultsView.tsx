
import React, { useState } from 'react';
import { Photo, TargetPhoto, ProcessingStats } from '../types';
import { PhotoGrid } from '../components/PhotoGrid';
import { ProcessingOverlay } from '../components/ProcessingOverlay';
import { ArrowLeft, Home, Trash2, Info } from 'lucide-react';

interface ResultsViewProps {
  galleryPhotos: Photo[];
  targetPhotos: TargetPhoto[];
  stats: ProcessingStats;
  isScanning: boolean;
  onStopScan: () => void;
  onViewPhoto: (photo: Photo) => void;
  onBack: () => void;
  onHome: () => void;
  onUpdateGallery: (photos: Photo[]) => void;
  onOpenSettings: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  galleryPhotos,
  targetPhotos,
  stats,
  isScanning,
  onStopScan,
  onViewPhoto,
  onBack,
  onHome,
  onUpdateGallery,
  onOpenSettings
}) => {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const matchCount = galleryPhotos.filter(p => p.hasMatch).length;

  const handleHideSelected = () => {
    onUpdateGallery(galleryPhotos.filter(p => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-dark relative">
      {/* Header Bar */}
      <div className="px-4 py-3 glass-panel border-b border-white/5 sticky top-0 z-30 flex items-center justify-between backdrop-blur-xl">
        {isSelectionMode ? (
          <div className="flex items-center justify-between w-full animate-fade-in">
            <span className="text-sm font-semibold text-white pl-1">{selectedIds.size} Selected</span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsSelectionMode(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleHideSelected}
                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 bg-red-500/10 rounded-lg flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hide
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Back Button & Title Area */}
            <div className="flex items-center gap-2 overflow-hidden">
              <button 
                onClick={onBack}
                className="p-2 -ml-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-2">
                 <div className="flex -space-x-2">
                  {targetPhotos.slice(0, 3).map((photo, i) => (
                    <div key={i} className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-900 bg-slate-800">
                      <img src={photo.url} className="w-full h-full object-cover" alt="" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col">
                  <h1 className="font-bold text-white text-sm leading-none">Results</h1>
                  <p className="text-[10px] text-slate-400 leading-none mt-1">{matchCount} Matches</p>
                </div>
              </div>
            </div>

            {/* Top Right Home/Reset Button */}
            <button 
              onClick={onHome}
              className="p-2.5 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors border border-white/5 shadow-sm active:scale-95"
              title="Start Over"
            >
              <Home className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-safe-area custom-scrollbar">
        <PhotoGrid 
          photos={galleryPhotos.filter(p => p.hasMatch)} 
          onView={onViewPhoto}
          isSelectionMode={isSelectionMode}
          setSelectionMode={setIsSelectionMode}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />
      </div>
      
      {/* Empty State Helper */}
      {matchCount === 0 && !isScanning && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
           <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 text-center max-w-xs pointer-events-auto">
             <Info className="w-8 h-8 text-slate-500 mx-auto mb-3" />
             <p className="text-slate-300 font-medium mb-1">No matches found</p>
             <p className="text-slate-500 text-xs">Try adjusting the threshold in settings or using different target photos.</p>
             <div className="flex gap-2 mt-4 justify-center">
               <button onClick={onOpenSettings} className="text-xs text-white bg-slate-700 px-4 py-2 rounded-full hover:bg-slate-600">
                 Settings
               </button>
               <button onClick={onBack} className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-4 py-2 bg-blue-500/10 rounded-full">
                 Try New Gallery
               </button>
             </div>
           </div>
        </div>
      )}

      <ProcessingOverlay stats={stats} isScanning={isScanning} onCancel={onStopScan} />
    </div>
  );
};
