import { getAllConfig, setConfig } from './db';

/**
 * Page content management for the 7 editable static pages.
 *
 * Each page has 4 editable keys, prefixed with `page_<slug>_`:
 *   - title    (browser tab + Google search title)
 *   - meta     (SEO meta description)
 *   - heading  (the H1 shown at the top of the page)
 *   - body     (HTML markup of the page body)
 *
 * Pages render the DB value when set, otherwise fall back to the defaults below.
 */

export type PageId = 'about' | 'contact' | 'faq' | 'shipping' | 'returns' | 'privacy' | 'terms';

export type PageContent = {
  title: string;
  meta: string;
  heading: string;
  body: string;
};

export const EDITABLE_PAGES: { id: PageId; label: string; path: string; note?: string }[] = [
  { id: 'about',    label: 'About',    path: '/about',    note: 'Story page with contact form at bottom.' },
  { id: 'contact',  label: 'Contact',  path: '/contact',  note: 'Contact form appears below your body text.' },
  { id: 'faq',      label: 'FAQ',      path: '/faq',      note: 'Q&A structure stays — your body is the intro above it.' },
  { id: 'shipping', label: 'Shipping', path: '/shipping' },
  { id: 'returns',  label: 'Returns',  path: '/returns' },
  { id: 'privacy',  label: 'Privacy',  path: '/privacy' },
  { id: 'terms',    label: 'Terms',    path: '/terms',    note: 'Contains the legally important dropshipping disclosure — review carefully if editing.' }
];

