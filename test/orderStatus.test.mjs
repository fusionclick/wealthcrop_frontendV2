// QA 3.4 — "Order appears in /user/order with a status" came back as "nothing gets updated".
// Two separate causes: the BSE-backed page never re-read, and the Laravel-backed page shows
// a `status` column that is written 'pending' at placement and only ever touched again by
// the payment callback. There is no BSE→DB sync job, so the stored status is overlaid with
// BSE's own rather than kept in sync as a second copy.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { orderIsFinal, withLiveOrderStatus } from "../src/utils/nodeApi.js";

test("orderIsFinal only calls an order done when BSE cannot change it again", () => {
  for (const s of ["ALLOTTED", "allotted", "REJECTED", "CANCELLED", "FAILED", "Order Rejected"]) {
    assert.equal(orderIsFinal(s), true, `${s} is terminal`);
  }
  // Anything still in flight must stay pollable.
  for (const s of ["PENDING", "AWAITING PAYMENT", "IN PROCESS", "PAYMENT INITIATED"]) {
    assert.equal(orderIsFinal(s), false, `${s} can still change`);
  }
  // Unknown/blank is the one most worth asking about again — never treat it as settled,
  // or a status we failed to read freezes on screen forever.
  for (const s of ["", null, undefined, "something new from BSE"]) {
    assert.equal(orderIsFinal(s), false, `${JSON.stringify(s)} must not be treated as final`);
  }
});

test("withLiveOrderStatus overlays BSE's status on the stored row, matched on the BSE id", () => {
  const stored = [
    { bse_order_id: 111, scheme_name: "A", status: "pending" },
    { bse_order_id: 222, scheme_name: "B", status: "pending" },
    { bse_order_id: 333, scheme_name: "C", status: "pending" },
  ];
  const live = [
    { id: 111, status: "ALLOTTED" },
    { id: "222", status: "REJECTED", remarks: "Insufficient funds" },
  ];

  const out = withLiveOrderStatus(stored, live);

  assert.equal(out[0].status, "ALLOTTED");
  // String vs number ids must still match — BSE sends the id as a string on some endpoints
  // and a number on others, and a strict compare would silently overlay nothing.
  assert.equal(out[1].status, "REJECTED");
  assert.equal(out[1].remarks, "Insufficient funds", "the rejection reason must come through");
  // No live row: the stored status stands rather than blanking out.
  assert.equal(out[2].status, "pending");

  // BSE unreachable must leave every row exactly as stored, not wipe the column.
  assert.deepEqual(withLiveOrderStatus(stored, []), stored);
  assert.deepEqual(withLiveOrderStatus(stored, [{ status: "ALLOTTED" }]), stored, "a live row with no id is ignored");
  // The input is never mutated — the stored list is react state on the calling page.
  assert.equal(stored[0].status, "pending");
});

test("both order surfaces actually use the live status", () => {
  const ordersMf = readFileSync("src/pages/mutual_fund/OrdersMF.jsx", "utf8");
  // Polls only while something can still change, so a settled list stops asking BSE.
  assert.match(ordersMf, /refetchInterval: \(query\) => \{/);
  assert.match(ordersMf, /some\(\(o\) => !orderIsFinal\(o\.status\)\) \? 60_000 : false/);
  // And a manual refresh for the investor who wants an answer now.
  assert.match(ordersMf, /onClick=\{\(\) => refetch\(\)\}[\s\S]{0,200}?disabled=\{isFetching\}/);

  const stored = readFileSync("src/pages/profile/order/MutualFundOrder.jsx", "utf8");
  assert.match(stored, /withLiveOrderStatus\(funds, liveOrders\)/);
  // Shares the order-history cache with OrdersMF instead of paying for a second fetch.
  assert.match(stored, /queryKey: \["mfOrderHistory", ucc\]/);
  // The table must render the overlaid rows, not the raw stored ones.
  assert.match(stored, /\{rows\.map\(\(fund, idx\) => \(/);
  assert.doesNotMatch(stored, /\{funds\.map\(/, "rendering the stored rows re-introduces the stale status");
});
