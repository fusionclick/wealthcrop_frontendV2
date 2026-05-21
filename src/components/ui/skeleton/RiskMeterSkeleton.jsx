import Skeleton from "./Skeleton";

const RiskMeterSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[var(--card-bg)] rounded-2xl p-5 shadow flex flex-col items-center">

      <Skeleton className="h-6 w-32 mb-8" />

      <Skeleton className="w-64 h-32 rounded-full" />

      <Skeleton className="h-5 w-20 mt-6" />

    </div>
  );
};

export default RiskMeterSkeleton;