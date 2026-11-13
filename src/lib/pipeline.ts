// The steps a photo goes through: load, find corners, straighten.
import { detectCorners, warp } from './cvClient';
import { defaultQuad, isConvexQuad, orderQuad, outputSize, parseDimensions, rotateQuad, toPixels, type Point, type Quad, type Turns } from './geometry';
import { decodePhoto, getPixels, makePreviewUrl, makeSmallJpegBase64, pixelsToJpeg } from './images';
import type { Detection, Outline, Painting } from './types';

/** Above this, we trust the outline without asking the user to check it. */
export const CONFIDENT = 0.55;
const DETECT_SIDE = 1000;
const PREVIEW_RESULT_SIDE = 1400;

let counter = 0;

export async function loadPainting(file: File): Promise<Painting> {
  const bitmap = await decodePhoto(file);
  const previewUrl = await makePreviewUrl(bitmap);
  return {
    id: `p${Date.now()}-${counter++}`,
    name: file.name || 'Photo.jpg',
    bitmap,
    width: bitmap.width,
    height: bitmap.height,
    previewUrl,
    detection: null,
    corners: defaultQuad(),
    includeFrame: false,
    status: 'working',
    dimensions: '',
    turns: 0,
    suggestedTurns: null,
    resultUrl: null,
    resultSize: null,
  };
}

const maxCornerDistance = (a: Quad, b: Quad) => Math.max(...a.map((p, i) => Math.hypot(p.x - b[i].x, p.y - b[i].y)));

/** Asks the AI helper for corners. Returns null if it is switched off or unsure. */
async function askAi(painting: Painting): Promise<Quad | null> {
  try {
    const image = await makeSmallJpegBase64(painting.bitmap);
    const res = await fetch('/api/corners', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { corners?: Point[] | null };
    if (!body.corners || body.corners.length !== 4) return null;
    const quad = orderQuad(body.corners);
    return isConvexQuad(quad) ? quad : null;
  } catch {
    return null;
  }
}

/**
 * Finds the painting's corners: on the device first, and with the AI helper
 * when the device isn't sure. Returns the fields of the painting that changed.
 */
export async function findCorners(painting: Painting): Promise<Pick<Painting, 'detection' | 'corners' | 'status' | 'includeFrame'>> {
  let detection: Detection;
  try {
    detection = await detectCorners(getPixels(painting.bitmap, DETECT_SIDE));
  } catch {
    detection = { painting: null, frame: null, confidence: 0, candidates: [] };
  }

  if (detection.painting && detection.confidence >= CONFIDENT) {
    return { detection, corners: detection.painting.corners, status: 'good', includeFrame: false };
  }

  const aiQuad = await askAi(painting);
  if (aiQuad) {
    // AI corners are approximate. If a real edge outline in the photo lies
    // close to them, use that outline instead: it is pixel-accurate.
    const snapped = detection.candidates
      .filter((c) => maxCornerDistance(c.corners, aiQuad) < 0.05)
      .sort((a, b) => b.score - a.score)[0] as Outline | undefined;
    if (snapped) {
      const withAi: Detection = { ...detection, painting: snapped, frame: null, confidence: Math.max(snapped.score, CONFIDENT) };
      return { detection: withAi, corners: snapped.corners, status: 'good', includeFrame: false };
    }
    const withAi: Detection = { ...detection, painting: { corners: aiQuad, score: 0.5 }, frame: null, confidence: 0.5 };
    return { detection: withAi, corners: aiQuad, status: 'needs', includeFrame: false };
  }

  if (detection.painting) {
    return { detection, corners: detection.painting.corners, status: 'needs', includeFrame: false };
  }
  return { detection, corners: defaultQuad(), status: 'needs', includeFrame: false };
}

/** The corners that will actually be cut out: the frame's, if the user wants the frame. */
export function activeCorners(p: Painting): Quad {
  return p.includeFrame && p.detection?.frame ? p.detection.frame.corners : p.corners;
}

/** Size of the full-resolution result. */
export function resultSizeFor(p: Painting, corners: Quad = activeCorners(p)) {
  const aspect = parseDimensions(p.dimensions) ?? undefined;
  return outputSize(rotateQuad(toPixels(corners, p.width, p.height), p.turns), p.width, p.height, aspect);
}

/** Everything that changes the finished picture, for caching. */
export function resultKey(p: Painting): string {
  return JSON.stringify([activeCorners(p), p.dimensions, p.turns]);
}

async function straighten(p: Painting, maxSide: number): Promise<Blob> {
  const corners = activeCorners(p);
  const full = resultSizeFor(p, corners);
  const scale = Math.min(1, maxSide / Math.max(full.width, full.height));
  // Work from a copy of the photo no bigger than the result needs.
  const sourceSide = scale < 1 ? Math.max(p.width, p.height) * scale * 1.5 : Infinity;
  const pixels = getPixels(p.bitmap, sourceSide);
  const out = await warp(
    pixels,
    rotateQuad(toPixels(corners, pixels.width, pixels.height), p.turns),
    Math.max(1, Math.round(full.width * scale)),
    Math.max(1, Math.round(full.height * scale)),
  );
  return pixelsToJpeg(out, 0.95);
}

/** A screen-sized straightened picture, as an object URL. */
export async function makeResultPreview(p: Painting): Promise<Pick<Painting, 'resultUrl' | 'resultSize'>> {
  const blob = await straighten(p, PREVIEW_RESULT_SIDE);
  return { resultUrl: URL.createObjectURL(blob), resultSize: resultSizeFor(p) };
}

/** The finished picture at full resolution. */
export function makeFullResult(p: Painting): Promise<Blob> {
  return straighten(p, Infinity);
}

export function disposePainting(p: Painting) {
  p.bitmap.close();
  URL.revokeObjectURL(p.previewUrl);
  if (p.resultUrl) URL.revokeObjectURL(p.resultUrl);
}

/**
 * Asks the AI helper whether the straightened picture is the right way up.
 * Returns the quarter turns clockwise it suggests, or null when it is upright,
 * unsure, or the helper is switched off. Never throws.
 */
export async function askUprightTurns(p: Painting): Promise<Turns | null> {
  if (!p.resultUrl) return null;
  try {
    const bitmap = await createImageBitmap(await (await fetch(p.resultUrl)).blob());
    const image = await makeSmallJpegBase64(bitmap, 768);
    bitmap.close();
    const res = await fetch('/api/orientation', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ image }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { turns?: number | null };
    const t = body.turns;
    return t === 1 || t === 2 || t === 3 ? t : null;
  } catch {
    return null;
  }
}
