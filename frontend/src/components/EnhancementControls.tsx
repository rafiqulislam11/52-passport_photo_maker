import React from 'react';
import { Wand2, RotateCcw, Sun, Contrast, Scissors, Sparkles } from 'lucide-react';
import { PhotoSettingsState, AppLanguage } from '../types';
import { translations } from '../utils/translations';

interface EnhancementControlsProps {
  language: AppLanguage;
  settings: PhotoSettingsState;
  onChange: (updates: Partial<PhotoSettingsState>) => void;
  onReset: () => void;
}

export const EnhancementControls: React.FC<EnhancementControlsProps> = ({
  language,
  settings,
  onChange,
  onReset,
}) => {
  const t = translations[language];

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 p-5 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">4</span>
            <span>{t.enhanceTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.autoEnhanceLabel}</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 transition"
          title={t.resetSliders}
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t.resetSliders}</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Auto Enhance Switch */}
        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/80 cursor-pointer hover:border-slate-600 transition">
          <div className="flex items-center space-x-2.5">
            <Wand2 className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                {t.autoEnhanceLabel}
              </span>
              <span className="text-[11px] text-slate-400 block">
                Lighting, tone balance & gentle noise reduction
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.auto_enhance}
            onChange={(e) => onChange({ auto_enhance: e.target.checked })}
            className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-600 focus:ring-indigo-500"
          />
        </label>

        {/* Natural Skin Smoothing Checkbox */}
        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/80 cursor-pointer hover:border-slate-600 transition">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">
              {t.smoothSkinLabel}
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.smooth_skin}
            onChange={(e) => onChange({ smooth_skin: e.target.checked })}
            className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-600 focus:ring-indigo-500"
          />
        </label>

        {/* Manual Sliders */}
        <div className="pt-2 border-t border-slate-700/60 space-y-3">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 block">
            {t.manualAdjustments}
          </span>

          {/* Brightness */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>{t.brightness}</span>
              <span className="font-mono text-[11px] text-slate-400">{settings.brightness > 0 ? `+${settings.brightness}` : settings.brightness}</span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              value={settings.brightness}
              onChange={(e) => onChange({ brightness: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>{t.contrast}</span>
              <span className="font-mono text-[11px] text-slate-400">{settings.contrast > 0 ? `+${settings.contrast}` : settings.contrast}</span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              value={settings.contrast}
              onChange={(e) => onChange({ contrast: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Exposure */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>{t.exposure}</span>
              <span className="font-mono text-[11px] text-slate-400">{settings.exposure > 0 ? `+${settings.exposure}` : settings.exposure}</span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              value={settings.exposure}
              onChange={(e) => onChange({ exposure: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Sharpness */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>{t.sharpness}</span>
              <span className="font-mono text-[11px] text-slate-400">{settings.sharpness > 0 ? `+${settings.sharpness}` : settings.sharpness}</span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              value={settings.sharpness}
              onChange={(e) => onChange({ sharpness: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Saturation */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>{t.saturation}</span>
              <span className="font-mono text-[11px] text-slate-400">{settings.saturation > 0 ? `+${settings.saturation}` : settings.saturation}</span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              value={settings.saturation}
              onChange={(e) => onChange({ saturation: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
