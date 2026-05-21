import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PiChartLineUpFill } from "react-icons/pi";
import { FaChartPie, FaShoppingBasket } from "react-icons/fa";
import { MdReceiptLong } from "react-icons/md";
import { HiUser } from "react-icons/hi2";

const BottomHeader = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ✅ Route-based active detection
  // const isActive = (key) => {
  //   if (key === "stocks") return pathname.startsWith("/user/stocks");
  //   if (key === "funds") return pathname.startsWith("/user/mutual_fund");
  //   if (key === "baskets") return pathname.startsWith("/baskets") || pathname.startsWith("/basket");
  //   if (key === "orders") return pathname.startsWith("/orders") || pathname.startsWith("/user/order");
  //   if (key === "profile") return pathname.startsWith("/profile");
  //   return false;
  // };

  const isActive = (key) => {
  if (key === "orders") {
    // Check more specific orders route first
    return pathname.startsWith("/user/stocks/orders") || pathname.startsWith("/user/order");
  }
  if (key === "stocks") {
    // Only match /user/stocks that is not /orders
    return pathname.startsWith("/user/stocks") && !pathname.startsWith("/user/stocks/orders");
  }
  if (key === "funds") return pathname.startsWith("/user/mutual_fund");
  if (key === "baskets") return pathname.startsWith("/baskets") || pathname.startsWith("/basket");
  if (key === "profile") return pathname.startsWith("/profile");
  return false;
};


  const tabs = [
    {
      key: "stocks",
      label: "Stocks",
      icon: <PiChartLineUpFill size={24} />,
      path: "/user/stocks/explore",
    },
    {
      key: "funds",
      label: "Funds",
      icon: <FaChartPie size={22} />,
      path: "/user/mutual_fund/explore",
    },
    {
      key: "baskets",
      label: "Baskets",
      icon: <FaShoppingBasket size={22} />,
      path: "/baskets",
    },
    {
      key: "orders",
      label: "Orders",
      icon: <MdReceiptLong size={24} />,
      path: "/user/stocks/orders",
    },
    {
      key: "profile",
      label: "Profile",
      icon: <HiUser size={24} />,
      path: "/profile",
    },
  ];

  return (  
    <div
      className="
        fixed bottom-0 left-0 w-full z-50
        backdrop-blur-md
        bg-white/90 dark:bg-slate-900/95
        border-t border-gray-200 dark:border-slate-700
        h-[72px]
      "
    >
      <div className="flex justify-around items-center h-full px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.key);

          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center relative px-3 py-2"
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute -top-1 h-1 w-6 rounded-full bg-blue-500" />
              )}

              <div
                className={`transition-colors ${
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {tab.icon}
              </div>

              <span
                className={`text-[11px] font-medium mt-1 ${
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomHeader;
