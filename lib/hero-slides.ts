/**
 * Curated hero slideshow images.
 *
 * Admin overrides always win: set hero_image, hero_image_2, hero_image_3 and
 * hero_image_4 in site config and those replace these entirely.
 */

/**
 * Winter hero — swapped in for the season. The earlier seasonal photos are
 * kept rather than deleted: the autumn one (baby-autumn-leaves-basket-hero.webp)
 * is also the cover of the fall layering blog post, and the pool shot still
 * lives on the About page, ready to bring back as the summer hero.
 */
export const DEFAULT_HERO_IMAGE = '/images/baby-winter-snow-forest-hero.webp';

/**
 * Descriptive alt text for DEFAULT_HERO_IMAGE, kept separate from the
 * marketing headline so it actually describes the photo for screen readers
 * and image search rather than repeating the tagline.
 */
export const DEFAULT_HERO_ALT =
  'Laughing baby in a rust knit pom-pom hat and cream cardigan playing with snow on a rust knit blanket in a snowy forest — MamaCare winter baby essentials';

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
