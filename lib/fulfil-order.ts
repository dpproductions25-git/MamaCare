import { createOrder as createCjOrder } from './cj';
import { setCjOrderId } from './db';
import { sendManualFulfilmentAlert } from './email';
import { planCjFulfilment, type OrderLine } from './fulfilment';
import { getLiveProducts } from './product-overrides';

/**
 * Orders a paid purchase from CJ and emails the owner about anything that
 * couldn't be ordered. Returns a one-line summary of what reached CJ.
 */
export async function fulfilOrder(order: {
  orderId: string;
  provider: 'Stripe' | 'PayPal';
  lines: OrderLine[];
  shipping: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  };
  /** Set when the item list couldn't be read at all. */
  linesError?: string;
}): Promise<string> {
  const { shipping } = order;
  // The merged catalog: the code list alone omits admin-created products.
  const { cjItems, planned, manual } = planCjFulfilment(order.lines, await getLiveProducts());
  if (order.linesError) {
    manual.push({ productId: '', name: 'Whole order', qty: 0, reason: order.linesError });
  }

  let summary = 'Nothing was sent to CJ.';
  if (cjItems.length) {
    let cjOrderId = '';
    try {
      if (!process.env.CJ_API_KEY) throw new Error('CJ_API_KEY is not set.');
      const cj = await createCjOrder({
        orderNumber: order.orderId,
        shippingZip: shipping.postalCode,
        shippingCountryCode: shipping.country,
        shippingProvince: shipping.state,
        shippingCity: shipping.city,
        shippingAddress: [shipping.line1, shipping.line2].filter(Boolean).join(', '),
        shippingCustomerName: shipping.fullName,
        shippingPhone: shipping.phone || '',
        remark: 'MamaCare order',
        products: cjItems
      });
      cjOrderId = String((cj as any)?.orderId || '');
      summary =
        `CJ order ${cjOrderId || '(no id returned)'} was created for ` +
        `${cjItems.length} of ${order.lines.length} item line(s).`;
    } catch (e: any) {
      console.error(`[fulfilment] CJ order failed for ${order.orderId}`, e);
      const reason =
        `The CJ order request failed (check CJ for it before ordering again): ${e?.message || e}`;
      manual.push(...planned.map((line) => ({ ...line, reason })));
    }
    if (cjOrderId) {
      // Separate on purpose: the CJ order exists even if recording it fails, so
      // that must not be reported as "not ordered".
      try {
        await setCjOrderId(order.orderId, cjOrderId);
      } catch (e) {
        console.error(`[fulfilment] CJ order ${cjOrderId} created but not recorded on ${order.orderId}`, e);
      }
    }
  }

  if (manual.length) {
    console.warn(`[fulfilment] ${manual.length} line(s) of ${order.orderId} need ordering by hand`);
    await sendManualFulfilmentAlert({
      orderId: order.orderId,
      provider: order.provider,
      shipping,
      lines: manual
    });
  }
  return summary;
}
