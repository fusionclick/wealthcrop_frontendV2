import Skeleton from "./Skeleton";

const RatioCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[var(--card-bg)] rounded-2xl p-5 shadow">

      <Skeleton className="h-6 w-40 mb-6" />

      <div className="grid grid-cols-2 gap-4">

        {[1,2,3,4,5,6,7,8].map((i) => (
          <div
            key={i}
            className="rounded-xl p-4 space-y-3"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        ))}

      </div>
    </div>
  );
};

export default RatioCardSkeleton;