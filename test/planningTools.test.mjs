import test from "node:test";
import assert from "node:assert/strict";
import { emergencyFund, epf, sipForGoal } from "../src/utils/calculators.js";

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
