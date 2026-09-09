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
      icon: <PiChartLineUpFill size={20} />,
      path: "/user/stocks/explore",
    },
    {
      key: "funds",
      label: "Funds",
      icon: <FaChartPie size={19} />,
      path: "/user/mutual_fund/explore",
    },
    {
      key: "baskets",
      label: "Baskets",
      icon: <FaShoppingBasket size={19} />,
      path: "/baskets",
    },
    {
      key: "orders",
      label: "Orders",
      icon: <MdReceiptLong size={20} />,
      path: "/user/stocks/orders",
    },
    {
      key: "profile",
      label: "Profile",
      icon: <HiUser size={20} />,
      path: "/profile",
    },
  ];

  return (  
    <div
      className="
        fixed bottom-0 left-0 w-full z-50
        bg-[var(--app-bg)]
        border-t border-[var(--border-color)]
        h-[56px]
      "
    >
      <div className="flex justify-around items-center h-full px-1">
        {tabs.map((tab) => {
          const active = isActive(tab.key);

          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center relative px-3 py-1"
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute top-0 h-[2px] w-6 bg-[var(--accent)]" />
              )}

              <div
                className={`transition-colors ${
                  active
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-secondary)]"
                }`}
              >
                {tab.icon}
              </div>

              <span
                className={`text-[10px] font-medium mt-0.5 leading-none ${
                  active
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-secondary)]"
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
