import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart2,
  TrendingUp,
  Layers,
  CandlestickChart,
  Download,
  Newspaper,
} from "lucide-react";
import stockMenu from "../../assets/menu/stockMenu.svg";

const StocksMenu = ({ token }) => {
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setOpenMenu(false);
  }, [location.pathname]);

  const redirect = () => {
    if (token) navigate("/user/stocks/explore");
  };

const isStocksActive = location.pathname.startsWith("/user/stocks");


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
  Stocks
</button>


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
                  Stocks
                </h2>

                <p className="text-sm leading-relaxed mb-4 text-slate-600 dark:text-gray-400">
                  Invest in stocks, ETFs and IPOs with real-time prices,
                  advanced charts and expert insights.
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

                {/* Trading */}
                <div className="space-y-4 pr-8 border-r border-slate-300 dark:border-white/10">
                  <h3 className="font-semibold text-blue-950 dark:text-gray-100">
                    Trading
                  </h3>

                  <MenuItem
                    icon={Layers}
                    title="ETF Investing"
                    desc="Diversified index investing."
                    onClick={() => navigate("/signup")}
                  />

                  <MenuItem
                    icon={CandlestickChart}
                    title="IPO Investments"
                    desc="Apply for upcoming IPOs."
                    onClick={() => navigate("/ipo")}
                  />

                  <MenuItem
                    icon={Download}
                    title="Documents"
                    desc="Statements & reports."
                    onClick={() => navigate("/signup")}
                  />
                </div>

                {/* Portfolio */}
                <div className="space-y-4 pr-8 border-r border-slate-300 dark:border-white/10">
                  <h3 className="font-semibold text-blue-950 dark:text-gray-100">
                    Portfolio
                  </h3>

                  <MenuItem
                    icon={TrendingUp}
                    title="Market Watchlist"
                    desc="Track stocks live."
                    onClick={() => navigate("/signup")}
                  />

                  <MenuItem
                    icon={Layers}
                    title="Demat + Trading"
                    desc="Free Demat account."
                    onClick={() => navigate("/demat-account")}
                  />

                  <MenuItem
                    icon={Newspaper}
                    title="EMI Calculator"
                    desc="iOS & Android versions."
                    onClick={() =>
                      navigate("/calculator/emi-calculator")
                    }
                  />
                </div>

                {/* Insights */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-950 dark:text-gray-100">
                    Insights
                  </h3>

                  <MenuItem
                    icon={BarChart2}
                    title="Top Gainers"
                    desc="Stocks rising today."
                    onClick={() => navigate("/signup")}
                  />

                  <MenuItem
                    icon={TrendingUp}
                    title="Market Trends"
                    desc="Analyst insights."
                    onClick={() => navigate("/signup")}
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

/* ================= MENU ITEM ================= */
const MenuItem = ({ icon: Icon, title, desc, onClick }) => (
  <div
    onClick={onClick}
    className="
      flex gap-3 p-2 rounded-lg cursor-pointer transition
      hover:bg-blue-50/70 dark:hover:bg-white/5
    "
  >
    <Icon size={18} className="mt-1 text-blue-700 dark:text-blue-400" />
    <div>
      <p className="font-medium text-blue-950 dark:text-gray-100">
        {title}
      </p>
      <p className="text-xs text-slate-500 dark:text-gray-400">
        {desc}
      </p>
    </div>
  </div>
);

export default StocksMenu;
