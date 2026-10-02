import { SETTLED, classifyFlow, parseFlowDate } from "./xirr.js";

/**
 * SRS §11 — Statements of Account, Profit and Loss, and Capital Gain reports with tax-lot
 * accounting (FIFO, LIFO, specific identification).
 *
 * A redemption is not a gain: it is a sale of particular units bought on particular days,
 * and which units you sold decides both the gain and whether it is short or long term.
 * That matching is the whole report, and it is the part nothing in this app did.
 *
 * Reuses `classifyFlow` and `SETTLED` from xirr.js so the tax report and the return
 * calculation count exactly the same orders.
 */

/**
 * Audit #64 — Indian capital-gains rules for mutual-fund units, as data, keyed by the date
 * of SALE (a report for FY 2023-24 must use the rules that applied then). Checked
 * 2026-10-02 against:
 *   - Finance (No. 2) Act 2024, transfers on/after 23 Jul 2024: equity-oriented funds are
 *     long-term after 12 months — STCG (s.111A) 20%, LTCG (s.112A) 12.5% on gains above
 *     ₹1.25 lakh a year; other non-equity funds are long-term after 24 months, LTCG 12.5%
 *     without indexation, short-term gains at the investor's slab.
 *   - Before 23 Jul 2024: STCG 15%, LTCG 10% above ₹1 lakh; non-equity long-term after
 *     36 months at 20% with indexation (indexation is not applied in this estimate).
 *   - s.50AA (Finance Act 2023): units of a specified (debt-oriented) mutual fund bought on
 *     or after 1 Apr 2023 are short-term whatever the holding period, taxed at slab. Finance
 *     Act 2025 defines specified as investing more than 65% in debt / money-market.
 * When a Budget changes these, ADD a row with its start date. Editing an old row would
 * quietly change every past year's report.
 */
export const TAX_RULES = [
  {
    from: "2024-07-23",
    equity: { longAfterMonths: 12, stcg: 0.2, ltcg: 0.125, exemption: 125000 },
    other: { longAfterMonths: 24, ltcg: 0.125 },
  },
  {
    from: "0000-01-01",
    equity: { longAfterMonths: 12, stcg: 0.15, ltcg: 0.1, exemption: 100000 },
    other: { longAfterMonths: 36, ltcg: 0.2, indexed: true },
  },
];
export const SPECIFIED_MF_FROM = "2023-04-01";
export const CESS = 0.04; // Health & Education cess on the tax

export const ruleOn = (date) => TAX_RULES.find((r) => isoDay(date) >= r.from);

// Equity-oriented hybrids (≥65% equity, arbitrage included) are taxed as equity; the rest of
// the hybrid family is not — "hybrid" alone used to read as equity, which was wrong for
// conservative hybrids (debt-oriented) and is unknowable for balanced-advantage funds.
const HYBRID_EQUITY = /aggressive\s*hybrid|arbitrage|equity\s*savings/i;
const NON_EQUITY_OTHER = /gold|silver|commodit|international|global|overseas|fund\s*of\s*funds|\bfof\b|multi\s*asset|balanced\s*advantage|dynamic\s*asset|balanced\s*hybrid/i;
const DEBT_ORIENTED = /liquid|overnight|money\s*market|ultra\s*short|low\s*duration|short\s*duration|medium\s*duration|medium\s*to\s*long|long\s*duration|dynamic\s*bond|corporate\s*bond|credit\s*risk|banking\s*(?:and|&)\s*psu|gilt|floater|conservative\s*hybrid|target\s*maturity|\bdebt\b|\bbonds?\b|\bincome\b/i;
const EQUITY_CATEGORY = /equity|elss|tax\s*saver|index|flexi|large|mid|small|multi\s*cap|value|focus|dividend\s*yield|contra|sector|thematic/i;
// A generic "Index Funds" category covers bond and gilt index funds too; the name decides.
const DEBT_INDEX_NAME = /gilt|sdl|g-?sec|bond|psu|crisil\s*ibx|debt|target\s*maturity/i;

