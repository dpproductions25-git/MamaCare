import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Shipping — Fast, Free Worldwide Delivery',
  description: 'MamaCare ships worldwide with free U.S. delivery on orders over $50. See our delivery times and tracking info.',
  path: '/shipping'
});

export default function ShippingPage() {
  return (
    <article className="container-page py-12 sm:py-16 max-w-3xl">
      <h1 className="font-display text-4xl sm:text-5xl text-ink-900">Shipping</h1>
      <div className="mt-6 space-y-5 text-ink-700 leading-relaxed">
        <p>We ship worldwide. Because we ship directly from our supplier warehouses:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li><strong>U.S. orders:</strong> 5–9 business days</li>
          <li><strong>Canada, U.K., Australia, NZ, Ireland:</strong> 8–14 business days</li>
          <li><strong>Other international:</strong> 8–18 business days</li>
        </ul>
        <p>Free standard shipping on U.S. orders over $50. Express options shown at checkout.</p>
        <p>You&apos;ll receive a tracking link by email as soon as your order leaves our warehouse.</p>
      </div>
    </article>
  );
}
