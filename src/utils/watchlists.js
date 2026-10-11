// Client 2026-10-09 — "multiple watchlist creation". Several named stock watchlists.
//
// ponytail: kept in this browser's localStorage, like the single list before it — there is
// no watchlist API yet. Lists do not follow the investor to another device; a Laravel
// `watchlists` table with the same shape is the upgrade when that matters.
export const LISTS_KEY = "wealthcrop_watchlists";

const read = (store, key, fallback) => {
  try {
    const v = JSON.parse(store.getItem(key) || "null");
    return v ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (store, key, value) => {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode: the change lasts this session only */
  }
};

const accountKey = (store) => `${LISTS_KEY}:${read(store, "currentAccount", null)?.userId ?? "guest"}`;

// Unscoped legacy lists have no reliable owner. Retain them in storage, never assign them
// to whoever logs in next. Each account (and signed-out browsing) gets its own namespace.
export function loadWatchlists(store = globalThis.localStorage) {
  if (!store) return [];
  const lists = read(store, accountKey(store), null);
  if (Array.isArray(lists)) return lists;
  const seeded = [{ id: "default", name: "My Watchlist", symbols: [] }];
  write(store, accountKey(store), seeded);
  return seeded;
}

const save = (store, lists) => {
  write(store, accountKey(store), lists);
  return lists;
};

export function createWatchlist(name, store = globalThis.localStorage) {
  const clean = String(name || "").trim().slice(0, 40);
  const lists = loadWatchlists(store);
  if (!clean || lists.some((l) => l.name.toLowerCase() === clean.toLowerCase())) return { lists, created: null };
  const created = { id: `wl_${Date.now().toString(36)}`, name: clean, symbols: [] };
  return { lists: save(store, [...lists, created]), created };
}

export function addToWatchlist(listId, symbol, store = globalThis.localStorage) {
  const sym = String(symbol || "").trim().toUpperCase();
  return save(
    store,
    loadWatchlists(store).map((l) => (l.id === listId && sym && !l.symbols.includes(sym) ? { ...l, symbols: [...l.symbols, sym] } : l))
  );
}

export function removeFromWatchlist(listId, symbol, store = globalThis.localStorage) {
  const sym = String(symbol || "").trim().toUpperCase();
  return save(
    store,
    loadWatchlists(store).map((l) => (l.id === listId ? { ...l, symbols: l.symbols.filter((s) => s !== sym) } : l))
  );
}

export function deleteWatchlist(listId, store = globalThis.localStorage) {
  return save(store, loadWatchlists(store).filter((l) => l.id !== listId));
}
