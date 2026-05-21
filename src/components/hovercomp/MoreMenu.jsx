import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Newspaper,
  User,
  HelpCircle,
  Download,
  Gift,
  Landmark,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import moreMenuImg from "../../assets/menu/moreMenu.svg";

const MoreMenu = ({ token }) => {
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setOpenMenu(false);
  }, [location.pathname]);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setOpenMenu(true)}
      onMouseLeave={() => setOpenMenu(false)}
    >
      {/* NAV ITEM */}
      <button className="h-16 px-4 font-semibold cursor-pointer
                         text-blue-900 dark:text-white
                         hover:text-blue-600 dark:hover:text-blue-400">
        More
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

            {/* ================= ONE ROW LAYOUT ================= */}
            <div className="grid grid-cols-[320px_1fr] gap-12">

              {/* ========= LEFT INFO PANEL ========= */}
              <div className="pr-8 border-r border-slate-300 dark:border-white/10">
                <div className="w-58 h-28 mb-4 rounded-xl overflow-hidden">
                  <img
                    src={moreMenuImg}
                    alt="More menu"
                    className="w-full h-full object-contain"
                  />
                </div>

                <h2 className="text-xl font-semibold text-blue-950 dark:text-gray-100 mb-2">
                  Tools & Resources
                </h2>

                <p className="text-sm leading-relaxed mb-4
                              text-slate-600 dark:text-gray-400">
                  Explore calculators, learning resources, research tools and
                  account-related services to manage your finances better.
                </p>

                <button
                  onClick={() => navigate("/calculators")}
                  className="
                    inline-flex items-center gap-1 px-4 py-1.5 rounded-full
                    bg-gray-200 dark:bg-white/10
                    text-blue-900 dark:text-gray-200
                    text-sm font-medium
                    hover:bg-gray-300 dark:hover:bg-white/15
                  "
                >
                  Explore All <ArrowRight size={14} />
                </button>
              </div>

              {/* ========= RIGHT MENU GRID ========= */}
              <div className="grid grid-cols-3 gap-10 text-sm">

                {/* Calculators */}
                <div className="space-y-4 pr-8 border-r border-slate-300 dark:border-white/10">
                  <h3 className="font-semibold text-blue-950 dark:text-gray-100">
                    Calculators
                  </h3>

                  <MenuItem
                    icon={Calculator}
                    title="SIP Calculator"
                    desc="Plan long-term wealth."
                    onClick={() => navigate("/calculator/sip-calculator")}
                  />

                  <MenuItem
                    icon={Landmark}
                    title="FD Calculator"
                    desc="Calculate FD maturity."
                    onClick={() => navigate("/calculator/fd-calculator")}
                  />

                  <MenuItem
                    icon={Gift}
                    title="SWP Calculator"
                    desc="Smart withdrawal planning."
                    onClick={() => navigate("/calculator/swp-calculator")}
                  />
                </div>

                {/* Research */}
                <div className="space-y-4 pr-8 border-r border-slate-300 dark:border-white/10">
                  <h3 className="font-semibold text-blue-950 dark:text-gray-100">
                    Research
                  </h3>

                  <MenuItem
                    icon={Newspaper}
                    title="Market News"
                    desc="Daily market updates."
                    onClick={() => navigate("/market-news")}
                  />

                  <MenuItem
                    icon={BookOpen}
                    title="Learning Center"
                    desc="Beginner to advanced."
                    onClick={() => navigate("/learning-centre")}
                  />

                  <MenuItem
                    icon={Newspaper}
                    title="Blog"
                    desc="Insights & articles."
                    onClick={() => navigate("/blogs")}
                  />
                </div>

                {/* Account & Support */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-blue-950 dark:text-gray-100">
                    Account & Support
                  </h3>

                  <MenuItem
                    icon={User}
                    title="Profile"
                    desc="Manage your account."
                    onClick={() => navigate("/profile")}
                  />

                  <MenuItem
                    icon={HelpCircle}
                    title="Help & Support"
                    desc="FAQs & guidance."
                    onClick={() => navigate("/support")}
                  />

                  <MenuItem
                    icon={Download}
                    title="Downloads"
                    desc="Statements & reports."
                    onClick={() => navigate("/downloads")}
                  />
                </div>
              </div>
            </div>
            {/* ================================================== */}
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= REUSABLE ITEM ================= */
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

export default MoreMenu;
