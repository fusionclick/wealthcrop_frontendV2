import test from "node:test";
import assert from "node:assert/strict";
import { educationPlan, emergencyFund, epf, parkingFunds, retirementPlan, sipForGoal } from "../src/utils/calculators.js";

// SRS pages 13-14 — the three planning tools the spec names that were missing.
// Each test is the spec's own input/output list, not a restatement of the code.

// ── EPF (SRS p.14) ────────────────────────────────────────────────────────────────────
// Inputs: monthly basic, employee %, employer %, years.
// Outputs: total employee, total employer, interest on both, combined final.

test("EPF: returns all four outputs the spec asks for", () => {
  const r = epf({ basic: 50000, employeePct: 12, employerPct: 12, years: 10, rate: 8.25 });
  for (const k of ["employee", "employer", "interest", "total"]) {
    assert.ok(Number.isFinite(r[k]), `${k} missing`);
  }
  // 12% of 50,000 = 6,000/month = 72,000/year = 7.2L over 10 years, each side.
  assert.equal(r.employee, 720000);
  assert.equal(r.employer, 720000);
  assert.equal(r.total, r.employee + r.employer + r.interest, "the parts must sum to the whole");
  assert.ok(r.interest > 0, "ten years at 8.25% must earn interest");
});

test("EPF: no interest rate means no interest, and the total is just what was paid in", () => {
  const r = epf({ basic: 10000, employeePct: 12, employerPct: 12, years: 5, rate: 0 });
  assert.equal(r.interest, 0);
  assert.equal(r.total, r.employee + r.employer);
});

test("EPF: contributions scale with salary, and interest compounds beyond simple", () => {
  const a = epf({ basic: 20000, employeePct: 12, employerPct: 12, years: 10 });
  const b = epf({ basic: 40000, employeePct: 12, employerPct: 12, years: 10 });
  assert.equal(b.employee, a.employee * 2, "double the salary, double the contribution");
  // Yearly compounding must beat simple interest on the same contributions.
  const simple = (a.employee + a.employer) * 0.0825 * 10;
  assert.ok(a.interest < simple, "interest accrues on a balance that builds up, not on the full sum from day one");
});

// ── Emergency fund (SRS p.13) ─────────────────────────────────────────────────────────
// Inputs: monthly expenses, months to cover, current savings, expected return.
// Outputs: total required, monthly saving if short, investment options.

test("emergency fund: required = expenses x months", () => {
  const r = emergencyFund({ expenses: 40000, months: 6, current: 0 });
  assert.equal(r.required, 240000);
  assert.equal(r.shortfall, 240000);
});

test("emergency fund: existing savings reduce the gap", () => {
  const r = emergencyFund({ expenses: 40000, months: 6, current: 100000, buildMonths: 12 });
  assert.equal(r.shortfall, 140000);
  assert.equal(r.monthlySaving, Math.round(140000 / 12));
  assert.equal(r.funded, false);
});

test("emergency fund: already funded asks for nothing more", () => {
  const r = emergencyFund({ expenses: 30000, months: 6, current: 250000 });
  assert.equal(r.shortfall, 0);
  assert.equal(r.monthlySaving, 0);
  assert.equal(r.funded, true, "a funded emergency fund must not keep demanding contributions");
});

test("emergency fund: the return only values the built fund, it never shrinks the target", () => {
  const withReturn = emergencyFund({ expenses: 40000, months: 6, current: 0, rate: 7 });
  const without = emergencyFund({ expenses: 40000, months: 6, current: 0, rate: 0 });
  assert.equal(withReturn.required, without.required, "a fund you may need next month must not be discounted");
  assert.equal(withReturn.annualIncomeIfInvested, Math.round(240000 * 0.07));
});

// ── Goal-based investment (SRS p.14) ──────────────────────────────────────────────────
// Inputs: goal amount, time, expected return, CURRENT SAVINGS toward the goal.
// Outputs: monthly saving required, future value of current savings.

test("goal-based: current savings lower the SIP the goal needs", () => {
  const none = sipForGoal({ goal: 1000000, years: 10, cagr: 10, current: 0 });
  const some = sipForGoal({ goal: 1000000, years: 10, cagr: 10, current: 200000 });
  assert.ok(some.monthlySIP < none.monthlySIP, "money already saved must count toward the goal");
  assert.ok(some.currentFutureValue > 200000, "and it must keep compounding until the goal date");
});

test("goal-based: savings that already cover the goal need no SIP at all", () => {
  const r = sipForGoal({ goal: 100000, years: 10, cagr: 10, current: 500000 });
  assert.equal(r.monthlySIP, 0, "never ask for a negative or a pointless contribution");
});

test("goal-based: omitting current savings is unchanged from before", () => {
  // Guards the existing callers (home page planner, SIP calculator) against this change.
  const withoutArg = sipForGoal({ goal: 1000000, years: 10, cagr: 9, inflation: 0 });
  const explicitZero = sipForGoal({ goal: 1000000, years: 10, cagr: 9, inflation: 0, current: 0 });
  assert.equal(withoutArg.monthlySIP, explicitZero.monthlySIP);
});

