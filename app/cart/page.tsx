import { getMergedProducts } from '@/lib/product-overrides';
import { getShippingSettings } from '@/lib/db-commerce';
import CartClient from './CartClient';

// Pricing must never be served stale — shipping settings and product prices
// both change from the admin panel and are money-affecting.
export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const [products, shipping] = await Promise.all([
    getMergedProducts(),
    getShippingSettings(),
  ]);
  return <CartClient serverProducts={products} shippingSettings={shipping} />;
}
