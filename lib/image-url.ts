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

/**
 * Split pasted/stored image text into URLs.
 *
 * Splits on newlines, or on a comma that is followed by the start of another
 * URL. A plain split(',') is wrong here: CJ image URLs carry commas of their
 * own (`?x-oss-process=image/resize,m_fill,w_800,h_800`), so it chopped each
 * one into fragments like "m_fill" and "w_800" that then rendered as broken
 * images.
 */
export function splitImageList(input: string | undefined | null): string[] {
  if (!input) return [];
  return input
    .split(/\r?\n|,\s*(?=(?:https?:)?\/\/)/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Repair an image list that was already saved comma-split.
 *
 * Any entry that isn't itself a URL is a fragment of the entry before it, so
 * it gets glued back on. Lists that are already clean pass through unchanged.
 */
export function repairImageList(list: (string | null | undefined)[] | null | undefined): string[] {
  const out: string[] = [];
  for (const raw of list ?? []) {
    const s = (raw ?? '').trim();
    if (!s) continue;
    const isUrl = /^(?:https?:)?\/\//i.test(s) || s.startsWith('/');
    if (isUrl) out.push(s);
    else if (out.length > 0) out[out.length - 1] += `,${s}`;
  }
  return Array.from(new Set(out));
}

/** Normalize a list of URLs (newline- or comma-separated). */
export function normalizeImageUrlList(input: string | undefined | null): string[] {
  return splitImageList(input)
    .map((s) => normalizeImageUrl(s))
    .filter(Boolean);
}
