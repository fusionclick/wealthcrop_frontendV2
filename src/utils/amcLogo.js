/** Only use logo URLs supplied with permission in the maintained scheme register. */
export function amcLogoUrl(name = "", media = []) {
  const match = (Array.isArray(media) ? media : []).find((row) =>
    String(row.scheme_name || "").trim().toLowerCase() === String(name).trim().toLowerCase()
  );
  return /^https:\/\//i.test(match?.logo_url || "") ? match.logo_url : "";
}
export function amcInitial(name = "") {
  const t = String(name).trim();
  return t ? t[0].toUpperCase() : "F";
}
