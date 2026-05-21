import Skeleton from "./Skeleton";

const FundCardSkeleton = () => {
  return (
    <div className="p-4 rounded-2xl border border-[var(--border-color)] space-y-4">

      <Skeleton className="h-40 w-full rounded-2xl" />

      <Skeleton className="h-5 w-3/4" />

      <Skeleton className="h-4 w-1/2" />

      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-4 w-16" />
      </div>

    </div>
  );
};

export default FundCardSkeleton;