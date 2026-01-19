
import React, { useState, useEffect } from 'react';
import { AppStep, Photo, TargetPhoto, AppSettings } from './types';
import { initializeFaceModel, loadManualModels, MODELS } from './services/faceService';
import { Layout } from './components/Layout';
import { ImageViewer } from './components/ImageViewer';
import { SettingsPage } from './components/SettingsPage';
import { SetupView } from './views/SetupView';
import { SourceSelectView } from './views/SourceSelectView';
import { ResultsView } from './views/ResultsView';
import { useFaceScanner } from './hooks/useFaceScanner';
import { Download, Cpu, Upload, AlertCircle, FileCheck } from 'lucide-react';

const App: React.FC = () => {
  // --- Global State ---
  const [step, setStep] = useState<AppStep>(AppStep.SETUP_TARGET);
  const [modelReady, setModelReady] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [targetPhotos, setTargetPhotos] = useState<TargetPhoto[]>([]);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  
  // Manual Upload State
  const [detectorFile, setDetectorFile] = useState<File | null>(null);
  const [recognizerFile, setRecognizerFile] = useState<File | null>(null);
  const [isManualLoading, setIsManualLoading] = useState(false);

  const [appSettings, setAppSettings] = useState<AppSettings>({
    threshold: 0.60,
    processDelay: 0,
    highPerformance: true,
    recognitionModel: 'MOBILE_FACE_NET'
  });

  // --- Logic Hooks ---
  const { 
    galleryPhotos, setGalleryPhotos, isScanning, stats, 
    startScanning, stopScanning, resetGallery 
  } = useFaceScanner(appSettings, targetPhotos);

  // --- Effects ---
  useEffect(() => {
    // Reload model when the setting changes
    const loadModels = async () => {
        setModelReady(false);
        try {
            const success = await initializeFaceModel(appSettings.recognitionModel);
            if (success) {
                setModelReady(true);
                setLoadingError(null);
            } else {
                setLoadingError("Automatic download failed.");
            }
        } catch (e) {
            setLoadingError("Network error or CORS issue.");
        }
    };
    loadModels();
  }, [appSettings.recognitionModel]);

  // --- Manual Upload Handler ---
  const handleManualUpload = async () => {
    if (!detectorFile || !recognizerFile) return;
    
    setIsManualLoading(true);
    const success = await loadManualModels(detectorFile, recognizerFile);
    setIsManualLoading(false);
    
    if (success) {
        setModelReady(true);
        setLoadingError(null);
    } else {
        alert("Failed to load the uploaded models. Please ensure they are valid .tflite files.");
    }
  };

  // --- Navigation Handlers ---
  const goToResults = (photos: Photo[]) => {
    setStep(AppStep.RESULTS);
    startScanning(photos);
  };

  const handleBackFromResults = () => {
    stopScanning();
    resetGallery();
    setStep(AppStep.SCAN_GALLERY);
  };

  const handleFullReset = () => {
    stopScanning();
    resetGallery();
    setTargetPhotos([]);
    setStep(AppStep.SETUP_TARGET);
  };

  const handleResetData = () => {
    handleFullReset();
  };

  if (!modelReady) {
      return (
          <Layout>
            <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in overflow-y-auto">
                <div className="relative mb-6 flex-shrink-0">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
                    <div className="relative bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl">
                        <Cpu className={`w-12 h-12 ${loadingError ? 'text-red-400' : 'text-blue-400 animate-pulse'}`} />
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">Initializing AI Core</h2>
                <div className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-400 mb-2">
                  Model: {appSettings.recognitionModel.replace(/_/g, ' ')}
                </div>
                
                {/* Status Message */}
                <p className="text-slate-400 max-w-xs mx-auto mb-6 text-sm leading-relaxed">
                    {loadingError ? (
                        <span className="text-red-400 flex items-center justify-center gap-2">
                           <AlertCircle className="w-4 h-4" />
                           {loadingError}
                        </span>
                    ) : (
                        "Downloading and optimizing Neural Networks for offline use..."
                    )}
                </p>

                {/* Manual Upload Fallback UI */}
                {loadingError && (
                    <div className="w-full max-w-md bg-slate-800/50 p-6 rounded-xl border border-white/5 backdrop-blur-sm animate-slide-up">
                        <h3 className="text-white font-semibold mb-4 text-left">Manual Setup</h3>
                        <p className="text-xs text-slate-400 text-left mb-4">
                            If automatic download fails, please download the models manually and upload them below.
                        </p>

                        {/* Step 1: Download */}
                        <div className="space-y-3 mb-6">
                            <a 
                                href={MODELS.detector.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors group"
                            >
                                <div className="text-left">
                                    <div className="text-xs font-bold text-slate-300 group-hover:text-white">1. Download Detector</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{MODELS.detector.name}</div>
                                </div>
                                <Download className="w-4 h-4 text-blue-400" />
                            </a>
                            <a 
                                href={MODELS.recognizers.MOBILE_FACE_NET.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700 hover:border-blue-500/50 transition-colors group"
                            >
                                <div className="text-left">
                                    <div className="text-xs font-bold text-slate-300 group-hover:text-white">2. Download Recognizer</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{MODELS.recognizers.MOBILE_FACE_NET.name}</div>
                                </div>
                                <Download className="w-4 h-4 text-blue-400" />
                            </a>
                        </div>

                        {/* Step 2: Upload */}
                        <div className="space-y-3 mb-6">
                            {/* Detector Input */}
                            <div className={`p-3 rounded-lg border border-dashed transition-colors flex items-center gap-3 ${detectorFile ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'}`}>
                                {detectorFile ? <FileCheck className="w-5 h-5 text-green-400" /> : <Upload className="w-5 h-5 text-slate-500" />}
                                <div className="flex-1 text-left overflow-hidden">
                                    <label htmlFor="detector-upload" className="block text-xs font-medium text-slate-300 cursor-pointer">
                                        {detectorFile ? detectorFile.name : "Upload Detector File (.tflite)"}
                                    </label>
                                    <input 
                                        id="detector-upload" 
                                        type="file" 
                                        accept=".tflite" 
                                        className="hidden" 
                                        onChange={(e) => setDetectorFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                                {detectorFile && <button onClick={() => setDetectorFile(null)} className="text-xs text-slate-500 hover:text-white">Change</button>}
                            </div>

                            {/* Recognizer Input */}
                            <div className={`p-3 rounded-lg border border-dashed transition-colors flex items-center gap-3 ${recognizerFile ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'}`}>
                                {recognizerFile ? <FileCheck className="w-5 h-5 text-green-400" /> : <Upload className="w-5 h-5 text-slate-500" />}
                                <div className="flex-1 text-left overflow-hidden">
                                    <label htmlFor="recognizer-upload" className="block text-xs font-medium text-slate-300 cursor-pointer">
                                        {recognizerFile ? recognizerFile.name : "Upload Recognizer File (.tflite)"}
                                    </label>
                                    <input 
                                        id="recognizer-upload" 
                                        type="file" 
                                        accept=".tflite" 
                                        className="hidden" 
                                        onChange={(e) => setRecognizerFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                                {recognizerFile && <button onClick={() => setRecognizerFile(null)} className="text-xs text-slate-500 hover:text-white">Change</button>}
                            </div>
                        </div>

                        <button 
                            onClick={handleManualUpload}
                            disabled={!detectorFile || !recognizerFile || isManualLoading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-blue-500/20"
                        >
                            {isManualLoading ? "Verifying & Loading..." : "Initialize Models"}
                        </button>
                    </div>
                )}
            </div>
          </Layout>
      );
  }

  // --- Render ---
  return (
    <Layout>
      {/* Route: Settings */}
      {step === AppStep.SETTINGS ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <SettingsPage 
            settings={appSettings} 
            onUpdateSettings={setAppSettings}
            onBack={() => setStep(targetPhotos.length > 0 ? AppStep.SETUP_TARGET : AppStep.SETUP_TARGET)}
            onResetData={handleResetData}
          />
        </div>
      ) : (
        <>
          {/* Route: Setup Target */}
          {step === AppStep.SETUP_TARGET && (
             <SetupView 
                modelReady={modelReady}
                targetPhotos={targetPhotos}
                setTargetPhotos={setTargetPhotos}
                settings={appSettings}
                onNext={() => setStep(AppStep.SCAN_GALLERY)}
                onOpenSettings={() => setStep(AppStep.SETTINGS)}
             />
          )}

          {/* Route: Select Source */}
          {step === AppStep.SCAN_GALLERY && (
             <SourceSelectView 
                onScanStart={goToResults}
                onBack={() => setStep(AppStep.SETUP_TARGET)}
                onOpenSettings={() => setStep(AppStep.SETTINGS)}
             />
          )}

          {/* Route: Results */}
          {step === AppStep.RESULTS && (
            <ResultsView 
              galleryPhotos={galleryPhotos}
              targetPhotos={targetPhotos}
              stats={stats}
              isScanning={isScanning}
              onStopScan={stopScanning}
              onViewPhoto={setViewingPhoto}
              onBack={handleBackFromResults}
              onHome={handleFullReset}
              onUpdateGallery={setGalleryPhotos}
              onOpenSettings={() => setStep(AppStep.SETTINGS)}
            />
          )}
        </>
      )}

      {/* Global Modals */}
      {viewingPhoto && (
        <ImageViewer 
          photo={viewingPhoto} 
          onClose={() => setViewingPhoto(null)} 
        />
      )}
    </Layout>
  );
};

export default App;
