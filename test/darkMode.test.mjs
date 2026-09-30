// QA 15.5 — "dark mode on every new page: readable, no white-on-white, no black-on-black" →
// "couldn't read the things when dark theme enabled".
//
// The cause is mechanical: a className that sets a near-black text colour, or a white surface,
// and never says what to do in dark mode. Tailwind then keeps the light value and you get dark
// text on a dark background. This walks every className in the app and fails on any that sets
// one without the other, so a new page cannot reintroduce it.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const LIGHT_TEXT = /\btext-(?:slate|gray|zinc|neutral|stone)-(?:[78]00|900|950)\b|\btext-black\b|\btext-blue-(?:900|950)\b/;
const BG_WHITE = /\bbg-white\b/;
const BG_SUBTLE = /\bbg-(?:slate|gray)-(?:50|100)\b/;
const DARK_TEXT = /dark:text-/;
const DARK_BG = /dark:bg-/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith(".jsx")) out.push(full);
  }
  return out;
}

test("no className sets a dark-on-light colour without a dark-mode counterpart", () => {
  const offenders = [];

  for (const file of walk("src")) {
    const src = readFileSync(file, "utf8");
    // Line numbers from the match offset — slicing the file per match is quadratic and made
    // this walk take minutes on its own.
    const newlines = [];
    for (let i = 0; i < src.length; i++) if (src[i] === "\n") newlines.push(i);
    const lineAt = (idx) => {
      let lo = 0, hi = newlines.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (newlines[mid] < idx) lo = mid + 1;
        else hi = mid;
      }
      return lo + 1;
    };

    for (const m of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/gs)) {
      const cls = m[1] ?? m[2] ?? "";
      const where = `${file}:${lineAt(m.index)}`;

      if (LIGHT_TEXT.test(cls) && !DARK_TEXT.test(cls)) {
        offenders.push(`${where} near-black text with no dark:text-`);
      }
      if (!DARK_BG.test(cls)) {
        if (BG_WHITE.test(cls)) offenders.push(`${where} bg-white with no dark:bg-`);
        else if (BG_SUBTLE.test(cls)) offenders.push(`${where} light panel with no dark:bg-`);
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `these are unreadable in dark mode:\n${offenders.join("\n")}`
  );
});
