import Link from 'next/link';
import ImageAltClient from '@/components/ImageAltClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Image alt text — Admin',
  robots: { index: false, follow: false },
};

export default function AdminImagesPage() {
  return (
    <section className="container-page py-10">
      <h1 className="font-display text-4xl text-ink-900">Image alt text</h1>
      <p className="text-ink-500 mt-2 max-w-2xl">
        Alt text describes each photo for screen readers and for Google Images. Generate
        suggestions with AI, review them, then save the ones you&apos;re happy with.
      </p>

      <ImageAltClient />

      <p className="mt-10 text-xs text-ink-500">
        <Link href="/admin" className="underline">← Back to admin</Link>
      </p>
    </section>
  );
}
