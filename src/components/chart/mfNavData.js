// src/data/mfNavData.js

// 🔹 Generate realistic mutual fund NAV data
// - 1 NAV per day
// - Ends at a given endTimestamp (Unix seconds)
// - Random daily move with occasional corrections (realistic up-down movement)

function generateMFNavData(days, endTimestamp, startNav = 120) {
  const data = [];
  let nav = startNav;

  for (let i = 0; i < days; i++) {
    // Base small daily movement: -1.2% to +1.2%
    const dailyMove = (Math.random() * 2.4 - 1.2) / 100;

    // Occasional bigger dips/pumps
    const r = Math.random();
    if (r < 0.02) {
      nav *= 0.97; // -3% correction
    } else if (r < 0.04) {
      nav *= 1.03; // +3% rally
    } else {
      nav *= 1 + dailyMove;
    }

    const ts = endTimestamp - i * 86400; // 1 day in seconds

    data.push({
      timestamp: ts,
      nav: Number(nav.toFixed(2)),
    });
  }

  return data.reverse(); // Oldest → Newest
}

// 🔹 ENDING DATE: 05-12-2025
const endDateTS = Math.floor(new Date("2025-12-05T00:00:00Z").getTime() / 1000);

// 🔹 Time ranges
const DAYS_10Y = 10 * 365;
const DAYS_5Y = 5 * 365;
const DAYS_3Y = 3 * 365;
const DAYS_1Y = 365;
const DAYS_6M = 180;
const DAYS_3M = 90;
const DAYS_30D = 30;

//  MASTER DATASET (10 years)
export const mfNavData_10Y = generateMFNavData(DAYS_10Y, endDateTS, 150);

// 🔹 Derived datasets
export const mfNavData_5Y = mfNavData_10Y.slice(-DAYS_5Y);
export const mfNavData_3Y = mfNavData_5Y.slice(-DAYS_3Y);
export const mfNavData_1Y = mfNavData_5Y.slice(-DAYS_1Y);
export const mfNavData_6M = mfNavData_5Y.slice(-DAYS_6M);
export const mfNavData_3M = mfNavData_5Y.slice(-DAYS_3M);
export const mfNavData_30D = mfNavData_5Y.slice(-DAYS_30D);

// 🔹 ALL = Full 10 Years
export const mfNavData_ALL = mfNavData_10Y;

// 🔹 Convenient Timeframe Map
export const MF_DATA = {
  "30D": mfNavData_30D,
  "3M": mfNavData_3M,
  "6M": mfNavData_6M,
  "1Y": mfNavData_1Y,
  "3Y": mfNavData_3Y,
  "5Y": mfNavData_5Y,
  "10Y": mfNavData_10Y,
  ALL: mfNavData_ALL,
};
