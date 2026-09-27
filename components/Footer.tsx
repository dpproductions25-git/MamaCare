import Link from 'next/link';
import RegistryFooterLink from './RegistryFooterLink';

const SOCIAL = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/mamaacaree_',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5" aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4.5"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
    )
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/1JHrwDTgML/?mibextid=wwXIfr',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
        <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.27h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/>
      </svg>
    )
  }
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-cream-100 border-t border-ink-900/5 mt-16">
      <div className="container-page py-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 text-sm text-ink-700">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-2xl text-ink-900">Mama<span className="text-blush-400">Care</span></p>
          <p className="mt-3 max-w-xs">Thoughtfully curated baby gear and everyday essentials, from first onesie to first steps.</p>
          {/* Social links */}
          <div className="flex items-center gap-3 mt-5">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-9 h-9 rounded-full bg-white border border-ink-900/8 flex items-center justify-center text-ink-500 hover:text-blush-500 hover:border-blush-200 transition-colors shadow-sm"
              >
                {s.icon}
              </a>
            ))}
          </div>
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
            <li><Link href="/gift-guide" className="hover:text-blush-500">Gift Guide</Link></li>
            <li><Link href="/privacy" className="hover:text-blush-500">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-blush-500">Terms</Link></li>
          </ul>
        </div>

        <div className="col-span-2 md:col-span-1">
          <h4 className="font-medium text-ink-900 mb-3">For Mamas</h4>
          <ul className="space-y-2">
            <li><RegistryFooterLink /></li>
            <li><Link href="/gift-guide" className="hover:text-blush-500">Baby Shower Gift Guide</Link></li>
            <li><Link href="/blog" className="hover:text-blush-500">Sleep &amp; Care Tips</Link></li>
            <li><Link href="/shop" className="hover:text-blush-500">Shop by Age</Link></li>
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
