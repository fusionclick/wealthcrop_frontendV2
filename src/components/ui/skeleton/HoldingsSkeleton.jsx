import Skeleton from "./Skeleton";

const HoldingsSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[var(--card-bg)] rounded-2xl p-5 shadow">

      <Skeleton className="h-7 w-40 mb-6" />

      {/* TABLE HEAD */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[1,2,3,4].map((i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>

      {/* ROWS */}
      {[1,2,3,4].map((row) => (
        <div
          key={row}
          className="grid grid-cols-4 gap-4 py-4 "
        >
          {[1,2,3,4].map((i) => (
            <Skeleton key={i} className="h-4 w-3/4" />
          ))}
        </div>
      ))}

    </div>
  );
};

export default HoldingsSkeleton;