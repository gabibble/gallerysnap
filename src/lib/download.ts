import { outputFilename, uniqueNames } from './filenames';

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before freeing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function downloadOne(blob: Blob, originalName: string) {
  saveBlob(blob, outputFilename(originalName));
}

/** Downloads several pictures as one zip file. */
export async function downloadAll(files: { blob: Blob; originalName: string }[]) {
  const { zipSync } = await import('fflate');
  const names = uniqueNames(files.map((f) => outputFilename(f.originalName)));
  const entries: Record<string, [Uint8Array, { level: 0 }]> = {};
  for (let i = 0; i < files.length; i++) {
    // JPEGs are already compressed, so just store them (level 0).
    entries[names[i]] = [new Uint8Array(await files[i].blob.arrayBuffer()), { level: 0 }];
  }
  const zipped = zipSync(entries);
  saveBlob(new Blob([zipped as BlobPart], { type: 'application/zip' }), 'gallerysnap-paintings.zip');
}

/** Downloads each picture as its own file (phones: so they show up in the gallery). */
export async function downloadEach(files: { blob: Blob; originalName: string }[]) {
  const names = uniqueNames(files.map((f) => outputFilename(f.originalName)));
  for (let i = 0; i < files.length; i++) {
    saveBlob(files[i].blob, names[i]);
    // Browsers drop downloads started all at once.
    if (i < files.length - 1) await new Promise((r) => setTimeout(r, 400));
  }
}

/** The share sheet's files for these pictures, or null if this browser can't share them. */
export function shareFiles(files: { blob: Blob; originalName: string }[]): File[] | null {
  const names = uniqueNames(files.map((f) => outputFilename(f.originalName)));
  const list = files.map((f, i) => new File([f.blob], names[i], { type: f.blob.type || 'image/jpeg' }));
  return navigator.canShare?.({ files: list }) ? list : null;
}
