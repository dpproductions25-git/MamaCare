import { ProductGridSkeleton, LoadingAnnouncement } from '@/components/Skeletons';

export default function ShopLoading() {
  return (
    <section className="container-page py-10 sm:py-14">
      <LoadingAnnouncement label="Loading products" />
      <div className="h-9 w-48 bg-cream-200 rounded-full animate-pulse" />
      <div className="h-4 w-72 bg-cream-100 rounded-full animate-pulse mt-3" />
      <div className="mt-8">
        <ProductGridSkeleton count={8} />
      </div>
    </section>
  );
}