/**
 * Which rules a scheme's gains follow: "equity" (equity-oriented), "debt" (debt-oriented —
 * a specified fund for units bought from 1 Apr 2023) or "other" (gold, international,
 * multi-asset, balanced advantage, anything unrecognised).
 *
 * An unknown category is "other": its 24-month clock never prints "long term" next to an
 * equity gain that is not, and it never claims the slab treatment on our word either. Every
 * row carries `asset_class` so the screen can say which rules it used.
 */
export const assetClassOf = (category = "", name = "") => {
  const text = String(category || "").trim() ? String(category) : String(name || "");
  if (/index\s*fund/i.test(text) && DEBT_INDEX_NAME.test(String(name || ""))) return "debt";
  if (HYBRID_EQUITY.test(text)) return "equity";
  if (NON_EQUITY_OTHER.test(text)) return "other";
  if (DEBT_ORIENTED.test(text)) return "debt";
  if (EQUITY_CATEGORY.test(text)) return "equity";
  return "other";
};

/** `months` calendar months after `d`, clamped to the month's last day (29 Feb + 12 = 28 Feb). */
const addMonths = (d, months) => {
  const x = new Date(d.getFullYear(), d.getMonth() + months, 1);
  x.setDate(Math.min(d.getDate(), new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()));
  return x;
};

/**
 * Short or long, and which rules decided it. The law says "held for more than N months", so
 * this counts calendar months, not 365-day years: a year to the day is still short-term.
 */
export function termOf(assetClass, buyDate, sellDate) {
  if (assetClass === "debt" && isoDay(buyDate) >= SPECIFIED_MF_FROM) {
    return { term: "short", tax_basis: "specified" };
  }
  const basis = assetClass === "equity" ? "equity" : "other";
  const rule = ruleOn(sellDate)[basis];
  return { term: sellDate > addMonths(buyDate, rule.longAfterMonths) ? "long" : "short", tax_basis: basis };
}

const daysBetween = (from, to) => Math.round((to - from) / 86400000);

/** Units a row moved. BSE sometimes sends only the amount, so fall back to amount ÷ NAV. */
const unitsOf = (o) => {
  const units = Number(o.units) || 0;
  if (units > 0) return units;
  const nav = Number(o.nav) || 0;
  const amount = Math.abs(Number(o.amount) || 0);
  return nav > 0 && amount > 0 ? amount / nav : 0;
};

const key = (o) => String(o.scheme_bse_code || o.scheme_name || "unknown").trim().toUpperCase();

/**
 * Settled, dated, classified orders, oldest first — the only ordering in which lots can be
 * matched at all.
 */
export const usableOrders = (orders = []) =>
  orders
    .map((o) => ({ ...o, _date: parseFlowDate(o.date), _sign: classifyFlow(o), _units: unitsOf(o) }))
    .filter((o) => o._date && o._sign !== 0 && o._units > 0 && SETTLED.test(String(o.status || "")))
    .sort((a, b) => a._date - b._date);

/**
 * Match every redemption against the purchases it sold.
 *
 * @param {Array} orders   /orderHistory rows
 * @param {object} opts
 *   method: "fifo" | "lifo" | "specific"
 *   categories: { [scheme_bse_code]: category } — decides the long-term threshold
 *   picks: { [sellOrderId]: [lotId, ...] } — specific identification, in the order to consume
 * @returns {{ realised: Array, openLots: Array, unmatched: Array }}
 */
