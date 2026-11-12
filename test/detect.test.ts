// Corner detection on Chris's example photos. Expected corners were measured
// by eye on the photos (fractions of width/height, TL TR BR BL).
import { createRequire } from 'node:module';
import path from 'node:path';
import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { detect } = require('../public/cv/detect.js');

type P = { x: number; y: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cv: any;

beforeAll(async () => {
  const mod = require('@techstark/opencv-js');
  // The module is "thenable": never await it directly.
  if (!mod.Mat) await new Promise<void>((resolve) => (mod.onRuntimeInitialized = () => resolve()));
  cv = mod;
}, 60_000);

async function run(file: string) {
  const { data, info } = await sharp(path.join(__dirname, 'fixtures', file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return detect(cv, { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height });
}

function expectNear(actual: P[], expected: [number, number][], tol = 0.02) {
  actual.forEach((p, i) => {
    expect(Math.abs(p.x - expected[i][0]), `corner ${i} x`).toBeLessThan(tol);
    expect(Math.abs(p.y - expected[i][1]), `corner ${i} y`).toBeLessThan(tol);
  });
}

describe('detect', () => {
  it('finds a canvas lying on a wicker table', async () => {
    const r = await run('canvas-on-wicker.jpg');
    expect(r.frame).toBeNull();
    expect(r.confidence).toBeGreaterThan(0.6);
    expectNear(r.painting.corners, [
      [0.165, 0.046],
      [0.845, 0.037],
      [0.868, 0.965],
      [0.162, 0.965],
    ]);
  }, 60_000);

  it('finds the painting and its frame on a wall', async () => {
    const r = await run('framed-cat-on-wall.jpg');
    expect(r.confidence).toBeGreaterThan(0.6);
    expectNear(r.painting.corners, [
      [0.234, 0.212],
      [0.786, 0.218],
      [0.78, 0.796],
      [0.234, 0.792],
    ]);
    expect(r.frame).not.toBeNull();
    expectNear(r.frame.corners, [
      [0.122, 0.058],
      [0.9, 0.07],
      [0.882, 0.932],
      [0.122, 0.93],
    ], 0.025);
  }, 60_000);

  it('finds the painting in a photo already cropped to the frame', async () => {
    const r = await run('framed-cat-cropped.jpg');
    expectNear(r.painting.corners, [
      [0.144, 0.167],
      [0.862, 0.172],
      [0.856, 0.838],
      [0.142, 0.836],
    ]);
  }, 60_000);

  it('has low confidence when there is nothing to crop', async () => {
    const r = await run('canvas-cropped.jpg');
    expect(r.confidence).toBeLessThan(0.5);
  }, 60_000);
});
