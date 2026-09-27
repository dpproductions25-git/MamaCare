/**
 * Curated hero slideshow images.
 *
 * Admin overrides always win: set hero_image, hero_image_2, hero_image_3 and
 * hero_image_4 in site config and those replace these entirely.
 */

/**
 * Fall hero — swapped in for the season. The previous baby-in-the-inflatable
 * (pool) shot is intentionally left alone on the About page rather than
 * deleted, so it's ready to bring back as the summer hero.
 */
export const DEFAULT_HERO_IMAGE = '/images/baby-autumn-leaves-basket-hero.webp';

/**
 * Descriptive alt text for DEFAULT_HERO_IMAGE, kept separate from the
 * marketing headline so it actually describes the photo for screen readers
 * and image search rather than repeating the tagline.
 */
export const DEFAULT_HERO_ALT =
  'Smiling baby in a cream knit sweater and pom-pom hat sitting in a wicker basket lined with a mustard blanket, surrounded by autumn leaves — MamaCare fall baby essentials';

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
