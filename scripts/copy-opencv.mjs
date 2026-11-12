// Copies the OpenCV.js build into public/cv so the browser worker can load it.
// Runs automatically after `npm install` and before `npm run dev` / `npm run build`.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const src = path.join(path.dirname(require.resolve('@techstark/opencv-js/package.json')), 'dist', 'opencv.js');
const dest = path.join(process.cwd(), 'public', 'cv', 'opencv.js');
fs.mkdirSync(path.dirname(dest), { recursive: true });
if (!fs.existsSync(dest) || fs.statSync(dest).size !== fs.statSync(src).size) {
  fs.copyFileSync(src, dest);
  console.log('Copied OpenCV.js to public/cv/opencv.js');
}
