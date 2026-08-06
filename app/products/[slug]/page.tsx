import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import ProductGallery from '@/components/ProductGallery';
import { products } from '@/lib/products';
import { getMergedProduct } from '@/lib/product-overrides';
import { getShippingSettings } from '@/lib/db-commerce';
import { shippingBlurb } from '@/lib/shipping-copy';
import { buildMetadata } from '@/lib/seo';
import { productSchema, breadcrumbSchema } from '@/lib/schema';

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

  const shipping = await getShippingSettings();

  // Merchant-grade schema: adds shipping cost, delivery window, return policy
  // and price validity — the fields Google needs for a rich product snippet
  // rather than a plain link, and the ones AI assistants read when comparing.
  const productJsonLd = productSchema(product, shipping);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: product.category, path: `/shop/${product.category}` },
    { name: product.name, path: `/products/${product.slug}` },
  ]);

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

      <ProductGallery product={product} shippingNote={shippingBlurb(shipping)} />

      <Script
        id={`schema-product-${product.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Script
        id={`schema-breadcrumb-${product.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </article>
  );
}
