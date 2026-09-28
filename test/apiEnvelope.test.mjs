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
