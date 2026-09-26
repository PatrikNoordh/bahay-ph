import { SkeletonPropertyCard } from "@/components/ui/Skeleton";

export default function SearchLoading() {
  return (
    <div className="min-h-[100dvh] pb-16">
      {/* Topbar placeholder */}
      <div className="h-14 bg-white border-b border-sand-dark" />

      {/* Search bar placeholder */}
      <div className="px-4 pt-3 pb-2">
        <div className="h-10 bg-sand-dark animate-pulse rounded-xl" />
      </div>

      {/* Filter pills placeholder */}
      <div className="flex gap-2 px-4 pb-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-20 bg-sand-dark animate-pulse rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Count placeholder */}
      <div className="px-4 mb-3">
        <div className="h-4 w-32 bg-sand-dark animate-pulse rounded" />
      </div>

      {/* 2-column skeleton grid */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonPropertyCard key={i} />
        ))}
      </div>
    </div>
  );
}