// ── Emergency fund, Audit #68 ─────────────────────────────────────────────────────────
// "Expected return" was an input that moved nothing but a side line.

test("emergency fund: the expected return changes the monthly figure, never the target", () => {
  const flat = emergencyFund({ expenses: 40000, months: 6, current: 100000, rate: 0, buildMonths: 12 });
  const parked = emergencyFund({ expenses: 40000, months: 6, current: 100000, rate: 7, buildMonths: 12 });
  assert.equal(parked.required, flat.required, "the target is never discounted by the return");
  assert.equal(parked.shortfall, flat.shortfall);
  assert.ok(parked.monthlySaving < flat.monthlySaving, "deposits that earn 7% can be smaller");
  // What is saved grows for the 12 months, the 12 deposits earn the same rate, and together
  // they land on the 2.4L target.
  const i = 0.07 / 12;
  const expected = (240000 - 100000 * (1 + i) ** 12) / (((1 + i) ** 12 - 1) / i);
  assert.equal(parked.monthlySaving, Math.round(expected));
});

test("emergency fund options: one Growth line per fund, nothing the money cannot be parked in", () => {
  const row = (name, payout, scheme_option = payout) => ({ name, payout, scheme_option });
  const picked = parkingFunds([
    row("HDFC Liquid Fund", "IDCW Payout", "Daily IDCW"),
    row("HDFC Liquid Fund", "Growth", "Growth Option"),
    row("HDFC Liquid Fund", "Growth", "Growth Option"), // the other plan of the same fund
    row("Nippon India ETF Nifty 1D Rate Liquid BeES", "Growth"),
    row("UTI Nifty 1D Rate Liquid ETF - Growth", "Growth"),
    row("Franklin India Liquid Fund", "Growth", "Unclaimed Redemption Plan - Growth"),
    row("Nippon India Liquid Fund", "Growth", "Retail Plan - Growth Option"),
    row("ICICI Prudential Liquid Fund -", "Growth"),
    row("ICICI Prudential Liquid Fund", "Growth"),
    row("Axis Liquid Fund", "Growth"),
    row("Kotak Liquid Fund", "Growth"),
  ]);
  assert.deepEqual(picked.map((f) => f.name), ["HDFC Liquid Fund", "ICICI Prudential Liquid Fund -", "Axis Liquid Fund"]);
  // No catalogue (Node down, BSE down) means no suggestions — not a crash.
  assert.deepEqual(parkingFunds(null), []);
  assert.deepEqual(parkingFunds(undefined), []);
});

// ── Retirement, Audit #66 ─────────────────────────────────────────────────────────────
// Inputs: current age, retirement age, monthly expenses, expected return BEFORE retirement,
// expected return AFTER retirement, current savings (+ inflation and life expectancy, which
// used to be a hidden 30 years). Outputs: corpus needed, monthly SIP, future value of current
// savings, projection.

const RETIRE = {
  currentAge: 30, retirementAge: 60, lifeExpectancy: 85, monthlyExpense: 50000,
  inflation: 6, preReturn: 12, postReturn: 7, currentSavings: 500000,
};

test("retirement: returns every output the spec names", () => {
  const r = retirementPlan(RETIRE);
  for (const k of ["corpus", "monthlySIP", "savingsAtRetirement", "expenseAtRetirement"]) {
    assert.ok(Number.isFinite(r[k]) && r[k] > 0, `${k} missing`);
  }
  assert.equal(r.expenseAtRetirement, Math.round(50000 * 1.06 ** 30));
  // Today's savings compound monthly at the pre-retirement return, like every SIP tool here.
  assert.equal(r.savingsAtRetirement, Math.round(500000 * (1 + 0.12 / 12) ** 360));
  assert.equal(r.projection.length, 85 - 30 + 1, "a row for today and one per year to life expectancy");
});

test("retirement: following the SIP lands on the corpus, which lasts exactly to life expectancy", () => {
  const r = retirementPlan(RETIRE);
  const atRetirement = r.projection.find((p) => p.age === 60);
  assert.ok(Math.abs(atRetirement.balance - r.corpus) <= 2, `${atRetirement.balance} vs ${r.corpus}`);
  // (It need not peak on retirement day: at 7% against 6% inflation the corpus out-earns the
  // early withdrawals for a few years before it starts to run down.)
  const retired = r.projection.filter((p) => p.phase === "Retired");
  assert.ok(retired.slice(0, -1).every((p) => p.balance > 0), "the money must not run out early");
  assert.ok(retired.at(-1).balance <= 2, "and is spent by the last year");
  // Every retirement year's withdrawal keeps rising with inflation.
  assert.ok(retired.every((p, i) => i === 0 || p.paidOut > retired[i - 1].paidOut));
});

test("retirement: when the return after retirement only matches inflation, the corpus is years x the first year", () => {
  const r = retirementPlan({ ...RETIRE, inflation: 7, postReturn: 7 });
  const firstYear = 50000 * 1.07 ** 30 * 12;
  assert.ok(Math.abs(r.corpus - firstYear * 25) <= 1);
});

