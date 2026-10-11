// Updated Footer Component
// Client 2026-10-09 — footer v2: AMCs, Top Fund Categories, statutory disclosures, Help &
// Compliance, and the bottom legal line. The registration itself (entity + ARN) still comes
// from the server through DistributorIdentity, never from the bundle (Audit #34).
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import DistributorIdentity, { useDistributorIdentity } from "./DistributorIdentity";
import { TOP_AMCS, TOP_CATEGORIES, exploreUrl } from "../utils/mfCollections";
import { useAppLinks } from '../hooks/useAppLinks';

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
  // TATAMOTORS stopped quoting after the 2025 demerger; the passenger-vehicle company
  // trades as TMPV.
  ["Tata Motors PV", "TMPV"],
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

const AMFI_CODE_OF_CONDUCT = "https://www.amfiindia.com/Themes/Theme1/downloads/circulars/ARNCircular22a-RevisedCodeofConductforMFDs2022.pdf";

const title = "mb-3 text-sm font-semibold uppercase tracking-wide text-blue-900 dark:text-gray-200 border-b-2 border-blue-300 dark:border-white/10";
const linkCls = "transition-colors hover:text-blue-700 dark:hover:text-blue-400";

/** An inline row of links separated by bars. Items are [label, to] or [label, href, external]. */
const Section = ({ heading, items }) => (
  <div className="mb-6">
    <h3 className={title}>{heading}</h3>
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      {items.map(([label, to, external], idx) => (
        <div key={label} className="flex items-center">
          {external ? (
            <a href={to} target="_blank" rel="noopener noreferrer" className={linkCls}>
              {label}
            </a>
          ) : (
            <Link to={to} className={linkCls}>
              {label}
            </Link>
          )}
          {idx !== items.length - 1 && <span className="px-2 text-gray-400 dark:text-gray-500">|</span>}
        </div>
      ))}
    </div>
  </div>
);