export function matchLots(orders = [], { method = "fifo", categories = {}, picks = {} } = {}) {
  const rows = usableOrders(orders);
  // Lots are built up front, with ids that do not depend on what has been consumed — the
  // specific-identification UI names a lot by id, and an id that shifted as earlier sales
  // ate lots would point at a different purchase every time the method changed.
  const open = purchaseLots(rows);
  const realised = [];
  const unmatched = [];

  for (const o of rows) {
    if (o._sign < 0) continue; // purchases are already lots

    const k = key(o);
    const lots = (open.get(k) || []).filter((l) => l.date <= o._date);

    // A redemption. Consume lots in the order the chosen method says.
    let left = o._units;
    const sellNav = Number(o.nav) || (o._units ? Math.abs(Number(o.amount) || 0) / o._units : 0);
    const klass = assetClassOf(categories[o.scheme_bse_code] || categories[k] || "", o.scheme_name);
    const chosen = orderLots(lots, method, picks[String(o.id)] || []);

    for (const lot of chosen) {
      if (left <= 1e-9) break;
      const take = Math.min(lot.units, left);
      const cost = take * lot.nav;
      const proceeds = take * sellNav;
      const held = daysBetween(lot.date, o._date);
      const { term, tax_basis } = termOf(klass, lot.date, o._date);

      realised.push({
        scheme_name: o.scheme_name || lot.scheme_name,
        scheme_bse_code: o.scheme_bse_code || lot.scheme_bse_code,
        folio: o.folio || lot.folio,
        buy_date: lot.date,
        sell_date: o._date,
        units: take,
        buy_nav: lot.nav,
        sell_nav: sellNav,
        cost,
        proceeds,
        gain: proceeds - cost,
        days_held: held,
        term,
        tax_basis,
        asset_class: klass,
        lot_id: lot.id,
        sell_order_id: o.id ?? null,
      });

      lot.units -= take;
      left -= take;
    }

    // Units sold that no purchase in the window accounts for — an account that moved in
    // from another platform, or a history that starts mid-stream. Reported, never guessed.
    if (left > 1e-6) {
      unmatched.push({
        scheme_name: o.scheme_name,
        scheme_bse_code: o.scheme_bse_code,
        sell_date: o._date,
        units: left,
        reason: "No purchase on record for these units",
      });
    }
  }

  const openLots = [...open.values()].flat().filter((l) => l.units > 1e-9);

  return { realised, openLots, unmatched };
}

/**
 * Every purchase as a lot, keyed by scheme, in date order — what a sale can be matched
 * against, and what the specific-identification picker lists.
 *
 * Ids are `<scheme>-<yyyy-mm-dd>-<n>`: stable across methods and across re-runs, so a lot
 * the investor named stays the lot they named.
 *
 * @returns {Map<string, Array>} fresh mutable copies; matchLots consumes them
 */
export function purchaseLots(orders = []) {
  // Accepts raw /orderHistory rows or ones usableOrders() has already processed.
  const rows = orders.length && orders[0]?._date ? orders : usableOrders(orders);
  const out = new Map();
  const seq = {};

  for (const o of rows) {
    if (o._sign >= 0) continue;
    const k = key(o);
    if (!out.has(k)) out.set(k, []);
    seq[k] = (seq[k] || 0) + 1;

    out.get(k).push({
      id: `${k}-${isoDay(o._date)}-${seq[k]}`,
      date: o._date,
      units: o._units,
      nav: Number(o.nav) || (o._units ? Math.abs(Number(o.amount) || 0) / o._units : 0),
      scheme_name: o.scheme_name,
      scheme_bse_code: o.scheme_bse_code,
      folio: o.folio,
    });
  }

  return out;
}

/** Lot consumption order for the chosen method. */
function orderLots(lots, method, pickedIds) {
  if (method === "lifo") return [...lots].sort((a, b) => b.date - a.date);

  if (method === "specific" && pickedIds.length) {
    const byId = new Map(lots.map((l) => [l.id, l]));
    const picked = pickedIds.map((id) => byId.get(id)).filter(Boolean);
    // Anything the investor did not name still has to be available, or a sale bigger than
    // the named lots would silently report fewer units than were actually sold.
    const rest = [...lots].filter((l) => !pickedIds.includes(l.id)).sort((a, b) => a.date - b.date);
    return [...picked, ...rest];
  }

  return [...lots].sort((a, b) => a.date - b.date); // fifo
}

/** SRS §11 — the capital-gain summary: what is taxable, split the way ITR asks for it. */
export function gainsSummary(realised = []) {
  const bucket = { short_gain: 0, short_loss: 0, long_gain: 0, long_loss: 0 };

  for (const r of realised) {
    const side = r.term === "long" ? "long" : "short";
    if (r.gain >= 0) bucket[`${side}_gain`] += r.gain;
    else bucket[`${side}_loss`] += Math.abs(r.gain);
  }

  return {
    ...bucket,
    short_net: bucket.short_gain - bucket.short_loss,
    long_net: bucket.long_gain - bucket.long_loss,
    net: bucket.short_gain - bucket.short_loss + bucket.long_gain - bucket.long_loss,
    proceeds: realised.reduce((a, r) => a + r.proceeds, 0),
    cost: realised.reduce((a, r) => a + r.cost, 0),
  };
}

