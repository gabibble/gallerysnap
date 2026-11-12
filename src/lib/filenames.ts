/** "IMG_2041.HEIC" -> "IMG_2041_gallerysnap.jpg" */
export function outputFilename(original: string): string {
  const base = original.replace(/\.[^.]+$/, '').trim() || 'painting';
  const safe = base.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80);
  return `${safe}_gallerysnap.jpg`;
}

/** Display name for a photo on screen: no extension, underscores as spaces. */
export function displayName(original: string): string {
  return original.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim() || 'Photo';
}

/** Makes names unique within a zip: "a.jpg", "a (2).jpg", ... */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((n) => {
    const count = (seen.get(n) ?? 0) + 1;
    seen.set(n, count);
    return count === 1 ? n : n.replace(/(\.[^.]+)$/, ` (${count})$1`);
  });
}
