import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';

export default function ProductCard({ product }: { product: Product }) {
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group card hover:-translate-y-0.5 hover:shadow-soft transition-all duration-300"
      aria-label={`${product.name} – $${product.price.toFixed(2)}`}
    >
      <div className="relative aspect-square bg-cream-100 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {onSale && (
          <span className="absolute top-3 left-3 bg-blush-400 text-white text-xs px-3 py-1 rounded-full">
            Sale
          </span>
        )}
        {product.bestSeller && !onSale && (
          <span className="absolute top-3 left-3 bg-sage-400 text-white text-xs px-3 py-1 rounded-full">
            Best seller
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="font-display text-lg text-ink-900 line-clamp-2">{product.name}</h3>
        <p className="text-sm text-ink-500 mt-1 line-clamp-1">{product.shortDescription}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-ink-900 font-medium">${product.price.toFixed(2)}</span>
          {onSale && (
            <span className="text-ink-500 line-through text-sm">
              ${product.compareAtPrice!.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