/** Net `a` against `b` when they have opposite signs. */
const offset = (a, b) => {
  if (a < 0 && b > 0) {
    const t = Math.min(-a, b);
    return [a + t, b - t];
  }
  if (b < 0 && a > 0) {
    const t = Math.min(-b, a);
    return [a - t, b + t];
  }
  return [a, b];
};

/** Gain-weighted rate, for a year that straddles a rate change (FY 2024-25 does). */
const blendedRate = (pairs, fallback) => {
  const pos = pairs.filter(([gain]) => gain > 0);
  const total = pos.reduce((a, [gain]) => a + gain, 0);
  return total > 0 ? pos.reduce((a, [gain, rate]) => a + gain * rate, 0) / total : fallback;
};

/**
 * Audit #64 — an ESTIMATE of the tax on one financial year's realised gains (pass that year's
 * rows only). Not a tax computation: surcharge, the s.87A rebate, losses carried forward
 * from earlier years and gains made outside this account are all left out, and indexation
 * (pre-23-Jul-2024 non-equity sales) is not applied.
 *
 * Set-off follows s.70/s.74: a long-term loss only against long-term gains; a short-term loss
 * against short-term gains first, then long-term. Slab-rate gains (specified funds, and other
 * short-term gains) are an amount added to income; their tax is estimated only when the
 * investor gives a slab rate.
 */
export function taxEstimate(realised = [], { slabRate = null } = {}) {
  let eqST = 0;
  let eqLT = 0;
  let othLT = 0;
  let slab = 0;
  const pairs = { eqST: [], eqLT: [], othLT: [] };
  let latest = null;

  for (const r of realised) {
    const rule = ruleOn(r.sell_date);
    if (!latest || r.sell_date > latest) latest = r.sell_date;
    if (r.tax_basis === "equity" && r.term === "long") {
      eqLT += r.gain;
      pairs.eqLT.push([r.gain, rule.equity.ltcg]);
    } else if (r.tax_basis === "equity") {
      eqST += r.gain;
      pairs.eqST.push([r.gain, rule.equity.stcg]);
    } else if (r.tax_basis === "other" && r.term === "long") {
      othLT += r.gain;
      pairs.othLT.push([r.gain, rule.other.ltcg]);
    } else {
      slab += r.gain;
    }
  }

  const rule = latest ? ruleOn(latest) : TAX_RULES[0];
  [eqLT, othLT] = offset(eqLT, othLT);
  [slab, eqST] = offset(slab, eqST);
  let stLoss = -Math.min(0, slab) - Math.min(0, eqST);
  slab = Math.max(0, slab);
  eqST = Math.max(0, eqST);
  const absorb = (gain) => {
    const used = Math.min(stLoss, Math.max(0, gain));
    stLoss -= used;
    return gain - used;
  };
  othLT = absorb(othLT);
  eqLT = absorb(eqLT);
  const carriedForward = stLoss - Math.min(0, eqLT) - Math.min(0, othLT);
  eqLT = Math.max(0, eqLT);
  othLT = Math.max(0, othLT);

  const exempt = Math.min(eqLT, rule.equity.exemption);
  const tax = {
    equity_stcg: eqST * blendedRate(pairs.eqST, rule.equity.stcg),
    equity_ltcg: (eqLT - exempt) * blendedRate(pairs.eqLT, rule.equity.ltcg),
    other_ltcg: othLT * blendedRate(pairs.othLT, rule.other.ltcg),
    slab: slabRate == null ? null : slab * slabRate,
  };
  const base = tax.equity_stcg + tax.equity_ltcg + tax.other_ltcg + (tax.slab || 0);

  return {
    gains: { equity_stcg: eqST, equity_ltcg: eqLT, equity_ltcg_exempt: exempt, other_ltcg: othLT, slab },
    rates: {
      equity_stcg: blendedRate(pairs.eqST, rule.equity.stcg),
      equity_ltcg: blendedRate(pairs.eqLT, rule.equity.ltcg),
      other_ltcg: blendedRate(pairs.othLT, rule.other.ltcg),
      exemption: rule.equity.exemption,
    },
    tax,
    cess: base * CESS,
    total: base * (1 + CESS),
    slabPending: slabRate == null && slab > 0,
    carriedForward,
  };
}

