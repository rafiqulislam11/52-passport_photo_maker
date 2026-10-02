import { PhotoSettingsState, A4LayoutSettings, PassportPreset, ProcessedPhotoResult, A4PreviewData, UploadItem } from '../types';
import { clientProcessPhoto, clientRenderA4Preview, loadImage } from '../utils/clientCanvasProcessor';

export function getApiBase(): string {
  try {
    const saved = localStorage.getItem('ppm_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.backendUrl && parsed.backendUrl.trim()) {
        return parsed.backendUrl.trim().replace(/\/+$/, '') + '/api';
      }
    }
  } catch {}
  return '/api';
}

export function getApiKey(): string {
  try {
    const saved = localStorage.getItem('ppm_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.apiKey || '';
    }
  } catch {}
  return '';
}

export function getRemoveBgApiKey(): string {
  try {
    const saved = localStorage.getItem('ppm_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.removeBgApiKey || '';
    }
  } catch {}
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
    const res = await fetch(`${getApiBase()}/health`, { headers: getHeaders() });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchPresets(): Promise<PassportPreset[]> {
  try {
    const res = await fetch(`${getApiBase()}/presets`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch presets');
    const json = await res.json();
    return json.data;
  } catch (e) {
    console.warn('Using local presets fallback:', e);
    return [];
  }
}

export async function uploadImage(file: File): Promise<any> {
  // Try backend first if online
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${getApiBase()}/upload`, {
      method: 'POST',
      headers: getHeaders(),
      body: formData,
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success) return json.data;
    }
  } catch (e) {
    console.warn('Backend upload unavailable, using client-side loader:', e);
  }

  // Client-side fallback for GitHub Pages / offline mode
  const img = await loadImage(file);
  const fileId = 'client_' + Math.random().toString(36).substring(2, 9);
  const localUrl = URL.createObjectURL(file);

  return {
    file_id: fileId,
    filename: file.name,
    original_name: file.name,
    width: img.naturalWidth || 800,
    height: img.naturalHeight || 1000,
    format: file.type.split('/')[1]?.toUpperCase() || 'JPG',
    size_bytes: file.size,
    preview_url: localUrl,
    face_info: {
      detected: true,
      box: [
        Math.round((img.naturalWidth || 800) * 0.2),
        Math.round((img.naturalHeight || 1000) * 0.1),
        Math.round((img.naturalWidth || 800) * 0.6),
        Math.round((img.naturalHeight || 1000) * 0.7),
      ],
      headroom_pct: 10,
      face_height_pct: 75,
      is_centered: true,
    },
  };
}

export async function processPhotoApi(
  fileId: string,
  options: PhotoSettingsState,
  customBgFile?: File,
  sourceFileOrBlob?: File | Blob
): Promise<ProcessedPhotoResult> {
  // If not a client-only file, attempt backend processing
  if (!fileId.startsWith('client_')) {
    try {
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

      const res = await fetch(`${getApiBase()}/process`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch (e) {
      console.warn('Backend process unavailable, using client canvas processing:', e);
    }
  }

  // Client-side fallback processing
  if (sourceFileOrBlob) {
    const optsWithKey = {
      ...options,
      remove_bg_api_key: options.remove_bg_api_key || getRemoveBgApiKey() || undefined,
    };
    return await clientProcessPhoto(sourceFileOrBlob, optsWithKey, customBgFile);
  }

  throw new Error('Image source file not found for processing');
}

export async function generateA4PreviewApi(
  fileId: string,
  layout: A4LayoutSettings,
  photoW: number,
  photoH: number,
  copies: number,
  fallbackPhotoUrl?: string
): Promise<A4PreviewData> {
  if (!fileId.startsWith('client_')) {
    try {
      const formData = new FormData();
      if (fileId) formData.append('file_id', fileId);
      formData.append('layout_json', JSON.stringify(layout));
      formData.append('photo_w_mm', String(photoW));
      formData.append('photo_h_mm', String(photoH));
      formData.append('copies_count', String(copies));

      const res = await fetch(`${getApiBase()}/a4-preview`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch (e) {
      console.warn('Backend A4 preview unavailable, using client-side renderer:', e);
    }
  }

  // Client-side fallback A4 canvas rendering
  if (fallbackPhotoUrl) {
    return await clientRenderA4Preview(fallbackPhotoUrl, layout, photoW, photoH, copies);
  }

  throw new Error('Photo preview image not available for A4 rendering');
}

export async function downloadA4SheetBlob(
  fileId: string,
  layout: A4LayoutSettings,
  photoW: number,
  photoH: number,
  copies: number,
  fmt: 'jpg' | 'png' = 'jpg',
  fallbackPhotoUrl?: string
): Promise<Blob> {
  if (!fileId.startsWith('client_')) {
    try {
      const formData = new FormData();
      formData.append('file_id', fileId);
      formData.append('layout_json', JSON.stringify(layout));
      formData.append('photo_w_mm', String(photoW));
      formData.append('photo_h_mm', String(photoH));
      formData.append('copies_count', String(copies));
      formData.append('fmt', fmt);

      const res = await fetch(`${getApiBase()}/a4-sheet`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });

      if (res.ok) {
        return await res.blob();
      }
    } catch (e) {
      console.warn('Backend A4 sheet download unavailable, falling back to client export:', e);
    }
  }

  if (fallbackPhotoUrl) {
    const preview = await clientRenderA4Preview(fallbackPhotoUrl, layout, photoW, photoH, copies);
    const resp = await fetch(preview.page_preview_url);
    return await resp.blob();
  }

  throw new Error('A4 Sheet download failed');
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

  const res = await fetch(`${getApiBase()}/export/pdf`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'PDF export failed. Use Direct Print (Ctrl+P) on browser.');
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

  const res = await fetch(`${getApiBase()}/export/zip`, {
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
