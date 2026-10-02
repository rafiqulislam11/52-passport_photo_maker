import React, { useState } from 'react';
import { X, RotateCw, ZoomIn, Move, Check, RotateCcw } from 'lucide-react';
import { ManualCropSettings, AppLanguage } from '../types';
import { translations } from '../utils/translations';

interface ManualCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  initialSettings?: ManualCropSettings;
  aspectRatio: number; // width / height
  onApply: (settings: ManualCropSettings) => void;
  language: AppLanguage;
}

export const ManualCropModal: React.FC<ManualCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  initialSettings,
  aspectRatio,
  onApply,
  language,
}) => {
  if (!isOpen) return null;

  const t = translations[language];

  const [settings, setSettings] = useState<ManualCropSettings>(
    initialSettings || {
      zoom: 1.0,
      offset_x: 0,
      offset_y: 0,
      rotation: 0,
    }
  );

  const handleReset = () => {
    setSettings({
      zoom: 1.0,
      offset_x: 0,
      offset_y: 0,
      rotation: 0,
    });
  };

  const handleSave = () => {
    onApply(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Move className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">{t.manualAdjustBtn}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas / Crop framing viewport */}
        <div className="p-6 bg-slate-950 flex items-center justify-center relative overflow-hidden min-h-[300px]">
          {imageUrl ? (
            <div className="relative w-64 h-80 flex items-center justify-center border-2 border-dashed border-indigo-400/60 rounded-lg overflow-hidden bg-slate-900/80 shadow-inner">
              {/* Image with dynamic transform */}
              <img
                src={imageUrl}
                alt="Framing preview"
                className="max-w-none transition-transform duration-75"
                style={{
                  transform: `translate(${settings.offset_x}px, ${settings.offset_y}px) scale(${settings.zoom}) rotate(${settings.rotation}deg)`,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />

              {/* Passport crop mask guideline overlay */}
              <div className="absolute inset-0 pointer-events-none border border-cyan-400/80">
                <div className="absolute inset-x-0 top-[15%] h-[1px] bg-cyan-400/40" />
                <div className="absolute inset-x-0 top-[50%] h-[1px] bg-emerald-400/40" />
                <div className="absolute inset-x-0 bottom-[15%] h-[1px] bg-cyan-400/40" />
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-400/40" />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No image loaded</p>
          )}
        </div>

        {/* Adjustment Sliders */}
        <div className="p-5 space-y-3 bg-slate-900/90 border-t border-slate-800">
          {/* Zoom */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Zoom</span>
              <span className="font-mono text-cyan-400">{settings.zoom.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={settings.zoom}
              onChange={(e) => setSettings({ ...settings, zoom: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Horizontal Position */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Pan X (Horizontal)</span>
              <span className="font-mono text-cyan-400">{settings.offset_x}px</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={settings.offset_x}
              onChange={(e) => setSettings({ ...settings, offset_x: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Vertical Position */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Pan Y (Vertical)</span>
              <span className="font-mono text-cyan-400">{settings.offset_y}px</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={settings.offset_y}
              onChange={(e) => setSettings({ ...settings, offset_y: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Rotation */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Rotate</span>
              <span className="font-mono text-cyan-400">{settings.rotation}°</span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              value={settings.rotation}
              onChange={(e) => setSettings({ ...settings, rotation: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Framing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
