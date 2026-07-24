# MamaCare — Go-Live Setup Guide

Follow these steps in order. Total time: about 45 minutes the first time. After each step you'll add some keys to **Vercel → your project → Settings → Environment Variables**, then **Deployments → … → Redeploy** so they take effect.

> Whenever you add or change env vars, you **must redeploy** for them to apply. Vercel doesn't auto-rebuild on env changes.

---

## Step 1 — Vercel Postgres (database for orders) · 3 min

1. Open your project on vercel.com.
2. Click the **Storage** tab.
3. Click **Create Database** → choose **Postgres** → name it `mamacare-db` → pick the region closest to you → **Create**.
4. On the database page click **Connect Project** → select your `mamacare` project → **All Environments** → **Connect**.
5. Vercel automatically adds `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc. to your env vars. You don't paste these yourself.
6. Set two more env vars manually:

   ```
   ADMIN_USER     = (a username you choose)
   ADMIN_PASSWORD = (a strong password)
   ADMIN_SECRET   = (a long random string, e.g. mash the keyboard)
   ```

7. **Redeploy** the project.
8. After it deploys, visit this URL **once** in your browser (replace YOUR_DOMAIN and YOUR_ADMIN_SECRET):

   ```
   https://YOUR_DOMAIN/api/admin/init-db?secret=YOUR_ADMIN_SECRET
   ```

   You should see `{"ok":true,"message":"Schema ready."}`. The tables are now created.

9. Try `https://YOUR_DOMAIN/admin` — your browser will prompt for username/password (the ADMIN_USER + ADMIN_PASSWORD you set). You'll see an empty admin dashboard.

✅ Database is live.

---

## Step 2 — Resend (order emails) · 5 min

1. Go to https://resend.com → **Sign up free**.
2. Click **Add Domain** → enter your domain (e.g. `mamacare.us`). If you don't own a domain yet, you can start by sending **only from your verified email** in test mode — just click **API Keys** and skip ahead.
3. Add the 3 DNS records Resend gives you to your domain registrar (GoDaddy, Namecheap, etc.). Verification usually takes 5–15 minutes.
4. Once verified, go to **API Keys** → **Create API Key** → name it `mamacare-prod` → **Create**.
5. Copy the key (starts with `re_…`).
6. In Vercel, add env vars:

   ```
   RESEND_API_KEY = re_…
   RESEND_FROM    = MamaCare <orders@yourdomain.com>
   CONTACT_EMAIL  = hello@yourdomain.com
   ```

7. Redeploy.

✅ Email is wired. Order confirmations and shipping updates will now send automatically.

---

## Step 3 — Stripe (cards, Apple Pay, Google Pay) · 10 min

### Create your account

1. Go to https://dashboard.stripe.com/register and sign up. Use a real business email.
2. Stripe will eventually ask you to "Activate your account" with business info (EIN/SSN, bank account). You **don't need to do this to start in test mode** — you can complete activation any time before going live.

### Get the test keys

3. Top-right toggle: make sure **Test mode** is ON.
4. Left sidebar → **Developers → API Keys**.
5. Copy **Publishable key** (`pk_test_…`) and **Secret key** (`sk_test_…`).
6. In Vercel, add:

   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_…
   STRIPE_SECRET_KEY                  = sk_test_…
   ```

### Create the webhook

7. Stripe Dashboard → **Developers → Webhooks → + Add endpoint**.
8. **Endpoint URL:** `https://YOUR_VERCEL_DOMAIN/api/checkout/stripe/webhook`
9. **Events to send:** click "Select events" → search "checkout.session.completed" → check it → **Add events** → **Add endpoint**.
10. On the endpoint page, reveal the **Signing secret** (starts with `whsec_…`). Copy it.
11. In Vercel, add:

    ```
    STRIPE_WEBHOOK_SECRET = whsec_…
    ```

12. Redeploy.

### Test a purchase

13. On your live site, add a product to cart → checkout → "Pay with Card".
14. Use test card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
15. After success you should:
    - Land on the thank-you page
    - See the order appear in `/admin/orders`
    - Receive a confirmation email at the address you typed
    - Receive an admin email at `CONTACT_EMAIL`

### Going live with Stripe

16. Complete account activation (business + bank info) in Stripe.
17. Toggle to **Live mode** in the Stripe dashboard.
18. Generate **live** API keys + a **live** webhook endpoint with the same URL.
19. Replace the test keys in Vercel with the live keys. Redeploy.

✅ Stripe is wired.

---

## Step 4 — PayPal (PayPal balance + cards) · 10 min

### Create the developer app

1. Go to https://developer.paypal.com/dashboard/applications → **Log In** (creates an account if you don't have one).
2. Top-right, make sure **Sandbox** is selected.
3. **Apps & Credentials** → **Create App** → name it `MamaCare` → **App Type: Merchant** → **Create**.
4. Copy the **Client ID** and **Secret**.
5. In Vercel:

   ```
   NEXT_PUBLIC_PAYPAL_CLIENT_ID = (the Client ID)
   PAYPAL_CLIENT_SECRET         = (the Secret)
   PAYPAL_ENV                   = sandbox
   ```

