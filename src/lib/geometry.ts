export type Point = { x: number; y: number };
/** Four corners in order: top-left, top-right, bottom-right, bottom-left. */
export type Quad = [Point, Point, Point, Point];

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Corners 10% in from the edges: the starting point for "I'll choose the corners". */
export function defaultQuad(): Quad {
  return [
    { x: 0.1, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.9, y: 0.9 },
    { x: 0.1, y: 0.9 },
  ];
}

export function fullQuad(): Quad {
  return [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];
}

export function toPixels(q: Quad, width: number, height: number): Quad {
  return q.map((p) => ({ x: p.x * width, y: p.y * height })) as Quad;
}

/** Puts 4 points in TL, TR, BR, BL order. */
export function orderQuad(pts: Point[]): Quad {
  const cx = pts.reduce((s, p) => s + p.x, 0) / 4;
  const cy = pts.reduce((s, p) => s + p.y, 0) / 4;
  const sorted = [...pts].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  let start = 0;
  sorted.forEach((p, i) => {
    if (p.x + p.y < sorted[start].x + sorted[start].y) start = i;
  });
  return [0, 1, 2, 3].map((k) => sorted[(start + k) % 4]) as Quad;
}

export function isConvexQuad(q: Quad): boolean {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i], b = q[(i + 1) % 4], c = q[(i + 2) % 4];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 1e-9) return false;
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/**
 * Estimates the real width/height ratio of a rectangle photographed at an angle.
 *
 * Uses Zhang & He's whiteboard method ("Whiteboard scanning and image
 * enhancement", 2007), assuming the camera's centre is the middle of the photo
 * and square pixels. Falls back to the average side lengths when the maths
 * doesn't hold up (e.g. the photo was taken straight on).
 */
export function estimateAspect(q: Quad, imgW: number, imgH: number): number {
  const fallback = (dist(q[0], q[1]) + dist(q[3], q[2])) / (dist(q[0], q[3]) + dist(q[1], q[2]));
  const u0 = imgW / 2, v0 = imgH / 2;
  // Zhang's corner naming: m1 TL, m2 TR, m3 BL, m4 BR
  const m1 = [q[0].x, q[0].y, 1], m2 = [q[1].x, q[1].y, 1], m3 = [q[3].x, q[3].y, 1], m4 = [q[2].x, q[2].y, 1];
  const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const k2 = dot(cross(m1, m4), m3) / dot(cross(m2, m4), m3);
  const k3 = dot(cross(m1, m4), m2) / dot(cross(m3, m4), m2);
  const n2 = [k2 * m2[0] - m1[0], k2 * m2[1] - m1[1], k2 * m2[2] - m1[2]];
  const n3 = [k3 * m3[0] - m1[0], k3 * m3[1] - m1[1], k3 * m3[2] - m1[2]];
  const diag = Math.hypot(imgW, imgH);
  // When one pair of sides is parallel in the photo (the camera only turned
  // left/right, or only up/down) the focal length can't be recovered from the
  // corners. Assume a typical phone camera (about 26mm equivalent), which is
  // what most of these photos come from.
  let f = 0.6 * diag;
  if (Math.abs(n2[2]) > 1e-6 && Math.abs(n3[2]) > 1e-6) {
    const f2 =
      -(
        (n2[0] * n3[0] - (n2[0] * n3[2] + n2[2] * n3[0]) * u0 + n2[2] * n3[2] * u0 * u0) +
        (n2[1] * n3[1] - (n2[1] * n3[2] + n2[2] * n3[1]) * v0 + n2[2] * n3[2] * v0 * v0)
      ) /
      (n2[2] * n3[2]);
    // Keep the estimate only if it is a focal length a real lens could have.
    if (f2 > 0 && Number.isFinite(f2)) {
      const est = Math.sqrt(f2);
      if (est > 0.3 * diag && est < 6 * diag) f = est;
    }
  }
  const aT = (v: number[]) => [(v[0] - u0 * v[2]) / f, (v[1] - v0 * v[2]) / f, v[2]];
  const a2 = aT(n2), a3 = aT(n3);
  const ratio = Math.sqrt(dot(a2, a2) / dot(a3, a3));
  if (!Number.isFinite(ratio) || ratio <= 0) return fallback;
  // Sanity check against the simple estimate: perspective rarely changes it by
  // more than ~40%.
  if (ratio / fallback > 1.4 || fallback / ratio > 1.4) return fallback;
  return ratio;
}

export type OutputSize = { width: number; height: number };

/**
 * Size of the straightened image, keeping as many pixels as the photo has.
 * `aspect` (width / height) overrides the estimate, e.g. from "16 x 20 in".
 */
export function outputSize(qPx: Quad, imgW: number, imgH: number, aspect?: number, maxSide = 8000): OutputSize {
  const ratio = aspect && aspect > 0 ? aspect : estimateAspect(qPx, imgW, imgH);
  const w = Math.max(dist(qPx[0], qPx[1]), dist(qPx[3], qPx[2]));
  const h = Math.max(dist(qPx[0], qPx[3]), dist(qPx[1], qPx[2]));
  // Keep the same number of pixels as the measured box, reshaped to the ratio.
  const width0 = Math.sqrt(w * h * ratio);
  const height0 = Math.sqrt((w * h) / ratio);
  const scale = Math.min(1, maxSide / Math.max(width0, height0));
  return { width: Math.max(1, Math.round(width0 * scale)), height: Math.max(1, Math.round(height0 * scale)) };
}

/** Parses "16 x 20", "16x20 in", "40 × 50 cm" into a width/height ratio. */
export function parseDimensions(text: string): number | null {
  const m = text.replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(?:in|cm|mm|"|')?\s*[x×by*]+\s*(\d+(?:\.\d+)?)/i);
  if (!m) return null;
  const a = parseFloat(m[1]), b = parseFloat(m[2]);
  if (!(a > 0 && b > 0)) return null;
  return a / b;
}

/** Quarter turns clockwise, 0 to 3. */
export type Turns = 0 | 1 | 2 | 3;

export const addTurns = (t: Turns, by: number): Turns => ((((t + by) % 4) + 4) % 4) as Turns;

/**
 * Re-labels the corners so the straightened picture comes out turned clockwise
 * by `turns` quarter turns. The warp maps corner 0 to the top left, so turning
 * right by one means the old bottom-left corner becomes the new top-left.
 */
export function rotateQuad(q: Quad, turns: Turns): Quad {
  return [0, 1, 2, 3].map((i) => q[(i - turns + 4) % 4]) as Quad;
}