const Footer = () => {
  const info = useDistributorIdentity();
  const { appStore: APP_STORE_URL, playStore: PLAY_STORE_URL, androidLabel } = useAppLinks();
  // The legal entity is the server's (Admin → Settings), so one name is current everywhere.
  const entity = info?.entity || "Wealthcrop";
  const stores = [
    ["App Store", APP_STORE_URL],
    [androidLabel, PLAY_STORE_URL],
  ].filter(([, url]) => url);

  return (
    <>
      {/* ---------------------------- */}
      {/* Main Footer Top Section */}
      {/* ---------------------------- */}
      <footer className="py-10 bg-white dark:bg-gray-900 border-t-2 border-gray-300 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          {/* LEFT — LOGO & APP LINKS. Store buttons only once the listings exist. */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <Link to="/">
              <img className="w-28 md:w-40" src={logo} alt="Logo" />
            </Link>
            {stores.length > 0 && (
              <div className="flex gap-3 text-sm font-semibold text-blue-950 dark:text-gray-200">
                {stores.map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    {label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* MIDDLE — NAVIGATION */}
          <div className="flex flex-col text-center md:text-left space-y-2 font-medium">
            <h3 className="text-xl font-bold text-blue-900 dark:text-gray-100 mb-1">Quick Navigation</h3>
            {[
              ["Home", "/"],
              ["About Us", "/about"],
              ["Investments", "/investments"],
              ["Calculators", "/calculators"],
              ["Contact", "/support#contact"],
            ].map(([label, to]) => (
              <Link
                key={to}
                to={to}
                className="text-blue-900 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline underline-offset-4 transition"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* ponytail: social icons removed — they were href-less anchors and no handle for any
              network exists anywhere in the repo. Add them back with real profile URLs. */}
        </div>
      </footer>

      {/* ---------------------------- */}
      {/* EXTENDED PROFESSIONAL FOOTER */}
      {/* ---------------------------- */}
      <section className="py-4 pb-2 lg:mb-0 lg:pb-2 bg-white text-blue-950 dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          {/* Footer-1 — each AMC opens the fund list filtered to it. */}
          <Section heading="AMCs" items={TOP_AMCS.map(([label, term]) => [label, exploreUrl({ amc: term })])} />

          {/* Footer-2 */}
          <Section heading="Top Fund Categories" items={TOP_CATEGORIES.map((c) => [c.name, exploreUrl({ collection: c.slug })])} />

          <Section heading="Popular Stocks" items={stocks.map(([label, sym]) => [label, `/stocks/${sym}`])} />

          <Section
            heading="Financial Calculators"
            items={calculators.map((c) => [c, `/calculator/${c.toLowerCase().replace(/ /g, "-")}`])}
          />

          <Section
            heading="Help & Compliance"
            items={[
              ["Support Center & FAQs", "/support"],
              ["Contact Us", "/support#contact"],
              ["Grievance Redressal", "/grievance-redressal"],
              ["SEBI SCORES Portal", "https://scores.sebi.gov.in", true],
              ["SMART ODR Online Dispute", "https://smartodr.in", true],
            ]}
          />

          {/* AMFI §1.A — MANDATORY ON EVERY SCREEN. See DistributorIdentity for the size rule. */}
          <DistributorIdentity className="pt-6 border-t border-gray-300 dark:border-white/10" />

          {/* Footer-3 — Statutory Risk Disclaimer & Regulatory Disclosures (client's text). The
              entity and its ARN are the server's line above; only the office is added here. */}
          <div className="pt-6 text-sm space-y-3 border-t border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-400">
            <h3 className="font-semibold text-blue-950 dark:text-gray-200">Statutory Risk Disclaimer &amp; Regulatory Disclosures</h3>
            <p className="font-semibold">Mutual Fund investments are subject to market risks, read all scheme related documents carefully.</p>
            <p>
              <strong>Registered &amp; Corporate Office:</strong> {entity}, Kolkata, West Bengal, India. AMFI-registered Mutual Fund
              Distributor and an exchange-approved Authorized Person associated with a SEBI-registered stockbroker.
            </p>
            <p>
              <strong>Commission Disclosure &amp; Scope of Services:</strong> {entity} facilitates mutual fund transactions under
              Regular Plans and receives distribution commissions from Asset Management Companies (AMCs) as per SEBI guidelines.
              Wealthcrop does not charge any direct platform fees to investors for mutual fund transactions, nor does it provide
              discretionary advisory services under this entity.
            </p>
            <p>
              <strong>No Assured Returns:</strong> {entity} does not offer any guarantee, promise, or assurance of fixed or protected
              returns on any investments. Past performance and benchmark metrics displayed across the platform are strictly for
              informational purposes and do not guarantee future results.
            </p>
            <p>
              <strong>Non-Advisory Notice:</strong> Platform tools, filtration parameters, and pre-configured model baskets are
              engineered for self-directed evaluation and operational convenience only, and do not constitute investment
              advice or recommendations tailored to any individual. All allocations across financial instruments carry intrinsic market risks,
              including loss of principal capital. Investors are strongly advised to independently evaluate their risk appetite,
              investment horizons, and personal financial goals before executing investment decisions.
            </p>
          </div>

          {/* The business panel publishes links to the client's approved documents. */}
          <div className="pt-4 pb-2 border-t border-gray-300 dark:border-white/10 text-sm text-center space-y-2">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-gray-600 dark:text-gray-400">
              {[[info?.termsUrl, '/terms', 'Terms of Use'], [info?.privacyUrl, '/privacy', 'Privacy Policy'], [info?.charterUrl, '/investor-charter', 'Investor Charter']].map(([url, path, label]) => (
                url ? <a key={label} href={url} target="_blank" rel="noopener noreferrer" className={linkCls}>{label}</a>
                  : <Link key={label} to={path} className={linkCls}>{label}</Link>
              ))}
              {info?.commissionUrl && (
                <a href={info.commissionUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  Commission Disclosures
                </a>
              )}
              <a href={AMFI_CODE_OF_CONDUCT} target="_blank" rel="noopener noreferrer" className={linkCls}>
                AMFI Code of Conduct
              </a>
            </div>
            <p className="font-semibold text-blue-900 dark:text-gray-300">
              © {new Date().getFullYear()} {entity}. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Footer;
