// QA 10.1 — "dark theme mein kuch cheezein nazar ni aati" on the Invest Now modal.
//
// The cause was one class: FundDetails' page wrapper carried `text-[#1A1A1A]` with no dark
// counterpart. The page's own rows mostly set a colour of their own, so the page LOOKED fine
// and a route sweep passed it — the damage was to everything below that relies on
// inheritance. The Invest Now modal renders inside that subtree, so its heading, NAV,
// Minimum lumpsum, the Amount label and the Cancel button all came out near-black on a
// near-black card (measured contrast 1.03:1), while the identical component reached as the
// /buy route was white on dark.
//
// A container that pins a dark text colour without a dark: variant is therefore a trap for
// every child it will ever have, including ones added later. This walks the JSX for them.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// The tail is a negative lookahead, NOT \b. An arbitrary value ends in "]", and "]" followed
// by a space is not a word boundary — with \b here the scan silently matched nothing and
// reported a clean codebase while FundDetails was still broken.
const DARK_TEXT =
  /\btext-(?:black|\[#[0-3][0-9A-Fa-f]{5}\]|blue-9\d0|(?:gray|slate|zinc|neutral|stone)-[89]00)(?![\w-])/;

// className="…" | className={`…`} | className={"…"}
const ATTR = /className\s*=\s*(?:"([^"]*)"|\{\s*`([^`]*)`|\{\s*"([^"]*)")/g;

function jsxFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) jsxFiles(full, out);
    else if (name.endsWith(".jsx")) out.push(full);
  }
  return out;
}

test("no element pins a dark text colour without a dark: variant", () => {
  const offenders = [];

  for (const file of jsxFiles("src")) {
    const src = readFileSync(file, "utf8");
    ATTR.lastIndex = 0;
    for (let m; (m = ATTR.exec(src)); ) {
      const cls = m[1] ?? m[2] ?? m[3] ?? "";
      if (!DARK_TEXT.test(cls) || cls.includes("dark:text-")) continue;
      const line = src.slice(0, m.index).split("\n").length;
      offenders.push(`${file.replace(/\\/g, "/")}:${line}  ${DARK_TEXT.exec(cls)[0]}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `every dark text colour needs a dark: counterpart, or its whole subtree inherits it:\n  ${offenders.join("\n  ")}`
  );
});

test("the scanner itself still finds a planted offender", () => {
  // Without this the test above passes forever the moment the regex breaks — which is exactly
  // how the first version of this scan reported a clean codebase.
  assert.ok(DARK_TEXT.test("w-full bg-gray-50 dark:bg-[var(--app-bg)] text-[#1A1A1A] py-10"));
  assert.ok(DARK_TEXT.test("p-4 text-gray-900 rounded"));
  assert.ok(DARK_TEXT.test("text-blue-950 font-semibold"));
  // And does not fire on a light colour, or on one that is already handled.
  assert.ok(!DARK_TEXT.test("text-slate-400 text-[#94a3b8]"));
  assert.ok(!DARK_TEXT.test("text-gray-700 text-slate-500"));
});
