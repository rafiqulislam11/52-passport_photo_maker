export type AppLanguage = 'en' | 'bn';
export type AppTheme = 'dark' | 'light';

export interface PassportPreset {
  id: string;
  name: string;
  country: string;
  width_mm: number;
  height_mm: number;
  unit: 'mm' | 'inch' | 'px';
  default_dpi: number;
  description: string;
}

export interface ManualCropSettings {
  zoom: number;
  offset_x: number;
  offset_y: number;
  rotation: number;
}

export interface FaceDetectionInfo {
  detected: boolean;
  box?: [number, number, number, number];
  eyes?: [number, number][];
  headroom_pct?: number;
  face_height_pct?: number;
  is_centered?: boolean;
}

export interface ProcessedPhotoResult {
  file_id: string;
  image_url: string;
  download_jpg_url: string;
  download_png_url: string;
  width_px: number;
  height_px: number;
  width_mm: number;
  height_mm: number;
  dpi: number;
  preset: string;
  face_detected: boolean;
  processing_time_ms: number;
}

export interface UploadItem {
  id: string;
  file?: File;
  originalName: string;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
  previewUrl: string;
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  errorMsg?: string;
  faceInfo?: FaceDetectionInfo;
  processedResult?: ProcessedPhotoResult;
}

export type BackgroundType = 'white' | 'light_blue' | 'custom_color' | 'custom_image' | 'transparent';

export interface PhotoSettingsState {
  preset_id: string;
  photo_width_mm: number;
  photo_height_mm: number;
  unit: 'mm' | 'inch' | 'px';
  dpi: number;
  background_type: BackgroundType;
  background_color: string;
  custom_bg_file?: File;
  custom_bg_preview?: string;
  auto_enhance: boolean;
  brightness: number;
  contrast: number;
  sharpness: number;
  saturation: number;
  exposure: number;
  smooth_skin: boolean;
  auto_align: boolean;
  manual_crop?: ManualCropSettings;
  remove_bg_api_key?: string;
}

export type PaperSize = 'A4' | 'A5' | 'Letter';
export type PaperOrientation = 'portrait' | 'landscape';

export interface A4LayoutSettings {
  paper_size: PaperSize;
  orientation: PaperOrientation;
  photos_per_row: number;
  horizontal_gap_mm: number;
  vertical_gap_mm: number;
  margin_top_mm: number;
  margin_bottom_mm: number;
  margin_left_mm: number;
  margin_right_mm: number;
  dpi: number;
  show_cut_lines: boolean;
  copies_count: number;
  page_index: number;
}

export interface A4PreviewData {
  page_preview_url: string;
  total_photos: number;
  rows: number;
  columns: number;
  photos_per_page: number;
  total_pages: number;
  current_page: number;
  paper_size: string;
  paper_width_mm: number;
  paper_height_mm: number;
  usable_width_mm: number;
  usable_height_mm: number;
  photo_width_mm: number;
  photo_height_mm: number;
  fits: boolean;
  warning?: string;
}

export interface StudioSettings {
  defaultPreset: string;
  defaultBackground: BackgroundType;
  defaultDpi: number;
  defaultPhotosPerRow: number;
  defaultGap: number;
  defaultMargin: number;
  autoEnhance: boolean;
  autoAlign: boolean;
  outputFormat: 'jpg' | 'png';
  apiKey: string;
  removeBgApiKey?: string;
}
