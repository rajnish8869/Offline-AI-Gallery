import React from 'react';
import { ProcessingStats } from '../types';
import { Loader2, XCircle } from 'lucide-react';

interface ProcessingOverlayProps {
  stats: ProcessingStats;
  isScanning: boolean;
  onCancel: () => void;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ stats, isScanning, onCancel }) => {
  if (!isScanning) return null;

  const percentage = stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full animate-pulse"></div>
          <div className="relative bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow-2xl">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2">Finding Matches...</h3>
        <p className="text-slate-400 text-sm mb-8 text-center px-4 truncate max-w-full">
          Scanning {stats.currentFile}
        </p>
        
        {/* Progress Bar */}
        <div className="w-full space-y-3 mb-8">
          <div className="flex justify-between text-xs font-medium uppercase tracking-wider text-slate-500">
            <span>Progress</span>
            <span>{percentage}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full mb-8">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">{stats.processed}</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Scanned</div>
          </div>
          <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-blue-400">{stats.matchesFound}</div>
            <div className="text-[10px] uppercase tracking-widest text-blue-300 mt-1">Found</div>
          </div>
        </div>

        <button 
          onClick={onCancel}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-white/5"
        >
          <XCircle className="w-5 h-5" />
          <span>Stop Scanning</span>
        </button>
      </div>
    </div>
  );
};