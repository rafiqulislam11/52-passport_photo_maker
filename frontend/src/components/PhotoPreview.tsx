import React, { useState } from 'react';
import { Download, Eye, ZoomIn, ZoomOut, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { ProcessedPhotoResult, AppLanguage } from '../types';
import { translations } from '../utils/translations';

interface PhotoPreviewProps {
  language: AppLanguage;
  processed?: ProcessedPhotoResult;
  originalPreview?: string;
  isProcessing: boolean;
  onDownloadJpg: () => void;
  onDownloadPng: () => void;
}

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  language,
  processed,
  originalPreview,
  isProcessing,
  onDownloadJpg,
  onDownloadPng,
}) => {
  const t = translations[language];
  const [showOriginal, setShowOriginal] = useState(false);
  const [showBiometricGuide, setShowBiometricGuide] = useState(false);

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 p-5 backdrop-blur-sm shadow-xl flex flex-col items-center justify-between min-h-[440px]">
      {/* Header with stats */}
      <div className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-white">{t.tabSingle}</span>
          {processed && (
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>ICAO Verified</span>
            </span>
          )}
        </div>

        {/* View toggles */}
        <div className="flex items-center space-x-2">
          {originalPreview && processed && (
            <button
              type="button"
              onClick={() => setShowOriginal(!showOriginal)}
              className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              {showOriginal ? 'Show Processed' : 'Show Original'}
            </button>
          )}

          {processed && (
            <button
              type="button"
              onClick={() => setShowBiometricGuide(!showBiometricGuide)}
              className={`text-[11px] px-2 py-1 rounded-lg border transition ${
                showBiometricGuide
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              Biometric Lines
            </button>
          )}
        </div>
      </div>

      {/* Main photo display frame */}
      <div className="relative my-auto flex items-center justify-center p-4">
        {isProcessing ? (
          <div className="w-56 h-72 rounded-2xl bg-slate-900/80 border border-slate-700 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-300 font-medium animate-pulse">
              {t.processingBtn}
            </p>
          </div>
        ) : processed ? (
          <div className="relative group shadow-2xl rounded-lg overflow-hidden border border-slate-600 bg-white">
            <img
              src={showOriginal && originalPreview ? originalPreview : processed.image_url}
              alt="Passport Preview"
              className="max-h-72 object-contain transition-transform"
            />

            {/* Biometric ICAO passport guide overlay lines */}
            {showBiometricGuide && !showOriginal && (
              <div className="absolute inset-0 pointer-events-none border border-cyan-400/40">
                {/* Center vertical line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-400/40 border-dashed" />
                {/* Crown headroom guide line (~10%) */}
                <div className="absolute top-[10%] left-0 right-0 h-[1px] bg-cyan-400/60" />
                <span className="absolute top-[10%] left-1 text-[8px] text-cyan-300 bg-slate-950/70 px-1 rounded">
                  Crown (10%)
                </span>
                {/* Eye level guide line (~45%) */}
                <div className="absolute top-[45%] left-0 right-0 h-[1px] bg-emerald-400/60" />
                <span className="absolute top-[45%] left-1 text-[8px] text-emerald-300 bg-slate-950/70 px-1 rounded">
                  Eye Axis (45%)
                </span>
                {/* Chin line guide (~80%) */}
                <div className="absolute top-[80%] left-0 right-0 h-[1px] bg-cyan-400/60" />
                <span className="absolute top-[80%] left-1 text-[8px] text-cyan-300 bg-slate-950/70 px-1 rounded">
                  Chin Base (80%)
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-56 h-72 rounded-2xl border-2 border-dashed border-slate-700/80 bg-slate-900/40 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 mb-2">
              <Eye className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Upload a photo to preview passport photo
            </p>
          </div>
        )}
      </div>

      {/* Dimensions & Quality Badges */}
      {processed && (
        <div className="w-full mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="font-semibold text-white">
              {processed.width_mm} × {processed.height_mm} mm
            </span>
            <span>•</span>
            <span className="text-slate-400 font-mono">
              {processed.width_px} × {processed.height_px} px
            </span>
            <span>•</span>
            <span className="text-cyan-400 font-semibold">{processed.dpi} DPI</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onDownloadJpg}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.downloadJpgBtn}</span>
            </button>
            <button
              type="button"
              onClick={onDownloadPng}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.downloadPngBtn}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
