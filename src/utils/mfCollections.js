// Client 2026-10-09 (SEBI advertising code / AMFI MFD Code of Conduct): collections are
// objective SEBI categories. "High Return" and "5 Star Funds" read as promises of
// performance and "Kotak Funds" was a single-AMC shortcut, so all three are gone. Each slug
// is filtered server-side (Backend matchesCategory) — no name search rides along any more.
export const MF_COLLECTIONS = [
  { name: "Gold Funds", slug: "gold_funds" },
  { name: "Large Cap", slug: "large_cap" },
  { name: "Mid Cap", slug: "mid_cap" },
  { name: "Small Cap", slug: "small_cap" },
  { name: "Flexi Cap", slug: "flexi_cap" },
  { name: "Tax Saver (ELSS)", slug: "elss" },
];

// The footer's "Top Fund Categories" adds one the collection rail does not carry.
export const TOP_CATEGORIES = [
  { name: "Large Cap Funds", slug: "large_cap" },
  { name: "Flexi Cap Funds", slug: "flexi_cap" },
  { name: "Mid Cap Funds", slug: "mid_cap" },
  { name: "Small Cap Funds", slug: "small_cap" },
  { name: "Tax Saver (ELSS) Funds", slug: "elss" },
  { name: "Balanced Advantage Funds", slug: "balanced_advantage" },
];

// Client 2026-10-09 — the Mutual Funds menu's Categories panel, after the client's JSON. The
// client marked their copy "example only"; the sub-texts here are SEBI's own category
// definitions rather than marketing lines ("High-Growth Emerging Champions" reads as a
// promise, the same reason "High Return" went). The "Instant Redemption" badge is left off:
// BSE StarMF orders here settle T+1, so the platform cannot honour it. Each slug is a
// server-side group (Backend matchesCategory → SEBI_GROUPS).
export const MF_CATEGORY_MENU = [
  {
    id: "equity_schemes",
    name: "Equity Schemes",
    subtext: "Capital Growth",
    items: [
      { name: "Large Cap Funds", slug: "large_cap", subtext: "Top 100 companies by market value" },
      { name: "Flexi Cap & Multi Cap Funds", slug: "flexi_multi_cap", subtext: "Spread across large, mid and small caps" },
      { name: "Mid & Small Cap Funds", slug: "mid_small_cap", subtext: "Companies ranked 101st onwards by market value" },
      { name: "ELSS (Tax Savers)", slug: "elss", subtext: "Equity with a 3-year lock-in", badge: "Sec 80C" },
    ],
  },
  {
    id: "debt_liquid_schemes",
    name: "Debt & Liquid Schemes",
    subtext: "Stability & Cash Management",
    items: [
      { name: "Liquid & Overnight Funds", slug: "liquid_overnight", subtext: "Money-market paper up to 91 days" },
      { name: "Ultra Short & Low Duration", slug: "ultra_short_low", subtext: "Portfolio duration of 3 to 12 months" },
      { name: "Corporate Bond & Gilt Funds", slug: "corporate_bond_gilt", subtext: "Highest-rated corporate bonds or government securities" },
    ],
  },
  {
    id: "hybrid_lifecycle_schemes",
    name: "Hybrid & Life-Cycle Schemes",
    subtext: "Balanced Asset Mix",
    items: [
      { name: "Balanced Advantage (BAFs)", slug: "balanced_advantage", subtext: "Equity–debt mix adjusted dynamically" },
      { name: "Multi-Asset Allocation Funds", slug: "multi_asset", subtext: "At least three asset classes, 10% each" },
      { name: "Aggressive & Conservative Hybrid", slug: "hybrid_aggressive_conservative", subtext: "Equity-heavy or debt-heavy mix" },
      { name: "Target-Date Life Cycle Funds", slug: "target_date", subtext: "Glide path towards a set maturity year", badge: "Target Date" },
    ],
  },
  {
    id: "passive_index_schemes",
    name: "Passive & Index Schemes",
    subtext: "Low Cost & Transparent",
    items: [
      { name: "Benchmark Index Funds", slug: "index_funds", subtext: "Track an index such as Nifty 50 or Sensex" },
      { name: "Target Maturity Debt Index Funds", slug: "target_maturity", subtext: "Passive debt held to a defined maturity" },
    ],
  },
];

/** The label a collection slug is shown under, wherever it came from. */
export function collectionLabel(slug = "") {
  const all = [...MF_COLLECTIONS, ...TOP_CATEGORIES, ...MF_CATEGORY_MENU.flatMap((g) => g.items)];
  return all.find((c) => c.slug === slug)?.name || slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const COLLECTIONS_NOTE ="Collections represent standardized SEBI fund categorization for self-directed evaluation.";

// [label, the `amc` term the catalogue matches — word-bounded, against the AMC name or the
// brand every scheme name starts with].
export const TOP_AMCS = [
  ["SBI Mutual Fund", "SBI"],
  ["HDFC Mutual Fund", "HDFC"],
  ["ICICI Prudential Mutual Fund", "ICICI Prudential"],
  ["Nippon India Mutual Fund", "Nippon India"],
  ["Quant Mutual Fund", "Quant"],
  ["Parag Parikh Mutual Fund", "Parag Parikh"],
  ["Axis Mutual Fund", "Axis"],
  ["Mirae Asset Mutual Fund", "Mirae Asset"],
  ["Kotak Mutual Fund", "Kotak"],
  ["DSP Mutual Fund", "DSP"],
];

// The client's link shape (?category=equity&sub_category=flexi_cap) → our collection slug.
const SUB_TO_SLUG = { gold: "gold_funds", elss: "elss" };

export function collectionSlug(raw = "") {
  const slug = String(raw).trim().toLowerCase().replace(/-/g, "_");
  return SUB_TO_SLUG[slug] || slug;
}

export const exploreUrl = ({ collection = "", amc = "" } = {}) => {
  const q = new URLSearchParams();
  if (collection) q.set("collection", collection);
  if (amc) q.set("amc", amc);
  const s = q.toString();
  return `/user/mutual_fund/explore${s ? `?${s}` : ""}`;
};
