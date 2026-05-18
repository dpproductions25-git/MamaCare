import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-cream-100 border-t border-ink-900/5 mt-16">
      <div className="container-page py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-ink-700">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-2xl text-ink-900">Mama<span className="text-blush-400">Care</span></p>
          <p className="mt-3 max-w-xs">Thoughtfully curated baby gear and everyday essentials, from first onesie to first steps.</p>
        </div>

        <div>
          <h4 className="font-medium text-ink-900 mb-3">Shop</h4>
          <ul className="space-y-2">
            <li><Link href="/shop/gear" className="hover:text-blush-500">Baby Gear</Link></li>
            <li><Link href="/shop/baby" className="hover:text-blush-500">Clothing &amp; Essentials</Link></li>
            <li><Link href="/shop/sleep" className="hover:text-blush-500">Sleep</Link></li>
            <li><Link href="/shop/feeding" className="hover:text-blush-500">Feeding &amp; Care</Link></li>
            <li><Link href="/shop/nursery" className="hover:text-blush-500">Nursery</Link></li>
            <li><Link href="/shop/toys" className="hover:text-blush-500">Toys &amp; Play</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-ink-900 mb-3">Help</h4>
          <ul className="space-y-2">
            <li><Link href="/shipping" className="hover:text-blush-500">Shipping</Link></li>
            <li><Link href="/returns" className="hover:text-blush-500">Returns (14 days)</Link></li>
            <li><Link href="/contact" className="hover:text-blush-500">Contact us</Link></li>
            <li><Link href="/faq" className="hover:text-blush-500">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-ink-900 mb-3">Company</h4>
          <ul className="space-y-2">
            <li><Link href="/about" className="hover:text-blush-500">About</Link></li>
            <li><Link href="/blog" className="hover:text-blush-500">Journal</Link></li>
            <li><Link href="/privacy" className="hover:text-blush-500">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-blush-500">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-900/5">
        <div className="container-page py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-500">
          <p>© {year} MamaCare. All rights reserved.</p>
          <p>Made with love for every mama.</p>
        </div>
      </div>
    </footer>
  );
}
