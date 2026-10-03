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
  onLoadDemo?: () => void;
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
  onLoadDemo,
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

      {/* Guide Banner when no photo is active yet */}
      {!canExport && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-indigo-300">
            <Info className="w-4 h-4 flex-shrink-0 text-cyan-400" />
            <span>
              {language === 'bn'
                ? 'সব ফিচার ও এক্সপোর্ট দেখতে ছবি আপলোড করুন অথবা ডেমো ছবি লোড করুন।'
                : 'Upload a photo or load demo to unlock all exports, A4 PDF, and print features.'}
            </span>
          </div>
          {onLoadDemo && (
            <button
              type="button"
              onClick={onLoadDemo}
              disabled={isProcessing}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] shadow transition whitespace-nowrap"
            >
              {language === 'bn' ? 'ডেমো লোড করুন' : 'Load Demo'}
            </button>
          )}
        </div>
      )}

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

      {/* Single Photo Downloads */}
      <div>
        <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
          {language === 'bn' ? 'একক পাসপোর্ট ছবি ডাউনলোড' : 'Single Photo Download'}
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onDownloadJpg}
            disabled={!canExport}
            className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition disabled:opacity-40 hover:border-indigo-500/50"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.downloadJpgBtn}</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPng}
            disabled={!canExport}
            className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition disabled:opacity-40 hover:border-cyan-500/50"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.downloadPngBtn}</span>
          </button>
        </div>
      </div>

      {/* A4 Sheet & Package Downloads */}
      <div>
        <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
          {language === 'bn' ? 'প্রিন্ট শিট ও প্যাকেজ ডাউনলোড' : 'Print Sheets & Package Exports'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={onDownloadA4Pdf}
            disabled={!canExport}
            className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition disabled:opacity-40 hover:border-rose-500/50"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span>{t.downloadPdfBtn}</span>
          </button>

          <button
            type="button"
            onClick={onDownloadA4Jpg}
            disabled={!canExport}
            className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition disabled:opacity-40 hover:border-indigo-500/50"
          >
            <Image className="w-3.5 h-3.5 text-indigo-400" />
            <span>A4 Sheet (JPG)</span>
          </button>

          <button
            type="button"
            onClick={onDownloadZip}
            disabled={!canExport}
            className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition disabled:opacity-40 hover:border-amber-500/50"
          >
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.downloadZipBtn}</span>
          </button>
        </div>
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
