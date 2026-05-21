import { Search, ArrowLeft } from "lucide-react";
import { HiMenu, HiX, HiBell, HiUserCircle } from "react-icons/hi";
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
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaAngleRight } from "react-icons/fa6";
import { logout } from "../redux/authenticationSlice";
import { useDispatch } from "react-redux";
import { useEffect, useRef } from "react";

export default function ProfileSettingPopup({ onClose }) {

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()

    //  const handleLogout = () => {
    //   dispatch(logout());
    //   navigate("/"); // redirect to home
    //   window.location.reload()
    // };

    const handleLogout = () => {
  localStorage.removeItem("currentAccount");

  dispatch(logout());
  navigate("/");
};
  
    const handleSetting = () =>{
      navigate("/profile")
    }


  return (
    <div
      className="
        fixed inset-0 flex items-center justify-center
        bg-black/40 
        z-99999
        animate-fadeInn
      "
    >
      {/* Popup box */}
      <div
        className="
          bg-white shadow-lg overflow-y-auto
          transition-all duration-300
          w-full h-full
   
        "
      >
        {/* 🔹 Top Row: Back + Search Input */}
        <div className="flex items-center justify-between gap-3 mb-5 sticky top-0 bg-white py-3 px-5 border-b border-gray-100 z-10">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="flex items-center gap-4 text-blue-900">
           <HiBell className="text-2xl " />
           {/* <Settings onClick={handleSetting} size={22} className="text-blue-900 cursor-pointer" /> */}
           
          </div>
        </div>

        {/* Below section */}
                  <div className=" ">

        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100"
        onClick={handleSetting}>
          <div>
            <h3 className="font-semibold text-gray-900">Fusion Techlab</h3>
            <p className="text-sm text-gray-500">fusionbusiness001@gmail.com</p>
          </div>
          <FaAngleRight />
        </div>

        {/* Balance Section */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <IndianRupee size={18} className="text-gray-600" />
          <div>
            <p className="text-gray-900 font-medium">₹0.00</p>
            <p className="text-xs text-gray-500">Stocks, F&O balance</p>
          </div>
        </div>

        {/* Links */}
        <div className="py-2 space-y-2">
          <Link
            to="/orders"
            className="flex items-center gap-3 px-4 py-2 text-gray-800 hover:bg-gray-50"
          >
            <FileText size={18} />
            <span>All Orders</span>
          </Link>

          <Link
            to="/support"
            className="flex items-center gap-3 px-4 py-2 text-gray-800 hover:bg-gray-50"
          >
            <Headphones size={18} />
            <span>24 × 7 Customer Support</span>
          </Link>

          <Link
            to="/reports"
            className="flex items-center gap-3 px-4 py-2 text-gray-800 hover:bg-gray-50"
          >
            <BarChart3 size={18} />
            <span>Reports</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          {/* <Sun size={18} className="text-gray-700" /> */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-700 cursor-pointer hover:text-blue-700 font-medium border-b border-dashed"
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
    </div>

        

   

       
      </div>
    </div>
  );
}
