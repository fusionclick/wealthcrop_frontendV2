import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  TrendingUp,
  Layers,
  CandlestickChart,
  Download,
  Newspaper,
} from "lucide-react";
import stockMenu from "../../assets/menu/stockMenu.svg";

import MenuItem from "./MenuItem";

// Client 2026-10-09 — "Merge F&O menu with the stock": one "Stocks & F&O" menu, second after
// Mutual Funds. What used to be FOMenu is the Futures & Options column below.
//
// One panel for everyone. Signed in, this menu used to open nothing at all, so F&O had no
// way in once the separate F&O menu went; signed out, a /user/* item lands on the login
// screen through ProtectRoute, the same as the Explore button always did.
const StocksMenu = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setOpenMenu(false);
  }, [location.pathname]);

  const isActive =
    location.pathname.startsWith("/user/stocks") || location.pathname.startsWith("/user/future_and_options");

  return (
    <div
      className="relative group"
      onMouseEnter={() => setOpenMenu(true)}
      onMouseLeave={() => setOpenMenu(false)}
    >
      {/* NAV ITEM */}
      <button
        onClick={() => navigate("/user/stocks/explore")}
        className={`
          h-16 px-4 font-semibold cursor-pointer transition
          ${
            isActive
              ? "text-blue-600 dark:text-blue-400"
              : "text-blue-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
          }
        `}
      >
        Stocks &amp; F&amp;O
      </button>

      {/* MEGA MENU */}
      {openMenu && (
        <div
          className="
            fixed left-0 right-0 top-full z-50
            bg-white dark:bg-gray-900
            shadow-md dark:shadow-white/5
            border-t border-gray-200 dark:border-white/10
          "
        >
          <div className="max-w-[1280px] mx-auto px-10 py-8">
            <div className="grid grid-cols-[320px_1fr] gap-12">

              {/* ========= LEFT INFO PANEL ========= */}
              <div className="pr-8 border-r border-slate-300 dark:border-white/10">
                <div className="w-58 h-28 mb-4 rounded-xl flex items-center justify-center overflow-hidden">
                  <img
                    src={stockMenu}
                    alt="Stock menu"
                    className="w-full h-full object-contain"
                  />
                </div>

                <h2 className="text-xl font-semibold text-blue-950 dark:text-gray-100 mb-2">
                  Stocks &amp; F&amp;O
                </h2>

                <p className="text-sm leading-relaxed mb-4 text-slate-600 dark:text-gray-400">
                  Stocks, ETFs, IPOs and futures, traded on your own linked broker account.
                </p>

                <button
                  onClick={() => navigate("/user/stocks")}
                  className="
                    inline-flex items-center gap-1 mt-2
                    px-4 py-1.5 rounded-full
                    bg-gray-200 dark:bg-white/10
                    text-blue-900 dark:text-gray-200
                    text-sm font-medium
                    hover:bg-gray-300 dark:hover:bg-white/15
                  "
                >
                  Explore Stocks <ArrowRight size={14} />
                </button>
              </div>

              {/* ========= RIGHT MENU GRID ========= */}
              <div className="grid grid-cols-3 gap-10 text-sm">

                {/* Stocks */}
                <div className="space-y-4 pr-8 border-r border-slate-300 dark:border-white/10">
                  <h3 className="font-semibold text-blue-950 dark:text-gray-100">
                    Stocks
                  </h3>

                  <MenuItem
                    icon={Layers}
                    title="Stocks & ETFs"
                    desc="Explore stocks and exchange-traded funds."
                    onClick={() => navigate("/user/stocks/explore")}
                  />

                  <MenuItem
                    icon={CandlestickChart}
                    title="IPO Investments"
                    desc="Apply for upcoming IPOs."
                    onClick={() => navigate("/ipo")}
                  />

                  <MenuItem
                    icon={TrendingUp}
                    title="Market Watchlist"
                    desc="Track stocks live."
                    onClick={() => navigate("/user/stocks/watchlist")}
                  />
                </div>

                {/* Futures & Options. Only what has a page: Options Trading, Option Chain,
                    Margin Calculator and Brokerage Estimator were advertised once and never
                    built. Index and stock futures both live on ExploreFO. */}
                <div className="space-y-4 pr-8 border-r border-slate-300 dark:border-white/10">
                  <h3 className="font-semibold text-blue-950 dark:text-gray-100">
                    Futures &amp; Options
                  </h3>

                  <MenuItem
                    icon={TrendingUp}
                    title="Index & Stock Futures"
                    desc="NIFTY, BANKNIFTY and leading stocks."
                    onClick={() => navigate("/user/future_and_options/explore")}
                  />
                </div>

                {/* Account */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-950 dark:text-gray-100">
                    Account
                  </h3>

                  <MenuItem
                    icon={Layers}
                    title="Demat + Trading"
                    desc="Open a broker account."
                    onClick={() => navigate("/demat-account")}
                  />

                  <MenuItem
                    icon={Download}
                    title="Documents"
                    desc="Statements & reports."
                    onClick={() => navigate("/reports")}
                  />

                  <MenuItem
                    icon={Newspaper}
                    title="EMI Calculator"
                    desc="Plan a loan's monthly instalment."
                    onClick={() =>
                      navigate("/calculator/emi-calculator")
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default StocksMenu;
