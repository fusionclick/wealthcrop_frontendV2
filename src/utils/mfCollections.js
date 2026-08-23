export const MF_COLLECTIONS = [
  { name: "Gold Funds", slug: "gold_funds", search: "GOLD" },
  { name: "Large Cap", slug: "large_cap", search: "LARGE CAP" },
  { name: "Mid Cap", slug: "mid_cap", search: "MID CAP" },
  { name: "Small Cap", slug: "small_cap", search: "SMALL CAP" },
  { name: "High Return", slug: "high_return", search: "" },
  { name: "5 Star Funds", slug: "5_star_funds", search: "" },
];

export function collectionSlug(raw = "") {
  return String(raw).trim().toLowerCase().replace(/-/g, "_");
}

export function collectionSearch(raw = "") {
  const slug = collectionSlug(raw);
  return MF_COLLECTIONS.find((c) => c.slug === slug)?.search || "";
}
