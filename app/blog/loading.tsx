import { LoadingAnnouncement } from '@/components/Skeletons';

export default function BlogLoading() {
  return (
    <section className="container-page py-10 sm:py-14">
      <LoadingAnnouncement label="Loading articles" />
      <div className="h-9 w-56 bg-cream-200 rounded-full animate-pulse" />

      <div className="mt-8 grid sm:grid-cols-2 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-3xl overflow-hidden border border-ink-900/5">
            <div className="aspect-[16/9] bg-cream-200 animate-pulse" />
            <div className="p-5 space-y-2">
              <div className="h-4 bg-cream-200 rounded-full animate-pulse w-5/6" />
              <div className="h-3 bg-cream-100 rounded-full animate-pulse w-full" />
              <div className="h-3 bg-cream-100 rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
