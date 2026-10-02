/**
 * Goals — the arithmetic the Goals page does itself. Projections, the stored plan and the
 * planned curve all come from the server (Goal.php), because alerts:run emails from the same
 * numbers; these only combine what the server sent with what the browser alone can see.
 */

const PRIORITY_ORDER = ["high", "medium", "low"];

/**
 * Audit #59 — one monthly budget, split across the goals: high priority first, then medium,
 * then low, each goal asking for the SIP the server says lands it on target
 * (`required_monthly`). Inside a priority that the budget cannot fully cover, the money is
 * shared in proportion to need, so no goal at that level is starved for another.
 *
 * Achieved and archived goals ask for nothing. Money left over is reported, not spread
 * around: putting more into a goal than it needs is a choice for the investor, not a default.
 */
export function splitBudget(goals = [], budget = 0) {
  const total = Math.max(0, Number(budget) || 0);
  const need = (g) => Math.max(0, Number(g.required_monthly) || 0);
  const open = goals.filter((g) => g.status !== "achieved" && g.status !== "archived");

  let left = total;
  const rows = [];
  for (const priority of PRIORITY_ORDER) {
    const group = open.filter((g) => (PRIORITY_ORDER.includes(g.priority) ? g.priority : "medium") === priority);
    const groupNeed = group.reduce((a, g) => a + need(g), 0);
    const share = Math.min(left, groupNeed);
    for (const g of group) {
      const suggested = groupNeed > 0 ? Math.round((share * need(g)) / groupNeed) : 0;
      rows.push({ id: g.id, name: g.name, priority, need: Math.round(need(g)), suggested, short: Math.round(need(g)) - suggested });
    }
    left -= share;
  }

  const totalNeed = Math.round(open.reduce((a, g) => a + need(g), 0));
  return {
    rows,
    totalNeed,
    shortfall: Math.max(0, totalNeed - Math.round(total)),
    spare: Math.max(0, Math.round(left)),
  };
}

const sameScheme = (a, b) =>
  String(a || "").trim().toUpperCase() !== "" && String(a || "").trim().toUpperCase() === String(b || "").trim().toUpperCase();

/** Does this link point at this holding? A SIP link names a scheme only, so every folio of it counts. */
export const linkMatches = (link, holding) =>
  sameScheme(link?.scheme_bse_code, holding?.scheme_bse_code) &&
  (!link.folio || String(holding.folio || "").trim() === String(link.folio).trim());

/**
 * Do two links reach the same money? Then one of them must go: a holding linked to two goals
 * would be counted in both, and each goal would look further along than the money allows.
 */
export const linksOverlap = (a, b) =>
  sameScheme(a?.scheme_bse_code, b?.scheme_bse_code) &&
  (!a.folio || !b.folio || String(a.folio).trim() === String(b.folio).trim());

/**
 * Audit #60 — the value of the holdings linked to a goal: today's value where a NAV priced
 * it, its cost where none did (the MF dashboard's rule), and what it all cost — so the goal
 * can show its own return. `atCost` says when part of the value is only the cost.
 */
export function linkedValue(links = [], holdings = []) {
  const matched = holdings.filter((h) => links.some((l) => linkMatches(l, h)));
  const value = matched.reduce((a, h) => a + (Number(h.current_value) || Number(h.inv_amo) || 0), 0);
  const invested = matched.reduce((a, h) => a + (Number(h.inv_amo) || 0), 0);

  return {
    value: Math.round(value * 100) / 100,
    invested: Math.round(invested * 100) / 100,
    count: matched.length,
    atCost: matched.some((h) => !(Number(h.current_value) > 0)),
  };
}

/**
 * Audit #60 — the planned curve (server) and the recorded values (server history) on one
 * monthly axis for the chart. A month with several recorded values shows the last one.
 */
export function planVsActual(planCurve = [], history = []) {
  const byMonth = new Map();
  for (const p of planCurve) byMonth.set(p.d.slice(0, 7), { month: p.d.slice(0, 7), planned: p.v });
  for (const h of history) {
    const month = h.d.slice(0, 7);
    byMonth.set(month, { ...(byMonth.get(month) || { month }), actual: h.v });
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}
