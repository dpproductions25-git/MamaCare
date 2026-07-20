import { getMergedProducts } from '@/lib/product-overrides';
import CheckoutClient from './CheckoutClient';

export const revalidate = 30;

export default async function CheckoutPage() {
  const products = await getMergedProducts();
  return <CheckoutClient serverProducts={products} />;
}
