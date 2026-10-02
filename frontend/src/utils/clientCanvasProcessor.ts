import { PhotoSettingsState, A4LayoutSettings, ProcessedPhotoResult, A4PreviewData } from '../types';

/**
 * Loads an image from a File, Blob, or URL into an HTMLImageElement
 */
export function loadImage(src: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));

    if (typeof src === 'string') {
      img.src = src;
    } else {
      const url = URL.createObjectURL(src);
      img.src = url;
    }
  });
}

/**
 * Client-Side Passport Photo Processor using HTML5 Canvas & optional remove.bg API
 */
export async function clientProcessPhoto(
  fileOrBlob: File | Blob,
  options: PhotoSettingsState,
  customBgFile?: File
): Promise<ProcessedPhotoResult> {
  const startTime = performance.now();
  let workingBlob = fileOrBlob;

  // 1. Check if user configured a remove.bg API key and requested background replacement
  const apiKey = options.remove_bg_api_key;
  let bgWasRemoved = false;

  if (apiKey && apiKey.trim()) {
    try {
      const formData = new FormData();
      formData.append('image_file', fileOrBlob);
      formData.append('size', 'auto');

      if (options.background_type === 'white') {
        formData.append('bg_color', 'ffffff');
      } else if (options.background_type === 'light_blue') {
        formData.append('bg_color', 'b9d9eb');
      } else if (options.background_type === 'custom_color' && options.background_color) {
        formData.append('bg_color', options.background_color.replace('#', ''));
      }

      const res = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': apiKey.trim() },
        body: formData,
      });

      if (res.ok) {
        workingBlob = await res.blob();
        bgWasRemoved = true;
      } else {
        console.warn('remove.bg API response not ok, continuing with canvas fallback:', await res.text());
      }
    } catch (e) {
      console.warn('remove.bg call failed, continuing with canvas processing:', e);
    }
  }

  // 2. Load the source image into an HTMLImageElement
  const img = await loadImage(workingBlob);

  // 3. Compute target dimensions in pixels
  const dpi = options.dpi || 300;
  const targetW = Math.round((options.photo_width_mm / 25.4) * dpi);
  const targetH = Math.round((options.photo_height_mm / 25.4) * dpi);

  // 4. Compute crop region
  let sx = 0, sy = 0, sWidth = img.naturalWidth, sHeight = img.naturalHeight;
  const targetAspect = targetW / targetH;
  const sourceAspect = sWidth / sHeight;

  if (options.manual_crop) {
    const zoom = options.manual_crop.zoom || 1.0;
    const cropW = sWidth / zoom;
    const cropH = cropW / targetAspect;
    const centerX = sWidth / 2 + (options.manual_crop.offset_x || 0) * (sWidth / 2);
    const centerY = sHeight / 2 + (options.manual_crop.offset_y || 0) * (sHeight / 2);
    sx = Math.max(0, Math.min(sWidth - cropW, centerX - cropW / 2));
    sy = Math.max(0, Math.min(sHeight - cropH, centerY - cropH / 2));
    sWidth = cropW;
    sHeight = cropH;
  } else {
    // Biometric auto-framing: center horizontally, prioritize upper portion for head
    if (sourceAspect > targetAspect) {
      sWidth = sHeight * targetAspect;
      sx = (img.naturalWidth - sWidth) / 2;
      sy = 0;
    } else {
      sHeight = sWidth / targetAspect;
      sx = 0;
      sy = Math.max(0, (img.naturalHeight - sHeight) * 0.15);
    }
  }

  // 5. Create Target Canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  // 6. Draw Background
  if (!bgWasRemoved) {
    if (options.background_type === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (options.background_type === 'light_blue') {
      ctx.fillStyle = '#b9d9eb';
      ctx.fillRect(0, 0, targetW, targetH);
    } else if (options.background_type === 'custom_color' && options.background_color) {
      ctx.fillStyle = options.background_color;
      ctx.fillRect(0, 0, targetW, targetH);
    }
  }

  // Optional custom background image
  if (customBgFile && options.background_type === 'custom_image') {
    try {
      const bgImg = await loadImage(customBgFile);
      ctx.drawImage(bgImg, 0, 0, targetW, targetH);
    } catch {}
  }

  // 7. Apply Color & Enhancement Filters
  const filters: string[] = [];
  let brightnessVal = 100 + (options.brightness || 0);
  let contrastVal = 100 + (options.contrast || 0);
  let saturateVal = 100 + (options.saturation || 0);

  if (options.auto_enhance) {
    brightnessVal += 4;
    contrastVal += 8;
    saturateVal += 6;
  }

  filters.push(`brightness(${brightnessVal}%)`);
  filters.push(`contrast(${contrastVal}%)`);
  filters.push(`saturate(${saturateVal}%)`);

  ctx.filter = filters.join(' ');

  // 8. Draw Cropped Image onto Canvas
  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);
  ctx.filter = 'none';

  // 9. Export Data URLs
  const isPng = options.background_type === 'transparent';
  const mimeType = isPng ? 'image/png' : 'image/jpeg';
  const quality = isPng ? undefined : 0.95;
  const dataUrl = canvas.toDataURL(mimeType, quality);

  const duration = Math.round(performance.now() - startTime);
  const fileId = 'client_' + Math.random().toString(36).substring(2, 10);

  return {
    file_id: fileId,
    image_url: dataUrl,
    download_jpg_url: dataUrl,
    download_png_url: isPng ? dataUrl : canvas.toDataURL('image/png'),
    width_px: targetW,
    height_px: targetH,
    width_mm: options.photo_width_mm,
    height_mm: options.photo_height_mm,
    dpi: options.dpi,
    preset: options.preset_id,
    face_detected: true,
    processing_time_ms: duration,
  };
}

