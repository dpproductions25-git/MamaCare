import ShopWithFilters from '@/components/ShopWithFilters';
import { getMergedProducts } from '@/lib/product-overrides';
import { buildMetadata } from '@/lib/seo';

export const revalidate = 30;

export const metadata = buildMetadata({
  title: 'Shop all — Baby Gear, Sleep, Feeding, Nursery & Toys',
  description:
    'Filter and shop the complete MamaCare catalog — baby carriers, bouncers, sleep sacks, feeding essentials, nursery, and learning toys. Free U.S. shipping over $50.',
  path: '/shop'
});

export default async function ShopPage() {
  const products = await getMergedProducts();

  return (
    <section className="container-page py-10 sm:py-14">
      <header className="mb-8">
        <p className="uppercase tracking-[0.18em] text-blush-500 text-xs font-medium">Shop</p>
        <h1 className="font-display text-4xl sm:text-5xl text-ink-900 mt-2">All products</h1>
        <p className="text-ink-500 mt-2 max-w-xl">
          Filter by category, color, size, or price. Thoughtfully curated baby gear from soft fabrics
          to modern designs.
        </p>
      </header>

      <ShopWithFilters initialProducts={products} />
    </section>
  );
}
