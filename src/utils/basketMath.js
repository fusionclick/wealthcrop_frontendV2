// Client 2026-10-09 — DIY basket rules: 2 to 5 schemes, weights that add up to exactly 100%,
// and the smallest basket amount every fund can take its share of.
//
// The client's spec said "the highest minimum among the underlying funds". That is not
// enough: each fund receives total × weight, so a ₹5,000-minimum fund at 20% needs a
// ₹25,000 basket, not ₹5,000. The minimum is therefore the largest min ÷ weight.

export const MIN_SCHEMES = 2;
export const MAX_SCHEMES = 5;

const r2 = (n) => Math.round(n * 100) / 100;

/** Sum of weights, to the paisa-level precision the server accepts (±0.01). */
export const weightTotal = (legs = []) => r2(legs.reduce((s, l) => s + (Number(l.weight) || 0), 0));

/** null when the basket is valid, otherwise the reason. */
export function basketProblem(legs = []) {
  if (legs.length < MIN_SCHEMES) return `Pick at least ${MIN_SCHEMES} schemes.`;
  if (legs.length > MAX_SCHEMES) return `A basket holds at most ${MAX_SCHEMES} schemes.`;
  if (legs.some((l) => !(Number(l.weight) > 0))) return "Give every scheme a weight above 0%.";
  const total = weightTotal(legs);
  if (Math.abs(total - 100) > 0.01) return `Weights add up to ${total}% — they must total exactly 100%.`;
  return null;
}

/**
 * Smallest whole-rupee basket amount at which every leg meets its own minimum:
 * max over legs of ceil(min / (weight / 100)). 0 when no leg has a known minimum.
 */
export function basketMinimum(legs = []) {
  let need = 0;
  for (const l of legs) {
    const min = Number(l.min) || 0;
    const w = Number(l.weight) || 0;
    if (min > 0 && w > 0) need = Math.max(need, Math.ceil(r2((min * 100) / w)));
  }
  return need;
}
