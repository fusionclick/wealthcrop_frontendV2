// QA 10.3 — "Enter 0 and a very large number → no NaN, no Infinity, no crash." QA reported a
// crash. The crash was PpfCalculator running `for (i = 1; i <= years)` straight off an
// unbounded <input type="number">: "999999999" is a billion iterations and the tab dies.
// The NaN/Infinity half came from dividing by a rate the investor is allowed to set to 0.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { num, clampNum, annuityFactor, finiteOr } from "../src/utils/calcSafe.js";

test("num coerces input strings and refuses anything that is not a real number", () => {
  assert.equal(num("1500"), 1500);
  assert.equal(num("7.1"), 7.1);
  // <input type="number"> hands over "" while the user is mid-edit.
  assert.equal(num(""), 0);
  assert.equal(num("abc"), 0);
  assert.equal(num(null), 0);
  assert.equal(num(undefined), 0);
  assert.equal(num(NaN), 0);
  assert.equal(num(Infinity), 0, "Infinity is not a number we can compute with");
  assert.equal(num(-Infinity), 0);
  assert.equal(num("", 15), 15, "the fallback is used, not silently 0");
});

test("clampNum bounds a typed field so nothing downstream can loop or overflow", () => {
  assert.equal(clampNum(15, 1, 100), 15);
  // The actual reported crash input.
  assert.equal(clampNum("999999999", 1, 100, 1), 100);
  assert.equal(clampNum(1e308, 1, 100, 1), 100);
  assert.equal(clampNum(-5, 1, 100, 1), 1, "a negative term is clamped, not passed through");
  assert.equal(clampNum(0, 1, 100, 1), 1);
  // Junk falls back rather than becoming NaN and poisoning every later multiplication.
  assert.equal(clampNum("", 1, 100, 1), 1);
  assert.equal(clampNum("abc", 1, 100, 7), 7);
  assert.equal(clampNum(Infinity, 0, 100, 0), 0);
});

test("annuityFactor returns the zero-rate limit instead of dividing by zero", () => {
  // 0% growth: n deposits are worth exactly n. This is the limit, not an error — the old
  // code did ((1+0)^n - 1) / 0 and produced Infinity, which rendered as "₹Infinity".
  assert.equal(annuityFactor(0, 120), 120);
  assert.equal(annuityFactor(-0.05, 120), 120, "a negative rate must not produce Infinity either");

  // A real rate still matches the closed form.
  const r = 0.01;
  const n = 12;
  assert.ok(Math.abs(annuityFactor(r, n) - ((1 + r) ** n - 1) / r) < 1e-9);

  // Degenerate terms.
  assert.equal(annuityFactor(0.01, 0), 0);
  assert.equal(annuityFactor(0.01, -5), 0);

  // A huge rate/term overflows to Infinity in the raw formula; the guard returns 0 so the
  // caller shows a dash rather than "₹Infinity".
  assert.equal(annuityFactor(5, 100000), 0);
  assert.ok(Number.isFinite(annuityFactor(0.1, 1200)));
});

test("finiteOr refuses to turn a non-answer into a plausible-looking zero", () => {
  assert.equal(finiteOr(1234.5), 1234.5);
  assert.equal(finiteOr(0), 0, "a real zero is still a real answer");
  // null, not 0 — "₹0" is a claim about the investor's money.
  assert.equal(finiteOr(Infinity), null);
  assert.equal(finiteOr(-Infinity), null);
  assert.equal(finiteOr(NaN), null);
  assert.equal(finiteOr(NaN, 0), 0, "an explicit fallback is still honoured");
});

test("the calculators that could loop or divide by zero now use the guards", () => {
  const ppf = readFileSync("src/pages/calculators/PpfCalculator.jsx", "utf8");
  // The loop is gone entirely — there is nothing left for a large input to iterate.
  assert.doesNotMatch(ppf, /for \(let i = 1; i <= years; i\+\+\)/, "the unbounded loop must not come back");
  assert.match(ppf, /clampNum\(years, 1, MAX_YEARS, 1\)/);
  assert.match(ppf, /annuityFactor\(r, n\)/);
  // 0% is a legitimate rate and must not be rejected as an empty field.
  assert.doesNotMatch(ppf, /!interestRate \|\|/, "0% interest must not be treated as blank");

  for (const f of ["ApyCalculator", "SwpCalculator", "EducationCalculator"]) {
    const src = readFileSync(`src/pages/calculators/${f}.jsx`, "utf8");
    assert.match(src, /annuityFactor\(/, `${f} must use the zero-safe annuity factor`);
    assert.doesNotMatch(src, /- 1\) \/ r\)/, `${f} still divides by a rate that can be 0`);
  }

  const cagr = readFileSync("src/pages/calculators/CagrCalculator.jsx", "utf8");
  // 1/years in the exponent: a fractional term becomes a huge power and overflows.
  assert.match(cagr, /clampNum\(years, 1, 100, 1\)/);
  assert.match(cagr, /if \(start <= 0\) return;/, "dividing by a zero starting value is Infinity");
});
