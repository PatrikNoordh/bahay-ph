import { SkeletonSavedCard } from "@/components/ui/Skeleton";

export default function SavedLoading() {
  return (
    <div className="h-full flex flex-col pb-6">
      {/* Topbar placeholder */}
      <div className="h-14 bg-white border-b border-sand-dark" />

      <div className="px-4">
        {/* Header placeholder */}
        <div className="pt-4 pb-3">
          <div className="h-6 w-40 bg-sand-dark animate-pulse rounded mb-1.5" />
          <div className="h-3 w-24 bg-sand-dark animate-pulse rounded" />
        </div>

        {/* 2-column skeleton grid */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonSavedCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
