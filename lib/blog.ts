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
  },

  {
    slug: 'complete-guide-to-nursing-bras',
    title: "The Complete Guide to Nursing Bras: What to Buy, When to Buy It, and What to Skip",
    excerpt:
      "Wire-free, pumping-compatible, or sleeping bra — which nursing bra do you actually need? We break down every style, when to get fitted, and the features worth paying for.",
    coverImage: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=1400&q=80',
    author: 'MamaCare Editorial',
    date: '2026-07-01',
    readingMinutes: 7,
    tags: ['nursing', 'breastfeeding', 'maternity', 'buying guide'],
    bodyHtml: `
<p>If you're breastfeeding, a nursing bra isn't optional — it's the piece of clothing you'll wear more than anything else for the next year. And yet most mamas either buy too early (before the body has changed), buy the wrong style, or skip it entirely and regret it by week two. This guide covers everything.</p>

<h2>When to buy your first nursing bra</h2>
<p>The honest answer: not until 36–37 weeks of pregnancy. Your breasts can change up to two cup sizes after birth when your milk comes in — any bra bought in the second trimester may not fit at all. A good approach: buy 2–3 bras in your last month of pregnancy, then re-evaluate at 4–6 weeks postpartum once supply has stabilized.</p>

<h2>The four styles — and when each makes sense</h2>
<p><strong>Wire-free everyday bra.</strong> The workhorse. Designed for all-day wear during the nursing months. Look for drop-away cups (the cup unclips with one hand while the other holds baby), wide soft straps, and a snug band. This is the one you'll wear most.</p>
<p><strong>Sleep/lounge bra.</strong> A soft, stretchy bra for overnight feeding and lazy days at home. No clasps, no hardware — just pull the cup down. If you're leaking overnight, you'll want this plus nursing pads.</p>
<p><strong>Pumping bra / hands-free pumping bra.</strong> A specialized bra that holds pump flanges in place, leaving your hands free. Essential if you're pumping regularly — without it, you'll hold the flanges for 20 minutes per session. Some hybrid bras combine nursing and pumping in one.</p>
<p><strong>Sports/active bra.</strong> If you're returning to exercise, a nursing sports bra lets you feed before or after a workout without changing. Look for racerback with a front clasp or pullaway cups.</p>

<h2>What makes a good nursing bra — the non-negotiables</h2>
<ul>
  <li><strong>One-hand drop cup.</strong> You'll be holding a baby with the other hand. If the clasp requires two hands, you'll hate it by day three.</li>
  <li><strong>Soft band without underwire.</strong> Underwire can restrict milk ducts and contribute to mastitis, especially in the first months. Wire-free is the safe default for the first 3 months minimum.</li>
  <li><strong>Full coverage cups.</strong> Stretch-lace cups that cover the full breast and don't crinkle after feeding.</li>
  <li><strong>Multiple hook-and-eye settings on the band.</strong> Your ribcage expands during pregnancy and contracts after birth. Three settings give you room to adjust.</li>
  <li><strong>Machine washable.</strong> You will need to wash this bra constantly. A hand-wash-only nursing bra is a mistake.</li>
</ul>

<h2>How to measure your nursing size</h2>
<p>Measure at 36–37 weeks. Wrap a soft tape around the fullest part of your bust (don't compress). Your cup size will likely be 1–2 sizes bigger than your pre-pregnancy size. When in doubt, size up in the cup — you can always use a smaller hook setting on the band. Get re-fitted at 6 weeks postpartum if the fit feels off.</p>

<h2>How many nursing bras do you need?</h2>
<p>Three is the minimum: one on, one in the wash, one clean. Four gives you a comfortable rotation. Don't overbuy early — fit changes dramatically in the first 6 weeks.</p>

<h2>What to skip</h2>
<p><strong>Underwire nursing bras</strong> in the early months — the wires can compress milk ducts. <strong>Padded push-up styles</strong> — padding traps heat and moisture, which promotes mastitis. <strong>Anything with a complicated clasp</strong> — if you need two hands, it's not the right nursing bra.</p>

<h2>A note on sizing for different body types</h2>
<p>Full-bust mamas (D cup and above) should look for bras with structured (not stretch) cups for actual support. Petite mamas often find that wireless bralette styles work well — they're soft, adjustable, and don't gap. If you're between sizes, size up in the cup.</p>
`
  },

  {
    slug: 'newborn-sleep-schedule',
    title: 'Newborn Sleep Schedule: What to Expect in the First 3 Months',
    excerpt:
      'No newborn sleeps through the night — but understanding their natural sleep cycles makes the exhaustion easier to navigate. Here is what is normal and what actually helps.',
    coverImage: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1400&q=80',
    author: 'MamaCare Editorial',
    date: '2026-07-10',
    readingMinutes: 6,
    tags: ['newborn sleep', 'baby schedule', 'sleep tips'],
    relatedProductSlugs: [
      'soft-fleece-baby-sleep-sack-head-support',
      'quilted-baby-sleeping-bag-wrap',
      'smart-electric-rocking-bassinet-bedside',
    ],
    bodyHtml: `
<p>Every new parent hears the same thing: "sleep when the baby sleeps." It sounds simple. It's not — because newborns don't sleep the way adults do, and expecting them to follow a schedule in the first weeks is a recipe for frustration. Here is what their sleep actually looks like, and what you can do to help everyone get more rest.</p>

<h2>Why newborns sleep so differently</h2>
<p>Newborns spend up to <strong>70% of their sleep in REM (active) sleep</strong> — compared to about 20% for adults. This active sleep looks restless: you'll see fluttering eyelids, twitching, little sounds. This is completely normal and important for brain development. It also means they wake easily.</p>
<p>They also haven't developed a circadian rhythm yet. That internal clock — the one that tells your body it's dark, so it's time to sleep — takes 3 to 4 months to develop. Until then, day and night genuinely mean nothing to them.</p>

<h2>What "normal" newborn sleep looks like</h2>
<ul>
  <li><strong>0–4 weeks:</strong> 14–17 hours of sleep per day in 2–4 hour stretches. No pattern, no schedule. Feed on demand, sleep on demand.</li>
  <li><strong>1–2 months:</strong> Sleep starts consolidating slightly. You may begin to see a longer stretch (3–4 hours) at the start of the night.</li>
  <li><strong>2–3 months:</strong> A loose rhythm may emerge — longer night stretches, shorter daytime naps. Still not a "schedule," but more predictable.</li>
</ul>

<h2>The difference between day and night: how to help</h2>
<p>You can begin teaching day/night difference from week one — not through a schedule, but through environment cues:</p>
<ul>
  <li><strong>Daytime:</strong> Keep it bright and lively. Normal household noise is fine. Don't tiptoe around a napping newborn during the day.</li>
  <li><strong>Nighttime:</strong> Keep feeds and changes calm, quiet, and dim. No eye contact or stimulation. The message: nighttime is boring, daytime is exciting.</li>
</ul>

<h2>The 4-hour wake window</h2>
<p>Newborns can only handle about 45–90 minutes of awake time before they need to sleep again. If baby is awake longer than that, they'll become overtired — and overtired babies are actually harder to settle than tired ones. Watch for yawning, glazed eyes, or turning away from stimulation. Those are your "put me down" signals.</p>

<h2>Setting up the sleep environment</h2>
<p>Safe sleep guidelines haven't changed: firm, flat surface, on their back, nothing in the sleep space. But you can make that environment more sleep-conducive:</p>
<ul>
  <li><strong>White noise</strong> at a consistent volume (about 65 dB — similar to a shower running) helps block household noise and mimics the womb environment.</li>
  <li><strong>A sleep sack</strong> instead of loose blankets. Our <a href="/products/soft-fleece-baby-sleep-sack-head-support">Soft Fleece Sleep Sack</a> keeps baby warm without any loose fabric in the sleep space.</li>
  <li><strong>Darkness</strong> — even at 3 a.m. feeds. A dim red-light lamp is less stimulating than overhead lights.</li>
</ul>

<h2>When to worry (and when not to)</h2>
<p>Not sleeping through the night at 6 weeks is not a problem. Waking every 2 hours is not a problem. Not settling immediately is not a problem. These are developmentally normal. Talk to your pediatrician if baby is sleeping significantly less than 14 hours total, is consistently hard to wake, or shows signs of breathing irregularities during sleep.</p>

<h2>The one thing that actually helps most</h2>
<p>Lower your expectations — genuinely. Most babies don't consistently sleep through the night until 4–6 months at the earliest, and many not until later. Accepting that this is a season, not a failure, makes it easier to survive. You are not doing anything wrong. Your baby is doing exactly what newborns do.</p>
`,
  },

  {
    slug: 'when-to-start-tummy-time',
    title: 'When to Start Tummy Time — And How to Make Baby Actually Enjoy It',
    excerpt:
      'Tummy time is one of the most important things you can do for your baby\'s development — and one of the most resisted. Here is when to start, how long, and how to get buy-in from a baby who hates it.',
    coverImage: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1400&q=80',
    author: 'MamaCare Editorial',
    date: '2026-07-05',
    readingMinutes: 5,
    tags: ['tummy time', 'baby development', 'newborn'],
    relatedProductSlugs: [
      'folding-baby-bouncer-seat-light-gray',
      'newborn-cotton-clothing-gift-set',
    ],
    bodyHtml: `
<p>Tummy time is supervised awake time spent on baby's stomach. It builds the neck, shoulder, and core strength babies need to roll, sit, crawl, and eventually walk. And most babies hate it — at least at first. Here is everything you need to know.</p>

<h2>When to start</h2>
<p>Day one. Seriously. As soon as you're home from the hospital, you can begin tummy time — even if it's just a few minutes at a stretch. Starting early means baby's neck muscles get used to the position before the frustration kicks in.</p>
<p>The American Academy of Pediatrics recommends starting immediately after birth for healthy, full-term babies.</p>

<h2>How much tummy time per day</h2>
<ul>
  <li><strong>0–1 month:</strong> 2–3 sessions of 1–2 minutes each.</li>
  <li><strong>1–2 months:</strong> Work up to 10 minutes total per day.</li>
  <li><strong>2–4 months:</strong> 20–30 minutes total, spread throughout the day.</li>
  <li><strong>4 months+:</strong> As much as baby tolerates during awake play time.</li>
</ul>
<p>These are cumulative totals — not single sessions. Three 5-minute sessions equals 15 minutes. That counts.</p>

<h2>Why baby hates it (and why that's okay)</h2>
<p>In the early weeks, baby's neck muscles aren't strong enough to lift their head comfortably. Tummy time is genuinely hard work for them. The crying is real — they're frustrated. This is normal. You aren't hurting them. Push through 2 minutes and then flip them over. Do it again after the next nap.</p>

<h2>How to make it easier</h2>
<ul>
  <li><strong>Get on the floor with them.</strong> Your face at their level is far more motivating than a blank floor.</li>
  <li><strong>Use a rolled towel or small pillow under their chest</strong> to take some of the pressure off their arms in the early weeks.</li>
  <li><strong>Try tummy-to-tummy.</strong> Lie on your back, put baby on your chest. This counts as tummy time and most babies love it.</li>
  <li><strong>Use a mirror.</strong> Babies are fascinated by their own reflection. A small baby-safe mirror on the floor gives them a reason to lift their head.</li>
  <li><strong>Time it right.</strong> After a nap, after a diaper change — when baby is alert and not hungry. Never right after a feed (spit-up risk).</li>
</ul>

<h2>What tummy time builds</h2>
<ul>
  <li>Neck and shoulder strength for head control</li>
  <li>Core stability for sitting and standing</li>
  <li>Arm strength for crawling and pushing up</li>
  <li>Helps prevent flat head syndrome (positional plagiocephaly) from too much back-lying</li>
  <li>Motor milestone progression — rolling, crawling, walking all build on tummy time foundations</li>
</ul>

<h2>Red flags to watch for</h2>
<p>If baby consistently turns their head to only one side, or you notice their head flattening on one side, mention it to your pediatrician. This can indicate tight neck muscles (torticollis) that respond very well to early physical therapy.</p>

<h2>Consistency beats duration</h2>
<p>Two minutes three times a day beats one 20-minute session baby screams through. The goal is to build the habit and the strength gradually. Don't skip it — but don't force marathon sessions either.</p>
`,
  },

  {
    slug: 'postpartum-recovery-essentials',
    title: 'Postpartum Recovery Essentials: What Your Body Needs in the First 6 Weeks',
    excerpt:
      'The fourth trimester is real. Here is what actually helps your body heal — and what you can skip.',
    coverImage: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1400&q=80',
    author: 'MamaCare Editorial',
    date: '2026-06-28',
    readingMinutes: 7,
    tags: ['postpartum', 'recovery', 'new mom', 'fourth trimester'],
    bodyHtml: `
<p>Every conversation about having a baby focuses on the birth and the newborn. Almost nothing prepares you for what happens to your body in the weeks after. The fourth trimester is real — and it deserves the same attention as the pregnancy itself.</p>

<h2>What's happening in your body the first 6 weeks</h2>
<p>Your uterus is contracting back to its pre-pregnancy size (you'll feel this as cramps, especially during breastfeeding — this is normal). Your hormone levels are dropping sharply, which can cause mood swings, night sweats, and hair loss. If you had a vaginal birth, your perineum is healing. If you had a C-section, you have a surgical incision healing underneath the skin. Your body is doing extraordinary work.</p>

<h2>The physical essentials</h2>
<p><strong>Peri bottle.</strong> The hospital will give you one. Use it. Fill it with warm water and use it after every bathroom trip instead of wiping. If yours is the basic squeeze-bottle version, an upside-down peri bottle is a significant upgrade — it lets you spray forward without awkward maneuvering.</p>
<p><strong>Postpartum pads.</strong> Maxi pads, not tampons. You'll have lochia (postpartum bleeding) for 4–6 weeks. The first days are heavy; it lightens to spotting over time. If bleeding suddenly gets heavier after it was lightening, you've overdone it — rest more.</p>
<p><strong>Ice packs.</strong> Hospital-grade disposable ice packs for the first 24–48 hours post-birth do more for perineal pain than almost anything else. After the first two days, switch to sitz baths.</p>
<p><strong>Stool softeners.</strong> No one warns you. The first postpartum bowel movement is one of the most dreaded events of new motherhood. Start stool softeners (like Colace) the day you deliver. Drink water. Eat fiber. Take your time.</p>
<p><strong>Comfortable, loose clothing.</strong> You'll still look about 5 months pregnant for 4–6 weeks. Your postpartum wardrobe should be: nothing with a waistband for the first two weeks. Wrap dresses, loose nightgowns, button-front shirts for nursing, maternity leggings.</p>

<h2>For C-section recovery</h2>
<p>The incision site needs to stay dry and clean. Avoid lifting anything heavier than your baby for the first 2 weeks. Don't drive until you can do an emergency stop without pain (usually 4–6 weeks). High-waisted underwear or a postpartum belly band can help support the incision area and reduce discomfort from waistbands rubbing.</p>

<h2>Nutrition and hydration</h2>
<p>If you're breastfeeding, you need more calories than you did while pregnant — roughly 400–500 extra per day. Hydration is critical: aim for 100+ oz of water a day. Iron-rich foods help replenish what you lost during birth. Omega-3s (found in salmon, walnuts, flaxseed) support mood and postpartum brain function.</p>
<p>This is not the time to diet. Your body needs fuel to heal, produce milk, and function on broken sleep. Eat nourishing food when you can, accept the meals people offer, and put the scale away for at least 3 months.</p>

<h2>Mental health — the part people skip</h2>
<p>Baby blues (tearfulness, irritability, sadness) affect up to 80% of new mothers in the first 2 weeks. This is a normal hormonal response. Postpartum depression (PPD) is different: it's persistent, often starts after the first 2 weeks, and affects up to 1 in 5 mothers. Symptoms include persistent sadness, anxiety, feeling disconnected from baby, difficulty functioning, or intrusive thoughts.</p>
<p>PPD is not a personal failure. It's a medical condition with effective treatment. If you're concerned, talk to your OB or midwife. The Edinburgh Postnatal Depression Scale (EPDS) is a simple screening tool your provider may give you — answer it honestly.</p>

<h2>What you actually need vs. what's marketed to you</h2>
<p>You don't need: a postpartum belly wrap (unless your provider specifically recommends it for diastasis recti), a push present, a special "postnatal supplement" marketed at new moms, or any device that claims to accelerate recovery. You do need: rest, help, nourishing food, and someone who will hold the baby while you sleep for 3 hours in the middle of the day. Advocate for that.</p>

<h2>One thing that helps more than any product</h2>
<p>Accepting help. If someone offers to bring food, say yes. If someone offers to hold the baby while you shower, say yes. The cultural myth that new mothers should "bounce back" and "do it all" is one of the most damaging things in modern parenting culture. You just grew a human. Give yourself grace.</p>
`,
  },

  {
    slug: 'best-baby-gear-first-time-moms',
    title: 'The Best Baby Gear for First-Time Moms: What\'s Worth It and What\'s Not',
    excerpt:
      'First-time parents are the most marketed-to people on earth. Here is a clear-eyed breakdown of the gear that earns its place — and what you can skip entirely.',
    coverImage: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1400&q=80',
    author: 'MamaCare Editorial',
    date: '2026-06-20',
    readingMinutes: 8,
    tags: ['baby gear', 'buying guide', 'first-time mom'],
    relatedProductSlugs: [
      'folding-baby-bouncer-seat-light-gray',
      'ergonomic-3-in-1-baby-carrier-hip-seat',
      'smart-electric-rocking-bassinet-bedside',
      'mom-diaper-bag-with-folding-stool',
    ],
    bodyHtml: `
<p>The baby gear market is enormous and relentless. By the time you're 30 weeks pregnant, the algorithm has decided you need a $600 stroller, a $400 bassinet, three types of bouncers, and a wipe warmer. Some of it is genuinely useful. A lot of it isn't. Here is the honest breakdown.</p>

<h2>Tier 1: Worth every penny</h2>

<p><strong>A good baby carrier.</strong> This is the single item most first-time moms say they wish they'd bought sooner. A carrier that fits well means you can hold your baby while having two hands free — to cook, fold laundry, grocery shop, or just feel like a person. The <a href="/products/ergonomic-3-in-1-baby-carrier-hip-seat">Ergonomic 3-in-1 with Hip Seat</a> covers all carry positions from newborn to toddler. Buy one before baby arrives.</p>

<p><strong>A bassinet for the first 3–4 months.</strong> Having baby sleep in your room (but not your bed) for the first 6 months is the AAP recommendation for SIDS prevention — and it makes night feeds dramatically easier. A bedside bassinet like the <a href="/products/smart-electric-rocking-bassinet-bedside">Smart Electric Rocking Bassinet</a> keeps baby at arm's reach without requiring you to walk to another room at 3 a.m.</p>

<p><strong>A bouncer.</strong> The humble bouncer is one of the most practical baby items ever made. A safe place to put baby down when your arms need a break, a good view of the room, and a gentle bounce that soothes. Our <a href="/products/folding-baby-bouncer-seat-light-gray">Folding Baby Bouncer</a> folds flat for travel and covers 0–9 months.</p>

<p><strong>Sleep sacks (3–4 of them).</strong> Safe sleep means nothing in the crib — no loose blankets. A sleep sack replaces the blanket. Buy multiple because they get washed constantly.</p>

<p><strong>A solid diaper bag.</strong> Not a fashionable one — a functional one. You want: waterproof lining, multiple pockets, wide opening, comfortable straps, and enough room for everything without being a second suitcase. The <a href="/products/mom-diaper-bag-with-folding-stool">Mom Diaper Bag with Hidden Folding Stool</a> adds a built-in seat for park outings.</p>

<h2>Tier 2: Nice to have, not essential</h2>

<p><strong>A swing.</strong> Some babies love swings. Some don't. If you can borrow one to try first, do that. If your baby loves it, it's worth buying. Don't buy in advance.</p>

<p><strong>A bottle warmer.</strong> If you're formula feeding or bottle-feeding pumped milk, a warmer is a nice convenience at 2 a.m. It's not essential — a bowl of warm water works too — but it's faster.</p>

<p><strong>A white noise machine.</strong> Very helpful for light-sleeping babies, for blocking household sounds, and for creating a sleep association. A cheap one works just as well as a $80 one.</p>

<h2>Tier 3: You don't need this</h2>

<p><strong>A Diaper Genie or diaper pail.</strong> A small lidded trash can with a lid works perfectly. The proprietary bags are expensive and the mechanism jams.</p>

<p><strong>A wipe warmer.</strong> Babies adapt to room-temperature wipes in about three days. You will never need to warm a wipe at grandma's house anyway.</p>

<p><strong>Baby shoes before walking.</strong> Adorable. Completely pointless until baby is standing and beginning to walk outdoors.</p>

<p><strong>A dedicated changing table.</strong> A changing pad on top of a regular dresser does the same job and takes up the same space. Save the money.</p>

<p><strong>A "baby monitor" with 47 sensors.</strong> A basic audio monitor (or a camera monitor if you want visual) is all you need. The $300 device that tracks breathing, room temperature, and sends alerts to your phone will make you more anxious, not less.</p>

<h2>The one rule</h2>
<p>Don't buy anything "just in case." Buy it when you need it. With 2-day shipping, there is almost nothing you can't have within 48 hours of discovering you need it. Spend your money on the Tier 1 items and wait on everything else until you know your baby.</p>
`,
  },

  {
    slug: 'feeding-your-baby-first-year',
    title: 'Feeding Your Baby Through the First Year: A Stage-by-Stage Guide',
    excerpt:
      'Breast, bottle, formula, solids — feeding your baby changes every few months. Here is what to expect at each stage and how to navigate each transition.',
    coverImage: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=1400&q=80',
    author: 'MamaCare Editorial',
    date: '2026-06-10',
    readingMinutes: 8,
    tags: ['feeding', 'breastfeeding', 'formula', 'solids', 'baby nutrition'],
    relatedProductSlugs: [
      'silicone-baby-bottle-straw-brush-set',
      'portable-baby-bottle-warmer-cooler',
      'portable-baby-changing-pad-clutch',
    ],
    bodyHtml: `
<p>How you feed your baby will change more in the first year than almost any other aspect of parenting. What works at 6 weeks won't work at 6 months. Here is a stage-by-stage guide to what's happening, what's normal, and how to make each transition smoother.</p>

<h2>0 – 4 months: Milk only</h2>
<p>Whether you're breastfeeding, formula feeding, or combining both — your baby's only nutrition source for the first 4–6 months is milk. No water, no juice, no solids. This is not early.</p>

<p><strong>Breastfeeding in the early weeks:</strong> Your milk supply is established in the first 4–6 weeks. Feed on demand — every 1.5 to 3 hours is normal for newborns. Supply is driven by demand: the more you nurse (or pump), the more milk your body produces. Supplementing with formula in the early weeks without also pumping can reduce supply.</p>

<p><strong>Formula feeding:</strong> Follow the manufacturer's instructions exactly for mixing. Don't dilute formula to make it last longer — it reduces nutrition and can cause dangerous electrolyte imbalances. Feed on demand in the early weeks, then move toward a looser schedule around 6–8 weeks.</p>

<p><strong>Bottle basics:</strong> Whether you're using pumped milk or formula, having good bottles and a reliable bottle brush matters more than you'd think. Our <a href="/products/silicone-baby-bottle-straw-brush-set">Silicone Bottle Brush Set</a> reaches the bottom and bends of any bottle without scratching.</p>

<h2>4 – 6 months: Watching for readiness signs</h2>
<p>The AAP recommends introducing solid foods around 6 months, but some babies show readiness a little earlier. Readiness signs — not age alone — are the guide:</p>
<ul>
  <li>Baby can sit with minimal support and hold their head steady</li>
  <li>Shows interest in food (watching you eat, reaching for food)</li>
  <li>Has lost the tongue-thrust reflex (pushing food out of the mouth automatically)</li>
</ul>
<p>Starting solids too early — before 4 months — increases allergy and choking risk. Don't rush it.</p>

<h2>6 months: First solids</h2>
<p>Single-ingredient purees are the traditional starting point: sweet potato, butternut squash, peas, pear, banana. Introduce one new food every 3–5 days and watch for reactions (rash, swelling, vomiting, diarrhea). Milk (breast or formula) remains the primary nutrition source — solids at this stage are about exploring flavor and texture, not replacing milk feeds.</p>
<p>Baby-led weaning (BLW) — skipping purees and going straight to soft finger foods — is increasingly popular and safe for most babies with good head control. Consult your pediatrician if you want to try this approach.</p>

<h2>8 – 10 months: Texture progression</h2>
<p>Move from smooth purees to mashed, lumpy, then soft finger foods. Your baby needs practice with texture before their first birthday or they may become resistant to anything that isn't completely smooth. Gagging (not choking) is normal as they learn — gagging is a safety reflex, not a danger sign.</p>

<h2>10 – 12 months: Building toward family foods</h2>
<p>By 10–12 months, most babies can eat soft versions of most foods the family eats — just cut into small pieces and avoid high-sodium, high-sugar, or honey (which poses a botulism risk under 12 months). Whole cow's milk is not recommended before 12 months; breast milk or formula remains primary.</p>

<h2>12 months: The transition</h2>
<p>At 12 months you can introduce whole cow's milk (full-fat, not low-fat — baby's developing brain needs dietary fat). Breast milk can continue as long as desired. Formula is no longer needed. Milk intake typically drops to 16–24 oz per day as solid foods take on more of the nutritional load.</p>

<h2>Common feeding challenges</h2>
<p><strong>Refusing the bottle:</strong> Common in breastfed babies. Try different bottle shapes, different temperatures, having someone other than mom offer it, and offering when baby is calm rather than hungry.</p>
<p><strong>Food refusal at solids stage:</strong> Normal. It can take 10–15 exposures to a new food before a baby accepts it. Keep offering without pressure.</p>
<p><strong>Gagging at finger foods:</strong> As described above — normal. Choking is silent; gagging is loud. Trust your baby's gag reflex.</p>

<h2>One reassurance</h2>
<p>However you feed your baby — breast, formula, combination — what matters most is that baby is fed, growing, and thriving. The feeding method is not a measure of your love or your parenting quality.</p>
`,
  },

  {
    slug: 'what-to-pack-in-your-hospital-bag',
    title: "What to Pack in Your Hospital Bag: The Only Checklist You'll Need",
    excerpt:
      "First-time mama or second — the hospital bag is one of those things everyone overpacks. Here's what you actually need for labor, delivery, and recovery.",
    coverImage: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1400&q=80',
    author: 'MamaCare Editorial',
    date: '2026-06-15',
    readingMinutes: 6,
    tags: ['hospital bag', 'birth prep', 'newborn', 'maternity'],
    bodyHtml: `
<p>Somewhere around week 35, every mama opens a tab titled "hospital bag checklist" and immediately feels overwhelmed. Most lists tell you to pack 47 items. The reality: hospitals supply a lot, you won't use half of it, and you can send your partner for anything you forget. Here is the trimmed, realistic version.</p>

<h2>Pack your bag by week 36</h2>
<p>Not because you'll go early — most first-time mamas don't — but because labor can start without much warning and having a ready bag removes one decision from a day that will already have too many.</p>

<h2>For labor (the "going in" bag)</h2>
<ul>
  <li><strong>Your ID, insurance card, and hospital forms.</strong> Pre-register online at your hospital if possible — it cuts paperwork on the day.</li>
  <li><strong>Birth plan.</strong> One page, bullet points. Bring 4 copies: one for your bag, one for your partner, two for the nursing staff.</li>
  <li><strong>Phone + charger.</strong> Your hospital room will have one outlet near the bed. Bring a long cord.</li>
  <li><strong>A comfort item.</strong> A pillow from home with a colorful pillowcase (so it doesn't get lost), a favorite blanket, a small speaker.</li>
  <li><strong>Snacks for your support person.</strong> They may be there 24 hours. The vending machine will get old.</li>
  <li><strong>Lip balm.</strong> Labor is dehydrating. You'll thank yourself.</li>
  <li><strong>Hair ties.</strong> Multiple.</li>
</ul>

<h2>For postpartum recovery (your first 24–48 hours)</h2>
<ul>
  <li><strong>Loose, dark-colored pajamas or a nightgown.</strong> Hospital gowns work but something from home feels better. Look for front-button or wrap styles for skin-to-skin and nursing access.</li>
  <li><strong>A nursing bra or soft bralette.</strong> Bring 2. Your milk won't come in immediately, but colostrum will, and you'll want something on.</li>
  <li><strong>Nursing pads.</strong> For when milk does come in, especially overnight.</li>
  <li><strong>Your own toiletries.</strong> Hospital soap is fine but your own shampoo and face wash will feel like a luxury at 5 a.m.</li>
  <li><strong>Non-slip socks or slippers.</strong> You'll be walking to the bathroom in the middle of the night.</li>
  <li><strong>Going-home clothes.</strong> Something loose at the waist — you'll still look about 5 months pregnant. Maternity leggings are perfect.</li>
</ul>

<h2>For baby</h2>
<ul>
  <li><strong>A going-home outfit.</strong> One or two options. Newborn or 0–3 month size depending on your baby's estimated weight. Footies with a zip front are easiest.</li>
  <li><strong>A swaddle or sleep sack.</strong> Hospitals provide blankets but your own is warmer and familiar for the ride home.</li>
  <li><strong>The car seat.</strong> Installed before you go in. You won't be discharged without it.</li>
</ul>

<h2>For your partner or support person</h2>
<ul>
  <li>A change of clothes and toiletries (if staying overnight)</li>
  <li>Phone charger and earbuds</li>
  <li>Cash (parking, vending machines)</li>
  <li>Snacks — see above</li>
</ul>

<h2>What the hospital provides (so you don't need to pack)</h2>
<p>Most hospitals provide: mesh underwear (bring some home — they're extraordinary), postpartum pads (the big ones), peri bottle, newborn diapers and wipes, formula samples if formula feeding, a bulb syringe, basic toiletries. Ask your specific hospital what's included at your pre-birth tour.</p>

<h2>What to leave home</h2>
<ul>
  <li>Jewelry, valuables</li>
  <li>A full postpartum recovery kit — you can unpack it when you get home</li>
  <li>Multiple changes of clothes for baby — one or two is plenty for 48 hours</li>
  <li>Your laptop (you won't use it)</li>
  <li>A full candle or diffuser setup — most hospitals don't allow open flames or strong scents</li>
</ul>

<h2>One practical tip from every mama who's done this</h2>
<p>Pack a small "quick access" bag inside your main bag — the lip balm, phone charger, hair ties, and snacks you'll need immediately. When you arrive in labor, you don't want to dig through a full suitcase to find the charger.</p>
<p>And remember: the one thing you cannot forget — yourself. Everything else is replaceable in a 2-hour Amazon order.</p>
`
  }
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));
}
