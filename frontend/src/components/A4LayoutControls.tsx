import React from 'react';
import { LayoutGrid, Maximize, Move, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { A4LayoutSettings, AppLanguage, PaperSize, PaperOrientation } from '../types';
import { translations } from '../utils/translations';

interface A4LayoutControlsProps {
  language: AppLanguage;
  settings: A4LayoutSettings;
  onChange: (updates: Partial<A4LayoutSettings>) => void;
  onAutoFit: () => void;
  warning?: string;
}

export const A4LayoutControls: React.FC<A4LayoutControlsProps> = ({
  language,
  settings,
  onChange,
  onAutoFit,
  warning,
}) => {
  const t = translations[language];

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 p-5 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">5</span>
            <span>{t.a4Title}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{settings.paper_size} ({settings.orientation})</p>
        </div>
        <button
          type="button"
          onClick={onAutoFit}
          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition"
          title={t.autoFitBtn}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.autoFitBtn}</span>
        </button>
      </div>

      {warning && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-2.5 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{warning}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Paper Size & Orientation */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t.paperSize}
            </label>
            <select
              value={settings.paper_size}
              onChange={(e) => onChange({ paper_size: e.target.value as PaperSize })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="A5">A5 (148 × 210 mm)</option>
              <option value="Letter">US Letter (8.5 × 11 in)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t.orientation}
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => onChange({ orientation: 'portrait' })}
                className={`py-1 text-xs font-medium rounded-lg transition ${
                  settings.orientation === 'portrait'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.portrait}
              </button>
              <button
                type="button"
                onClick={() => onChange({ orientation: 'landscape' })}
                className={`py-1 text-xs font-medium rounded-lg transition ${
                  settings.orientation === 'landscape'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.landscape}
              </button>
            </div>
          </div>
        </div>

        {/* Photos Per Row Slider (1 to 10) */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
            <span className="font-medium">{t.photosPerRow}</span>
            <span className="font-bold text-sm text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-mono">
              {settings.photos_per_row}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={settings.photos_per_row}
            onChange={(e) => onChange({ photos_per_row: parseInt(e.target.value) || 4 })}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4 (Default)</span>
            <span>6</span>
            <span>8</span>
            <span>10</span>
          </div>
        </div>

        {/* Gaps (Horizontal & Vertical mm) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              {t.horizontalGap}
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="25"
              value={settings.horizontal_gap_mm}
              onChange={(e) => onChange({ horizontal_gap_mm: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              {t.verticalGap}
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="25"
              value={settings.vertical_gap_mm}
              onChange={(e) => onChange({ vertical_gap_mm: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Margins (Top, Bottom, Left, Right mm) */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
            {t.margins}
          </label>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <span className="block text-[10px] text-slate-400 mb-0.5">{t.marginTop}</span>
              <input
                type="number"
                step="0.5"
                min="0"
                max="40"
                value={settings.margin_top_mm}
                onChange={(e) => onChange({ margin_top_mm: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200 font-mono"
              />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 mb-0.5">{t.marginBottom}</span>
              <input
                type="number"
                step="0.5"
                min="0"
                max="40"
                value={settings.margin_bottom_mm}
                onChange={(e) => onChange({ margin_bottom_mm: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200 font-mono"
              />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 mb-0.5">{t.marginLeft}</span>
              <input
                type="number"
                step="0.5"
                min="0"
                max="40"
                value={settings.margin_left_mm}
                onChange={(e) => onChange({ margin_left_mm: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200 font-mono"
              />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 mb-0.5">{t.marginRight}</span>
              <input
                type="number"
                step="0.5"
                min="0"
                max="40"
                value={settings.margin_right_mm}
                onChange={(e) => onChange({ margin_right_mm: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Copies Count & Cut lines */}
        <div className="flex items-center justify-between pt-1">
          <div className="w-1/2 pr-2">
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              {t.copiesCount}
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={settings.copies_count}
              onChange={(e) => onChange({ copies_count: parseInt(e.target.value) || 12 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <label className="w-1/2 pl-2 flex items-center space-x-2 cursor-pointer pt-4">
            <input
              type="checkbox"
              checked={settings.show_cut_lines}
              onChange={(e) => onChange({ show_cut_lines: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-600 focus:ring-indigo-500"
            />
            <span className="text-[11px] text-slate-300 leading-tight">
              {t.showCutLines}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
