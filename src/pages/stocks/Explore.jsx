import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaAngleRight } from "react-icons/fa6";
import topInvest from "../../assets/top investment/topinvest.svg"
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CandlestickChart, Bookmark } from "lucide-react";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { getApi } from "../../api/api";
import socket from "../../utils/socket";
import { useSelector } from "react-redux";
import WatchlistPopup from "../../components/WatchlistPopup";


const Explore = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [activeTab, setActiveTab] = useState("Gainers");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [isWatchlist, setIsWatchlist] = useState(false)
  // const [stockList, setStockList] = useState(null)

      const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("NIFTY 100");
  const dropdownRef = useRef(null);

  const url= `${import.meta.env.VITE_FETCH_STOCK_LIST}?index=NIFTY%2050`
  // const url= "https://jsonplaceholder.typicode.com/posts"

// const { data } = useQuery({
//   queryKey: ["stocks"],
//   queryFn: () => getApi(url),
//   retry: false,              // stop retry loop
//   refetchOnWindowFocus: false,
// });

//! socket 
// useEffect(() => {

//   const fetchStockList = ()=>{
//     socket.emit("get_stock_list")
//   }

//   // Listen
//   socket.on("stock_list", (data) => {
//     console.log("Stock List", data);
//     setStockList(data?.data)
//   })

//   const interval = setInterval(() => {
//     fetchStockList()
//   }, 1000);

//   fetchStockList()

//   return () => {
//     clearInterval(interval)
//     socket.off("stock_list")
//   }

// },[])

//! from redux
const stockList =  useSelector((state) => state.stocks.stockList)


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


  //!for mobile view
    const marketIndices = [
    { name: "NIFTY", value: "25,492.30", change: "-17.40 (0.07%)", isPositive: false },
    { name: "SENSEX", value: "83,216.28", change: "-94.73 (0.11%)", isPositive: false },
    { name: "BANK NIFTY", value: "57,851.20", change: "322.55 (0.56%)", isPositive: true },
    { name: "FINNIFTY", value: "21,356.90", change: "74.25 (0.35%)", isPositive: true },
    { name: "MIDCAP", value: "47,158.40", change: "124.52 (0.27%)", isPositive: true },
    { name: "SMALLCAP", value: "16,728.20", change: "98.14 (0.59%)", isPositive: true },
  ];

  const topGainers = [
    { name: "Shriram Finance", price: "₹816.35", change: "28.65 (3.64%)", logo: "https://logo.clearbit.com/shriramfinance.in" },
    { name: "LIC", price: "₹924.15", change: "28.05 (3.13%)", logo: "https://logo.clearbit.com/licindia.in" },
    { name: "Britannia", price: "₹6,157.35", change: "144.00 (2.41%)", logo: "https://logo.clearbit.com/britannia.co.in" },
    { name: "ONGC", price: "₹216.50", change: "5.10 (2.42%)", logo: "https://logo.clearbit.com/ongcindia.com" },
    { name: "HDFC Bank", price: "₹1,534.25", change: "28.65 (1.91%)", logo: "https://logo.clearbit.com/hdfcbank.com" },
    { name: "TCS", price: "₹3,456.10", change: "68.25 (2.01%)", logo: "https://logo.clearbit.com/tcs.com" },
  ];
