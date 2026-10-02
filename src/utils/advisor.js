/**
 * SRS §8 (Robo Advisory) and §9/§16 (risk profiling, life-stage portfolios, behavioural
 * insights) — the advice itself, as pure functions.
 *
 * Deliberately a rule engine, not a model call. Everything it says has to be defensible to
 * a regulator and repeatable tomorrow; "the LLM suggested 70% equity" is neither, and an
 * advice screen that stops working when a third-party API key expires is worse than one
 * whose reasoning fits on a page. The chatbot is the interface, not the brain.
 *
 * The starting allocations are the standard glide path — equity share falls as the money
 * gets closer to being spent — shifted by risk tolerance. Horizon overrides both, because
 * money needed in two years does not belong in equity whatever the questionnaire says.
 */

import { isFundSuitable } from "./nodeApi.js";
import { roundToHundred } from "./mpt.js";

import { LIFE_STAGES, RISK_PROFILES, allocationFor, sleevesFor, rationaleFor } from "./allocation.js";
export { LIFE_STAGES, RISK_PROFILES, allocationFor, sleevesFor, rationaleFor };
/**
 * SRS §16.3 — behavioural insights, from the order history the app already has.
 *
 * Pattern-matching on real behaviour, not a personality claim: every line names what was
 * counted. Anything it cannot see, it does not say.
 *
 * @param {Array<{order_type?: string, trxn_type?: string, created_at?: string, order_date?: string, inv_amo?: number|string}>} orders
 */
export function behaviourInsights(all = []) {
  if (!Array.isArray(all) || all.length === 0) return [];
  // A rejected, failed or cancelled order never happened as far as the money is concerned,
  // so it is not behaviour — the QA book's one rejected purchase was being counted as an 8th.
  const orders = all.filter((o) => !/reject|fail|cancel/i.test(String(o.status || "")));

  // /orderHistory hands back `type` and `amount` (normalised in the Node controller), not
  // BSE's raw `order_type` / `inv_amo` — reading only the raw names skipped every order, so
  // this section never rendered. BSE may also say just "P" / "R".
  const kind = (o) => {
    const t = String(o.type || o.order_type || o.trxn_type || "").toLowerCase();
    return t === "p" ? "purchase" : t === "r" ? "redemption" : t;
  };
  const buys = orders.filter((o) => /purchase|buy|sip|additional/.test(kind(o)));
  const sells = orders.filter((o) => /redeem|redemption|sell|swp/.test(kind(o)));
  const sips = orders.filter((o) => /sip|xsp|systematic/.test(kind(o)));

  const out = [];

  // `basis` is the counted fact on its own, so adjustmentsFor can quote it in "Adjusted because".
  if (sells.length >= 2 && sells.length >= buys.length) {
    const basis = `${sells.length} redemptions against ${buys.length} purchases`;
    out.push({
      tag: "Redeems often",
      basis,
      text: `${basis}. Frequent exits are the most common reason a portfolio earns less than the funds in it.`,
    });
  }

  if (sips.length > 0) {
    out.push({
      tag: "Invests on a schedule",
      text: `${sips.length} systematic instalment${sips.length === 1 ? "" : "s"} on record — the contribution pattern this plan assumes.`,
    });
  } else if (buys.length >= 3) {
    const basis = `${buys.length} one-off purchases and no SIP`;
    out.push({
      tag: "Invests in lumps",
      basis,
      text: `${basis}. A SIP would remove the timing decision you are making each time.`,
    });
  }

  const amounts = buys.map((o) => Number(o.amount ?? o.inv_amo) || 0).filter((n) => n > 0);
  if (amounts.length >= 3) {
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const biggest = Math.max(...amounts);
    if (biggest > avg * 3) {
      out.push({
        tag: "Uneven amounts",
        text: `Largest purchase ₹${Math.round(biggest).toLocaleString("en-IN")} against an average of ₹${Math.round(avg).toLocaleString(
          "en-IN"
        )}. Sizing that varies this much usually tracks market mood rather than a plan.`,
      });
    }
  }

  return out;
}

/**
 * The chatbot script. Each step is a question plus the answers it accepts; the page walks
 * this array, so adding a question never touches the page.
 */
