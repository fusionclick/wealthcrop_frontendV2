// Updated Footer Component
// (Attractive sections + copyright moved to last + extended sections only)
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaGooglePlay,
  FaApple,
} from "react-icons/fa";
import logo from "../assets/logo.png";

const Footer = () => {
  const amcs = [
    "Aditya Birla Sun Life",
    "Axis",
    "Baroda",
    "BNP Paribas",
    "Canara Robeco",
    "DSP",
    "Edelweiss",
    "Franklin Templeton",
    "HDFC",
    "ICICI Prudential",
    "Kotak",
    "L&T",
    "Mirae Asset",
    "Motilal Oswal",
    "Nippon India",
    "PPFAS",
    "Quant",
    "SBI",
    "Tata",
    "UTI",
  ];

  const mutualFunds = [
    "Mirae Asset Emerging Bluechip",
    "Axis Focused 25",
    "ICICI Value Discovery",
    "Axis Midcap",
    "ICICI Nifty Next 50",
    "Axis Long Term Equity",
    "Nippon Pharma",
    "ICICI Balanced Advantage",
    "DSP Quant Fund",
  ];

  const stocks = [
    "Reliance Industries",
    "TCS",
    "Infosys",
    "HDFC Bank",
    "ICICI Bank",
    "Kotak Bank",
    "Larsen & Toubro",
    "Asian Paints",
    "Tata Motors",
    "Maruti Suzuki",
    "Nestle",
    "HUL",
  ];

  const calculators = [
    "SIP Calculator",
    "Lumpsum Calculator",
    "Retirement Calculator",
    "FD Calculator",
    "NPS Calculator",
    "CAGR Calculator",
    "SWP Calculator",
    "PPF Calculator",
    "APY Calculator",
    "Inflation Calculator",
    "HRA Calculator",
  ];

  const fdPartners = [
    "HDFC",
    "Bajaj Finance",
    "Mahindra Finance",
    "PNB Housing",
    "Shriram Transport Finance",
    "National Housing Bank",
  ];

const Section = ({ title, list, basePath }) => (
  <div className="mb-6">
    
    {/* Modern footer title */}
    <h3
      className="
        mb-3 text-sm font-semibold uppercase tracking-wide
        text-blue-900 dark:text-gray-200
        border-b-2 border-blue-300 dark:border-white/10
      "
    >
      {title}
    </h3>

    {/* Inline links with bars */}
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      {list.map((item, idx) => (
        <div key={idx} className="flex items-center">
          <Link
            to={`${basePath}/${item.toLowerCase().replace(/ /g, "-")}`}
            className="
              transition-colors
              hover:text-blue-700 dark:hover:text-blue-400
            "
          >
            {item}
          </Link>

          {/* Show | except last */}
          {idx !== list.length - 1 && (
            <span className="px-2 text-gray-400 dark:text-gray-500">|</span>
          )}
        </div>
      ))}
    </div>
  </div>
);





  return (
    <>
      {/* ---------------------------- */}
      {/* Main Footer Top Section */}
      {/* ---------------------------- */}
     <footer
  className="
    py-10
    bg-white dark:bg-gray-900
    border-t-2 border-gray-300 dark:border-white/10
  "
>
  <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
    
    {/* LEFT — LOGO & APP LINKS */}
    <div className="flex flex-col items-center md:items-start space-y-4">
      <Link to="/">
        <img className="w-28 md:w-40" src={logo} alt="Logo" />
      </Link>

      <p className="text-sm font-semibold text-blue-950 dark:text-gray-200">
        Download the app
      </p>

      <div className="flex gap-3">
        <Link
          className="
            flex items-center gap-2 px-3 py-1.5 rounded-lg
            border border-gray-300 dark:border-white/10
            text-blue-950 dark:text-gray-200
            hover:bg-gray-50 dark:hover:bg-[var(--white-5)]
            transition
          "
        >
          <FaGooglePlay className="text-lg" />
          <span className="text-sm font-medium">Google Play</span>
        </Link>

        <Link
          className="
            flex items-center gap-2 px-3 py-1.5 rounded-lg
            border border-gray-300 dark:border-white/10
            text-blue-950 dark:text-gray-200
            hover:bg-gray-50 dark:hover:bg-white/5
            transition
          "
        >
          <FaApple className="text-lg" />
          <span className="text-sm font-medium">App Store</span>
        </Link>
      </div>
    </div>

    {/* MIDDLE — NAVIGATION */}
    <div className="flex flex-col text-center md:text-left space-y-2 font-medium">
      <h3 className="text-xl font-bold text-blue-900 dark:text-gray-100 mb-1">
        Quick Navigation
      </h3>

      <Link
        to="/"
        className="
          text-blue-900 dark:text-gray-300
          hover:text-blue-600 dark:hover:text-blue-400
          hover:underline underline-offset-4
          transition
        "
      >
        Home
      </Link>

      <Link
        to="/investments"
        className="
          text-blue-900 dark:text-gray-300
          hover:text-blue-600 dark:hover:text-blue-400
          hover:underline underline-offset-4
          transition
        "
      >
        Investments
      </Link>

      <Link
        to="/calculators"
        className="
          text-blue-900 dark:text-gray-300
          hover:text-blue-600 dark:hover:text-blue-400
          hover:underline underline-offset-4
          transition
        "
      >
        Calculators
      </Link>

      <Link
        to="/support"
        className="
          text-blue-900 dark:text-gray-300
          hover:text-blue-600 dark:hover:text-blue-400
          hover:underline underline-offset-4
          transition
        "
      >
        Contact
      </Link>
    </div>

    {/* RIGHT — SOCIAL ICONS */}
    <div className="flex space-x-5 text-xl text-blue-950 dark:text-gray-300">
      <a className="hover:text-blue-700 dark:hover:text-blue-400 transition">
        <FaFacebookF />
      </a>
      <a className="hover:text-blue-700 dark:hover:text-blue-400 transition">
        <FaTwitter />
      </a>
      <a className="hover:text-blue-700 dark:hover:text-blue-400 transition">
        <FaLinkedinIn />
      </a>
      <a className="hover:text-blue-700 dark:hover:text-blue-400 transition">
        <FaInstagram />
      </a>
    </div>

  </div>
</footer>


      {/* ---------------------------- */}
      {/* EXTENDED PROFESSIONAL FOOTER */}
      {/* ---------------------------- */}
      <section
  className="
    py-4 pb-2 lg:mb-0 lg:pb-2
    bg-white text-blue-950
    dark:bg-gray-900 dark:text-gray-100
    border-gray-300 dark:border-white/10
  "
>
  <div className="max-w-7xl mx-auto px-6 space-y-12">
    
    <Section
      title="Asset Management Companies (AMCs)"
      list={amcs}
      basePath="/stocks"
    />

    <Section
      title="Popular Mutual Funds"
      list={mutualFunds}
      basePath="/mutual_fund"
    />

    <Section
      title="Popular Stocks"
      list={stocks}
      basePath="/stocks"
    />

    <Section
      title="Financial Calculators"
      list={calculators}
      basePath="/calculator"
    />

    <Section
      title="Fixed Deposit Partners"
      list={fdPartners}
      basePath="/fd"
    />

    {/* DISCLAIMER */}
    <div
      className="
        pt-6 text-sm
        border-t border-gray-300 dark:border-white/10
        text-gray-700 dark:text-gray-400
      "
    >
      <p>
        <strong>Disclaimer:</strong> Investments in securities and mutual funds
        are subject to market risks. Read scheme documents carefully.
      </p>
    </div>

    {/* OFFICE INFO */}
    <div className="text-sm leading-6 text-gray-700 dark:text-gray-400">
      <p>
        <strong>Registered Office:</strong> Wealthcrop Advisory Pvt Ltd, Chennai
      </p>
      <p>
        <strong>Corporate Office:</strong> Bengaluru, Karnataka
      </p>
    </div>

    {/* COPYRIGHT */}
    <div
      className="
        pt-4 text-center text-sm font-semibold
        border-t border-gray-300 dark:border-white/10
        text-blue-900 dark:text-gray-300
      "
    >
      © {new Date().getFullYear()} Wealthcrop. All rights reserved.
    </div>
  </div>
</section>

    </>
  );
};

export default Footer;