//!end


    const stocks = [
    {
      name: "Reliance Power",
      logo: "https://logo.clearbit.com/reliancepower.co.in",
    },
    {
      name: "Vodafone Idea",
      logo: "https://logo.clearbit.com/vodafone.in",
    },
    {
      name: "Infosys",
      logo: "https://logo.clearbit.com/infosys.com",
    },
    {
      name: "HDFC Bank",
      logo: "https://logo.clearbit.com/hdfcbank.com",
    },
  ];

    const options = [
    { label: "NIFTY 100", link: "/nifty-100" },
    { label: "NIFTY 500", link: "/nifty-500" },
    { label: "NIFTY Midcap 100", link: "/nifty-midcap-100" },
    { label: "NIFTY Smallcap 100", link: "/nifty-smallcap-100" },
    { label: "NIFTY Total Market", link: "/nifty-total-market" },
  ];




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
    // window.location.href = option.link; // redirect
  };  

   const [bookmarked, setBookmarked] = useState({});

  const toggleBookmark = (index) => {
    setIsWatchlist(true)
    setBookmarked((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
    // Optionally: send to API here
    // axios.post('/api/bookmark', { company: stocks[index].name })
  };

  const navigate = useNavigate()

   const showStockPage = (stockName) => {
  const cleanName = stockName.replace(/\s+/g, "");
  navigate(`/stocks/${cleanName}`);
};

 const topTabs = [
  { name: "Explore", link: "/user/stocks/explore" },
  { name: "Holdings", link: "/user/stocks/holdings" },
  { name: "Positions", link: "/user/stocks/positions" },
  { name: "Orders", link: "/user/stocks/orders" },
  { name: "Watchlist", link: "/user/stocks/watchlist" },
];


  return (
    <>
      <div className="min-h-screen bg-white dark:bg-(--app-bg) text-blue-950 hidden lg:block">

       
     
        {/* PAGE CONTENT */}
        <div className="mt-10 px-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* left side content */}
          <div className="lg:col-span-2 ">
            {/* Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Left Section */}
              <div className="lg:col-span-2">
                <h2 className="font-semibold text-xl mb-6 text-blue-950 dark:text-(--text-primary)">
                  Most bought stocks on Wealthcrop
                </h2>

                {/* Stock grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
  {stockList?.slice(0,5).map((stock, index) => (
    <div
      key={stock?.meta?.companyName}
      className="
        relative flex flex-col justify-between p-5 h-48 cursor-pointer
        bg-white border border-gray-200 rounded-xl shadow-sm
        hover:shadow-md transition-all duration-300
        dark:bg-[var(--card-bg)]
        dark:border-[var(--border-color)]
      "
      onMouseEnter={() => setHoveredRow(index)}
      onMouseLeave={() => setHoveredRow(null)}
      onClick={() => showStockPage(stock?.meta?.symbol)}
    >
      {/* 🔖 Bookmark Icon (appears on hover) */}
      {hoveredRow === index && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark(index);
          }}
          className="
            absolute top-2 right-2 p-1
            bg-white
            hover:scale-110 transition-transform
            dark:bg-[var(--card-bg)]
          "
        >
          {bookmarked[index] ? (
            <FaBookmark className="text-blue-600" size={20} />
          ) : (
            <FaRegBookmark
              className="text-gray-400 dark:text-[var(--text-secondary)]"
              size={20}
            />
          )}
        </button>
      )}

      {/* Logo + Name */}
      <div>
        <div className="
          w-10 h-10 mb-2 overflow-hidden rounded
          border border-gray-300
          dark:border-[var(--border-color)]
        ">
          <img
            src={stock?.chartTodayPath}
            alt={stock?.meta?.companyName}
            className="w-full h-full object-cover"
          />
        </div>

        <h3 className="
          font-semibold text-sm line-clamp-2 min-h-10
          text-blue-950
          dark:text-[var(--text-primary)]
        ">
          {stock?.meta?.companyName}
        </h3>

        <p className="
          text-xs mt-1
          text-gray-500
          dark:text-[var(--text-secondary)]
        ">
          NSE • {stock?.meta?.segment}
        </p>
      </div>

      {/* Price + Change */}
      <div>
        <p className="
          text-lg font-bold mt-2
          text-gray-800
          dark:text-[var(--text-primary)]
        ">
          {/* ₹{(Math.random() * 3000 + 500).toFixed(2)} */}
          ₹{stock?.lastPrice}
        </p>

        <p
          className={`text-sm font-medium ${
            stock?.pChange > 0
            
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {stock?.pChange > 0 ? "+" : ""}
          {/* {Math.random() > 0.5 ? "+" : "-"} */}
          {/* {(Math.random() * 2).toFixed(2)}% */}
          {stock?.pChange}%
        </p>
      </div>
    </div>
  ))}
</div>


                {/* See more link */}
                <div className="mt-6 pl-2">
                  <Link
                    to="/stockList/most-bought-stocks-on-wealthcrop"
                    className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all duration-200"
                  >
                    See more <FaAngleRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Top market movers */}
            <div className="hidden lg:block lg:col-span-2 mt-5 mb-10">
  <div className="flex justify-between items-center mb-4">
    <h2 className="font-semibold text-lg text-slate-900 dark:text-[var(--text-primary)]">
      Top market movers
    </h2>

    <div className="flex gap-2">
      {["Gainers", "Losers", "Volume shockers"].map((btn) => (
        <button
          key={btn}
          onClick={() => setActiveTab(btn)}
          className={`border rounded-full px-3 py-1 text-sm transition font-medium
            ${
              activeTab === btn
                ? "bg-gray-200 text-gray-900 dark:bg-[var(--border-color)] dark:text-[var(--text-primary)]"
                : "hover:bg-gray-100 text-gray-600 dark:text-[var(--text-secondary)] dark:hover:bg-[var(--border-color)]"
            }
            dark:border-[var(--border-color)]
          `}
        >
          {btn}
        </button>
      ))}

      {/* dropdown */}
      <div className="relative inline-block text-sm" ref={dropdownRef}>
        {/* Dropdown header */}
        <button
          onClick={() => setOpen(!open)}
          className="
            flex items-center gap-2 rounded-full px-3 py-1.5 transition-all
            bg-white border border-gray-300 hover:shadow-sm
            dark:bg-[var(--card-bg)]
            dark:border-[var(--border-color)]
          "
        >
          <span className="font-medium text-gray-700 dark:text-[var(--text-primary)]">
            {selected}
          </span>

          {open ? (
            <ChevronUp className="w-4 h-4 text-gray-600 dark:text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-[var(--text-secondary)]" />
          )}
        </button>

        {/* Dropdown list */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="
                absolute left-0 mt-2 w-56 space-y-2 rounded-lg shadow-lg z-10 overflow-hidden
                bg-white border border-gray-200
                dark:bg-[var(--card-bg)]
                dark:border-[var(--border-color)]
              "
            > 
              {options.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleSelect(option)}
                  className="
                    flex items-center gap-3 px-4 py-4 mt-4 w-full text-left transition
                    hover:bg-gray-100
                    dark:hover:bg-[var(--border-color)]
                  "
                >
                  {/* Custom radio */}
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition
                      ${
                        selected === option.label
                          ? "border-blue-600"
                          : "border-blue-600"
                      }
                    `}
                  >
                    {selected === option.label && (
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                    )}
                  </span>

                  <span className="font-semibold text-gray-700 dark:text-[var(--text-primary)]">
                    {option.label}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>

  <MarketTable />

   {/* See more link */}
                <div className="mt-6 pl-2">
                  <Link
                    to="/stockList/top-market-movers"
                    className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all duration-200"
                  >
                    See more <FaAngleRight size={14} />
                  </Link>
                </div>

