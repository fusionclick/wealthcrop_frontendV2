import { useEffect, useState } from "react";
import { io } from "socket.io-client";

let shared = {};
const listeners = new Set();
let sock;

function connect() {
  if (sock) return;
  const raw = (import.meta.env.VITE_NODE_URL || "/api/bse").replace(/\/$/, "");
  const url = raw.startsWith("http") ? new URL(raw).origin : undefined;
  const path = raw.startsWith("http")
    ? `${new URL(raw).pathname.replace(/\/$/, "")}/socket.io`
    : `${raw}/socket.io`;
  // ponytail: polling only — nginx does not forward the Upgrade header on
  // /api/bse/socket.io, so the ws probe always fails and just spams the console.
  // Add "websocket" back once the proxy block sets Upgrade/Connection headers.
  sock = io(url, { path, transports: ["polling"] });
  sock.on("nav_update", (msg) => {
    shared = msg?.navs || {};
    listeners.forEach((fn) => fn(shared));
  });
}

export function useNavMap() {
  const [navs, setNavs] = useState(shared);
  useEffect(() => {
    connect();
    listeners.add(setNavs);
    return () => listeners.delete(setNavs);
  }, []);
  return navs;
}

/** Socket entries are {nav, date}; the REST list payload carries plain numbers. */
export function liveNav(fund, navs) {
  const isin = String(fund.scheme_isin || "").toUpperCase();
  const code = String(fund.scheme_bse_code || "").toUpperCase();
  const hit = navs[isin] ?? navs[code];
  const n = (hit && typeof hit === "object" ? hit.nav : hit) ?? fund.nav;
  return n != null && n !== "" && Number.isFinite(Number(n)) ? Number(n) : null;
}

export function navDate(fund, navs) {
  const isin = String(fund.scheme_isin || "").toUpperCase();
  const code = String(fund.scheme_bse_code || "").toUpperCase();
  const hit = navs[isin] ?? navs[code];
  return (hit && typeof hit === "object" ? hit.date : null) || fund.nav_date || null;
}

/** NAV text for a fund card: a price, "n/a" once we know, "…" while in flight. */
export function navLabel(fund, navs) {
  const n = liveNav(fund, navs);
  if (n != null) return `NAV ₹${n.toFixed(2)}`;
  return fund.nav_loaded ? "NAV n/a" : "NAV …";
}
