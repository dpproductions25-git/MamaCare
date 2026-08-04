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

export const CURATED_HERO_SLIDES: string[] = [
  // Warm, soft-lit lifestyle imagery — the existing default hero
  unsplash('1503454537195-1dcabb73ffb9'),
  // Used as the admin default hero placeholder
  unsplash('1555252333-9f8e92e65df9'),
  // About-page hero
  unsplash('1519689680058-324335c77eba'),
  // Nursery / soft textiles
  unsplash('1584515933487-779824d29309'),
];

/**
 * Build the final slide list: admin choices first, topped up with curated
 * photography, de-duplicated, capped at 4.
 *
 * Product photography is deliberately NOT used as filler — catalogue shots are
 * cropped tight on white backgrounds and look weak stretched across a
 * full-bleed banner.
 */
export function buildHeroSlides(adminImages: (string | undefined | null)[]): string[] {
  const slides: string[] = [];

  for (const img of adminImages) {
    if (img && !slides.includes(img)) slides.push(img);
  }
  for (const img of CURATED_HERO_SLIDES) {
    if (slides.length >= 4) break;
    if (!slides.includes(img)) slides.push(img);
  }

  return slides.slice(0, 4);
}
