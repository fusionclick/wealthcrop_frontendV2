import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sipForGoal, sipSeries } from "../src/utils/calculators.js";
import { MF_EXPLORE_PATH } from "../src/utils/nodeApi.js";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");

test("goal SIP: purani (bina inflation) ginti waisi hi rehti hai", () => {
  // 10L, 10 saal, 9% — home page par pehle se yahi number chhapta tha.
  const r = sipForGoal({ goal: 1000000, years: 10, cagr: 9, inflation: 0 });
  assert.equal(r.monthlySIP, 5168);
  assert.equal(r.futureValue, 1000000);
  // Total nikalte waqt bina round kiya hua SIP use hota hai — screenshot mein bhi 6,20,109 tha.
  assert.equal(r.totalInvested, 620109);
  assert.equal(r.estimatedGrowth, r.futureValue - r.totalInvested);
});

test("inflation slider natije ko waqai badalta hai", () => {
  const flat = sipForGoal({ goal: 1000000, years: 10, cagr: 9, inflation: 0 });
  const real = sipForGoal({ goal: 1000000, years: 10, cagr: 9, inflation: 3 });

  // Goal aaj ki qeemat mein hai, is liye target 3% par 10 saal aage jata hai.
  assert.equal(real.target, Math.round(1000000 * Math.pow(1.03, 10)));
  assert.ok(real.monthlySIP > flat.monthlySIP);
  assert.equal(real.futureValue, real.target);
});

test("series har saal ka ek point deti hai aur target par khatam hoti hai", () => {
  const r = sipForGoal({ goal: 500000, years: 7, cagr: 12, inflation: 4 });
  assert.equal(r.series.length, 7);
  assert.equal(r.series.at(-1).year, "Y7");
  // Aakhri saal ka corpus target ke barabar (rounding ki gunjaish ke sath).
  assert.ok(Math.abs(r.series.at(-1).total - r.target) <= 2);
  // Principal hamesha corpus se kam ya barabar.
  assert.ok(r.series.every((p) => p.principal <= p.total));
});

test("0% CAGR par NaN nahi, goal barabar hisson mein bat jata hai", () => {
  const r = sipForGoal({ goal: 1200000, years: 10, cagr: 0, inflation: 0 });
  assert.equal(r.monthlySIP, 10000);
  assert.ok(Number.isFinite(r.estimatedGrowth));
  assert.ok(r.series.every((p) => Number.isFinite(p.total)));
});