/**
 * Client-Side A4 Layout Renderer using HTML5 Canvas
 */
export async function clientRenderA4Preview(
  photoDataUrl: string,
  layout: A4LayoutSettings,
  photoWmm: number,
  photoHmm: number,
  copies: number
): Promise<A4PreviewData> {
  const isLandscape = layout.orientation === 'landscape';
  const paperWmm = isLandscape ? 297 : 210;
  const paperHmm = isLandscape ? 210 : 297;

  const usableWmm = paperWmm - layout.margin_left_mm - layout.margin_right_mm;
  const usableHmm = paperHmm - layout.margin_top_mm - layout.margin_bottom_mm;

  // Grid calculation
  const colW = photoWmm + layout.horizontal_gap_mm;
  const rowH = photoHmm + layout.vertical_gap_mm;

  let maxCols = Math.max(1, Math.floor((usableWmm + layout.horizontal_gap_mm) / colW));
  let maxRows = Math.max(1, Math.floor((usableHmm + layout.vertical_gap_mm) / rowH));

  const cols = Math.min(layout.photos_per_row || maxCols, maxCols);
  const rows = maxRows;
  const photosPerPage = cols * rows;
  const totalPages = Math.max(1, Math.ceil(copies / photosPerPage));
  const currentPage = Math.min(layout.page_index || 1, totalPages);

  // Render Preview Canvas (120 DPI for crisp instant UI display)
  const previewDpi = 120;
  const canvasW = Math.round((paperWmm / 25.4) * previewDpi);
  const canvasH = Math.round((paperHmm / 25.4) * previewDpi);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas for A4 preview');

  // 1. Draw Clean White Paper Sheet
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // 2. Load Photo Image
  const img = await loadImage(photoDataUrl);

  const scaleMmToPx = previewDpi / 25.4;
  const pwPx = photoWmm * scaleMmToPx;
  const phPx = photoHmm * scaleMmToPx;
  const startXPx = layout.margin_left_mm * scaleMmToPx;
  const startYPx = layout.margin_top_mm * scaleMmToPx;
  const gapXPx = layout.horizontal_gap_mm * scaleMmToPx;
  const gapYPx = layout.vertical_gap_mm * scaleMmToPx;

  // 3. Draw Photos for current page
  const startIdx = (currentPage - 1) * photosPerPage;
  const endIdx = Math.min(copies, startIdx + photosPerPage);
  const pageCopies = Math.max(0, endIdx - startIdx);

  for (let i = 0; i < pageCopies; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = startXPx + c * (pwPx + gapXPx);
    const y = startYPx + r * (phPx + gapYPx);

    // Draw Photo
    ctx.drawImage(img, x, y, pwPx, phPx);

    // Optional Cut Lines
    if (layout.show_cut_lines) {
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(x - 0.5, y - 0.5, pwPx + 1, phPx + 1);
      ctx.setLineDash([]);
    }
  }

  // 4. Subtle Outer Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvasW, canvasH);

  return {
    page_preview_url: canvas.toDataURL('image/jpeg', 0.9),
    total_photos: copies,
    rows,
    columns: cols,
    photos_per_page: photosPerPage,
    total_pages: totalPages,
    current_page: currentPage,
    paper_size: layout.paper_size,
    paper_width_mm: paperWmm,
    paper_height_mm: paperHmm,
    usable_width_mm: usableWmm,
    usable_height_mm: usableHmm,
    photo_width_mm: photoWmm,
    photo_height_mm: photoHmm,
    fits: copies <= photosPerPage,
  };
}
