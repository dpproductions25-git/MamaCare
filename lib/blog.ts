export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  author: string;
  date: string; // ISO yyyy-mm-dd
  readingMinutes: number;
  tags: string[];
  bodyHtml: string;
  relatedProductSlugs?: string[];
};

export const posts: BlogPost[] = [
  {
    slug: 'best-baby-carriers-2026',
    title: 'Best Baby Carriers in 2026: A Complete Buying Guide',
    excerpt:
      'Front carriers, hip seats, wraps, and four-in-ones — here is how to pick the right baby carrier for your body, your baby, and your everyday routine.',
    coverImage: 'https://images.unsplash.com/photo-1518676590629-3dcba9c5a5a7?auto=format&fit=crop&w=1400&q=80',
    author: 'MamaCare Editorial',
    date: '2026-05-01',
    readingMinutes: 6,
    tags: ['baby gear', 'babywearing', 'buying guide'],
    relatedProductSlugs: [
      'ergonomic-3-in-1-baby-carrier-hip-seat',
      'breathable-baby-hip-seat-carrier',
      '4-in-1-baby-carrier-saliva-towel'
    ],
    bodyHtml: `
<p>A good baby carrier does three things at once: it frees your hands, it supports your baby's developing hips and spine, and it keeps the two of you close in the way both of you need. The market is loud, the marketing is louder, and most new parents end up with one or two carriers that simply don't fit their life. This guide will help you skip that step.</p>

<h2>The four carrier styles you'll see</h2>
<p><strong>Front carriers</strong> hold baby on your chest, facing in or out. They're the easiest entry point — secure structure, easy clip-and-go. Great for newborns once they hit the carrier's minimum weight (usually 7 lbs).</p>
<p><strong>Hip-seat carriers</strong> add a structured shelf at your waist that supports your baby's bottom, so your shoulders carry less weight. They're a game-changer once your baby is 4–5 months old and getting heavier.</p>
<p><strong>Wraps</strong> are long pieces of fabric you tie around yourself. Comfortable and gentle for newborns but have a steeper learning curve.</p>
<p><strong>Four-in-one carriers</strong> combine front-inward, front-outward, hip, and back positions in a single product. Best long-term value if you want one carrier from newborn through toddlerhood.</p>

<h2>What "ergonomic" actually means</h2>
<p>Look for the "M-position" — your baby's knees are higher than their bottom, forming a deep seat that supports the hips properly. The International Hip Dysplasia Institute recommends this position to prevent hip displacement. Avoid carriers where baby's legs dangle straight down; these can stress the hip joints over time.</p>

<h2>The features that actually matter</h2>
<ul>
  <li><strong>Lumbar support belt.</strong> Distributes weight from your shoulders to your hips. Non-negotiable if you'll wear baby longer than 20 minutes at a time.</li>
  <li><strong>Adjustable shoulder straps.</strong> Padded, wide, and easy to tighten one-handed.</li>
  <li><strong>Breathable mesh panels.</strong> Babies overheat fast. Mesh saves a lot of meltdowns.</li>
  <li><strong>Multiple carry positions.</strong> What works for a 2-month-old won't work for a 15-month-old.</li>
  <li><strong>Hood or head support.</strong> For sleeping babies and unexpected sun.</li>
</ul>

<h2>How to pick the right one for you</h2>
<p>Honest assessment: how often will you wear baby? If it's "occasionally for errands," a simple front carrier is plenty. If it's "daily walks, the airport, the grocery store, photo days," invest in a hip-seat or four-in-one. Buy one good carrier, not three mediocre ones.</p>
<p>Try them on with your baby (or a weighted doll) before you commit. The straps should feel snug but not tight, the belt should sit just above your hip bones, and you shouldn't feel pressure on your shoulders after 10 minutes.</p>

<h2>Our top picks at MamaCare</h2>
<p>The <a href="/products/ergonomic-3-in-1-baby-carrier-hip-seat">Ergonomic 3-in-1 Baby Carrier with Hip Seat</a> is our daily-driver pick — three carrying modes, sturdy lumbar belt, and a hip seat that takes the load off your shoulders.</p>
<p>If breathability is your priority, the <a href="/products/breathable-baby-hip-seat-carrier">Breathable Hip Seat Carrier</a> is built specifically for warm climates and long wears, with mesh-vented panels and an adjustable waist belt.</p>
<p>For growing families who want one carrier from newborn to toddler, the <a href="/products/4-in-1-baby-carrier-saliva-towel">4-in-1 Baby Carrier</a> covers every position with a comfortable, all-seasons fit.</p>

<h2>A word on safety</h2>
<p>Whichever carrier you pick, follow the TICKS rule: <strong>T</strong>ight, <strong>I</strong>n view at all times, <strong>C</strong>lose enough to kiss, <strong>K</strong>eep chin off chest, <strong>S</strong>upported back. Practice in front of a mirror the first few times. And always check the weight range — most carriers start at 7 lbs minimum.</p>
`
  },

  {
    slug: 'newborn-essentials-checklist',
    title: 'Newborn Essentials Checklist: What You Really Need (And What You Don\'t)',
    excerpt:
      'A no-nonsense list of what to actually buy before baby arrives — separating the must-haves from the marketing.',
    coverImage: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1400&q=80',
    author: 'MamaCare Editorial',
    date: '2026-04-22',
    readingMinutes: 7,
    tags: ['newborn', 'baby shower', 'checklist'],
    relatedProductSlugs: [
      'newborn-cotton-clothing-gift-set',
      'soft-fleece-baby-sleep-sack-head-support',
      'silicone-baby-bottle-straw-brush-set',
      'portable-baby-changing-pad-clutch'
    ],
    bodyHtml: `
<p>Every newborn checklist tells you to buy 47 things. Most of them sit unused in a closet by month two. Here is the actually-honest list — what's essential, what's overrated, and what to wait on until you know your baby.</p>

<h2>The first four weeks: bare essentials</h2>
<ul>
  <li><strong>Bodysuits and sleepers (8–10 of each).</strong> Snap-bottom or zip-front. You will go through more than you think. Buy a mix of newborn and 0–3 month sizes; some babies skip newborn entirely.</li>
  <li><strong>Swaddles or sleep sacks (4–5).</strong> Newborns sleep better wrapped snug. Modern sleep sacks like the <a href="/products/soft-fleece-baby-sleep-sack-head-support">Soft Fleece Sleep Sack</a> follow safe-sleep guidance — no loose blankets in the crib.</li>
  <li><strong>Diapers (1–2 packs of newborn, more 0–3).</strong> Don't overstock newborn size — many babies outgrow it in 2–3 weeks.</li>
  <li><strong>Wipes (a big box).</strong> You'll use 8–12 a day. Gentle, fragrance-free.</li>
  <li><strong>A safe sleep space.</strong> Bassinet, mini-crib, or full crib with a firm mattress and fitted sheet. Nothing else in the sleep area.</li>
  <li><strong>Burp cloths (8–10).</strong> The classic cotton flat-folds work better than anything cuter.</li>
</ul>

<h2>Feeding (whether breast, bottle, or both)</h2>
<ul>
  <li>If breastfeeding: a couple of nursing bras, lanolin-free nipple balm, breast pads.</li>
  <li>If bottle-feeding: 4–6 bottles, formula, a sterilizer, and a bottle brush. Our <a href="/products/silicone-baby-bottle-straw-brush-set">Silicone Bottle Brush Set</a> is dishwasher-safe and won't scratch.</li>
  <li>Don't buy specialty bottles in bulk. Get 2 of one brand and 2 of another — see which one your baby prefers.</li>
</ul>

<h2>Out and about</h2>
<ul>
  <li><strong>A car seat.</strong> Non-negotiable. Install it at least 2 weeks before due date.</li>
  <li><strong>A stroller.</strong> Don't overspend. A travel-system that pairs with your car seat is the easiest path.</li>
  <li><strong>A baby carrier.</strong> See our <a href="/blog/best-baby-carriers-2026">carrier buying guide</a>.</li>
  <li><strong>A portable changing pad.</strong> The <a href="/products/portable-baby-changing-pad-clutch">Portable Changing Pad Clutch</a> lives in your diaper bag for restaurants and parks.</li>
  <li><strong>A diaper bag.</strong> One spacious bag beats a fancy small one. Look for water resistance and machine-washable lining.</li>
</ul>

<h2>What you can skip (or wait on)</h2>
<ul>
  <li><strong>Baby shoes for newborns.</strong> They look cute. They serve no purpose until baby walks.</li>
  <li><strong>Wipe warmers.</strong> Babies adjust to room-temperature wipes quickly.</li>
  <li><strong>Crib bedding sets.</strong> Bumpers and pillows are unsafe. You only need fitted sheets.</li>
  <li><strong>Newborn dresses, overalls, and outfits with 9 snaps.</strong> Anything that complicates a 3 a.m. diaper change will be punished.</li>
  <li><strong>An entire nursery furniture set in month 8 of pregnancy.</strong> A crib and a dresser are plenty for the first six months.</li>
</ul>

<h2>The gift-friendly bundle</h2>
<p>If you're shopping for a friend's baby shower, the <a href="/products/newborn-cotton-clothing-gift-set">Newborn Cotton Clothing Gift Set Box</a> is our most-bought gift — eight cotton pieces in a giftable box. It's the parent-tested answer to "what does she actually need?"</p>

<h2>One last thing</h2>
<p>You will buy stuff you don't need. Everyone does. Don't beat yourself up. Buy less than you think now, and trust that whatever you need in week three you can order in two days.</p>
`
  },

  {
    slug: 'safe-sleep-sleep-sacks-vs-swaddles',
    title: 'Safe Sleep for Babies: Sleep Sacks vs. Swaddles, Explained',
    excerpt:
      'When to swaddle, when to switch to a sleep sack, and how to keep baby safely sleeping through the night.',
    coverImage: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1400&q=80',
    author: 'MamaCare Editorial',
    date: '2026-04-08',
    readingMinutes: 5,
    tags: ['safe sleep', 'newborn sleep', 'swaddle'],
    relatedProductSlugs: [
      'soft-fleece-baby-sleep-sack-head-support',
      'quilted-baby-sleeping-bag-wrap'
    ],
    bodyHtml: `
<p>Newborn sleep is unpredictable. What you put baby <em>in</em> for sleep shouldn't be. Sleep sacks and swaddles are the two safe-sleep tools every parent will use — here's the difference, and how to know when to switch.</p>

<h2>What is a swaddle?</h2>
<p>A swaddle is a snug wrap that holds baby's arms close to their body, mimicking the womb. It calms the startle reflex (the involuntary arm-jerk that wakes newborns) and signals to baby that it's time to sleep.</p>
<p>Traditional swaddles are flat blankets you fold yourself. Modern swaddles — including the <a href="/products/quilted-baby-sleeping-bag-wrap">Quilted Baby Sleeping Bag Wrap</a> — use velcro or zip closures so you can't accidentally swaddle too loose (loose blankets are a SIDS risk).</p>

<h2>What is a sleep sack?</h2>
<p>A sleep sack is a wearable blanket — sleeveless or with sleeves, zipped or snapped at the front, with a foot opening that lets baby kick. Unlike a swaddle, sleep sacks leave the arms free.</p>
<p>Our <a href="/products/soft-fleece-baby-sleep-sack-head-support">Soft Fleece Sleep Sack with Head Support</a> is sized for newborns and uses a fleece outer for cooler rooms.</p>

<h2>When to switch from swaddle to sleep sack</h2>
<p>The moment baby shows <strong>any sign of rolling</strong>, you must stop swaddling. Most babies start rolling around 8–12 weeks; some go earlier. A swaddled baby on their stomach can't push themselves back over — this is a SIDS risk.</p>
<p>The handoff is simple: at the first sign of attempted rolling, retire the swaddle and switch to a sleep sack with arms free. Some parents use a transition product (a swaddle with detachable arms) to ease the change.</p>

<h2>Safe sleep rules to follow regardless</h2>
<ul>
  <li><strong>Always on the back.</strong> Every nap, every night.</li>
  <li><strong>Firm, flat sleep surface.</strong> Crib, bassinet, or play yard with a fitted sheet — nothing else.</li>
  <li><strong>No loose bedding, bumpers, pillows, or stuffed animals</strong> in the sleep space.</li>
  <li><strong>Room-share, don't bed-share</strong> for the first 6 months.</li>
  <li><strong>Don't overheat baby.</strong> If you're comfortable in pajamas, baby is comfortable in a sleep sack.</li>
</ul>

<h2>TOG ratings explained</h2>
<p>TOG (Thermal Overall Grade) measures how warm a sleep sack is. The higher the number, the warmer:</p>
<ul>
  <li><strong>0.5 TOG</strong> — summer rooms (72–75°F)</li>
  <li><strong>1.0 TOG</strong> — comfortable rooms (68–72°F)</li>
  <li><strong>2.5 TOG</strong> — cooler nurseries (61–68°F)</li>
</ul>
<p>Check the label, dress baby underneath accordingly, and you'll avoid the sweaty-baby problem.</p>

<h2>The bottom line</h2>
<p>Use a swaddle for newborns. Switch to a sleep sack at the first sign of rolling. Keep the sleep space empty. Read the TOG rating. Your baby will sleep — eventually.</p>
`
  },

  {
    slug: 'baby-bouncer-buying-guide',
    title: 'Baby Bouncer Buying Guide: What Actually Matters',
    excerpt:
      'Reclining angles, harnesses, washability, and the features that separate a great bouncer from one that gets returned.',
    coverImage: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1400&q=80',
    author: 'MamaCare Editorial',
    date: '2026-03-19',
    readingMinutes: 4,
    tags: ['baby gear', 'buying guide', 'newborn'],
    relatedProductSlugs: [
      'folding-baby-bouncer-seat-light-gray',
      'folding-baby-bouncer-seat-camel'
    ],
    bodyHtml: `
<p>A baby bouncer is one of those rare baby products that earns its keep. A safe, comfortable seat where baby can nap, watch you cook dinner, or simply not be held for 20 minutes — that's worth a lot in the first months. Here's what to look for.</p>

<h2>Reclining angles</h2>
<p>You want at least two: a flatter angle for newborns (they have no neck control), and a more upright angle for older babies who want to see the world. Three angles is even better. Single-angle bouncers age out quickly.</p>

<h2>Harness type</h2>
<p>Three-point (over the shoulders and between the legs) is the minimum. Five-point harnesses with additional waist straps are safer for active babies. Always strap baby in — even for a "just a second" pause.</p>

<h2>Weight and age range</h2>
<p>Most bouncers max out around 20 lbs or when baby can sit unassisted — that's usually 6–9 months. Don't expect a bouncer to last through toddlerhood.</p>

<h2>Frame and stability</h2>
<p>Test how easy it is to tip the frame. A wide base with rubber feet is best. Avoid bouncers where baby can rock themselves into a tipping motion.</p>

<h2>Washable cover</h2>
<p>Every cover will get spit-up on it. The good ones unzip and machine-wash. Cheap ones require sponge-cleaning, which never really works.</p>

<h2>Portability</h2>
<p>If you'll move the bouncer between rooms (you will), look for a folding frame and a travel bag. Our <a href="/products/folding-baby-bouncer-seat-light-gray">Folding Baby Bouncer in Light Gray</a> and <a href="/products/folding-baby-bouncer-seat-camel">Camel</a> both fold flat and come with carry bags — handy for grandparent visits or photo days.</p>

<h2>Safety rules — every time</h2>
<ul>
  <li>Always use the harness, no matter how short the time.</li>
  <li>Never place the bouncer on an elevated surface (table, counter, sofa).</li>
  <li>Never let baby sleep in the bouncer. Bouncers are for awake time only.</li>
  <li>Move baby to a flat sleep surface if they fall asleep.</li>
  <li>Stop using when baby can sit up unassisted.</li>
</ul>

<h2>One bouncer is enough</h2>
<p>You don't need a bouncer <em>and</em> a swing <em>and</em> a rocker. Pick one well-built, foldable bouncer that grows with you. It'll get more use than any other "extra" piece of baby gear in your first six months.</p>
`
  },

  {
    slug: 'how-to-pack-perfect-diaper-bag',
    title: 'How to Pack the Perfect Diaper Bag (Without Lugging Everything)',
    excerpt:
      'The minimal essentials that cover 95% of outings — plus what to leave at home.',
    coverImage: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?auto=format&fit=crop&w=1400&q=80',
    author: 'MamaCare Editorial',
    date: '2026-02-28',
    readingMinutes: 4,
    tags: ['diaper bag', 'mom essentials', 'travel'],
    relatedProductSlugs: [
      'mom-diaper-bag-with-folding-stool',
      'large-foldable-mom-travel-bag-mosquito',
      'portable-baby-changing-pad-clutch'
    ],
    bodyHtml: `
<p>The number-one mistake new parents make with a diaper bag is bringing the entire nursery. The second mistake is bringing nothing and ending up at Target buying a $14 emergency diaper. Here is the realistic middle.</p>

<h2>The 8 essentials (any outing)</h2>
<ol>
  <li><strong>3 diapers</strong> (one more than you think you'll need).</li>
  <li><strong>A travel pack of wipes.</strong></li>
  <li><strong>A portable changing pad</strong> — our <a href="/products/portable-baby-changing-pad-clutch">foldable clutch version</a> lives in our bag permanently.</li>
  <li><strong>A wet bag or plastic bag</strong> for blowouts and dirty clothes.</li>
  <li><strong>A full change of clothes</strong> (bodysuit + pants minimum).</li>
  <li><strong>Burp cloth.</strong></li>
  <li><strong>Pacifier, lovey, or comfort item.</strong></li>
  <li><strong>Snacks/bottle/formula</strong> depending on age and feeding.</li>
</ol>

<h2>Add for longer outings (3+ hours)</h2>
<ul>
  <li>Extra bottle or sippy</li>
  <li>Two diapers more</li>
  <li>Second clothing change</li>
  <li>Sunscreen + hat (if outdoors)</li>
  <li>Light blanket</li>
</ul>

<h2>What to leave at home</h2>
<ul>
  <li>The whole pack of diapers (just three).</li>
  <li>Multiple full bottles "just in case."</li>
  <li>A wardrobe of outfits.</li>
  <li>Toys, books, and "activities" — your phone, the wipes container, and the table-edge will entertain baby.</li>
</ul>

<h2>Choose a bag that pulls its weight</h2>
<p>The right bag is roomy, water-resistant, padded on the straps, and easy to wipe down inside. Avoid: anything you couldn't clean spit-up off in 30 seconds, anything with a single tiny opening, or anything more fashion than function.</p>
<p>Two we love at MamaCare: the <a href="/products/mom-diaper-bag-with-folding-stool">Mom Diaper Bag with Hidden Folding Stool</a> for parks and playdates, and the <a href="/products/large-foldable-mom-travel-bag-mosquito">Large Foldable Mom Travel Bag</a> for road trips and beach days.</p>

<h2>The "always packed" trick</h2>
<p>Keep your diaper bag stocked with the basics at all times, and refill it the moment you get home. Don't wait until you're heading out the door. Future-you will thank present-you.</p>
`
  }
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));
}
