/** Build Node BSE proxy URLs — VITE_NODE_URL should be http://host:3000/api (no trailing slash) */
export const nodeUrl = (path = "") => {
  const base = (import.meta.env.VITE_NODE_URL || "").replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
};

export const laravelUrl = (path = "") => {
  const base = (import.meta.env.VITE_URL || "").replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
};

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

/** Map getAllXsp BSE response items to frontend SIP card shape */
export const mapXspToSip = (item, idx = 0) => ({
  id: item.reg_no || item.id || idx + 1,
  reg_no: item.reg_no || item.id,
  schemeName: item.src_scheme_name || item.scheme_name || item.src_scheme || "SIP",
  category: item.scheme_category || "Mutual Fund",
  sipAmount: Number(item.amount || 0),
  frequency: item.freq === "m" ? "Monthly" : item.freq === "q" ? "Quarterly" : item.freq === "w" ? "Weekly" : "Monthly",
  sipDay: item.txn_date || 1,
  nextInstallment: item.next_installment_date || "—",
  startDate: item.start_date || "—",
  investedSoFar: Number(item.invested_amount || 0),
  currentValue: Number(item.current_value || item.invested_amount || 0),
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
