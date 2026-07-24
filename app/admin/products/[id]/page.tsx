import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAdminProduct } from '@/lib/product-overrides';
import EditProductForm from './EditProductForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit product — Admin', robots: { index: false, follow: false } };

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const listing = await getAdminProduct(params.id);
  if (!listing) return notFound();

  return (
    <section className="container-page py-10 max-w-4xl">
      <nav className="text-sm text-ink-500 mb-4">
        <Link href="/admin" className="hover:text-blush-500">Admin</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/products" className="hover:text-blush-500">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-900 line-clamp-1">{listing.product.name}</span>
      </nav>

      <h1 className="font-display text-4xl text-ink-900">Edit product</h1>
      <p className="text-ink-500 mt-2">
        {listing.isCustom
          ? 'Custom product — all fields are stored in the database.'
          : 'Static product — edits are stored as overrides. "Reset" reverts to code defaults.'}
      </p>

      <EditProductForm initial={listing.product} isCustom={listing.isCustom} visible={listing.visible} />
    </section>
  );
}
