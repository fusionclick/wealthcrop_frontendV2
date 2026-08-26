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

/** Slice the series to `range`, then keep the last NAV of each interval bucket. */
export function bucketSeries(series = [], range = "1Y", interval = "D") {
  const rows = series.filter((d) => d && d.timestamp && Number(d.nav) > 0);
  if (!rows.length) return [];
  const days = RANGES[range] ?? 365;
  const cut = rows[rows.length - 1].timestamp - days * 86400;
  let slice = days === Infinity ? rows : rows.filter((d) => d.timestamp >= cut);
  if (slice.length < 2) slice = rows.slice(-Math.min(rows.length, 30));
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