</div>


            {/* Most traded stocks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
  {/* Left Section */}
  <div className="lg:col-span-2">
    <h2
      className="
        font-semibold text-xl mb-6 text-blue-950
        dark:text-[var(--text-primary)]
      "
    >
      Most traded stocks in MTF
    </h2>

    {/* Stock grid */}
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
      {stocks.map((stock, index) => (
        <div
          key={stock.name}
          className="
            relative bg-white border border-gray-200 rounded-xl
            shadow-sm hover:shadow-md
            transition-all duration-300
            flex flex-col justify-between p-5 h-48 cursor-pointer
            dark:bg-[var(--card-bg)]
            dark:border-[var(--border-color)]
            dark:hover:bg-[var(--white-5)]
          "
          onMouseEnter={() => setHoveredRow(index)}
          onMouseLeave={() => setHoveredRow(null)}
          onClick={() => showStockPage(stock.name)}
        >
          {/* 🔖 Bookmark Icon (appears on hover) */}
          {hoveredRow === index && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(index);
              }}
              className="
                absolute top-2 right-2 bg-white p-1
                hover:scale-110 transition-transform hover:cursor-pointer
                dark:bg-[var(--card-bg)]
              "
            >
              {bookmarked[index] ? (
                <FaBookmark
                  className="text-blue-600 dark:text-blue-400"
                  size={20}
                />
              ) : (
                <FaRegBookmark
                  className="text-gray-400 dark:text-[var(--text-secondary)]"
                  size={20}
                />
              )}
            </button>
          )}

          {/* Logo + Name */}
          <div>
            <div
              className="
                w-10 h-10 mb-2 border rounded overflow-hidden
                border-gray-300
                dark:border-[var(--border-color)]
              "
            >
              <img
                src={stock.logo}
                alt={stock.name}
                className="w-full h-full object-cover"
              />
            </div>

            <h3
              className="
                font-semibold text-blue-950 text-sm
                line-clamp-2 min-h-10
                dark:text-[var(--text-primary)]
              "
            >
              {stock.name}
            </h3>

            <p className="text-gray-500 text-xs mt-1 dark:text-[var(--text-secondary)]">
              NSE • Equity
            </p>
          </div>

          {/* Price + Change */}
          <div>
            <p className="text-lg font-bold mt-2 text-gray-800 dark:text-[var(--text-primary)]">
              ₹{(Math.random() * 3000 + 500).toFixed(2)}
            </p>

            <p
              className={`text-sm font-medium ${
                Math.random() > 0.5
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {Math.random() > 0.5 ? "+" : "-"}
              {(Math.random() * 2).toFixed(2)}%
            </p>
          </div>
        </div>
      ))}
    </div>

    {/* See more link */}
    <div className="mt-6 pl-2">
      <Link
        to="/"
        className="
          text-green-600 font-semibold text-sm
          flex items-center gap-1
          hover:gap-2 transition-all duration-200
        "
      >
        See more <FaAngleRight size={14} />
      </Link>
    </div>
  </div>
</div>


            {/* Most Intraday stocks */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
  {/* Left Section */}
  <div className="lg:col-span-2">
    <h2
      className="
        font-semibold text-xl mb-6 text-blue-950
        dark:text-[var(--text-primary)]
      "
    >
      Top intraday stocks
    </h2>

    {/* Stock grid */}
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
      {stocks.map((stock, index) => (
        <div
          key={stock.name}
          className="
            relative bg-white border border-gray-200 rounded-xl
            shadow-sm hover:shadow-md
            transition-all duration-300
            flex flex-col justify-between p-5 h-48 cursor-pointer
            dark:bg-[var(--card-bg)]
            dark:border-[var(--border-color)]
            dark:hover:bg-[var(--white-5)]
          "
          onMouseEnter={() => setHoveredRow(index)}
          onMouseLeave={() => setHoveredRow(null)}
          onClick={() => showStockPage(stock.name)}
        >
          {/* 🔖 Bookmark Icon (appears on hover) */}
          {hoveredRow === index && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark(index);
              }}
              className="
                absolute top-2 right-2 bg-white p-1
                hover:scale-110 transition-transform hover:cursor-pointer
                dark:bg-[var(--card-bg)]
              "
            >
              {bookmarked[index] ? (
                <FaBookmark
                  className="text-blue-600 dark:text-blue-400"
                  size={20}
                />
              ) : (
                <FaRegBookmark
                  className="text-gray-400 dark:text-[var(--text-secondary)]"
                  size={20}
                />
              )}
            </button>
          )}

          {/* Logo + Name */}
          <div>
            <div
              className="
                w-10 h-10 mb-2 border rounded overflow-hidden
                border-gray-300
                dark:border-[var(--border-color)]
              "
            >
              <img
                src={stock.logo}
                alt={stock.name}
                className="w-full h-full object-cover"
              />
            </div>

            <h3
              className="
                font-semibold text-blue-950 text-sm
                line-clamp-2 min-h-10
                dark:text-[var(--text-primary)]
              "
            >
              {stock.name}
            </h3>

            <p className="text-gray-500 text-xs mt-1 dark:text-[var(--text-secondary)]">
              NSE • Equity
            </p>
          </div>

          {/* Price + Change */}
          <div>
            <p className="text-lg font-bold mt-2 text-gray-800 dark:text-[var(--text-primary)]">
              ₹{(Math.random() * 3000 + 500).toFixed(2)}
            </p>

            <p
              className={`text-sm font-medium ${
                Math.random() > 0.5
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {Math.random() > 0.5 ? "+" : "-"}
              {(Math.random() * 2).toFixed(2)}%
            </p>
          </div>
        </div>
      ))}
    </div>

    {/* See more link */}
    <div className="mt-6 pl-2">
      <Link
        to="/"
        className="
          text-green-600 font-semibold text-sm
          flex items-center gap-1
          hover:gap-2 transition-all duration-200
        "
      >
        Intraday screener <FaAngleRight size={14} />
      </Link>
    </div>
  </div>
