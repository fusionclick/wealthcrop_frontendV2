import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { sipForGoal, sipSeries } from "../src/utils/calculators.js";
import { MF_EXPLORE_PATH } from "../src/utils/nodeApi.js";

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");

/**
 * Wahi file, magar comments ke baghair.
 *
 * Teen baar ho chuka hai: test kisi string ko "ab file mein nahi hona chahiye" kehta hai,
 * aur wo string sirf us comment mein bachi hoti hai jo bata raha hai ke kya hataya gaya —
 * yaani test apni hi wazahat par gir jata hai. Jahan bhi "ye cheez ab mojood nahi" wala
 * assert ho, `readCode` istemal karo; jahan asli code ka pattern match karna ho, `read`.
 */
const readCode = (p) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "") // JSX { /* … */ }
    .replace(/\/\*[\s\S]*?\*\//g, "")     // /* … */
    .replace(/^[ \t]*\/\/.*$/gm, "");     // poori line wale //

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

// ─────────────── 10 Sep: teesra batch ───────────────

test("Track Now button ab kuch karta hai", () => {
  const src = read("../src/components/TrackPage.jsx");
  const btn = (src.match(/<button[\s\S]*?>\s*Track Now/) || [""])[0];
  assert.match(btn, /onClick=\{startTracking\}/, "Track Now par onClick nahi hai");
  // Login hai to import page, warna wahi Register popup jo page par pehle se hai.
  assert.match(src, /navigate\("\/user\/mutual_fund\/external"\)/);
  assert.match(src, /setShowLogin\(true\)/);
});

test("F&O menu: sirf wahi item hain jinka page mojood hai", () => {
  const src = readCode("../src/components/hovercomp/FOMenu.jsx");
  // Ye chaar feature app mein bane hi nahi — menu inhe advertise na kare.
  for (const gone of ["Options Trading", "Option Chain", "Margin Calculator", "Brokerage Estimator"]) {
    assert.equal(src.includes(gone), false, `${gone} abhi tak menu mein hai magar iska koi page nahi`);
  }
  // MenuItem ab click leta hai, aur dono bache hue item wired hain.
  assert.match(src, /const MenuItem = \(\{ icon: Icon, title, desc, onClick \}\)/);
  assert.match(src, /<div\s+onClick=\{onClick\}/);
  // 3 = do MenuItem + pehle se mojood "Explore Future & Options" button.
  assert.equal((src.match(/onClick=\{\(\) => navigate\("\/user\/future_and_options\/explore"\)\}/g) || []).length, 3);
  // Logged-out par "F&O" label chup chaap mar nahi jata.
  assert.equal(/if \(token\) navigate/.test(src), false);
  // Hataye gaye icon ke import bhi sath jayen.
  for (const icon of ["CandlestickChart", "LineChart", "Calculator", "BarChart2"]) {
    assert.equal(src.includes(icon), false, `${icon} ka import ab bekaar hai`);
  }
});

test("NPS ab wahi SIP formula use karta hai jo baqi site", () => {
  // 10k/mah, 12%, 10 saal. Pehle NPS annuity-due se 23,23,391 deta tha aur SIP
  // calculator ordinary se 23,00,387 — ek hi sawal ke do jawab.
  const s = sipSeries({ monthly: 10000, years: 10, cagr: 12 });
  assert.equal(s.at(-1).value, 2300387);

  const src = readCode("../src/pages/calculators/NPSCalculator.jsx");
  assert.match(src, /import \{ sipSeries \} from "\.\.\/\.\.\/utils\/calculators"/);
  // Apna alag annuity-due formula wapas na aaye.
  assert.equal(/\(1 \+ monthlyRate\)\) \/\s*monthlyRate/.test(src), false);
  assert.equal(src.includes("Math.pow"), false, "NPS ko khud pow karne ki zarurat nahi rahi");
});

test("NPS 0% return par NaN nahi deta", () => {
  // NPS ka apna check `!expectedReturn` hai — string "0" isse guzar jati hai, is liye
  // ye rasta waqai pohanch mein tha aur pehle NaN chhapta tha.
  assert.equal(!"0", false);
  const s = sipSeries({ monthly: 10000, years: 10, cagr: 0 });
  assert.ok(Number.isFinite(s.at(-1).value));
  assert.equal(s.at(-1).value, s.at(-1).invested);
});

