import React from 'react';
import { TargetPhoto } from '../types';
import { X } from 'lucide-react';

interface TargetPhotoListProps {
  photos: TargetPhoto[];
  onRemove: (id: string) => void;
}

export const TargetPhotoList: React.FC<TargetPhotoListProps> = ({ photos, onRemove }) => {
  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-4 gap-3 w-full mt-2 animate-slide-up">
      {photos.map((photo) => (
        <div key={photo.id} className="relative group aspect-square">
          <div className="w-full h-full rounded-xl overflow-hidden border border-white/10 shadow-lg bg-slate-800">
            <img 
              src={photo.url} 
              alt="Target Face" 
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
            />
          </div>
          <button
            onClick={() => onRemove(photo.id)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-200 hover:bg-red-600 border border-white/20"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};