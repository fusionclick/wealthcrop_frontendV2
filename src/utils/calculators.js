import { annuityFactor, clampNum, num } from "./calcSafe.js";

/**
 * Income Tax — FY 2025-26 / AY 2026-27 (Budget 2025 slabs).
 * ponytail: sirf salaried/individual (<60) ka case. Senior citizen ki alag old-regime
 * slabs aur surcharge ka marginal relief model nahi kiya — chahiye to yahin add karna hai.
 */
const NEW_SLABS = [
  [400000, 0], [800000, 0.05], [1200000, 0.1],
  [1600000, 0.15], [2000000, 0.2], [2400000, 0.25], [Infinity, 0.3],
];
const OLD_SLABS = [[250000, 0], [500000, 0.05], [1000000, 0.2], [Infinity, 0.3]];

const slabTax = (income, slabs) => {
  let tax = 0;
  let prev = 0;
  for (const [cap, rate] of slabs) {
    if (income <= prev) break;
    tax += (Math.min(income, cap) - prev) * rate;
    prev = cap;
  }
  return tax;
};

// 50L se upar surcharge. New regime mein 25% par capped hai, old mein 37% tak jata hai.
const surchargeRate = (taxable, regime) => {
  if (taxable <= 5000000) return 0;
  if (taxable <= 10000000) return 0.1;
  if (taxable <= 20000000) return 0.15;
  if (taxable <= 50000000) return 0.25;
  return regime === "new" ? 0.25 : 0.37;
};

/**
 * QA 10.3 — "enter 0 and a very large number → no NaN, no Infinity, no crash".
 *
 * Every horizon below bounds a loop, and each one clamped a FLOOR with no ceiling. A typed
 * 999999999 in a years field therefore ran the loop a billion times and froze the tab — that
 * is the crash QA hit, and no amount of guarding the printed output can reach it, because the
 * page never gets to render. 100 years is past the end of any real product and still returns
 * instantly. Clamping only changes the answer for inputs that had no answer before.
 */
const MAX_YEARS = 100;
const MAX_MONTHS = MAX_YEARS * 12;

const clampYears = (v, min = 1) => Math.min(MAX_YEARS, Math.max(min, Math.round(Number(v) || 0)));
const clampMonths = (v, min = 1) => Math.min(MAX_MONTHS, Math.max(min, Math.round(Number(v) || 0)));

/**
 * Ek fixed monthly SIP saal-ba-saal kya banti hai: kitna daala (invested) aur kitna
 * bana (value). Dono jagah — home page ka growth chart aur goal planner — yahi chalta hai.
 */
export const sipSeries = ({ monthly, years, cagr }) => {
  const yrs = clampYears(years);
  const m = Math.max(0, Number(monthly) || 0);
  const r = (Number(cagr) || 0) / 100 / 12;

  const out = [];
  for (let i = 1; i <= yrs; i++) {
    const months = i * 12;
    // r = 0 par annuity formula 0/0 hai — tab jitna daala utna hi bana.
    const value = r === 0 ? m * months : m * ((Math.pow(1 + r, months) - 1) / r);
    out.push({ year: `Y${i}`, invested: Math.round(m * months), value: Math.round(value) });
  }
  return out;
};

/**
 * Goal SIP — kitna monthly chahiye taake `years` baad goal poora ho.
 * Goal aaj ki qeemat mein diya jata hai, is liye pehle use inflation par aage le jate hain;
 * warna inflation slider hilta hai aur natija wahi rehta hai.
 */
export const sipForGoal = ({ goal, years, cagr, inflation = 0, current = 0 }) => {
  const yrs = clampYears(years);
  const target = Math.max(0, Number(goal) || 0) * Math.pow(1 + (Number(inflation) || 0) / 100, yrs);
  const n = yrs * 12;
  const r = (Number(cagr) || 0) / 100 / 12;
  // What is already saved keeps compounding on its own, so only the shortfall needs a SIP.
  // Defaults to 0, which leaves every existing caller's answer unchanged.
  const currentFV = Math.max(0, Number(current) || 0) * Math.pow(1 + r, n);
  const shortfall = Math.max(0, target - currentFV);
  // r = 0 par annuity formula 0/0 hai — us case mein goal barabar hisson mein bat jata hai.
  const monthlySIP = r === 0 ? shortfall / n : (shortfall * r) / (Math.pow(1 + r, n) - 1);

  const series = sipSeries({ monthly: monthlySIP, years: yrs, cagr }).map((p) => ({
    year: p.year,
    total: p.value,
    principal: p.invested,
  }));

  return {
    target: Math.round(target),
    monthlySIP: Math.round(monthlySIP),
    currentFutureValue: Math.round(currentFV),
    totalInvested: Math.round(monthlySIP * n),
    estimatedGrowth: Math.round(target - monthlySIP * n),
    futureValue: Math.round(target),
    series,
  };
};

