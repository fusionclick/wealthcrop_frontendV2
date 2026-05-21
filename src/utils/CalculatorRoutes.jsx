import ApyCalculator from "../pages/calculators/ApyCalculator";
import CagrCalculator from "../pages/calculators/CagrCalculator";
import FDCalculator from "../pages/calculators/FDCalculator";
import HraCalculator from "../pages/calculators/HraCalculator";
import InflationCalculator from "../pages/calculators/InflationCalculator";
import LumpsumCalculator from "../pages/calculators/LumpsumCalculator";
import PpfCalculator from "../pages/calculators/PpfCalculator";
import RetirementCalculator from "../pages/calculators/RetirementCalculator";
import SipCalculator from "../pages/calculators/SipCalculator";
import SwpCalculator from "../pages/calculators/SwpCalculator";
import NPSCalculator from "../pages/calculators/NPSCalculator";
import EmiCalculator from "../pages/calculators/EmiCalculator";
import EducationCalculator from "../pages/calculators/EducationCalculator";
import { elements } from "chart.js";
import ELSSPlannerCalculator from "../pages/calculators/ELSSPlannerCalculator";
import LTCGCalculator from "../pages/calculators/LTCGCalculator";
import EightyCTracker from "../pages/calculators/EightyCTracker";


export const calculatorRoutes = [
  { path: "sip-calculator", element: <SipCalculator /> },
  { path: "lumpsum-calculator", element: <LumpsumCalculator /> },
  { path: "fd-calculator", element: <FDCalculator /> },
  { path: "nps-calculator", element: <NPSCalculator /> },
  { path: "retirement-calculator", element: <RetirementCalculator /> },
  { path: "cagr-calculator", element: <CagrCalculator /> },
  { path: "swp-calculator", element: <SwpCalculator /> },
  { path: "emi-calculator", element: <EmiCalculator /> },
  { path: "ppf-calculator", element: <PpfCalculator /> },
  { path: "apy-calculator", element: <ApyCalculator /> },
  { path: "inflation-calculator", element: <InflationCalculator /> },
  { path: "hra-calculator", element: <HraCalculator /> },
  { path: "education-cost-calculator", element: <EducationCalculator/> },
  { path: "income-tax-calculator", },
  { path: "rent-calculator",},
  { path: "elss-calculator", element: <ELSSPlannerCalculator/> },
  { path: "ltcg-calculator", element: <LTCGCalculator/> },
  { path: "eightyC-calculator", element: <EightyCTracker/> },
];
