import { notFound } from 'next/navigation';
import Link from 'next/link';
import ShopWithFilters from '@/components/ShopWithFilters';
import { categories, products } from '@/lib/products';
import type { Category } from '@/lib/types';
import { buildMetadata } from '@/lib/seo';

type Params = { params: { category: string } };

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }: Params) {
  const cat = categories.find((c) => c.slug === params.category);
  if (!cat) return buildMetadata({ title: 'Shop', path: '/shop' });
  return buildMetadata({
    title: `${cat.label} — Shop ${cat.label}`,
    description: `${cat.description} Filter and shop curated ${cat.label.toLowerCase()} at MamaCare.`,
    path: `/shop/${cat.slug}`
  });
}

export default function CategoryPage({ params }: Params) {
  const cat = categories.find((c) => c.slug === params.category);
  if (!cat) return notFound();

  return (
    <section className="container-page py-10 sm:py-14">
      <nav className="text-sm text-ink-500 mb-4" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-blush-500">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-blush-500">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-900">{cat.label}</span>
      </nav>

      <header className="mb-8">
        <h1 className="font-display text-4xl sm:text-5xl text-ink-900">{cat.label}</h1>
        <p className="text-ink-500 mt-2 max-w-xl">{cat.description}</p>
      </header>

      <ShopWithFilters initialProducts={products} lockedCategory={cat.slug as Category} />
    </section>
  );
}
