import { ProductGridSkeleton, LoadingAnnouncement } from '@/components/Skeletons';

export default function RegistryLoading() {
  return (
    <div className="min-h-screen bg-cream-50">
      <LoadingAnnouncement label="Loading registry" />

      <div className="bg-white border-b border-ink-900/6">
        <div className="container-page py-12 sm:py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-cream-200 animate-pulse mx-auto" />
          <div className="h-9 w-72 bg-cream-200 rounded-full animate-pulse mx-auto mt-5" />
          <div className="h-4 w-48 bg-cream-100 rounded-full animate-pulse mx-auto mt-3" />
          <div className="h-3 max-w-md mx-auto bg-cream-200 rounded-full animate-pulse mt-8" />
        </div>
      </div>

      <div className="container-page py-10">
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
