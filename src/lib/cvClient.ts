// Talks to the image worker (public/cv/worker.js), which runs OpenCV.js off the
// main thread. The worker is created the first time it is needed, in the
// browser only.
import type { Quad } from './geometry';
import type { Detection, RawImage } from './types';

type Pending = { resolve: (value: unknown) => void; reject: (reason: Error) => void };

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker('/cv/worker.js');
  worker.onmessage = (e: MessageEvent<{ id: number; ok: boolean; result?: unknown; error?: string }>) => {
    const p = pending.get(e.data.id);
    if (!p) return;
    pending.delete(e.data.id);
    if (e.data.ok) p.resolve(e.data.result);
    else p.reject(new Error(e.data.error ?? 'Image worker failed'));
  };
  worker.onerror = (e) => {
    const err = new Error(e.message || 'Image worker crashed');
    pending.forEach((p) => p.reject(err));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

function call<T>(message: Record<string, unknown>, transfer: Transferable[] = []): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    getWorker().postMessage({ ...message, id }, transfer);
  });
}

/** Starts loading OpenCV in the background so the first photo is quicker. */
export function warmUp() {
  getWorker();
}

export function detectCorners(image: RawImage): Promise<Detection> {
  return call<Detection>({ type: 'detect', image }, [image.data.buffer]);
}

/** Straightens the area inside `corners` (in pixels of `image`) into a width x height image. */
export function warp(image: RawImage, corners: Quad, width: number, height: number): Promise<RawImage> {
  return call<RawImage>({ type: 'warp', image, corners, width, height }, [image.data.buffer]);
}
