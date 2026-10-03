import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, RotateCw, RotateCcw, ZoomIn, ZoomOut, Move, Check, Compass, Focus } from 'lucide-react';
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

  // Sync initialSettings if modal re-opens
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  // Drag-to-pan state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startOffsetX: number; startOffsetY: number }>({
    x: 0,
    y: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  // Calculate dynamic framing dimensions based on passport aspect ratio
  const validRatio = aspectRatio && aspectRatio > 0 ? aspectRatio : 35 / 45;
  const frameHeight = 320;
  const frameWidth = Math.round(Math.min(340, Math.max(180, frameHeight * validRatio)));

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startOffsetX: settings.offset_x,
      startOffsetY: settings.offset_y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Convert pixel movement to percentage range (-100 to 100)
    const scaleFactor = 100 / (frameHeight / 2);
    const newOffsetX = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.startOffsetX + dx * scaleFactor)));
    const newOffsetY = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.startOffsetY + dy * scaleFactor)));

    setSettings((prev) => ({
      ...prev,
      offset_x: newOffsetX,
      offset_y: newOffsetY,
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    setSettings((prev) => ({
      ...prev,
      zoom: parseFloat(Math.max(0.5, Math.min(2.5, prev.zoom + delta)).toFixed(2)),
    }));
  };

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
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Move className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">{t.manualAdjustBtn}</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Ratio: {validRatio >= 0.99 && validRatio <= 1.01 ? '1:1 Square' : `${validRatio.toFixed(2)}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas / Crop framing viewport with pointer drag and wheel zoom */}
        <div
          className="p-6 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none"
          onWheel={handleWheel}
        >
          {imageUrl ? (
            <div
              className={`relative flex items-center justify-center border-2 border-dashed border-indigo-400/80 rounded-lg overflow-hidden bg-slate-900 shadow-2xl ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                width: `${frameWidth}px`,
                height: `${frameHeight}px`,
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Image with dynamic transform */}
              <img
                src={imageUrl}
                alt="Framing preview"
                draggable={false}
                className="max-w-none pointer-events-none transition-transform duration-75 select-none"
                style={{
                  transform: `translate(${settings.offset_x}px, ${settings.offset_y}px) scale(${settings.zoom}) rotate(${settings.rotation}deg)`,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />

              {/* Passport crop mask guideline overlay */}
              <div className="absolute inset-0 pointer-events-none border border-cyan-400/60">
                {/* Crown headroom guide (~12%) */}
                <div className="absolute inset-x-0 top-[12%] h-[1px] bg-cyan-400/50" />
                <span className="absolute top-[12%] left-1 text-[8px] text-cyan-300 bg-slate-950/70 px-1 rounded">
                  Crown (10-15%)
                </span>

                {/* Eye axis guide (~45%) */}
                <div className="absolute inset-x-0 top-[45%] h-[1px] bg-emerald-400/60" />
                <span className="absolute top-[45%] left-1 text-[8px] text-emerald-300 bg-slate-950/70 px-1 rounded">
                  Eye Axis (45%)
                </span>

                {/* Chin base guide (~80%) */}
                <div className="absolute inset-x-0 top-[80%] h-[1px] bg-cyan-400/50" />
                <span className="absolute top-[80%] left-1 text-[8px] text-cyan-300 bg-slate-950/70 px-1 rounded">
                  Chin (80%)
                </span>

                {/* Center vertical axis */}
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-400/50" />
              </div>

              {/* Drag instruction overlay badge */}
              <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
                <span className="text-[10px] bg-slate-950/80 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700/60 shadow">
                  Drag to pan • Scroll to zoom
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-12">No image loaded</p>
          )}
        </div>

        {/* Adjustment Sliders & Controls */}
        <div className="p-4 space-y-3 bg-slate-900/95 border-t border-slate-800 overflow-y-auto">
          {/* Zoom Control */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span className="flex items-center space-x-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
                <span>Zoom</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, zoom: Math.max(0.5, parseFloat((s.zoom - 0.1).toFixed(2))) }))}
                  className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="font-mono text-cyan-400 text-xs w-12 text-center">{settings.zoom.toFixed(2)}x</span>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, zoom: Math.min(2.5, parseFloat((s.zoom + 0.1).toFixed(2))) }))}
                  className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
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

          {/* Pan Controls (X & Y) in 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            {/* Horizontal Position */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Pan X (Horizontal)</span>
                <span className="font-mono text-cyan-400">{settings.offset_x}px</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={settings.offset_x}
                onChange={(e) => setSettings({ ...settings, offset_x: parseInt(e.target.value) || 0 })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Vertical Position */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>Pan Y (Vertical)</span>
                <span className="font-mono text-cyan-400">{settings.offset_y}px</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={settings.offset_y}
                onChange={(e) => setSettings({ ...settings, offset_y: parseInt(e.target.value) || 0 })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Rotation Control with Quick Rotate Buttons */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span className="flex items-center space-x-1.5">
                <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Rotation</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, rotation: (s.rotation - 90) % 360 }))}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
                  title="Rotate -90°"
                >
                  -90°
                </button>
                <span className="font-mono text-cyan-400 text-xs w-10 text-center">{settings.rotation}°</span>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, rotation: (s.rotation + 90) % 360 }))}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
                  title="Rotate +90°"
                >
                  +90°
                </button>
              </div>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={settings.rotation}
              onChange={(e) => setSettings({ ...settings, rotation: parseInt(e.target.value) || 0 })}
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
