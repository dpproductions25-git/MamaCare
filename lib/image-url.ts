/**
 * Normalize various image-sharing URLs into direct image URLs that
 * Next.js's <Image> component can display.
 *
 * Supports:
 *   - Google Drive share links → lh3.googleusercontent.com direct image
 *   - Dropbox share links → direct download
 *   - Plain image URLs → unchanged
 *
 * For Google Drive, you need to set the file's sharing permission to
 * "Anyone with the link" → "Viewer" first.
 */

export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // ── Google Drive ──
  // https://drive.google.com/file/d/{ID}/view?usp=sharing
  // https://drive.google.com/open?id={ID}
  // https://drive.google.com/uc?id={ID}
  const gdrive = trimmed.match(
    /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([a-zA-Z0-9_-]+)/
  );
  if (gdrive) {
    return `https://lh3.googleusercontent.com/d/${gdrive[1]}=w1600`;
  }

  // ── Dropbox ──
  // https://www.dropbox.com/s/{id}/photo.jpg?dl=0  →  ?raw=1
  if (/^https:\/\/(?:www\.)?dropbox\.com\//i.test(trimmed)) {
    return trimmed.replace(/[?&]dl=\d/, '').concat(trimmed.includes('?') ? '&raw=1' : '?raw=1');
  }

  // ── Default — return as-is ──
  return trimmed;
}

/** Normalize a comma-separated list of URLs. */
export function normalizeImageUrlList(input: string | undefined | null): string[] {
  if (!input) return [];
  return input
    .split(/[,\n]/)
    .map((s) => normalizeImageUrl(s))
    .filter(Boolean);
}
