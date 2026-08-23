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
  sock = io(url, { path, transports: ["websocket", "polling"] });
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

export function liveNav(fund, navs) {
  const isin = String(fund.scheme_isin || fund.scheme_isin || "").toUpperCase();
  const code = String(fund.scheme_bse_code || fund.scheme_bse_code || "").toUpperCase();
  const n = navs[isin] ?? navs[code] ?? fund.nav;
  return n != null ? Number(n) : null;
}