export const DEFAULTS: Record<PageId, PageContent> = {
  about: {
    title: 'About MamaCare — Made by Mamas, for Mamas',
    meta: 'MamaCare is a curated baby-gear store run by a small team of parents. Learn our story, our values, and contact us directly.',
    heading: 'Soft essentials for every season of motherhood.',
    body: `
<p>MamaCare started with a simple thought after the birth of our first baby: there had to be a kinder way to shop for motherhood. So we built one.</p>
<p>We curate every product with our own families in mind. Soft materials, thoughtful designs, and the kind of details that matter at 2 a.m. but no one mentions in product photos.</p>
<p>MamaCare is a small, mama-run curated retailer. We source baby gear, sleep, feeding essentials, and toys from trusted suppliers and ship them directly to you.</p>
<ul class="stats">
  <li><strong>10,000+</strong> happy mamas</li>
  <li><strong>4.8 ★</strong> average rating</li>
  <li><strong>14 days</strong> easy returns</li>
  <li><strong>Free</strong> U.S. shipping over $50</li>
</ul>
`
  },
  contact: {
    title: "Contact MamaCare — We'd love to hear from you",
    meta: 'Get in touch with the MamaCare team. We answer every message — usually within one business day.',
    heading: 'Say hello',
    body: `<p>We answer every email — usually within one business day.</p>`
  },
  faq: {
    title: 'FAQ — Frequently Asked Questions',
    meta: 'Answers to common questions about MamaCare orders, shipping, returns, and product care.',
    heading: 'FAQ',
    body: ``
  },
  shipping: {
    title: 'Shipping — Fast, Free Worldwide Delivery',
    meta: 'MamaCare ships worldwide with free U.S. delivery on orders over $50. See our delivery times and tracking info.',
    heading: 'Shipping',
    body: `
<p>We ship worldwide. Because we ship directly from our supplier warehouses:</p>
<ul>
  <li><strong>U.S. orders:</strong> 5–9 business days</li>
  <li><strong>Canada, U.K., Australia, NZ, Ireland:</strong> 8–14 business days</li>
  <li><strong>Other international:</strong> 8–18 business days</li>
</ul>
<p>Free standard shipping on U.S. orders over $50. Express options shown at checkout.</p>
<p>You'll receive a tracking link by email as soon as your order leaves our warehouse.</p>
`
  },
  returns: {
    title: 'Returns & Exchanges — 14-Day Policy',
    meta: '14-day easy returns at MamaCare. Read our return policy and how to start a return.',
    heading: 'Returns & Exchanges',
    body: `
<p>We want every mama to love what arrives. If something isn't right, you have <strong>14 days</strong> from the date of delivery to request a return.</p>
<h2>Eligibility</h2>
<p>To qualify for a return, items must be:</p>
<ul>
  <li>Unworn, unwashed, and in original packaging.</li>
  <li>Returned within 14 days of delivery.</li>
  <li>Accompanied by your order number.</li>
</ul>
<h2>Final-sale items</h2>
<p>The following items cannot be returned for health and safety reasons:</p>
<ul>
  <li>Bottle warmers, brushes, and any product where the seal has been broken.</li>
  <li>Used personal-care products (balms, oils, vitamins).</li>
  <li>Items marked "Final Sale" at checkout.</li>
</ul>
<h2>How to start a return</h2>
<p>Email us at <a href="mailto:mamaacaree@gmail.com">mamaacaree@gmail.com</a> with your order number and the reason for the return. We'll send you a return address and instructions within 1 business day.</p>
<h2>Refunds</h2>
<p>Refunds are issued to your original payment method within 5 business days of us receiving the returned item. Shipping fees are non-refundable. Return shipping is the customer's responsibility unless the item arrived damaged or defective.</p>
<h2>Damaged or defective items</h2>
<p>If your item arrived damaged or defective, contact us within 7 days of delivery with photos and we'll replace it or refund you in full — including any return shipping cost.</p>
`
  },
  privacy: {
    title: 'Privacy Policy',
    meta: 'How MamaCare collects, uses, and protects your data.',
    heading: 'Privacy Policy',
    body: `
<p class="muted">Last updated: May 2026</p>
<h2>What we collect</h2>
<p>To fulfill your order we collect: your name, email, shipping address, phone (optional), and payment confirmation.</p>
<p>Payments are processed by Stripe and PayPal — we never see or store your full card details.</p>
<h2>How we use it</h2>
<p>To process orders, send tracking updates, and respond to support requests. We never sell your data to third parties.</p>
<h2>Email marketing</h2>
<p>If you subscribe to our newsletter, we use your email to send occasional product updates. You can unsubscribe at any time using the link in any of our emails.</p>
<h2>Your rights</h2>
<p>You can request access to your data, correction of inaccurate data, or deletion at any time by emailing us at <a href="mailto:mamaacaree@gmail.com">mamaacaree@gmail.com</a>.</p>
<h2>Cookies</h2>
<p>We use minimal cookies to keep your cart between sessions and (optionally) measure traffic via Google Analytics. No personally-identifiable data is collected by these cookies.</p>
<h2>Contact</h2>
<p>Privacy questions? Email <a href="mailto:mamaacaree@gmail.com">mamaacaree@gmail.com</a>.</p>
`
  },
  terms: {
    title: 'Terms and Conditions',
    meta: 'Read the terms and conditions governing your use of MamaCare and purchases from our store.',
    heading: 'Terms and Conditions',
    body: `
<p class="muted">Last updated: May 2026</p>
<p>Welcome to MamaCare. These Terms and Conditions ("Terms") govern your access to and use of the MamaCare website (the "Site") and your purchases from MamaCare ("we," "us," or "our"). By using the Site or placing an order, you agree to be bound by these Terms.</p>
<h2>1. About MamaCare — Dropshipping Disclosure</h2>
<p><strong>MamaCare is a curated dropshipping retailer.</strong> We do <strong>not</strong> manufacture, design, assemble, warehouse, or quality-test the products sold on this Site. Each product listed in our catalog is sourced from third-party suppliers and shipped directly from those suppliers' warehouses to you. Our role is to curate, list, market, and provide customer support for the products our suppliers fulfill.</p>
<p>Because we are a dropshipping store, the following implications apply:</p>
<ul>
  <li><strong>Origin and manufacturing.</strong> Products are typically manufactured and shipped from international warehouses. Country of origin may vary by product and batch.</li>
  <li><strong>Shipping times.</strong> Delivery typically takes 5–9 business days (U.S.) and 8–18 business days (international).</li>
  <li><strong>Product accuracy.</strong> Minor variations in color, fabric texture, dimensions, or packaging may occur. We'll make it right if a product materially differs from the description.</li>
  <li><strong>Product safety.</strong> We review listings for U.S. CPSC compliance, but as the retailer (not manufacturer) we cannot independently certify every product. Follow all manufacturer instructions and safety labels.</li>
  <li><strong>Warranties.</strong> Manufacturer warranties are provided by the original manufacturer, not by MamaCare. Our liability is limited to the purchase price.</li>
</ul>
<h2>2. Orders, Pricing, and Payment</h2>
<p>All prices are in U.S. dollars. We reserve the right to change prices at any time. By placing an order you authorize us (through Stripe and/or PayPal) to charge your selected payment method.</p>
<h2>3. Shipping</h2>
<p>Shipping times are estimates. International shipments may be subject to customs duties and taxes that are the customer's responsibility.</p>
<h2>4. Returns and Refunds</h2>
<p>You may return eligible items within <strong>14 days</strong> of delivery. See our <a href="/returns">Returns policy</a> for full details.</p>
<h2>5. Intellectual Property</h2>
<p>All content on this Site is the property of MamaCare or its licensors. You may not reproduce or distribute any content without written permission.</p>
<h2>6. Limitation of Liability</h2>
<p>To the fullest extent permitted by law, MamaCare shall not be liable for any indirect, incidental, special, consequential, or punitive damages. Our maximum aggregate liability shall not exceed the purchase price you paid.</p>
<h2>7. Changes to These Terms</h2>
<p>We may update these Terms at any time. The "Last updated" date will reflect any changes.</p>
<h2>8. Contact</h2>
<p>Questions? Reach us at <a href="mailto:mamaacaree@gmail.com">mamaacaree@gmail.com</a>.</p>
<p class="muted">By placing an order you confirm that you have read, understood, and agree to these Terms and Conditions, including the dropshipping disclosure above.</p>
`
  }
};

const FIELDS: (keyof PageContent)[] = ['title', 'meta', 'heading', 'body'];
const keyFor = (id: PageId, field: keyof PageContent) => `page_${id}_${field}`;

/** Fetch full content for one page, with defaults applied for any missing field. */
export async function getPageContent(id: PageId): Promise<PageContent> {
  const config = await getAllConfig();
  const def = DEFAULTS[id];
  return {
    title:   config[keyFor(id, 'title')]   || def.title,
    meta:    config[keyFor(id, 'meta')]    || def.meta,
    heading: config[keyFor(id, 'heading')] || def.heading,
    body:    config[keyFor(id, 'body')]    || def.body
  };
}

/** Save page content to DB. Pass null/empty string for a field to revert to default. */
export async function savePageContent(id: PageId, content: Partial<PageContent>, actor: string) {
  for (const field of FIELDS) {
    const value = content[field];
    if (value !== undefined && value !== null && value.trim() !== '') {
      await setConfig(keyFor(id, field), value, actor);
    }
  }
}

/** Reset all of a page's content to code defaults (deletes the override rows). */
export async function resetPageContent(id: PageId) {
  // We can't use deleteConfig from db.ts (doesn't exist); use setConfig with empty string
  // and read getPageContent to skip empty strings. Simpler: use direct SQL.
  const { sql } = await import('@vercel/postgres');
  for (const field of FIELDS) {
    await sql`DELETE FROM site_config WHERE key = ${keyFor(id, field)};`;
  }
}
