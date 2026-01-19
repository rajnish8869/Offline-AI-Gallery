import React, { useMemo, useRef } from 'react';
import { Photo } from '../types';
import { Check, Calendar, ImageIcon } from 'lucide-react';

interface PhotoGridProps {
  photos: Photo[];
  onView: (photo: Photo) => void;
  isSelectionMode: boolean;
  setSelectionMode: (active: boolean) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ 
  photos, 
  onView,
  isSelectionMode,
  setSelectionMode,
  selectedIds,
  setSelectedIds
}) => {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groupedPhotos = useMemo(() => {
    // Sort by score descending
    const sorted = [...photos].sort((a, b) => b.similarityScore - a.similarityScore);
    
    // Grouping logic based on confidence tiers
    const groups: { [key: string]: Photo[] } = {};
    
    sorted.forEach(photo => {
      let key = 'Low Confidence';
      if (photo.similarityScore >= 0.80) key = 'High Confidence';
      else if (photo.similarityScore >= 0.65) key = 'Probable Match';
      else key = 'Possible Match'; // For lower thresholds
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(photo);
    });

    const tierOrder = ['High Confidence', 'Probable Match', 'Possible Match', 'Low Confidence'];
    return tierOrder
      .filter(key => groups[key] && groups[key].length > 0)
      .map(key => ({ title: key, items: groups[key] }));
  }, [photos]);

  const handleTouchStart = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      if (!isSelectionMode) {
        setSelectionMode(true);
        if (navigator.vibrate) navigator.vibrate(50);
        toggleSelection(id);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
      if (newSet.size === 0 && isSelectionMode) setSelectionMode(false);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handlePhotoClick = (photo: Photo) => {
    if (isSelectionMode) {
      toggleSelection(photo.id);
    } else {
      onView(photo);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
        <ImageIcon className="w-16 h-16 mb-4 stroke-1" />
        <p className="text-lg font-medium">No matches found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-slide-up">
      {groupedPhotos.map((group) => (
        <div key={group.title} className="space-y-3">
          {/* Group Header */}
          <div className="sticky top-0 z-10 glass-panel border-b border-slate-700/50 -mx-4 px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                group.title.includes('High') ? 'bg-green-500' : 
                group.title.includes('Probable') ? 'bg-blue-500' : 'bg-yellow-500'
              }`} />
              <span className="text-sm font-semibold text-slate-200 tracking-wide">{group.title}</span>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
              {group.items.length}
            </span>
          </div>
          
          {/* Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-3">
            {group.items.map((photo) => {
              const isSelected = selectedIds.has(photo.id);
              return (
                <div 
                  key={photo.id}
                  className={`
                    relative aspect-square group rounded-xl overflow-hidden cursor-pointer transition-all duration-300
                    ${isSelected ? 'ring-4 ring-blue-500 z-10 scale-95 shadow-xl' : 'hover:ring-2 hover:ring-white/20 hover:scale-[1.02]'}
                  `}
                  onTouchStart={() => handleTouchStart(photo.id)}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => handlePhotoClick(photo)}
                >
                  <img 
                    src={photo.url} 
                    alt="Match" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Selection Indicator */}
                  <div className={`
                    absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
                    ${isSelected ? 'bg-blue-500 border-blue-500 scale-100' : 'bg-black/30 border-white/70 scale-0 group-hover:scale-100'}
                    ${isSelectionMode && !isSelected ? 'scale-100' : ''}
                  `}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>

                  {/* Gradient Overlay for Score */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
                    <span className="text-[10px] font-bold text-white/90 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                      {(photo.similarityScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};