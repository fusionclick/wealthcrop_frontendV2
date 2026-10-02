import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(p, "utf8");

// SRS §8.2 (QA 9.3) — the goal card had no edit affordance at all, so PUT /goals/{id}
// shipped and sat unused: the only way to change a target was delete and re-create,
// which throws away the milestones already announced for that goal.
test("a goal can be edited, and editing PUTs instead of creating a second goal", () => {
  const goals = read("src/pages/Goals.jsx");

  // The card offers the edit, and it carries the whole goal so the form can prefill.
  assert.match(goals, /onEdit=\{startEdit\}/);
  assert.match(goals, /onClick=\{\(\) => onEdit\(goal\)\}/);

  // The submit path branches on editingId — a PUT to /goals/:id, not a second POST.
  assert.match(goals, /putApiWithToken\(api\(`\/goals\/\$\{editingId\}`\), payload\)/);
  assert.match(goals, /postApiWithToken\(api\("\/goals"\), payload\)/);

  // An edit replaces the row in place; only a create appends. Getting this backwards
  // shows the edited goal twice until the next reload.
  assert.match(goals, /editingId \? prev\.map\(\(g\) => \(g\.id === editingId \? res\.data : g\)\) : \[\.\.\.prev, res\.data\]/);

  // <input type="date"> silently renders blank for "2046-01-01T00:00:00.000000Z", which
  // would make every edit look like it dropped the target date.
  assert.match(goals, /String\(goal\.target_date \|\| ""\)\.slice\(0, 10\)/);

  // Leaving editingId set after a save turns the next "New goal" into an overwrite.
  assert.match(goals, /const closeForm = \(\) => \{[\s\S]*?setEditingId\(null\)/);
});

// The server owns the projection; the browser must not recompute it into a second answer.
test("the goal card still reads its numbers off the server response", () => {
  const goals = read("src/pages/Goals.jsx");
  for (const f of ["progress_pct", "projected_amount", "required_monthly", "advice"]) {
    assert.match(goals, new RegExp(`goal\\.${f}`), `${f} must come from the API`);
  }
});

// ── Audit #59 — one budget, split by priority and need ────────────────────────────────────
test("a monthly budget funds high priority first, shares the shortfall inside a priority, and warns", async () => {
  const { splitBudget } = await import("../src/utils/goals.js");
  const goals = [
    { id: 1, name: "Emergency", priority: "low", required_monthly: 15713 },
    { id: 2, name: "Retirement", priority: "high", required_monthly: 5945 },
    { id: 3, name: "Education", priority: "medium", required_monthly: 3167 },
    { id: 4, name: "Car", priority: "medium", required_monthly: 3000 },
    { id: 5, name: "Done", priority: "high", required_monthly: 9999, status: "achieved" },
  ];

  const short = splitBudget(goals, 20000);
  const by = Object.fromEntries(short.rows.map((r) => [r.name, r]));
  assert.equal(by.Retirement.suggested, 5945, "high priority is covered first");
  assert.equal(by.Education.suggested, 3167);
  assert.equal(by.Car.suggested, 3000);
  assert.equal(by.Emergency.suggested, 20000 - 5945 - 3167 - 3000, "low priority gets what is left");
  assert.equal(short.shortfall, 5945 + 3167 + 3000 + 15713 - 20000);
  assert.ok(!by.Done, "an achieved goal asks for nothing");

  // Not enough for one priority level: shared in proportion to need, not first-come.
  const tight = splitBudget(goals, 5945 + 3083);
  const t = Object.fromEntries(tight.rows.map((r) => [r.name, r]));
  assert.equal(t.Education.suggested, Math.round((3083 * 3167) / 6167));
  assert.equal(t.Car.suggested, Math.round((3083 * 3000) / 6167));
  assert.equal(t.Emergency.suggested, 0);

  const plenty = splitBudget(goals, 40000);
  assert.equal(plenty.shortfall, 0);
  assert.equal(plenty.spare, 40000 - (5945 + 3167 + 3000 + 15713), "money left over is reported, not spread around");
});

// ── Audit #60 — linked holdings, their value and return, and the plan-vs-actual chart ─────
test("a goal is valued from its linked holdings only, never the whole portfolio", async () => {
  const { linkedValue, linksOverlap, planVsActual } = await import("../src/utils/goals.js");
  const holdings = [
    { scheme_bse_code: "PP001ZG-GR", folio: "QA1000001", inv_amo: 26000, current_value: 33792.85 },
    { scheme_bse_code: "HDLFDDN-DR", folio: "QA1000002", inv_amo: 18000, current_value: null },
  ];

  const one = linkedValue([{ scheme_bse_code: "PP001ZG-GR", folio: "QA1000001" }], holdings);
  assert.deepEqual(one, { value: 33792.85, invested: 26000, count: 1, atCost: false });

  // A SIP link names the scheme only; an unpriced holding counts at cost and says so.
  const sip = linkedValue([{ scheme_bse_code: "hdlfddn-dr", kind: "sip" }], holdings);
  assert.deepEqual(sip, { value: 18000, invested: 18000, count: 1, atCost: true });

  // The same money cannot fund two goals.
  assert.equal(linksOverlap({ scheme_bse_code: "PP001ZG-GR", folio: "QA1000001" }, { scheme_bse_code: "PP001ZG-GR" }), true);
  assert.equal(linksOverlap({ scheme_bse_code: "PP001ZG-GR", folio: "A" }, { scheme_bse_code: "PP001ZG-GR", folio: "B" }), false);

  const rows = planVsActual(
    [
      { d: "2026-01-01", v: 100 },
      { d: "2026-02-01", v: 110 },
    ],
    [
      { d: "2026-01-05", v: 90 },
      { d: "2026-01-20", v: 95 },
      { d: "2026-03-02", v: 130 },
    ]
  );
  assert.deepEqual(rows, [
    { month: "2026-01", planned: 100, actual: 95 },
    { month: "2026-02", planned: 110 },
    { month: "2026-03", actual: 130 },
  ]);
});

test("the goal card links funds, charts plan against actual, and the whole-portfolio button is gone", () => {
  const goals = read("src/pages/Goals.jsx");
  // JSX comments may name the old button; what renders may not.
  const rendered = goals.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  // The bug: "Use my portfolio value" overwrote a goal with the WHOLE MF portfolio.
  assert.doesNotMatch(rendered, /Use my portfolio value/);
  assert.doesNotMatch(goals, /onContribute\(goal, portfolioValue, "set"\)/);

  // Links are stored on the goal, and a linked goal is synced to its funds' value.
  assert.match(goals, /putApiWithToken\(\s*api\(`\/goals\/\$\{goal\.id\}`\),\s*links\.length/);
  assert.match(goals, /\{ saved_amount: v\.value, invested_amount: v\.invested \}/);
  // The chart is drawn from the server's stored plan and recorded values.
  assert.match(goals, /planVsActual\(goal\.plan_curve \|\| \[\], goal\.history \|\| \[\]\)/);
  assert.match(goals, /dataKey="planned"/);
  assert.match(goals, /dataKey="actual"/);
  // Budget split (#59) on the page.
  assert.match(goals, /splitBudget\(goals, budget\)/);
});