/**
 * Audit #64 — IDCW entries for the statement: each dividend the AMC declared on a scheme,
 * at the units the statement shows on the record date. Computed (declared rate × units held),
 * not read from the registrar, and shown as such. They do not move the unit balance: a
 * reinvestment's new units arrive as their own transaction.
 *
 * @param statement statementRows() output
 * @param dividendsByScheme { [scheme_bse_code or name, upper-cased]: [{ record_date, amount_per_unit, kind }] }
 */
export function dividendRows(statement = [], dividendsByScheme = {}) {
  const out = [];
  const byScheme = new Map();
  for (const r of statement) {
    const k = key(r);
    if (!byScheme.has(k)) byScheme.set(k, []);
    byScheme.get(k).push(r);
  }

  for (const [k, rows] of byScheme) {
    for (const d of dividendsByScheme[k] || []) {
      const date = parseFlowDate(d.record_date);
      const rate = Number(d.amount_per_unit) || 0;
      if (!date || rate <= 0) continue;
      const held = [...rows].reverse().find((r) => r.date <= date)?.balance_units || 0;
      if (held <= 1e-9) continue;
      out.push({
        date,
        scheme_name: rows[0].scheme_name,
        scheme_bse_code: rows[0].scheme_bse_code,
        folio: rows[0].folio,
        description: `IDCW ${d.kind === "reinvest" ? "reinvested" : "paid"} · ₹${rate}/unit`,
        amount: held * rate,
        units: 0,
        nav: Number(d.nav_on_record_date) || 0,
        balance_units: held,
        status: "DECLARED",
        dividend: true,
      });
    }
  }
  return out.sort((a, b) => a.date - b.date);
}

/** Gains still on paper: open lots valued at today's NAV. */
export function unrealisedFromLots(openLots = [], navByScheme = {}) {
  return openLots
    .map((l) => {
      const nav = Number(navByScheme[l.scheme_bse_code] ?? navByScheme[String(l.scheme_bse_code)] ?? 0) || l.nav;
      const value = l.units * nav;
      const cost = l.units * l.nav;
      return {
        scheme_name: l.scheme_name,
        scheme_bse_code: l.scheme_bse_code,
        folio: l.folio,
        buy_date: l.date,
        units: l.units,
        buy_nav: l.nav,
        current_nav: nav,
        cost,
        value,
        gain: value - cost,
        days_held: daysBetween(l.date, new Date()),
      };
    })
    .sort((a, b) => b.value - a.value);
}

/**
 * SRS §11 — Statement of Account: every settled transaction, oldest first, with the running
 * unit balance per scheme that makes a statement a statement rather than a list.
 */
export function statementRows(orders = []) {
  const balances = {};

  return usableOrders(orders).map((o) => {
    const k = key(o);
    const delta = o._sign < 0 ? o._units : -o._units;
    balances[k] = (balances[k] || 0) + delta;

    return {
      date: o._date,
      scheme_name: o.scheme_name,
      scheme_bse_code: o.scheme_bse_code,
      folio: o.folio,
      description: o._sign < 0 ? "Purchase" : "Redemption",
      amount: Math.abs(Number(o.amount) || 0) * (o._sign < 0 ? 1 : -1),
      units: delta,
      nav: Number(o.nav) || 0,
      balance_units: balances[k],
      status: o.status,
    };
  });
}

/** yyyy-mm-dd from the LOCAL parts. `toISOString()` would print the day before for every
 *  user east of UTC — a trade on the 1st filed as the previous month. */
export const isoDay = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** CSV for the download button. Excel opens it; no dependency needed to produce it. */
export function toCsv(rows = [], columns = []) {
  const cols = columns.length ? columns : Object.keys(rows[0] || {}).map((k) => ({ key: k, label: k }));
  const cell = (v) => {
    if (v instanceof Date) return isoDay(v);
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  return [cols.map((c) => cell(c.label)).join(","), ...rows.map((r) => cols.map((c) => cell(r[c.key])).join(","))].join("\n");
}
