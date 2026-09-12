import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const at = (p) => new URL(p, import.meta.url);
const read = (p) => fs.readFileSync(at(p), "utf8");
const exists = (p) => fs.existsSync(at(p));
// "this must not come back" has to look at the code, not at the comment explaining why it
// went — otherwise the assertion trips on its own rationale.
const readCode = (p) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");

const MENUS = ["StocksMenu", "FOMenu", "MutualFundsMenu", "MoreMenu"].map(
  (m) => `../src/components/hovercomp/${m}.jsx`
);

test("no calculator is advertised from two different menus", () => {
  // The original complaint: SIP Calculator sat in the Mutual Funds menu AND in More, on
  // the same route, under two different descriptions. Calculators live under More.
  const seen = new Map();
  for (const file of MENUS) {
    for (const m of readCode(file).matchAll(/navigate\("(\/calculator\/[^"]+)"\)/g)) {
      const where = seen.get(m[1]) || [];
      where.push(file);
      seen.set(m[1], where);
    }
  }
  for (const [route, files] of seen) {
    assert.equal(files.length, 1, `${route} is linked from ${files.length} menus: ${files.join(", ")}`);
  }
});

test("two menu entries never point at the same page under different names", () => {
  // "Top Gainers" and "ETF Investing" both went to /user/stocks/explore; "Market Trends"
  // and More's "Market News" both went to /market-news. Same page, different promise.
  const targets = new Map();
  for (const file of MENUS) {
    const src = readCode(file);
    for (const m of src.matchAll(/title="([^"]+)"[\s\S]{0,120}?navigate\("([^"]+)"\)/g)) {
      const list = targets.get(m[2]) || [];
      list.push(`${m[1]} (${file.split("/").pop()})`);
      targets.set(m[2], list);
    }
  }
  for (const [route, titles] of targets) {
    const distinct = new Set(titles.map((t) => t.split(" (")[0]));
    assert.equal(distinct.size, titles.length, `${route} is reached by: ${titles.join(" / ")}`);
  }
});

test("the signed-out Mutual Funds menu links nothing that needs signing in", () => {
  // This mega menu only renders when there is no token, so a /user/* link could only ever
  // be clicked by someone ProtectRoute would bounce to the login screen.
  const src = readCode("../src/components/hovercomp/MutualFundsMenu.jsx");
  const mega = src.slice(src.indexOf("openMenu && !token"));
  const guarded = [...mega.matchAll(/navigate\("(\/user\/[^"]*)"\)/g)].map((m) => m[1]);
  assert.deepEqual(
    guarded,
    ["/user/mutual_fund/explore"],
    "only the Explore CTA may point at /user/*; portfolio links belong in the signed-in dropdown"
  );
});

test("MenuItem is defined once, not once per menu", () => {
  assert.ok(exists("../src/components/hovercomp/MenuItem.jsx"));
  for (const file of MENUS) {
    const src = readCode(file);
    assert.equal(/const MenuItem = \(/.test(src), false, `${file} still carries its own copy`);
    assert.match(src, /import MenuItem from "\.\/MenuItem"/);
  }
});

test("header copy is one language", () => {
  // The three portfolio descriptions were the only Hinglish strings in the header.
  const src = read("../src/components/hovercomp/MutualFundsMenu.jsx");
  for (const word of ["Isi platform", "Doosri jagah", "dono ek jagah"]) {
    assert.equal(src.includes(word), false, `${word} is still in the menu copy`);
  }
});

test("the 18.6 MB of unreferenced JPEG stays out of the build", () => {
  // stock.jpg / stock1.jpg / stock2.jpg were imported by OldHeader and never rendered.
  // An import alone is enough for Vite to emit the asset, so every build shipped them.
  const header = readCode("../src/components/OldHeader.jsx");
  for (const img of ["stock.jpg", "stock1.jpg", "stock2.jpg"]) {
    assert.equal(header.includes(img), false, `${img} is imported again`);
  }
});

test("the entry files carry no unused imports", () => {
  for (const file of ["../src/App.jsx", "../src/main.jsx"]) {
    const src = readCode(file);
    const body = src.split("\n").filter((l) => !/^\s*import\b/.test(l)).join("\n");
    const dead = [];
    // The lookahead skips side-effect imports (`import "./index.css"`), which have no
    // `from` and would otherwise let the match run on into the next statement.
    for (const line of src.match(/^import\s+(?!["'])[\s\S]*?\s+from\s*["'][^"']+["'];?/gm) || []) {
      const clause = /^import\s+([\s\S]*?)\s+from/.exec(line)?.[1] ?? "";
      const names = [
        ...(/\{([\s\S]*)\}/.exec(clause)?.[1].split(",") ?? []),
        clause.replace(/\{[\s\S]*\}/, "").replace(/,/g, ""),
      ]
        .map((n) => n.trim().split(/\s+as\s+/).pop().trim())
        .filter(Boolean);
      dead.push(...names.filter((n) => !new RegExp(String.raw`\b${n}\b`).test(body)));
    }
    assert.deepEqual(dead, [], `${file} imports things it never uses: ${dead.join(", ")}`);
  }
});

test("the dead files stay dead", () => {
  // A representative slice of the 43 removed: duplicate headers, superseded chart and KYC
  // components, and unused data fixtures. If one reappears, something copied it back.
  for (const gone of [
    "../src/components/Header.jsx",
    "../src/components/Header2.jsx",
    "../src/components/hovercomp/HoverSection.jsx",
    "../src/redux/hoverMenuSlice.js",
    "../src/components/kyc/steps/PanStep.jsx",
    "../src/pages/mutual_fund/FundDetails2.jsx",
    "../src/components/StockDetails2.jsx",
    "../src/utils/FormSchema.test.mjs",
    "../src/components/chart/navSeries.test.mjs",
  ]) {
    assert.equal(exists(gone), false, `${gone} is back`);
  }
  // hoverMenu was a redux slice nothing read once its two consumers went.
  assert.equal(read("../src/redux/store.js").includes("hoverMenuReducer"), false);
});

test("navSeries coverage actually runs now", () => {
  // It sat at src/components/chart/navSeries.test.mjs, which `npm test` (test/*.test.mjs)
  // never globbed — passing tests that executed nowhere.
  assert.ok(exists("./navSeries.test.mjs"));
  assert.match(read("../package.json"), /"test": "node --test test\/\*\.test\.mjs"/);
});