/**
 * EPF — employee + employer monthly contributions, interest credited yearly on the
 * running balance (that is how EPFO does it: contributions accrue monthly, interest
 * once a year).
 *
 * ponytail: employer's share is taken at face value from `employerPct`. In reality
 * 8.33% of it is diverted to EPS (pension) and only the rest reaches EPF, so a user
 * entering the statutory 12% here sees the un-split figure. Add the EPS split when
 * someone needs a pension projection — it changes the answer, not the shape.
 */
export const epf = ({ basic, employeePct = 12, employerPct = 12, years, rate = 8.25 }) => {
  const m = Math.max(0, Number(basic) || 0);
  const yrs = clampYears(years);
  const eeRate = Math.max(0, Number(employeePct) || 0) / 100;
  const erRate = Math.max(0, Number(employerPct) || 0) / 100;
  const r = Math.max(0, Number(rate) || 0) / 100;

  const eeMonthly = m * eeRate;
  const erMonthly = m * erRate;
  let balance = 0;
  for (let y = 0; y < yrs; y++) {
    balance += (eeMonthly + erMonthly) * 12;
    balance *= 1 + r;
  }
  const employee = eeMonthly * 12 * yrs;
  const employer = erMonthly * 12 * yrs;
  return {
    employee: Math.round(employee),
    employer: Math.round(employer),
    interest: Math.round(balance - employee - employer),
    total: Math.round(balance),
  };
};

/**
 * Emergency fund — how big it should be, and what it takes to get there.
 *
 * ponytail: `buildMonths` is how long the investor gives themselves to close the gap,
 * because "monthly savings required" has no answer without a horizon and the SRS does
 * not name one.
 *
 * Audit #68 — the expected return used to move nothing but the "income once parked" line, so
 * any rate could be typed and the monthly figure never changed. Money parked in a liquid or
 * overnight fund while the fund is being built does earn it: the deposits and what is already
 * saved both compound until the deadline, so the monthly figure now counts that. The TARGET is
 * still never discounted by the return — the full amount has to be there the month it is
 * needed. At 0% this is exactly the old gap / months.
 */
export const emergencyFund = ({ expenses, months = 6, current = 0, rate = 0, buildMonths = 12 }) => {
  const need = Math.max(0, Number(expenses) || 0) * clampMonths(months);
  const have = Math.max(0, Number(current) || 0);
  const gap = Math.max(0, need - have);
  const build = clampMonths(buildMonths);
  const r = clampNum(rate, 0, 100, 0) / 100;
  const monthly = r / 12;
  const stillShort = Math.max(0, need - have * (1 + monthly) ** build);
  return {
    required: Math.round(need),
    shortfall: Math.round(gap),
    monthlySaving: Math.round(stillShort / annuityFactor(monthly, build)),
    // Only meaningful once the fund is built and parked somewhere.
    annualIncomeIfInvested: Math.round(need * r),
    funded: gap === 0,
  };
};

/**
 * Audit #68 — which catalogue rows to offer as a home for the emergency fund.
 *
 * The master lists every plan and option of a fund as its own scheme, so this keeps one line
 * per fund, Growth option only (an IDCW option pays the money back out, the opposite of
 * parking it). ponytail: the exclusions are name heuristics — AMFI rows carry no "open for
 * purchase" flag, so ETFs (bought on an exchange, not as an MF order), unclaimed-money plans
 * and the closed retail/institutional plans are known only by what they are called. Swap in a
 * BSE purchase flag once every row has one.
 */
const NOT_FOR_PARKING = /\b(?:etf|bees)\b|unclaimed|institutional|retail/i;

