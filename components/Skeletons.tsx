/**
 * Shared loading skeletons.
 *
 * Skeletons rather than a spinner because they reserve the same space the real
 * content will occupy — that keeps Cumulative Layout Shift near zero, which is
 * one of the three Core Web Vitals Google actually ranks on. A centred spinner
 * that gets replaced by a full grid causes exactly the layout jump CLS
 * penalises.
 */

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-ink-900/5">
      <div className="aspect-square bg-cream-200 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-cream-200 rounded-full animate-pulse w-3/4" />
        <div className="h-3 bg-cream-200 rounded-full animate-pulse w-1/2" />
        <div className="h-4 bg-cream-100 rounded-full animate-pulse w-1/3 mt-3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TextLineSkeleton({ width = 'w-full' }: { width?: string }) {
  return <div className={`h-3 bg-cream-200 rounded-full animate-pulse ${width}`} />;
}

/** Screen-reader announcement so loading isn't silent for assistive tech. */
export function LoadingAnnouncement({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}
