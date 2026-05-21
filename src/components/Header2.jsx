import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import icon from "../assets/favicon.png";
import SearchPopup from "./SearchPopup";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header2({ activeCategory }) {
  const [showSearch, setShowSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Detect which tab is active
  const activeTab = location.pathname.includes("explore")
    ? "Explore"
    : "Dashboard";

  // ⭐ FIXED: Redirect only when category changes AND user is not already in correct explore route
useEffect(() => {
  // Only do redirect on mobile
  if (window.innerWidth >= 1024) return;

  // Only redirect if first render and user is at root or unknown path
  if (location.pathname === "/" || location.pathname === "") {
    if (activeCategory === "stocks") {
      navigate("/user/stocks/explore", { replace: true });
    } else if (activeCategory === "funds") {
      navigate("/user/mutual_fund/explore", { replace: true });
    } else if (activeCategory === "future_option") {
      navigate("/user/future_option", { replace: true })
    }
  }
}, []); // Empty dependency → runs only on mount



  // Tab switching
  const handleTab = (tab) => {
    if (activeCategory === "stocks") {
      tab === "Explore"
        ? navigate("/user/stocks/explore")
        : navigate("/user/stocks/holdings");
    } else if (activeCategory === "funds") {
      tab === "Explore"
        ? navigate("/user/mutual_fund/explore")
        : navigate("/user/mutual_fund/investments");
    }
  };

  // Sticky scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* MAIN HEADER */}
<div
  className={`
    w-full shadow-sm transition-all duration-300
    bg-white dark:bg-[var(--card-bg)]
    border-b border-gray-100 dark:border-[var(--border-color)]
    ${
      scrolled
        ? "h-0 overflow-hidden opacity-0 pointer-events-none"
        : "h-auto opacity-100"
    }
  `}
>
  <div className="px-5 py-3 flex flex-col items-center">

    {/* Search */}
    <div className="relative w-full max-w-md">
      <img
        src={icon}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-6 opacity-80"
      />

      <div
        onClick={() => setShowSearch(true)}
        className="
          flex items-center justify-center
          border border-gray-200 dark:border-[var(--border-color)]
          rounded-full py-2 pl-10 pr-10
          bg-gray-50 dark:bg-[var(--white-5)]
          text-gray-500 dark:text-[var(--text-secondary)]
          cursor-pointer
        "
      >
        <Search className="w-4 h-4 mr-2 text-gray-400 dark:text-[var(--text-secondary)]" />
        <span className="text-sm">Search Wealthcrop...</span>
      </div>

      <img
        src={icon}
        onClick={() => navigate("/profile")}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 cursor-pointer opacity-80"
      />
    </div>

    {/* Tabs */}
    <div className="flex justify-center w-full max-w-md mt-4">
      {["Explore", "Dashboard"].map((tab) => (
        <button
          key={tab}
          onClick={() => handleTab(tab)}
          className={`
            flex-1 text-center pb-2 font-medium transition
            ${
              activeTab === tab
                ? "text-green-600 dark:text-emerald-400 border-b-2 border-green-600 dark:border-emerald-400"
                : "text-gray-700 dark:text-[var(--text-secondary)] border-b-2 border-transparent"
            }
          `}
        >
          {tab}
        </button>
      ))}
    </div>

  </div>
</div>



      {/* STICKY HEADER */}
<div
  className={`
    fixed top-0 left-0 w-full z-50 transition-opacity duration-300
    bg-white dark:bg-[var(--card-bg)]
    border-b border-gray-100 dark:border-[var(--border-color)]
    shadow-md
    ${
      scrolled
        ? "opacity-100"
        : "opacity-0 pointer-events-none"
    }
  `}
>
  <div className="flex justify-center w-full max-w-md mx-auto">
    {["Explore", "Dashboard"].map((tab) => (
      <button
        key={tab}
        onClick={() => handleTab(tab)}
        className={`
          flex-1 text-center pb-2 font-medium transition
          ${
            activeTab === tab
              ? "text-green-600 dark:text-emerald-400 border-b-2 border-green-600 dark:border-emerald-400"
              : "text-gray-700 dark:text-[var(--text-secondary)] border-b-2 border-transparent"
          }
        `}
      >
        {tab}
      </button>
    ))}
  </div>
</div>



      {showSearch && <SearchPopup onClose={() => setShowSearch(false)} />}
    </>
  );
}