test("learning centre: koi bhi image bahar wale CDN se hotlink nahi", () => {
  const files = [
    "../src/pages/LearningCenterPage.jsx",
    "../src/pages/MutualFundLearning.jsx",
    "../src/pages/StockMarketLearning.jsx",
    "../src/pages/SIPWealthLearning.jsx",
    "../src/pages/TaxPlanningLearning.jsx",
  ];
  for (const f of files) {
    const src = read(f);
    assert.equal(/src="https?:\/\//.test(src), false, `${f} mein abhi bhi remote image hai`);
    assert.equal(/img:\s*"https?:\/\//.test(src), false, `${f} mein abhi bhi remote image hai`);
  }
});

test("learning centre: poora topic card click hota hai, sirf heading nahi", () => {
  const src = read("../src/pages/LearningCenterPage.jsx");
  // Pehle onClick <h3> par tha — card aur illustration par click bekar jata tha.
  assert.match(src, /key=\{item\.route\}\s+onClick=\{\(\) => navigate\(item\.route\)\}/);
  assert.equal(/<h3\s+onClick=/.test(src), false);
  // TOPICS mein chaar, PATHS mein teen — saaton asli learning-centre route hain.
  const routes = [...src.matchAll(/route: "(\/learning-centre\/[a-z_]+)"/g)].map((m) => m[1]);
  assert.equal(routes.length, 7);
  const app = read("../src/App.jsx");
  for (const r of new Set(routes)) {
    assert.ok(app.includes(`path="${r}"`), `${r} ka App.jsx mein koi route nahi`);
  }
});

test("learning centre: jis cheez ka content nahi wo page par nahi", () => {
  const src = readCode("../src/pages/LearningCenterPage.jsx");
  assert.equal(src.includes("Featured Video Lessons"), false);
  assert.equal(src.includes("Watch Now"), false);
  assert.equal(src.includes("Popular Guides & Articles"), false);
  // FAQ ab videos ka jhoota wada nahi karti.
  assert.equal(/we provide beginner to advanced investing videos/.test(src), false);
  // Har baqi button ka apna route hai.
  assert.match(src, /onClick=\{\(\) => navigate\(TOPICS\[0\]\.route\)\}/);
  assert.match(src, /onClick=\{\(\) => navigate\(p\.route\)\}/);
});

test("learning sub-pages ke hero buttons dead nahi", () => {
  for (const f of ["SIPWealthLearning", "TaxPlanningLearning"]) {
    const src = read(`../src/pages/${f}.jsx`);
    const dead = src.match(/<button(?![^>]*onClick)[^>]*>/g) || [];
    assert.deepEqual(dead, [], `${f} mein ab bhi bina onClick ka button hai`);
  }
});

test("IPO khali hone aur API girne mein farq hai", () => {
  const src = readCode("../src/components/ipo/IpoDashboardPage.jsx");
  // Pehle dono halat mein "No IPOs match your search" aata tha.
  assert.match(src, /Could not load IPOs/);
  assert.match(src, /No IPOs have been listed yet/);
  assert.match(src, /setLoadState\("error"\)/);
  assert.equal(/\.catch\(\(\) => setIpos\(\[\]\)\)/.test(src), false);
});

// ─────────────── 10 Sep: chautha batch ───────────────

test("Google button unconfigured hone par kuch render nahi karta", () => {
  const src = readCode("../src/components/GoogleSignInButton.jsx");
  // Ek disabled "(not configured)" button dikhana visitor ko hamari adhoori setup
  // dikhane ke siwa kuch nahi karta tha.
  assert.equal(src.includes("not configured"), false);
  assert.match(src, /if \(!CLIENT_ID\) return null;/);
  // Client ID milne par asli Google button abhi bhi aana chahiye.
  assert.match(src, /google\.accounts\.id\.renderButton/);
});

test("reset password ki nakami success ka daawa nahi karti", () => {
  const src = readCode("../src/pages/ResetPassword.jsx");
  // Error branch ka fallback text hi "Password reset successful" tha — surkh error
  // toast mein likha aata tha ke password reset ho gaya.
  assert.equal(/toastError\([^)]*"Password reset successful"/.test(src), false);
  assert.match(src, /Reset link is invalid or has expired/);
  // Success sirf success branch mein.
  assert.equal((src.match(/toastSuccess\(/g) || []).length, 1);
});

test("reset password ka button waqai submit karta hai", () => {
  const src = readCode("../src/pages/ResetPassword.jsx");
  // `{...register("newPassword")}` ke baad apna onChange likhne se register wala
  // onChange overwrite ho jata tha: RHF ko value milti hi nahi thi, zod hamesha
  // fail karta tha, aur handleSubmit handler ko kabhi call nahi karta tha —
  // "Reset Password" dabane par bilkul kuch nahi hota tha.
  assert.equal(/\{\.\.\.register\("newPassword"\)\}/.test(src), false);
  assert.match(src, /const passwordField = register\("newPassword"\)/);
  assert.match(src, /passwordField\.onChange\(e\);/);
  assert.match(src, /setNewPassword\(e\.target\.value\)/);
});

test("forgot-password screen se wapas aane ka rasta hai", () => {
  const login = read("../src/auth/Login.jsx");
  // Header ka "Login / Signup" /login par hi bhejta hai; route na badalne se component
  // remount nahi hota tha aur button mara hua lagta tha.
  assert.match(login, /useLocation/);
  assert.match(login, /setForgotPassword\(false\);\s*\n\s*\}, \[location\.key\]\)/);
  assert.match(login, /<ForgotPassword onBack=\{\(\) => setForgotPassword\(false\)\} \/>/);

  const fp = read("../src/components/ForgotPassword.jsx");
  assert.match(fp, /function ForgotPassword\(\{ onBack \}\)/);
  assert.match(fp, /onClick=\{onBack\}/);
});

test("blog page khali hone aur API girne mein farq karta hai", () => {
  const src = readCode("../src/pages/Blog.jsx");
  // `error` set to hota tha magar render kabhi nahi — dono halat mein wahi
  // "No matching articles" aata tha.
  assert.match(src, /No articles have been published yet/);
  assert.match(src, /error\s*\n?\s*\?\s*error/);
  // null title poore page ko white screen kar deta tha.
  assert.match(src, /p\.title && p\.title\.toLowerCase\(\)/);
});

test("reset email ab netlify preview par nahi bhejti", () => {
  const ctrl = fs.readFileSync(
    new URL("../../admin_php/app/Http/Controllers/Auth/ForgotPasswordController.php", import.meta.url),
    "utf8"
  ).replace(/^\s*\/\/.*$/gm, "");
  assert.equal(ctrl.includes("netlify"), false, "netlify URL abhi tak hardcoded hai");
  assert.match(ctrl, /config\('app\.frontend_url'\)/);
  // Email mein '+' hota hai to raw query string toot jati hai.
  assert.match(ctrl, /urlencode\(\$email\)/);
});

// ─────────────── 10 Sep: paanchwan batch ───────────────

test("profile ka KYC badge shared helper se aata hai", () => {
  const src = readCode("../src/pages/profile/BasicDetails.jsx");
  // Do ghalatiyan ek line mein: top-level kyc_status (jo hota hi nahi, kyc nested
  // relation hai) aur string "true" se comparison.
  assert.equal(/kyc_status === "true"/.test(src), false);
  assert.equal(/userData\?\.kyc_status/.test(src), false);
  assert.match(src, /isKycVerified\(userData\?\.kyc\?\.kyc_status\)/);
  assert.match(src, /import \{ isKycVerified \} from "\.\.\/\.\.\/utils\/kycVerdict"/);
});

test("balance page verified user ko dobara KYC par nahi bhejta", () => {
  const src = readCode("../src/pages/Balance.jsx");
  assert.match(src, /isKycVerified\(investor\?\.kyc\?\.kyc_status\)/);
  // "Complete KYC" ab shart ke peeche hai, har haal mein nahi.
  assert.match(src, /kycDone \?/);
  assert.match(src, /Your KYC is verified/);
  // Verified user ke liye KYC par navigate karne wala button nahi hona chahiye.
  const verifiedBranch = src.split("kycDone ? (")[2] || "";
  assert.equal(/navigate\("\/kyc"\)/.test(verifiedBranch.split(") : (")[0] || ""), false);
});

test("risk profile ke jawab top level par jate hain, answers ke andar nahi", () => {
  const src = readCode("../src/pages/riskProfile/RiskProfilingPage.jsx");
  // Backend (RiskProfileRequest) nau keys TOP LEVEL par mangta hai. `{ answers: {...} }`
  // bhejne se validator ko ek bhi field nahi milti thi aur nauon "required" ho jate the.
  assert.equal(/\{ answers: formattedAnswers \}/.test(src), false);
  assert.match(src, /const payload = formattedAnswers;/);
});

test("keyMap riskQuestions ke har id ko cover karta hai", () => {
  const page = read("../src/pages/riskProfile/RiskProfilingPage.jsx");
  const questions = read("../src/pages/riskProfile/riskQuestions.js");

  // Sirf active (non-commented) ids.
  const ids = questions
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .map((l) => l.match(/^\s*id:\s*(\d+),/))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  assert.equal(ids.length, 9);

  const mapped = [...page.matchAll(/^\s*(\d+):\s*"(q\d+_[a-z_]+)"/gm)].map((m) => Number(m[1]));
  for (const id of ids) {
    assert.ok(mapped.includes(id), `question id ${id} keyMap mein nahi hai — uska jawab chup chaap gir jayega`);
  }
});

test("frontend ki key names backend ke validator se milti hain", () => {
  const page = read("../src/pages/riskProfile/RiskProfilingPage.jsx");
  const request = fs.readFileSync(
    new URL("../../admin_php/app/Http/Requests/RiskProfileRequest.php", import.meta.url),
    "utf8"
  );
  const sent = [...page.matchAll(/"(q\d+_[a-z_]+)"/g)].map((m) => m[1]);
  const required = [...request.matchAll(/^\s*'(q\d+_[a-z_]+)'\s*=>\s*\[/gm)].map((m) => m[1]);
  assert.equal(required.length, 9);
  for (const key of required) {
    assert.ok(sent.includes(key), `${key} backend mangta hai magar frontend bhejta hi nahi`);
  }
});
