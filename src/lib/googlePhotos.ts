// Saving to Google Photos, straight from the browser.
//
// The user signs in with their own Google account in a Google pop-up. We get a
// short-lived access token that can only ADD photos (and see the album this app
// made). Pictures are uploaded from the browser directly to Google; they never
// pass through the GallerySnap server.
import { outputFilename } from './filenames';

export const ALBUM_TITLE = 'GallerySnap';
const SCOPES = [
  // Add photos and create albums. Cannot see or change the user's library.
  'https://www.googleapis.com/auth/photoslibrary.appendonly',
  // See only what this app created, so we can find the "GallerySnap" album again.
  'https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata',
].join(' ');
const API = 'https://photoslibrary.googleapis.com/v1';
const ALBUM_KEY = 'gallerysnap.albumId';

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
export const googlePhotosAvailable = GOOGLE_CLIENT_ID.length > 0;

type TokenResponse = { access_token?: string; expires_in?: number; error?: string; error_description?: string };
type TokenClient = { requestAccessToken: (options?: { prompt?: string }) => void };
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
            error_callback?: (error: { type: string; message?: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

export class GooglePhotosError extends Error {
  constructor(
    message: string,
    /** "cancelled": the user closed the sign-in window. */
    public kind: 'cancelled' | 'blocked' | 'failed' = 'failed',
  ) {
    super(message);
  }
}

let scriptPromise: Promise<void> | null = null;
/** Loads Google's sign-in script. Call early so the pop-up can open on click. */
export function loadGoogleScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new GooglePhotosError('Could not reach Google. Check your internet connection and try again.'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

let token: { value: string; expires: number } | null = null;

/**
 * Opens the Google sign-in window (if needed). Call this FIRST in a click
 * handler, before any slow work, or browsers will block the pop-up.
 */
export function signIn(): Promise<string> {
  if (!googlePhotosAvailable) return Promise.reject(new GooglePhotosError('Google Photos is not set up for this site yet.'));
  if (token && token.expires > Date.now() + 60_000) return Promise.resolve(token.value);
  return new Promise<string>((resolve, reject) => {
    const oauth = window.google?.accounts?.oauth2;
    if (!oauth) return reject(new GooglePhotosError('Google sign-in is still loading. Please try again in a moment.'));
    const client = oauth.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (r) => {
        if (r.access_token) {
          token = { value: r.access_token, expires: Date.now() + (r.expires_in ?? 3600) * 1000 };
          resolve(r.access_token);
        } else {
          reject(new GooglePhotosError('Google did not allow saving. Nothing was saved.', 'cancelled'));
        }
      },
      error_callback: (e) => {
        if (e.type === 'popup_failed_to_open') {
          reject(new GooglePhotosError('Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.', 'blocked'));
        } else {
          reject(new GooglePhotosError('Sign-in was closed. Nothing was saved.', 'cancelled'));
        }
      },
    });
    client.requestAccessToken();
  });
}

async function api<T>(accessToken: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json', ...init.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new GooglePhotosError(`Google Photos said no (${res.status}). ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

type Album = { id: string; title?: string; productUrl?: string };

async function findOrCreateAlbum(accessToken: string): Promise<Album> {
  // 1. The album we used last time on this device.
  const saved = localStorage.getItem(ALBUM_KEY);
  if (saved) {
    try {
      return await api<Album>(accessToken, `/albums/${encodeURIComponent(saved)}`);
    } catch {
      localStorage.removeItem(ALBUM_KEY); // deleted, or a different Google account
    }
  }
  // 2. An album this app made earlier (maybe on another device).
  try {
    let pageToken = '';
    do {
      const page = await api<{ albums?: Album[]; nextPageToken?: string }>(
        accessToken,
        `/albums?pageSize=50&excludeNonAppCreatedData=true${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`,
      );
      const found = page.albums?.find((a) => a.title === ALBUM_TITLE);
      if (found) {
        localStorage.setItem(ALBUM_KEY, found.id);
        return found;
      }
      pageToken = page.nextPageToken ?? '';
    } while (pageToken);
  } catch {
    // Listing is a nicety. If it fails we simply make a new album.
  }
  // 3. A new album.
  const created = await api<Album>(accessToken, '/albums', { method: 'POST', body: JSON.stringify({ album: { title: ALBUM_TITLE } }) });
  localStorage.setItem(ALBUM_KEY, created.id);
  return created;
}

async function uploadBytes(accessToken: string, blob: Blob): Promise<string> {
  const res = await fetch(`${API}/uploads`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/octet-stream',
      'x-goog-upload-content-type': 'image/jpeg',
      'x-goog-upload-protocol': 'raw',
    },
    body: blob,
  });
  if (!res.ok) throw new GooglePhotosError(`Upload to Google Photos failed (${res.status}).`);
  return res.text();
}

export type SavedPhoto = { originalName: string; url: string | null };
export type SaveResult = { albumUrl: string | null; photos: SavedPhoto[] };

/** Saves pictures into the user's "GallerySnap" album. Call signIn() first. */
export async function saveToGooglePhotos(
  files: { blob: Blob; originalName: string }[],
  onProgress?: (done: number, total: number) => void,
): Promise<SaveResult> {
  if (!googlePhotosAvailable) throw new GooglePhotosError('Google Photos is not set up for this site yet.');
  const accessToken = await signIn();
  const album = await findOrCreateAlbum(accessToken);

  const uploaded: { uploadToken: string; originalName: string }[] = [];
  for (let i = 0; i < files.length; i++) {
    uploaded.push({ uploadToken: await uploadBytes(accessToken, files[i].blob), originalName: files[i].originalName });
    onProgress?.(i + 1, files.length);
  }

  const photos: SavedPhoto[] = [];
  // Google accepts at most 50 new items per request.
  for (let i = 0; i < uploaded.length; i += 50) {
    const batch = uploaded.slice(i, i + 50);
    const res = await api<{ newMediaItemResults?: { status?: { message?: string }; mediaItem?: { productUrl?: string } }[] }>(
      accessToken,
      '/mediaItems:batchCreate',
      {
        method: 'POST',
        body: JSON.stringify({
          albumId: album.id,
          newMediaItems: batch.map((u) => ({
            description: 'Straightened with GallerySnap',
            simpleMediaItem: { uploadToken: u.uploadToken, fileName: outputFilename(u.originalName) },
          })),
        }),
      },
    );
    (res.newMediaItemResults ?? []).forEach((r, k) => {
      if (!r.mediaItem) throw new GooglePhotosError(`Google Photos could not save "${batch[k].originalName}".`);
      photos.push({ originalName: batch[k].originalName, url: r.mediaItem.productUrl ?? null });
    });
  }
  return { albumUrl: album.productUrl ?? null, photos };
}
