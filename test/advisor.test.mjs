import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import {
  allocationFor,
  sleevesFor,
  rationaleFor,
  behaviourInsights,
  adjustmentsFor,
  lifeStageFromProfile,
  horizonFromProfile,
  canonicalRisk,
  sleeveOf,
  actualAllocation,
  allocationGap,
  driftedSleeves,
  serverSuitability,
  checkoutAllows,
  rankFunds,
  inCategory,
  CHAT_STEPS,
  DEFAULT_RISK_POLICY,
} from "../src/utils/advisor.js";

const sum = (a) => a.equity + a.debt + a.gold + a.cash;

test("every allocation adds up to 100, whatever the inputs", () => {
  for (const risk of ["Conservative", "Moderate", "Aggressive"]) {
    for (const lifeStage of ["young", "mid", "pre_retirement", "retired"]) {
      for (const horizonYears of [1, 2, 4, 7, 12, 30]) {
        for (const tilt of [-1, 0, 1]) {
          const a = allocationFor({ risk, lifeStage, horizonYears, tilt });
          assert.equal(sum(a), 100, `${risk}/${lifeStage}/${horizonYears}/${tilt} = ${JSON.stringify(a)}`);
          assert.ok(a.equity >= 0 && a.equity <= 100);
        }
      }
    }
  }
});

test("a short horizon cuts equity even for an aggressive investor", () => {
  const long = allocationFor({ risk: "Aggressive", lifeStage: "young", horizonYears: 12 });
  const short = allocationFor({ risk: "Aggressive", lifeStage: "young", horizonYears: 2 });

  assert.equal(long.equity, 85);
  assert.equal(short.equity, 10, "money needed in two years does not belong in equity");
  assert.ok(short.debt > long.debt);
});

test("the glide path lowers equity as the investor gets closer to spending it", () => {
  const stages = ["young", "mid", "pre_retirement", "retired"].map(
    (lifeStage) => allocationFor({ risk: "Moderate", lifeStage, horizonYears: 12 }).equity
  );

  for (let i = 1; i < stages.length; i++) {
    assert.ok(stages[i] < stages[i - 1], `equity must fall: ${stages}`);
  }
});

test("the safer/bolder tilt moves 10 points and never leaves the 0-100 range", () => {
  const base = allocationFor({ risk: "Moderate", lifeStage: "mid", horizonYears: 12 });
  const safer = allocationFor({ risk: "Moderate", lifeStage: "mid", horizonYears: 12, tilt: -1 });
  const bolder = allocationFor({ risk: "Moderate", lifeStage: "mid", horizonYears: 12, tilt: 1 });

  assert.equal(safer.equity, base.equity - 10);
  assert.equal(bolder.equity, base.equity + 10);

  // Already at 85 equity + bolder must not produce 95/-5.
  const capped = allocationFor({ risk: "Aggressive", lifeStage: "young", horizonYears: 12, tilt: 1 });
  assert.equal(sum(capped), 100);
  assert.ok(capped.debt >= 0);
});

test("sleeve amounts add up to the monthly contribution and split equity", () => {
  const alloc = allocationFor({ risk: "Moderate", lifeStage: "mid", horizonYears: 12 });
  const rows = sleevesFor(alloc, 10000, "Moderate");

  const equityRows = rows.filter((r) => r.sleeve === "Equity");
  assert.ok(equityRows.length >= 2, "equity must be spread, not dumped in one category");

  const totalPct = rows.reduce((a, r) => a + r.pct, 0);
  assert.ok(Math.abs(totalPct - 100) <= 2, `sleeves should cover the portfolio, got ${totalPct}`);

  const totalAmount = rows.reduce((a, r) => a + r.amount, 0);
  assert.ok(Math.abs(totalAmount - 10000) <= 200, `amounts should add up, got ${totalAmount}`);
});

test("the rationale explains the horizon cut rather than leaving it unexplained", () => {
  const alloc = allocationFor({ risk: "Aggressive", lifeStage: "young", horizonYears: 2 });
  const lines = rationaleFor({ risk: "Aggressive", lifeStage: "young", horizonYears: 2, alloc }).join(" ");

  assert.match(lines, /cut back/);
  assert.match(lines, /not a personal recommendation/);
});

