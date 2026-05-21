// import {
//   FundHeaderSkeleton,
//   ChartSectionSkeleton,
//   RatioCardSkeleton,
//   CalculatorSkeleton,
//   HoldingsSkeleton,
//   PieChartSkeleton,
//   ReturnsTableSkeleton,
//   RiskMeterSkeleton,
// } from "@/components/ui/skeleton";

import CalculatorSkeleton from "../CalculatorSkeleton";
import ChartSectionSkeleton from "../ChartSectionSkeleton";
import FundHeaderSkeleton from "../FundHeaderSkeleton";
import HoldingsSkeleton from "../HoldingsSkeleton";
import PieChartSkeleton from "../PieChartSkeleton";
import RatioCardSkeleton from "../RatioCardSkeleton";
import ReturnsTableSkeleton from "../ReturnsTableSkeleton";
import RiskMeterSkeleton from "../RiskMeterSkeleton";

const FundDetailsPageSkeleton = () => {
  return (
    <div className="space-y-10 py-10 px-5 lg:px-24">

      {/* HEADER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2">
          <FundHeaderSkeleton />
        </div>

        <RatioCardSkeleton />

      </div>

      {/* CHART + RATIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2">
          <ChartSectionSkeleton />
        </div>

        <RatioCardSkeleton />

      </div>

      {/* CALCULATOR + MIN INVESTMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <CalculatorSkeleton />

        <RatioCardSkeleton />

      </div>

      {/* HOLDINGS */}
      <HoldingsSkeleton />

      {/* PIE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <PieChartSkeleton />

        <PieChartSkeleton />

      </div>

      {/* RETURNS TABLE */}
      <ReturnsTableSkeleton />

      {/* TAX + RISK */}
      <div className="grid grid-cols-1 gap-6">

        <RatioCardSkeleton />

        <RiskMeterSkeleton />

      </div>

    </div>
  );
};

export default FundDetailsPageSkeleton;