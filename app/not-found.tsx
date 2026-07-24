import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="container-page py-24 text-center">
      <h1 className="font-display text-5xl text-ink-900">404</h1>
      <p className="text-ink-700 mt-3">We couldn&apos;t find that page.</p>
      <Link href="/" className="btn-primary mt-6 inline-block">Back home</Link>
    </section>
  );
}
