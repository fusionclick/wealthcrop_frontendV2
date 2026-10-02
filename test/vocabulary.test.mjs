// Audit #34 — vocabulary. A mutual fund DISTRIBUTOR may not present itself as an adviser, a
// planner or a wealth manager (each names a SEBI registration this entity does not hold),
// and it is not "SEBI-registered" — it is AMFI-registered. compliance.test.mjs scans whole
// files for the six statutory phrases; this scans what a user actually READS (JSX text and
// string literals, comments stripped) for those AND the near-variants that slipped past it:
// "Expert Advisory", "personalized investment recommendations", "top-performing", …
//
// Allowed instead: Asset Allocation, Curated Mutual Fund Baskets, Goal-based SIPs, Product
// Suitability Assessment.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FORBIDDEN = [
  // The statutory six, and their spellings.
  /investment\s+advis[eo]r/i,
  /financial\s+planner/i,
  /financial\s+planning/i,
  /wealth\s+manage(r|ment)/i,
  /wealth\s+advisory/i,
  /customi[sz]ed\s+portfolio/i,
  /portfolio\s+management/i,
  // Near-variants the audit found rendered.
  /expert\s+advi(ce|sory)/i,
  /expert[\s-]+(insights|curated|backed)/i,
  /(certified\s+)?financial\s+experts?\b/i,
  /investment\s+recommendations?/i,
  /personali[sz]ed\s+investment/i,
  /\b(top|best)[\s-]performing\b/i,
  /\bask\s+(the\s+advis[eo]r|an\s+expert)\b/i,
  /\badvis[eo]rs?\s+suggest/i,
  // A page or menu entry titled just "Advisor" (the robo-allocation page is "Asset Allocation").
  /^\s*(robo[\s-]+)?advis[eo]r\s*$/i,
  // The false registration claim.
  /sebi[\s-]+registered\s+(platform|distributor|entity|advis[eo]r)/i,
];

/** Comments are notes to developers, not text a user reads — the rule must not trip on them.
 *  Their newlines are kept, so a reported line number is the real one. */
const blank = (m) => m.replace(/[^\n]/g, "");
const stripComments = (src) =>
  src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/^[ \t]*\/\/.*$/gm, "");

// JSX text between tags, and every string literal (props, arrays of copy, toasts).
const TEXT = />([^<>{}]+)</g;
const STRINGS = /"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g;

/** @returns {string[]} "line: phrase" for every forbidden phrase a user could read. */
export function renderedHits(source) {
  const src = stripComments(source);
  const hits = [];
  for (const re of [TEXT, STRINGS]) {
    re.lastIndex = 0;
    for (let m; (m = re.exec(src)); ) {
      const text = m[1] ?? m[2] ?? m[3] ?? "";
      for (const bad of FORBIDDEN) {
        const found = bad.exec(text);
        if (found) hits.push(`${src.slice(0, m.index).split("\n").length}: "${found[0]}"`);
      }
    }
  }
  return hits;
}

function sourceFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(jsx?|mjs)$/.test(name)) out.push(full);
  }
  return out;
}

test("Audit #34: no adviser vocabulary, near-variant or 'SEBI-registered' claim is rendered", () => {
  const offenders = [];
  for (const file of sourceFiles("src")) {
    for (const hit of renderedHits(readFileSync(file, "utf8"))) {
      offenders.push(`${file.replace(/\\/g, "/")}:${hit}`);
    }
  }
  assert.deepEqual(offenders, [], `use Asset Allocation / Curated Mutual Fund Baskets / Goal-based SIPs / Product Suitability Assessment:\n  ${offenders.join("\n  ")}`);
});

test("the scanner itself still finds a planted offender, and ignores comments", () => {
  // Without this the test above passes forever the moment a regex breaks.
  const planted = `
    const features = [{ title: "Expert Advisory", text: "Top-performing SIP recommendations" }];
    // Wealth Management in a developer comment is fine
    {/* so is Investment Adviser in a JSX comment */}
    export default () => <li>Secure, SEBI-registered platform</li>;
    const faq = { q: 'Do I get personalized investment recommendations?' };
    const link = { to: "/advisor", label: "Advisor" };
  `;
  const hits = renderedHits(planted).join(" | ");
  assert.match(hits, /Expert Advisory/);
  assert.match(hits, /Top-performing/);
  assert.match(hits, /SEBI-registered platform/);
  assert.match(hits, /personalized investment/);
  assert.match(hits, /"Advisor"/);
  assert.doesNotMatch(hits, /\/advisor/, "a route path is not a label");
  assert.doesNotMatch(hits, /Wealth Management|Investment Adviser/);
  // The allowed vocabulary passes.
  assert.deepEqual(renderedHits(`<p>Curated Mutual Fund Baskets, Goal-based SIPs and Asset Allocation</p>`), []);
});
