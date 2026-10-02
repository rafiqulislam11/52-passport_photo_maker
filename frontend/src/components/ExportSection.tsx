import React from 'react';
import { Download, Printer, FileText, Archive, Sparkles, Image, Check, Info } from 'lucide-react';
import { AppLanguage } from '../types';
import { translations } from '../utils/translations';

interface ExportSectionProps {
  language: AppLanguage;
  canExport: boolean;
  isProcessing: boolean;
  onGeneratePhoto: () => void;
  onGenerateA4Sheet: () => void;
  onDownloadJpg: () => void;
  onDownloadPng: () => void;
  onDownloadA4Jpg: () => void;
  onDownloadA4Pdf: () => void;
  onDownloadZip: () => void;
  onPrintA4: () => void;
}

export const ExportSection: React.FC<ExportSectionProps> = ({
  language,
  canExport,
  isProcessing,
  onGeneratePhoto,
  onGenerateA4Sheet,
  onDownloadJpg,
  onDownloadPng,
  onDownloadA4Jpg,
  onDownloadA4Pdf,
  onDownloadZip,
  onPrintA4,
}) => {
  const t = translations[language];

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 p-5 backdrop-blur-sm shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">6</span>
            <span>{t.navExport}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">High-definition prints, digital passports & batch archives</p>
        </div>
      </div>

      {/* Main Action Generation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onGeneratePhoto}
          disabled={isProcessing}
          className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 p-[1px] shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="relative px-4 py-3 bg-slate-900/40 rounded-[11px] flex items-center justify-center space-x-2 text-white font-semibold text-xs tracking-wide">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>{isProcessing ? t.processingBtn : t.generatePhotoBtn}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={onGenerateA4Sheet}
          disabled={isProcessing || !canExport}
          className="relative group overflow-hidden rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 p-[1px] shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="relative px-4 py-3 bg-slate-900/40 rounded-[11px] flex items-center justify-center space-x-2 text-white font-semibold text-xs tracking-wide">
            <FileText className="w-4 h-4 text-cyan-200" />
            <span>{t.generateA4Btn}</span>
          </div>
        </button>
      </div>

      {/* Download Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
        <button
          type="button"
          onClick={onDownloadA4Pdf}
          disabled={!canExport}
          className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition disabled:opacity-40"
        >
          <FileText className="w-3.5 h-3.5 text-rose-400" />
          <span>{t.downloadPdfBtn}</span>
        </button>

        <button
          type="button"
          onClick={onDownloadA4Jpg}
          disabled={!canExport}
          className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition disabled:opacity-40"
        >
          <Image className="w-3.5 h-3.5 text-indigo-400" />
          <span>A4 Sheet (JPG)</span>
        </button>

        <button
          type="button"
          onClick={onDownloadZip}
          disabled={!canExport}
          className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition disabled:opacity-40"
        >
          <Archive className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.downloadZipBtn}</span>
        </button>
      </div>

      {/* Real Print A4 Button */}
      <button
        type="button"
        onClick={onPrintA4}
        disabled={!canExport}
        className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition shadow-sm disabled:opacity-40"
      >
        <Printer className="w-4 h-4 text-cyan-400" />
        <span>{t.printBtn}</span>
      </button>

      {/* Print Instructions Box */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center space-x-1.5 text-slate-300 font-semibold mb-1">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.printInstructionsTitle}</span>
        </div>
        <p className="flex items-start space-x-1.5 text-[11px] leading-relaxed">
          <span className="text-cyan-400 font-bold">•</span>
          <span>{t.printInstruction1}</span>
        </p>
        <p className="flex items-start space-x-1.5 text-[11px] leading-relaxed">
          <span className="text-cyan-400 font-bold">•</span>
          <span>{t.printInstruction2}</span>
        </p>
        <p className="flex items-start space-x-1.5 text-[11px] leading-relaxed">
          <span className="text-cyan-400 font-bold">•</span>
          <span>{t.printInstruction3}</span>
        </p>
      </div>
    </div>
  );
};
