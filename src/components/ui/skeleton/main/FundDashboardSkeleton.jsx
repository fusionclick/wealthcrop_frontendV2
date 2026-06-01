import React from "react";
import Skeleton from "../Skeleton";

const FundDashboardSkeleton = () => {
  return (
    <div className="p-4 min-h-screen bg-slate-50 dark:bg-[var(--app-bg)]">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl  bg-white dark:bg-[var(--white-10)]"
          >
            <Skeleton className="w-20 h-3 mb-3" />
            <Skeleton className="w-28 h-6" />
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-[var(--white-10)]  rounded-xl p-4 mb-5">
        <Skeleton className="w-40 h-4 mb-4" />

        <div className="h-56 flex items-center justify-center">
          <Skeleton className="w-40 h-40 rounded-full" />
        </div>
      </div>

      {/* SIP Section */}
      <div className="bg-white dark:bg-[var(--white-10)]  rounded-xl p-4 mb-5">
        <Skeleton className="w-32 h-4 mb-2" />
        <Skeleton className="w-64 h-3 mb-4" />
        <Skeleton className="w-28 h-8 rounded-md" />
      </div>

      {/* List Header */}
      <div className="flex justify-between mb-3">
        <Skeleton className="w-28 h-4" />
        <Skeleton className="w-20 h-6" />
      </div>

      {/* Fund List */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg  bg-white dark:bg-[var(--white-10)] flex justify-between items-center"
          >
            <div className="space-y-2">
              <Skeleton className="w-40 h-4" />
              <Skeleton className="w-24 h-3" />
            </div>

            <Skeleton className="w-16 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FundDashboardSkeleton;
