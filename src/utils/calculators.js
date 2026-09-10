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
 * Ek fixed monthly SIP saal-ba-saal kya banti hai: kitna daala (invested) aur kitna
 * bana (value). Dono jagah — home page ka growth chart aur goal planner — yahi chalta hai.
 */
export const sipSeries = ({ monthly, years, cagr }) => {
  const yrs = Math.max(1, Math.round(Number(years) || 0));
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
export const sipForGoal = ({ goal, years, cagr, inflation = 0 }) => {
  const yrs = Math.max(1, Math.round(Number(years) || 0));
  const target = Math.max(0, Number(goal) || 0) * Math.pow(1 + (Number(inflation) || 0) / 100, yrs);
  const n = yrs * 12;
  const r = (Number(cagr) || 0) / 100 / 12;
  // r = 0 par annuity formula 0/0 hai — us case mein goal barabar hisson mein bat jata hai.
  const monthlySIP = r === 0 ? target / n : (target * r) / (Math.pow(1 + r, n) - 1);

  const series = sipSeries({ monthly: monthlySIP, years: yrs, cagr }).map((p) => ({
    year: p.year,
    total: p.value,
    principal: p.invested,
  }));

  return {
    target: Math.round(target),
    monthlySIP: Math.round(monthlySIP),
    totalInvested: Math.round(monthlySIP * n),
    estimatedGrowth: Math.round(target - monthlySIP * n),
    futureValue: Math.round(target),
    series,
  };
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
  const n = Math.max(1, Math.round(years * 12));
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
  const homeValue = Math.round(P * (1 + appreciation / 100) ** years);
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
