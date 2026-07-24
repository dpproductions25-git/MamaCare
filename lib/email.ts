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

const FROM = process.env.RESEND_FROM || 'MamaCare <orders@mamacare.us>';
const ADMIN = process.env.CONTACT_EMAIL || 'hello@mamacare.us';

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

  await c.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Order confirmed — ${opts.orderId}`,
    html: shell('Order confirmed', body)
  });

  // Notify the shop owner too
  await c.emails.send({
    from: FROM,
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
  const c = client();
  if (!c) { console.warn('Resend not configured — skipping registry gift email'); return; }

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
    <p>Your registry has been updated automatically to reflect what's been purchased.</p>
    <p style="margin-top:20px;">
      <a href="${registryUrl}" style="background:#E68197;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:600;">
        View your registry →
      </a>
    </p>`;

  await c.emails.send({
    from: FROM,
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
  const c = client();
  if (!c) { console.warn('Resend not configured — skipping shipping email'); return; }

  const body = `
    <p>Great news — your MamaCare order has shipped!</p>
    <p><strong>Order:</strong> ${opts.orderId}<br/>
       <strong>Tracking:</strong> ${opts.trackingNumber}</p>
    ${opts.trackingUrl ? `<p><a href="${opts.trackingUrl}" style="background:#E68197;color:#fff;padding:12px 20px;border-radius:9999px;text-decoration:none;">Track your package →</a></p>` : ''}
    <p>You'll receive your package within 5–18 days depending on your location.</p>`;

  await c.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Your MamaCare order has shipped 📦`,
    html: shell('On the way!', body)
  });
}
