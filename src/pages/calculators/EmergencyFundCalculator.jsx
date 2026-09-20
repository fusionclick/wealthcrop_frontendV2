import { useMemo } from "react";
import CalcShell, { useCalcState } from "./CalcShell";
import { emergencyFund } from "../../utils/calculators";

const EmergencyFundCalculator = () => {
  const [v, set] = useCalcState({ expenses: 40000, months: 6, current: 0, rate: 6, buildMonths: 12 });
  const r = useMemo(() => emergencyFund(v), [v]);

  return (
    <CalcShell
      title="Emergency Fund Calculator"
      blurb="Work out how much you should keep aside for an emergency, how far along you already are, and what it takes each month to close the gap."
      values={v}
      onChange={set}
      fields={[
        { key: "expenses", label: "Monthly Living Expenses (₹)", placeholder: "40000" },
        { key: "months", label: "Months to Cover", hint: "Most advisers suggest 6 to 12" },
        { key: "current", label: "Current Emergency Savings (₹)", placeholder: "0" },
        { key: "buildMonths", label: "Months to Build the Fund", hint: "How long you give yourself to get there" },
        { key: "rate", label: "Expected Return if Invested (% p.a.)", hint: "For a liquid or overnight fund" },
      ]}
      results={[
        { label: "Fund required", value: r.required },
        { label: "Still to save", value: r.shortfall },
        { label: "Save each month", value: r.monthlySaving },
        {
          label: "Income once parked",
          text: r.annualIncomeIfInvested ? `₹${r.annualIncomeIfInvested.toLocaleString("en-IN")}/yr` : "—",
        },
        {
          label: "Status",
          text: r.funded ? "Fully funded" : "Building",
        },
      ]}
      note="Where to keep it: liquid funds, overnight funds or a sweep-in deposit — reachable within a day and not exposed to the market. The target is never discounted by the return, because money you may need next month should not be budgeted as if it compounds first."
    />
  );
};

export default EmergencyFundCalculator;
