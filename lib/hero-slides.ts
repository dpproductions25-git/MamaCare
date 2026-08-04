/**
 * Curated hero slideshow images.
 *
 * These are Unsplash photographs already in use elsewhere on this site (blog
 * headers, the About page, the admin default hero), so they are known-good URLs
 * rather than guessed IDs that could 404 and leave a blank banner.
 *
 * Admin overrides always win: set hero_image, hero_image_2, hero_image_3 and
 * hero_image_4 in site config and those replace these entirely.
 */

const W = 2000;
const Q = 80;

function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${W}&q=${Q}`;
}

/** The baby-in-the-inflatable shot — the same photograph used on the About page. */
export const DEFAULT_HERO_IMAGE = unsplash('1519689680058-324335c77eba');

export const CURATED_HERO_SLIDES: string[] = [DEFAULT_HERO_IMAGE];

/**
 * Build the slide list.
 *
 * Admin images are used exclusively when any are set — the curated default is
 * NOT mixed in alongside them, otherwise setting one image in admin would
 * silently produce a two-slide carousel nobody asked for.
 *
 * With a single slide the component skips the timer and hides the dots, so this
 * renders as a plain static banner.
 */
export function buildHeroSlides(adminImages: (string | undefined | null)[]): string[] {
  const chosen = adminImages.filter(
    (img, i, arr): img is string => !!img && arr.indexOf(img) === i
  );
  return chosen.length ? chosen.slice(0, 4) : [...CURATED_HERO_SLIDES];
}
