import React, { useState } from 'react';
import { X, Check, Key, Sliders, Shield } from 'lucide-react';
import { StudioSettings, AppLanguage, PassportPreset } from '../types';
import { translations } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StudioSettings;
  presets: PassportPreset[];
  onSave: (newSettings: StudioSettings) => void;
  language: AppLanguage;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  presets,
  onSave,
  language,
}) => {
  if (!isOpen) return null;

  const t = translations[language];
  const [form, setForm] = useState<StudioSettings>({ ...settings });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">{t.settingsModalTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Default Preset */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Default Photo Preset
            </label>
            <select
              value={form.defaultPreset}
              onChange={(e) => setForm({ ...form, defaultPreset: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.width_mm}x{p.height_mm}mm)
                </option>
              ))}
            </select>
          </div>

          {/* Default Background */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Default Background
            </label>
            <select
              value={form.defaultBackground}
              onChange={(e) => setForm({ ...form, defaultBackground: e.target.value as any })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="white">Pure White (RGB 255, 255, 255)</option>
              <option value="light_blue">Light Blue</option>
              <option value="transparent">Transparent PNG</option>
            </select>
          </div>

          {/* Default DPI */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Default Print Resolution (DPI)
            </label>
            <select
              value={form.defaultDpi}
              onChange={(e) => setForm({ ...form, defaultDpi: parseInt(e.target.value) || 300 })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="300">300 DPI (Standard)</option>
              <option value="600">600 DPI (Ultra High)</option>
            </select>
          </div>

          {/* Default Photos per row */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Default Photos Per Row
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={form.defaultPhotosPerRow}
              onChange={(e) => setForm({ ...form, defaultPhotosPerRow: parseInt(e.target.value) || 4 })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoEnhance}
                onChange={(e) => setForm({ ...form, autoEnhance: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-600"
              />
              <span>Enable Auto Enhance by default</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoAlign}
                onChange={(e) => setForm({ ...form, autoAlign: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-600"
              />
              <span>Enable Auto Face Alignment by default</span>
            </label>
          </div>

          {/* Optional API Key */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>Optional API Key (X-API-Key)</span>
            </label>
            <input
              type="password"
              placeholder="Leave empty if API key is not enabled"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition"
            >
              {t.close}
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t.saveSettings}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
