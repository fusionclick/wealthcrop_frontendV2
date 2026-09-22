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

export const LIFE_STAGES = [
  ["young", "Young professional — earning, few obligations"],
  ["mid", "Mid-career — family, loans, steady income"],
  ["pre_retirement", "Approaching retirement — protecting what I have"],
  ["retired", "Retired — living off the portfolio"],
];

export const RISK_PROFILES = ["Conservative", "Moderate", "Aggressive"];

/** equity / debt / gold / cash, in percent. Rows sum to 100. */
const BASE = {
  Conservative: {
    young:          { equity: 45, debt: 40, gold: 10, cash: 5 },
    mid:            { equity: 35, debt: 50, gold: 10, cash: 5 },
    pre_retirement: { equity: 20, debt: 65, gold: 10, cash: 5 },
    retired:        { equity: 15, debt: 70, gold: 5,  cash: 10 },
  },
  Moderate: {
    young:          { equity: 70, debt: 20, gold: 5,  cash: 5 },
    mid:            { equity: 60, debt: 30, gold: 5,  cash: 5 },
    pre_retirement: { equity: 40, debt: 50, gold: 5,  cash: 5 },
    retired:        { equity: 25, debt: 60, gold: 5,  cash: 10 },
  },
  Aggressive: {
    young:          { equity: 85, debt: 5,  gold: 5,  cash: 5 },
    mid:            { equity: 75, debt: 15, gold: 5,  cash: 5 },
    pre_retirement: { equity: 55, debt: 35, gold: 5,  cash: 5 },
    retired:        { equity: 35, debt: 50, gold: 5,  cash: 10 },
  },
};

/**
 * Move `points` percent out of equity and into debt (positive) or the other way
 * (negative), keeping the four sleeves at exactly 100.
 *
 * The move is capped by the sleeve it comes OUT of, and applied as one rounded number to
 * both sides. Clamping each side on its own is how an 85/5 aggressive portfolio asked to
 * be bolder becomes 95/0 — a 105% plan.
 */
const shiftEquity = (alloc, points) => {
  const move = Math.round(points >= 0 ? Math.min(points, alloc.equity) : -Math.min(-points, alloc.debt));

  return { ...alloc, equity: alloc.equity - move, debt: alloc.debt + move };
};

/**
 * @param {{risk?: string, lifeStage?: string, horizonYears?: number, tilt?: number}} input
 *   tilt: −1 "make it safer", +1 "make it bolder" — the SRS's advice customisation.
 */
export function allocationFor({ risk = "Moderate", lifeStage = "mid", horizonYears = 10, tilt = 0 } = {}) {
  const profile = RISK_PROFILES.includes(risk) ? risk : "Moderate";
  const stage = BASE[profile][lifeStage] ? lifeStage : "mid";

  let alloc = { ...BASE[profile][stage] };

  // Horizon beats temperament. A three-year goal in an 85% equity portfolio is a
  // questionnaire answer, not a plan.
  if (horizonYears <= 2) alloc = shiftEquity(alloc, alloc.equity - 10);
  else if (horizonYears <= 4) alloc = shiftEquity(alloc, alloc.equity * 0.5);
  else if (horizonYears <= 7) alloc = shiftEquity(alloc, alloc.equity * 0.2);

  if (tilt) alloc = shiftEquity(alloc, -tilt * 10);

  return alloc;
}

/**
 * Which fund categories carry each sleeve, and how much money goes to each.
 * Equity is split rather than dumped into one category — concentration is the failure mode
 * an allocation is supposed to prevent.
 */
