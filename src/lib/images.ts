// Loading photos and moving pixels between files, canvases and the worker.
import type { RawImage } from './types';

/** Largest photo we keep in memory, in pixels. Bigger photos are scaled down. */
const MAX_PIXELS = 24_000_000;
const PREVIEW_SIDE = 1600;

const isHeic = (file: File) => /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

export const ACCEPTED_TYPES = 'image/jpeg,image/png,image/heic,image/heif,.jpg,.jpeg,.png,.heic,.heif';

export function isAcceptedFile(file: File): boolean {
  return /^image\/(jpeg|png|hei[cf])$/i.test(file.type) || /\.(jpe?g|png|hei[cf])$/i.test(file.name);
}

/** Decodes a photo, upright (respects the camera's rotation tag). */
export async function decodePhoto(file: File): Promise<ImageBitmap> {
  let source: Blob = file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  } catch (err) {
    // Most browsers can't read HEIC (iPhone photos) on their own. Convert first.
    if (!isHeic(file)) throw err;
    const { default: heic2any } = await import('heic2any');
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 });
    source = Array.isArray(converted) ? converted[0] : converted;
    bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  }
  const pixels = bitmap.width * bitmap.height;
  if (pixels > MAX_PIXELS) {
    const scale = Math.sqrt(MAX_PIXELS / pixels);
    const smaller = await createImageBitmap(bitmap, {
      resizeWidth: Math.round(bitmap.width * scale),
      resizeHeight: Math.round(bitmap.height * scale),
      resizeQuality: 'high',
    });
    bitmap.close();
    bitmap = smaller;
  }
  return bitmap;
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function fit(width: number, height: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Pixels of the photo, scaled so the longest side is at most `maxSide`. */
export function getPixels(bitmap: ImageBitmap, maxSide = Infinity): RawImage {
  const { width, height } = fit(bitmap.width, bitmap.height, maxSide);
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  const img = ctx.getImageData(0, 0, width, height);
  canvas.width = canvas.height = 0; // free memory early (matters on iPhones)
  return { data: img.data, width, height };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not save the image'))), 'image/jpeg', quality);
  });
}

export async function pixelsToJpeg(image: RawImage, quality = 0.95): Promise<Blob> {
  const canvas = makeCanvas(image.width, image.height);
  // Copy into a fresh array: ImageData needs a plain ArrayBuffer.
  const data = new ImageData(new Uint8ClampedArray(image.data), image.width, image.height);
  canvas.getContext('2d')!.putImageData(data, 0, 0);
  const blob = await canvasToBlob(canvas, quality);
  canvas.width = canvas.height = 0;
  return blob;
}

/** A screen-sized JPEG of the photo, as an object URL. */
export async function makePreviewUrl(bitmap: ImageBitmap): Promise<string> {
  const { width, height } = fit(bitmap.width, bitmap.height, PREVIEW_SIDE);
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await canvasToBlob(canvas, 0.9);
  canvas.width = canvas.height = 0;
  return URL.createObjectURL(blob);
}

/** A small JPEG of the photo as base64, for the AI helper. */
export async function makeSmallJpegBase64(bitmap: ImageBitmap, maxSide = 1024): Promise<string> {
  const { width, height } = fit(bitmap.width, bitmap.height, maxSide);
  const canvas = makeCanvas(width, height);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  const url = canvas.toDataURL('image/jpeg', 0.8);
  canvas.width = canvas.height = 0;
  return url.slice(url.indexOf(',') + 1);
}