</div>


            {/* Row 3: News */}
            <div className="lg:col-span-2">
  <h2
    className="
      font-semibold text-lg mb-4
      text-gray-900
      dark:text-[var(--text-primary)]
    "
  >
    Latest Market News
  </h2>

  <div
    className="
      bg-white rounded-xl shadow divide-y
      dark:bg-[var(--card-bg)]
      dark:divide-[var(--border-color)]
      dark:shadow-white/5
    "
  >
    {[
      "Sensex edges higher amid IT buying",
      "RBI holds repo rate steady at 6.5%",
      "FII inflows push Nifty above 25,500",
    ].map((news, i) => (
      <a
        href="#"
        key={i}
        className="
          block px-5 py-3 text-sm
          text-gray-800 hover:bg-gray-50
          dark:text-[var(--text-secondary)]
          dark:hover:bg-[var(--white-5)]
        "
      >
        {news}
      </a>
    ))}
  </div>
</div>

          </div>

          {/* right side content */}
          <div className="lg:col-span-1">
  {/* Investments */}
  <div>
    <h2
      className="
        font-semibold text-lg mb-4
        text-gray-900
        dark:text-[var(--text-primary)]
      "
    >
      Your investments
    </h2>

    <div
      className="
        bg-white rounded-xl shadow flex-col p-4
        text-center h-[250px] flex items-center justify-center
        text-gray-500
        dark:bg-[var(--card-bg)]
        dark:text-[var(--text-secondary)]
        dark:shadow-white/5
      "
    >
      <img src={topInvest} alt="" />
      <p className="mt-5">You haven’t invested yet</p>
    </div>
  </div>

  {/* Product and Tools */}
  <div className="mt-15">
    <h2
      className="
        font-semibold text-lg mb-4
        text-gray-900
        dark:text-[var(--text-primary)]
      "
    >
      Products & Tools
    </h2>

    <div className="space-y-5">
      {[
        { name: "IPO", route: "/ipo", count: 6 },
        { name: "Bonds", route: "/bond", count: 1 },
        { name: "ETFs", route: "/", count: 2 },
        { name: "Fixed Deposit", route: "/", count: 3 },
      ].map((tool) => (
        <a
          href={tool.route}
          key={tool.name}
          className="
            bg-white rounded-xl p-6 shadow
            hover:shadow-md transition
            flex justify-between items-center
            dark:bg-[var(--white-10)]
            dark:shadow-white/5
            dark:hover:bg-[var(--white-5)]
          "
        >
          <span
            className="
              font-medium
              text-gray-800
              dark:text-[var(--text-primary)]
            "
          >
            {tool.name}
          </span>

          <span
            className="
              text-xs font-semibold
              text-green-700
              dark:text-emerald-400
            "
          >
            {tool.count} open
          </span>
        </a>
      ))}
    </div>
  </div>

  {/* Trending ETFs */}
  <div>
    <h2
      className="
        font-semibold text-lg mb-4 mt-16
        text-gray-900
        dark:text-[var(--text-primary)]
      "
    >
      Trending ETFs
    </h2>

    <div className="space-y-5">
      {[
        "Nippon India ETF",
        "HDFC Gold ETF",
        "ICICI Prudential Nifty Next 50",
      ].map((etf) => (
        <a
          href="#"
          key={etf}
          className="
            bg-white rounded-xl p-4 shadow
            hover:shadow-md transition block
            dark:bg-[var(--white-10)]
            dark:shadow-white/5
            dark:hover:bg-[var(--white-5)]
          "
        >
          <h3
            className="
              font-medium text-sm
              text-gray-800
              dark:text-[var(--text-primary)]
            "
          >
            {etf}
          </h3>

          <p
            className="
              text-gray-500 text-xs
              dark:text-[var(--text-secondary)]
            "
          >
            ETF • NSE
          </p>
        </a>
      ))}
    </div>
  </div>
