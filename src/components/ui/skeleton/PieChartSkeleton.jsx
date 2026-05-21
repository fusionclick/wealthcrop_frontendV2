import Skeleton from "./Skeleton";

const PieChartSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[var(--card-bg)] rounded-2xl p-5 shadow">

      <Skeleton className="h-6 w-40 mb-6" />

      <div className="flex flex-col lg:flex-row items-center gap-8">

        {/* LEGENDS */}
        <div className="space-y-4 flex-1 w-full">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        {/* CHART */}
        <Skeleton className="w-48 h-48 rounded-full shrink-0" />

      </div>

    </div>
  );
};

export default PieChartSkeleton;