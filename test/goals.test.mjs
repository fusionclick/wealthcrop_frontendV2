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
