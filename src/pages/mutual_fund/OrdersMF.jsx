import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { History } from "lucide-react";
import { postApiWithToken } from "../../api/api";
import { nodeUrl } from "../../utils/nodeApi";

/**
 * Every order this UCC has placed, whatever happened to it.
 *
 * The investments page shows what the investor HOLDS; that list is deliberately filtered
 * to allotted orders. A rejected purchase, a cancelled SIP instalment and a completed
 * redemption all vanish from it — and those are exactly the things people come looking
 * for when something has gone wrong. The server does the BSE call and the merge (see
 * orderHistory); this only renders.
 */

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// BSE sends dd-mm-yyyy on some endpoints and an ISO instant on others. Parse the shape,
// never `new Date(string)` — that reads 03-04-2026 as March in one browser and April in
// the next, and an order date off by a month is worse than no date.
const asDate = (v) => {
  const s = String(v || "").trim();
  if (!s) return "—";
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[3]} ${MONTHS[Number(iso[2]) - 1]} ${iso[1]}`;
  const dmy = /^(\d{2})[-/](\d{2})[-/](\d{4})/.exec(s);
  if (dmy) return `${dmy[1]} ${MONTHS[Number(dmy[2]) - 1]} ${dmy[3]}`;
  return s;
};

// BSE's own status words, grouped by what the investor needs to do about them.
const TONE = (status) => {
  const s = String(status || "").toUpperCase();
  if (/ALLOT|SUCCESS|COMPLET|PAID/.test(s)) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
  if (/REJECT|FAIL|CANCEL/.test(s)) return "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400";
  return "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
};

const OrdersMF = () => {
  const navigate = useNavigate();
  const { data: investorData } = useSelector((state) => state.investorData);
  const ucc = investorData?.kyc?.ucc_code;

  const { data: orders = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["mfOrderHistory", ucc],
    queryFn: () => postApiWithToken(nodeUrl("/orderHistory"), { ucc }),
    select: (res) => (Array.isArray(res?.data?.orders) ? res.data.orders : []),
    enabled: !!ucc,
  });

  if (!ucc) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)]">
          Your BSE account is not registered yet, so there are no orders to show.
        </p>
        <button
          onClick={() => navigate("/kyc")}
          className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
        >
          Complete KYC
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-1">
        <History size={18} className="text-slate-600 dark:text-[var(--text-secondary)]" />
        <h1 className="text-lg font-semibold text-slate-900 dark:text-[var(--text-primary)]">Order history</h1>
      </div>
      <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)] mb-5">
        Every purchase, redemption and switch on this account — including the ones that did not go through.
      </p>

      {isLoading && <p className="text-center text-slate-400 py-10 text-sm">Loading orders…</p>}

      {isError && (
        <div className="text-center py-10">
          <p className="text-sm text-red-600 dark:text-red-400">Could not reach BSE for your orders.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 px-4 py-2 rounded-lg border border-slate-300 dark:border-[var(--border-color)] text-sm font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && !orders.length && (
        <div className="text-center py-12">
          <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)]">
            No orders yet. Once you invest, every order shows up here.
          </p>
          <button
            onClick={() => navigate("/user/mutual_fund/explore")}
            className="mt-4 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
          >
            Explore funds
          </button>
        </div>
      )}

      {!!orders.length && (
        <div className="rounded-lg border border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] divide-y divide-slate-200 dark:divide-[var(--border-color)] overflow-hidden">
          {orders.map((o, i) => (
            <div key={o.id ?? i} className="px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm leading-snug line-clamp-2 text-slate-900 dark:text-[var(--text-primary)]">
                  {o.scheme_name || o.scheme_bse_code || "—"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mt-0.5">
                  {asDate(o.date)}
                  {o.type ? ` · ${o.type}` : ""}
                  {o.folio ? ` · Folio ${o.folio}` : ""}
                  {o.id ? ` · #${o.id}` : ""}
                </p>
                {/* BSE puts the reason a rejected order failed in `remarks`, and it is the
                    only place the investor can find out why. */}
                {o.remarks && (
                  <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mt-1">{o.remarks}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-[var(--text-primary)]">
                  {o.amount ? money(o.amount) : o.units ? `${o.units} units` : "—"}
                </p>
                {o.status && (
                  <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded ${TONE(o.status)}`}>
                    {String(o.status).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersMF;
