import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { FaAngleRight } from "react-icons/fa6";
import topInvest from "../assets/top investment/topinvest.svg"
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CandlestickChart, Bookmark } from "lucide-react";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import axios from "axios";
import MobileSearchBox from "./MobileSearchBox";


const Dashboard = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [activeTab, setActiveTab] = useState("Gainers");
  const [hoveredRow, setHoveredRow] = useState(null);

  // const [stocks, setStocks] = useState([]);

  //  const fetchData = async (category) => {
  //   try {
  //     // Example URLs — replace with your real API endpoints
  //     let url = "";
  //     if (category === "Gainers") url = "/api/market/gainers";
  //     if (category === "Losers") url = "/api/market/losers";
  //     if (category === "Volume shockers") url = "/api/market/volumes";

  //     const { data } = await axios.get(url);
  //     setStocks(data);
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchData(activeTab); // default load Gainers
  // }, [activeTab]);

 

 const topTabs = [
  { name: "Explore", link: "explore" },
  { name: "Holdings", link: "holdings" },
  { name: "Positions", link: "positions" },
  { name: "Orders", link: "orders" },
  { name: "Watchlist", link: "watchlist" },
];

  const markets = [
    { name: "NIFTY", value: "25,597.65", change: "0.00 (0.00%)" },
    { name: "SENSEX", value: "83,459.15", change: "0.00 (0.00%)" },
    { name: "BANKNIFTY", value: "57,827.05", change: "0.00 (0.00%)" },
    { name: "MIDCPNIFTY", value: "13,375.25", change: "-130.75 (0.97%)" },
    { name: "FINNIFTY", value: "27,195.00", change: "0.00 (0.00%)" },
  ];


  const dropdownRef = useRef(null);

  useEffect(() => {
  const handleScroll = () => {
    setIsSticky(window.scrollY > 100);
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    setSelected(option.label);
    setOpen(false);
    window.location.href = option.link; // redirect
  };  

   const [bookmarked, setBookmarked] = useState({});

  const toggleBookmark = (index) => {
    setBookmarked((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
    // Optionally: send to API here
    // axios.post('/api/bookmark', { company: stocks[index].name })
  };

  return (
  <>
    {/* DESKTOP VIEW */}
    <div
  className="
    min-h-screen  pb-2
    bg-white text-blue-950

    dark:bg-[var(--app-bg)]
    dark:text-[var(--text-primary)]
  "
>
  {/* Sticky header */}
  <div
    className={`
      transition-top duration-300 ease-in-out
      bg-white border-b hidden lg:block

      dark:bg-[var(--card-bg)]
      dark:border-[var(--border-color)]

      ${
        isSticky
          ? "fixed top-0 left-0 w-full shadow-sm z-50"
          : "relative"
      }
    `}
  >
    {/* Tabs + Search */}
    <div className="flex flex-col lg:flex-row justify-between items-center px-10 py-5 gap-4">
      <nav className="flex gap-8 text-md font-medium overflow-x-auto">
        {topTabs.map((tab) => (
          <NavLink
            key={tab.name}
            to={tab.link}
            end
            className={({ isActive }) =>
              `
              relative pb-1 transition
              text-gray-600 hover:text-blue-800

              dark:text-[var(--text-secondary)]
              dark:hover:text-[var(--text-primary)]

              after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px]
              after:bg-blue-800 after:scale-x-0 hover:after:scale-x-100
              after:origin-left after:transition-transform after:duration-300

              ${
                isActive
                  ? "text-blue-800 after:scale-x-100 dark:text-[var(--text-primary)]"
                  : ""
              }
              `
            }
          >
            {tab.name}
          </NavLink>
        ))}
      </nav>

      <input
        type="text"
        placeholder="Search..."
        className="
          border border-gray-300 rounded-md
          px-3 py-1.5 text-sm outline-none
          focus:ring-1 focus:ring-blue-800

          dark:bg-[var(--gray-800)]
          dark:border-[var(--border-color)]
          dark:text-[var(--text-primary)]
          dark:focus:ring-[var(--text-primary)]
        "
      />
    </div>

    {/* Market indexes */}
    <div
      className="
        flex justify-between items-center
        px-10 py-2 text-xs
        text-gray-600

        dark:text-[var(--text-secondary)]
      "
    >
      <div className="flex gap-16">
        {markets.map((m) => (
          <NavLink key={m.name} to={`/indices/${m.name}`}>
            <span
              className="
                font-semibold text-gray-800

                dark:text-[var(--text-primary)]
              "
            >
              {m.name}
            </span>{" "}
            {m.value}{" "}
            <span className="text-gray-500 dark:text-[var(--text-secondary)]">
              {m.change}
            </span>
          </NavLink>
        ))}
      </div>
    </div>
  </div>
  
           {/* Tabs + Search */}
           <div className="mt-2 lg:hidden block">  
           <MobileSearchBox/>
<div className="bg-slate-100 dark:bg-[#111827] p-2 rounded-xl ">
  <nav className="flex gap-2 items-center overflow-x-auto scrollbar-hide ">
    {topTabs.map((tab) => (
      <NavLink
        key={tab.name}
        to={tab.link}
        end
        className={({ isActive }) =>
          `
          px-5 py-2 rounded-lg text-sm font-semibold
          transition-all duration-300 whitespace-nowrap

          ${
            isActive
              ? `
                bg-gradient-to-r from-blue-500 to-blue-500
                text-white
                shadow-lg shadow-blue-600/30
                ring-1 ring-blue-400/40
                dark:from-blue-500 dark:to-indigo-500
              `
              : `
                text-slate-600
                hover:bg-red-50 hover:text-red-600
                hover:ring-1 hover:ring-red-400/30

                dark:text-slate-300
                dark:hover:bg-red-500/10
                dark:hover:text-red-400
              `
          }
          `
        }
      >
        {tab.name}
      </NavLink>
    ))}
  </nav>
</div>
 </div>

  {/* DESKTOP OUTLET */}
  <div className="mt-2 px-2 lg:px-0">
    <Outlet />
  </div>
</div>




  </>
);

};


export default Dashboard;
