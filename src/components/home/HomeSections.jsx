import { useState } from "react";
import { Link } from "react-router-dom";
import { Target, ShieldCheck, ShoppingBasket, Wallet, LineChart, IdCard, Users, FileText, MessageSquareWarning, FileUp, Smartphone } from "lucide-react";
import { useDistributorIdentity } from "../DistributorIdentity";
import { MF_CATEGORY_MENU } from "../../utils/mfCollections";
import { useAppLinks } from '../../hooks/useAppLinks';

// Client 2026-10-09 — the homepage sections between the hero and the FAQ, in the client's
// order: trust strip, 5-step journey, (planner), category grid, LTCG tax shield, service
// desk, CAS health-check banner, app banner. Small and static, so one file.

const card = "rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5";
const h2 = "text-2xl md:text-3xl font-bold text-blue-950 dark:text-gray-100";
const sub = "mt-2 text-sm text-slate-600 dark:text-gray-400";

/** AMFI registration from the server (never bundled — see DistributorIdentity) + exchange. */
export function TrustStrip() {
  const info = useDistributorIdentity();
  const items = [
    info?.arn ? `AMFI-registered Mutual Fund Distributor · ${info.arn}` : null,
    "Orders placed through BSE StAR MF",
    "Units allotted in your own name by the fund house",
    "Regular plans only",
  ].filter(Boolean);
  return (
    <section className="border-y border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#020617] px-6 py-4">
      <ul className="max-w-6xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium text-blue-950 dark:text-gray-200">
        {items.map((t) => (
          <li key={t} className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" /> {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

const JOURNEY = [
  { icon: Target, title: "Goal", text: "Name what you are saving for, by when and how much.", to: "/goals", cta: "Set a goal" },
  { icon: ShieldCheck, title: "Suitability", text: "Answer a short risk profile so only suitable scheme categories are shown.", to: "/risk", cta: "Check suitability" },
  { icon: ShoppingBasket, title: "Basket", text: "Pick one scheme or a curated basket of several.", to: "/baskets", cta: "See baskets" },
  { icon: Wallet, title: "Invest", text: "Lumpsum or SIP, placed through BSE StAR MF.", to: "/user/mutual_fund/explore", cta: "Explore funds" },
  { icon: LineChart, title: "Track", text: "Follow every holding, its XIRR and your goal's progress.", to: "/user/mutual_fund/investments", cta: "My investments" },
];

/** Goal ➔ Suitability ➔ Basket ➔ Invest ➔ Track — a step opens its own explanation. */
export function GuidedJourney() {
  const [step, setStep] = useState(0);
  const s = JOURNEY[step];
  return (
    <section className="py-16 px-6 bg-white dark:bg-[#020617]">
      <div className="max-w-6xl mx-auto">
        <h2 className={`${h2} text-center`}>Your investing journey in 5 steps</h2>
        <ol className="mt-8 grid grid-cols-5 gap-2">
          {JOURNEY.map((j, i) => (
            <li key={j.title}>
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={i === step ? "step" : undefined}
                className={`w-full flex flex-col items-center gap-2 rounded-xl px-2 py-3 transition ${
                  i === step ? "bg-blue-50 dark:bg-white/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <span
                  className={`h-11 w-11 rounded-full flex items-center justify-center ${
                    i <= step ? "bg-blue-900 text-white dark:bg-blue-500" : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-gray-300"
                  }`}
                >
                  <j.icon size={20} />
                </span>
                <span className="text-xs sm:text-sm font-semibold text-blue-950 dark:text-gray-100">
                  {i + 1}. {j.title}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className={`${card} mt-4 p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between`}>
          <p className="text-slate-700 dark:text-gray-300">{s.text}</p>
          <Link to={s.to} className="shrink-0 px-5 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 dark:bg-blue-500 text-white text-sm font-semibold">
            {s.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Curated baskets + the SEBI category groups (the same list as the Mutual Funds menu). */
export function CategoryGrid() {
  return (
    <section className="py-16 px-6 bg-slate-50 dark:bg-[#020617]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className={h2}>Curated Scheme Baskets &amp; Categories</h2>
            <p className={sub}>Schemes grouped the way SEBI categorises them, for your own evaluation.</p>
          </div>
          <Link to="/baskets" className="self-start md:self-auto px-5 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 dark:bg-blue-500 text-white text-sm font-semibold">
            Curated Scheme Baskets
          </Link>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MF_CATEGORY_MENU.map((g) => (
            <div key={g.id} className={`${card} p-5`}>
              <h3 className="font-semibold text-blue-950 dark:text-gray-100">{g.name}</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">{g.subtext}</p>
              <ul className="mt-3 space-y-1.5">
                {g.items.map((it) => (
                  <li key={it.slug}>
                    <Link to={`/mutual_fund/collections/${it.slug}`} className="text-sm text-blue-800 dark:text-blue-300 hover:underline">
                      {it.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Equity long-term gains: ₹1.25 lakh exempt per financial year, 12.5% above it (Budget 2024;
// unchanged by Budget 2026 for FY 2026-27). Cess and surcharge left out — it is an estimate.
const LTCG_EXEMPT = 125000;
const LTCG_RATE = 0.125;

/** How much of this year's exemption is left, and what booking that much gain would save. */
export function TaxShield() {
  const [booked, setBooked] = useState("");
  const [unrealised, setUnrealised] = useState("");
  const left = Math.max(0, LTCG_EXEMPT - (Number(booked) || 0));
  const harvest = Math.min(left, Math.max(0, Number(unrealised) || 0));
  const inr = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
  const input = "w-full mt-1 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-blue-950 dark:text-gray-100";
  return (
    <section className="py-16 px-6 bg-white dark:bg-[#020617]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className={h2}>LTCG Tax Shield</h2>
          <p className={sub}>
            Long-term gains on equity funds are tax-free up to {inr(LTCG_EXEMPT)} each financial year and taxed at 12.5% above it.
            Booking gains within that limit before 31 March, and reinvesting, resets your cost without tax.
          </p>
          <p className="mt-3 text-xs text-slate-500 dark:text-gray-400">An estimate before cess and surcharge, not tax advice. Confirm with a tax professional.</p>
        </div>
        <div className={`${card} p-6 space-y-4`}>
          <label className="block text-sm text-slate-700 dark:text-gray-300">
            Long-term gains already booked this year (₹)
            <input type="number" min="0" inputMode="decimal" value={booked} onChange={(e) => setBooked(e.target.value)} className={input} placeholder="0" />
          </label>
          <label className="block text-sm text-slate-700 dark:text-gray-300">
            Unrealised long-term gains in your equity funds (₹)
            <input type="number" min="0" inputMode="decimal" value={unrealised} onChange={(e) => setUnrealised(e.target.value)} className={input} placeholder="e.g. 200000" />
          </label>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 dark:bg-white/5 p-3">
              <p className="text-slate-500 dark:text-gray-400">Gain you can book tax-free</p>
              <p className="text-lg font-semibold text-blue-950 dark:text-gray-100">{inr(harvest)}</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-white/5 p-3">
              <p className="text-slate-500 dark:text-gray-400">Tax it keeps out of a later sale</p>
              <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">{inr(harvest * LTCG_RATE)}</p>
            </div>
          </div>
          <Link to="/reports" className="inline-block text-sm font-semibold text-blue-800 dark:text-blue-300 hover:underline">
            See your capital gains report →
          </Link>
        </div>
      </div>
    </section>
  );
}

const DESK = [
  { icon: IdCard, title: "Digital KYC & bank details", text: "Complete or update KYC and your bank account online.", to: "/kyc" },
  { icon: Users, title: "Nominee audit", text: "Check every folio has a nominee, and update it.", to: "/profile/nominee_details" },
  { icon: Users, title: "Family folios", text: "Add family members' accounts and switch between them.", to: "/profile" },
  { icon: FileText, title: "Statements", text: "Account statement, P&L and capital gains.", to: "/reports" },
  { icon: MessageSquareWarning, title: "Raise a request", text: "Service requests and grievances, tracked to closure.", to: "/support/complaint" },
];

/** Family Folio & Digital Service Desk — non-transaction services in one place. */
export function ServiceDesk() {
  return (
    <section className="py-16 px-6 bg-slate-50 dark:bg-[#020617]">
      <div className="max-w-6xl mx-auto">
        <h2 className={h2}>Family Folio &amp; Digital Service Desk</h2>
        <p className={sub}>Everything that is not a purchase: KYC, bank, nominees, statements and requests.</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {DESK.map((d) => (
            <Link key={d.title} to={d.to} className={`${card} p-5 hover:border-blue-400 transition`}>
              <d.icon size={22} className="text-blue-800 dark:text-blue-300" />
              <h3 className="mt-3 font-semibold text-blue-950 dark:text-gray-100">{d.title}</h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-gray-400">{d.text}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Signed-in investors can open the CAS importer directly. */
export function CasBanner() {
  return (
    <section className="px-6 py-12 bg-white dark:bg-[#020617]">
      <div className="max-w-6xl mx-auto rounded-2xl bg-blue-950 dark:bg-white/5 dark:border dark:border-white/10 text-white p-8 flex flex-col md:flex-row md:items-center gap-6 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Health-Check from your CAS</h2>
          <p className="mt-2 text-sm text-blue-100 dark:text-gray-400">
            Upload your Consolidated Account Statement to see funds held anywhere — overlap, allocation and returns in one view.
          </p>
        </div>
        <Link to={localStorage.getItem("token") ? "/user/mutual_fund/external?cas=1" : "/track"} className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-blue-950 dark:bg-blue-500 dark:text-white text-sm font-semibold">
          <FileUp size={16} /> Upload CAS
        </Link>
      </div>
    </section>
  );
}

// The Android destination can be a directly hosted WebView APK or a published store listing.

export function AppBanner() {
  const { appStore, playStore, androidLabel } = useAppLinks();
  const stores = [
    ["App Store (iOS)", appStore],
    [androidLabel, playStore],
  ].filter(([, url]) => url);
  return (
    <section className="px-6 py-12 bg-slate-50 dark:bg-[#020617]">
      <div className={`${card} max-w-6xl mx-auto p-8 flex flex-col md:flex-row md:items-center gap-6 justify-between`}>
        <div className="flex items-start gap-4">
          <Smartphone size={36} className="text-blue-800 dark:text-blue-300 shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-blue-950 dark:text-gray-100">Wealthcrop on your phone</h2>
            <p className={sub}>{stores.length ? "Open Wealthcrop on your phone to invest, track and raise requests." : "The Android APK download link will appear here when ready."}</p>
          </div>
        </div>
        {stores.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {stores.map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-lg bg-blue-950 dark:bg-blue-500 text-white text-sm font-semibold">
                {label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
