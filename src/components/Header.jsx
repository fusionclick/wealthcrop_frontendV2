import { Link } from "react-router-dom";
import { HiBell, HiUserCircle, HiMenu, HiX } from "react-icons/hi";
import logo from "../assets/logo.png";
import { useState } from "react";
import StocksMenu from "./hovercomp/StocksMenu";
import FOMenu from "./hovercomp/FOMenu";
import MutualFundsMenu from "./hovercomp/MutualFundsMenu";
import MoreMenu from "./hovercomp/MoreMenu";

export default function Header({ token }) {
  const isLoggedIn = !!token;
  const [activeMenu, setActiveMenu] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-100 fixed top-0 left-0 z-50">
      {/* 🔹 Top Navbar */}
      <div className="flex items-center justify-between px-6 md:px-12 py-6">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Wealthcrop" className="w-32 md:w-36 h-auto" />
        </Link>

        {/* 🔹 Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-10 relative top-4">
          {/* 🔹 Stocks */}
          <div className="relative group">
            <button className="text-blue-900 font-medium hover:text-blue-700 transition cursor-pointer">
              Stocks
            </button>

            <div
              className="absolute left-[-180px] top-full mt-1 w-[1200px] bg-white rounded overflow-hidden
      opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-1
      transition-all duration-300 ease-out border-b border-gray-800"
            >
              <div className="mx-auto px-6 py-4">
                <StocksMenu />
              </div>
            </div>
          </div>

          {/* 🔹 F&O */}
          <div className="relative group">
            <button className="text-blue-900 font-medium hover:text-blue-700 transition cursor-pointer">
              F&O
            </button>

            <div
              className="absolute left-0 top-full mt-1 w-screen bg-white rounded-xl shadow-lg overflow-hidden
      opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-1
      transition-all duration-300 ease-out border border-gray-100"
            >
              <div className="max-w-[1200px] mx-auto px-6 py-4">
                <FOMenu />
              </div>
            </div>
          </div>

          {/* 🔹 Mutual Funds */}
          <div className="relative group">
            <button className="text-blue-900 font-medium hover:text-blue-700 transition cursor-pointer">
              Mutual Funds
            </button>

            <div
              className="absolute left-0 top-full mt-1 w-screen bg-white rounded-xl overflow-hidden
      opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-1
      transition-all duration-300 ease-out border border-gray-100"
            >
              <div className="max-w-[1200px] mx-auto px-6 py-4">
                <MutualFundsMenu />
              </div>
            </div>
          </div>
          <div className="bg-blue-900 font-medium w-0.5 h-6">
          </div>

          {/* 🔹 More */}
          <div className="relative group">
            <button className="text-blue-900 font-medium hover:text-blue-700 transition cursor-pointer">
              More
            </button>

            <div
              className="absolute left-0 top-full mt-1 w-screen bg-white rounded-xl shadow-lg overflow-hidden
      opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-1
      transition-all duration-300 ease-out border border-gray-100"
            >
              <div className="max-w-[1200px] mx-auto px-6 py-4">
                <MoreMenu />
              </div>
            </div>
          </div>
        </nav>
        {/* 🔹 Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-6 relative">
          <input
            type="text"
            placeholder="Search for stocks, mutual funds..."
            className="w-full border border-gray-200 rounded-full pl-10 pr-4 py-2 text-sm 
            focus:outline-none focus:ring-1 focus:ring-blue-700 text-gray-800 shadow-sm"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"
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

        {/* 🔹 Right Section */}
        <div className="hidden md:flex items-center space-x-5">
          {isLoggedIn ? (
            <>
              <button className="text-gray-700 hover:text-blue-700 relative">
                <HiBell className="text-2xl" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full"></span>
              </button>
              <Link to="/profile">
                <HiUserCircle className="text-3xl text-gray-700 hover:text-blue-700 transition" />
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-blue-700 text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-blue-800 shadow-sm transition"
            >
              Login / Signup
            </Link>
          )}
        </div>

        {/* 🔹 Mobile Menu Button */}
        <button
          className="md:hidden text-2xl text-gray-800"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <HiX /> : <HiMenu />}
        </button>
      </div>

      {/* 🔹 Mobile Dropdown */}
      <div
        className={`md:hidden bg-white border-t border-gray-100 transition-all duration-300 ease-in-out overflow-hidden ${menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="px-6 py-4 space-y-4">
          <Link to="/stocks" className="block text-gray-800 font-medium">
            Stocks
          </Link>
          <Link to="/fo" className="block text-gray-800 font-medium">
            F&O
          </Link>
          <Link to="/mutualfunds" className="block text-gray-800 font-medium">
            Mutual Funds
          </Link>
          <Link to="/more" className="block text-gray-800 font-medium">
            More
          </Link>

          <div className="pt-3 border-t border-gray-100">
            <input
              type="text"
              placeholder="Search..."
              className="w-full border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700"
            />
          </div>

          {isLoggedIn ? (
            <div className="flex items-center justify-center gap-5 text-gray-700 mt-3">
              <HiBell className="text-2xl" />
              <Link to="/profile">
                <HiUserCircle className="text-3xl" />
              </Link>
            </div>
          ) : (
            <Link
              to="/login"
              className="block text-center bg-blue-700 text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-blue-800 shadow-sm transition mt-3"
            >
              Login / Signup
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}


//! Using redux hedaer
// import { Link } from "react-router-dom";
// import { HiBell, HiUserCircle, HiMenu, HiX } from "react-icons/hi";
// import logo from "../assets/logo.png";
// import { useState, useRef } from "react";
// import { useDispatch } from "react-redux";
// import { setActiveMenu, clearMenu } from "../redux/hoverMenuSlice";

// export default function Header({ token }) {
//   const isLoggedIn = !!token;
//   const [menuOpen, setMenuOpen] = useState(false);
//   const dispatch = useDispatch();
//   const timeoutRef = useRef(null);

//   // 🟦 Hover handlers (with small delay)
//   const handleEnter = (menu) => {
//     clearTimeout(timeoutRef.current);
//     dispatch(setActiveMenu(menu));
//   };

//   const handleLeave = () => {
//     timeoutRef.current = setTimeout(() => {
//       dispatch(clearMenu());
//     }, 200);
//   };

//   return (
//     <header
//       className="w-full bg-white shadow-sm border-b border-gray-100 fixed top-0 left-0 z-50"
//       onMouseLeave={handleLeave}
//     >
//       {/* 🔹 Top Navbar */}
//       <div className="flex items-center justify-between px-6 md:px-12 py-5">
//         {/* Logo */}
//         <Link to="/" className="flex items-center">
//           <img src={logo} alt="Wealthcrop" className="w-32 md:w-36 h-auto" />
//         </Link>

//         {/* 🔹 Desktop Navigation */}
//         <nav className="hidden md:flex items-center space-x-10 relative top-2">
//           {[
//             { name: "Stocks", key: "stocks" },
//             { name: "F&O", key: "fo" },
//             { name: "Mutual Funds", key: "mutual" },
//             { name: "More", key: "more" },
//           ].map((item, idx) => (
//             <div key={idx} className="relative">
//               <button
//                 onMouseEnter={() => handleEnter(item.key)}
//                 className="text-blue-900 font-medium hover:text-blue-700 transition cursor-pointer"
//               >
//                 {item.name}
//               </button>
//             </div>
//           ))}
//         </nav>

//         {/* 🔹 Search Bar */}
//         <div className="hidden md:flex flex-1 max-w-md mx-6 relative">
//           <input
//             type="text"
//             placeholder="Search for stocks, mutual funds..."
//             className="w-full border border-gray-200 rounded-full pl-10 pr-4 py-2 text-sm
//             focus:outline-none focus:ring-1 focus:ring-blue-700 text-gray-800 shadow-sm"
//           />
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
//             />
//           </svg>
//         </div>

//         {/* 🔹 Right Section */}
//         <div className="hidden md:flex items-center space-x-5">
//           {isLoggedIn ? (
//             <>
//               <button className="text-gray-700 hover:text-blue-700 relative">
//                 <HiBell className="text-2xl" />
//                 <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full"></span>
//               </button>
//               <Link to="/profile">
//                 <HiUserCircle className="text-3xl text-gray-700 hover:text-blue-700 transition" />
//               </Link>
//             </>
//           ) : (
//             <Link
//               to="/login"
//               className="bg-blue-700 text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-blue-800 shadow-sm transition"
//             >
//               Login / Signup
//             </Link>
//           )}
//         </div>

//         {/* 🔹 Mobile Menu Button */}
//         <button
//           className="md:hidden text-2xl text-gray-800"
//           onClick={() => setMenuOpen(!menuOpen)}
//         >
//           {menuOpen ? <HiX /> : <HiMenu />}
//         </button>
//       </div>

//       {/* 🔹 Mobile Dropdown */}
//       <div
//         className={`md:hidden bg-white border-t border-gray-100 transition-all duration-300 ease-in-out overflow-hidden ${
//           menuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
//         }`}
//       >
//         <div className="px-6 py-4 space-y-4">
//           <Link to="/stocks" className="block text-gray-800 font-medium">
//             Stocks
//           </Link>
//           <Link to="/fo" className="block text-gray-800 font-medium">
//             F&O
//           </Link>
//           <Link to="/mutualfunds" className="block text-gray-800 font-medium">
//             Mutual Funds
//           </Link>
//           <Link to="/more" className="block text-gray-800 font-medium">
//             More
//           </Link>

//           <div className="pt-3 border-t border-gray-100">
//             <input
//               type="text"
//               placeholder="Search..."
//               className="w-full border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-700"
//             />
//           </div>

//           {isLoggedIn ? (
//             <div className="flex items-center justify-center gap-5 text-gray-700 mt-3">
//               <HiBell className="text-2xl" />
//               <Link to="/profile">
//                 <HiUserCircle className="text-3xl" />
//               </Link>
//             </div>
//           ) : (
//             <Link
//               to="/login"
//               className="block text-center bg-blue-700 text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-blue-800 shadow-sm transition mt-3"
//             >
//               Login / Signup
//             </Link>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// }
