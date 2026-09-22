import test from "node:test";
import assert from "node:assert/strict";
import { allocationFor, sleevesFor, rationaleFor, behaviourInsights } from "../src/utils/advisor.js";

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
