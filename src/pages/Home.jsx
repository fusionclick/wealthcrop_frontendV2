import React from "react";
import HeroSection from "../components/home/HeroSection";
import FAQSection from "../components/home/FAQSection";
import HomeChart from "../components/home/HomeChart";
import {
  TrustStrip,
  GuidedJourney,
  CategoryGrid,
  TaxShield,
  ServiceDesk,
  CasBanner,
  AppBanner,
} from "../components/home/HomeSections";

// Client 2026-10-09 — the homepage hierarchy, in the client's order (the ticker and the top
// navigation sit in the header, the AMFI disclosures in the footer). Gone from here: About
// (its own page, linked from the footer), the SIP calculator page that brought its own SIP
// FAQ and "Related Calculators", the "Join Now" banner and the illustrations.
const Home = () => (
  <div className="w-full">
    <HeroSection />
    <TrustStrip />
    <GuidedJourney />
    <HomeChart />
    <CategoryGrid />
    <TaxShield />
    <ServiceDesk />
    <CasBanner />
    <AppBanner />
    <FAQSection />
  </div>
);

export default Home;
