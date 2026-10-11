// Client 2026-10-09 — the NFO page's Open / Upcoming / Recently Closed tabs.
import test from "node:test";
import assert from "node:assert/strict";
import { daysToClose, groupNfos, nfoStatus } from "../src/utils/nfo.js";

const NOW = Date.parse("2026-10-09T06:00:00Z"); // 11:30 IST, 9 Oct 2026

test("an NFO is open from its open date through its close date, inclusive", () => {
  assert.equal(nfoStatus({ open_date: "2026-10-01", close_date: "2026-10-09" }, NOW), "open");
  assert.equal(nfoStatus({ open_date: "2026-10-09", close_date: "2026-10-15" }, NOW), "open");
  assert.equal(nfoStatus({ open_date: "2026-10-12", close_date: "2026-10-20" }, NOW), "upcoming");
  assert.equal(nfoStatus({ open_date: "2026-09-01", close_date: "2026-10-08" }, NOW), "closed");
  assert.equal(nfoStatus({ open_date: "2026-06-01", close_date: "2026-07-01" }, NOW), null, "older than 60 days is history");
  assert.equal(nfoStatus({ open_date: "", close_date: "2026-10-20" }, NOW), null);
});

test("days to close counts IST calendar days", () => {
  assert.equal(daysToClose({ close_date: "2026-10-12" }, NOW), 3);
  assert.equal(daysToClose({ close_date: "2026-10-09" }, NOW), 0);
});

test("open NFOs closing soonest come first", () => {
  const g = groupNfos(
    [
      { id: 1, open_date: "2026-10-01", close_date: "2026-10-15" },
      { id: 2, open_date: "2026-10-05", close_date: "2026-10-12" },
      { id: 3, open_date: "2026-11-01", close_date: "2026-11-15" },
    ],
    NOW
  );
  assert.deepEqual(g.open.map((n) => n.id), [2, 1]);
  assert.deepEqual(g.upcoming.map((n) => n.id), [3]);
});