export const CHAT_STEPS = [
  {
    key: "lifeStage",
    question: "Where are you right now?",
    options: LIFE_STAGES.map(([value, label]) => ({ value, label })),
  },
  {
    key: "risk",
    question: "If your investment dropped 20% in a month, what would you do?",
    options: [
      { value: "Conservative", label: "Sell — I cannot watch that" },
      { value: "Moderate", label: "Hold and wait it out" },
      { value: "Aggressive", label: "Buy more while it is cheap" },
    ],
  },
  {
    key: "horizonYears",
    question: "When will you need this money?",
    options: [
      { value: 2, label: "Within 2 years" },
      { value: 4, label: "3 – 4 years" },
      { value: 7, label: "5 – 7 years" },
      { value: 12, label: "10 years or more" },
    ],
  },
  {
    key: "monthlyAmount",
    question: "How much can you invest each month?",
    options: [
      { value: 5000, label: "₹5,000" },
      { value: 10000, label: "₹10,000" },
      { value: 25000, label: "₹25,000" },
      { value: 50000, label: "₹50,000+" },
    ],
  },
];

/** "moderate", "MODERATE", " Moderate " → "Moderate"; anything else → null. */
export const canonicalRisk = (label) =>
  RISK_PROFILES.find((p) => p.toLowerCase() === String(label || "").trim().toLowerCase()) || null;

/**
 * Audit #56 — the profile answers given with the risk questionnaire, as the Advisor's
 * starting point. They never touch the risk score; they only save asking twice.
 *
 * Age → life stage (retired by occupation wins over age). Null when the answer is missing,
 * so the chat asks instead of guessing.
 */
export function lifeStageFromProfile(ctx) {
  if (!ctx) return null;
  if (ctx.employment_type === "retired") return "retired";
  const age = Number(ctx.age);
  if (!Number.isFinite(age) || age <= 0) return null;
  if (age < 35) return "young";
  if (age < 50) return "mid";
  if (age < 60) return "pre_retirement";
  return "retired";
}

// Values are CHAT_STEPS' own horizon options, so the chat can label a prefilled answer.
const GOAL_HORIZON = { emergency: 2, purchase: 4, education: 7, wealth: 12 };

/** Goal → horizon. Retirement counts the years left to 60; "other" asks. */
export function horizonFromProfile(ctx) {
  if (!ctx) return null;
  if (ctx.primary_goal === "retirement") {
    const left = 60 - Number(ctx.age);
    if (!Number.isFinite(left)) return null;
    return left >= 10 ? 12 : left >= 5 ? 7 : left >= 3 ? 4 : 2;
  }
  return GOAL_HORIZON[ctx.primary_goal] ?? null;
}

/**
 * Audit #72 — what the investor's own behaviour and votes change about the next plan.
 *
 * Deterministic: the same orders and the same votes always give the same plan, and every
 * change comes with the line that explains it ("Adjusted because: …"). It only ever moves
 * SAFER on its own, and one notch at most. Repeated "too safe" is answered by pointing at
 * "Make it bolder", never by raising the investor's risk for them.
 *
 * @param insights        behaviourInsights(orders)
 * @param recentFeedback  GET /advice → recent_feedback, newest first: [{feedback, reason}]
 */
export function adjustmentsFor({ insights = [], recentFeedback = [] } = {}) {
  const has = (tag) => insights.find((i) => i.tag === tag);
  const downs = recentFeedback.filter((f) => f?.feedback === "down");
  const tooRisky = downs.filter((f) => f.reason === "too_risky").length;
  const tooSafe = downs.filter((f) => f.reason === "too_safe").length;

  const lines = [];
  let tilt = 0;

  const redeems = has("Redeems often");
  if (redeems) {
    tilt = -1;
    lines.push(
      `${redeems.basis} — this plan starts one notch safer (10 points less equity) and is set out as a monthly SIP, so money goes in on a schedule instead of in and out.`
    );
  }

  if (tooRisky >= 2 && tooRisky > tooSafe) {
    tilt = -1;
    lines.push(`you called ${tooRisky} of your recent plans "too risky" — this one starts one notch safer.`);
  }

  const lumps = has("Invests in lumps");
  if (lumps) {
    lines.push(`${lumps.basis} — run this plan as a monthly SIP so the timing decision is made once, not every time.`);
  }

  const preferBolder = tooSafe >= 2 && tooSafe > tooRisky;
  if (preferBolder) {
    lines.push(`you called ${tooSafe} of your recent plans "too safe" — "Make it bolder" is one click below; it is not applied for you.`);
  }

  return { tilt, lines, suggestSip: Boolean(redeems || lumps), preferBolder };
}

/**
 * Which sleeve of the plan a fund belongs to, from its category and name. Order matters:
 * a "Gold ETF FoF" is gold not equity, "Liquid" is the cash sleeve, equity-savings and
 * arbitrage funds behave like debt, and a balanced-advantage or multi-asset fund is
 * genuinely mixed — null, left out of the comparison rather than forced into one sleeve.
 */
