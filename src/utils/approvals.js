// Audit #49 — placing an approved transaction again, with the details it was held with.
// Plain JS so the request can be checked directly (test/transactionsB.test.mjs).
import { orderRefId } from "./nodeApi.js";
import { installmentCount, nextOccurrence } from "./sipDates.js";

const isoToday = () => new Date().toISOString().slice(0, 10);

/**
 * The request "Place now" sends: the approval's own order, through the path it was held on,
 * naming the approval it spends. A SIP/STP whose start date passed while it waited starts on
 * the next occurrence of the same day, for the same number of instalments.
 */
export function approvalRequest(approval, { acknowledged, investor, today = isoToday() }) {
  const it = approval?.intent || {};
  const base = { acknowledged, approval_id: approval.id };
  if (approval.kind === "purchase" || approval.kind === "switch") {
    const sw = approval.kind === "switch";
    return {
      path: "/purchaseNewOrder",
      body: {
        data: {
          orders: [
            {
              type: sw ? "sw" : "p",
              mem_ord_ref_id: orderRefId(),
              investor: { ucc: investor?.kyc?.ucc_code },
              scheme: it.scheme,
              ...(sw
                ? { dest_scheme: it.dest_scheme, folio: it.folio, all_units: Boolean(it.all_units), is_fresh: false }
                : { folio: "", all_units: false, is_fresh: true }),
              amount: sw && it.all_units ? 0 : Number(it.amount),
              cur: "INR",
              is_units: false,
              min_redeem_flag: false,
              phys_or_demat: "d",
              holder: [{ holder_rank: "1", email: investor?.email || "" }],
              kyc_passed: true,
              dpc: true,
              email: investor?.email || "",
            },
          ],
          ...base,
        },
      },
    };
  }
  const stale = !it.start_date || it.start_date <= today;
  const start = stale
    ? nextOccurrence(Number(String(it.start_date || "").slice(8, 10)) || 1, new Date(`${today}T12:00:00`))
    : it.start_date;
  const count = it.start_date && it.end_date ? installmentCount(it.start_date, it.end_date, it.freq || "m") : 0;
  return {
    path: "/xspRegister",
    body: {
      data: {
        sxp_type: approval.kind,
        scheme: it.scheme,
        ...(approval.kind === "stp" ? { dest_scheme: it.dest_scheme, folio: it.folio } : {}),
        amount: Number(it.amount),
        freq: it.freq || "m",
        start_date: start,
        txn_date: Number(start.slice(8, 10)),
        ...(stale && count ? { ninstallments: count } : it.end_date ? { end_date: it.end_date } : {}),
        ...base,
      },
    },
  };
}
