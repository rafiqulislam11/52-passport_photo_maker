import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, CheckCircle2, AlertTriangle, Sparkles, X, Plus } from 'lucide-react';
import { UploadItem, AppLanguage } from '../types';
import { translations } from '../utils/translations';

interface UploadSectionProps {
  language: AppLanguage;
  queue: UploadItem[];
  activeId: string | null;
  onSelectActive: (id: string) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveItem: (id: string) => void;
  onClearQueue: () => void;
  isProcessing: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  language,
  queue,
  activeId,
  onSelectActive,
  onAddFiles,
  onRemoveItem,
  onClearQueue,
  isProcessing,
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Global paste handler (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const imageFiles: File[] = [];
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const file = e.clipboardData.files[i];
          if (file.type.startsWith('image/')) {
            imageFiles.push(file);
          }
        }
        if (imageFiles.length > 0) {
          onAddFiles(imageFiles);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onAddFiles]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 p-5 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
            <span>{t.uploadTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.uploadSubtitle}</p>
        </div>
        {queue.length > 0 && (
          <button
            onClick={onClearQueue}
            disabled={isProcessing}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 transition"
          >
            <Trash2 className="w-3 h-3" />
            <span>{t.clearAll}</span>
          </button>
        )}
      </div>

      {/* Drag & drop upload area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          isDragOver
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-700 hover:border-indigo-500/60 bg-slate-900/50 hover:bg-slate-900/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onAddFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {t.dragDropText}
            </p>
            <p className="text-xs text-slate-400 mt-1">{t.orBrowse}</p>
            <p className="text-[11px] text-indigo-400/90 font-medium mt-2 bg-indigo-500/10 inline-block px-3 py-1 rounded-full border border-indigo-500/20">
              {t.pasteTip}
            </p>
          </div>
        </div>
      </div>

      {/* Upload queue list */}
      {queue.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>{t.uploadedQueue} ({queue.length})</span>
            <span>{queue.filter((i) => i.status === 'done').length} processed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {queue.map((item) => {
              const isActive = item.id === activeId;
              const hasFace = item.faceInfo?.detected;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectActive(item.id)}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/50'
                      : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <img
                      src={item.previewUrl}
                      alt={item.originalName}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-800 flex-shrink-0 border border-slate-700"
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-slate-200 truncate" title={item.originalName}>
                        {item.originalName}
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{item.width} × {item.height} px</span>
                        <span>•</span>
                        <span>{formatBytes(item.sizeBytes)}</span>
                      </div>

                      {/* Face detection status badge */}
                      <div className="mt-1">
                        {item.faceInfo ? (
                          hasFace ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t.faceDetectedSuccess}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] text-amber-400 font-medium" title={t.faceNotDetectedWarn}>
                              <AlertTriangle className="w-3 h-3" />
                              <span className="truncate max-w-[130px]">No face detected</span>
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-400">Ready</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title={t.removePhoto}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