const SLEEVE_RULES = [
  ["gold", /\bgold\b|\bsilver\b|precious metal/],
  ["cash", /\bliquid\b|overnight|money market/],
  [null, /balanced advantage|dynamic asset|multi asset|balanced hybrid/],
  ["equity", /aggressive hybrid/],
  ["debt", /conservative hybrid|arbitrage|equity savings|debt|bond|gilt|duration|credit risk|floater|banking (?:&|and) psu|fixed maturity|\bsdl\b|g-?sec|target maturity|income/],
  ["equity", /equity|\bcap\b|elss|index|nifty|sensex|sector|thematic|focused|value|contra|dividend yield/],
];

export function sleeveOf(text = "") {
  const hay = String(text || "").toLowerCase();
  const rule = SLEEVE_RULES.find(([, re]) => re.test(hay));
  return rule ? rule[0] : null;
}

export const SLEEVE_KEYS = ["equity", "debt", "gold", "cash"];

/**
 * Audit #57 / #58 — the investor's ACTUAL split by sleeve, from the holdings the MF dashboard
 * shows (getClientPortfolio merged with the Laravel mirror). A holding is valued the way the
 * dashboard values it: today's value, or its cost when no NAV could price it. Null when
 * nothing could be classified — "no holdings" is not a 0/0/0/0 portfolio.
 */
export function actualAllocation(holdings = []) {
  const sums = { equity: 0, debt: 0, gold: 0, cash: 0 };
  let unclassified = 0;

  for (const h of holdings) {
    const value = Number(h.current_value) || Number(h.inv_amo) || 0;
    if (value <= 0) continue;
    const sleeve = sleeveOf(`${h.scheme_category || h.category || ""} ${h.scheme_name || ""}`);
    if (sleeve) sums[sleeve] += value;
    else unclassified += value;
  }

  const total = SLEEVE_KEYS.reduce((a, k) => a + sums[k], 0);
  if (total <= 0) return null;

  const pct = roundToHundred(SLEEVE_KEYS.map((k) => (sums[k] / total) * 100));
  return { alloc: Object.fromEntries(SLEEVE_KEYS.map((k, i) => [k, pct[i]])), total, unclassified };
}

/** Plan vs actual per sleeve, with the gap in points (actual − plan). */
export function allocationGap(actual, plan) {
  return SLEEVE_KEYS.map((key) => {
    const p = Number(plan?.[key]) || 0;
    const a = Number(actual?.[key]) || 0;
    return { key, plan: p, actual: a, gap: a - p };
  });
}

/** Audit #57 — the sleeves that have drifted more than `points` from the plan. */
export const driftedSleeves = (gaps, points = 10) => gaps.filter((g) => Math.abs(g.gap) > points);

/**
 * Audit #57 — the checkout's own suitability rules, so the Advisor never suggests a fund the
 * order path would refuse.
 *
 * Two gates stand between "Invest" and BSE, and a suggestion has to pass both:
 *  1. the browser's isFundSuitable (MutualFundInvestPage → validateInvestorReady), called
 *     here exactly as checkout calls it — including its habit of throwing on a fund with no
 *     SEBI risk level, which at checkout means the order cannot go through;
 *  2. Node's checkSuitability (Backend/src/mf/suitability.js), the authority — replicated
 *     rule for rule below, with the ceilings from GET /risk-policy (admin-configurable,
 *     ticket 23). test/advisor.test.mjs runs this copy against the Node module itself.
 */
export const DEFAULT_RISK_POLICY = Object.freeze({ conservative: 3, moderate: 4, aggressive: 6 });

const RISK_LEVELS = ["Low", "Low to Moderate", "Moderate", "Moderately High", "High", "Very High"];

