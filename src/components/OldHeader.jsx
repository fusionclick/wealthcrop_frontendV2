import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HiMenu, HiX, HiBell, HiUserCircle } from "react-icons/hi";
import { IoArrowBack } from "react-icons/io5";
import logo from "../assets/logo.png";
import { useDispatch, useSelector } from "react-redux";
import SearchPopup from "./SearchPopup";
import { login, logout } from "../redux/authenticationSlice";
import StockImage from "../assets/mutualFund/stock.jpg";
import StockImage2 from "../assets/mutualFund/stock1.jpg";
import StockImage3 from "../assets/mutualFund/stock2.jpg";
import {
  User,
  Mail,
  IndianRupee,
  FileText,
  Headphones,
  BarChart3,
  LogOut,
  Settings,
  Sun,
  ChevronRight,
} from "lucide-react";
import {
  FileSearch,
  LayoutDashboard,
  PieChart,
  LineChart,
} from "lucide-react";
import {
  CandlestickChart,
} from "lucide-react";
import {
  HelpCircle,
  BookOpen,
  Lightbulb,
} from "lucide-react";



const token = localStorage.getItem("token"); // check login


import MutualFundCarousel from "../carousel/MutualFundCarousel";
import MutualFundsMenu from "./hovercomp/MutualFundsMenu";
import StocksMenu from "./hovercomp/StocksMenu";
import FOMenu from "./hovercomp/FOMenu";
import MoreMenu from "./hovercomp/MoreMenu";
import ThemeToggle from "../utils/ThemeToggle";
import socket from "../utils/socket";

export default function OldHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [investOpen, setInvestOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAll, setShowAll] = useState(false)

  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate()

  // To Scroll open
  const [isScroll, setIsScroll] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;

      if (currentScroll > lastScroll && currentScroll > 50) {
        // scrolling DOWN → hide header
        setIsScroll(true);
      } else {
        // scrolling UP → show header
        setIsScroll(false);
      }

      setLastScroll(currentScroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);



  // ✅ Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // ✅ Keep Redux in sync if localStorage token removed manually
  useEffect(() => {
    const checkToken = () => {
      const storedToken = localStorage.getItem("token");
      if (!storedToken && token) {
        dispatch({ type: "auth/logout" });
      }
    };

    checkToken();
    window.addEventListener("storage", checkToken);
    return () => window.removeEventListener("storage", checkToken);
  }, [token, dispatch]);

  // const handleLogout = () => {
  //   localStorage.clear();
  //   dispatch(logout());
  //   navigate("/"); // redirect to home
  //   // window.location.reload()
  // };

  const handleLogout = () => {
  localStorage.removeItem("currentAccount");

  dispatch(logout());
  navigate("/");
};

  const handleSetting = () => {
    navigate("/profile")
  }

//! For switch account
  const handleSwitch = (acc) => {
  localStorage.setItem("currentAccount", JSON.stringify(acc));

  dispatch(login(acc.token));

  // socket?.disconnect();

  // socket = io(BASE_URL, {
  //   auth: { token: acc.token }
  // });


  window.location.reload(); // for now (later remove)
};

  // ---------------- Mobile Menu States ----------------

// Mutual Fund dropdown
const [mfOpen, setMfOpen] = useState(false);

// Stocks dropdown
const [stocksOpen, setStocksOpen] = useState(false);

// F&O dropdown
const [fnoOpen, setFnoOpen] = useState(false);

// Calculators dropdown
// const [calcOpen, setCalcOpen] = useState(false);

// // Invest In (your older section)
// const [investOpen, setInvestOpen] = useState(false);

