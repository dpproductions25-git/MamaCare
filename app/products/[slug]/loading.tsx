import { LoadingAnnouncement } from '@/components/Skeletons';

export default function ProductLoading() {
  return (
    <article className="container-page py-10 sm:py-14">
      <LoadingAnnouncement label="Loading product" />

      {/* Breadcrumb */}
      <div className="h-3 w-64 bg-cream-200 rounded-full animate-pulse" />

      <div className="mt-6 grid lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <div className="aspect-square bg-cream-200 rounded-3xl animate-pulse" />
          <div className="flex gap-3 mt-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-20 h-20 rounded-xl bg-cream-200 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4 pt-2">
          <div className="h-8 bg-cream-200 rounded-full animate-pulse w-4/5" />
          <div className="h-4 bg-cream-100 rounded-full animate-pulse w-1/3" />
          <div className="h-7 bg-cream-200 rounded-full animate-pulse w-28 mt-6" />
          <div className="space-y-2 pt-4">
            <div className="h-3 bg-cream-100 rounded-full animate-pulse" />
            <div className="h-3 bg-cream-100 rounded-full animate-pulse" />
            <div className="h-3 bg-cream-100 rounded-full animate-pulse w-2/3" />
          </div>
          <div className="h-12 bg-cream-200 rounded-full animate-pulse w-full mt-8" />
        </div>
      </div>
    </article>
  );
}
