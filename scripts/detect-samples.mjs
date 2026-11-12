// Runs corner detection on every photo in a folder and writes a preview of the
// result next to it (gold = painting, blue = frame).
//
//   node scripts/detect-samples.mjs test/fixtures [outDir]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { detect } = require('../public/cv/detect.js');

async function loadCv() {
  // Note: the module object is "thenable", so it must never be awaited directly
  // (awaiting it resolves to itself forever).
  const cv = require('@techstark/opencv-js');
  if (!cv.Mat) await new Promise((r) => (cv.onRuntimeInitialized = r));
  return { cv };
}

const dir = process.argv[2] ?? 'test/fixtures';
const outDir = process.argv[3] ?? path.join(dir, 'out');
fs.mkdirSync(outDir, { recursive: true });
const { cv } = await loadCv();

const results = {};
for (const file of fs.readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()) {
  const { data, info } = await sharp(path.join(dir, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const imageData = { data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width: info.width, height: info.height };
  const t0 = performance.now();
  const r = detect(cv, imageData);
  const ms = Math.round(performance.now() - t0);
  results[file] = r;
  console.log(file, `${ms}ms`, 'confidence', r.confidence, 'painting', fmt(r.painting), 'frame', fmt(r.frame), r.debug);

  const poly = (q, color) =>
    q ? `<polygon points="${q.corners.map((p) => `${p.x * info.width},${p.y * info.height}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${Math.max(3, info.width / 250)}"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${info.width}" height="${info.height}">${poly(r.frame, '#3b82f6')}${poly(r.painting, '#C9A14A')}</svg>`;
  const drawn = await sharp(path.join(dir, file)).composite([{ input: Buffer.from(svg) }]).png().toBuffer();
  await sharp(drawn).resize({ width: 700 }).jpeg().toFile(path.join(outDir, file));
}
fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));

function fmt(q) {
  return q ? q.corners.map((p) => `(${p.x.toFixed(3)},${p.y.toFixed(3)})`).join(' ') + ` s=${q.score}` : '-';
}
