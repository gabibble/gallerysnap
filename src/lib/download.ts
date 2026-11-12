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