test("retirement: both returns, the life expectancy and the savings all move the answer", () => {
  const base = retirementPlan(RETIRE);
  assert.ok(retirementPlan({ ...RETIRE, postReturn: 9 }).corpus < base.corpus, "better return after retirement, smaller corpus");
  assert.ok(retirementPlan({ ...RETIRE, preReturn: 14 }).monthlySIP < base.monthlySIP, "better return before it, smaller SIP");
  assert.ok(retirementPlan({ ...RETIRE, lifeExpectancy: 95 }).corpus > base.corpus, "longer retirement, bigger corpus");
  assert.ok(base.monthlySIP < retirementPlan({ ...RETIRE, currentSavings: 0 }).monthlySIP, "savings lower the SIP");
  assert.equal(retirementPlan({ ...RETIRE, currentSavings: 1e10 }).monthlySIP, 0, "savings that cover it need no SIP");
});

test("retirement: 0% before retirement splits the gap evenly instead of dividing by zero", () => {
  const r = retirementPlan({ ...RETIRE, preReturn: 0, currentSavings: 0 });
  assert.equal(r.monthlySIP, Math.round(r.corpus / 360));
});

test("retirement: impossible ages give a reason, not numbers", () => {
  assert.match(retirementPlan({ ...RETIRE, retirementAge: 30 }).error, /retirement age/i);
  assert.match(retirementPlan({ ...RETIRE, lifeExpectancy: 60 }).error, /life expectancy/i);
  assert.equal(retirementPlan({ ...RETIRE, retirementAge: 25 }).corpus, undefined);
});

// ── Education, Audit #67 ──────────────────────────────────────────────────────────────
// Inputs: child's age, age the course starts, annual cost today, course length, inflation,
// expected return, current savings. Outputs: total needed, monthly savings, projection.

const EDU = {
  childAge: 5, startAge: 18, annualCost: 500000, courseYears: 4,
  inflation: 10, expectedReturn: 12, currentSavings: 200000,
};

test("education: the total is every year's fee, inflated to the year it is paid", () => {
  const r = educationPlan(EDU);
  const fees = [0, 1, 2, 3].map((k) => 500000 * 1.1 ** (13 + k));
  assert.equal(r.yearsToStart, 13, "years left come from the two ages");
  assert.equal(r.totalNeeded, Math.round(fees.reduce((a, b) => a + b)));
  assert.ok(r.totalNeeded > 4 * r.firstYearFee, "later years cost more than the first");
  assert.equal(r.savingsAtStart, Math.round(200000 * (1 + 0.12 / 12) ** 156));
});

test("education: the SIP closes exactly the gap, and the fees run the balance down to zero", () => {
  const r = educationPlan(EDU);
  const atStart = r.projection.find((p) => p.age === 18);
  assert.ok(Math.abs(atStart.balance - r.totalNeeded) <= 2, `${atStart.balance} vs ${r.totalNeeded}`);
  assert.deepEqual(r.projection.filter((p) => p.phase === "Studying").map((p) => p.age), [19, 20, 21, 22]);
  assert.ok(r.projection.at(-1).balance <= 2);
});

test("education: savings lower the SIP, and savings that cover it need none", () => {
  assert.ok(educationPlan(EDU).monthlySIP < educationPlan({ ...EDU, currentSavings: 0 }).monthlySIP);
  assert.equal(educationPlan({ ...EDU, currentSavings: 1e9 }).monthlySIP, 0);
});

test("education: 0% return splits the gap evenly instead of dividing by zero", () => {
  const r = educationPlan({ ...EDU, expectedReturn: 0, currentSavings: 0 });
  assert.equal(r.monthlySIP, Math.round(r.totalNeeded / 156));
});

test("education: a course that starts now, or lasts no time, gives a reason, not numbers", () => {
  assert.match(educationPlan({ ...EDU, startAge: 5 }).error, /start/i);
  assert.match(educationPlan({ ...EDU, courseYears: 0 }).error, /at least one year/i);
});

test("retirement and education: twelve-digit inputs stay finite and return at once", () => {
  const big = 999999999999;
  const finiteDeep = (v, path) => {
    if (typeof v === "number") return assert.ok(Number.isFinite(v), `${path} is ${v}`);
    if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) finiteDeep(x, `${path}.${k}`);
  };
  const t0 = Date.now();
  const retire = retirementPlan({
    currentAge: 0, retirementAge: 60, lifeExpectancy: big, monthlyExpense: big,
    inflation: big, preReturn: big, postReturn: 0, currentSavings: big,
  });
  const edu = educationPlan({
    childAge: 0, startAge: big, annualCost: big, courseYears: big,
    inflation: big, expectedReturn: big, currentSavings: big,
  });
  assert.ok(Date.now() - t0 < 1000);
  assert.equal(retire.error, undefined);
  assert.equal(edu.error, undefined);
  finiteDeep(retire, "retirement");
  finiteDeep(edu, "education");
});
