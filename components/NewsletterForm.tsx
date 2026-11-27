'use client';

import { useEffect, useState } from 'react';

/**
 * Homepage signup. /api/subscribe redirects back with ?subscribed=1, which is
 * read here in the browser: reading it on the server made the whole homepage
 * uncacheable.
 */
export default function NewsletterForm() {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setSubscribed(new URLSearchParams(window.location.search).get('subscribed') === '1');
  }, []);

  if (subscribed) {
    return (
      <>
        <div className="mt-4 inline-flex items-center gap-2 bg-sage-50 border border-sage-200 text-sage-600 text-sm font-medium px-5 py-3 rounded-full">
          <span>🎉</span> You&apos;re in! Check your inbox for your 10% off code.
        </div>
        <p className="text-ink-700 mt-2 max-w-xl mx-auto">
          Pregnancy &amp; postpartum tips, early access to new arrivals, and 10% off your first order.
        </p>
      </>
    );
  }

  return (
    <>
      <p className="text-ink-700 mt-2 max-w-xl mx-auto">
        Pregnancy &amp; postpartum tips, early access to new arrivals, and 10% off your first order.
      </p>
      <form action="/api/subscribe" method="post" className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
        <label htmlFor="email" className="sr-only">Email address</label>
        <input id="email" type="email" name="email" required placeholder="Your email address"
          className="flex-1 rounded-full px-5 py-3 bg-white border border-ink-900/10 focus:outline-none focus:ring-2 focus:ring-blush-300" />
        <button type="submit" className="btn-primary">Subscribe</button>
      </form>
    </>
  );
}
