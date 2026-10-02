import React from 'react';
import { Sliders, Maximize2, Crop, Sparkles, Check } from 'lucide-react';
import { PassportPreset, PhotoSettingsState, AppLanguage } from '../types';
import { translations } from '../utils/translations';

interface PhotoSettingsProps {
  language: AppLanguage;
  presets: PassportPreset[];
  settings: PhotoSettingsState;
  onChange: (updates: Partial<PhotoSettingsState>) => void;
  onOpenManualCrop: () => void;
  onAutoAlign: () => void;
}

export const PhotoSettings: React.FC<PhotoSettingsProps> = ({
  language,
  presets,
  settings,
  onChange,
  onOpenManualCrop,
  onAutoAlign,
}) => {
  const t = translations[language];

  const handlePresetSelect = (presetId: string) => {
    const selected = presets.find((p) => p.id === presetId);
    if (selected) {
      onChange({
        preset_id: selected.id,
        photo_width_mm: selected.width_mm,
        photo_height_mm: selected.height_mm,
        unit: selected.unit,
        dpi: selected.default_dpi,
      });
    } else {
      onChange({ preset_id: 'custom' });
    }
  };

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 p-5 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">2</span>
            <span>{t.presetTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.presetLabel}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Quick Presets Pills */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            {t.quickPresets}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {[
              { id: 'bangladesh_passport', label: '🇧🇩 BD Passport', sub: '35×45 mm' },
              { id: 'standard_passport', label: '🌍 ICAO / EU', sub: '35×45 mm' },
              { id: 'us_passport', label: '🇺🇸 US Visa', sub: '2×2 inch' },
              { id: 'schengen_visa', label: '🇪🇺 Schengen', sub: '35×45 mm' },
            ].map((p) => {
              const isSelected = settings.preset_id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetSelect(p.id)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/20 text-white ring-1 ring-indigo-500'
                      : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600 hover:bg-slate-900'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{p.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sub}</div>
                </button>
              );
            })}
          </div>

          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            {t.presetLabel}
          </label>
          <select
            value={settings.preset_id}
            onChange={(e) => handlePresetSelect(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name} ({preset.width_mm} × {preset.height_mm} mm) — {preset.country}
              </option>
            ))}
            <option value="custom">Custom Dimensions</option>
          </select>
        </div>

        {/* Custom dimensions if custom is selected or editable */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              {t.customWidth}
            </label>
            <input
              type="number"
              step="0.1"
              min="10"
              max="150"
              value={settings.photo_width_mm}
              onChange={(e) =>
                onChange({
                  photo_width_mm: parseFloat(e.target.value) || 35,
                  preset_id: 'custom',
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              {t.customHeight}
            </label>
            <input
              type="number"
              step="0.1"
              min="10"
              max="200"
              value={settings.photo_height_mm}
              onChange={(e) =>
                onChange({
                  photo_height_mm: parseFloat(e.target.value) || 45,
                  preset_id: 'custom',
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              {t.unit}
            </label>
            <select
              value={settings.unit}
              onChange={(e) =>
                onChange({
                  unit: e.target.value as 'mm' | 'inch' | 'px',
                  preset_id: 'custom',
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="mm">mm</option>
              <option value="inch">inch</option>
              <option value="px">px</option>
            </select>
          </div>
        </div>

        {/* DPI Selector */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
            {t.dpiLabel}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ dpi: 300 })}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                settings.dpi === 300
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>300 DPI</span>
              {settings.dpi === 300 && <Check className="w-3.5 h-3.5 text-indigo-400" />}
            </button>
            <button
              type="button"
              onClick={() => onChange({ dpi: 600 })}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                settings.dpi === 600
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>600 DPI (HD)</span>
              {settings.dpi === 600 && <Check className="w-3.5 h-3.5 text-indigo-400" />}
            </button>
          </div>
        </div>

        {/* Auto Align Face & Manual Crop Fallback Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onAutoAlign}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              settings.auto_align
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/30'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.autoAlignBtn}</span>
          </button>

          <button
            type="button"
            onClick={onOpenManualCrop}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition"
          >
            <Crop className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.manualAdjustBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