</div>

        </div>

        {/* Row 4: Knowledge Center */}
        <div className="px-10 mt-10">
          <h2 className="font-semibold text-lg mb-4 dark:text-(--text-primary)">Knowledge Center</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "How to start SIPs effectively",
              "What is diversification in investing?",
              "Top 5 safe long-term investment plans",
            ].map((article) => (
              <a
                href="#"
                key={article}
                className="bg-white dark:bg-(--app-bg) rounded-xl shadow p-5 hover:shadow-md transition block dark:border border-(--border-color)"
              >
                <h3 className="font-medium text-blue-950 dark:text-(--text-primary) text-sm">{article}</h3>
                <p className="text-gray-500 dark:text-(--text-secondary) text-xs mt-1">
                  Learn about investment strategies and mutual funds
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>


      {/* For mobile view */}
      <div className="p-5 space-y-8 lg:hidden">

        {/* ===== Market Indices ===== */}
        <div>
  <div className="flex items-center justify-between mb-3">
    <h2
      className="
        font-semibold
        text-gray-800
        dark:text-[var(--text-primary)]
      "
    >
      Market Indices
    </h2>

    <button
      className="
        text-xs uppercase font-medium px-3 py-1 rounded-full
        bg-green-100 text-green-700
        dark:bg-emerald-500/15
        dark:text-emerald-400
      "
    >
      Screener
    </button>
  </div>

  <div className="flex gap-3 overflow-x-auto scrollbar-hide">
    {marketIndices.map((item, i) => (
      <div
        key={i}
        onClick={()=> navigate(`/indices/${item.name}`)}
        className="
          min-w-[130px] p-3 rounded-xl flex flex-col justify-between
          bg-white shadow border border-gray-100
          dark:bg-[var(--card-bg)]
          dark:border-[var(--border-color)]
          dark:shadow-white/5
        "
      >
        <h3
          className="
            text-sm font-medium
            text-gray-700
            dark:text-[var(--text-secondary)]
          "
        >
          {item.name}
        </h3>

        <p
          className="
            text-lg font-semibold
            text-gray-900
            dark:text-[var(--text-primary)]
          "
        >
          {item.value}
        </p>

        <span
          className={`text-xs font-medium ${
            item.isPositive
              ? "text-green-600 dark:text-emerald-400"
              : "text-red-500 dark:text-rose-400"
          }`}
        >
          {item.change}
        </span>
      </div>
    ))}
  </div>
</div>


        {/* ===== Top Gainers ===== */}
        <div>
  {/* HEADER — stays fixed */}
  <div className="flex items-center justify-between mb-3">
    <h2 className="font-semibold text-gray-800 dark:text-[var(--text-primary)]">
      Top Gainers{" "}
      <span className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
        NIFTY100
      </span>
    </h2>

    <button className="text-xs font-medium text-green-700 dark:text-emerald-400">
      See More
    </button>
  </div>

  {/* ONLY THIS SCROLLS */}
  <div
    className="
      flex gap-3
      overflow-x-auto overflow-y-hidden
      scrollbar-hide
      pr-6
      snap-x snap-mandatory
      scroll-smooth
      overscroll-x-contain
    "
  >
    {topGainers.map((item, i) => (
      <div
        key={i}
        onClick={() => showStockPage(item.name)}
        className="
          min-w-[130px]
          h-[170px]
          p-4
          rounded-xl
          flex flex-col justify-between
          snap-start
          cursor-pointer
          bg-white shadow border border-gray-100
          dark:bg-[var(--card-bg)]
          dark:border-[var(--border-color)]
        "
      >
        {/* TOP */}
        <div className="flex flex-col items-center">
          <img
            src={item.logo}
            alt={item.name}
            className="w-10 h-10 object-contain mb-2 rounded-md"
          />

          <h3
            className="
              text-sm font-medium text-center
              text-gray-800 dark:text-[var(--text-primary)]
              line-clamp-2
              min-h-[36px]
            "
          >
            {item.name}
          </h3>
        </div>

        {/* BOTTOM */}
        <div className="text-center">
          <p className="font-semibold text-base text-gray-900 dark:text-[var(--text-primary)]">
            {item.price}
          </p>
          <span className="text-sm text-green-600 dark:text-emerald-400">
            {item.change}
          </span>
        </div>
      </div>
    ))}
  </div>
</div>


        {/* Stocks in news */}
       <div>
  {/* HEADER — NEVER SCROLLS */}
  <div className="flex items-center justify-between mb-3">
    <h2 className="font-semibold text-gray-800 dark:text-[var(--text-primary)]">
      Stocks in News{" "}
      <span className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
        NIFTY100
      </span>
    </h2>

    <button
      className="
        text-xs font-medium px-3 py-1 rounded-full
        bg-green-100 text-green-700
        dark:bg-emerald-500/10 dark:text-emerald-400
      "
    >
      NEWS
    </button>
  </div>

  {/* ONLY THIS ROW SCROLLS */}
  <div
    className="
      flex gap-3
      overflow-x-auto overflow-y-hidden
      scrollbar-hide
      pr-6
      snap-x snap-mandatory
      scroll-smooth
      overscroll-x-contain
    "
  >
    {topGainers.map((item, i) => (
      <div
        key={i}
        onClick={() => showStockPage(item.name)}
        className="
          min-w-[130px]
          h-[180px]
          rounded-xl
          p-4
          flex flex-col justify-between
          items-center text-center
          snap-start cursor-pointer
          bg-white border border-gray-100 shadow
          dark:bg-[var(--card-bg)]
          dark:border-[var(--border-color)]
        "
      >
        {/* TOP */}
        <div className="flex flex-col items-center">
          <img
            src={item.logo}
            alt={item.name}
            className="w-10 h-10 object-contain mb-2 rounded-md"
          />

          <h3
            className="
              text-sm font-medium
              text-gray-800 dark:text-[var(--text-primary)]
              line-clamp-2
              min-h-[36px]
            "
          >
            {item.name}
          </h3>
        </div>

        {/* BOTTOM */}
        <div>
          <p className="font-semibold text-base text-gray-900 dark:text-[var(--text-primary)]">
            {item.price}
          </p>
          <span className="text-sm text-green-600 dark:text-emerald-400">
            {item.change}
          </span>
        </div>
      </div>
    ))}
  </div>
</div>


        {/* Top Loosers */}
       <div>
  {/* HEADER — DOES NOT SCROLL */}
  <div className="flex items-center justify-between mb-3">
    <h2 className="font-semibold text-gray-800 dark:text-[var(--text-primary)]">
      Top Losers{" "}
      <span className="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
        NIFTY100
      </span>
    </h2>

    <button
      className="
        text-xs font-medium
        text-green-700
        dark:text-emerald-400
      "
    >
      See More
    </button>
  </div>

  {/* ONLY CARDS SCROLL */}
  <div
    className="
      flex gap-3
      overflow-x-auto overflow-y-hidden
      scrollbar-hide
      pr-6
      snap-x snap-mandatory
      scroll-smooth
      overscroll-x-contain
    "
  >
    {topGainers.map((item, i) => (
      <div
        key={i}
        onClick={() => showStockPage(item.name)}
        className="
          min-w-[130px]
          h-[180px]
          bg-white
          border border-gray-100
          rounded-xl
          shadow
          p-4
          flex flex-col
          justify-between
          items-center
          text-center
          snap-start
          cursor-pointer
          dark:bg-[var(--card-bg)]
          dark:border-[var(--border-color)]
        "
      >
        {/* TOP */}
        <div className="flex flex-col items-center">
          <img
            src={item.logo}
            alt={item.name}
            className="w-10 h-10 object-contain mb-2 rounded-md"
          />

          <h3
            className="
              text-sm font-medium
              text-gray-800 dark:text-[var(--text-primary)]
              line-clamp-2
              min-h-[36px]
            "
          >
            {item.name}
          </h3>
        </div>

        {/* BOTTOM */}
        <div>
          <p className="font-semibold text-base text-gray-900 dark:text-[var(--text-primary)]">
            {item.price}
          </p>

          {/* Losers → red */}
          <span className="text-sm text-red-600 dark:text-rose-400">
            {item.change}
          </span>
        </div>
      </div>
    ))}
  </div>
</div>


        {/* Product and Tools */}
        <div className="mt-15">
  <h2 className="
    font-semibold text-lg mb-4
    text-gray-800
    dark:text-[var(--text-primary)]
  ">
    Products & Tools
  </h2>

  <div className="space-y-5">
    {[
      {
        name: "IPO",
        count: 6,
        img: "https://cdn-icons-png.flaticon.com/512/481/481949.png",
      },
      {
        name: "Bonds",
        count: 1,
        img: "https://cdn-icons-png.flaticon.com/512/2716/2716999.png",
      },
      {
        name: "ETFs",
        count: 2,
        img: "https://cdn-icons-png.flaticon.com/512/7099/7099964.png",
      },
      {
        name: "Fixed Deposit",
        count: 3,
        img: "https://cdn-icons-png.flaticon.com/512/4228/4228704.png",
      },
    ].map((tool) => (
      <a
        href="#"
        key={tool.name}
        className="
          rounded-xl p-5 flex justify-between items-center
          bg-white shadow hover:shadow-md transition
          dark:bg-[var(--card-bg)]
          dark:border dark:border-[var(--border-color)]
        "
      >
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <div
            className="
              w-10 h-10 rounded-full flex items-center justify-center
              bg-blue-50
              dark:bg-[var(--soft-bg)]
            "
          >
            <img
              src={tool.img}
              alt={tool.name}
              className="w-6 h-6 object-contain"
            />
          </div>

          <span
            className="
              font-medium text-gray-800
              dark:text-[var(--text-primary)]
            "
          >
            {tool.name}
          </span>
        </div>

        {/* RIGHT */}
        <span
          className="
            text-xs font-semibold
            text-green-700
            dark:text-emerald-400
          "
        >
          {tool.count} open
        </span>
      </a>
    ))}
  </div>
</div>


        {/* Most Valuable */}
        <div>
  {/* HEADER (never scrolls) */}
  <div className="flex items-center justify-between mb-3">
    <h2 className="font-semibold text-[var(--text-primary)]">
      Most Valuable{" "}
      <span className="text-xs text-[var(--text-secondary)]">
        NIFTY100
      </span>
    </h2>
  </div>

  {/* SCROLLABLE ROW ONLY */}
  <div
    className="
      flex gap-3
      overflow-x-auto overflow-y-hidden
      scrollbar-hide
      pr-6
      snap-x snap-mandatory
      scroll-smooth
      overscroll-x-contain
    "
  >
    {topGainers.map((item, i) => (
      <div
        key={i}
        onClick={() => showStockPage(item.name)}
        className="
          min-w-[130px]
          h-[180px]
          rounded-xl
          shadow-sm
          p-4
          flex flex-col
          justify-between
          items-center
          text-center
          snap-start
          cursor-pointer
          transition

          bg-[var(--card-bg)]
          dark:border border-[var(--border-color)]
        "
      >
        {/* TOP */}
        <div className="flex flex-col items-center">
          <img
            src={item.logo}
            alt={item.name}
            className="w-10 h-10 object-contain mb-2 rounded-md"
          />

          <h3
            className="
              text-sm font-medium
              text-[var(--text-primary)]
              line-clamp-2
              min-h-[36px]
            "
          >
            {item.name}
          </h3>
        </div>

        {/* BOTTOM */}
        <div>
          <p className="text-base font-semibold text-[var(--text-primary)]">
            {item.price}
          </p>
          <span className="text-sm text-emerald-600">
            {item.change}
          </span>
        </div>
      </div>
    ))}
  </div>
</div>


      </div>

    {
      isWatchlist && <WatchlistPopup onClose={() => setIsWatchlist(false)} />
    }


    </>
  );
};

