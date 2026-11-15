'use client';

// The few choices GallerySnap remembers on this device (the Settings panel).
import { useSyncExternalStore } from 'react';

export type Settings = {
  /** Find the corners automatically. Off: the user places them by hand. */
  findCorners: boolean;
};

const KEY = 'gallerysnap.settings';
const DEFAULTS: Settings = { findCorners: true };

let cache: Settings | null = null;
const listeners = new Set<() => void>();

function read(): Settings {
  if (cache) return cache;
  cache = DEFAULTS;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (saved && typeof saved === 'object') cache = { findCorners: saved.findCorners !== false };
  } catch {
    // Private browsing, or nothing saved yet: use the defaults.
  }
  return cache;
}

export function changeSettings(changes: Partial<Settings>) {
  cache = { ...read(), ...changes };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Can't be remembered; it still applies until the page is closed.
  }
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, read, () => DEFAULTS);
}
