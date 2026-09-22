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

// Holding period past which a gain is long-term. Equity-oriented funds (and ELSS, index,
// and hybrid funds with ≥65% equity) turn long at a year; everything else takes three.
const LONG_TERM_DAYS = { equity: 365, other: 1095 };

const EQUITY_CATEGORY = /equity|elss|index|flexi|large|mid|small|multi|value|focus|dividend yield|contra|sector|thematic|hybrid|aggressive/i;

/**
 * Which clock a scheme's gains run on.
 *
 * An unknown category takes the LONGER threshold. Getting this wrong in the other
 * direction would print "long term" next to a gain that is not, and the investor would
 * file a lower rate on our word. Every row carries `asset_class` so the screen can say
 * which clock it used.
 */
export const assetClassOf = (category = "") => (EQUITY_CATEGORY.test(String(category)) ? "equity" : "other");

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
    const klass = assetClassOf(categories[o.scheme_bse_code] || categories[k] || "");
    const chosen = orderLots(lots, method, picks[String(o.id)] || []);

    for (const lot of chosen) {
      if (left <= 1e-9) break;
      const take = Math.min(lot.units, left);
      const cost = take * lot.nav;
      const proceeds = take * sellNav;
      const held = daysBetween(lot.date, o._date);

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
        term: held > LONG_TERM_DAYS[klass] ? "long" : "short",
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
