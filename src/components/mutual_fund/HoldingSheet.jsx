import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { fundBuyPath } from "../../utils/nodeApi";

// ponytail: native <dialog> — Esc se band hona, focus trap aur backdrop browser deta hai.
// Koi modal library, koi focus-trap hook nahi.
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// Laravel serialises this column as a UTC instant even though only a date was entered,
// so parsing it as a Date shifts the day by the browser's offset. Read the date part.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const asDate = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ""));
  return m ? `${m[3]} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : v || null;
};

const Row = ({ label, value }) =>
  value == null || value === "" ? null : (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0 dark:border-[var(--border-color)]">
      <span className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">{label}</span>
      <span className="text-xs font-medium text-slate-900 dark:text-[var(--text-primary)] text-right">{value}</span>
    </div>
  );

/**
 * Ek holding ka detail popup — Internal (BSE ke through kharida) aur External (khud
 * add kiya) dono isi ko use karte hain. Mutual fund par sirf do actions hote hain:
 * **Invest more** aur **Redeem**. External holding platform par nahi hai, is liye
 * uspar sirf Invest more dikhta hai — redeem wahin se hoga jahan se kharida tha.
 */
export default function HoldingSheet({ holding, source = "internal", onClose, onRemove }) {
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (holding && !el.open) el.showModal();
    if (!holding && el.open) el.close();
    return undefined;
  }, [holding]);

  if (!holding) return null;

  const invested = Number(holding.invested ?? holding.inv_amo ?? holding.invested_amount ?? 0);
  const current = Number(holding.current ?? invested);
  const pnl = current - invested;
  const pct = invested ? (pnl / invested) * 100 : 0;
  const code = holding.scheme_bse_code || holding.scheme_code || "";
  const isin = holding.scheme_isin || "";
  const isInternal = source !== "external";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose?.()}
      className="m-auto w-full max-w-md rounded-2xl p-0 backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm
                 bg-white dark:bg-[var(--card-bg)] dark:text-[var(--text-primary)]
                 border border-slate-200 dark:border-[var(--border-color)]"
    >
      <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 dark:border-[var(--border-color)]">
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-snug">{holding.name || holding.scheme_name || "—"}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            <span
              className={`inline-block px-1.5 py-0.5 rounded mr-1.5 ${
                isInternal ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              {isInternal ? "Internal" : "External"}
            </span>
            {holding.category || holding.scheme_category || "Mutual Fund"}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[var(--white-10)]">
          <X size={18} />
        </button>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-slate-50 dark:bg-[var(--white-10)] p-3">
            <p className="text-[11px] text-slate-500">Current value</p>
            <p className="text-lg font-semibold">{money(current)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-[var(--white-10)] p-3">
            <p className="text-[11px] text-slate-500">Returns</p>
            <p className={`text-lg font-semibold ${pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {pnl >= 0 ? "+" : ""}
              {money(pnl)}
              <span className="text-xs font-medium ml-1">({pct.toFixed(2)}%)</span>
            </p>
          </div>
        </div>

        <Row label="Invested" value={money(invested)} />
        <Row label="Units" value={holding.units ? Number(holding.units).toLocaleString("en-IN") : null} />
        <Row label="NAV" value={holding.nav ? money(holding.nav) : null} />
        <Row label="Folio" value={holding.folio || null} />
        <Row label="Scheme code" value={code || null} />
        <Row label="Purchased on" value={asDate(holding.purchased_at)} />

        <div className="flex flex-wrap gap-3 mt-5">
          <button
            type="button"
            onClick={() => navigate(fundBuyPath(isin, code))}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
          >
            Invest more
          </button>
          {isInternal ? (
            <button
              type="button"
              onClick={() =>
                navigate("/mutual_fund/redeem", { state: { scheme_bse_code: code, code, isin } })
              }
              className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
            >
              Redeem
            </button>
          ) : (
            onRemove && (
              <button
                type="button"
                onClick={() => onRemove(holding)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-[var(--border-color)] text-sm font-medium"
              >
                Remove
              </button>
            )
          )}
        </div>
        {/* Switch used to be a portfolio-level button on the investments page, which meant
            picking a fund, then picking it again in an empty dropdown. It belongs on the
            fund. Full width because it is the less common action of the three. */}
        {isInternal && (
          <button
            type="button"
            onClick={() =>
              navigate("/mutual_fund/switch", {
                state: {
                  scheme_bse_code: code,
                  code,
                  isin,
                  folio: holding.folio || "",
                  scheme_name: holding.name || holding.scheme_name || "",
                },
              })
            }
            className="w-full mt-3 py-2.5 rounded-xl border border-indigo-500 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
          >
            Switch to another fund
          </button>
        )}
        {!isInternal && (
          <p className="text-[11px] text-slate-500 mt-3">
            This holding was bought elsewhere, so it cannot be redeemed here — redeem it with the
            platform you bought it from.
          </p>
        )}
      </div>
    </dialog>
  );
}
