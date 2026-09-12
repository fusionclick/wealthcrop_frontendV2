export const MF_COLLECTIONS = [
  { name: "Gold Funds", slug: "gold_funds", search: "GOLD" },
  { name: "Large Cap", slug: "large_cap", search: "LARGE CAP" },
  { name: "Mid Cap", slug: "mid_cap", search: "MID CAP" },
  { name: "Small Cap", slug: "small_cap", search: "SMALL CAP" },
  { name: "High Return", slug: "high_return", search: "FLEXI CAP" },
  { name: "5 Star Funds", slug: "5_star_funds", search: "BLUECHIP" },
  // Kotak Mahindra AMC ke apne funds. Ye BSE/AMFI catalogue mein pehle se hain —
  // Kotak Neo ka Trade API sirf equity/F&O deta hai, mutual fund ka koi endpoint nahi.
  { name: "Kotak Funds", slug: "kotak_funds", search: "KOTAK" },
];

export function collectionSlug(raw = "") {
  return String(raw).trim().toLowerCase().replace(/-/g, "_");
}

export function collectionSearch(raw = "") {
  const slug = collectionSlug(raw);
  return MF_COLLECTIONS.find((c) => c.slug === slug)?.search || "";
}
