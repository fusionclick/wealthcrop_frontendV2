import { useMemo } from "react";
import CalcShell, { useCalcState } from "./CalcShell";
import { epf } from "../../utils/calculators";

const EpfCalculator = () => {
  const [v, set] = useCalcState({ basic: 50000, employeePct: 12, employerPct: 12, years: 10, rate: 8.25 });
  const r = useMemo(() => epf(v), [v]);

  return (
    <CalcShell
      title="EPF Calculator"
      blurb="See what your Employees' Provident Fund is worth at retirement — your contributions, your employer's, and the interest both earn along the way."
      values={v}
      onChange={set}
      fields={[
        { key: "basic", label: "Monthly Basic Salary (₹)", placeholder: "50000" },
        { key: "employeePct", label: "Your Contribution (%)", hint: "Statutory rate is 12%" },
        { key: "employerPct", label: "Employer Contribution (%)", hint: "Statutory rate is 12%" },
        { key: "years", label: "Years of Contribution", placeholder: "10" },
        { key: "rate", label: "Interest Rate (% p.a.)", hint: "EPFO declares this yearly — currently 8.25%" },
      ]}
      results={[
        { label: "Your total contribution", value: r.employee },
        { label: "Employer's total contribution", value: r.employer },
        { label: "Interest earned", value: r.interest },
        { label: "Balance at maturity", value: r.total },
      ]}
      note="Contributions accrue monthly and interest is credited once a year, the way EPFO does it. Employer share is taken as entered — in practice part of it goes to EPS (pension) instead."
    />
  );
};

export default EpfCalculator;
