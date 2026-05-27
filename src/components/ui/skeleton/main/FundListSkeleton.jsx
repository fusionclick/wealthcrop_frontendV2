import Skeleton from "../Skeleton";

const FundListSkeleton = () => {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl p-4 gap-4 bg-white dark:bg-[var(--card-bg)] dark:border-[var(--border-color)] border border-gray-200"
        >
          <div className="flex gap-3 flex-col h-38">
            {/* Fund image */}
            <Skeleton className="w-10 h-10 rounded-md" />

            {/* Fund name */}
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Return + Year */}
          <div className="flex justify-between mt-4">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
      ))}
    </>
  );
};

export default FundListSkeleton;
