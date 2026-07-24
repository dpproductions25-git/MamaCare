import { getMergedProducts } from '@/lib/product-overrides';
import CartClient from './CartClient';

export const revalidate = 30;

export default async function CartPage() {
  const products = await getMergedProducts();
  return <CartClient serverProducts={products} />;
}
