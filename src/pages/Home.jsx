import React, { useEffect, useState } from "react";
import HeroSection from "../components/home/HeroSection";
import AboutSection from "../components/home/AboutSection";
import FeaturedSection from "../components/home/FeaturedSection";
import FAQSection from "../components/home/FAQSection";
import CTASection from "../components/home/CTASection";
import HomeChart from "../components/home/HomeChart";
import InvestmentHighlights from "../components/home/InvestmentHighlights";
import SipCalculator from "./calculators/SipCalculator";
import Dashboard from "../components/DashBoard";

const Home = () => {
  // const [token, setToken] = useState(() => localStorage.getItem("token"));

  // useEffect(() => {
  //   const handleStorageChange = () => {
  //     setToken(localStorage.getItem("token"));
  //   };

  //   // Listen for changes to the localStorage
  //   window.addEventListener("storage", handleStorageChange);

  //   return () => {
  //     window.removeEventListener("storage", handleStorageChange);
  //   };
  // }, []); // Empty dependency array, so it runs only once when the component mounts

  // const isTokenValid = token && token.trim() !="";
return (
  <div className="w-full">
        <HeroSection />
        <InvestmentHighlights />
        <AboutSection />
        <FeaturedSection />
        <SipCalculator/>
        <HomeChart/>
        <FAQSection />
        <CTASection />
  </div>
);

}
export default Home;
