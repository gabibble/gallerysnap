// Saves the exact pixels the app hands the corner detector for each photo in
// test/fixtures (decoded, capped at 24MP and shrunk to 1000px by Chrome), as
// lossless WebP in test/fixtures/as-seen/. The detector tests run on these
// as well as on the originals, because Chrome's shrinking changes the result.
//
//   node scripts/capture-as-seen.mjs
//
// Needs Playwright with Chromium (npm i -g playwright && npx playwright install chromium).
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import sharp from 'sharp';

const { chromium } = createRequire(import.meta.url)('playwright');

const dir = 'test/fixtures';
const outDir = path.join(dir, 'as-seen');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<input type=file id=f>');
for (const file of fs.readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()) {
  await page.setInputFiles('#f', path.join(dir, file));
  // Mirrors decodePhoto() and getPixels() in src/lib/images.ts.
  const { w, h, b64 } = await page.evaluate(async () => {
    const input = /** @type {HTMLInputElement} */ (document.getElementById('f'));
    let bmp = await createImageBitmap(input.files[0], { imageOrientation: 'from-image' });
    const MAX = 24_000_000;
    if (bmp.width * bmp.height > MAX) {
      const k = Math.sqrt(MAX / (bmp.width * bmp.height));
      bmp = await createImageBitmap(bmp, { resizeWidth: Math.round(bmp.width * k), resizeHeight: Math.round(bmp.height * k), resizeQuality: 'high' });
    }
    const s = Math.min(1, 1000 / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * s)), h = Math.max(1, Math.round(bmp.height * s));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    let bin = '';
    for (let i = 0; i < d.length; i += 0x8000) bin += String.fromCharCode.apply(null, d.subarray(i, i + 0x8000));
    return { w, h, b64: btoa(bin) };
  });
  const out = path.join(outDir, file.replace(/\.(jpe?g|png)$/i, '.webp'));
  await sharp(Buffer.from(b64, 'base64'), { raw: { width: w, height: h, channels: 4 } }).removeAlpha().webp({ lossless: true, effort: 6 }).toFile(out);
  console.log(out, w, h);
}
await browser.close();
