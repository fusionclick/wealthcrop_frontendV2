// BSE har scheme par apne flags bhejta hai — `physical_only` (lumpsum[] ka
// demat/physical mode) aur `sip_allowed` (systematic[] ka sip_flag). Investor ko ye
// card par hi dikhna chahiye, order reject hone par nahi.
// null ka matlab "BSE ne bataya hi nahi" — us par koi badge nahi.
const TONES = {
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-[var(--white-10)] dark:text-[var(--text-secondary)]",
};

const Pill = ({ tone = "slate", children }) => (
  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${TONES[tone]}`}>
    {children}
  </span>
);

export default function FundBadges({ fund, className = "" }) {
  const physical = fund?.physical_only === true;
  const sip = fund?.sip_allowed;
  const plan = fund?.plan;
  // Set by an admin in the Fund Catalogue, not by BSE. null means nobody classified it.
  const adminCategory = fund?.admin_category;
  if (!physical && sip == null && !plan && !adminCategory) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {adminCategory && <Pill tone="emerald">{adminCategory.replace(/_/g, " ").toUpperCase()}</Pill>}
      {plan && <Pill tone="slate">{plan.toUpperCase()}</Pill>}
      {physical && <Pill tone="amber">PHYSICAL ONLY</Pill>}
      {sip === true && <Pill tone="emerald">SIP</Pill>}
      {sip === false && <Pill tone="slate">NO SIP</Pill>}
    </div>
  );
}
