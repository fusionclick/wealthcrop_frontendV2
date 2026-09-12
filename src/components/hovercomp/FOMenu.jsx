import React, { useEffect, useState } from "react";
import { ArrowRight, TrendingUp, Layers } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import foMenu from "../../assets/menu/foMenu.svg";

import MenuItem from "./MenuItem";
const FOMenu = ({ token }) => {
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setOpenMenu(false);
  }, [location.pathname]);

  // `if (token)` ki wajah se logged-out user ke liye "F&O" label ka click bilkul be-asar
  // tha. Neeche wala "Explore Future & Options" button hamesha navigate karta hai, aur
  // route khud ProtectRoute ke peeche hai — login par bhejna route ka kaam hai, yahan
  // chup chaap kuch na karna theek nahi.
  const redirect = () => navigate("/user/future_and_options/explore");

const isStocksActive = location.pathname.startsWith("/user/future_and_options");


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
  F&amp;O
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

              {/* ========= LEFT INFO ========= */}
              <div className="pr-8 border-r border-slate-300 dark:border-white/10">
                <div className="w-58 h-28 mb-4 flex items-center">
                  <img
                    src={foMenu}
                    alt="F&O"
                    className="w-full h-full object-contain"
                  />
                </div>

                <h2 className="text-xl font-semibold text-blue-950 dark:text-gray-100 mb-2">
                  Futures & Options
                </h2>

                <p className="text-sm leading-relaxed mb-4
                              text-slate-600 dark:text-gray-400">
                  Trade futures and options with advanced tools,
                  option chains and real-time analytics.
                </p>

                <button
                  onClick={() => navigate("/user/future_and_options/explore")}
                  className="
                    inline-flex items-center gap-1 px-4 py-1.5 rounded-full
                    bg-gray-200 dark:bg-white/10
                    text-blue-900 dark:text-gray-200
                    text-sm font-medium
                    hover:bg-gray-300 dark:hover:bg-white/15
                  "
                >
                  Explore Future &amp; Options <ArrowRight size={14} />
                </button>
              </div>

              {/* ========= RIGHT GRID =========
                  Pehle yahan chhe item thay aur `MenuItem` koi onClick leta hi nahi tha —
                  chhe ke chhe sirf cursor-pointer wale div thay. Options Trading, Option
                  Chain, Margin Calculator aur Brokerage Estimator ke liye is app mein koi
                  page hi mojood nahi hai, is liye unhe menu se hata diya: menu wo cheez
                  advertise na kare jo bani hi nahi. Jo do sach mein chalte hain wo
                  ExploreFO par jate hain, jahan index aur stock futures ka data aata hai. */}
              <div className="text-sm">
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-950 dark:text-gray-100">
                    Futures
                  </h3>

                  <MenuItem
                    icon={TrendingUp}
                    title="Index Futures"
                    desc="NIFTY & BANKNIFTY."
                    onClick={() => navigate("/user/future_and_options/explore")}
                  />
                  <MenuItem
                    icon={Layers}
                    title="Stock Futures"
                    desc="Leading stocks futures."
                    onClick={() => navigate("/user/future_and_options/explore")}
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


export default FOMenu;
