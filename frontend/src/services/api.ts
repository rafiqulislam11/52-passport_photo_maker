import { PhotoSettingsState, A4LayoutSettings, PassportPreset, ProcessedPhotoResult, A4PreviewData, UploadItem } from '../types';

const API_BASE = '/api';

export function getApiKey(): string {
  try {
    const saved = localStorage.getItem('ppm_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.apiKey || '';
    }
  } catch {
    // fallback
  }
  return '';
}

export function getRemoveBgApiKey(): string {
  try {
    const saved = localStorage.getItem('ppm_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.removeBgApiKey || '';
    }
  } catch {
    // fallback
  }
  return '';
}

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...customHeaders };
  const key = getApiKey();
  if (key) {
    headers['X-API-Key'] = key;
  }
  return headers;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { headers: getHeaders() });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchPresets(): Promise<PassportPreset[]> {
  try {
    const res = await fetch(`${API_BASE}/presets`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch presets');
    const json = await res.json();
    return json.data;
  } catch (e) {
    console.warn('Using local presets fallback:', e);
    return [];
  }
}

export async function uploadImage(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Upload failed');
  }
  return json.data;
}

export async function processPhotoApi(
  fileId: string,
  options: PhotoSettingsState,
  customBgFile?: File
): Promise<ProcessedPhotoResult> {
  const formData = new FormData();
  formData.append('file_id', fileId);

  const payload = {
    preset_id: options.preset_id,
    photo_width_mm: Number(options.photo_width_mm),
    photo_height_mm: Number(options.photo_height_mm),
    unit: options.unit,
    dpi: Number(options.dpi),
    background_type: options.background_type,
    background_color: options.background_color,
    auto_enhance: Boolean(options.auto_enhance),
    brightness: Number(options.brightness),
    contrast: Number(options.contrast),
    sharpness: Number(options.sharpness),
    saturation: Number(options.saturation),
    exposure: Number(options.exposure),
    smooth_skin: Boolean(options.smooth_skin),
    auto_align: Boolean(options.auto_align),
    manual_crop: options.manual_crop,
    remove_bg_api_key: options.remove_bg_api_key || getRemoveBgApiKey() || undefined,
  };

  formData.append('options_json', JSON.stringify(payload));
  if (customBgFile) {
    formData.append('custom_bg_file', customBgFile);
  }

  const res = await fetch(`${API_BASE}/process`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Processing failed');
  }
  return json.data;
}

export async function generateA4PreviewApi(
  fileId: string,
  layout: A4LayoutSettings,
  photoW: number,
  photoH: number,
  copies: number
): Promise<A4PreviewData> {
  const formData = new FormData();
  if (fileId) formData.append('file_id', fileId);
  formData.append('layout_json', JSON.stringify(layout));
  formData.append('photo_w_mm', String(photoW));
  formData.append('photo_h_mm', String(photoH));
  formData.append('copies_count', String(copies));

  const res = await fetch(`${API_BASE}/a4-preview`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Preview generation failed');
  }
  return json.data;
}

export async function downloadA4SheetBlob(
  fileId: string,
  layout: A4LayoutSettings,
  photoW: number,
  photoH: number,
  copies: number,
  fmt: 'jpg' | 'png' = 'jpg'
): Promise<Blob> {
  const formData = new FormData();
  formData.append('file_id', fileId);
  formData.append('layout_json', JSON.stringify(layout));
  formData.append('photo_w_mm', String(photoW));
  formData.append('photo_h_mm', String(photoH));
  formData.append('copies_count', String(copies));
  formData.append('fmt', fmt);

  const res = await fetch(`${API_BASE}/a4-sheet`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'A4 Sheet download failed');
  }
  return await res.blob();
}

export async function downloadPdfBlob(
  fileId: string,
  layout: A4LayoutSettings,
  photoW: number,
  photoH: number,
  copies: number
): Promise<Blob> {
  const formData = new FormData();
  formData.append('file_id', fileId);
  formData.append('layout_json', JSON.stringify(layout));
  formData.append('photo_w_mm', String(photoW));
  formData.append('photo_h_mm', String(photoH));
  formData.append('copies_count', String(copies));

  const res = await fetch(`${API_BASE}/export/pdf`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'PDF export failed');
  }
  return await res.blob();
}

export async function downloadZipBlob(
  fileIds: string[],
  layout: A4LayoutSettings,
  photoW: number,
  photoH: number,
  copies: number
): Promise<Blob> {
  const formData = new FormData();
  formData.append('file_ids_json', JSON.stringify(fileIds));
  formData.append('layout_json', JSON.stringify(layout));
  formData.append('photo_w_mm', String(photoW));
  formData.append('photo_h_mm', String(photoH));
  formData.append('copies_count', String(copies));

  const res = await fetch(`${API_BASE}/export/zip`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'ZIP export failed');
  }
  return await res.blob();
}