// // Mobile Search
// const [isSearchOpen, setIsSearchOpen] = useState(false);
const accounts = JSON.parse(localStorage.getItem("accounts")) || []
const visibleAcounts = showAll ? accounts : accounts.slice(0,2)
const current = JSON.parse(localStorage.getItem("currentAccount"))
const userName = current?.name
const email = current?.email
const phone = current?.phone

  return (
    <>
     <nav
  className={`w-full bg-white dark:bg-[var(--app-bg)] shadow-sm
  border-b border-gray-100 dark:border-[var(--border-color)]
  fixed top-0 left-0 z-50 transition-all duration-300
  ${isScroll ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}
>
  {/* ⭐ Always on top of everything */}
  <MutualFundCarousel />

  <div className="flex justify-between items-center px-6 md:px-12">
    {/* Logo */}
    <div className="flex items-center space-x-2">
      <Link to="/" className="mb-1">
        <img
          className="w-36 md:w-40 h-auto"
          src={logo}
          alt="Wealthcrop Logo"
        />
      </Link>
    </div>

    {/* Desktop Navigation */}
    <div className="hidden md:flex items-center relative">
      <StocksMenu token={token} />
      <MutualFundsMenu token={token} />
      <FOMenu token={token} />
      {!token && <MoreMenu token={token} />}
    </div>

    {/* Search (Desktop) */}
    <div className="hidden md:flex flex-1 mx-8 max-w-md relative">
      <input
        type="text"
        placeholder="Search for stocks, mutual funds..."
        onFocus={() => token && setIsSearchOpen(true)}
        className="
          w-full border border-gray-200 dark:border-white/10
          bg-white dark:bg-white/5
          rounded-full pl-10 pr-4 py-2 text-sm
          focus:outline-none focus:ring-1 focus:ring-blue-700
          text-blue-900 dark:text-gray-200
          placeholder-gray-400 dark:placeholder-gray-500
          shadow-sm cursor-pointer
        "
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 absolute left-3 top-2.5 text-gray-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
        />
      </svg>
    </div>

    {/* Right Side */}
    <div className="hidden md:flex items-center space-x-5">
      {token ? (
        <>
          <Link to="/notifications" className="text-blue-900 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition relative">
            <HiBell className="text-2xl" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full"></span>
          </Link>

          <div className="relative group">
            <button className="text-blue-900 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition cursor-pointer mt-1.5">
              <User className="text-3xl" />
            </button>

            {/* Dropdown */}
            
                  {/* Dropdown */}
                 <div
  className="
    absolute -right-2.5 top-full mt-1 w-80 
    bg-white dark:bg-gray-800 
    text-gray-900 dark:text-gray-200
    rounded-xl shadow-xl 
    border border-gray-100 dark:border-gray-700
    opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-1
    transition-all duration-300 ease-out z-50"
>
  {/* Header */}
  <div
    className="flex items-start justify-between px-4 py-3 
               border-b border-gray-100 dark:border-gray-700"
  >
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
        {userName}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {email}
      </p>
    </div>
    <Settings
      onClick={handleSetting}
      size={18}
      className="text-gray-500 dark:text-gray-400 mt-1 cursor-pointer"
    />
  </div>

  {/* Switch Accounts */}
  <div className="border-b border-gray-100 dark:border-gray-700">
  <p className="px-4 py-2 text-xs text-gray-500">Switch Account</p>

<div className="h-26 overflow-y-auto">
  {visibleAcounts.map((acc) => (
    <div
      key={acc.userId}
      onClick={() => handleSwitch(acc)}
      className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
        current?.userId === acc.userId ? "bg-blue-50 dark:bg-blue-900/20" : ""
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
        {acc.name.charAt(0)}
      </div>

      <div>
        <p className="text-sm font-medium">{acc.name}</p>
        <p className="text-xs text-gray-500">{acc.email}</p>
      </div>
    </div>
  ))}
</div>
  {
    accounts.length > 2 && (
      <div onClick={() => setShowAll(!showAll)} className="px-4 py-2 text-blue-600 cursor-pointer hover:bg-gray-100 dark:hover:bg[var(--gray-800)] text-xs font-semibold flex items-center gap-1">
        {showAll ? "Show less ↑" : "Show more ↓"}
      </div>
    )
  }

  {/* Add Account */}
  <div
    onClick={() => navigate("/login")}
    className="px-4 py-2 text-blue-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
  >
    + Add Account
  </div>
</div>

  {/* Balance */}
  <Link
    to="/user/balance"
    className="
      flex items-center justify-between px-4 py-3 
      border-b border-gray-100 dark:border-gray-700
      hover:bg-gray-50 dark:hover:bg-gray-800
      transition"
  >
    <div className="flex items-center gap-2">
      <IndianRupee size={18} className="text-gray-600 dark:text-gray-300" />
      <div>
        <p className="text-gray-900 dark:text-gray-100 font-medium">
          ₹0.00
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Stocks, F&O balance
        </p>
      </div>
    </div>
    <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
  </Link>

  {/* Links */}
  <div className="py-2 space-y-1">
    <Link
      to="/user/order/stocks"
      className="
        flex items-center justify-between px-4 py-2 
        text-gray-800 dark:text-gray-200 
        hover:bg-gray-50 dark:hover:bg-gray-800
        transition"
    >
      <div className="flex items-center gap-3">
        <FileText size={18} className="dark:text-gray-300" />
        <span>All Orders</span>
      </div>
      <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
    </Link>

    <Link
      to="/support"
      className="
        flex items-center justify-between px-4 py-2 
        text-gray-800 dark:text-gray-200 
        hover:bg-gray-50 dark:hover:bg-gray-800
        transition"
    >
      <div className="flex items-center gap-3">
        <Headphones size={18} className="dark:text-gray-300" />
        <span>24 × 7 Customer Support</span>
      </div>
      <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
    </Link>

    <Link
      to="/reports"
      className="
        flex items-center justify-between px-4 py-2 
        text-gray-800 dark:text-gray-200 
        hover:bg-gray-50 dark:hover:bg-gray-800
        transition"
    >
      <div className="flex items-center gap-3">
        <BarChart3 size={18} className="dark:text-gray-300" />
        <span>Reports</span>
      </div>
      <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
    </Link>
  </div>

  {/* Footer */}
  <div
    className="flex items-center justify-between px-4 py-3 
               border-t border-gray-100 dark:border-gray-700"
  >
    <button
      onClick={handleLogout}
      className="
        flex items-center gap-2 
        text-gray-700 dark:text-gray-300 
        cursor-pointer hover:text-blue-700 dark:hover:text-blue-400 
        font-medium border-b border-dashed"
    >
      <LogOut size={18} />
      <span>Log out</span>
    </button>

    <ThemeToggle />
  </div>
</div>
          </div>
        </>
      ) : (
        <>
          <Link
            to="/login"
            className="bg-blue-900 text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-blue-800 shadow-sm transition"
          >
            Login / Signup
          </Link>
          <ThemeToggle />
        </>
      )}
    </div>

    {/* Mobile Menu Toggle */}
    <button
      className="md:hidden text-blue-900 dark:text-gray-200 text-2xl"
      onClick={() => setMenuOpen(!menuOpen)}
    >
      {menuOpen ? <HiX /> : <HiMenu />}
    </button>
  </div>

 {/* Mobile Dropdown */}
<div
  className={`md:hidden space-y-4
  bg-white dark:bg-[#020617]
  border-t border-gray-100 dark:border-white/10
  px-6 py-4 shadow-md transition-all duration-300 ease-in-out ${
    menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden"
  }`}
>
  {/* ---------------- MUTUAL FUND (mobile dropdown) ---------------- */}
  <div>
    <button
      onClick={() => setMfOpen(!mfOpen)}
      className="w-full flex justify-between items-center
      text-blue-900 dark:text-gray-200
      font-medium"
    >
      <span>Mutual Funds</span>
      <span>{mfOpen ? "▴" : "▾"}</span>
    </button>

    {mfOpen && (
      <div className="pl-4 pt-2 space-y-2 text-sm">
        <Link to="/user/mutual_fund" className="block text-blue-900 dark:text-gray-300">
          Explore Funds
        </Link>
        <Link to="/user/mf/sip" className="block text-blue-900 dark:text-gray-300">
          SIP Investment
        </Link>
        <Link to="/user/mf/compare" className="block text-blue-900 dark:text-gray-300">
          Compare Funds
        </Link>
        <Link to="/user/mf/elss" className="block text-blue-900 dark:text-gray-300">
          ELSS Tax Saving
        </Link>
      </div>
    )}
  </div>

  {/* ---------------- STOCKS (mobile dropdown) ---------------- */}
  <div>
    <button
      onClick={() => setStocksOpen(!stocksOpen)}
      className="w-full flex justify-between items-center
      text-blue-900 dark:text-gray-200
      font-medium"
    >
      <span>Stocks</span>
      <span>{stocksOpen ? "▴" : "▾"}</span>
    </button>

    {stocksOpen && (
      <div className="pl-4 pt-2 space-y-2 text-sm">
        <Link to="/user/stocks" className="block text-blue-900 dark:text-gray-300">
          Stock Dashboard
        </Link>
        <Link to="/user/ipo" className="block text-blue-900 dark:text-gray-300">
          IPO
        </Link>
        <Link to="/user/screener" className="block text-blue-900 dark:text-gray-300">
          Stock Screener
        </Link>
        <Link to="/user/etf" className="block text-blue-900 dark:text-gray-300">
          ETF Investing
        </Link>
      </div>
    )}
  </div>

  {/* ---------------- F&O (mobile dropdown) ---------------- */}
  <div>
    <button
      onClick={() => setFnoOpen(!fnoOpen)}
      className="w-full flex justify-between items-center
      text-blue-900 dark:text-gray-200
      font-medium"
    >
      <span>F&O</span>
      <span>{fnoOpen ? "▴" : "▾"}</span>
    </button>

    {fnoOpen && (
      <div className="pl-4 pt-2 space-y-2 text-sm">
        <Link to="/user/fno/index-futures" className="block text-blue-900 dark:text-gray-300">
          Index Futures
        </Link>
        <Link to="/user/fno/stock-futures" className="block text-blue-900 dark:text-gray-300">
          Stock Futures
        </Link>
        <Link to="/user/fno/options" className="block text-blue-900 dark:text-gray-300">
          Options Trading
        </Link>
        <Link to="/user/fno/chains" className="block text-blue-900 dark:text-gray-300">
          Option Chain
        </Link>
      </div>
    )}
  </div>

  {/* ---------------- CALCULATORS ---------------- */}
  <div className="mt-4">
    <button
      onClick={() => setCalcOpen(!calcOpen)}
      className="w-full flex justify-between items-center
      text-blue-900 dark:text-gray-200
      font-medium"
    >
      <span>Calculators</span>
      <span>{calcOpen ? "▴" : "▾"}</span>
    </button>

    {calcOpen && (
      <div className="pl-4 pt-2 space-y-2 text-sm">
        <Link className="block text-blue-900 dark:text-gray-300">
          Mutual Fund Calculator
        </Link>
        <Link className="block text-blue-900 dark:text-gray-300">
          FD Calculator
        </Link>
        <Link className="block text-blue-900 dark:text-gray-300">
          Retirement Calculator
        </Link>
      </div>
    )}
  </div>

  {/* ---------------- Static Links ---------------- */}
  <Link to="/blogs" className="block text-blue-900 dark:text-gray-200 font-medium">
    Blog
  </Link>
  <Link to="/help" className="block text-blue-900 dark:text-gray-200 font-medium">
    Help
  </Link>

  {/* ---------------- AUTH SECTION ---------------- */}
  {token ? (
    <div className="flex items-center justify-center gap-5 mt-5
    text-blue-900 dark:text-gray-200">
      <HiBell className="text-2xl" />
      <Link to="/profile">
        <HiUserCircle className="text-3xl" />
      </Link>
    </div>
  ) : (
    <Link
      to="/login"
      className="block text-center bg-blue-900 hover:bg-blue-800
      text-white rounded-full px-5 py-2 text-sm font-medium mt-4"
    >
      Login / Signup
    </Link>
  )}

  {/* Mobile Search (PRESERVED) */}
  <div className="mt-3">
    <input
      type="text"
      placeholder="Search..."
      onFocus={() => token && setIsSearchOpen(true)}
      className="
        w-full border border-gray-200 dark:border-white/10
        bg-white dark:bg-white/5
        rounded-full px-4 py-2 text-sm
        focus:outline-none focus:ring-1 focus:ring-blue-700
        text-blue-900 dark:text-gray-200
        placeholder-gray-400 dark:placeholder-gray-500
      "
    />
  </div>
</div>

</nav>


      {/*  Global Search Popup */}
      {isSearchOpen && <SearchPopup onClose={() => setIsSearchOpen(false)} />}
    </>
  );
}
