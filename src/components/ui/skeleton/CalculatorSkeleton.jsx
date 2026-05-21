import Skeleton from "./Skeleton";

const CalculatorSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[var(--card-bg)] rounded-2xl p-5 shadow">

      {/* TITLE */}
      <Skeleton className="h-8 w-52 mb-6" />

      {/* BUTTONS */}
      <div className="flex gap-3 mb-8">
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>

      {/* AMOUNT */}
      <div className="space-y-3 mb-6">
        <Skeleton className="h-5 w-40" />

        {/* SLIDER */}
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* DURATION */}
      <div className="space-y-3 mb-8">
        <Skeleton className="h-5 w-32" />

        {/* SLIDER */}
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* DIVIDER */}
      <Skeleton className="h-[1px] w-full mb-6" />

      {/* RESULT */}
      <div className="space-y-3">

        <Skeleton className="h-4 w-44" />

        <Skeleton className="h-6 w-56" />

      </div>

    </div>
  );
};

export default CalculatorSkeleton;