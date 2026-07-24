import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import ProductGallery from '@/components/ProductGallery';
import { products } from '@/lib/products';
import { getMergedProduct } from '@/lib/product-overrides';
import { buildMetadata, SITE_URL, SITE_NAME } from '@/lib/seo';

export const revalidate = 30;

type Params = { params: { slug: string } };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params) {
  const p = await getMergedProduct(params.slug);
  if (!p) return buildMetadata({ title: 'Product not found' });
  // Use admin-provided SEO description if set, otherwise auto-generate from tagline + body.
  const description = p.seoDescription?.trim()
    || `${p.shortDescription} ${p.description.slice(0, 140)}`;
  return buildMetadata({
    title: `${p.name} — ${p.shortDescription}`,
    description,
    path: `/products/${p.slug}`,
    image: p.image
  });
}

export default async function ProductPage({ params }: Params) {
  const product = await getMergedProduct(params.slug);
  if (!product) return notFound();

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images && product.images.length > 0 ? product.images : [product.image],
    sku: product.id,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: product.currency,
      price: product.price.toFixed(2),
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewsCount
    }
  };

  return (
    <article className="container-page py-10 sm:py-14">
      <nav className="text-sm text-ink-500 mb-4" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-blush-500">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-blush-500">Shop</Link>
        <span className="mx-2">/</span>
        <Link href={`/shop/${product.category}`} className="hover:text-blush-500 capitalize">
          {product.category}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-900">{product.name}</span>
      </nav>

      <ProductGallery product={product} />

      <Script
        id={`schema-product-${product.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    </article>
  );
}