test("behavioural insights only report what the orders actually show", () => {
  assert.deepEqual(behaviourInsights([]), []);

  const redeemer = behaviourInsights([
    { order_type: "purchase", inv_amo: 5000 },
    { order_type: "redeem" },
    { order_type: "redeem" },
  ]);
  assert.ok(redeemer.some((i) => i.tag === "Redeems often"));

  const sipper = behaviourInsights([{ order_type: "sip" }, { order_type: "sip" }]);
  assert.ok(sipper.some((i) => i.tag === "Invests on a schedule"));
  assert.ok(!sipper.some((i) => i.tag === "Redeems often"));
});

// SRS §8 (QA 8.9) — a saved plan could not be reopened: /advice was POST-only on this
// screen, so GET /advice shipped with no caller and the advice history was unreachable.
test("past plans are listed with their date and reopened inside the advisor", () => {
  const advisor = readFileSync("src/pages/Advisor.jsx", "utf8");

  // The dead read endpoint now has its caller, and it is a GET.
  assert.match(advisor, /getApiWithToken\(api\("\/advice"\)\)/);
  assert.match(advisor, /queryKey: \["adviceHistory"\]/);

  // Each entry carries the date the advice was actually given, and reopens that row.
  assert.match(advisor, /\{planDate\(h\.created_at\)\}/);
  assert.match(advisor, /onClick=\{\(\) => setViewing\(h\)\}/);

  // The reopened plan is labelled as history, not mistaken for today's recommendation,
  // and shows what was saved rather than the live allocation.
  assert.match(advisor, /Past plan · saved \{planDate\(viewing\.created_at\)\}/);
  assert.match(advisor, /This is not live advice/);
  assert.match(advisor, /\(viewing\.sleeves \|\| \[\]\)\.map/);

  // A missing basis says so. Rendering it as 0% would claim the market went nowhere.
  assert.match(advisor, /viewing\.market_change_pct == null/);
  assert.match(advisor, /No comparison available for this plan/);
  assert.match(advisor, /not this plan's own return/);

  // Start over still only clears the live conversation.
  assert.match(advisor, /const restart = \(\) => \{\s*setAnswers\(\{\}\)/);
});

// QA 8.1 — "Save this plan", 👍 and 👎 all called the same savePlan() → POST /advice, so each
// click stored another copy of the plan: three buttons, one behaviour, and a list of duplicates.
test("save keeps the plan once; a vote is feedback on that row, never another saved copy", () => {
  const advisor = readFileSync("src/pages/Advisor.jsx", "utf8");

  // The thumbs no longer go through Save.
  assert.doesNotMatch(advisor, /savePlan\("(up|down)"\)/);
  assert.match(advisor, /onClick=\{\(\) => rate\("up"\)\}/);
  assert.match(advisor, /onClick=\{\(\) => rate\("down"\)\}/);

  // A vote on a plan nobody saved is stored as saved: false, which keeps it out of the list.
  // Once the plan has a row, a vote or a save updates that row instead of posting a copy.
  assert.match(advisor, /\{ \.\.\.plan\(\), saved: false, feedback \}/);
  assert.match(advisor, /\{ \.\.\.plan\(\), saved: true \}/);
  assert.match(advisor, /api\(`\/advice\/\$\{mark\.id\}\/feedback`\)/);
  assert.match(advisor, /api\(`\/advice\/\$\{mark\.id\}\/save`\)/);

  // Saved once: the button cannot store the same plan twice.
  assert.match(advisor, /disabled=\{busy \|\| mark\.saved \|\| !sleeves\.every/);
});

// The rows the Advisor actually receives: /orderHistory normalises BSE and Laravel orders to
// `type` / `amount`. The insights only read the raw `order_type` / `inv_amo`, so every real
// order was skipped and "What your own orders show" never appeared.
test("behaviour insights read the order shape /orderHistory really returns", () => {
  const redeemer = behaviourInsights([
    { type: "Redemption", amount: 5000 },
    { type: "R", amount: 2000 },
    { type: "Purchase", amount: 10000 },
  ]);
  assert.ok(redeemer.some((i) => i.tag === "Redeems often"));

  const lumpy = behaviourInsights([
    { type: "Purchase", amount: 1000 },
    { type: "P", amount: 1000 },
    { type: "Purchase", amount: 1000 },
    { type: "Purchase", amount: 50000 },
  ]);
  assert.ok(lumpy.some((i) => i.tag === "Invests in lumps"));
  assert.ok(lumpy.some((i) => i.tag === "Uneven amounts"));

  assert.ok(behaviourInsights([{ type: "SIP", amount: 500 }]).some((i) => i.tag === "Invests on a schedule"));

  // A rejected order is not behaviour: three purchases, one of them rejected, is two — under
  // the "Invests in lumps" threshold of three.
  const withRejected = behaviourInsights([
    { type: "P", amount: 1000, status: "ALLOTTED" },
    { type: "P", amount: 1000, status: "ALLOTTED" },
    { type: "P", amount: 1000, status: "REJECTED" },
  ]);
  assert.ok(!withRejected.some((i) => i.tag === "Invests in lumps"));
});

// ── Audit #72 — the recommendation responds to behaviour and to votes ─────────────────────

const redeemOrders = [
  { type: "Redemption", amount: 5000 },
  { type: "R", amount: 2000 },
  { type: "R", amount: 1000 },
  { type: "Purchase", amount: 10000 },
];
const lumpOrders = [
  { type: "P", amount: 1000 },
  { type: "P", amount: 2000 },
  { type: "P", amount: 3000 },
];

test("frequent redemptions start the plan one notch safer and suggest a SIP, and say why", () => {
  const adj = adjustmentsFor({ insights: behaviourInsights(redeemOrders) });
  assert.equal(adj.tilt, -1);
  assert.equal(adj.suggestSip, true);
  assert.match(adj.lines[0], /^3 redemptions against 1 purchases — this plan starts one notch safer/);

  // The tilt reaches the allocation: 10 points less equity than the profile's own plan.
  const base = allocationFor({ risk: "Moderate", lifeStage: "mid", horizonYears: 12 });
  const adjusted = allocationFor({ risk: "Moderate", lifeStage: "mid", horizonYears: 12, tilt: adj.tilt });
  assert.equal(adjusted.equity, base.equity - 10);
});

test("lump-sum-only investing suggests a SIP without touching the risk", () => {
  const adj = adjustmentsFor({ insights: behaviourInsights(lumpOrders) });
  assert.equal(adj.tilt, 0);
  assert.equal(adj.suggestSip, true);
  assert.match(adj.lines.join(" "), /3 one-off purchases and no SIP — run this plan as a monthly SIP/);
});

test("two 'too risky' votes start the next plan safer; one does not; 'too safe' is never applied for you", () => {
  const vote = (reason, feedback = "down") => ({ feedback, reason });

  assert.equal(adjustmentsFor({ recentFeedback: [vote("too_risky")] }).tilt, 0, "one vote is not a pattern");

  const twice = adjustmentsFor({ recentFeedback: [vote("too_risky"), vote(null, "up"), vote("too_risky")] });
  assert.equal(twice.tilt, -1);
  assert.match(twice.lines[0], /2 of your recent plans "too risky"/);

  // Bolder is the investor's call: pointed at, not applied.
  const safe = adjustmentsFor({ recentFeedback: [vote("too_safe"), vote("too_safe")] });
  assert.equal(safe.tilt, 0);
  assert.equal(safe.preferBolder, true);
  assert.match(safe.lines[0], /not applied for you/);

  // Redemptions AND votes still move one notch, never two.
  assert.equal(adjustmentsFor({ insights: behaviourInsights(redeemOrders), recentFeedback: [vote("too_risky"), vote("too_risky")] }).tilt, -1);

  // Deterministic: the same inputs, the same answer.
  assert.deepEqual(adjustmentsFor({ recentFeedback: [vote("too_risky"), vote("too_risky")] }), twice);
  assert.deepEqual(adjustmentsFor(), { tilt: 0, lines: [], suggestSip: false, preferBolder: false });
});

// ── Audit #56 — profile context prefills the chat ─────────────────────────────────────────

test("age prefills the life stage and the goal prefills the horizon, with the chat's own values", () => {
  assert.equal(lifeStageFromProfile({ age: 29 }), "young");
  assert.equal(lifeStageFromProfile({ age: 42 }), "mid");
  assert.equal(lifeStageFromProfile({ age: 55 }), "pre_retirement");
  assert.equal(lifeStageFromProfile({ age: 66 }), "retired");
  assert.equal(lifeStageFromProfile({ age: 52, employment_type: "retired" }), "retired");
  assert.equal(lifeStageFromProfile(null), null, "no profile answers: the chat asks");

  const horizons = CHAT_STEPS.find((s) => s.key === "horizonYears").options.map((o) => o.value);
  for (const ctx of [
    { primary_goal: "retirement", age: 30 },
    { primary_goal: "retirement", age: 54 },
    { primary_goal: "retirement", age: 58 },
    { primary_goal: "retirement", age: 59 },
    { primary_goal: "education" },
    { primary_goal: "purchase" },
    { primary_goal: "emergency" },
    { primary_goal: "wealth" },
  ]) {
    assert.ok(horizons.includes(horizonFromProfile(ctx)), `${JSON.stringify(ctx)} → not a chat option`);
  }
  assert.equal(horizonFromProfile({ primary_goal: "retirement", age: 30 }), 12);
  assert.equal(horizonFromProfile({ primary_goal: "emergency" }), 2);
  assert.equal(horizonFromProfile({ primary_goal: "other" }), null);
});

test("a lower-cased saved profile is still the investor's profile", () => {
  assert.equal(canonicalRisk("moderate"), "Moderate");
  assert.equal(canonicalRisk(" AGGRESSIVE "), "Aggressive");
  assert.equal(canonicalRisk("Balanced"), null);
});

// ── Audit #57 / #58 — the investor's real portfolio against the plan ──────────────────────

// The canned QA book (Backend/src/mf/qaFixtures.js) as getClientPortfolio returns it.
const qaHoldings = [
  { scheme_name: "PARAG PARIKH FLEXI CAP FUND - DIRECT PLAN GROWTH", scheme_category: "Equity", inv_amo: 26000, current_value: 33792.85 },
  { scheme_name: "HDFC LIQUID FUND - DIRECT PLAN - GROWTH", scheme_category: "Debt", inv_amo: 18000, current_value: null },
];

test("each holding lands in the sleeve the plan uses for it", () => {
  assert.equal(sleeveOf("Equity Scheme - Large Cap Fund"), "equity");
  assert.equal(sleeveOf("Debt HDFC LIQUID FUND"), "cash", "a liquid fund is the plan's cash sleeve, whatever the broad label");
  assert.equal(sleeveOf("Debt Scheme - Short Duration Fund"), "debt");
  assert.equal(sleeveOf("Other Scheme - FoF Domestic Kotak Gold Fund"), "gold");
  assert.equal(sleeveOf("Hybrid Scheme - Aggressive Hybrid Fund"), "equity");
  assert.equal(sleeveOf("Hybrid Scheme - Arbitrage Fund"), "debt");
  assert.equal(sleeveOf("Hybrid Scheme - Equity Savings"), "debt");
  assert.equal(sleeveOf("Hybrid Scheme - Balanced Advantage"), null, "genuinely mixed: left out, not guessed");
  assert.equal(sleeveOf("Mutual Fund"), null);
});

test("the actual split is valued like the dashboard and compared sleeve by sleeve", () => {
  const actual = actualAllocation(qaHoldings);
  // 33,792.85 at today's NAV + 18,000 at cost (no NAV for that scheme) = 51,792.85.
  assert.equal(Math.round(actual.total), 51793);
  assert.deepEqual(actual.alloc, { equity: 65, debt: 0, gold: 0, cash: 35 });

  const gaps = allocationGap(actual.alloc, { equity: 60, debt: 30, gold: 5, cash: 5 });
  assert.deepEqual(gaps.map((g) => g.gap), [5, -30, -5, 30]);
  assert.deepEqual(driftedSleeves(gaps).map((g) => g.key), ["debt", "cash"], "more than 10 points is drift");

  assert.equal(actualAllocation([]), null, "no holdings is not a 0/0/0/0 portfolio");
  assert.equal(actualAllocation([{ scheme_category: "Hybrid Scheme - Multi Asset Allocation", inv_amo: 5000 }]), null);
});

// ── Audit #57 — suggestions ranked on real data, and only what checkout would accept ──────

test("the Node suitability rules are copied exactly — checked against the Node module itself", () => {
  const require = createRequire(import.meta.url);
  const { checkSuitability } = require("../../Backend/src/mf/suitability.js");

  const categories = [
    "Equity Scheme - Large Cap Fund",
    "Equity Scheme - Small Cap Fund",
    "Equity Scheme - Mid Cap Fund",
    "Equity Scheme - ELSS",
    "Equity Scheme - Sectoral/Thematic",
    "Debt Scheme - Liquid Fund",
    "Debt Scheme - Gilt Fund",
    "Other Scheme - Gold ETF FoF",
  ];
  const risks = [null, "Low", "Low to Moderate", "Moderate", "Moderately High", "High", "Very High", "Very High Risk"];
  const policies = [DEFAULT_RISK_POLICY, { conservative: 2, moderate: 6, aggressive: 6 }];

  for (const profile of ["Conservative", "moderate", "Aggressive", ""]) {
    for (const category of categories) {
      for (const risk of risks) {
        for (const policy of policies) {
          const node = checkSuitability({ riskProfile: { profile } }, { category, risk }, policy);
          const ours = serverSuitability(profile, { category, risk }, policy);
          assert.equal(ours.ok, node.ok, `${profile} / ${category} / ${risk} / ${JSON.stringify(policy)}`);
        }
      }
    }
  }
});

test("checkout's own refusals are refusals here too", () => {
  // Missing scheme risk uses category limits, consistently with the server gate.
  assert.equal(checkoutAllows("Aggressive", { category: "Equity Scheme - Large Cap Fund", risk: null }).ok, true);
  assert.equal(checkoutAllows("Moderate", { category: "Equity Scheme - Large Cap Fund", risk: "Very High" }).ok, false);
  assert.equal(checkoutAllows("Aggressive", { category: "Equity Scheme - Large Cap Fund", risk: "Very High" }).ok, true);
  assert.equal(checkoutAllows("Conservative", { category: "Debt Scheme - Liquid Fund", risk: null }).ok, true);
  assert.equal(checkoutAllows("Moderate", { category: "Equity Scheme - Small Cap Fund" }).ok, false);
  // A physical-only scheme on a demat UCC, and a scheme BSE takes no purchases in.
  assert.equal(checkoutAllows("Aggressive", { category: "Debt", holding_modes: { demat: false, physical: true } }).ok, false);
  assert.equal(checkoutAllows("Aggressive", { category: "Debt", txn: { lumpsum: false } }).ok, false);
  // No risk profile: checkout refuses everything.
  assert.equal(checkoutAllows(null, { category: "Debt Scheme - Liquid Fund" }).ok, false);
});

test("suggestions are the category's best 3-year returns that checkout accepts", () => {
  const fund = (name, ret, extra = {}) => ({
    name,
    subType: "Equity Scheme - Large Cap Fund",
    risk: "Very High",
    returns: { "3Y": ret },
    scheme_isin: name,
    ...extra,
  });
  const rows = [
    fund("A Large Cap Fund", 11),
    fund("B Large & Mid Cap Fund", 30, { subType: "Equity Scheme - Large & Mid Cap Fund" }),
    fund("C Large Cap Fund - IDCW", 25, { payout: "IDCW Payout" }),
    fund("D Large Cap Fund", 18),
    fund("E Large Cap Fund", null),
    fund("F Large Cap Fund", 15),
    fund("G Large Cap Fund", 40, { holding_modes: { demat: false, physical: true } }),
  ];

  const aggressive = rankFunds(rows, { category: "Large Cap", profile: "Aggressive" });
  // Large & Mid Cap is another category, IDCW is a twin, physical-only fails checkout; an
  // unknown 3Y return sinks below every known one.
  assert.deepEqual(aggressive.picks.map((f) => f.name), ["D Large Cap Fund", "F Large Cap Fund", "A Large Cap Fund"]);

  // One fund, one suggestion: a Bonus/second Growth row of the same fund is not a second pick.
  const twins = rankFunds([fund("D Large Cap Fund", 18), fund("D Large Cap Fund", 17, { scheme_isin: "D2" })], {
    category: "Large Cap",
    profile: "Aggressive",
  });
  assert.equal(twins.picks.length, 1);
  // A "Short Term Fund" whose category is Short Duration is in it; Ultra Short Duration is not.
  assert.equal(inCategory({ name: "DSP Short Term Fund", subType: "Debt Scheme - Short Duration Fund" }, "Short Duration"), true);
  assert.equal(inCategory({ name: "X Ultra Short Term", subType: "Debt Scheme - Ultra Short Duration Fund" }, "Short Duration"), false);

  // A moderate investor's ceiling (Moderately High) is below Very High: none can be bought,
  // and the reason says so instead of an empty list.
  const moderate = rankFunds(rows, { category: "Large Cap", profile: "Moderate" });
  assert.deepEqual(moderate.picks, []);
  assert.ok(moderate.refused > 0);
  assert.match(moderate.reason, /Very High risk — your moderate profile may buy up to Moderately High/);

  // Raising the admin ceiling does not help here: checkout's browser check is not configurable
  // and still refuses Very High for a moderate profile — so the Advisor does not suggest it.
  const relaxed = rankFunds(rows, { category: "Large Cap", profile: "Moderate", policy: { conservative: 3, moderate: 6, aggressive: 6 } });
  assert.deepEqual(relaxed.picks, []);
  assert.match(relaxed.reason, /Checkout's own risk check/);

  // The admin's ceiling IS the one used where it decides: a Moderately High fund suits a
  // moderate investor at the default ceiling, and stops suiting them when compliance lowers it.
  const mh = [fund("H Large Cap Fund", 12, { risk: "Moderately High" })];
  assert.equal(rankFunds(mh, { category: "Large Cap", profile: "Moderate" }).picks.length, 1);
  const strict = rankFunds(mh, { category: "Large Cap", profile: "Moderate", policy: { conservative: 3, moderate: 3, aggressive: 6 } });
  assert.deepEqual(strict.picks, []);
  assert.match(strict.reason, /may buy up to Moderate\.$/);
});

// ── Audit #57 / #58 / #72 — the Advisor page wiring ───────────────────────────────────────

test("the advisor page ranks, filters, compares, and lets the investor edit and explain", () => {
  const advisor = readFileSync("src/pages/Advisor.jsx", "utf8");

  // #57 — ranked by 3-year return over the whole category, demat-holdable, then filtered by
  // both checkout gates; "first 3 name matches" is gone.
  assert.match(advisor, /sort: "returns_3y"/);
  assert.match(advisor, /mode: "demat"/);
  assert.doesNotMatch(advisor, /length: 3,/);
  assert.match(advisor, /rankFunds\(q\.data \|\| \[\], \{ category, profile: savedRisk, policy \}\)/);
  assert.match(advisor, /getApi\(api\("\/risk-policy"\)\)/);

  // #57 — review due on a saved plan, with a one-click re-run.
  assert.match(advisor, /h\.review_reason/);
  assert.match(advisor, /onClick=\{\(\) => rerun\(viewing\)\}/);
  // #57 — drift from the newest saved plan, from real holdings.
  assert.match(advisor, /driftedSleeves\(allocationGap\(actual\.alloc, latestSaved\.allocation\)\)/);

  // #58 — the colour bar draws the plan the numbers describe.
  assert.match(advisor, /style=\{\{ width: `\$\{finalAlloc\[k\]\}%` \}\}/);
  assert.doesNotMatch(advisor, /width: `\$\{alloc\[k\]\}%`/);
  // #58 — manual split held to the optimiser's band; portfolio vs plan; 👎 asks why.
  assert.match(advisor, /glideBounds\(alloc\)/);
  assert.match(advisor, /manualSplitErrors\(editing, band\)/);
  assert.match(advisor, /<PortfolioVsPlan actual=\{actual\} plan=\{finalAlloc\} \/>/);
  assert.match(advisor, /\{ feedback: "down", reason \}/);

  // #72 — votes and orders feed the plan, and the page says so.
  assert.match(advisor, /adjustmentsFor\(\{ insights, recentFeedback: adviceData\?\.feedback \|\| \[\] \}\)/);
  assert.match(advisor, /const effectiveTilt = adj\.tilt \+ tilt;/);
  assert.match(advisor, /Adjusted because/);
});
