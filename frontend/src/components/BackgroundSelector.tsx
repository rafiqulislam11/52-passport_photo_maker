import React, { useRef } from 'react';
import { Palette, Check, Upload, Image as ImageIcon } from 'lucide-react';
import { BackgroundType, PhotoSettingsState, AppLanguage } from '../types';
import { translations } from '../utils/translations';

interface BackgroundSelectorProps {
  language: AppLanguage;
  settings: PhotoSettingsState;
  onChange: (updates: Partial<PhotoSettingsState>) => void;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  language,
  settings,
  onChange,
}) => {
  const t = translations[language];
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      onChange({
        background_type: 'custom_image',
        custom_bg_file: file,
        custom_bg_preview: previewUrl,
      });
    }
  };

  const options: { type: BackgroundType; label: string; preview: string; isColor?: boolean }[] = [
    {
      type: 'white',
      label: t.bgWhite,
      preview: '#FFFFFF',
      isColor: true,
    },
    {
      type: 'light_blue',
      label: t.bgLightBlue,
      preview: '#B9D9EB',
      isColor: true,
    },
    {
      type: 'custom_color',
      label: t.bgCustomColor,
      preview: settings.background_color || '#4A90E2',
      isColor: true,
    },
    {
      type: 'transparent',
      label: t.bgTransparent,
      preview: 'transparent',
    },
    {
      type: 'custom_image',
      label: t.bgCustomImage,
      preview: settings.custom_bg_preview || '',
    },
  ];

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 p-5 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">3</span>
            <span>{t.bgTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.bgWhite} (Default)</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Preset background pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {options.map((opt) => {
            const isSelected = settings.background_type === opt.type;

            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => onChange({ background_type: opt.type })}
                className={`relative flex items-center space-x-2.5 p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500'
                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                }`}
              >
                {/* Visual thumbnail badge */}
                <div
                  className="w-6 h-6 rounded-lg border border-slate-600 flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: opt.isColor ? opt.preview : undefined,
                    backgroundImage:
                      opt.type === 'transparent'
                        ? 'radial-gradient(#475569 1px, transparent 1px)'
                        : undefined,
                    backgroundSize: '6px 6px',
                  }}
                >
                  {opt.type === 'custom_image' && opt.preview ? (
                    <img src={opt.preview} alt="bg" className="w-full h-full object-cover" />
                  ) : opt.type === 'custom_image' ? (
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  ) : null}
                </div>

                <span className="text-xs font-medium text-slate-200 truncate flex-1">
                  {opt.label}
                </span>

                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Custom Color Picker if custom_color is selected */}
        {settings.background_type === 'custom_color' && (
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/80 border border-slate-700">
            <input
              type="color"
              value={settings.background_color}
              onChange={(e) => onChange({ background_color: e.target.value })}
              className="w-9 h-9 rounded-lg border border-slate-600 cursor-pointer bg-transparent"
            />
            <div className="flex-1">
              <label className="block text-[11px] text-slate-400 font-medium">Hex Color</label>
              <input
                type="text"
                value={settings.background_color}
                onChange={(e) => onChange({ background_color: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 uppercase font-mono mt-0.5 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Custom Image Upload if custom_image is selected */}
        {settings.background_type === 'custom_image' && (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700">
            <input
              ref={bgFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCustomBgUpload}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">
                {settings.custom_bg_file ? settings.custom_bg_file.name : t.uploadCustomBg}
              </span>
              <button
                type="button"
                onClick={() => bgFileInputRef.current?.click()}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                <Upload className="w-3 h-3" />
                <span>Browse</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