// Table for movers
const MarketTable = () => {
      const [hoveredRow, setHoveredRow] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
     // Bookmark API call
  const handleBookmark = async (company) => {
    try {
      await axios.post("/api/bookmark", { company });
      alert(`${company} bookmarked successfully!`);
    } catch (err) {
      console.error("Bookmark failed", err);
    }
  };
  const data = [
    { company: "Reliance", indexName: "RELIANCE", price: "₹2,987.30", volume: "12.3M" },
    { company: "Infosys Limited", indexName: "INFY", price: "₹1,540.25", volume: "9.8M" },
    { company: "TCS", indexName: "TCS", price: "₹3,700.00", volume: "8.1M" },
    { company: "HDFC", indexName: "HDFCBANK", price: "₹1,670.50", volume: "5.6M" },
    { company: "ICICI Bank", indexName: "ICICIBANK", price: "₹980.60", volume: "4.7M" },
  ];

   return (
    <div
  className="
    bg-white rounded-xl shadow overflow-x-auto relative
    dark:bg-[var(--card-bg)]
    dark:border dark:border-[var(--border-color)]
  "
>
  {/* Table */}
  <table className="min-w-full text-sm text-gray-700 dark:text-[var(--text-secondary)]">
    <thead
      className="
        bg-gray-100 text-gray-600 uppercase
        dark:bg-[var(--gray-800)]
        dark:text-[var(--text-secondary)]
      "
    >
      <tr>
        <th className="text-left px-6 py-3">Company</th>
        <th className="text-left px-6 py-3">Market price (1D)</th>
        <th className="text-left px-6 py-3">Volume</th>
      </tr>
    </thead>

    <tbody>
      {data.map((row, index) => (
        <tr
          key={row.company}
          className="
            border-t hover:bg-gray-50 relative
            dark:border-[var(--border-color)]
            dark:hover:bg-[var(--white-5)]
          "
          onMouseEnter={() => setHoveredRow(index)}
          onMouseLeave={() => setHoveredRow(null)}
        >
          <td className="px-6 py-3">
            <a
              href={`/stocks/${row.company}`}
              className="
                text-blue-900 hover:underline font-medium
                dark:text-[var(--text-primary)]
              "
            >
              {row.company}
            </a>
          </td>

          <td className="px-6 py-3 text-gray-700 dark:text-[var(--text-primary)]">
            {row.price}
          </td>

          <td className="px-6 py-3 flex items-center justify-between">
            <span className="dark:text-[var(--text-primary)]">
              {row.volume}
            </span>

            {/* Icons visible on hover */}
            {hoveredRow === index && (
              <div className="flex items-center gap-2 absolute right-6 top-2 transition-opacity duration-200">
                
                {/* Candle icon */}
                <button
                  onClick={() =>
                    window.open(
                      `https://www.tradingview.com/chart/?symbol=NSE:${row.indexName}`,
                      "_blank"
                    )
                  }
                  className="
                    p-1 rounded-full hover:bg-blue-100
                    dark:hover:bg-[var(--white-10)]
                  "
                  title="View Chart"
                >
                  <CandlestickChart
                    size={18}
                    className="text-blue-900 cursor-pointer dark:text-blue-400"
                  />
                </button>

                {/* Bookmark icon */}
                <button
                  onClick={() => handleBookmark(row.company)}
                  className="
                    p-1 rounded-full hover:bg-yellow-100
                    dark:hover:bg-[var(--white-10)]
                  "
                  title="Bookmark"
                >
                  <Bookmark
                    size={18}
                    className="text-yellow-600 cursor-pointer dark:text-yellow-400"
                  />
                </button>
              </div>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {/* Chart Popup */}
  {selectedStock && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div
        className="
          bg-white p-4 rounded-xl shadow-lg w-[90%] md:w-[60%] relative
          dark:bg-[var(--card-bg)]
          dark:border dark:border-[var(--border-color)]
        "
      >
        <button
          onClick={() => setSelectedStock(null)}
          className="
            absolute top-2 right-3 text-gray-600 hover:text-gray-900 text-xl
            dark:text-[var(--text-secondary)]
            dark:hover:text-[var(--text-primary)]
          "
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold text-blue-900 mb-2 dark:text-[var(--text-primary)]">
          {selectedStock} Chart
        </h2>

        <iframe
          src={`https://s.tradingview.com/widgetembed/?symbol=${selectedStock}&interval=1D&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=f1f3f6`}
          style={{ width: "100%", height: "400px", border: "none" }}
          title="TradingView Chart"
        />
      </div>
    </div>
  )}
</div>

  );
};

export default Explore;