export function sleevesFor(alloc, monthlyAmount = 0, risk = "Moderate") {
  const equitySplit =
    risk === "Aggressive"
      ? [["Flexi Cap", 0.4], ["Mid Cap", 0.3], ["Small Cap", 0.3]]
      : risk === "Conservative"
      ? [["Large Cap", 0.7], ["Flexi Cap", 0.3]]
      : [["Large Cap", 0.5], ["Flexi Cap", 0.3], ["Mid Cap", 0.2]];

  const rows = [];

  equitySplit.forEach(([category, share]) => {
    const pct = alloc.equity * share;
    if (pct >= 1) rows.push({ sleeve: "Equity", category, pct: Math.round(pct) });
  });

  if (alloc.debt >= 1) {
    rows.push({ sleeve: "Debt", category: alloc.debt >= 40 ? "Short Duration" : "Corporate Bond", pct: alloc.debt });
  }
  if (alloc.gold >= 1) rows.push({ sleeve: "Gold", category: "Gold", pct: alloc.gold });
  if (alloc.cash >= 1) rows.push({ sleeve: "Cash", category: "Liquid", pct: alloc.cash });

  return rows.map((r) => ({ ...r, amount: Math.round((monthlyAmount * r.pct) / 100) }));
}

/** SRS §8 "Rationale and Insights" — why this, in plain sentences. */
export function rationaleFor({ risk, lifeStage, horizonYears, alloc, goalName }) {
  const stageLabel = (LIFE_STAGES.find(([k]) => k === lifeStage) || ["", "your stage"])[1].split(" — ")[0];
  const lines = [
    `You answered as ${risk.toLowerCase()}, and ${stageLabel.toLowerCase()} portfolios are built around ${
      alloc.equity >= 60 ? "growth" : alloc.equity >= 35 ? "a balance of growth and stability" : "capital protection and income"
    }.`,
    `That is why equity is ${alloc.equity}% and debt ${alloc.debt}%.`,
  ];

  if (horizonYears <= 4) {
    lines.push(
      `Your money is needed in about ${horizonYears} year${horizonYears === 1 ? "" : "s"}, so equity is cut back regardless of risk appetite — a market fall that close to the date cannot be waited out.`
    );
  } else if (horizonYears >= 10) {
    lines.push(`With ${horizonYears}+ years to run, short-term falls have time to recover, which is what makes the equity share affordable.`);
  }

  if (alloc.gold > 0) lines.push(`${alloc.gold}% gold is there as a hedge, not as a return engine.`);
  if (alloc.cash > 0) lines.push(`${alloc.cash}% stays liquid so a bad month never forces you to sell a fund at the wrong time.`);
  if (goalName) lines.push(`This plan is set against your goal "${goalName}".`);

  lines.push("Suggestions are generated from your answers and are not a personal recommendation to buy any specific scheme.");

  return lines;
}

/**
 * SRS §16.3 — behavioural insights, from the order history the app already has.
 *
 * Pattern-matching on real behaviour, not a personality claim: every line names what was
 * counted. Anything it cannot see, it does not say.
 *
 * @param {Array<{order_type?: string, trxn_type?: string, created_at?: string, order_date?: string, inv_amo?: number|string}>} orders
 */
export function behaviourInsights(orders = []) {
  if (!Array.isArray(orders) || orders.length === 0) return [];

  const kind = (o) => String(o.order_type || o.trxn_type || "").toLowerCase();
  const buys = orders.filter((o) => /purchase|buy|sip|additional/.test(kind(o)));
  const sells = orders.filter((o) => /redeem|redemption|sell|swp/.test(kind(o)));
  const sips = orders.filter((o) => /sip|xsp|systematic/.test(kind(o)));

  const out = [];

  if (sells.length >= 2 && sells.length >= buys.length) {
    out.push({
      tag: "Redeems often",
      text: `${sells.length} redemptions against ${buys.length} purchases. Frequent exits are the most common reason a portfolio earns less than the funds in it.`,
    });
  }

  if (sips.length > 0) {
    out.push({
      tag: "Invests on a schedule",
      text: `${sips.length} systematic instalment${sips.length === 1 ? "" : "s"} on record — the contribution pattern this plan assumes.`,
    });
  } else if (buys.length >= 3) {
    out.push({
      tag: "Invests in lumps",
      text: `${buys.length} one-off purchases and no SIP. A SIP would remove the timing decision you are making each time.`,
    });
  }

  const amounts = buys.map((o) => Number(o.inv_amo) || 0).filter((n) => n > 0);
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
