import Skeleton from "./Skeleton";

const ReturnsTableSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[var(--card-bg)] rounded-2xl p-5 shadow">

      <Skeleton className="h-7 w-52 mb-6" />

      {[1,2,3,4].map((row) => (
        <div
          key={row}
          className="grid grid-cols-5 gap-4 py-4 border-t border-[var(--border-color)]"
        >
          {[1,2,3,4,5].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      ))}

    </div>
  );
};

export default ReturnsTableSkeleton;