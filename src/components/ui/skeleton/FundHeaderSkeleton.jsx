import Skeleton from "./Skeleton";

const FundHeaderSkeleton = () => {
  return (
    <div
      className="
        col-span-2
        bg-[var(--white-10)]
        backdrop-blur-sm
        
        rounded-2xl
        p-6
        shadow-md
      "
    >
      {/* TOP */}
      <div className="flex flex-col md:flex-row items-start md:justify-between gap-4">

        {/* LEFT */}
        <div className="flex items-start gap-4 flex-1 min-w-0">

          {/* LOGO */}
          <Skeleton className="w-16 h-16 rounded-xl shrink-0" />

          <div className="flex-1 min-w-0 space-y-3">

            {/* TITLE */}
            <Skeleton className="h-7 w-3/4" />

            {/* CATEGORY + RISK */}
            <div className="flex gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            {/* MOBILE BUTTONS */}
            <div className="flex md:hidden gap-3 pt-2">
              <Skeleton className="h-9 w-10 rounded-xl" />
              <Skeleton className="h-9 w-10 rounded-xl" />
            </div>

          </div>
        </div>

        {/* DESKTOP BUTTONS */}
        <div className="hidden md:flex gap-3">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      {/* BOTTOM */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-6">

        {/* PERFORMANCE */}
        <div className="space-y-3">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* INVEST */}
        <div className="flex items-center gap-4 flex-wrap">

          <Skeleton className="h-11 w-32 rounded-xl" />

          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
          </div>

        </div>
      </div>
    </div>
  );
};

export default FundHeaderSkeleton;