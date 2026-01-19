import React, { useState } from 'react';
import { Photo } from '../types';
import { X, ZoomIn, ZoomOut, Download, ExternalLink } from 'lucide-react';

interface ImageViewerProps {
  photo: Photo;
  onClose: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ photo, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 4));
  const handleZoomOut = () => {
    setScale(s => {
      const newScale = Math.max(s - 0.5, 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-fade-in backdrop-blur-md">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
            photo.similarityScore > 0.8 
              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
          }`}>
            {(photo.similarityScore * 100).toFixed(0)}% Match
          </div>
          <span className="text-white/60 text-xs font-mono hidden sm:inline">{photo.file.name}</span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image Area */}
      <div 
        className="flex-1 overflow-hidden flex items-center justify-center cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img 
          src={photo.url} 
          alt="Result" 
          className="max-w-full max-h-full object-contain transition-transform duration-100 ease-out"
          style={{ 
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: scale > 1 ? 'grab' : 'default'
          }}
          draggable={false}
        />
      </div>

      {/* Footer Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent z-50">
        <button onClick={handleZoomOut} className="p-3 bg-slate-800/80 rounded-full text-white hover:bg-slate-700 backdrop-blur-sm border border-white/10">
          <ZoomOut className="w-5 h-5" />
        </button>
        <button onClick={handleZoomIn} className="p-3 bg-slate-800/80 rounded-full text-white hover:bg-slate-700 backdrop-blur-sm border border-white/10">
          <ZoomIn className="w-5 h-5" />
        </button>
        <a 
          href={photo.url} 
          download={`match_${photo.id}.jpg`}
          className="p-3 bg-blue-600/80 rounded-full text-white hover:bg-blue-500 backdrop-blur-sm border border-blue-400/30 flex items-center gap-2 px-6"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="w-5 h-5" />
          <span className="text-sm font-medium">Save</span>
        </a>
      </div>
    </div>
  );
};