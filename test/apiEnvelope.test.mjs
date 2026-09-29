// Two pages died in production on the same mistake, so it gets a test rather than four
// one-line fixes.
//
// The two fetch helpers return DIFFERENT shapes:
//   getApiWithToken -> the axios response, so the body is res.data and a Laravel
//                      {status, data} envelope puts the payload at res.data.data
//   getApi          -> the parsed body already, so the payload is res.data
//
// Reading one level too few off getApiWithToken yields the envelope object. It is truthy,
// so `|| []` never fires; it has no .length, so an `x.length === 0` empty check silently
// falls through; and then .map()/for..of throws. That is exactly how /user/approvals and
// /user/mutual_fund/investments both rendered "Something went wrong".
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".jsx") || p.endsWith(".js") ? [p] : [];
  });

test("no getApiWithToken query unwraps only one level of the response", () => {
  const offenders = [];

  for (const file of walk("src")) {
    const src = readFileSync(file, "utf8");
    if (!src.includes("getApiWithToken")) continue;

    // Each useQuery block: pair its queryFn with its select.
    for (const block of src.split("useQuery(").slice(1)) {
      const body = block.slice(0, 600);
      if (!/queryFn:[^\n]*getApiWithToken/.test(body)) continue;

      const select = /select: \(res\) =>([^\n]*)/.exec(body);
      if (!select) continue;

      const expr = select[1];
      // Anything reaching past res.data is fine — .data.data, .data.orders, .data.holdings,
      // .data.lists, .data.scheme_info, an object literal built from them, and so on.
      if (/res\?\.data\?\./.test(expr) || /res\.data\./.test(expr) || expr.trim().startsWith("({")) continue;
      // `Array.isArray(res?.data) ? res.data : []` is a deliberate guarded shape: an
      // endpoint that really does answer with a bare array cannot crash a consumer.
      if (/Array\.isArray\(res\?\.data\)/.test(expr)) continue;

      offenders.push(`${file}: select: (res) =>${expr.trim()}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    "these read the {status, data} envelope instead of the payload:\n" + offenders.join("\n")
  );
});

test("the four pages that crashed now reach the payload", () => {
  const cases = [
    ["src/pages/Approvals.jsx", /select: \(res\) => \(Array\.isArray\(res\?\.data\?\.data\)/],
    ["src/hooks/usePortfolios.js", /select: \(res\) => \(Array\.isArray\(res\?\.data\?\.data\)/],
    ["src/pages/mutual_fund/SpreadInvest.jsx", /spreads`\),\s*\n\s*select: \(res\) => \(Array\.isArray\(res\?\.data\?\.data\)/],
    ["src/pages/mutual_fund/SpreadInvest.jsx", /select: \(res\) => res\?\.data\?\.data \?\? null/],
  ];
  for (const [file, re] of cases) {
    assert.match(readFileSync(file, "utf8"), re, `${file} still unwraps one level`);
  }
});

test("getApi consumers are left alone — they are already at the body", () => {
  // ModuleGate is the counter-example that proves the rule, and its own comment says so.
  // "Fixing" it to res.data.data would break the platform-settings gate.
  const gate = readFileSync("src/components/ModuleGate.jsx", "utf8");
  assert.match(gate, /queryFn: \(\) => getApi\(/);
  assert.match(gate, /select: \(res\) => res\?\.data \?\? \{\}/);
});

// ─────────────────────────────────────────────────────────────────────────────────────────
// The same trap, on the IMPERATIVE side — which the useQuery walk above cannot see.
//
// On 2026-09-29 it was found in four more places at once: RedeemMF/SwitchMF/SpreadInvest/
// MutualFundInvestPage (`res?.message || res?.error`, so BSE's actual refusal was replaced
// by a generic sentence), usePortfolios.remove (the server's "nothing was sold" reassurance
// dropped), and KycDetails (`res.message`, `res.pan_change_pending` and the pan-change
// banner all reading the envelope, which made a working PAN-change feature look dead).
//
// An axios response has only these properties. Reading anything ELSE off one means the
// body was meant, and the value is silently undefined.
//
// `response` is allowed: that is the axios ERROR shape, used defensively alongside a
// `.data` fallback, not a misread of a success response.
const AXIOS_PROPS = new Set([
  "data", "status", "statusText", "headers", "config", "request", "response",
]);

// Comments describing the bug are not the bug. Blanking them keeps line numbers intact so
// an offender still points at the right line.
const stripComments = (s) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + " ".repeat(m.length - p1.length));

test("no imperative *ApiWithToken result is read as if it were the body", () => {
  const offenders = [];

  for (const file of walk("src")) {
    const src = stripComments(readFileSync(file, "utf8"));
    if (!/ApiWithToken\(/.test(src)) continue;

    // `const res = await postApiWithToken(...)` — capture the variable it lands in.
    for (const m of src.matchAll(/(?:const|let)\s+(\w+)\s*=\s*await\s+\w*ApiWithToken\(/g)) {
      const varName = m[1];
      // Look only at the rest of that function-ish region, not the whole file.
      const region = src.slice(m.index, m.index + 900);
      for (const read of region.matchAll(new RegExp(String.raw`\b${varName}\s*\??\.\s*(\w+)`, "g"))) {
        const prop = read[1];
        if (AXIOS_PROPS.has(prop)) continue;
        // A match that runs to the very end of the slice was cut in half by the window —
        // `res?.status` truncated to `res?.s` reads as an offender and is not one.
        if (read.index + read[0].length >= region.length) continue;
        const line = src.slice(0, m.index + read.index).split("\n").length;
        offenders.push(`${file}:${line}  ${varName}.${prop} — axios responses have no .${prop}`);
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    "these read a property that only exists on the BODY, off the axios response:\n" +
      offenders.join("\n")
  );
});
