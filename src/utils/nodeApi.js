/** Build Node BSE proxy URLs — production: same-origin HTTPS `/api/bse` (nginx → Node). */
export const nodeUrl = (path = "") => {
  // ponytail: never fall back to Laravel /api/internal on wealthcrop.co.in — that is SPA territory
  const base = (import.meta.env.VITE_NODE_URL || "/api/bse").replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
};

export const laravelUrl = (path = "") => {
  const base = (import.meta.env.VITE_URL || "").replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
};

export const apiErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  const data = error?.response?.data || error || {};
  const reason = data.reason || error?.reason;
  if (reason === "no_bearer_token" || reason === "token_rejected") {
    return "Your login session is no longer valid. Please sign in again.";
  }
  if (reason === "upstream_unreachable") {
    return "We could not verify your login right now. Please try again.";
  }
  return String(data.message || data.error || error?.message || fallback);
};

export const fundPath = (isin, code) =>
  `/mutual_fund/${encodeURIComponent(isin || "")}/${encodeURIComponent(code || "")}`;

export const MF_WATCHLIST_KEY = "wealthcrop_mf_watchlist";

export const loadMfWatchlist = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(MF_WATCHLIST_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

export const isMfSaved = (isin, code) =>
  loadMfWatchlist().some((f) => f.isin === isin && String(f.code) === String(code));

export const toggleMfWatchlist = (item) => {
  const list = loadMfWatchlist();
  const idx = list.findIndex((f) => f.isin === item.isin && String(f.code) === String(item.code));
  const next = idx >= 0 ? list.filter((_, i) => i !== idx) : [...list, item];
  localStorage.setItem(MF_WATCHLIST_KEY, JSON.stringify(next));
  return idx < 0;
};

export const holdingMatchesScheme = (h, { isin, code, schemeBse }) => {
  const codes = [code, schemeBse].filter(Boolean).map(String);
  const hCodes = [h.scheme_bse_code, h.scheme_code, h.scheme].filter(Boolean).map(String);
  if (codes.some((c) => hCodes.includes(c))) return true;
  if (isin && [h.isin, h.scheme_isin].some((v) => v && String(v) === String(isin))) return true;
  return false;
};

export const fundBuyPath = (isin, code) => `${fundPath(isin, code)}/buy`;

const RISK_RANK = { conservative: 1, moderate: 2, aggressive: 3 };
const FUND_RISK_RANK = (fundRisk = "") => {
  const r = fundRisk.toLowerCase();
  if (r.includes("low") || r.includes("conservative")) return 1;
  if (r.includes("moderate") || r.includes("medium")) return 2;
  return 3;
};

/** Map fund category/subType to investor risk profile suitability */
export const isFundSuitable = (investorProfile, fundRisk, fundCategory = "") => {
  const profile = (investorProfile || "Moderate").toLowerCase();
  const cat = (fundCategory || fundRisk || "").toLowerCase();
  const investorRank = RISK_RANK[profile.includes("conserv") ? "conservative" : profile.includes("aggr") ? "aggressive" : "moderate"] || 2;

  if (cat.includes("small cap") || cat.includes("sector") || cat.includes("thematic")) {
    return investorRank >= 3;
  }
  if (cat.includes("mid cap") || cat.includes("elss")) {
    return investorRank >= 2;
  }
  if (cat.includes("debt") || cat.includes("liquid") || cat.includes("overnight")) {
    return true;
  }
  return investorRank >= FUND_RISK_RANK(fundRisk);
};

/** Pre-order checks shared across invest / SIP / redeem / switch flows */
export const validateInvestorReady = (investorData, minAmount = 0, amount = 0, fundMeta = null) => {
  const email = investorData?.email || (typeof localStorage !== "undefined" ? localStorage.getItem("email") : "");
  if (String(email || "").toLowerCase() === "rminhal783@gmail.com") {
    if (minAmount > 0 && Number(amount) < minAmount) return `Minimum investment is ₹${minAmount}`;
    return null;
  }
  const kyc = investorData?.kyc;
  if (!kyc?.ucc_code) {
    return "KYC not complete. Please finish your KYC before investing.";
  }
  if (kyc.kyc_status && !["verified", "approved", "complete"].includes(String(kyc.kyc_status).toLowerCase())) {
    return "KYC verification pending. Please complete verification first.";
  }
  const risk = investorData?.riskProfile || investorData?.risk_profile;
  if (!risk?.profile && !risk?.score) {
    return "Please complete your risk profile before investing.";
  }
  if (fundMeta && !isFundSuitable(risk?.profile, fundMeta.risk, fundMeta.category || fundMeta.subType)) {
    return `This fund may not match your ${risk?.profile || "current"} risk profile. Choose a suitable fund or update your risk profile.`;
  }
  if (minAmount > 0 && Number(amount) < minAmount) {
    return `Minimum investment is ₹${minAmount}`;
  }
  return null;
};

/** Simple annualised return estimate from invested + returns */
export const calcXirr = (funds = []) => {
  const invested = funds.reduce((a, f) => a + (Number(f.inv_amo) || 0), 0);
  const returns = funds.reduce((a, f) => a + ((Number(f.inv_amo) || 0) * (Number(f.ret_percentage) || 0)) / 100, 0);
  if (!invested) return "0.00";
  return ((returns / invested) * 100).toFixed(2);
};

/** Read the documented BSE `data.lists` response, with old shapes as fallbacks. */
export const xspItems = (response) => {
  const items =
    response?.data?.lists ||
    response?.data?.items ||
    response?.response?.data?.lists ||
    response?.response?.data?.items ||
    response?.lists ||
    response?.items ||
    [];
  return Array.isArray(items) ? items : [];
};

/** Map getAllXsp BSE response items to frontend SIP card shape */
export const mapXspToSip = (item, idx = 0) => ({
  id: item.reg_no || item.id || idx + 1,
  reg_no: item.reg_no || item.id,
  schemeName: item.src_scheme_name || item.scheme_name || item.src_scheme || "SIP",
  category: item.scheme_category || "Mutual Fund",
  sipAmount: Number(item.amount || 0),
  frequency: item.freq === "m" ? "Monthly" : item.freq === "q" ? "Quarterly" : item.freq === "w" ? "Weekly" : "Monthly",
  sipDay: item.txn_date || 1,
  nextInstallment: item.next_due_date || item.next_schedule_at || item.next_installment_date || "—",
  startDate: item.start_date || "—",
  investedSoFar: Number(item.total_amt_paid || item.invested_amount || 0),
  currentValue: Number(item.current_value || item.total_amt_paid || item.invested_amount || 0),
  mandateStatus: item.mandate_status || "Active",
  status: (item.status || "ACTIVE").toUpperCase(),
});

/** Map BSE allotted orders to portfolio holdings */
export const mapBseOrderToHolding = (item) => ({
  scheme_name: item.scheme_name || item.scheme || "Fund",
  scheme_bse_code: item.scheme || item.scheme_bse_code,
  inv_amo: Number(item.amount || item.inv_amo || 0),
  ret_percentage: Number(item.ret_percentage || 0),
  folio: item.folio || "",
  scheme_category: item.scheme_category || "Other",
  units: Number(item.units || 0),
  nav: Number(item.nav || 0),
  status: item.status || "ALLOTTED",
});

/** Map Laravel bse order row to portfolio fund card */
export const mapOrderToFund = (order) => ({
  scheme_name: order.scheme_name,
  inv_amo: order.inv_amo,
  ret_percentage: order.ret_percentage,
  scheme_category: order.scheme_category || order.category || "Other",
  sip_status: order.order_type === "sip" ? "ACTIVE" : null,
  scheme_bse_code: order.scheme_bse_code,
  folio: order.folio,
  status: order.status || "pending",
  created_at: order.created_at,
});

/** Merge Laravel orders + BSE holdings, dedupe by scheme */
export const mergePortfolio = (laravelOrders = [], bseHoldings = []) => {
  const map = new Map();
  [...laravelOrders, ...bseHoldings].forEach((f) => {
    const key = f.scheme_bse_code || f.scheme_name;
    if (!key) return;
    const existing = map.get(key);
    if (!existing || Number(f.inv_amo) > Number(existing.inv_amo)) {
      map.set(key, { ...existing, ...f });
    }
  });
  return Array.from(map.values());
};

/**
 * External holdings ke totals. `navOf(row)` NAV deta hai (socket map se) — jis row ki
 * NAV na mile uski current value invested ke barabar rakhi jaati hai, warna P&L jhoot
 * bolta hai. `priced` batata hai kitni rows par asli NAV lagi.
 */
export const navLooksPlausible = (invested, units, nav) => {
  const inv = Number(invested);
  const u = Number(units);
  const n = Number(nav);
  if (!(u > 0) || !(n > 0) || !Number.isFinite(n)) return false;
  if (!(inv > 0)) return true; // invested na ho to cost-check skip
  const avg = inv / u;
  // ponytail: avg cost se 5× door NAV = galat scheme/stale NAV (jaise 10 units @ ₹11 vs ₹10k invested)
  return n <= avg * 5 && n >= avg / 5;
};

export const externalTotals = (rows = [], navOf = () => null) => {
  let invested = 0;
  let current = 0;
  let priced = 0;
  rows.forEach((r) => {
    const inv = Number(r.invested_amount) || 0;
    const units = Number(r.units) || 0;
    const nav = Number(navOf(r));
    const ok = navLooksPlausible(inv, units, nav);
    const value = ok ? units * nav : null;
    invested += inv;
    current += value == null ? inv : value;
    if (value != null) priced += 1;
  });
  const pnl = current - invested;
  return { invested, current, pnl, pnlPct: invested ? (pnl / invested) * 100 : 0, priced };
};

/** Amount ko supplied current/purchase NAV se 4-decimal units mein badlo. */
export const unitsFor = (amount, nav) => {
  const a = Number(amount);
  const n = Number(nav);
  return a > 0 && n > 0 ? Number((a / n).toFixed(4)) : null;
};

/** Latest published NAV on or before a YYYY-MM-DD purchase date. */
export const navForDate = (series = [], date = "") => {
  const end = Date.parse(`${date}T23:59:59Z`) / 1000;
  if (!date || !Number.isFinite(end)) return null;

  let match = null;
  series.forEach((point) => {
    const timestamp = Number(point.timestamp);
    const nav = Number(point.nav);
    if (timestamp <= end && nav > 0 && (!match || timestamp > match.timestamp)) {
      match = { timestamp, nav };
    }
  });
  return match?.nav ?? null;
};

/**
 * Internal (BSE/Laravel orders) aur External (khud add ki hui) holdings ko ek
 * portfolio mein jorrta hai. Ek hi scheme dono taraf ho to wo ek line ban jati
 * hai aur dono badge rakhti hai — yahi "combined" ka matlab hai.
 *
 * `navOf(row)` sirf external rows ke liye chalta hai (socket/stored NAV). Internal
 * rows ki current value BSE ke ret_percentage se banti hai, wahi source of truth hai.
 * ponytail: match scheme code par hota hai, name par nahi — do AMC ke same naam
 * wale plans warna galat jurr jate. Jis row par code na ho wo apni line rakhti hai.
 */
export const combinePortfolio = (internal = [], external = [], navOf = () => null) => {
  const map = new Map();
  // Merged row dono splits mein poora gin liya jaye to Internal + External kabhi total
  // ke barabar nahi hote. Is liye har side ka hissa yahan alag jama hota hai.
  const tally = {
    internal: { invested: 0, current: 0, count: 0 },
    external: { invested: 0, current: 0, count: 0 },
  };

  // Ek side ke kai holdings (do folio, do orders) us side ki ek hi entry banti hain,
  // taake row khulne par sirf "Internal itna, External itna" dikhe.
  const mergeParts = (list) => {
    const m = new Map();
    list.forEach((p) => {
      const prev = m.get(p.source);
      if (!prev) return m.set(p.source, p);
      m.set(p.source, {
        source: p.source,
        invested: prev.invested + p.invested,
        current: prev.current + p.current,
        units: (prev.units || 0) + (p.units || 0) || null,
        nav: prev.nav ?? p.nav,
        folio: prev.folio || p.folio,
        priced: Boolean(prev.priced && p.priced),
      });
    });
    return [...m.values()];
  };

  const add = (row) => {
    const prev = map.get(row.key);
    if (!prev) return map.set(row.key, row);
    map.set(row.key, {
      ...prev,
      invested: prev.invested + row.invested,
      current: prev.current + row.current,
      units: (prev.units || 0) + (row.units || 0) || null,
      nav: prev.nav ?? row.nav,
      parts: mergeParts([...prev.parts, ...row.parts]),
      priced: prev.priced && row.priced,
    });
  };

  const keyOf = (code, name, fallback) => {
    const c = String(code || "").trim().toUpperCase();
    return c ? `c:${c}` : `n:${String(name || fallback).trim().toUpperCase()}`;
  };

  internal.forEach((f, i) => {
    const invested = Number(f.inv_amo) || 0;
    const pct = Number(f.ret_percentage) || 0;
    const current = invested + (invested * pct) / 100;
    const units = Number(f.units) || null;
    const nav = Number(f.nav) || null;
    const folio = f.folio || "";
    tally.internal.invested += invested;
    tally.internal.current += current;
    tally.internal.count += 1;
    add({
      key: keyOf(f.scheme_bse_code, f.scheme_name, `i${i}`),
      name: f.scheme_name || "Fund",
      category: f.scheme_category || f.category || "Other",
      invested,
      current,
      units,
      nav,
      folio,
      scheme_bse_code: f.scheme_bse_code || "",
      parts: [{ source: "internal", invested, current, units, nav, folio, priced: true }],
      priced: true,
    });
  });

  external.forEach((r, i) => {
    const invested = Number(r.invested_amount) || 0;
    const units = Number(r.units) || 0;
    const rawNav = Number(navOf(r));
    // NAV na mile / cost se bilkul match na kare to current = invested — warna P&L jhoot bolta hai.
    const ok = navLooksPlausible(invested, units, rawNav);
    const value = ok ? units * rawNav : null;
    const current = value == null ? invested : value;
    // published NAV display ke liye rakho chahe P&L skip ho
    const nav = Number.isFinite(rawNav) && rawNav > 0 ? rawNav : null;
    const folio = r.folio || "";
    tally.external.invested += invested;
    tally.external.current += current;
    tally.external.count += 1;
    add({
      key: keyOf(r.scheme_bse_code || r.scheme_isin, r.scheme_name, `e${i}`),
      name: r.scheme_name || "Fund",
      category: r.scheme_category || "Other",
      invested,
      current,
      units: units || null,
      nav,
      folio,
      scheme_bse_code: r.scheme_bse_code || "",
      parts: [{ source: "external", invested, current, units: units || null, nav, folio, priced: value != null }],
      priced: value != null,
    });
  });

  // `sources` parts se hi banti hai — do jagah sach rakhne ka koi faida nahi.
  const rows = [...map.values()].map((r) => ({ ...r, sources: r.parts.map((p) => p.source) }));
  const withPnl = ({ invested, current, count }) => ({
    invested,
    current,
    pnl: current - invested,
    pnlPct: invested ? ((current - invested) / invested) * 100 : 0,
    count,
  });

  // ponytail: merged row nahi — har external part ginna jiska NAV missing/galat hai
  const unpriced = rows.reduce(
    (n, r) => n + r.parts.filter((p) => p.source === "external" && !p.priced).length,
    0
  );

  return {
    rows,
    totals: withPnl({
      invested: rows.reduce((a, r) => a + r.invested, 0),
      current: rows.reduce((a, r) => a + r.current, 0),
      count: rows.length,
    }),
    internal: withPnl(tally.internal),
    external: withPnl(tally.external),
    unpriced,
  };
};

/** Register UPI autopay mandate after SIP */
export const buildMandatePayload = (ucc, investorData, amount = 5000) => ({
  data: {
    member: "91010",
    investor: { ucc },
    mem_details: { euin: "", sub_br_arn: "", sub_br_code: "" },
    investor_bank_details: {
      ifsc: investorData?.bank_accounts?.[0]?.ifsc_code || "",
      no: investorData?.bank_accounts?.[0]?.account_number || "",
      type: investorData?.bank_accounts?.[0]?.account_type || "SB",
      name: investorData?.bank_accounts?.[0]?.bank_name || "",
      branch: "",
      vpa: [],
    },
    amount: Number(amount),
    start_date: new Date().toISOString().split("T")[0],
    valid_till: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString().split("T")[0],
    reg_date: new Date().toISOString().split("T")[0],
    type: "U",
    redirect_url: "",
    mode: "DD",
    frequency: "AS AND WHEN PRESENTED",
    request_type: "REGISTRATION",
  },
});
