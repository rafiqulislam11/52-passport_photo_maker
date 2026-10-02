import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  AppLanguage,
  UploadItem,
  PhotoSettingsState,
  A4LayoutSettings,
  A4PreviewData,
  StudioSettings,
  PassportPreset,
  ProcessedPhotoResult,
  ManualCropSettings,
} from '../types';
import {
  DEFAULT_PRESETS,
  INITIAL_PHOTO_SETTINGS,
  INITIAL_A4_SETTINGS,
  INITIAL_STUDIO_SETTINGS,
} from '../utils/constants';
import {
  checkHealth,
  fetchPresets,
  uploadImage,
  processPhotoApi,
  generateA4PreviewApi,
  downloadA4SheetBlob,
  downloadPdfBlob,
  downloadZipBlob,
} from '../services/api';

export function usePassportStudio() {
  // Localization
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('ppm_lang');
    return saved === 'bn' ? 'bn' : 'en';
  });

  const handleLanguageChange = (lang: AppLanguage) => {
    setLanguage(lang);
    localStorage.setItem('ppm_lang', lang);
  };

  // Studio Settings
  const [studioSettings, setStudioSettings] = useState<StudioSettings>(() => {
    try {
      const saved = localStorage.getItem('ppm_settings');
      if (saved) return { ...INITIAL_STUDIO_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return INITIAL_STUDIO_SETTINGS;
  });

  const handleSaveStudioSettings = (newSettings: StudioSettings) => {
    setStudioSettings(newSettings);
    localStorage.setItem('ppm_settings', JSON.stringify(newSettings));
  };

  // API connectivity
  const [apiOnline, setApiOnline] = useState<boolean>(true);
  const [presets, setPresets] = useState<PassportPreset[]>(DEFAULT_PRESETS);

  // Upload queue & active selection
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Photo & A4 settings
  const [photoSettings, setPhotoSettings] = useState<PhotoSettingsState>(INITIAL_PHOTO_SETTINGS);
  const [a4Settings, setA4Settings] = useState<A4LayoutSettings>(INITIAL_A4_SETTINGS);
  const [a4Preview, setA4Preview] = useState<A4PreviewData | undefined>(undefined);

  // Loading flags & Modals
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLayoutLoading, setIsLayoutLoading] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'a4'>('single');
  const [statusMessage, setStatusMessage] = useState<string>('Ready');

  // Check backend health & fetch presets on mount
  useEffect(() => {
    let isMounted = true;
    checkHealth().then((online) => {
      if (isMounted) setApiOnline(online);
    });
    fetchPresets().then((data) => {
      if (isMounted && data.length > 0) setPresets(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeItem = queue.find((i) => i.id === activeId);

  // File Upload Handler
  const handleAddFiles = useCallback(async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    for (const file of fileList) {
      if (!file.type.startsWith('image/')) continue;

      const tempId = Math.random().toString(36).substring(2, 9);
      const localPreview = URL.createObjectURL(file);

      const newItem: UploadItem = {
        id: tempId,
        file,
        originalName: file.name,
        width: 0,
        height: 0,
        format: file.type.split('/')[1]?.toUpperCase() || 'JPG',
        sizeBytes: file.size,
        previewUrl: localPreview,
        status: 'uploading',
      };

      setQueue((prev) => [...prev, newItem]);
      setActiveId((curr) => curr || tempId);

      // Upload to backend API
      try {
        const uploadResult = await uploadImage(file);
        setQueue((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  id: uploadResult.file_id,
                  width: uploadResult.width,
                  height: uploadResult.height,
                  previewUrl: uploadResult.preview_url,
                  faceInfo: uploadResult.face_info,
                  status: 'idle',
                }
              : item
          )
        );
        setActiveId((curr) => (curr === tempId ? uploadResult.file_id : curr));
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? { ...item, status: 'error', errorMsg: err.message || 'Upload failed' }
              : item
          )
        );
      }
    }
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setQueue((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      if (activeId === id) {
        setActiveId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  }, [activeId]);

  const handleClearQueue = useCallback(() => {
    setQueue([]);
    setActiveId(null);
    setA4Preview(undefined);
  }, []);

  // Process Single Active Photo
  const handleProcessActive = useCallback(async () => {
    if (!activeId) return;
    setIsProcessing(true);
    setStatusMessage('Processing photo with AI...');

    try {
      const result = await processPhotoApi(
        activeId,
        photoSettings,
        photoSettings.custom_bg_file
      );

      setQueue((prev) =>
        prev.map((item) =>
          item.id === activeId
            ? { ...item, status: 'done', processedResult: result }
            : item
        )
      );

      setStatusMessage('Processed successfully!');

      // Automatically generate A4 preview after processing
      await updateA4Preview(result.file_id, a4Settings);

      // Confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {}
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message || 'Processing failed'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [activeId, photoSettings, a4Settings]);

  // Update A4 Layout Preview
  const updateA4Preview = useCallback(
    async (fileId: string, layout: A4LayoutSettings) => {
      setIsLayoutLoading(true);
      try {
        const preview = await generateA4PreviewApi(
          fileId,
          layout,
          photoSettings.photo_width_mm,
          photoSettings.photo_height_mm,
          layout.copies_count
        );
        setA4Preview(preview);
      } catch (err) {
        console.error('Failed to update A4 preview', err);
      } finally {
        setIsLayoutLoading(false);
      }
    },
    [photoSettings.photo_width_mm, photoSettings.photo_height_mm]
  );

  // Auto-fit A4 Layout
  const handleAutoFitA4 = useCallback(() => {
    const pw = a4Settings.paper_size === 'Letter' ? 215.9 : 210.0;
    const ph = a4Settings.paper_size === 'Letter' ? 279.4 : 297.0;
    const w = a4Settings.orientation === 'landscape' ? ph : pw;
    const usableW = w - a4Settings.margin_left_mm - a4Settings.margin_right_mm;
    const photoW = photoSettings.photo_width_mm;
    const gap = a4Settings.horizontal_gap_mm;

    const maxCols = Math.max(1, Math.min(10, Math.floor((usableW + gap) / (photoW + gap))));
    const newSettings = { ...a4Settings, photos_per_row: maxCols };
    setA4Settings(newSettings);

    if (activeItem?.processedResult) {
      updateA4Preview(activeItem.processedResult.file_id, newSettings);
    }
  }, [a4Settings, photoSettings.photo_width_mm, activeItem, updateA4Preview]);

  // Page change
  const handlePageChange = (newPage: number) => {
    const newSettings = { ...a4Settings, page_index: newPage };
    setA4Settings(newSettings);
    if (activeItem?.processedResult) {
      updateA4Preview(activeItem.processedResult.file_id, newSettings);
    }
  };

  // Downloads
  const handleDownloadSingleJpg = () => {
    if (!activeItem?.processedResult) return;
    const link = document.createElement('a');
    link.href = activeItem.processedResult.download_jpg_url;
    link.download = `passport-${activeItem.originalName.replace(/\.[^/.]+$/, '')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSinglePng = () => {
    if (!activeItem?.processedResult) return;
    const link = document.createElement('a');
    link.href = activeItem.processedResult.download_png_url;
    link.download = `passport-${activeItem.originalName.replace(/\.[^/.]+$/, '')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadA4Jpg = async () => {
    if (!activeItem?.processedResult) return;
    try {
      const blob = await downloadA4SheetBlob(
        activeItem.processedResult.file_id,
        a4Settings,
        photoSettings.photo_width_mm,
        photoSettings.photo_height_mm,
        a4Settings.copies_count,
        'jpg'
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `A4-Passport-Sheet-${activeItem.processedResult.preset}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Download failed');
    }
  };

  const handleDownloadA4Pdf = async () => {
    if (!activeItem?.processedResult) return;
    try {
      const blob = await downloadPdfBlob(
        activeItem.processedResult.file_id,
        a4Settings,
        photoSettings.photo_width_mm,
        photoSettings.photo_height_mm,
        a4Settings.copies_count
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Passport-Photos-A4-Print.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'PDF Download failed');
    }
  };

  const handleDownloadZip = async () => {
    const readyItems = queue.filter((i) => i.processedResult);
    if (readyItems.length === 0) return;

    try {
      const fileIds = readyItems.map((i) => i.processedResult!.file_id);
      const blob = await downloadZipBlob(
        fileIds,
        a4Settings,
        photoSettings.photo_width_mm,
        photoSettings.photo_height_mm,
        a4Settings.copies_count
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Passport-Photo-Maker-Package.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'ZIP Download failed');
    }
  };

  // Browser Print A4
  const handlePrintA4 = () => {
    window.print();
  };

  return {
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
    updateA4Preview,
    handleAutoFitA4,
    handlePageChange,
    handleDownloadSingleJpg,
    handleDownloadSinglePng,
    handleDownloadA4Jpg,
    handleDownloadA4Pdf,
    handleDownloadZip,
    handlePrintA4,
  };
}