6. Redeploy.

### Test a sandbox purchase

7. PayPal dashboard → **Sandbox → Accounts**. There's a pre-made "Personal" account with a fake balance — note the email + password.
8. On your live site, checkout with PayPal → log in with that sandbox account → complete purchase.
9. Verify it appears in `/admin/orders` and emails arrive.

### Going live with PayPal

10. Switch dashboard toggle from Sandbox to **Live**.
11. Apps & Credentials → Create a **live** app.
12. Update Vercel:
    ```
    NEXT_PUBLIC_PAYPAL_CLIENT_ID = (live Client ID)
    PAYPAL_CLIENT_SECRET         = (live Secret)
    PAYPAL_ENV                   = live
    ```
13. Redeploy.

✅ PayPal is wired.

---

## Step 5 — CJ Dropshipping (fulfillment) · 10 min

### Get your API key

1. Log in at https://app.cjdropshipping.com.
2. Top-right profile → **My CJ → Authorization Management → API**.
3. Click **Generate Access Token**. CJ will show your **Email** and **API Key**. (The "API Key" is sometimes called "Open Key" in their UI — it's a long alphanumeric string.)
4. In Vercel:

   ```
   CJ_API_EMAIL = (your CJ login email)
   CJ_API_KEY   = (the generated key)
   ```

### Map your CJ products

5. In CJ, open each product you want to sell and copy its **Product ID** (`pid`) and the specific **Variant ID** (`vid`) for the size/color you want.
6. Open `lib/products.ts` in your repo. For each seeded product, replace the placeholder values:

   ```ts
   cjProductId: 'CJ_PID_HERE',
   cjVariantId: 'CJ_VID_HERE',
   ```

7. While you're there, update the rest: `name`, `description`, `price`, `image`, etc. to match your actual product.
8. Commit + push. Vercel auto-deploys.

### Test the full flow

9. With **CJ_API_KEY set** and at least one product with a real `cjVariantId`, place a test order through Stripe.
10. In the admin dashboard, the order will appear with a `cj_order_id` once CJ accepts it.
11. Log into CJ Dropshipping → **Orders** → you should see the new order waiting for you to **confirm and pay** the wholesale cost.

> CJ requires you to manually fund each order before they ship. Your customer's money sits in your Stripe/PayPal account; you pay CJ out of that balance.

✅ CJ is wired. Orders flow automatically: customer pays → Stripe/PayPal → MamaCare → CJ → ships to customer.

---

## Step 6 — Ship a customer's order · ongoing

1. Customer pays. Order appears in `/admin/orders` as **paid** → **fulfilling** (once CJ accepts).
2. Pay CJ on their dashboard. CJ ships the package and gives you a tracking number.
3. Back in your admin, expand the order → enter the tracking number → click **Mark shipped + email**.
4. The customer automatically gets the shipping email with their tracking link.

That's the whole loop.

---

## Optional but recommended

- **Custom domain.** Vercel → Settings → Domains → add `mamacare.us` (or whatever you own). Update `NEXT_PUBLIC_SITE_URL` to match. Redeploy.
- **Google Analytics.** Set `NEXT_PUBLIC_GA_ID` to your `G-XXXXXXX` measurement ID.
- **Real OG image.** Replace `/public/og-default.jpg` with a 1200×630 image of your store. Vercel auto-serves it for social previews.
- **Real favicons.** Replace `/public/favicon.ico`, `/public/apple-touch-icon.png`, `/public/icon-192.png`, `/public/icon-512.png`.
- **Update `/about`, `/privacy`, `/terms`** with your real business info (the seeded copy is a starting point).
- **Submit your sitemap** at https://search.google.com/search-console and at https://www.bing.com/webmasters.

---

## Troubleshooting

**Orders aren't showing in /admin/orders**
- Did you redeploy after adding env vars?
- Visit `/api/admin/init-db?secret=YOUR_ADMIN_SECRET` once.
- Check Vercel → Project → Logs → look for `Stripe webhook` errors.

**Emails aren't sending**
- Resend free tier requires a verified domain to send to anyone except yourself.
- Check **Resend → Logs** for delivery status.

**Stripe webhook says "signature verification failed"**
- The signing secret in Vercel must exactly match the one Stripe shows in the webhook details. Re-copy it.

**CJ order isn't appearing in CJ dashboard**
- Confirm `CJ_API_KEY` and `CJ_API_EMAIL` are set in Vercel.
- The product must have a valid `cjVariantId` in `lib/products.ts`. Without it the code skips CJ for that line.
- Check Vercel logs for "CJ fulfillment failed" entries.

**Build failing after pulling new code**
- Run `npm install` locally first to update `package-lock.json`, then push. Or delete `package-lock.json` and let Vercel regenerate.
