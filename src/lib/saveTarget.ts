'use client';

// Where "Download" really puts the picture on this device.
//  - 'photos': iPhone and iPad. A plain download lands in the Files app, so we
//    open the share sheet instead, whose "Save Image" puts it in Photos.
//  - 'phone': other phones and tablets (Android). Downloads already show up in
//    the gallery's Download album, so we save each picture on its own (a zip
//    would not show up there).
//  - 'download': computers. A normal download (a zip for several).
import { useSyncExternalStore } from 'react';

export type SaveTarget = 'photos' | 'phone' | 'download';

function isAppleTouch(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function saveTarget(): SaveTarget {
  if (typeof window === 'undefined') return 'download';
  if (isAppleTouch() && typeof navigator.share === 'function') return 'photos';
  if (window.matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0) return 'phone';
  return 'download';
}

const noop = () => () => {};
export function useSaveTarget(): SaveTarget {
  return useSyncExternalStore(noop, saveTarget, () => 'download');
}

export const SAVE_LABEL: Record<SaveTarget, { one: string; all: string }> = {
  photos: { one: 'Save', all: 'Save all' },
  phone: { one: 'Save', all: 'Save all' },
  download: { one: 'Download', all: 'Download all' },
};

/** What to say once the picture (or pictures) are saved. */
export const SAVED_TEXT: Record<SaveTarget, (filename: string) => string> = {
  photos: () => 'Saved. You’ll find it in your Photos app.',
  phone: (f) => `Saved as ${f}. It’s in your gallery’s Download album.`,
  download: (f) => `Downloaded as ${f}. Look in your Downloads folder.`,
};

export const SAVED_ALL_TEXT: Record<SaveTarget, string> = {
  photos: 'Saved. You’ll find them in your Photos app.',
  phone: 'Saved. They’re in your gallery’s Download album.',
  download: 'Downloaded as gallerysnap-paintings.zip. Look in your Downloads folder.',
};
