import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import invest from "../assets/top investment/topinvest.svg";
import { FaAngleRight } from "react-icons/fa6";
import { ArrowLeft } from "lucide-react";
import { HiBell } from "react-icons/hi";
import {
  IndianRupee,
  FileText,
  Headphones,
  BarChart3,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  User,
  KeyRound,
  Activity,
  Users,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login, logout } from "../redux/authenticationSlice";
import { useDispatch } from "react-redux";
import ThemeToggle from "../utils/ThemeToggle";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "../utils/format";
import { toastWarn } from "../utils/notifyCustom";

const Profile = () => {

    // ---------------- STATIC DATA ----------------
  const riskProfile = {
    isSet: true, // 🔁 change to false to test NOT SET state
    category: "Moderate",
    equityLimit: "50%",
    debtLimit: "40%",
    goldLimit: "10%",
    lastUpdated: "12 Jan 2025",
  };
  

  const options = [
    { name: "Basic Details", path: "basic" },
    { name: "Change Password", path: "change-password" },
    { name: "Change PIN", path: "change-pin" },
    { name: "Report suspicious activity", path: "report-activity" },
    { name: "Nominee Details", path: "nominee_details" },
    { name: "Account Related Forms", path: "account-forms" },
  ];

    const [showAll, setShowAll] = useState(false)
  const [mobileVerify, setMobileVerify] = useState(false)
  const [emailVerify, setEmailVerify] = useState(false)

  const dispatch = useDispatch();
  const navigate = useNavigate();



  const fetchUser = async () => {
    const url = `${import.meta.env.VITE_URL}${import.meta.env.VITE_USER_DATA}`;
    const res = await getApiWithToken(url);
  
    if (!(res?.status === 200 || res?.status === true)) {
      throw new Error(res?.message || "Failed to fetch");
    }
  
    console.log("User Data", res?.data);
    
    return res.data;
  };
  
  
  const { data: userData, isLoading, error, refetch } = useQuery({
    queryKey: ["userData"],
    queryFn: fetchUser,
  });



   const redirectRiskProfile = () => {
  
        const isReUpdate = userData?.risk_profile?.updated_at < Date.now() 
        if(!isReUpdate) return toastWarn(`You can update after ${formatDate(userData?.risk_profile?.next_allowed_at)} `)
      
      navigate("/risk")
    }


 const handleLogout = () => {
  localStorage.removeItem("currentAccount");

  dispatch(logout());
  navigate("/");
};

  const handleSetting = () => {
    navigate("/profile/basic");
  };

  const onClose = () => {
    navigate(-1);
  };

  const accounts = JSON.parse(localStorage.getItem("accounts")) || []
const visibleAcounts = showAll ? accounts : accounts.slice(0,2)
const current = JSON.parse(localStorage.getItem("currentAccount"))
const userName = current?.name
const email = current?.email
const phone = current?.phone

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

  return (
    <>
      {/* ================= DESKTOP ================= */}
      <div className="hidden lg:block mt-10 px-16 py-8 bg-white dark:bg-[#020617]">
        <div className="flex gap-6 items-start w-full">

          {/* LEFT SIDEBAR */}
          <div className="w-[30%] border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
            <div className="w-full h-52 flex justify-center items-center">
              <img src={invest} alt="Profile" className="w-44 opacity-90" />
            </div>

            {/* RISK PROFILE CARD */}
             <div className="px-4 pb-4">
              {userData?.risk_profile ? (
                <div className="border border-gray-300 dark:border-slate-700 rounded-xl p-4 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="text-green-600" size={18} />
                    <h4 className="font-semibold text-green-700 dark:text-green-400">
                      Risk Profile Set
                    </h4>
                  </div>

                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <p>
                      <span className="font-medium text-green-600 dark:text-green-400">Category:</span>{" "}
                      {userData?.risk_profile?.profile}
                    </p>
                    <p>
                      <span className="font-medium">Equity Exposure:</span>{" "}
                      {riskProfile.equityLimit}
                    </p>
                    <p>
                      <span className="font-medium">Debt Exposure:</span>{" "}
                      {riskProfile.debtLimit}
                    </p>
                    <p>
                      <span className="font-medium">Gold Exposure:</span>{" "}
                      {riskProfile.goldLimit}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last updated: {formatDate(userData?.risk_profile?.updated_at)}
                    </p>
                  </div>

                  <button
                    onClick={() => redirectRiskProfile()}
                    className="mt-3 w-full text-sm py-2 rounded-lg
                               border border-green-600 text-green-700
                               hover:bg-green-100 dark:hover:bg-green-900/30"
                  >
                    Re-evaluate Risk Profile
                  </button>
                </div>
              ) : (
                <div className="border rounded-xl p-4 bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="text-yellow-600" size={18} />
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">
                      Risk Profile Not Set
                    </h4>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Complete risk profiling to get suitable investment
                    recommendations.
                  </p>

                  <button
                    onClick={() => navigate("/risk")}
                    className="mt-3 w-full text-sm py-2 rounded-lg
                               bg-yellow-600 text-white hover:bg-yellow-700"
                  >
                    Start Risk Profiling
                  </button>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-300 dark:bg-slate-700"></div>

            <div className="flex flex-col">
              {options.map((option, index) => (
                <NavLink
                  key={index}
                  to={option.path}
                  end
                  className={({ isActive }) =>
                    `
                      flex items-center justify-between px-4 py-4
                      font-semibold transition-colors
                      text-gray-800 dark:text-gray-200
                      hover:bg-gray-100 dark:hover:bg-slate-800
                      ${isActive ? "bg-gray-200 dark:bg-slate-800" : ""}
                    `
                  }
                >
                  <span>{option.name}</span>
                  <FaAngleRight />
                </NavLink>
              ))}
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div className="w-[70%] border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
            <Outlet />
          </div>
        </div>
      </div>

      {/* ================= MOBILE / TAB ================= */}
      <div
        className="
          fixed inset-0 flex items-center justify-center lg:hidden
          bg-black/40 dark:bg-black/70
          z-[99999]
        "
      >
        <div className="w-full h-full bg-white dark:bg-slate-900 overflow-y-auto">

          {/* TOP BAR */}
          <div className="flex items-center justify-between px-5 py-3 sticky top-0
                          bg-white dark:bg-slate-900
                          border-b border-gray-100 dark:border-slate-700">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </button>

           <Link to="/notifications" className="text-blue-900 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 transition relative">
            <HiBell className="text-2xl" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full"></span>
          </Link>
          </div>

          {/* PROFILE HEADER */}
          <div
            onClick={handleSetting}
            className="flex items-start justify-between px-4 py-3
                       border-b border-gray-100 dark:border-slate-700
                       hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {userName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {email}
              </p>
            </div>
            <FaAngleRight className="text-gray-500" />
          </div>

           {/* Switch Accounts */}
  <div className="border-b border-gray-100 dark:border-gray-700">
  <p className="px-4 py-2 text-xs text-gray-500">Switch Account</p>

{/* <div className="h-26 overflow-y-auto"> */}
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
{/* </div> */}

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

          {/* BALANCE */}
          <div className="flex items-center gap-3 px-4 py-3
                          border-b border-gray-100 dark:border-slate-700">
            <IndianRupee size={18} className="text-gray-600 dark:text-gray-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                ₹0.00
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Stocks, F&O balance
              </p>
            </div>
          </div>

          {/* LINKS */}
          <div className="py-2">
            {[
              { to: "/user/order/stocks", icon: <FileText size={18} />, label: "All Orders" },
              { to: "/support", icon: <Headphones size={18} />, label: "24 × 7 Customer Support" },
               {
    to: "/profile/basic",
    icon: <User size={18} />,
    label: "Basic Details",
  },
  {
    to: "/profile/change-password",
    icon: <KeyRound size={18} />,
    label: "Change Password",
  },
  {
    to: "/profile/change-pin",
    icon: <ShieldCheck size={18} />,
    label: "Change Pin",
  },
  {
    to: "/profile/report-activity",
    icon: <Activity size={18} />,
    label: "Report Activity",
  },
  {
    to: "/profile/nominee_details",
    icon: <Users size={18} />,
    label: "Nominee Details",
  },
  {
    to: "/profile/account-forms",
    icon: <FileText size={18} />,
    label: "Account Form",
  },
            ].map((item, i) => (
              <Link
                key={i}
                to={item.to}
                className="flex items-center gap-3 px-4 py-2
                           text-gray-800 dark:text-gray-200
                           hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between px-4 py-3
                          border-t border-gray-100 dark:border-slate-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2
                         text-gray-700 dark:text-gray-300
                         hover:text-blue-700 dark:hover:text-blue-400
                         font-medium"
            >
              <LogOut size={18} />
              Log out
            </button>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
