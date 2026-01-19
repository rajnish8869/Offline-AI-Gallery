
import React, { useState } from 'react';
import { AppSettings, RecognitionModelType } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { ArrowLeft, BrainCircuit, Zap, RefreshCw, Info, Shield, Trash2, Sliders, Box } from 'lucide-react';

interface SettingsPageProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onBack: () => void;
  onResetData: () => void;
}

type ConfirmAction = 
  | { type: 'CHANGE_MODEL'; payload: RecognitionModelType }
  | { type: 'RESET_DATA' }
  | null;

export const SettingsPage: React.FC<SettingsPageProps> = ({ 
  settings, 
  onUpdateSettings, 
  onBack,
  onResetData
}) => {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, threshold: parseFloat(e.target.value) });
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value as RecognitionModelType;
    if (newModel !== settings.recognitionModel) {
        setConfirmAction({ type: 'CHANGE_MODEL', payload: newModel });
    }
  };

  const handleResetClick = () => {
    setConfirmAction({ type: 'RESET_DATA' });
  };

  const executeConfirmation = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'CHANGE_MODEL') {
        onUpdateSettings({ ...settings, recognitionModel: confirmAction.payload });
        onResetData();
    } else if (confirmAction.type === 'RESET_DATA') {
        onResetData();
    }
    setConfirmAction(null);
  };

  const getThresholdLabel = (val: number) => {
    if (val >= 0.85) return 'Very Strict (Few Matches)';
    if (val >= 0.75) return 'Strict (High Accuracy)';
    if (val >= 0.60) return 'Balanced (Recommended)';
    if (val >= 0.50) return 'Loose (More Matches)';
    return 'Experimental (Many False Positives)';
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 animate-fade-in pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors group"
        >
          <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm">Configure AI behavior and app preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section: Recognition Intelligence */}
        <section className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BrainCircuit className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-200">Recognition Intelligence</h2>
          </div>

          <div className="space-y-6">
            
            {/* Model Selection */}
            <div>
               <div className="flex items-center gap-2 mb-2">
                 <Box className="w-4 h-4 text-purple-400" />
                 <label className="text-sm font-medium text-slate-300">AI Model Architecture</label>
               </div>
               <select 
                  value={settings.recognitionModel}
                  onChange={handleModelChange}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3"
                >
                  <option value="MOBILE_FACE_NET">MobileFaceNet (Default) - Balanced</option>
                  <option value="FACENET">FaceNet (Google) - High Accuracy</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  FaceNet is larger and more accurate but may be slower on older devices.
                </p>
            </div>

            <div className="border-t border-white/5 pt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-300">Similarity Threshold</label>
                <span className="text-xs font-bold bg-blue-500/10 text-blue-400 px-2 py-1 rounded">
                  {(settings.threshold * 100).toFixed(0)}%
                </span>
              </div>
              <input 
                type="range" 
                min="0.40" 
                max="0.95" 
                step="0.01" 
                value={settings.threshold}
                onChange={handleThresholdChange}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-slate-500">More Results</span>
                <span className="text-xs text-blue-300 font-medium">{getThresholdLabel(settings.threshold)}</span>
                <span className="text-xs text-slate-500">Higher Accuracy</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Performance */}
        <section className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-200">Performance & UI</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">Processing Speed</div>
                <div className="text-xs text-slate-500 mt-0.5">Add delay to keep UI responsive on older devices</div>
              </div>
              <select 
                value={settings.processDelay}
                onChange={(e) => onUpdateSettings({ ...settings, processDelay: parseInt(e.target.value) })}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              >
                <option value={0}>Maximum Speed</option>
                <option value={10}>Balanced (10ms)</option>
                <option value={50}>Responsive (50ms)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section: Data & Privacy */}
        <section className="glass-panel rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-200">Data & Privacy</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl border border-white/5">
              <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-slate-300">Offline Processing</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  All face recognition happens directly on your device using WebAssembly. 
                  No photos or face data are ever uploaded to any server.
                </p>
              </div>
            </div>

            <button 
              onClick={handleResetClick}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">Clear All App Data</span>
            </button>
          </div>
        </section>

        <div className="text-center pt-8">
           <p className="text-xs text-slate-600">Offline AI Gallery v1.3.0 • Powered by MediaPipe</p>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal 
        isOpen={confirmAction?.type === 'RESET_DATA'}
        title="Clear All Data?"
        message="This will remove all target faces and clear search results. This action cannot be undone."
        confirmLabel="Yes, Clear Data"
        variant="danger"
        onConfirm={executeConfirmation}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmModal 
        isOpen={confirmAction?.type === 'CHANGE_MODEL'}
        title="Change AI Model?"
        message="Changing the AI model architecture requires re-analyzing face embeddings. Your current target faces and matches will be reset."
        confirmLabel="Switch Model & Reset"
        variant="warning"
        onConfirm={executeConfirmation}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};
