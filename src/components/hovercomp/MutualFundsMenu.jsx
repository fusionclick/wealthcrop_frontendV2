import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Wallet,
  BarChart2,
  Shield,
  Layers,
  PieChart,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import mfMenuImg from "../../assets/menu/fundMenu.svg";

import MenuItem from "./MenuItem";
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


const isStocksActive = location.pathname.startsWith("/user/mutual_fund");


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
      isStocksActive
        ? "text-blue-600 dark:text-blue-400"
        : "text-blue-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
    }
  `}
>
  Mutual Funds
</button>


      {/* PORTFOLIO DROPDOWN — logged in par mega menu ki jagah sirf do options */}
      {openMenu && token && (
        <div
          className="
            absolute left-0 top-full z-50 w-72 p-2
            rounded-xl border border-gray-200 dark:border-white/10
            bg-white dark:bg-gray-900 shadow-lg
          "
        >
          {/* Every other description in the header is English; these three were the only
              Hinglish ones on the page. */}
          <MenuItem
            icon={BarChart2}
            title="Internal Portfolio"
            desc="Funds bought on this platform."
            onClick={() => navigate("/user/mutual_fund/investments")}
          />
          <MenuItem
            icon={Layers}
            title="External Portfolio"
            desc="Funds bought elsewhere — tracked, not transactable."
            onClick={() => navigate("/user/mutual_fund/external")}
          />
          <MenuItem
            icon={PieChart}
            title="Combined Portfolio"
            desc="Internal and external, in one view."
            onClick={() => navigate("/user/mutual_fund/combined")}
          />
        </div>
      )}

      {/* MEGA MENU */}
      {openMenu && !token && (
        <div
          className="
            fixed left-0 right-0 top-full z-50
            bg-white dark:bg-gray-900
            shadow-md dark:shadow-white/5
            border-t border-gray-200 dark:border-white/10
          "
        >
          <div className="max-w-[1280px] mx-auto px-10 py-8">

            {/* =============== ONE ROW LAYOUT =============== */}
            <div className="grid grid-cols-[320px_1fr] gap-12">

              {/* ===== LEFT INFO PANEL ===== */}
              <div className="pr-8 border-r border-slate-300 dark:border-white/10">
                <div className="w-58 h-28 mb-4 rounded-xl overflow-hidden">
                  <img
                    src={mfMenuImg}
                    alt="Mutual Funds"
                    className="w-full h-full object-contain"
                  />
                </div>

                <h2 className="text-xl font-semibold text-blue-950 dark:text-gray-100 mb-2">
                  Mutual Funds
                </h2>

                <p className="text-sm leading-relaxed mb-4 text-slate-600 dark:text-gray-400">
                  Invest smartly with professionally managed mutual funds
                  across equity, debt and hybrid categories.
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

              {/* ===== RIGHT MENU GRID ===== */}
              <div className="grid grid-cols-3 gap-10 text-sm">

                {/* Investing */}
                <div className="space-y-4 pr-8 border-r border-slate-300 dark:border-white/10">
                  <h3 className="font-semibold text-blue-950 dark:text-gray-100">
                    Investing
                  </h3>

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

                  <MenuItem
                    icon={BarChart2}
                    title="Track Funds"
                    desc="Monitor all investments in one place."
                    onClick={() => navigate("/track")}
                  />

                  {/* Internal / External / Combined Portfolio used to be listed here too.
                      This whole block only renders when there is NO token, and all three
                      are /user/* routes behind ProtectRoute — so for the only person who
                      could see them they bounced straight to the login screen. They are
                      also the exact three items in the signed-in dropdown above, which is
                      where they belong. */}
                </div>

                {/* Tools */}
                <div className="space-y-4 pr-8 border-r border-slate-300 dark:border-white/10">
                  <h3 className="font-semibold text-blue-950 dark:text-gray-100">
                    Tools
                  </h3>

                  <MenuItem
                    icon={BarChart2}
                    title="NFOs"
                    desc="Explore newly launched funds."
                    onClick={() => navigate("/nfo")}
                  />

                  {/* SIP Calculator was in this menu AND in More → Calculators, on the
                      same route, with two different descriptions. Calculators live under
                      More, which is the tools hub; one link here reaches all 18 instead of
                      repeating two of them. */}
                  <MenuItem
                    icon={Calculator}
                    title="All calculators"
                    desc="SIP, lumpsum, SWP and 15 more."
                    onClick={() => navigate("/calculators")}
                  />
                </div>

                {/* Categories */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-950 dark:text-gray-100">
                    Categories
                  </h3>

                  <MenuItem
                    icon={Layers}
                    title="High Return Funds"
                    desc="Aggressive growth options."
                    onClick={() =>
                      navigate("/mutual_fund/collections/high-return")
                    }
                  />

                  <MenuItem
                    icon={Shield}
                    title="Low Risk Funds"
                    desc="Stable and safer investments."
                    onClick={() =>
                      navigate("/mutual_fund/collections/low_risk")
                    }
                  />
                </div>

              </div>
            </div>
            {/* ================================================ */}
          </div>
        </div>
      )}
    </div>
  );
};


export default MutualFundsMenu;
