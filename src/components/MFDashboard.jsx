import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { FaBasketballBall } from 'react-icons/fa'; // Import the basket icon
import MobileSearchBox from "./MobileSearchBox";


const MFDashboard = () => {
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
  { name: "Internal Portfolio", link: "investments" },
  { name: "External Portfolio", link: "external" },
  { name: "Combined Portfolio", link: "combined" },
  { name: "SIPs", link: "sip" },
  { name: "Orders", link: "orders" },
  { name: "Watchlist", link: "watchlist" },
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
     <div className="bg-white dark:bg-[var(--app-bg)] dark:text-[var(--text-primary)] hidden lg:block pb-2">

      {/* ================= STICKY HEADER ================= */}
      <div
        className={`transition-top duration-300 ease-in-out border-b bg-white
          dark:bg-[var(--card-bg)]
          dark:border-[var(--border-color)]
          ${
            isSticky
              ? "fixed top-0 left-0 w-full shadow-sm z-50"
              : "relative"
          }`}
      >
        <div className="flex flex-col px-10 py-5 gap-3.5">

          {/* SMALL LABEL */}
          <p className="text-[10px] tracking-wide uppercase text-[var(--text-secondary)]">
            Explore Mutual Fund
          </p>

          {/* TABS + BUTTON */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">

            {/* NAV TABS */}
            <nav className="flex gap-8 text-md font-medium overflow-x-auto">
              {topTabs.map((tab) => (
                <NavLink
                  key={tab.name}
                  to={tab.link}
                  end
                  className={({ isActive }) =>
                    `relative pb-1 transition
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

            {/* BASKETS BUTTON */}
            <Link to="/baskets">
              <button className="flex items-center gap-2 px-4 py-2 rounded-md
                bg-sky-500 hover:bg-sky-600
                text-white text-sm font-medium
                shadow-sm transition"
              >
                <FaBasketballBall className="text-sm" />
                Baskets
              </button>
            </Link>

          </div>
        </div>
      </div>

      <div className={`${isSticky ? "pt-[92px]" : "mt-2"}`} />
    </div>


    {/* MOBILE VIEW */}
    <div className="lg:hidden mb-8 mt-2">
      {/* You can add mobile tabs or keep empty */}

               {/* Tabs + Search */}
           <div className="lg:hidden block">  
           <MobileSearchBox/>
{/* Neo ke mobile tabs flat pills hain — gradient, ring aur drop-shadow hata diye.
    Active = solid blue fill, baaki sirf text. Rang wahi purana blue. */}
<div className="bg-slate-100 dark:bg-[var(--white-5)] p-1 rounded-lg">
  <nav className="flex gap-1 items-center overflow-x-auto scrollbar-hide">
    {topTabs.map((tab) => (
      <NavLink
        key={tab.name}
        to={tab.link}
        end
        className={({ isActive }) =>
          `px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            isActive
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-white"
          }`
        }
      >
        {tab.name}
      </NavLink>
    ))}
  </nav>
</div>
 </div>

    </div>

    {/* ================= OUTLET =================
        Ek hi Outlet. Pehle do the — ek desktop wrapper (hidden lg:block) mein, ek
        mobile wrapper (lg:hidden) mein. `hidden` sirf nazar se hatata hai, React
        dono ko mount karta hai: har MF child route do dafa chalta tha, do dafa
        query bhejta tha, aur DOM bhi do dafa banta tha. Wrapper responsive rahenge,
        content ek hi baar. */}
    <div className="lg:px-10">
      <Outlet />
    </div>
  </>
);

};


export default MFDashboard;
