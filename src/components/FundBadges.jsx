// One badge row for every surface that shows a fund — Explore cards, Search results, the
// Details header, Compare. Keeping it in one component is what makes the attributes
// "consistent across Explore, Search and Details" instead of three drifting copies.
//
// Everything here is published per-scheme by BSE itself (lumpsum[] / systematic[] rows, read
// by schemeTransactions in the Node backend), except the SEBI risk level, which BSE's master
// does not carry at all and which arrives from the enrichment source.
//
// null ka matlab "BSE ne bataya hi nahi" — us par koi badge nahi. Kabhi "No" nahi.
const TONES = {
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-[var(--white-10)] dark:text-[var(--text-secondary)]",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
};

// SEBI's riskometer, coolest to hottest. The backend sends one of these six labels or null;
// it will not guess a level it does not know.
const RISK_TONES = {
  Low: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  "Low to Moderate": "bg-lime-50 text-lime-700 dark:bg-lime-500/15 dark:text-lime-400",
  Moderate: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  "Moderately High": "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  High: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  "Very High": "bg-red-100 text-red-800 dark:bg-red-500/25 dark:text-red-300",
};

const Pill = ({ tone = "slate", title, className = "", children }) => (
  <span
    title={title}
    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${className || TONES[tone]}`}
  >
    {children}
  </span>
);

export function RiskBadge({ risk, className = "" }) {
  if (!risk || !RISK_TONES[risk]) return null;
  return (
    <Pill className={`${RISK_TONES[risk]} ${className}`} title={`SEBI riskometer: ${risk} risk`}>
      {risk.toUpperCase()} RISK
    </Pill>
  );
}

/**
 * Which transaction types this scheme accepts. Only the ones BSE marked available are drawn
 * — an unsupported type must never appear as though it were on offer.
 */
export function TxnBadges({ txn, className = "" }) {
  if (!txn) return null;
  const on = [
    ["LUMPSUM", txn.lumpsum],
    ["SIP", txn.sip],
    ["SWP", txn.swp],
    ["STP", txn.stp],
    ["SWITCH", txn.switchAllowed],
  ].filter(([, v]) => v === true);
  if (!on.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {on.map(([label]) => (
        <Pill key={label} tone="sky" title={`${label} is available on this scheme`}>
          {label}
        </Pill>
      ))}
    </div>
  );
}

export default function FundBadges({ fund, className = "", showTxn = true }) {
  const physical = fund?.physical_only === true;
  const sip = fund?.sip_allowed;
  const plan = fund?.plan;
  const risk = fund?.risk;
  const payout = fund?.payout;
  const lockIn = fund?.lockIn?.label;
  // Set by an admin in the Fund Catalogue, not by BSE. null means nobody classified it.
  const adminCategory = fund?.admin_category;
  const txn = showTxn ? fund?.txn : null;
  const anyTxn = txn && [txn.lumpsum, txn.sip, txn.swp, txn.stp, txn.switchAllowed].some((v) => v === true);

  if (!physical && sip == null && !plan && !adminCategory && !risk && !payout && !lockIn && !anyTxn) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      <RiskBadge risk={risk} />
      {adminCategory && <Pill tone="emerald">{adminCategory.replace(/_/g, " ").toUpperCase()}</Pill>}
      {plan && <Pill tone="slate">{plan.toUpperCase()}</Pill>}
      {payout && <Pill tone="slate">{payout.toUpperCase()}</Pill>}
      {lockIn && (
        <Pill tone="amber" title={`Units cannot be redeemed for ${lockIn} from the date of investment`}>
          LOCK-IN {lockIn.toUpperCase()}
        </Pill>
      )}
      {physical && <Pill tone="amber">PHYSICAL ONLY</Pill>}
      {/* The old standalone SIP pill is covered by TxnBadges now. "NO SIP" survives on its
          own, because "this fund cannot take a SIP" is worth saying out loud. */}
      {anyTxn ? <TxnBadges txn={txn} /> : sip === true && <Pill tone="emerald">SIP</Pill>}
      {(txn ? txn.sip === false : sip === false) && <Pill tone="slate">NO SIP</Pill>}
    </div>
  );
}
