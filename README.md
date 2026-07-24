# MamaCare — Baby Gear & Essentials Storefront

A modern, mobile-friendly, SEO-optimized Next.js 14 storefront for curated baby gear, sleep, feeding, nursery, and toys. Integrates **Stripe**, **PayPal**, **CJ Dropshipping**, **Vercel Postgres**, **Resend**, and **FormSubmit** for contact forms.

## Quick deploy

1. Push this folder to a GitHub repo
2. Import the repo on Vercel
3. Add env vars (see `.env.example`)
4. Deploy

## Full setup walkthrough

See **[SETUP.md](./SETUP.md)** for step-by-step guides to:
- Vercel Postgres (orders database)
- Resend (order confirmation emails)
- Stripe (cards)
- PayPal (sandbox + live)
- CJ Dropshipping (automatic fulfillment)

## Features

- 20 real CJ-mapped products with variants (color + size)
- Stripe + PayPal checkout, required terms agreement
- Shop filters (category, price, color, size, sort)
- Hover megamenu in header
- Blog with 5 SEO-optimized starter posts
- Admin dashboard at `/admin` (HTTP Basic Auth)
- Order persistence (Vercel Postgres)
- Email confirmations + shipping updates (Resend)
- Contact form to mamaacaree@gmail.com (FormSubmit, no API key needed)
- Full SEO: per-page metadata, OG tags, JSON-LD, sitemap, robots
- 14-day return policy, dropshipping disclosure in Terms

## Project structure

```
app/
  api/             # Stripe + PayPal + CJ + contact + admin routes
  admin/           # /admin dashboard (protected by middleware)
  blog/            # /blog index + posts
  products/[slug]/ # Product detail
  shop/            # Shop + filter pages
  ... (all public pages)
components/        # React components
lib/               # blog, cart, cj, db, email, products, seo, types
public/            # Static assets
```

## Local development

```bash
npm install
cp .env.example .env.local
# fill in env vars
npm run dev
```

Visit http://localhost:3000.

## Notes

- Build defenses enabled in `next.config.js` so deploys don't fail on stray lint/type errors.
- Contact form uses FormSubmit.co (works without any API key — first submission triggers an activation email to mamaacaree@gmail.com).
- All CJ Variant IDs (`cjVariantId`) are placeholders. Replace with real VIDs from CJ Dropshipping for auto-fulfillment.

---

Made with love for every mama.