// Chaaron slider `value`/`onChange` ke baghair thay — hilte thay, natija kabhi nahi badalta tha.
test("har range slider state se bandha hua hai", () => {
  const src = read("../src/pages/calculators/SipCalculator.jsx");
  const sliders = src.match(/<input\s+type="range"[\s\S]*?\/>/g) || [];
  assert.ok(sliders.length >= 1, "koi range slider mila hi nahi");
  for (const slider of sliders) {
    assert.match(slider, /value=\{/, "slider ka value bandha nahi");
    assert.match(slider, /onChange=\{/, "slider ka onChange missing");
    assert.match(slider, /min=\{/);
    assert.match(slider, /max=\{/);
  }
});

test("planner ke buttons asli routes par jate hain", () => {
  const src = read("../src/pages/calculators/SipCalculator.jsx");

  // "Invest Now" /sip_cal par bhejta tha — aisa koi route hai hi nahi, seedha 404.
  assert.equal(src.includes("/sip_cal"), false);
  assert.match(src, /handleRedirect\(MF_EXPLORE_PATH\)/);
  assert.equal(MF_EXPLORE_PATH, "/user/mutual_fund/explore");

  // Related Calculators ke chaaron target route table mein maujood hone chahiye.
  // (JSX import nahi kar sakte, is liye route table ko text se parhte hain.)
  const routeTable = read("../src/utils/CalculatorRoutes.jsx");
  const known = new Set(
    [...routeTable.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1])
  );
  const targets = [...src.matchAll(/"([a-z-]+-calculator)"/g)].map((m) => m[1]);
  assert.ok(targets.length >= 4, "related calculator targets nahi mile");
  for (const path of targets) {
    assert.ok(known.has(path), `${path} calculatorRoutes mein nahi hai`);
  }

  // Tailwind `bg-${color}-500` build mein generate nahi hota — button be-rang reh jata tha.
  assert.equal(/bg-\$\{/.test(src), false);
});

test("Watch Video ka dead end hat gaya", () => {
  const hero = read("../src/components/home/HeroSection.jsx");
  assert.equal(hero.includes("youtube.com"), false);
  // Import bhi sath jana chahiye warna build mein bekaar icon reh jata hai.
  assert.equal(hero.includes("MdOutlinePlayCircle"), false);
  // Baaki dono CTA waise hi rahen.
  assert.match(hero, /to="\/signup"/);
  assert.match(hero, /href="#about"/);
});

// Search box logged-out visitor ke liye poori tarah mara hua tha: popup `token &&` ke
// peeche band tha, aur input controlled bhi nahi tha — "reliance" likh kar kuch nahi hota tha.
test("search box bina login ke bhi khulta hai", () => {
  const header = read("../src/components/OldHeader.jsx");
  assert.equal(/token && setIsSearchOpen/.test(header), false);
  const inputs = header.match(/<input[\s\S]*?\/>/g) || [];
  const searchInputs = inputs.filter((i) => /placeholder="Search/.test(i));
  assert.equal(searchInputs.length, 2, "desktop + mobile dono search box hone chahiye");
  for (const input of searchInputs) {
    assert.match(input, /onFocus=\{\(\) => setIsSearchOpen\(true\)\}/);
    assert.match(input, /readOnly/, "trigger box mein type karna popup se bahar likhta hai");
  }
});

test("search results par click crash nahi karta", () => {
  const popup = read("../src/components/SearchPopup.jsx");
  // Dono handler kabhi define hi nahi hue the — har click ReferenceError.
  assert.equal(popup.includes("setSelectedAsset"), false);
  assert.equal(popup.includes("toggleBookmark("), false);
  // Fund row navigate karta hai aur popup band karta hai.
  assert.match(popup, /onClick=\{\(\) => showFundPage\(asset\?\.scheme_isin, asset\?\.scheme_bse_code\)\}/);
  assert.match(popup, /const showFundPage[\s\S]*?onClose\(\);/);
  // Bookmark maujooda watchlist helper par jata hai.
  assert.match(popup, /toggleMfWatchlist\(\{ isin, code, name/);
  // Trending aur suggestion buttons ab search chalate hain.
  assert.ok((popup.match(/onClick=\{\(\) => searchAssets\(item\)\}/g) || []).length === 2);
});

// ─────────────── 10 Sep: dusra batch ───────────────

test("sipSeries: jo daala aur jo bana, dono theek", () => {
  const s = sipSeries({ monthly: 10000, years: 10, cagr: 12 });
  assert.equal(s.length, 10);
  assert.equal(s[0].invested, 120000);
  assert.equal(s[9].invested, 1200000);
  // 10k/mah, 12%, 10 saal, ordinary annuity = 23,00,387. Annuity-due 23,23,391 deta, magar
  // sipForGoal pehle se ordinary use karta hai — dono ek hi formula par rehne chahiye.
  assert.equal(s[9].value, 2300387);
  // Value hamesha invested se ooper, aur dono barhte hain.
  for (let i = 1; i < s.length; i++) {
    assert.ok(s[i].value > s[i - 1].value);
    assert.ok(s[i].value > s[i].invested);
  }
});

test("sipSeries: 0% par jitna daala utna hi bana (0/0 se bachao)", () => {
  const s = sipSeries({ monthly: 5000, years: 3, cagr: 0 });
  assert.deepEqual(s.map((p) => p.value), s.map((p) => p.invested));
  assert.equal(s[2].value, 180000);
});

test("sipForGoal ab sipSeries par chalta hai magar natija wahi hai", () => {
  const r = sipForGoal({ goal: 1000000, years: 10, cagr: 9, inflation: 0 });
  assert.equal(r.monthlySIP, 5168);
  assert.equal(r.series.length, 10);
  assert.equal(r.series[9].total, r.futureValue);
  assert.ok(r.series[9].principal < r.series[9].total);
});

test("home chart mein legend hai aur x-axis par saal", () => {
  const chart = read("../src/components/home/HomeChart.jsx");
  assert.match(chart, /<Legend \/>/);
  // dataKey ke baghair recharts index (0,1,2…) chhapta tha.
  assert.match(chart, /<XAxis dataKey="year"/);
  // Dono lakeeron ke naam hon warna legend "value"/"invested" dikhati hai.
  assert.match(chart, /name="Portfolio value"/);
  assert.match(chart, /name="Amount invested"/);
  // Hardcoded jhoote number wapas na aayen.
  assert.equal(chart.includes('year: "2019"'), false);
});

test("SIP chart ki legend mein 'total' do baar nahi aata", () => {
  const sip = read("../src/pages/calculators/SipCalculator.jsx");
  // Line usi dataKey ko dobara draw kar rahi thi jo Bar draw karta hai.
  assert.equal(/<Line[\s\S]{0,120}dataKey="total"/.test(sip), false);
  assert.match(sip, /<Bar dataKey="principal" name="Amount invested"/);
  assert.match(sip, /<Bar dataKey="total" name="Portfolio value"/);
});

// Input/Row component ke andar define thay: har render par naya component type banta hai,
// React purana input unmount kar deta hai, aur ek digit type karte hi focus ud jata tha.
for (const file of ["IncomeTaxCalculator", "RentCalculator"]) {
  test(`${file}: input field render par remount nahi hota`, () => {
    const src = read(`../src/pages/calculators/${file}.jsx`);
    const body = src.slice(src.indexOf(`const ${file} = () =>`));
    assert.equal(/^\s+const (Input|Row) = \(/m.test(body), false,
      "Input/Row component ke andar wapas chala gaya — focus phir udega");
    assert.match(src, /^const Input = \(/m);
    assert.match(src, /^const Row = \(/m);
  });
}

test("/support login ke peeche nahi hai", () => {
  const app = read("../src/App.jsx");
  // ProtectRoute block khatam hone ke baad aana chahiye — warna logged-out visitor /login par.
  const guarded = app.indexOf("<Route path=\"/login\"");
  const support = app.indexOf("<Route path=\"/support\"");
  assert.ok(support > 0 && support < guarded, "/support public routes ke sath hona chahiye");
  assert.equal((app.match(/<Route path="\/support"/g) || []).length, 1);
});

test("har /calculator/... link ka route mojood hai", () => {
  const routes = read("../src/utils/CalculatorRoutes.jsx");
  const known = new Set([...routes.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]));
  assert.ok(known.size >= 18);

  const dir = new URL("../src/", import.meta.url);
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(new URL(`${e.name}/`, d)) : [new URL(e.name, d)]);

  const dead = [];
  for (const f of walk(dir)) {
    if (!/\.jsx?$/.test(f.pathname)) continue;
    const src = fs.readFileSync(f, "utf8");
    for (const m of src.matchAll(/\/calculator\/([a-zA-Z0-9_-]+)/g)) {
      if (!known.has(m[1])) dead.push(`${f.pathname.split("/src/")[1]} → ${m[1]}`);
    }
  }
  assert.deepEqual(dead, [], `in links ka koi route nahi:\n${dead.join("\n")}`);
});

test("support page par jhoote contact details nahi hain", () => {
  const s = read("../src/pages/Support.jsx");
  // Template ki baqiyat: doosre brand ka email aur placeholder helpline.
  assert.equal(s.includes("investify.com"), false);
  assert.equal(s.includes("1800 123 4567"), false);
  // Jo bacha hai wo click par kaam kare.
  assert.match(s, /href="mailto:support@wealthcrop\.co/);
  // Bina onClick ke koi button na reh jaye.
  const buttons = s.match(/<button(?![^>]*onClick)[^>]*>/g) || [];
  assert.deepEqual(buttons, []);
  // Mere hatane se bache hue import na reh jayen.
  assert.equal(/MessageCircle|Phone/.test(s), false);
});
