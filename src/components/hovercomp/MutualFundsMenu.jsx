import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Wallet,
  BarChart2,
  PieChart,
  Calculator,
  ArrowRight,
  Target,
  Rocket,
  ShoppingBasket,
  FileUp,
  HeartPulse,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import mfMenuImg from "../../assets/menu/fundMenu.svg";

import MenuItem from "./MenuItem";
import { MF_EXPLORE_PATH } from "../../utils/nodeApi";
import { MF_CATEGORY_MENU } from "../../utils/mfCollections";

// Client 2026-10-09 — Mutual Funds is the first menu, with Goal Based Investing, NFO and
// Curated Scheme Baskets under Investing, CAS Upload and Portfolio Health-Check under Tools,
// and the SEBI-category panel. Items both panels share are defined once here, so a page is
// only ever offered under one name. None of them is a /user/* route — the signed-out panel
// carries them too (noRedundancy.test pins that rule).
const INVESTING = [
  { icon: Target, title: "Goal Based Investing", desc: "Save towards a dated goal.", to: "/goals" },
  { icon: Rocket, title: "NFO — New Fund Offers", desc: "Schemes open for initial subscription.", to: "/nfo" },
  { icon: ShoppingBasket, title: "Curated Scheme Baskets", desc: "Several schemes, one order.", to: "/baskets" },
];
const CALCULATORS = { icon: Calculator, title: "All calculators", desc: "SIP, lumpsum, SWP and 15 more.", to: "/calculators" };

const panel = `
  fixed left-0 right-0 top-full z-50
  bg-white dark:bg-gray-900
  shadow-md dark:shadow-white/5
  border-t border-gray-200 dark:border-white/10
`;
const column = "space-y-3 pr-6 border-r border-slate-300 dark:border-white/10";
const heading = "font-semibold text-blue-950 dark:text-gray-100";

const items = (list, navigate) =>
  list.map((i) => <MenuItem key={i.to} icon={i.icon} title={i.title} desc={i.desc} onClick={() => navigate(i.to)} />);

