import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { A4PreviewData, AppLanguage } from '../types';
import { translations } from '../utils/translations';

interface A4SheetPreviewProps {
  language: AppLanguage;
  previewData?: A4PreviewData;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
}

export const A4SheetPreview: React.FC<A4SheetPreviewProps> = ({
  language,
  previewData,
  isLoading,
  onPageChange,
}) => {
  const t = translations[language];
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);

  const canPrev = previewData ? previewData.current_page > 0 : false;
  const canNext = previewData ? previewData.current_page < previewData.total_pages - 1 : false;

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between min-h-[580px]">
      {/* Top Header with Layout Statistics */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>{t.tabA4}</span>
          </h2>
          <div className="flex items-center space-x-3 text-xs text-slate-300 mt-1">
            <span>{t.totalPhotos}: <strong className="text-white">{previewData?.total_photos || 0}</strong></span>
            <span>•</span>
            <span>{t.rows}: <strong className="text-white">{previewData?.rows || 0}</strong></span>
            <span>•</span>
            <span>{t.columns}: <strong className="text-white">{previewData?.columns || 0}</strong></span>
            <span>•</span>
            <span>{t.perPage}: <strong className="text-white">{previewData?.photos_per_page || 0}</strong></span>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.1))}
            className="p-1 text-slate-400 hover:text-white rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-300 w-10 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
            className="p-1 text-slate-400 hover:text-white rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(0.85)}
            className="p-1 text-slate-400 hover:text-white rounded ml-1 border-l border-slate-700 pl-2"
            title={t.zoomFit}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sheet preview canvas container */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto max-h-[500px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-3 p-8">
            <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 animate-pulse">Rendering print preview...</p>
          </div>
        ) : previewData?.page_preview_url ? (
          <div
            className="transition-transform duration-200 ease-out origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Realistic paper with subtle print borders and shadows */}
            <div className="relative bg-white text-slate-900 shadow-2xl rounded-sm p-1 border border-slate-300 ring-4 ring-black/20">
              <img
                src={previewData.page_preview_url}
                alt="A4 Sheet Preview"
                className="max-w-none block"
                style={{
                  width: previewData.paper_size === 'Letter' ? '460px' : '440px',
                }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Generate A4 preview to inspect sheet layout</p>
          </div>
        )}
      </div>

      {/* Multi-page Navigation Bar */}
      <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {previewData && (
            <span
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                previewData.fits
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {previewData.fits ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sheet Validated</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Overflow Warning</span>
                </>
              )}
            </span>
          )}
        </div>

        {/* Multi-page controls */}
        {previewData && previewData.total_pages > 1 && (
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
            <button
              onClick={() => onPageChange(previewData.current_page - 1)}
              disabled={!canPrev}
              className={`p-1 rounded transition ${
                canPrev ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
              }`}
              title={t.prevPage}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-medium text-slate-300 px-1">
              {t.page} {previewData.current_page + 1} {t.of} {previewData.total_pages}
            </span>

            <button
              onClick={() => onPageChange(previewData.current_page + 1)}
              disabled={!canNext}
              className={`p-1 rounded transition ${
                canNext ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
              }`}
              title={t.nextPage}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
