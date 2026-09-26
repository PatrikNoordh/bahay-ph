import { SkeletonListingRow } from "@/components/ui/Skeleton";

export default function AgentDashboardLoading() {
  return (
    <div className="h-full flex flex-col pb-4">
      {/* Topbar placeholder */}
      <div className="h-14 bg-white border-b border-sand-dark" />

      {/* Header row placeholder */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex flex-col gap-1.5">
          <div className="h-5 w-28 bg-sand-dark animate-pulse rounded" />
          <div className="h-3 w-16 bg-sand-dark animate-pulse rounded" />
        </div>
        <div className="h-10 w-28 bg-sand-dark animate-pulse rounded-[12px]" />
      </div>

      {/* Skeleton listing rows */}
      <div className="px-4 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonListingRow key={i} />
        ))}
      </div>
    </div>
  );
}