/** Backend/src/mf/kuvera.js normaliseRisk — the same spellings, the same answers. */
function normaliseRisk(raw) {
  const s = String(raw || "").replace(/\brisk\b/gi, "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!s) return null;
  if (s === "low to moderate" || s === "low to moderately high") return "Low to Moderate";
  if (s === "moderately high") return "Moderately High";
  if (s === "very high") return "Very High";
  if (s === "low") return "Low";
  if (s === "moderate") return "Moderate";
  if (s === "high") return "High";
  return null;
}

/** Backend/src/mf/suitability.js investorProfileOf, for a bare label. */
function profileKey(label) {
  const raw = String(label || "").toLowerCase();
  if (!raw) return null;
  if (/conserv|low|cautious/.test(raw)) return "conservative";
  if (/aggress|high|growth/.test(raw)) return "aggressive";
  if (/moderate|balanced|medium/.test(raw)) return "moderate";
  return null;
}

/** Node's checkSuitability, for one catalogue row: {ok} or {ok: false, reason}. */
export function serverSuitability(profileLabel, scheme = {}, policy = DEFAULT_RISK_POLICY) {
  const profile = profileKey(profileLabel);
  if (!profile) return { ok: false, reason: "Complete your risk profile first — checkout refuses every fund without one." };

  const ceiling = (policy || DEFAULT_RISK_POLICY)[profile] ?? DEFAULT_RISK_POLICY[profile];
  const category = `${scheme.category || ""} ${scheme.subType || ""} ${scheme.scheme_category || ""}`;

  if (/debt|liquid|overnight|money\s*market|gilt/i.test(category)) return { ok: true };
  if (/small\s*cap|sector|thematic/i.test(category) && profile !== "aggressive") {
    return { ok: false, reason: "These are concentrated funds — only an aggressive risk profile may buy them." };
  }
  if (/mid\s*cap|elss/i.test(category) && profile === "conservative") {
    return { ok: false, reason: "Mid cap and ELSS funds are above a conservative risk profile." };
  }

  const level = normaliseRisk(scheme.risk);
  const rank = level ? RISK_LEVELS.indexOf(level) + 1 : null;
  if (rank && rank > ceiling) {
    return { ok: false, reason: `Rated ${level} risk — your ${profile} profile may buy up to ${RISK_LEVELS[ceiling - 1]}.` };
  }
  return { ok: true };
}

/** Both checkout gates, plus the BSE flags that would make the order fail outright. */
export function checkoutAllows(profileLabel, scheme = {}, policy = DEFAULT_RISK_POLICY) {
  // MutualFundInvestPage blocks a physical-only scheme on a demat-registered UCC.
  if (scheme.holding_modes?.demat === false) return { ok: false, reason: "Held physically only — not on a demat account." };
  // null = BSE did not say, which is not a "no" (the catalogue filters' own rule).
  if (scheme.txn?.lumpsum === false || scheme.sip_allowed === false) {
    return { ok: false, reason: "BSE does not accept purchases or SIPs in these." };
  }

  const server = serverSuitability(profileLabel, scheme, policy);
  if (!server.ok) return server;

  let browserOk;
  try {
    browserOk = isFundSuitable(profileLabel, scheme.risk, scheme.category || scheme.subType);
  } catch {
    return { ok: false, reason: "No SEBI risk level is published for these funds, so checkout cannot confirm they suit you." };
  }
  return browserOk ? { ok: true } : { ok: false, reason: "Checkout's own risk check refuses these for your profile." };
}

// A phrase that also matches a different SEBI category: "mid cap" inside "Large & Mid Cap",
// "short duration" inside "Ultra Short Duration". (The catalogue's search matches words, not
// phrases, so "large cap" also returns every Large & Mid Cap fund.)
const NOT_THIS_CATEGORY = { "large cap": /large\s*&\s*mid/, "mid cap": /large\s*&\s*mid/, "short duration": /ultra\s+short/ };

/** Is this catalogue row really a fund of that sleeve category, in its Growth option? */
export function inCategory(f, category = "") {
  const phrase = category.toLowerCase();
  const hay = `${f.subType || ""} ${f.category || ""} ${f.name || ""}`.toLowerCase();
  return hay.includes(phrase) && !NOT_THIS_CATEGORY[phrase]?.test(hay) && !/^idcw/i.test(String(f.payout || ""));
}

/**
 * Audit #57 — the funds to suggest for one sleeve category: catalogue rows really in that
 * category, one per fund (an IDCW or bonus twin is the same fund), that checkout would accept
 * for this investor, best 3-year return first (an unknown return sinks, as in the catalogue).
 *
 * @returns {{picks: object[], refused: number, reason: string|null}}
 */
export function rankFunds(rows = [], { category = "", profile, policy = DEFAULT_RISK_POLICY, take = 3 } = {}) {
  const seen = new Set();
  const candidates = rows.filter((f) => {
    const name = String(f.name || "").trim().toLowerCase();
    if (!inCategory(f, category) || seen.has(name)) return false;
    seen.add(name);
    return true;
  });

  const verdicts = candidates.map((f) => ({ f, v: checkoutAllows(profile, f, policy) }));
  const ret3 = (f) => (Number.isFinite(f?.returns?.["3Y"]) ? f.returns["3Y"] : -Infinity);
  const picks = verdicts
    .filter((x) => x.v.ok)
    .map((x) => x.f)
    .sort((a, b) => ret3(b) - ret3(a))
    .slice(0, take);

  const refused = verdicts.filter((x) => !x.v.ok);
  return { picks, refused: refused.length, reason: refused[0]?.v.reason || null };
}
