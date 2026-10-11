// Client 2026-10-09 — multiple named watchlists.
import test from "node:test";
import assert from "node:assert/strict";
import { addToWatchlist, createWatchlist, deleteWatchlist, loadWatchlists, removeFromWatchlist } from "../src/utils/watchlists.js";

const memory = (seed = {}) => {
  const m = new Map(Object.entries(seed));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
};

test("ownerless old watchlists stay in storage without leaking into an account", () => {
  const legacy = JSON.stringify(["TCS", "INFY"]);
  const lists = JSON.stringify([{ id: "old", name: "Private", symbols: ["TCS"] }]);
  const store = memory({ wealthcrop_watchlist: legacy, wealthcrop_watchlists: lists, currentAccount: JSON.stringify({ userId: 1 }) });
  assert.deepEqual(loadWatchlists(store), [{ id: "default", name: "My Watchlist", symbols: [] }]);
  assert.equal(store.getItem("wealthcrop_watchlist"), legacy);
  assert.equal(store.getItem("wealthcrop_watchlists"), lists);
});

test("logout, another login, and switching back isolate lists and preserve each owner's symbols", () => {
  const store = memory({ currentAccount: JSON.stringify({ userId: 1 }) });
  const { created } = createWatchlist("Private", store);
  addToWatchlist(created.id, "RELIANCE", store);
  store.setItem("currentAccount", "null");
  assert.equal(loadWatchlists(store).some((l) => l.name === "Private"), false);
  store.setItem("currentAccount", JSON.stringify({ userId: 16 }));
  assert.equal(loadWatchlists(store).some((l) => l.name === "Private"), false);
  createWatchlist("Second", store);
  store.setItem("currentAccount", JSON.stringify({ userId: 1 }));
  assert.deepEqual(loadWatchlists(store).find((l) => l.name === "Private").symbols, ["RELIANCE"]);
  assert.equal(loadWatchlists(store).some((l) => l.name === "Second"), false);
});

test("lists are created by unique name and hold each symbol once", () => {
  const store = memory();
  const { created } = createWatchlist("Banks", store);
  assert.equal(createWatchlist("banks", store).created, null, "names are unique, case aside");
  addToWatchlist(created.id, "hdfcbank", store);
  addToWatchlist(created.id, "HDFCBANK", store);
  assert.deepEqual(loadWatchlists(store).find((l) => l.id === created.id).symbols, ["HDFCBANK"]);
  removeFromWatchlist(created.id, "HDFCBANK", store);
  assert.deepEqual(loadWatchlists(store).find((l) => l.id === created.id).symbols, []);
  deleteWatchlist(created.id, store);
  assert.equal(loadWatchlists(store).some((l) => l.id === created.id), false);
});

test("a store that throws does not break the page", () => {
  const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
  assert.deepEqual(loadWatchlists(broken)[0].symbols, []);
});
