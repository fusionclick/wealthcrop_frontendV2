// Mutual fund NAV is published once per business day, so "hourly" has no source
// data. These are the real resolutions BSE/AMFI NAV supports.
export const RANGES = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365, "3Y": 1095, "5Y": 1825, ALL: Infinity };
export const INTERVALS = { D: "Daily", W: "Weekly", M: "Monthly" };

const startOfWeek = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.getTime();
};
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getTime();

/** YYYY-MM-DD -> unix seconds, at the given edge of that local day. */
const dayBound = (date, edge) => {
  if (!date) return null;
  const ms = Date.parse(edge === "end" ? `${date}T23:59:59` : `${date}T00:00:00`);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
};

/**
 * Slice the series to `range`, then keep the last NAV of each interval bucket.
 *
 * `span` ({from, to} as YYYY-MM-DD) overrides `range` when either side is given —
 * that is an explicit date filter, so it returns exactly what falls inside the window
 * with **no** short-slice fallback: showing the last 30 days when someone asked for a
 * week in 2019 would be a lie, an empty chart is the honest answer.
 */
export function bucketSeries(series = [], range = "1Y", interval = "D", span = null) {
  const rows = series.filter((d) => d && d.timestamp && Number(d.nav) > 0);
  if (!rows.length) return [];

  const from = dayBound(span?.from, "start");
  const to = dayBound(span?.to, "end");
  let slice;
  if (from || to) {
    slice = rows.filter((d) => (!from || d.timestamp >= from) && (!to || d.timestamp <= to));
  } else {
    const days = RANGES[range] ?? 365;
    const cut = rows[rows.length - 1].timestamp - days * 86400;
    slice = days === Infinity ? rows : rows.filter((d) => d.timestamp >= cut);
    if (slice.length < 2) slice = rows.slice(-Math.min(rows.length, 30));
  }
  if (interval === "D") return slice;

  const bucketOf = interval === "W" ? startOfWeek : startOfMonth;
  const byBucket = new Map();
  slice.forEach((d) => byBucket.set(bucketOf(new Date(d.timestamp * 1000)), d));
  return [...byBucket.values()].sort((a, b) => a.timestamp - b.timestamp);
}

export const fmtLabel = (ts, interval) => {
  const d = new Date(ts * 1000);
  if (interval === "M") return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
};
