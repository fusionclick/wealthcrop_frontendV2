// Client 2026-10-09 — the stock page's market badge:
//   open   (9:15–15:30 IST, Mon–Fri): green dot + "LIVE • As of <time>"
//   closed (otherwise):               "MARKET CLOSED • Close Price as of <date> 15:30 IST"
//
// The last trade's own timestamp decides, not the clock alone: on a market holiday the clock
// says "open" but the quote has not moved since the previous session, so it reads as closed
// without anyone maintaining a holiday calendar. A quote older than 15 minutes inside the
// session is not called LIVE either — a stale feed must not claim to be live.
const IST_MS = 5.5 * 60 * 60 * 1000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ist = (ms) => new Date(ms + IST_MS); // read back with getUTC* only
const pad = (n) => String(n).padStart(2, "0");

/** @returns {{ live: boolean, label: string } | null} null when the quote carries no time. */
export function marketStatus(tradeEpochSec, now = Date.now()) {
  if (!tradeEpochSec) return null;
  const n = ist(now);
  const day = n.getUTCDay();
  const mins = n.getUTCHours() * 60 + n.getUTCMinutes();
  const inSession = day >= 1 && day <= 5 && mins >= 9 * 60 + 15 && mins <= 15 * 60 + 30;
  const fresh = now - tradeEpochSec * 1000 <= 15 * 60 * 1000;
  const t = ist(tradeEpochSec * 1000);

  if (inSession && fresh) {
    return { live: true, label: `LIVE • As of ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())} IST` };
  }
  const date = `${pad(t.getUTCDate())}-${MONTHS[t.getUTCMonth()]}-${t.getUTCFullYear()}`;
  return { live: false, label: `MARKET CLOSED • Close Price as of ${date} 15:30 IST` };
}
