import { Resend } from 'resend';
import { products } from './products';

let _resend: Resend | null = null;
function client(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

/**
 * Sender address.
 *
 * The subscribe route reads RESEND_FROM_EMAIL while this file read RESEND_FROM
 * — so if only one was configured, order and registry emails silently fell back
 * to an address that may not be verified in Resend, and every send failed with
 * nothing surfacing. Accept both names, and fall back to Resend's always-valid
 * sandbox sender rather than an unverified custom domain.
 */
const FROM =
  process.env.RESEND_FROM ||
  process.env.RESEND_FROM_EMAIL ||
  'MamaCare <onboarding@resend.dev>';

const ADMIN = process.env.CONTACT_EMAIL || 'hello@mamacare.us';

/**
 * The Resend SDK resolves with { data, error } instead of throwing, so an
 * unverified domain or bad key looked exactly like success. This surfaces it.
 */
async function send(opts: { to: string; subject: string; html: string }) {
  const c = client();
  if (!c) {
    console.warn('[email] RESEND_API_KEY not set — skipping:', opts.subject);
    return false;
  }
  try {
    const res: any = await c.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (res?.error) {
      console.error(
        `[email] Resend rejected "${opts.subject}" to ${opts.to} from "${FROM}":`,
        res.error
      );
      return false;
    }
    console.log(`[email] sent "${opts.subject}" to ${opts.to}`);
    return true;
  } catch (e: any) {
    console.error(`[email] threw sending "${opts.subject}" to ${opts.to}:`, e?.message);
    return false;
  }
}

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function lineRows(items: { productId: string; qty: number }[]) {
  return items
    .map((i) => {
      const p = products.find((x) => x.id === i.productId);
      if (!p) return '';
      return `
        <tr>
          <td style="padding:8px 0;">${p.name} × ${i.qty}</td>
          <td style="padding:8px 0;text-align:right;">$${(p.price * i.qty).toFixed(2)}</td>
        </tr>`;
    })
    .join('');
}

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="font-family:Inter,Arial,sans-serif;background:#FDFAF6;padding:24px;color:#2A2A33;">
    <table align="center" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;padding:32px;box-shadow:0 8px 30px -12px rgba(0,0,0,.08);">
      <tr><td>
        <h1 style="font-family:Georgia,serif;color:#2A2A33;margin:0 0 8px;">Mama<span style="color:#E68197;">Care</span></h1>
        <h2 style="font-family:Georgia,serif;color:#2A2A33;margin:24px 0 12px;">${title}</h2>
        ${body}
        <p style="color:#7A7A87;font-size:12px;margin-top:32px;">Sent with love by MamaCare. Replies go to ${ADMIN}.</p>
      </td></tr>
    </table>
  </body></html>`;
}

export async function sendOrderConfirmation(opts: {
  to: string;
  orderId: string;
  totalCents: number;
  items: { productId: string; qty: number }[];
  shipping: any;
}) {
  const c = client();
  if (!c) { console.warn('Resend not configured — skipping confirmation email'); return; }

  const body = `
    <p>Thank you for your order, ${opts.shipping?.fullName || 'mama'}! We've received your payment and we're getting your package ready.</p>
    <p><strong>Order:</strong> ${opts.orderId}</p>
    <table width="100%" style="border-top:1px solid #eee;border-bottom:1px solid #eee;margin:16px 0;">
      ${lineRows(opts.items)}
      <tr><td style="padding-top:12px;font-weight:600;">Total</td>
          <td style="padding-top:12px;text-align:right;font-weight:600;">${dollars(opts.totalCents)}</td></tr>
    </table>
    <p>We'll email you again with tracking as soon as your order ships.</p>`;

  await send({
    to: opts.to,
    subject: `Order confirmed — ${opts.orderId}`,
    html: shell('Order confirmed', body)
  });

  // Notify the shop owner too
  await send({
    to: ADMIN,
    subject: `🛍 New order ${opts.orderId} — ${dollars(opts.totalCents)}`,
    html: shell('New order received', `
      <p><strong>Customer:</strong> ${opts.to}</p>
      <p><strong>Ship to:</strong> ${opts.shipping?.fullName}, ${opts.shipping?.line1} ${opts.shipping?.line2 || ''}, ${opts.shipping?.city}, ${opts.shipping?.state} ${opts.shipping?.postalCode}, ${opts.shipping?.country}</p>
      <table width="100%" style="border-top:1px solid #eee;border-bottom:1px solid #eee;margin:16px 0;">
        ${lineRows(opts.items)}
        <tr><td style="padding-top:12px;font-weight:600;">Total</td>
            <td style="padding-top:12px;text-align:right;font-weight:600;">${dollars(opts.totalCents)}</td></tr>
      </table>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders" style="background:#E68197;color:#fff;padding:12px 20px;border-radius:9999px;text-decoration:none;">Open admin →</a></p>
    `)
  });
}

export async function sendRegistryGiftNotification(opts: {
  to: string;
  ownerName: string;
  registryTitle: string;
  registryId: string;
  giftedItems: { productName: string; qty: number }[];
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mamacare.us';
  const registryUrl = `${siteUrl}/registry/${opts.registryId}`;

  const itemRows = opts.giftedItems
    .map((i) => `
      <tr>
        <td style="padding:8px 0;">🎁 ${i.productName}</td>
        <td style="padding:8px 0;text-align:right;color:#7A7A87;">× ${i.qty}</td>
      </tr>`)
    .join('');

  const plural = opts.giftedItems.length > 1 ? 'gifts were' : 'a gift was';

  const body = `
    <p>Great news, ${opts.ownerName}! ${plural.charAt(0).toUpperCase() + plural.slice(1)} just purchased from your <strong>${opts.registryTitle}</strong>! 🥰</p>
    <table width="100%" style="border-top:1px solid #eee;border-bottom:1px solid #eee;margin:16px 0;">
      ${itemRows}
    </table>
    <p>Your registry has been updated automatically, so nobody else buys the same thing.</p>
    <p style="color:#7A7A87;font-size:13px;">
      We keep gift-givers anonymous — we won't tell you who bought what, so you
      can still be surprised. 💕
    </p>
    <p style="margin-top:20px;">
      <a href="${registryUrl}" style="background:#E68197;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;">
        View your registry →
      </a>
    </p>`;

  // NOTE: deliberately contains no buyer name, email, or address.
  await send({
    to: opts.to,
    subject: `🎁 Someone bought from your baby registry!`,
    html: shell(`Someone bought from ${opts.registryTitle}!`, body),
  });
}

export async function sendShippingUpdate(opts: {
  to: string;
  orderId: string;
  trackingNumber: string;
  trackingUrl?: string;
}) {
  const body = `
    <p>Great news — your MamaCare order has shipped!</p>
    <p><strong>Order:</strong> ${opts.orderId}<br/>
       <strong>Tracking:</strong> ${opts.trackingNumber}</p>
    ${opts.trackingUrl ? `<p><a href="${opts.trackingUrl}" style="background:#E68197;color:#fff;padding:12px 20px;border-radius:9999px;text-decoration:none;">Track your package →</a></p>` : ''}
    <p>You'll receive your package within 5–18 days depending on your location.</p>`;

  await send({
    to: opts.to,
    subject: `Your MamaCare order has shipped 📦`,
    html: shell('On the way!', body)
  });
}
