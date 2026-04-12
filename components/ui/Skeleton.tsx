/**
 * Skeleton primitives — Bahay.ph
 * Shimmer-animated placeholders that match real card dimensions.
 */

/** Base shimmer block */
export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`bg-sand-dark animate-pulse rounded-[12px] ${className ?? ""}`}
    />
  );
}

/** Matches PropertyCard grid variant (h-[120px] image + content) */
export function SkeletonPropertyCard() {
  return (
    <div className="rounded-[14px] bg-white overflow-hidden shadow-[var(--shadow-card)]">
      {/* Image area */}
      <SkeletonBlock className="h-[120px] rounded-none" />
      {/* Content */}
      <div className="p-2.5 flex flex-col gap-1.5">
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-2.5 w-24" />
        <SkeletonBlock className="h-2.5 w-20 mt-1" />
      </div>
    </div>
  );
}

/** Matches AgentDashboard listing row (w-16 thumb + 3 text lines + 2 action buttons) */
export function SkeletonListingRow() {
  return (
    <div className="bg-white rounded-[14px] shadow-[var(--shadow-card)] p-3 flex gap-3">
      {/* Thumbnail */}
      <SkeletonBlock className="w-16 h-16 flex-shrink-0 rounded-[10px]" />
      {/* Info */}
      <div className="flex-1 flex flex-col gap-1.5 min-w-0 justify-center">
        <SkeletonBlock className="h-3 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
        <SkeletonBlock className="h-2.5 w-1/3" />
      </div>
      {/* Actions */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <SkeletonBlock className="w-8 h-8 rounded-full" />
        <SkeletonBlock className="w-8 h-8 rounded-full" />
      </div>
    </div>
  );
}

/** Matches SavedCard grid variant */
export function SkeletonSavedCard() {
  return (
    <div className="rounded-[14px] bg-white overflow-hidden shadow-[var(--shadow-card)]">
      <SkeletonBlock className="h-[120px] rounded-none" />
      <div className="p-2.5 flex flex-col gap-1.5">
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-2.5 w-24" />
        <SkeletonBlock className="h-2.5 w-20 mt-1" />
      </div>
    </div>
  );
}
