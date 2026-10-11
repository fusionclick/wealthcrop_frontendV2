// Client 2026-10-09 — NFOs sorted into the page's three tabs by their own dates.
// Open: subscription open today. Upcoming: opens later. Recently closed: closed within the
// last 60 days (older ones are history, not news). Dates are YYYY-MM-DD, compared as IST days.
const DAY = 86400000;
const istToday = (now) => new Date(now + 5.5 * 3600000).toISOString().slice(0, 10);
const day = (v) => String(v || "").slice(0, 10);

export function nfoStatus(nfo, now = Date.now()) {
  const today = istToday(now);
  const open = day(nfo?.open_date);
  const close = day(nfo?.close_date);
  if (!open || !close) return null;
  if (today < open) return "upcoming";
  if (today <= close) return "open";
  const daysSince = (Date.parse(today) - Date.parse(close)) / DAY;
  return daysSince <= 60 ? "closed" : null;
}

/** Whole days until the close date (0 = closes today), for "Closes in N days". */
export const daysToClose = (nfo, now = Date.now()) =>
  Math.round((Date.parse(day(nfo?.close_date)) - Date.parse(istToday(now))) / DAY);

export function groupNfos(list = [], now = Date.now()) {
  const out = { open: [], upcoming: [], closed: [] };
  for (const n of list) {
    const s = nfoStatus(n, now);
    if (s) out[s].push(n);
  }
  out.open.sort((a, b) => day(a.close_date).localeCompare(day(b.close_date)));
  out.upcoming.sort((a, b) => day(a.open_date).localeCompare(day(b.open_date)));
  out.closed.sort((a, b) => day(b.close_date).localeCompare(day(a.close_date)));
  return out;
}
