// Client 2026-10-09 — LIVE / MARKET CLOSED badge on the stock page.
import test from "node:test";
import assert from "node:assert/strict";
import { marketStatus } from "../src/utils/marketStatus.js";

// 2026-10-08 is a Thursday. IST = UTC + 5:30.
const at = (iso) => Date.parse(iso);
const sec = (iso) => at(iso) / 1000;

test("in session with a fresh trade: LIVE, at the trade's own IST time", () => {
  const s = marketStatus(sec("2026-10-08T08:59:00Z"), at("2026-10-08T09:00:00Z")); // 14:29 / 14:30 IST
  assert.deepEqual(s, { live: true, label: "LIVE • As of 14:29 IST" });
});

test("after 15:30 IST: closed, quoting the session's date", () => {
  const s = marketStatus(sec("2026-10-08T10:00:00Z"), at("2026-10-08T12:00:00Z")); // 17:30 IST
  assert.deepEqual(s, { live: false, label: "MARKET CLOSED • Close Price as of 08-Oct-2026 15:30 IST" });
});

test("a weekday holiday reads as closed: the quote has not moved since the last session", () => {
  // Clock says 11:00 IST on a weekday, but the last trade was the previous day.
  const s = marketStatus(sec("2026-10-07T10:00:00Z"), at("2026-10-08T05:30:00Z"));
  assert.equal(s.live, false);
  assert.match(s.label, /07-Oct-2026/);
});

test("weekend is closed whatever the timestamp", () => {
  const s = marketStatus(sec("2026-10-10T05:00:00Z"), at("2026-10-10T05:01:00Z")); // Saturday
  assert.equal(s.live, false);
});

test("no timestamp, no badge", () => {
  assert.equal(marketStatus(null), null);
});
