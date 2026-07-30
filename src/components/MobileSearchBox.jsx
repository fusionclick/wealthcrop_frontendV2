import React, { useState } from 'react'
import { Search } from "lucide-react";
import icon from "../assets/favicon.png";
import SearchPopup from './SearchPopup';
import { useNavigate } from 'react-router-dom';
import MutualFundCarousel from '../carousel/MutualFundCarousel';

const MobileSearchBox = () => {

    const [showSearch, setShowSearch] = useState(false);

    const navigate = useNavigate()

  return (
    <>
    {/* ponytail: same route-aware ticker as desktop OldHeader */}
    <div className="mb-2 -mx-2">
      <MutualFundCarousel />
    </div>

    <div className="relative w-full px-2">
      <img
        src={icon}
        className="absolute left-5 top-1/2 -translate-y-1/2 w-6 opacity-80"
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
        className="absolute right-5 top-1/2 -translate-y-1/2 w-6 cursor-pointer opacity-80"
      />
    </div>

     {showSearch && <SearchPopup onClose={() => setShowSearch(false)} />}
    </>
  )
}

export default MobileSearchBox