// The SEBI categories, both panels. Each opens the collection page for that group.
const categories = (navigate) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
    {MF_CATEGORY_MENU.map((group) => (
      <div key={group.id}>
        <h3 className={heading}>{group.name}</h3>
        <p className="text-[11px] text-slate-500 dark:text-gray-400 mb-1.5">{group.subtext}</p>
        <ul className="space-y-1">
          {group.items.map((it) => (
            <li key={it.slug}>
              <button
                type="button"
                onClick={() => navigate(`/mutual_fund/collections/${it.slug}`)}
                className="w-full text-left rounded-md px-1.5 py-1 hover:bg-blue-50/70 dark:hover:bg-[var(--white-5)]"
              >
                <span className="text-[13px] font-medium text-blue-950 dark:text-gray-100">{it.name}</span>
                {it.badge && (
                  <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {it.badge}
                  </span>
                )}
                <span className="block text-[11px] text-slate-500 dark:text-gray-400">{it.subtext}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

// Client: "suitable category of schemes based on your risk profile". Worded as a
// suitability check, not a recommendation — a distributor may not advise.
const riskStrip = (navigate) => (
  <button
    type="button"
    onClick={() => navigate("/risk")}
    className="mt-6 w-full flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-left bg-blue-50 dark:bg-white/5 text-blue-900 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-white/10"
  >
    <ShieldCheck size={16} className="text-blue-700 dark:text-blue-400 shrink-0" />
    See which scheme categories suit your risk profile
    <ArrowRight size={14} className="ml-auto" />
  </button>
);

// The signed-in panel's body. The desktop hover panel and the phone Funds tab (MFDashboard,
// QA 8.2 — below 1024px a signed-in investor has no header) render this one block, so the
// two cannot drift. One column on a phone, three on desktop.
const signedInColumn = "space-y-3 lg:pr-6 lg:border-r border-slate-300 dark:border-white/10";

export function SignedInMfSections() {
  const navigate = useNavigate();
  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-[220px_220px_1fr] gap-6 lg:gap-8 text-sm">
      <div className={signedInColumn}>
        <h3 className={heading}>Investing</h3>
        {/* Audit #45 — "Invest → Lumpsum". Signed in, the only road to a one-time order
            was knowing a fund page has an Invest button. */}
        <MenuItem
          icon={Wallet}
          title="Invest: Lumpsum"
          desc="Pick a fund and invest a one-time amount."
          onClick={() => navigate(MF_EXPLORE_PATH)}
        />
        {/* A top-up is "Invest more" on a fund already held — the holdings list carries
            that button on every row; the flag only says why they landed there. */}
        <MenuItem
          icon={PlusCircle}
          title="Top-up"
          desc="Add to a fund you already hold."
          onClick={() => navigate("/user/mutual_fund/investments?topup=1")}
        />
        {items(INVESTING, navigate)}
      </div>

      <div className={signedInColumn}>
        <h3 className={heading}>Portfolio & Tools</h3>
        <MenuItem
          icon={BarChart2}
          title="My Investments"
          desc="Funds bought on this platform."
          onClick={() => navigate("/user/mutual_fund/investments")}
        />
        <MenuItem
          icon={FileUp}
          title="CAS Upload"
          desc="Import funds bought elsewhere from your CAS."
          onClick={() => navigate("/user/mutual_fund/external?cas=1")}
        />
        <MenuItem
          icon={HeartPulse}
          title="Portfolio Health-Check"
          desc="Platform and external folios, in one view."
          onClick={() => navigate("/user/mutual_fund/combined")}
        />
        {items([CALCULATORS], navigate)}
      </div>

      {categories(navigate)}
    </div>
    {riskStrip(navigate)}
    </>
  );
}

const MutualFundsMenu = ({ token }) => {
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setOpenMenu(false);
  }, [location.pathname]);

  const redirect = () => {
    if (token) navigate("/user/mutual_fund");
  };

  const isMfActive = location.pathname.startsWith("/user/mutual_fund");

  return (
    <div
      className="relative group"
      onMouseEnter={() => setOpenMenu(true)}
      onMouseLeave={() => setOpenMenu(false)}
    >
      {/* NAV ITEM */}
      <button
        onClick={redirect}
        className={`
          h-16 px-4 font-semibold cursor-pointer transition
          ${
            isMfActive
              ? "text-blue-600 dark:text-blue-400"
              : "text-blue-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
          }
        `}
      >
        Mutual Funds
      </button>

      {/* SIGNED-IN PANEL — portfolio first, then the shared investing / tools / categories. */}
      {openMenu && token && (
        <div className={panel}>
          <div className="max-w-[1280px] mx-auto px-10 py-6">
            <SignedInMfSections />
          </div>
        </div>
      )}

      {/* MEGA MENU */}
      {openMenu && !token && (
        <div className={panel}>
          <div className="max-w-[1280px] mx-auto px-10 py-6">
            <div className="grid grid-cols-[240px_220px_220px_1fr] gap-8 text-sm">
              {/* ===== LEFT INFO PANEL ===== */}
              <div className="pr-6 border-r border-slate-300 dark:border-white/10">
                <div className="w-full h-24 mb-3 rounded-xl overflow-hidden">
                  <img src={mfMenuImg} alt="Mutual Funds" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-lg font-semibold text-blue-950 dark:text-gray-100 mb-2">Mutual Funds</h2>
                <p className="text-sm leading-relaxed mb-4 text-slate-600 dark:text-gray-400">
                  Regular plans across equity, debt and hybrid categories, through an AMFI-registered distributor.
                </p>
                <button
                  onClick={() => navigate("/user/mutual_fund/explore")}
                  className="
                    inline-flex items-center gap-1 px-4 py-1.5 rounded-full
                    bg-gray-200 dark:bg-white/10
                    text-blue-900 dark:text-gray-200
                    text-sm font-medium
                    hover:bg-gray-300 dark:hover:bg-white/15
                  "
                >
                  Explore Funds <ArrowRight size={14} />
                </button>
              </div>

              {/* Investing */}
              <div className={column}>
                <h3 className={heading}>Investing</h3>
                <MenuItem
                  icon={TrendingUp}
                  title="SIP Investment"
                  desc="Build wealth with disciplined investing."
                  onClick={() => navigate("/sip-investment")}
                />
                <MenuItem
                  icon={Wallet}
                  title="One-Time Investment"
                  desc="Invest lump sum during opportunities."
                  onClick={() => navigate("/one-time-investment")}
                />
                {items(INVESTING, navigate)}
              </div>

              {/* Tools */}
              <div className={column}>
                <h3 className={heading}>Tools</h3>
                {/* /track is the public CAS page: signed in it opens the import, otherwise it
                    asks the visitor to register first. */}
                <MenuItem
                  icon={PieChart}
                  title="CAS Upload & Portfolio Health-Check"
                  desc="Bring every folio you hold into one view."
                  onClick={() => navigate("/track")}
                />
                {items([CALCULATORS], navigate)}
              </div>

              {categories(navigate)}
            </div>
            {riskStrip(navigate)}
          </div>
        </div>
      )}
    </div>
  );
};

export default MutualFundsMenu;
