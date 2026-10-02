import React from 'react';
import { UploadSection } from '../components/UploadSection';
import { PhotoSettings } from '../components/PhotoSettings';
import { BackgroundSelector } from '../components/BackgroundSelector';
import { EnhancementControls } from '../components/EnhancementControls';
import { A4LayoutControls } from '../components/A4LayoutControls';
import { PhotoPreview } from '../components/PhotoPreview';
import { A4SheetPreview } from '../components/A4SheetPreview';
import { ExportSection } from '../components/ExportSection';
import { ManualCropModal } from '../components/ManualCropModal';
import { SettingsModal } from '../components/SettingsModal';
import { usePassportStudio } from '../hooks/usePassportStudio';
import { translations } from '../utils/translations';
import { AppLayout } from '../layouts/AppLayout';

export const StudioPage: React.FC = () => {
  const {
    language,
    handleLanguageChange,
    studioSettings,
    handleSaveStudioSettings,
    apiOnline,
    presets,
    queue,
    activeId,
    activeItem,
    setActiveId,
    handleAddFiles,
    handleRemoveItem,
    handleClearQueue,
    photoSettings,
    setPhotoSettings,
    a4Settings,
    setA4Settings,
    a4Preview,
    isProcessing,
    isLayoutLoading,
    isCropModalOpen,
    setIsCropModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    activeTab,
    setActiveTab,
    statusMessage,
    handleProcessActive,
    handleLoadDemoPhoto,
    updateA4Preview,
    handleAutoFitA4,
    handlePageChange,
    handleDownloadSingleJpg,
    handleDownloadSinglePng,
    handleDownloadA4Jpg,
    handleDownloadA4Pdf,
    handleDownloadZip,
    handlePrintA4,
  } = usePassportStudio();

  const t = translations[language];
  const hasProcessed = Boolean(activeItem?.processedResult);

  return (
    <AppLayout
      language={language}
      onLanguageChange={handleLanguageChange}
      apiOnline={apiOnline}
      onOpenSettings={() => setIsSettingsModalOpen(true)}
      onPrint={handlePrintA4}
      hasProcessed={hasProcessed}
      onLoadDemo={handleLoadDemoPhoto}
    >
      {/* Feature Showcase Highlights Banner */}
      <div className="mb-6 p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-slate-300">
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
            <span>📸</span>
            <span>ICAO Biometric Face-Crop</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
            <span>✂️</span>
            <span>AI Background Remover</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
            <span>📄</span>
            <span>A4 Auto-Grid & PDF</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
            <span>✨</span>
            <span>Skin Smoothing</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
            <span>🇧🇩</span>
            <span>Bangladesh Passport (35×45mm)</span>
          </span>
        </div>

        <button
          type="button"
          onClick={handleLoadDemoPhoto}
          disabled={isProcessing}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold shadow-md transition hover:scale-105 disabled:opacity-50 text-xs"
        >
          <span>✨</span>
          <span>{language === 'bn' ? 'ডেমো ছবি দিয়ে ফুল ফিচার টেস্ট করুন' : 'Load Demo (Test All Features)'}</span>
        </button>
      </div>

      {/* Responsive 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Studio Controls & Configuration (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6 no-print">
          {/* Section 1: Upload */}
          <UploadSection
            language={language}
            queue={queue}
            activeId={activeId}
            onSelectActive={setActiveId}
            onAddFiles={handleAddFiles}
            onRemoveItem={handleRemoveItem}
            onClearQueue={handleClearQueue}
            isProcessing={isProcessing}
            onLoadDemo={handleLoadDemoPhoto}
          />

          {/* Section 2: Photo Settings & Presets */}
          <PhotoSettings
            language={language}
            presets={presets}
            settings={photoSettings}
            onChange={(updates) => setPhotoSettings((prev) => ({ ...prev, ...updates }))}
            onOpenManualCrop={() => setIsCropModalOpen(true)}
            onAutoAlign={() => setPhotoSettings((prev) => ({ ...prev, auto_align: true }))}
          />

          {/* Section 3: Background Removal & Replacement */}
          <BackgroundSelector
            language={language}
            settings={photoSettings}
            onChange={(updates) => setPhotoSettings((prev) => ({ ...prev, ...updates }))}
          />

          {/* Section 4: Enhancement */}
          <EnhancementControls
            language={language}
            settings={photoSettings}
            onChange={(updates) => setPhotoSettings((prev) => ({ ...prev, ...updates }))}
            onReset={() =>
              setPhotoSettings((prev) => ({
                ...prev,
                brightness: 0,
                contrast: 0,
                sharpness: 0,
                saturation: 0,
                exposure: 0,
                auto_enhance: true,
                smooth_skin: true,
              }))
            }
          />

          {/* Section 5: A4 Layout Controls */}
          <A4LayoutControls
            language={language}
            settings={a4Settings}
            onChange={(updates) => {
              const updated = { ...a4Settings, ...updates };
              setA4Settings(updated);
              if (activeItem?.processedResult) {
                updateA4Preview(activeItem.processedResult.file_id, updated);
              }
            }}
            onAutoFit={handleAutoFitA4}
            warning={a4Preview?.warning}
          />

          {/* Section 6: Export & Print */}
          <ExportSection
            language={language}
            canExport={hasProcessed}
            isProcessing={isProcessing}
            onGeneratePhoto={handleProcessActive}
            onGenerateA4Sheet={() => {
              if (activeItem?.processedResult) {
                updateA4Preview(activeItem.processedResult.file_id, a4Settings);
                setActiveTab('a4');
              }
            }}
            onDownloadJpg={handleDownloadSingleJpg}
            onDownloadPng={handleDownloadSinglePng}
            onDownloadA4Jpg={handleDownloadA4Jpg}
            onDownloadA4Pdf={handleDownloadA4Pdf}
            onDownloadZip={handleDownloadZip}
            onPrintA4={handlePrintA4}
            onLoadDemo={handleLoadDemoPhoto}
          />
        </div>

        {/* Right Column: Interactive Live Previews (5 cols on lg, sticky on desktop) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20 no-print">
          {/* Tab selector */}
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/80 shadow-md">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'single'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.tabSingle}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('a4')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'a4'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.tabA4}
            </button>
          </div>

          {/* Preview Canvas Panels */}
          {activeTab === 'single' ? (
            <PhotoPreview
              language={language}
              processed={activeItem?.processedResult}
              originalPreview={activeItem?.previewUrl}
              isProcessing={isProcessing}
              onDownloadJpg={handleDownloadSingleJpg}
              onDownloadPng={handleDownloadSinglePng}
              onLoadDemo={handleLoadDemoPhoto}
            />
          ) : (
            <A4SheetPreview
              language={language}
              previewData={a4Preview}
              isLoading={isLayoutLoading}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {/* Hidden printable area dedicated for exact 100% scale print dialog */}
      {a4Preview?.page_preview_url && (
        <div className="print-only">
          <img
            src={a4Preview.page_preview_url}
            alt="Printable A4 Sheet"
            className="print-sheet-img"
          />
        </div>
      )}

      {/* Manual Crop & Framing Modal */}
      <ManualCropModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageUrl={activeItem?.previewUrl}
        initialSettings={photoSettings.manual_crop}
        aspectRatio={photoSettings.photo_width_mm / photoSettings.photo_height_mm}
        onApply={(cropSettings) => {
          setPhotoSettings((prev) => ({
            ...prev,
            manual_crop: cropSettings,
            auto_align: false,
          }));
        }}
        language={language}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={studioSettings}
        presets={presets}
        onSave={handleSaveStudioSettings}
        language={language}
      />
    </AppLayout>
  );
};
