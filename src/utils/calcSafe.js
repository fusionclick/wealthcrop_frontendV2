/**
 * QA 10.3 — "Enter 0 and a very large number → no NaN, no Infinity, no crash."
 *
 * The calculators each carried their own inline arithmetic, so the same three failures were
 * spread across them:
 *
 *   1. A loop bounded directly by a typed field. PpfCalculator ran `for (i = 1; i <= years)`
 *      on an unbounded <input type="number">, so "999999999" froze the tab — that is the
 *      crash QA hit. Output guards cannot save you here: the clamp has to be on the input.
 *   2. Division by a rate the investor is allowed to set to 0, which is Infinity rather than
 *      the answer. 0% growth has a real limit and should produce it.
 *   3. Non-finite results rendered straight out, so the screen showed "₹Infinity" or "₹NaN".
 *
 * Kept as plain functions with no imports so they are directly unit-testable.
 */

/**
 * Nothing there: null, undefined, or a field the investor has not typed into. Absent — which
 * is not the same thing as 0. Audit #69 — exported so a page can hold back its answer until
 * every field is filled, instead of computing one from a cleared field read as 0.
 */
export const blank = (v) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");

/**
 * A real, finite number, or `fallback`.
 *
 * Blank counts as absent, not as zero: `Number("")` is 0 and passes a finiteness test, so a
 * field the investor has not filled in would otherwise arrive as a confident 0 — and 0 is a
 * legitimate rate, which makes it indistinguishable from a real answer.
 */
export const num = (v, fallback = 0) => {
  if (blank(v)) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Bound a typed number to something a calculator can actually compute.
 *
 * Used for anything that drives a loop or an exponent. 100 years is past any real product
 * and still returns instantly; without a ceiling the tab dies before the guard downstream
 * ever runs.
 */
export const clampNum = (v, min, max, fallback = min) => {
  const n = num(v, NaN);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/**
 * The ordinary-annuity factor ((1+r)^n − 1) / r, with the r = 0 limit returned instead of
 * Infinity.
 *
 * At zero growth n deposits are worth exactly n — that is the mathematical limit, not an
 * error, so a 0% rate gets the right answer rather than a dash. Mirrors the rate <= 0 branch
 * the Goal model already uses for requiredMonthly.
 */
export const annuityFactor = (rate, periods) => {
  const r = num(rate);
  const n = num(periods);
  if (n <= 0) return 0;
  if (r <= 0) return n;
  const factor = ((1 + r) ** n - 1) / r;
  return Number.isFinite(factor) ? factor : 0;
};

/**
 * What to show for a result that is not a real number.
 *
 * Returns null rather than 0: "₹0" is a claim about the investor's money and 0 is a
 * plausible-looking lie, whereas a dash says plainly that the inputs do not produce an
 * answer. Callers render `finiteOr(x) ?? "—"`.
 */
export const finiteOr = (v, fallback = null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * The one place a calculator number becomes text.
 *
 * `finiteOr` already existed, but only five of the twenty-two calculators imported it; the
 * rest wrote `Number(x).toLocaleString()` straight into the JSX. `Number(NaN)
 * .toLocaleString()` is the string "NaN" and `Number(Infinity).toLocaleString()` is "∞", so
 * a division by a rate the investor is allowed to set to 0 printed "₹∞" on screen. That is
 * exactly what QA 10.3 asks about.
 *
 * A dash, not "₹0", for the same reason `finiteOr` returns null: zero is a claim about
 * someone's money and a plausible-looking lie, while a dash says plainly that the inputs do
 * not produce an answer.
 */
export const inr = (v, { maximumFractionDigits = 2, fallback = "—" } = {}) => {
  // Absent is not zero — the same rule `num` applies. Number(null) and Number("") are both
  // 0 and both pass a finiteness test, so a value that was never computed would print as a
  // confident ₹0, which is exactly the lie this helper exists to prevent.
  if (blank(v)) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("en-IN", { maximumFractionDigits }) : fallback;
};

/**
 * QA 5.1 — the largest figure any calculator field takes: ₹9,99,99,99,99,999, twelve digits.
 * Past any real salary, corpus or loan, and it stops a 20-digit entry from being typed at all
 * rather than tidying it up afterwards.
 */
export const MAX_CALC_INPUT = 999999999999;

/**
 * Refuses the keystroke that would cross that ceiling. Wired once, as `onChangeCapture` around
 * every calculator route (App.jsx), instead of into every input of all 21 calculators. Stopping the
 * change before the field's own onChange sees it leaves the controlled value as it was, so the
 * extra digit simply never appears. Sliders are left alone — they carry their own max.
 */
export const capCalcInput = (e) => {
  if (e.target.type === "number" && Math.abs(Number(e.target.value)) > MAX_CALC_INPUT) {
    e.stopPropagation();
  }
};