export const parkingFunds = (rows, n = 3) => {
  if (!Array.isArray(rows)) return [];
  const seen = new Set();
  const out = [];
  for (const f of rows) {
    if (out.length >= n) break;
    if (f?.payout !== "Growth" || NOT_FOR_PARKING.test(`${f.name || ""} ${f.scheme_option || ""}`)) continue;
    // "ICICI Prudential Liquid Fund -" and "ICICI Prudential Liquid Fund" are one fund.
    const key = String(f.name || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
};

/**
 * The year-by-year path both life-goal planners draw: what is saved today, grown monthly at
 * `monthlyRate` with `monthlySIP` added each month, to the end of each year of age.
 */
const savingYears = ({ age, years, savings, monthlyRate, monthlySIP }) => {
  const yearGrowth = (1 + monthlyRate) ** 12;
  const yearOfSip = monthlySIP * annuityFactor(monthlyRate, 12);
  let balance = savings;
  const rows = [{ age, phase: "Today", paidIn: 0, paidOut: 0, balance }];
  for (let y = 1; y <= years; y++) {
    balance = balance * yearGrowth + yearOfSip;
    rows.push({ age: age + y, phase: "Saving", paidIn: monthlySIP * 12, paidOut: 0, balance });
  }
  return rows;
};

// Whole rupees for the screen. Math.max also turns a float-noise "-0" at the end of a fully
// spent plan into a plain 0 — toLocaleString prints -0 as "-0".
const rupees = (rows) =>
  rows.map((r) => ({
    ...r,
    paidIn: Math.round(r.paidIn),
    paidOut: Math.round(r.paidOut),
    balance: Math.max(0, Math.round(r.balance)),
  }));

// Ages are whole years (the projection steps a year at a time) and 120 bounds every loop.
const wholeAge = (v) => Math.round(clampNum(v, 0, 120, 0));

/**
 * Audit #66 — retirement plan, with the inputs and outputs the spec names: the corpus needed
 * on retirement day, what today's savings grow to by then, the monthly SIP that closes the
 * gap, and the path there and back down, year by year.
 *
 * The old page hid a fixed 6% post-retirement return and a fixed 30-year retirement; both are
 * inputs now (the second as life expectancy). Before retirement everything compounds monthly
 * at the pre-retirement return — the convention sipSeries and sipForGoal already use, so the
 * tools agree. In retirement each year's expenses are drawn at the start of that year and keep
 * rising with inflation, while what is left earns the post-retirement return. The corpus is
 * exactly what that stream costs, so a plan that follows the SIP runs out in the year of the
 * life expectancy, not before.
 */
export const retirementPlan = ({
  currentAge, retirementAge, lifeExpectancy, monthlyExpense,
  inflation = 0, preReturn = 0, postReturn = 0, currentSavings = 0,
}) => {
  const age = wholeAge(currentAge);
  const retire = wholeAge(retirementAge);
  const life = wholeAge(lifeExpectancy);
  if (retire <= age) return { error: "Retirement age has to be later than your current age." };
  if (life <= retire) return { error: "Life expectancy has to be later than your retirement age." };

  const yearsToRetire = retire - age;
  const yearsRetired = life - retire;
  const g = clampNum(inflation, 0, 100, 0) / 100;
  const pre = clampNum(preReturn, 0, 100, 0) / 100 / 12;
  const post = clampNum(postReturn, 0, 100, 0) / 100;
  const savings = Math.max(0, num(currentSavings));

  const expenseAtRetirement = Math.max(0, num(monthlyExpense)) * (1 + g) ** yearsToRetire;
  const firstYear = expenseAtRetirement * 12;
  // firstYear × Σ q^k over the retirement years, q = (1+g)/(1+post). q = 1 (return equals
  // inflation) is the 0/0 limit of the closed form: every year then costs the first year's sum.
  const q = (1 + g) / (1 + post);
  const corpus = q === 1 ? firstYear * yearsRetired : (firstYear * (1 - q ** yearsRetired)) / (1 - q);

  const months = yearsToRetire * 12;
  const savingsAtRetirement = savings * (1 + pre) ** months;
  const monthlySIP = Math.max(0, corpus - savingsAtRetirement) / annuityFactor(pre, months);

  const projection = savingYears({ age, years: yearsToRetire, savings, monthlyRate: pre, monthlySIP });
  let balance = projection.at(-1).balance;
  for (let y = 0; y < yearsRetired; y++) {
    const spend = firstYear * (1 + g) ** y;
    balance = (balance - spend) * (1 + post);
    projection.push({ age: retire + y + 1, phase: "Retired", paidIn: 0, paidOut: spend, balance });
  }

  return {
    // The ages actually used — a typed 60.4 is planned as 60, and the page labels it so.
    retirementAge: retire,
    yearsToRetire,
    yearsRetired,
    expenseAtRetirement: Math.round(expenseAtRetirement),
    corpus: Math.round(corpus),
    savingsAtRetirement: Math.round(savingsAtRetirement),
    monthlySIP: Math.round(monthlySIP),
    projection: rupees(projection),
  };
};

/**
 * Audit #67 — education plan: the child's age now and when the course starts, the fee per
 * year in today's money and how many years the course runs. Returns the total needed by the
 * start, what today's savings grow to by then, the monthly SIP for the rest, and the path.
 *
 * Each year's fee is inflated to the year it is actually paid, so a four-year course costs
 * more than four times its first year. Once the course starts the money is treated as parked
 * safely and drawn as fees fall due — not as still earning the market return, the same rule
 * the emergency fund keeps for money that will be needed soon.
 */
export const educationPlan = ({
  childAge, startAge, annualCost, courseYears,
  inflation = 0, expectedReturn = 0, currentSavings = 0,
}) => {
  const age = wholeAge(childAge);
  const start = wholeAge(startAge);
  const course = Math.round(clampNum(courseYears, 0, 20, 0));
  if (start <= age) return { error: "Higher education has to start after the child's current age." };
  if (course < 1) return { error: "The course has to last at least one year." };

  const yearsToStart = start - age;
  const g = clampNum(inflation, 0, 100, 0) / 100;
  const r = clampNum(expectedReturn, 0, 100, 0) / 100 / 12;
  const savings = Math.max(0, num(currentSavings));
  const feeToday = Math.max(0, num(annualCost));

  const fees = Array.from({ length: course }, (_, k) => feeToday * (1 + g) ** (yearsToStart + k));
  const totalNeeded = fees.reduce((a, b) => a + b, 0);
  const months = yearsToStart * 12;
  const savingsAtStart = savings * (1 + r) ** months;
  const monthlySIP = Math.max(0, totalNeeded - savingsAtStart) / annuityFactor(r, months);

  const projection = savingYears({ age, years: yearsToStart, savings, monthlyRate: r, monthlySIP });
  let balance = projection.at(-1).balance;
  fees.forEach((fee, k) => {
    balance -= fee;
    projection.push({ age: start + k + 1, phase: "Studying", paidIn: 0, paidOut: fee, balance });
  });

  return {
    startAge: start,
    yearsToStart,
    firstYearFee: Math.round(fees[0]),
    totalNeeded: Math.round(totalNeeded),
    savingsAtStart: Math.round(savingsAtStart),
    monthlySIP: Math.round(monthlySIP),
    projection: rupees(projection),
  };
};

/**
 * Audit #69 — FD maturity at the bank's own compounding frequency (`perYear`: 12 monthly,
 * 4 quarterly, 2 half-yearly, 1 yearly). The page compounded yearly only, but most Indian
 * banks compound quarterly, which pays more at the same rate — so it undersold every FD.
 * Paise are kept; the page rounds for display.
 */
export const fdMaturity = ({ amount, rate, years, perYear = 4 }) => {
  const p = Math.max(0, num(amount));
  const r = clampNum(rate, 0, 100, 0) / 100;
  // QA 10.3 — the tenure drives an exponent, so it is bounded like every other horizon here.
  const y = clampNum(years, 0, MAX_YEARS, 0);
  const m = Math.round(clampNum(perYear, 1, 365, 4));
  const maturity = p * (1 + r / m) ** (m * y);
  return { maturity, interest: maturity - p };
};

export const computeTax = ({ gross, regime = "new", deductions = 0, salaried = true }) => {
  const g = Math.max(0, Number(gross) || 0);
  const isNew = regime === "new";
  const std = salaried ? (isNew ? 75000 : 50000) : 0;
  // New regime mein 80C/80D/HRA jaisi deductions allowed nahi hain.
  const taxable = Math.max(0, g - std - (isNew ? 0 : Math.max(0, Number(deductions) || 0)));

  let tax = slabTax(taxable, isNew ? NEW_SLABS : OLD_SLABS);
  const rebateLimit = isNew ? 1200000 : 500000;
  const rebateCap = isNew ? 60000 : 12500;

  if (taxable <= rebateLimit) {
    tax = Math.max(0, tax - rebateCap); // 87A rebate
  } else if (isNew) {
    // Marginal relief: 12L ke thora upar tax, extra income se zyada nahi ho sakta.
    tax = Math.min(tax, taxable - rebateLimit);
  }

  const surcharge = tax * surchargeRate(taxable, regime);
  const cess = (tax + surcharge) * 0.04;
  const total = tax + surcharge + cess;

  return {
    std,
    taxable,
    slab: Math.round(tax),
    surcharge: Math.round(surcharge),
    cess: Math.round(cess),
    total: Math.round(total),
    inHand: Math.round(g - total),
    effectiveRate: g ? Number(((total / g) * 100).toFixed(2)) : 0,
  };
};

/** Dono regime chala kar sasta wala batata hai. */
export const compareRegimes = (input) => {
  const nw = computeTax({ ...input, regime: "new" });
  const old = computeTax({ ...input, regime: "old" });
  return { new: nw, old, better: nw.total <= old.total ? "new" : "old", saving: Math.abs(nw.total - old.total) };
};

/**
 * Rent vs Buy. Dono taraf mahine ka kharcha barabar mana jata hai:
 * kharidne wala EMI + maintenance deta hai, kiraye wala rent deta hai aur bacha hua
 * paisa (down payment + har mahine ka farq) invest karta hai. Aakhir mein kharidne
 * wale ke paas ghar hai, kiraye wale ke paas corpus — jo bara wo jeeta.
 * ponytail: tax benefit (24b/80C) aur transaction cost shamil nahi. Chahiye to
 * `buyerMonthly` mein se interest ka tax-saving ghata dena.
 */
export const rentVsBuy = ({
  price, downPct = 20, rate = 8.5, years = 20,
  rent, rentHike = 5, appreciation = 6, invReturn = 12, maintPct = 1,
}) => {
  const P = Math.max(0, Number(price) || 0);
  const down = (P * downPct) / 100;
  const loan = P - down;
  // One clamped horizon for both the loop and the appreciation exponent. They were derived
  // separately from the raw `years`, so a huge tenure gave a bounded loop but an Infinity
  // homeValue — the two halves of the comparison disagreed about how long it ran.
  const yrs = clampYears(years);
  const n = yrs * 12;
  const r = rate / 12 / 100;
  const emi = r > 0 ? (loan * r * (1 + r) ** n) / ((1 + r) ** n - 1) : loan / n;
  const monthlyMaint = (P * maintPct) / 100 / 12;
  const buyerMonthly = emi + monthlyMaint;

  const mr = invReturn / 12 / 100;
  let corpus = down;
  let monthlyRent = Math.max(0, Number(rent) || 0);
  let rentPaid = 0;

  for (let m = 0; m < n; m++) {
    if (m > 0 && m % 12 === 0) monthlyRent *= 1 + rentHike / 100;
    corpus = corpus * (1 + mr) + Math.max(0, buyerMonthly - monthlyRent);
    rentPaid += monthlyRent;
  }

  // Round pehle, phir compare — warna screen par dikha gap 1 rupee off ho jata hai.
  const homeValue = Math.round(P * (1 + appreciation / 100) ** yrs);
  const rentCorpus = Math.round(corpus);
  return {
    emi: Math.round(emi),
    down: Math.round(down),
    buyerMonthly: Math.round(buyerMonthly),
    totalEmi: Math.round(emi * n),
    totalMaint: Math.round(monthlyMaint * n),
    homeValue,
    rentCorpus,
    rentPaid: Math.round(rentPaid),
    lastRent: Math.round(monthlyRent),
    better: homeValue >= rentCorpus ? "buy" : "rent",
    gap: Math.abs(homeValue - rentCorpus),
  };
};
