import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaAngleRight } from "react-icons/fa6";
import fnoExplore from "../../assets/future_options/fno-rejected.svg"
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CandlestickChart, Bookmark } from "lucide-react";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import axios from "axios";
import { IoLinkSharp } from "react-icons/io5";
import { fetchFno, fetchMarketMovers, fetchMarketProducts, fetchEtfs } from "../../api/marketApi";

const changeColor = (p) => (Number(p) >= 0 ? "text-green-600" : "text-red-600");

const ExploreFO = () => {

  const [category, setCategory] = useState("equity")
    const [activeTab, setActiveTab] = useState("Gainers");
      const [selected, setSelected] = useState("15 mins");
      const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [topTraded, setTopTraded] = useState([]);
  const [commodityCards, setCommodityCards] = useState([]);
  const [indexFutures, setIndexFutures] = useState([]);
  const [products, setProducts] = useState([]);
  const [etfs, setEtfs] = useState([]);

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

  useEffect(() => {
    fetchFno("top-traded", category)
      .then((r) => setTopTraded(r?.data ?? []))
      .catch(() => setTopTraded([]));
  }, [category]);

  useEffect(() => {
    Promise.all([
      fetchFno("commodities"),
      fetchFno("index-futures"),
      fetchMarketProducts(),
      fetchEtfs(),
    ])
      .then(([c, idx, p, e]) => {
        setCommodityCards(c?.data ?? []);
        setIndexFutures(idx?.data ?? []);
        setProducts(p?.data ?? []);
        setEtfs(e?.data ?? []);
      })
      .catch(() => {});
  }, []);

    const options = [
    { label: "15 mins", link: "/nifty-100" },
    { label: "1 day", link: "/nifty-500" },
  ];

    const handleSelect = (option) => {
    setSelected(option.label);
    setOpen(false);
    // window.location.href = option.link; // redirect
  };  

 
  return (
    <div className='min-h-screen bg-white dark:bg-(--app-bg) text-blue-950'>

         <div className="mt-10 px-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* left side content */}
                  <div className="lg:col-span-2 ">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                      {/* Left Section */}
                      <div className="lg:col-span-2">
                        <h2 className="font-semibold text-xl mb-6 text-blue-950 dark:text-(--text-primary)">
                          Top traded
                        </h2>

                        <div className="mb-2 space-x-2 ">
                          <button onClick={() => setCategory("equity") } className={`text-xs px-4 py-2 rounded-full border border-gray-700 hover:bg-gray-200/70 dark:hover:bg-[var(--white-10)] text-gray-700 font-medium dark:text-[var(--text-primary)] dark:border-(--border-color) dark:bg-[var(--white-5)]
                            ${category === "equity" ? "bg-gray-200/70 dark:bg-[var(--white-10)]" : ""}`}>Equity</button>
                          <button onClick={() => setCategory("commodities")} className={`text-xs hover:bg-gray-200/70 dark:hover:bg-[var(--white-10)] px-4 py-2 rounded-full border border-gray-700 text-gray-700 font-medium dark:text-[var(--text-primary)] dark:border-(--border-color) dark:bg-(--white-5)
                            ${category === "commodities" ? "bg-gray-200/70 dark:bg-[var(--white-10)]" : ""}`}>Commodities</button>
                        </div>
        
                        {/* Stock grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-4 gap-6 relative">
          {topTraded.map((data, index) => (
            <div
              key={index}
              className="
                relative flex flex-col justify-between p-5 h-48 cursor-pointer
                bg-white border border-gray-200 rounded-xl shadow-sm
                hover:shadow-md transition-all duration-300
                dark:bg-[var(--card-bg)]
                dark:border-[var(--border-color)]
              "
           
            >
               
                <h3 className="
                  font-semibold text-sm line-clamp-2 min-h-10
                  text-blue-950
                  dark:text-[var(--text-primary)]
                ">
                  {data.name}
                </h3>

                <p>Chart</p>
             
        
              {/* Price + Change */}
              <div className="flex flex-col lg:flex-row items-center justify-between">
                <div>
                <p className="
                  text-lg font-bold mt-2
                  text-gray-800
                  dark:text-[var(--text-primary)]
                ">
                  ₹{data.price}
                </p>
        
                <p className={`text-sm font-medium ${changeColor(data.pChange)}`}>
                  {data.value}
                </p>
              </div>
              <p className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[var(--white-10)] dark:text-[var(--text-primary)] flex items-center justify-center font-semibold text-gray-700">
 <IoLinkSharp />
</p>

              </div>

            </div>
          ))}
        </div>
        
        
                        {/* See more link */}
                        <div className="mt-6 pl-2">
                          <Link
                            to="/"
                            className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all duration-200"
                          >
                            See more <FaAngleRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>

                        {/* Row 2 */}
                                {/* Top market movers */}
                                <div className="hidden lg:block lg:col-span-2 mt-5 mb-10">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-lg text-slate-900 dark:text-[var(--text-primary)]">
                          F&O Stocks
                        </h2>
                    
                        <div className="flex gap-2">
                          {["Gainers", "Losers"].map((btn) => (
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
                    
                      <MarketTable activeTab={activeTab} />
                       {/* See more link */}
                                      <div className="mt-6 pl-2">
                                        <Link
                                          to="/"
                                          className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all duration-200"
                                        >
                                          See more <FaAngleRight size={14} />
                                        </Link>
                                      </div>
                    </div>
        
                    {/* Row 3 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                                {/* Left Section */}
                                <div className="lg:col-span-2">
                                  <h2 className="flex gap-4 font-semibold text-xl mb-6 text-blue-950 dark:text-(--text-primary)">
                                    Commodities <p>{commodityCards.length}</p>
                                  </h2>
                  
                                  {/* Stock grid */}
                                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                    {commodityCards.map((stock) => (
                      <div
                        key={stock.name}
                        className="
                          relative flex flex-col justify-between p-5 h-48 cursor-pointer
                          bg-white border border-gray-200 rounded-xl shadow-sm
                          hover:shadow-md transition-all duration-300
                          dark:bg-[var(--card-bg)]
                          dark:border-[var(--border-color)]
                        "
                      >
                      
                        {/* Logo + Name */}
                        <div>
                          <h3 className="
                            font-semibold text-sm line-clamp-2 min-h-10
                            text-blue-950
                            dark:text-[var(--text-primary)]
                          ">
                            {stock.name}
                          </h3>
                        </div>
                  
                        {/* Price + Change */}
                        <div>
                          <p className="
                            text-lg font-bold mt-2
                            text-gray-800
                            dark:text-[var(--text-primary)]
                          ">
                            ₹{stock.price}
                          </p>
                  
                          <p className={`text-sm font-medium ${changeColor(stock.pChange)}`}>
                            {stock.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  
                                  {/* See more link */}
                                  <div className="mt-6 pl-2">
                                    <Link
                                      to="/"
                                      className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all duration-200"
                                    >
                                      See more <FaAngleRight size={14} />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                  
                   {/* Row 4 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                                {/* Left Section */}
                                <div className="lg:col-span-2">
                                  <h2 className="flex gap-4 font-semibold text-xl mb-6 text-blue-950 dark:text-(--text-primary)">
                                    Top traded index futures
                                  </h2>
                  
                                  {/* Stock grid */}
                                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                    {indexFutures.map((stock) => (
                      <div
                        key={stock.name}
                        className="
                          relative flex flex-col justify-between p-5 h-48 cursor-pointer
                          bg-white border border-gray-200 rounded-xl shadow-sm
                          hover:shadow-md transition-all duration-300
                          dark:bg-[var(--card-bg)]
                          dark:border-[var(--border-color)]
                        "
                      >
                      
                        <div>
                          <h3 className="
                            font-semibold text-sm line-clamp-2 min-h-10
                            text-blue-950
                            dark:text-[var(--text-primary)]
                          ">
                            {stock.name}
                          </h3>
                        </div>
                  
                        <div>
                          <p className="
                            text-lg font-bold mt-2
                            text-gray-800
                            dark:text-[var(--text-primary)]
                          ">
                            ₹{stock.price}
                          </p>
                  
                          <p className={`text-sm font-medium ${changeColor(stock.pChange)}`}>
                            {stock.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  
                                  {/* See more link */}
                                  <div className="mt-6 pl-2">
                                    <Link
                                      to="/"
                                      className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all duration-200"
                                    >
                                      See more <FaAngleRight size={14} />
                                    </Link>
                                  </div>
                                </div>
                              </div>
        
        
                  </div>
        
                  {/* right side content */}
                  <div className="lg:col-span-1">
          {/* Investments */}
          <div>
        
            <div
              className="
                bg-white rounded-xl border border-gray-300 flex-col p-4
                text-center h-[350px] flex items-center justify-center
                text-gray-500
                dark:bg-[var(--card-bg)]
                dark:text-[var(--text-secondary)]
                dark:border-[var(--border-color)] space-y-6
              "
            >
              <img src={fnoExplore} alt="" />
              <div className="space-y-1">
                <p className="mt-5 text-lg text-gray-600 font-medium">Upload your document</p>
                <p className="text-sm">Your income proof was rejected</p>
              </div>
              <button className="w-full cursor-pointer font-heading py-2 rounded-lg font-medium uppercase bg-emerald-600 text-white">Upload your data</button>
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
              {products.map((tool) => (
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
              {etfs.map((etf) => (
                <a
                  href="#"
                  key={etf.name ?? etf}
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
                    {etf.name ?? etf}
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


    </div>
  )
}

// Table for movers
const MarketTable = ({ activeTab }) => {
      const [hoveredRow, setHoveredRow] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    const type = activeTab === "Losers" ? "losers" : "gainers";
    fetchMarketMovers(type)
      .then((r) => setData(r?.data ?? []))
      .catch(() => setData([]));
  }, [activeTab]);

     // Bookmark API call
  const handleBookmark = async (company) => {
    try {
      await axios.post("/api/bookmark", { company });
      alert(`${company} bookmarked successfully!`);
    } catch (err) {
      console.error("Bookmark failed", err);
    }
  };

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
        <th className="text-left px-6 py-3">Stocks</th>
        <th className="text-left px-6 py-3">Price</th>
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
                  <IoLinkSharp
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
          src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(selectedStock?.includes(":") ? selectedStock : `NSE:${selectedStock}`)}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=f1f3f6&theme=light&style=1&timezone=Asia%2FKolkata`}
          style={{ width: "100%", height: "400px", border: "none" }}
          title="TradingView Chart"
        />
      </div>
    </div>
  )}
</div>

  );
};

export default ExploreFO