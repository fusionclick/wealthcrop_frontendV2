// Updated Footer Component
// (Attractive sections + copyright moved to last + extended sections only)
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const Footer = () => {
  // ponytail: /stocks/:name goes straight to fetchStockDetails(symbol), so the link has to
  // carry the NSE ticker — a slugified company name ("reliance-industries") loads a blank page.
  const stocks = [
    ["Reliance Industries", "RELIANCE"],
    ["TCS", "TCS"],
    ["Infosys", "INFY"],
    ["HDFC Bank", "HDFCBANK"],
    ["ICICI Bank", "ICICIBANK"],
    ["Kotak Bank", "KOTAKBANK"],
    ["Larsen & Toubro", "LT"],
    ["Asian Paints", "ASIANPAINT"],
    ["Tata Motors", "TATAMOTORS"],
    ["Maruti Suzuki", "MARUTI"],
    ["Nestle", "NESTLEIND"],
    ["HUL", "HINDUNILVR"],
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
      {list.map((item, idx) => {
        // Plain string = slug is the label; tuple = explicit slug the route can actually use.
        const [label, slug] = Array.isArray(item)
          ? item
          : [item, item.toLowerCase().replace(/ /g, "-")];

        return (
          <div key={idx} className="flex items-center">
            <Link
              to={`${basePath}/${slug}`}
              className="
                transition-colors
                hover:text-blue-700 dark:hover:text-blue-400
              "
            >
              {label}
            </Link>

            {/* Show | except last */}
            {idx !== list.length - 1 && (
              <span className="px-2 text-gray-400 dark:text-gray-500">|</span>
            )}
          </div>
        );
      })}
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

      {/* The Google Play and App Store buttons lived here as <Link> elements with no `to`
          prop — react-router v7 destructures `to` in resolveTo, so they were the same
          throw-or-inert defect as the social icons. There is no published app to point them
          at either. Restore them as <a href> once the store listings exist. */}
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

    {/* ponytail: social icons removed — they were href-less anchors and no handle for any
        network exists anywhere in the repo. Add them back with real profile URLs. */}

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
    
    {/* ponytail: AMC, "Popular Mutual Funds" and "Fixed Deposit Partners" sections removed.
        A fund link needs /mutual_fund/:isin/:code and we have neither; there is no /fd route
        and no AMC page with real data — every one of those links was a 404 or a blank page. */}

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
