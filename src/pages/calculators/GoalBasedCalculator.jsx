import { useMemo } from "react";
import CalcShell, { useCalcState } from "./CalcShell";
import { sipForGoal } from "../../utils/calculators";

const GoalBasedCalculator = () => {
  const [v, set] = useCalcState({ goal: 1000000, years: 10, cagr: 12, current: 0, inflation: 0 });
  const r = useMemo(() => sipForGoal(v), [v]);

  return (
    <CalcShell
      title="Goal-Based Investment Calculator"
      blurb="Name the amount and the date. This works out what you need to invest each month to get there, counting whatever you have already put aside for it."
      values={v}
      onChange={set}
      fields={[
        { key: "goal", label: "Goal Amount (₹)", placeholder: "1000000" },
        { key: "years", label: "Years to Achieve It", placeholder: "10" },
        { key: "cagr", label: "Expected Annual Return (%)", placeholder: "12" },
        { key: "current", label: "Current Savings Toward This Goal (₹)", placeholder: "0" },
        { key: "inflation", label: "Inflation (%)", hint: "Leave at 0 to treat the goal as a today's-rupees figure" },
      ]}
      results={[
        { label: "Amount needed on the date", value: r.target },
        { label: "Your savings will grow to", value: r.currentFutureValue },
        { label: "Invest each month", value: r.monthlySIP },
        { label: "Total you will invest", value: r.totalInvested },
      ]}
      note="Money already saved keeps compounding on its own, so only the shortfall needs a monthly investment. If what you hold already covers the goal, the monthly figure is zero."
    />
  );
};

export default GoalBasedCalculator;
