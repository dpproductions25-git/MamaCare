import { Product, Category } from './types';

/**
 * Live catalog — real CJ Dropshipping photos + variants.
 *
 * Notes:
 *   - cjProductId: real CJ product id (used to place fulfillment orders).
 *   - variant.vid: placeholder until you fill in the actual CJ variant ID.
 *     You can grab those from /api/admin/cj/lookup?secret=...&pid=...
 *     once you push the admin endpoint to GitHub.
 *   - Payments, DB save, and confirmation emails all work without VIDs.
 *     Only auto-fulfillment to CJ requires the real VID.
 */

// Helper that builds the CJ image URL at a sensible product-page width.
const cj = (path: string) =>
  `https://cf.cjdropshipping.com${path}?x-oss-process=image/format,webp,image/resize,w_900`;

export const products: Product[] = [
  // ─────────────────────────────────────────────────────────────
  // 1 — Bouncer (Light Gray)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-001',
    slug: 'folding-baby-bouncer-seat-light-gray',
    name: 'Folding Baby Bouncer Seat — Light Gray (0–9 Months)',
    shortDescription: 'Newborn rocker with 2 reclining angles, toy bar, and travel bag.',
    description:
      "A foldable baby bouncer designed for newborns to 9 months — perfect for nap time, feeds, and play. Two adjustable reclining angles, a rotatable toy bar to keep little hands engaged, and a 3-point safety harness give peace of mind. Folds flat into the included travel bag for stroller errands, weekend trips, or grandparent visits.",
    price: 54.99,
    compareAtPrice: 74.99,
    currency: 'USD',
    image: cj('/17660160/eb1c24dd-b6bd-484d-bb05-e494c1482e2b.jpg'),
    images: [
      cj('/17660160/eb1c24dd-b6bd-484d-bb05-e494c1482e2b.jpg'),
      cj('/17660160/4fb93d49-f3b9-4f8a-9fb2-e65bafeb7a0e.jpg'),
      cj('/17660160/ea8fd328-b659-43e2-b67d-a9251ac1e097.jpg'),
      cj('/17660160/cfa59b5f-61c6-4566-950b-687ce436309d.jpg'),
      cj('/17660160/55c68864-7e0d-4b01-9c26-078b9ed07b09.jpg')
    ],
    category: 'gear',
    tags: ['baby bouncer', 'newborn rocker', 'infant chair', 'travel bouncer', '0-9 months'],
    rating: 4.7,
    reviewsCount: 84,
    inStock: true,
    bestSeller: true,
    cjProductId: '2001551585737940994'
  },

  // ─────────────────────────────────────────────────────────────
  // 2 — Bouncer (Camel)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-002',
    slug: 'folding-baby-bouncer-seat-camel',
    name: 'Folding Baby Bouncer Seat — Camel (0–9 Months)',
    shortDescription: 'Newborn rocker in warm camel with 3-point harness and travel bag.',
    description:
      "Our loved baby bouncer in a richer camel tone. Built around a secure 3-point harness, two reclining angles, and a removable toy bar — designed for newborns through 9 months. The included carrying bag turns this into a true on-the-go infant seat.",
    price: 54.99,
    compareAtPrice: 74.99,
    currency: 'USD',
    image: cj('/17660160/8d952674-a92e-4f8c-b21f-be52768e96f3.jpg'),
    images: [
      cj('/17660160/8d952674-a92e-4f8c-b21f-be52768e96f3.jpg'),
      cj('/17660160/154e338a-c3ee-41c3-8e1d-40becc5a53e2.jpg'),
      cj('/17660160/46dbca05-eb5f-4a6d-8ce3-0df88abf78de.jpg'),
      cj('/17660160/9585c65a-8878-43c2-886a-be2f067eaaaa.jpg'),
      cj('/17660160/c050f0ec-f8a5-4c95-81e1-7fd6f825de4c.jpg')
    ],
    category: 'gear',
    tags: ['baby bouncer', 'newborn rocker', 'infant chair', 'travel bouncer', '0-9 months', 'camel'],
    rating: 4.8,
    reviewsCount: 62,
    inStock: true,
    cjProductId: '2001550805545959425'
  },

  // ─────────────────────────────────────────────────────────────
  // 3 — Picnic & Camping Chair
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-003',
    slug: 'portable-baby-picnic-camping-chair',
    name: 'Portable Baby Picnic & Camping Chair',
    shortDescription: 'Foldable beach & camping seat with snack tray and 5-point harness.',
    description:
      "A foldable baby picnic chair built for first beach days, camping trips, and backyard meals. Includes a clip-on snack tray, a 5-point harness for safety, and breathable mesh paneling. Folds flat in seconds and slips easily into a stroller basket or trunk.",
    price: 49.99,
    compareAtPrice: 64.99,
    currency: 'USD',
    image: cj('/quick/product/d9607d23-5412-4fe9-a1ce-03cd6630d0e2.jpg'),
    images: [
      cj('/quick/product/d9607d23-5412-4fe9-a1ce-03cd6630d0e2.jpg'),
      cj('/quick/product/bacf82b3-68be-4ecd-9b01-8e8c5bd7adcc.jpg'),
      cj('/quick/product/b77ef22a-cd88-42db-9db0-f39fd51f3005.jpg')
    ],
    category: 'gear',
    tags: ['portable high chair', 'baby camping chair', 'picnic seat', 'travel chair'],
    rating: 4.6,
    reviewsCount: 41,
    inStock: true,
    cjProductId: '2407100913171612700'
  },

  // ─────────────────────────────────────────────────────────────
  // 4 — Mom Diaper Bag with Hidden Folding Stool
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-004',
    slug: 'mom-diaper-bag-with-folding-stool',
    name: 'Mom Diaper Bag with Hidden Folding Stool',
    shortDescription: 'Large-capacity diaper bag with a built-in folding stool for instant seating.',
    description:
      "A double-shoulder diaper bag with a thoughtful surprise — a compact folding stool tucked into a hidden pocket. Roomy compartments inside for diapers, wipes, bottles, and a change of clothes. Water-resistant exterior, padded straps, wipeable interior lining.",
    price: 39.99,
    compareAtPrice: 54.99,
    currency: 'USD',
    image: cj('/quick/product/9e54db36-62f9-4b98-a8b4-776c3c83af12.jpg'),
    images: [
      cj('/quick/product/9e54db36-62f9-4b98-a8b4-776c3c83af12.jpg'),
      cj('/quick/product/d61fc9e3-34c8-432e-9d7f-6860a312ac85.jpg'),
      cj('/quick/product/e31799f8-9cc4-486b-96ef-57b935e98b67.jpg')
    ],
    category: 'gear',
    tags: ['diaper bag', 'mommy bag', 'folding stool', 'travel bag'],
    rating: 4.7,
    reviewsCount: 53,
    inStock: true,
    cjProductId: '1791705330586492928'
  },

  // ─────────────────────────────────────────────────────────────
  // 5 — Smart Electric Rocking Bassinet
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-005',
    slug: 'smart-electric-rocking-bassinet-bedside',
    name: 'Smart Electric Rocking Bassinet — Bedside Bassinet',
    shortDescription: 'App-controlled rocking bassinet with white noise — soothes newborns in minutes.',
    description:
      "A smart rocking bassinet engineered for the hardest hours of new parenthood. Multiple gentle rocking motions, adjustable speeds, and built-in white-noise tracks. Doubles as a bedside bassinet for safe night feeds.",
    price: 199.99,
    compareAtPrice: 259.99,
    currency: 'USD',
    image: cj('/acc55e8a-54e7-4b84-9800-027130be2fd8.jpg'),
    images: [
      cj('/acc55e8a-54e7-4b84-9800-027130be2fd8.jpg'),
      cj('/81dbb9f2-643c-4695-be0c-f66eb3fcd3b5.jpg'),
      cj('/f206fdf3-70ea-48d5-a33a-26464d57c769.jpg')
    ],
    category: 'nursery',
    tags: ['electric bassinet', 'smart bassinet', 'bedside bassinet', 'white noise'],
    rating: 4.9,
    reviewsCount: 178,
    inStock: true,
    bestSeller: true,
    cjProductId: '1821471012547350528'
  },

  // ─────────────────────────────────────────────────────────────
  // 6 — Silicone Bottle & Straw Brush Set
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-006',
    slug: 'silicone-baby-bottle-straw-brush-set',
    name: 'Silicone Baby Bottle & Straw Brush Set',
    shortDescription: 'Food-grade silicone brushes for bottles, straws, and sippy cups.',
    description:
      "A gentle yet thorough cleaning duo in food-grade silicone. Bottle brush reaches every curve without scratching glass or stainless. Slim straw scrubber tackles spots a regular sponge can't reach. Dishwasher safe, BPA-free.",
    price: 14.99,
    currency: 'USD',
    image: cj('/1615511656229.jpg'),
    images: [
      cj('/1615511656229.jpg'),
      cj('/1615511760315.jpg'),
      cj('/1615511760301.jpg')
    ],
    category: 'feeding',
    tags: ['bottle brush', 'straw cleaner', 'silicone brush', 'BPA free'],
    rating: 4.8,
    reviewsCount: 132,
    inStock: true,
    cjProductId: '1370182827219488768'
  },

  // ─────────────────────────────────────────────────────────────
  // 7 — Portable Bottle Warmer & Cooler
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-007',
    slug: 'portable-baby-bottle-warmer-cooler',
    name: 'Portable Baby Bottle Warmer & Cooler',
    shortDescription: 'USB thermostatic warmer keeps milk at the perfect feeding temperature.',
    description:
      "A travel-ready bottle bag with thermostatic heating — holds formula or breast milk at the ideal feeding temperature for hours. USB-powered for car, stroller, or office. Doubles as a cooler when needed.",
    price: 19.99,
    compareAtPrice: 26.99,
    currency: 'USD',
    image: cj('/7f33552d-ecce-4d18-b2ba-6c18546e75dd.jpg'),
    images: [
      cj('/7f33552d-ecce-4d18-b2ba-6c18546e75dd.jpg'),
      cj('/2d95d748-dfa2-4ea5-85d4-338bc4f2ba8d.jpg'),
      cj('/428db859-f157-4c5b-833a-3e32ca4ac0c5.jpg'),
      cj('/94da268a-6546-45fc-9516-bd11ad598f3a.jpg')
    ],
    category: 'feeding',
    tags: ['bottle warmer', 'portable warmer', 'USB warmer', 'thermostatic'],
    rating: 4.7,
    reviewsCount: 96,
    inStock: true,
    cjProductId: '1448537011215536128'
  },

  // ─────────────────────────────────────────────────────────────
  // 8 — Fleece Sleep Sack — 6 colors × 3 sizes
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-008',
    slug: 'soft-fleece-baby-sleep-sack-head-support',
    name: 'Soft Fleece Baby Sleep Sack with Head Support',
    shortDescription: 'Cloud-soft swaddle sleep sack — keeps newborns cozy and safe.',
    description:
      "An ultra-soft fleece sleep sack for newborns with a built-in head-support pillow. Unisex, wearable-blanket design for safe sleep — no loose blankets in the crib.",
    price: 29.99,
    compareAtPrice: 39.99,
    currency: 'USD',
    image: cj('/f75e8854-2ebc-4ffe-a428-421428916175.png'),
    images: [
      cj('/f75e8854-2ebc-4ffe-a428-421428916175.png'),
      cj('/86464822-3635-4a30-b196-1c5efc715ec7.jpg'),
      cj('/71844ebf-2006-4462-9083-1a2ca6a08e26.png'),
      cj('/bd749273-8575-49ab-aec4-42b2f108bdc4.png'),
      cj('/959ac2f5-6326-4350-9da1-10bd3d17e377.png'),
      cj('/d68853ad-036a-46c7-be74-d97753bd3426.png')
    ],
    category: 'sleep',
    tags: ['sleep sack', 'fleece swaddle', 'newborn sleep', 'safe sleep'],
    rating: 4.9,
    reviewsCount: 215,
    inStock: true,
    bestSeller: true,
    cjProductId: '1714214911549001728',
    variants: [
      // Color 1 (Cream)
      { vid: 'mc-008-c1-3m', name: 'Cream / 3M',  color: 'Cream',  size: '3M', image: cj('/f75e8854-2ebc-4ffe-a428-421428916175.png') },
      { vid: 'mc-008-c1-6m', name: 'Cream / 6M',  color: 'Cream',  size: '6M', image: cj('/f75e8854-2ebc-4ffe-a428-421428916175.png') },
      { vid: 'mc-008-c1-9m', name: 'Cream / 9M',  color: 'Cream',  size: '9M', image: cj('/f75e8854-2ebc-4ffe-a428-421428916175.png') },
      // Color 2 (Sand)
      { vid: 'mc-008-c2-3m', name: 'Sand / 3M',   color: 'Sand',   size: '3M', image: cj('/86464822-3635-4a30-b196-1c5efc715ec7.jpg') },
      { vid: 'mc-008-c2-6m', name: 'Sand / 6M',   color: 'Sand',   size: '6M', image: cj('/86464822-3635-4a30-b196-1c5efc715ec7.jpg') },
      { vid: 'mc-008-c2-9m', name: 'Sand / 9M',   color: 'Sand',   size: '9M', image: cj('/86464822-3635-4a30-b196-1c5efc715ec7.jpg') },
      // Color 3 (Blush)
      { vid: 'mc-008-c3-3m', name: 'Blush / 3M',  color: 'Blush',  size: '3M', image: cj('/71844ebf-2006-4462-9083-1a2ca6a08e26.png') },
      { vid: 'mc-008-c3-6m', name: 'Blush / 6M',  color: 'Blush',  size: '6M', image: cj('/71844ebf-2006-4462-9083-1a2ca6a08e26.png') },
      { vid: 'mc-008-c3-9m', name: 'Blush / 9M',  color: 'Blush',  size: '9M', image: cj('/71844ebf-2006-4462-9083-1a2ca6a08e26.png') },
      // Color 4 (Sage)
      { vid: 'mc-008-c4-3m', name: 'Sage / 3M',   color: 'Sage',   size: '3M', image: cj('/bd749273-8575-49ab-aec4-42b2f108bdc4.png') },
      { vid: 'mc-008-c4-6m', name: 'Sage / 6M',   color: 'Sage',   size: '6M', image: cj('/bd749273-8575-49ab-aec4-42b2f108bdc4.png') },
      { vid: 'mc-008-c4-9m', name: 'Sage / 9M',   color: 'Sage',   size: '9M', image: cj('/bd749273-8575-49ab-aec4-42b2f108bdc4.png') },
      // Color 5 (Sky)
      { vid: 'mc-008-c5-3m', name: 'Sky / 3M',    color: 'Sky',    size: '3M', image: cj('/959ac2f5-6326-4350-9da1-10bd3d17e377.png') },
      { vid: 'mc-008-c5-6m', name: 'Sky / 6M',    color: 'Sky',    size: '6M', image: cj('/959ac2f5-6326-4350-9da1-10bd3d17e377.png') },
      { vid: 'mc-008-c5-9m', name: 'Sky / 9M',    color: 'Sky',    size: '9M', image: cj('/959ac2f5-6326-4350-9da1-10bd3d17e377.png') },
      // Color 6 (Charcoal)
      { vid: 'mc-008-c6-3m', name: 'Charcoal / 3M', color: 'Charcoal', size: '3M', image: cj('/d68853ad-036a-46c7-be74-d97753bd3426.png') },
      { vid: 'mc-008-c6-6m', name: 'Charcoal / 6M', color: 'Charcoal', size: '6M', image: cj('/d68853ad-036a-46c7-be74-d97753bd3426.png') },
      { vid: 'mc-008-c6-9m', name: 'Charcoal / 9M', color: 'Charcoal', size: '9M', image: cj('/d68853ad-036a-46c7-be74-d97753bd3426.png') }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // 9 — Cotton Snap-Bottom Bodysuit — sizes 59/66/73/80cm
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-009',
    slug: 'cotton-snap-bottom-baby-bodysuit',
    name: 'Cotton Snap-Bottom Baby Bodysuit',
    shortDescription: 'Soft cotton onesie with snap closure for fast diaper changes.',
    description:
      "A breathable short-sleeve cotton bodysuit with the classic snap-bottom design. Soft jersey knit that gets softer with every wash. Pre-shrunk so the fit stays right.",
    price: 9.99,
    currency: 'USD',
    image: cj('/15683040/1578222343984.jpg'),
    images: [cj('/15683040/1578222343984.jpg')],
    category: 'baby',
    tags: ['baby bodysuit', 'cotton onesie', 'snap bottom romper', 'newborn clothing'],
    rating: 4.6,
    reviewsCount: 78,
    inStock: true,
    cjProductId: '545BF115-ABCB-4718-8DC2-F799CA82ED53',
    variants: [
      { vid: 'mc-009-59', name: '59 cm (0–3 mo)', size: '59 cm' },
      { vid: 'mc-009-66', name: '66 cm (3–6 mo)', size: '66 cm' },
      { vid: 'mc-009-73', name: '73 cm (6–9 mo)', size: '73 cm' },
      { vid: 'mc-009-80', name: '80 cm (9–12 mo)', size: '80 cm' }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // 10 — Newborn Gift Set Box — 2 colorways × 2 sizes
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-010',
    slug: 'newborn-cotton-clothing-gift-set',
    name: 'Newborn Cotton Clothing Gift Set Box',
    shortDescription: 'Curated cotton essentials — the perfect baby shower gift.',
    description:
      "A beautifully curated newborn gift set with 100% cotton pieces, presented in a giftable keepsake box. Bodysuits, swaddle, scratch mittens, and matching hat included.",
    price: 69.99,
    compareAtPrice: 89.99,
    currency: 'USD',
    image: cj('/20200916/14248380869446.jpg'),
    images: [
      cj('/20200916/14248380869446.jpg'),
      cj('/20200916/8167965692084.jpg')
    ],
    category: 'baby',
    tags: ['newborn gift set', 'baby shower gift', 'cotton newborn clothes'],
    rating: 4.9,
    reviewsCount: 156,
    inStock: true,
    bestSeller: true,
    cjProductId: 'D0A4EA85-0680-49E8-B055-3C36DF82CB4E',
    variants: [
      { vid: 'mc-010-a-18', name: 'Colorway A / 18', color: 'Colorway A', size: '18', image: cj('/20200916/14248380869446.jpg') },
      { vid: 'mc-010-a-22', name: 'Colorway A / 22', color: 'Colorway A', size: '22', image: cj('/20200916/14248380869446.jpg') },
      { vid: 'mc-010-b-18', name: 'Colorway B / 18', color: 'Colorway B', size: '18', image: cj('/20200916/8167965692084.jpg') },
      { vid: 'mc-010-b-22', name: 'Colorway B / 22', color: 'Colorway B', size: '22', image: cj('/20200916/8167965692084.jpg') }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // 11 — Pretend Play Kitchen Sink Toy
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-011',
    slug: 'pretend-play-kitchen-sink-toy',
    name: 'Pretend Play Kitchen Sink Toy for Toddlers',
    shortDescription: 'Imaginative water-play toy with realistic working faucet.',
    description:
      "An interactive pretend-play kitchen sink that mimics real life — running water, soap dispenser, removable dish tray. Builds motor skills, role-play, and early language. Ages 3+.",
    price: 39.99,
    compareAtPrice: 54.99,
    currency: 'USD',
    image: cj('/20200525/1490836236916.jpg'),
    images: [
      cj('/20200525/1490836236916.jpg'),
      cj('/20200525/2398440685705.jpg')
    ],
    category: 'toys',
    tags: ['pretend play', 'play kitchen', 'Montessori toy', 'role play'],
    rating: 4.7,
    reviewsCount: 64,
    inStock: true,
    cjProductId: 'B307522C-35DC-4988-ADA4-60D846CECD8C'
  },

  // ─────────────────────────────────────────────────────────────
  // 12 — Changing Pad — 3 colors
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-012',
    slug: 'portable-baby-changing-pad-clutch',
    name: 'Portable Baby Changing Pad — Foldable Clutch',
    shortDescription: 'Foldable, wipeable changing pad fits any diaper bag.',
    description:
      "A foldable, fully wipeable changing pad with a built-in clutch — designed to live in your diaper bag. Soft waterproof inner layer. Cleans in seconds with a baby wipe.",
    price: 12.99,
    currency: 'USD',
    image: cj('/20200318/2857245981357.png'),
    images: [
      cj('/20200318/2857245981357.png'),
      cj('/20200318/1461694270305.png'),
      cj('/20200318/375302383553.png')
    ],
    category: 'feeding',
    tags: ['portable changing pad', 'changing mat', 'diaper bag essential'],
    rating: 4.6,
    reviewsCount: 109,
    inStock: true,
    cjProductId: 'CDD1C382-6B37-4FCE-BF8A-DD604986F4E1',
    variants: [
      { vid: 'mc-012-bw', name: 'Black & White', color: 'Black & White', image: cj('/20200318/2857245981357.png') },
      { vid: 'mc-012-blue', name: 'Blue', color: 'Blue', image: cj('/20200318/1461694270305.png') },
      { vid: 'mc-012-pink', name: 'Pink', color: 'Pink', image: cj('/20200318/375302383553.png') }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // 13 — Ergonomic 3-in-1 Carrier — 3 colors
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-013',
    slug: 'ergonomic-3-in-1-baby-carrier-hip-seat',
    name: 'Ergonomic 3-in-1 Baby Carrier with Hip Seat',
    shortDescription: 'Front, kangaroo, and hip-seat carrying — all in one ergonomic wrap.',
    description:
      "A multi-position baby carrier with padded shoulder straps and lumbar belt. Three carrying modes: front-facing inward, kangaroo wrap, and hip seat. Fits babies 3.5–33 lbs.",
    price: 44.99,
    compareAtPrice: 59.99,
    currency: 'USD',
    image: cj('/20200521/307674343984.jpg'),
    images: [
      cj('/20200521/307674343984.jpg'),
      cj('/20200521/927682396908.jpg'),
      cj('/20200923/569768213553.jpg')
    ],
    category: 'gear',
    tags: ['ergonomic baby carrier', 'hip seat carrier', 'babywearing wrap'],
    rating: 4.8,
    reviewsCount: 187,
    inStock: true,
    bestSeller: true,
    cjProductId: 'FDE0817B-91FC-42D2-A6FE-8AFF85E23A78',
    variants: [
      { vid: 'mc-013-blue', name: 'Blue', color: 'Blue', image: cj('/20200521/307674343984.jpg') },
      { vid: 'mc-013-navy', name: 'Navy', color: 'Navy', image: cj('/20200521/927682396908.jpg') },
      { vid: 'mc-013-pink', name: 'Pink Flower', color: 'Pink Flower', image: cj('/20200923/569768213553.jpg') }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // 14 — Stroller Organizer
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-014',
    slug: 'universal-stroller-organizer-cup-holders',
    name: 'Universal Stroller Organizer with Cup Holders',
    shortDescription: 'Two insulated cup holders, phone pocket, and zip storage.',
    description:
      "A universal stroller organizer with two insulated cup holders, a dedicated phone pocket, and zippered storage. Adjustable Velcro straps fit any stroller.",
    price: 19.99,
    compareAtPrice: 26.99,
    currency: 'USD',
    image: cj('/15543072/3037775383461.jpg'),
    images: [
      cj('/15543072/3037775383461.jpg'),
      cj('/2058/2938707667959.jpg')
    ],
    category: 'gear',
    tags: ['stroller organizer', 'stroller caddy', 'universal stroller bag'],
    rating: 4.6,
    reviewsCount: 71,
    inStock: true,
    cjProductId: '66FAC940-8B2F-42CE-B1FE-FCD07EA3097B'
  },

  // ─────────────────────────────────────────────────────────────
  // 15 — Learning Robot
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-015',
    slug: 'smart-remote-control-learning-robot',
    name: 'Smart Remote-Control Learning Robot for Kids',
    shortDescription: 'Touch, app, and gravity-sensor controls — early learning fun for ages 3+.',
    description:
      "A friendly remote-control robot that responds to touch, smartphone app, or motion gestures. Plays music, lights up, dances, and teaches early counting. Ages 3+.",
    price: 99.99,
    compareAtPrice: 139.99,
    currency: 'USD',
    image: cj('/2061/3320988115709.jpg'),
    images: [
      cj('/2061/3320988115709.jpg'),
      cj('/16039008/2026544740783.jpg')
    ],
    category: 'toys',
    tags: ['learning robot', 'STEM toy', 'remote control robot', 'educational toy'],
    rating: 4.7,
    reviewsCount: 92,
    inStock: true,
    cjProductId: 'A540AE1F-4FB7-4FBA-9843-216B0AF2553E'
  },

  // ─────────────────────────────────────────────────────────────
  // 16 — Quilted Sleeping Bag — 5 colors × 3 sizes
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-016',
    slug: 'quilted-baby-sleeping-bag-wrap',
    name: 'Quilted Baby Sleeping Bag — Newborn Wrap',
    shortDescription: 'Snug quilted wrap that helps prevent the startle reflex.',
    description:
      "A breathable quilted wrap-style sleeping bag for newborns. The snug fit helps prevent the startle reflex during sleep. Hip-healthy design with room for legs to bend. Machine washable.",
    price: 19.99,
    currency: 'USD',
    image: cj('/1617192889008.jpg'),
    images: [
      cj('/1617192889008.jpg'),
      cj('/1617192889012.jpg'),
      cj('/1617192889017.jpg'),
      cj('/1617192889015.jpg'),
      cj('/1617192889020.jpg')
    ],
    category: 'sleep',
    tags: ['baby sleeping bag', 'newborn swaddle', 'quilted swaddle'],
    rating: 4.7,
    reviewsCount: 124,
    inStock: true,
    cjProductId: '1377233948106690560',
    variants: [
      { vid: 'mc-016-white-3m',     name: 'White / 3M',     color: 'White',     size: '3M', image: cj('/1617192889008.jpg') },
      { vid: 'mc-016-white-6m',     name: 'White / 6M',     color: 'White',     size: '6M', image: cj('/1617192889008.jpg') },
      { vid: 'mc-016-white-9m',     name: 'White / 9M',     color: 'White',     size: '9M', image: cj('/1617192889008.jpg') },
      { vid: 'mc-016-skyblue-3m',   name: 'Light Blue / 3M', color: 'Light Blue', size: '3M', image: cj('/1617192889012.jpg') },
      { vid: 'mc-016-skyblue-6m',   name: 'Light Blue / 6M', color: 'Light Blue', size: '6M', image: cj('/1617192889012.jpg') },
      { vid: 'mc-016-skyblue-9m',   name: 'Light Blue / 9M', color: 'Light Blue', size: '9M', image: cj('/1617192889012.jpg') },
      { vid: 'mc-016-khaki-3m',     name: 'Khaki / 3M',     color: 'Khaki',     size: '3M', image: cj('/1617192889017.jpg') },
      { vid: 'mc-016-khaki-6m',     name: 'Khaki / 6M',     color: 'Khaki',     size: '6M', image: cj('/1617192889017.jpg') },
      { vid: 'mc-016-khaki-9m',     name: 'Khaki / 9M',     color: 'Khaki',     size: '9M', image: cj('/1617192889017.jpg') },
      { vid: 'mc-016-red-3m',       name: 'Red / 3M',       color: 'Red',       size: '3M', image: cj('/1617192889015.jpg') },
      { vid: 'mc-016-red-6m',       name: 'Red / 6M',       color: 'Red',       size: '6M', image: cj('/1617192889015.jpg') },
      { vid: 'mc-016-red-9m',       name: 'Red / 9M',       color: 'Red',       size: '9M', image: cj('/1617192889015.jpg') },
      { vid: 'mc-016-pink-3m',      name: 'Pink / 3M',      color: 'Pink',      size: '3M', image: cj('/1617192889020.jpg') },
      { vid: 'mc-016-pink-6m',      name: 'Pink / 6M',      color: 'Pink',      size: '6M', image: cj('/1617192889020.jpg') },
      { vid: 'mc-016-pink-9m',      name: 'Pink / 9M',      color: 'Pink',      size: '9M', image: cj('/1617192889020.jpg') }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // 17 — Hip Seat Carrier — 4 colors
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-017',
    slug: 'breathable-baby-hip-seat-carrier',
    name: 'Breathable Baby Hip Seat Carrier — Four Seasons',
    shortDescription: 'Ventilated waist-belt hip seat — your arms can rest.',
    description:
      "A breathable waist-belt hip-seat carrier with mesh-vented design and padded interior. Adjustable belt fits waists 25–47 inches. Holds babies 7–44 lbs.",
    price: 44.99,
    compareAtPrice: 59.99,
    currency: 'USD',
    image: cj('/20210127/1486160627059.jpg'),
    images: [
      cj('/20210127/1486160627059.jpg'),
      cj('/20210127/369648291255.jpg'),
      cj('/20210127/1637177420493.jpg'),
      cj('/20210127/1342537726070.jpg')
    ],
    category: 'gear',
    tags: ['hip seat carrier', 'baby waist carrier', 'breathable carrier'],
    rating: 4.6,
    reviewsCount: 58,
    inStock: true,
    cjProductId: '19BAB96E-0801-4F28-BD73-A853AFDB75BD',
    variants: [
      { vid: 'mc-017-darkred', name: 'Dark Red', color: 'Dark Red', image: cj('/20210127/1486160627059.jpg') },
      { vid: 'mc-017-orange',  name: 'Orange',   color: 'Orange',   image: cj('/20210127/369648291255.jpg') },
      { vid: 'mc-017-silver',  name: 'Silver Gray', color: 'Silver Gray', image: cj('/20210127/1637177420493.jpg') },
      { vid: 'mc-017-sky',     name: 'Sky Blue', color: 'Sky Blue', image: cj('/20210127/1342537726070.jpg') }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // 18 — Large Mom Travel Bag — 3 colors (+ extra gallery shots)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-018',
    slug: 'large-foldable-mom-travel-bag-mosquito',
    name: 'Large Foldable Mom Travel Bag — Mosquito-Proof',
    shortDescription: 'Oversized, water-resistant mom bag with mosquito mesh.',
    description:
      "An oversized mommy travel bag built for park days, beach trips, and weekends. Mosquito-mesh ventilation panels, water-resistant lining. Folds flat for storage.",
    price: 39.99,
    compareAtPrice: 52.99,
    currency: 'USD',
    image: cj('/ea9ecb73-e401-4819-8088-88a9593857ca.jpg'),
    images: [
      cj('/ea9ecb73-e401-4819-8088-88a9593857ca.jpg'),
      cj('/e0de9e7a-c74d-401b-984d-9653a576ff31.jpg'),
      cj('/645e7992-7b55-4e92-8868-6a16e575dc40.jpg'),
      cj('/c3c38d20-244b-4995-9c63-34c72a251866.jpg'),
      cj('/e1f74836-56b9-4144-94d4-97860be50460.jpg'),
      cj('/9e73b8c5-c679-43a8-ba41-69b07d0c0c4c.jpg')
    ],
    category: 'gear',
    tags: ['large mom bag', 'travel diaper bag', 'foldable mom bag', 'mosquito proof'],
    rating: 4.7,
    reviewsCount: 67,
    inStock: true,
    cjProductId: '1655831954014613504',
    variants: [
      { vid: 'mc-018-pink',     name: 'Pink',      color: 'Pink',      image: cj('/ea9ecb73-e401-4819-8088-88a9593857ca.jpg') },
      { vid: 'mc-018-darkblue', name: 'Dark Blue', color: 'Dark Blue', image: cj('/e0de9e7a-c74d-401b-984d-9653a576ff31.jpg') },
      { vid: 'mc-018-black',    name: 'Black',     color: 'Black',     image: cj('/645e7992-7b55-4e92-8868-6a16e575dc40.jpg') }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // 19 — Kids' Backpack — 2 colors
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-019',
    slug: 'kids-mini-backpack-anti-loss-strap',
    name: "Kids' Mini Backpack with Anti-Loss Wrist Strap",
    shortDescription: 'Toddler backpack with a discreet parent wrist tether.',
    description:
      "A compact sports-style backpack for active toddlers with a discreet detachable wrist strap. Roomy enough for snacks, a sippy cup, and a favorite toy.",
    price: 24.99,
    compareAtPrice: 32.99,
    currency: 'USD',
    image: cj('/1619774979542.jpg'),
    images: [
      cj('/1619774979542.jpg'),
      cj('/1619774979540.jpg')
    ],
    category: 'baby',
    tags: ['toddler backpack', 'kids backpack', 'anti-loss strap', 'child safety'],
    rating: 4.5,
    reviewsCount: 43,
    inStock: true,
    cjProductId: '1388063663646183424',
    variants: [
      { vid: 'mc-019-skyblue', name: 'Sky Blue', color: 'Sky Blue', image: cj('/1619774979542.jpg') },
      { vid: 'mc-019-pink',    name: 'Pink',     color: 'Pink',     image: cj('/1619774979540.jpg') }
    ]
  },

  // ─────────────────────────────────────────────────────────────
  // 20 — 4-in-1 Carrier
  // ─────────────────────────────────────────────────────────────
  {
    id: 'mc-020',
    slug: '4-in-1-baby-carrier-saliva-towel',
    name: '4-in-1 Baby Carrier with Saliva Towel',
    shortDescription: 'Four carrying modes for newborn to toddler — saliva towel included.',
    description:
      "A versatile four-position baby carrier — front-inward, front-outward, hip, and back carry — that grows with your baby. Breathable mesh in summer, cozy lining in winter. Includes a matching saliva towel.",
    price: 34.99,
    compareAtPrice: 46.99,
    currency: 'USD',
    image: cj('/1618374375927.jpg'),
    images: [
      cj('/1618374375927.jpg'),
      cj('/1618374375930.jpg'),
      cj('/1618374375929.jpg')
    ],
    category: 'gear',
    tags: ['4 in 1 baby carrier', 'babywearing wrap', 'all seasons carrier'],
    rating: 4.7,
    reviewsCount: 89,
    inStock: true,
    cjProductId: '1382188925539454976'
  }
];

export const categories: { slug: Category; label: string; description: string }[] = [
  { slug: 'gear',    label: 'Baby Gear',             description: 'Carriers, bouncers, chairs, and on-the-go essentials.' },
  { slug: 'baby',    label: 'Clothing & Essentials', description: 'Soft cotton basics, bodysuits, and gift sets.' },
  { slug: 'sleep',   label: 'Sleep',                 description: 'Cozy sleep sacks and swaddles for safe, sweet dreams.' },
  { slug: 'feeding', label: 'Feeding & Care',        description: 'Bottles, brushes, warmers, and everyday care basics.' },
  { slug: 'nursery', label: 'Nursery',               description: 'Bassinets, rockers, and soothing pieces for baby\'s space.' },
  { slug: 'toys',    label: 'Toys & Play',           description: 'Imaginative toys to spark curiosity and learning.' }
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: Category): Product[] {
  return products.filter((p) => p.category === category);
}

export function getBestSellers(): Product[] {
  return products.filter((p) => p.bestSeller);
}
