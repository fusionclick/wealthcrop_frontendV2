import Skeleton from "./Skeleton";

const ChartSectionSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[var(--card-bg)] rounded-2xl p-5 shadow space-y-5">

      {/* TOP FILTERS */}
      <div className="flex gap-2 flex-wrap">
        {[1,2,3,4,5,6,7].map((i) => (
          <Skeleton
            key={i}
            className="h-8 w-12 rounded-lg"
          />
        ))}
      </div>

      {/* CHART */}
      <Skeleton className="h-[300px] w-full rounded-2xl" />

      {/* BOTTOM CARDS */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>

    </div>
  );
};

export default ChartSectionSkeleton;