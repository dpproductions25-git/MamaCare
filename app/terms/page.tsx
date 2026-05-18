import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Terms and Conditions',
  description: 'Read the terms and conditions governing your use of MamaCare and purchases from our store.',
  path: '/terms'
});

export default function TermsPage() {
  return (
    <article className="container-page py-12 sm:py-16 max-w-3xl">
      <h1 className="font-display text-4xl sm:text-5xl text-ink-900">Terms and Conditions</h1>
      <p className="text-sm text-ink-500 mt-2">Last updated: May 2026</p>

      <div className="mt-6 space-y-6 text-ink-700 leading-relaxed">
        <p>
          Welcome to MamaCare. These Terms and Conditions ("Terms") govern your access to and use
          of the MamaCare website (the "Site") and your purchases from MamaCare ("we," "us," or "our").
          By using the Site or placing an order, you agree to be bound by these Terms.
        </p>

        <h2 className="font-display text-2xl text-ink-900 pt-4">1. About MamaCare — Dropshipping Disclosure</h2>
        <p>
          <strong>MamaCare is a curated dropshipping retailer.</strong> We do <strong>not</strong>{' '}
          manufacture, design, assemble, warehouse, or quality-test the products sold on this Site.
          Each product listed in our catalog is sourced from third-party suppliers and shipped
          directly from those suppliers' warehouses to you. Our role is to curate, list, market,
          and provide customer support for the products our suppliers fulfill.
        </p>
        <p>
          Because we are a dropshipping store, the following implications apply:
        </p>
        <ul className="list-disc ml-6 space-y-2">
          <li>
            <strong>Origin and manufacturing.</strong> Products are typically manufactured and
            shipped from international warehouses (including but not limited to U.S., China, and
            other partner countries). Country of origin and exact manufacturer may vary by product
            and batch.
          </li>
          <li>
            <strong>Shipping times.</strong> Because items ship directly from suppliers, delivery
            times typically range from 5–9 business days for U.S. orders and 8–18 business days
            for international orders. We will provide tracking once your supplier ships your order.
          </li>
          <li>
            <strong>Product accuracy.</strong> We make every effort to accurately describe
            products on this Site, but minor variations in color, fabric texture, dimensions, or
            packaging may occur due to differences in supplier batches, photography lighting, and
            screen calibration. We will make it right if a product materially differs from the
            description.
          </li>
          <li>
            <strong>Product safety and regulatory compliance.</strong> While we review listings
            for compliance with applicable U.S. consumer-product safety standards, MamaCare is not
            the manufacturer and cannot independently certify every product's regulatory compliance.
            Please follow all manufacturer instructions, age recommendations, and safety labels
            provided with each product.
          </li>
          <li>
            <strong>Warranties.</strong> Any manufacturer warranties are provided by the original
            manufacturer, not by MamaCare. To the maximum extent permitted by law, MamaCare
            disclaims all implied warranties. Our liability is limited to the purchase price of
            the product.
          </li>
        </ul>

        <h2 className="font-display text-2xl text-ink-900 pt-4">2. Orders, Pricing, and Payment</h2>
        <p>
          All prices are in U.S. dollars. We reserve the right to change prices at any time. By
          placing an order you authorize us (through Stripe and/or PayPal) to charge your selected
          payment method. We may refuse or cancel an order at our discretion, including for
          suspected fraud, pricing errors, or supplier stock issues — in which case we will
          refund any amount charged.
        </p>

        <h2 className="font-display text-2xl text-ink-900 pt-4">3. Shipping</h2>
        <p>
          Shipping times are estimates, not guarantees. International shipments may be subject to
          customs duties and taxes imposed by your destination country, which are the customer's
          responsibility.
        </p>

        <h2 className="font-display text-2xl text-ink-900 pt-4">4. Returns and Refunds</h2>
        <p>
          You may return eligible items within <strong>14 days</strong> of delivery. See our
          full <a className="underline text-blush-500" href="/returns">Returns policy</a> for
          eligibility, exclusions, and instructions.
        </p>

        <h2 className="font-display text-2xl text-ink-900 pt-4">5. Intellectual Property</h2>
        <p>
          All content on this Site — including text, graphics, logos, and the MamaCare name and
          design — is the property of MamaCare or its licensors and is protected by U.S. and
          international copyright and trademark laws. You may not reproduce or distribute any
          content without written permission.
        </p>

        <h2 className="font-display text-2xl text-ink-900 pt-4">6. Acceptable Use</h2>
        <p>
          You agree not to use this Site for any unlawful purpose, to attempt to gain unauthorized
          access to any portion of the Site, or to interfere with the Site's operation.
        </p>

        <h2 className="font-display text-2xl text-ink-900 pt-4">7. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, MamaCare, its owners, employees, and partners
          shall not be liable for any indirect, incidental, special, consequential, or punitive
          damages arising out of or related to your use of the Site or any products purchased.
          Our maximum aggregate liability shall not exceed the purchase price you paid for the
          product giving rise to the claim.
        </p>

        <h2 className="font-display text-2xl text-ink-900 pt-4">8. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless MamaCare from any claims, damages, losses, or
          expenses arising out of your use of the Site or your breach of these Terms.
        </p>

        <h2 className="font-display text-2xl text-ink-900 pt-4">9. Changes to These Terms</h2>
        <p>
          We may update these Terms at any time. The "Last updated" date above will reflect any
          changes. Continued use of the Site after changes constitutes acceptance of the updated
          Terms.
        </p>

        <h2 className="font-display text-2xl text-ink-900 pt-4">10. Contact</h2>
        <p>
          Questions about these Terms? Reach us at{' '}
          <a className="underline text-blush-500" href="mailto:mamaacaree@gmail.com">mamaacaree@gmail.com</a>.
        </p>

        <p className="text-sm text-ink-500 pt-8">
          By placing an order you confirm that you have read, understood, and agree to these Terms
          and Conditions, including the dropshipping disclosure above.
        </p>
      </div>
    </article>
  );
}
