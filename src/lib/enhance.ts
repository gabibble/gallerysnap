// "Enhance": a gentle automatic levels and colour-balance fix.
//
// Photos of paintings taken indoors are often a little dull and tinted by the
// room's light (yellow bulbs, blue daylight). For each colour channel we find
// the darkest and brightest values the picture really uses and stretch them a
// bit towards full black and full white. Stretching each channel separately
// also pulls out a colour cast.
//
// It is deliberately mild: the stretch is capped and only partly applied, so a
// painting that is meant to be mostly one colour isn't "corrected" away.
import type { RawImage } from './types';

const LOW = 0.005; // ignore the darkest 0.5% (specks, shadows at the edge)
const HIGH = 0.995; // and the brightest 0.5% (glare)
const MAX_GAIN = 1.6; // never stretch a channel more than this
const STRENGTH = 0.75; // blend: 0 = no change, 1 = full stretch

function percentiles(hist: Uint32Array, total: number): [number, number] {
  let lo = 0, hi = 255, seen = 0;
  for (let v = 0; v < 256; v++) {
    seen += hist[v];
    if (seen >= total * LOW) { lo = v; break; }
  }
  seen = 0;
  for (let v = 255; v >= 0; v--) {
    seen += hist[v];
    if (seen >= total * (1 - HIGH)) { hi = v; break; }
  }
  return [lo, hi];
}

/** Builds one lookup table per channel (R, G, B). Exported for tests. */
export function enhanceTables(image: RawImage): [Uint8Array, Uint8Array, Uint8Array] {
  const hists = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
  const d = image.data;
  // Sampling every few pixels is plenty for a histogram and keeps big photos fast.
  const step = Math.max(1, Math.floor((image.width * image.height) / 400_000)) * 4;
  let n = 0;
  for (let i = 0; i < d.length; i += step) {
    hists[0][d[i]]++;
    hists[1][d[i + 1]]++;
    hists[2][d[i + 2]]++;
    n++;
  }
  return hists.map((h) => {
    let [lo, hi] = percentiles(h, n);
    if (hi - lo < 1) [lo, hi] = [0, 255];
    let gain = 255 / (hi - lo);
    if (gain > MAX_GAIN) {
      // Keep the middle of the range where it is and stretch only so far.
      const mid = (lo + hi) / 2;
      gain = MAX_GAIN;
      lo = mid - 127.5 / gain;
    }
    const table = new Uint8Array(256);
    for (let v = 0; v < 256; v++) {
      const stretched = (v - lo) * gain;
      table[v] = Math.max(0, Math.min(255, Math.round(v + (stretched - v) * STRENGTH)));
    }
    return table;
  }) as [Uint8Array, Uint8Array, Uint8Array];
}

/** Applies lookup tables from enhanceTables to a picture, in place. */
export function applyTables(image: RawImage, [r, g, b]: [Uint8Array, Uint8Array, Uint8Array]): RawImage {
  const d = image.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = r[d[i]];
    d[i + 1] = g[d[i + 1]];
    d[i + 2] = b[d[i + 2]];
  }
  return image;
}

/** A rectangle cut out of a picture (x, y, width, height in pixels). */
export function cropImage(image: RawImage, x: number, y: number, w: number, h: number): RawImage {
  x = Math.max(0, Math.floor(x));
  y = Math.max(0, Math.floor(y));
  w = Math.max(1, Math.min(image.width - x, Math.round(w)));
  h = Math.max(1, Math.min(image.height - y, Math.round(h)));
  const data = new Uint8ClampedArray(w * h * 4);
  for (let row = 0; row < h; row++) {
    const start = ((y + row) * image.width + x) * 4;
    data.set(image.data.subarray(start, start + w * 4), row * w * 4);
  }
  return { data, width: w, height: h };
}

/** Enhances the picture in place. */
export function enhance(image: RawImage): RawImage {
  const [r, g, b] = enhanceTables(image);
  const d = image.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = r[d[i]];
    d[i + 1] = g[d[i + 1]];
    d[i + 2] = b[d[i + 2]];
  }
  return image;
}
