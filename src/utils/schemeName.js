/**
 * Scheme name + identifier formatting, in one place.
 *
 * BSE sends scheme names SHOUTED: "SBI ESG EXCLUSIONARY STRATEGY FUND REGULAR IDCW PAYOUT".
 * Every surface that renders a fund — Explore, Search, Details, Compare, Portfolio, Orders,
 * SIPs — has to show the same Title Case version of it, so the casing lives here and not in
 * fifteen components.
 *
 * Why this is done in the UI and not in the API: `name` is a JOIN KEY elsewhere. The Laravel
 * basket code matches assets on the exact BSE name, and mfapi's search is fed from it.
 * Re-casing the name server-side would silently break those; re-casing it at render cannot.
 */

/**
 * Tokens that stay in capitals. An acronym Title Cased ("Hdfc", "Idcw", "Elss") looks like a
 * typo to the investor and unlike the name on their own statement.
 *
 * This is an explicit list on purpose. The obvious shortcut — "any all-caps run of three
 * letters or fewer is an acronym" — turns "TATA SMALL CAP FUND" into "Tata Small CAP Fund",
 * because CAP, MID, TOP, TAX and NEW are ordinary words that happen to be short. A name this
 * list misses is merely Title Cased ("Boi" for BOI), which is a cosmetic miss; the shortcut
 * shouts real words, which is a visible one on every card.
 */
const ACRONYMS = new Set([
  // AMC and sponsor names
  "HDFC", "ICICI", "IDFC", "IDBI", "HSBC", "PGIM", "PPFAS", "IIFL", "SBI", "UTI", "LIC",
  "DSP", "JM", "NJ", "BOI", "BNP", "ITI", "WOC", "MF", "AMC",
  // Scheme / instrument vocabulary
  "IDCW", "ELSS", "NFO", "ETF", "FOF", "FMP", "SIP", "SWP", "STP", "PSU", "SDL", "TRI",
  "REIT", "INVIT", "IPO", "NRI", "AAA", "CPSE", "ESG", "MNC", "FMCG", "IT", "US", "UK",
  // Index and regulator names
  "AMFI", "SEBI", "CRISIL", "MSCI", "EAFE", "BSE", "NSE",
]);

// Lower-case joiners, unless they open the name.
const MINOR = new Set(["of", "and", "the", "for", "in", "on", "with", "to", "a", "an", "or", "at", "by"]);

const capitalise = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

function castToken(token, index) {
  if (!token) return token;
  const bare = token.replace(/[^A-Za-z0-9&]/g, "");
  if (!bare) return token;

  if (ACRONYMS.has(bare.toUpperCase())) return token.toUpperCase();
  // Pure numbers and things like "2025", "360" are left alone.
  if (!/[A-Za-z]/.test(bare)) return token;

  const lower = bare.toLowerCase();
  if (index > 0 && MINOR.has(lower)) return token.toLowerCase();

  // Split on the separators a scheme name actually uses so "SMALL-CAP" -> "Small-Cap" and
  // "LARGE&MID" -> "Large&Mid", rather than "Small-cap".
  return token
    .toLowerCase()
    .split(/([-/&.])/)
    .map((part) => (/[-/&.]/.test(part) ? part : capitalise(part)))
    .join("");
}

/** "SBI ESG FUND REGULAR IDCW PAYOUT" -> "SBI ESG Fund Regular IDCW Payout" */
export function titleCase(name) {
  const s = String(name ?? "").trim();
  if (!s) return "";
  // A name that is already mixed case came from somewhere that formatted it — leave it.
  if (s !== s.toUpperCase() && s !== s.toLowerCase()) return s.replace(/\s+/g, " ");
  return s
    .replace(/\s+/g, " ")
    .split(" ")
    .map(castToken)
    .join(" ");
}

/**
 * The identifier an investor is allowed to see.
 *
 * ISIN is the public, cross-platform identifier printed on their CAS. The BSE scheme code
 * ("007-DP") is our routing detail: it still travels in every order payload and every URL,
 * it just does not belong on screen.
 */
export const displayIdentifier = (fund) => fund?.scheme_isin || fund?.isin || null;

/** Percentages, with "p.a." wherever the number is annualised. */
export function fmtPct(value, { annualised = false, sign = false, dp = 2 } = {}) {
  if (value == null || value === "" || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  const body = `${sign && n > 0 ? "+" : ""}${n.toFixed(dp)}%`;
  return annualised ? `${body} p.a.` : body;
}

/**
 * Expense ratio and exit load. Both arrive as bare numbers ("0.69", "0") and were printed
 * exactly like that: a percentage with no % beside it, and an exit load of zero shown as the
 * digit 0.
 *
 * Zero is a real answer for both, so neither may fall through to the unknown branch — an exit
 * load of 0 means the investor pays nothing to leave, which is a fact, not a missing field.
 */
// Only a value that is ENTIRELY a number is one. Stripping the non-digits out of BSE's prose
// ("1% if redeemed within 365 days") instead produced "1365%", which is not a wrong format,
// it is a wrong charge — so the whole string has to parse, or none of it does.
const asNumber = (value) => {
  const s = String(value).trim().replace(/%$/, "").trim();
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null;
};

export function fmtRatio(value) {
  if (value == null || value === "") return "—";
  const n = asNumber(value);
  return n == null ? String(value) : `${n}%`;
}

export function fmtExitLoad(value) {
  if (value == null || value === "") return null;
  const n = asNumber(value);
  if (n == null) return String(value);
  return n === 0 ? "Nil" : `${n}%`;
}

/** Fund age as a sentence, from whichever of the two dates we have. */
export function fmtAge(years) {
  if (years == null || Number.isNaN(Number(years))) return null;
  const y = Number(years);
  if (y < 1) return `${Math.max(1, Math.round(y * 12))} months`;
  return `${y.toFixed(1)} years`;
}

/** "2013-05-24" -> "24 May 2013". Anything unparseable returns null, never "Invalid Date". */
export function fmtDate(iso) {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
