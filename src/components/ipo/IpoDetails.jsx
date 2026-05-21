// src/pages/IpoDetails.jsx

import { useParams } from "react-router-dom";
import { ipoStaticData } from "./ipoData";
import IpoFaq from "./IpoFaq";

const safe = (x) => (x ? x : "–");

export default function IpoDetails() {
  const { ipoName } = useParams();
  const ipo = ipoStaticData;

  if (!ipo)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500 dark:text-gray-400">IPO not found.</p>
      </div>
    );

  const showListing = ipo.status === "listed";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#020617]">
  <div className="max-w-5xl mx-auto px-4 py-10">

    {/* ========================================================= */}
    {/* HEADER */}
    {/* ========================================================= */}
    <header className="bg-white dark:bg-[#020617] rounded-2xl shadow-sm px-6 py-6 mb-8 border border-transparent dark:border-slate-800">
      <div className="flex justify-between items-start flex-col md:flex-row">

        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {ipoName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {ipo.about?.parent}
          </p>

          <span
            className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium capitalize ${
              ipo.status === "open"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : ipo.status === "upcoming"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:t"
                : ""
            }`}
          >
            {ipo.status}
          </span>
        </div>

        <div className="text-right mt-4 md:mt-0">
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            ₹{ipo.minInvestment}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {ipo.shares} shares
          </p>
        </div>
      </div>
    </header>

    {/* ========================================================= */}
    {/* SECTION — IPO HIGHLIGHTS */}
    {/* ========================================================= */}
    <Section title="IPO Highlights" bg="bg-blue-50 dark:bg-blue-950/20">
      <HighlightGrid>
        <HighlightCard label="Price Band" value={safe(ipo.ipoDetails?.priceRange)} color="bg-sky-100 dark:bg-sky-900/30" />
        <HighlightCard label="GMP (Unofficial)" value={safe(ipo.gmp || "Not available")} color="bg-emerald-100 dark:bg-emerald-900/30" />
        <HighlightCard label="Market Cap" value={safe(ipo.marketCap || "–")} color="bg-indigo-100 dark:bg-indigo-900/30" />
        <HighlightCard label="Risk Level" value={safe(ipo.riskRating || "Moderate")} color="bg-teal-100 dark:bg-teal-900/10" />
      </HighlightGrid>
    </Section>

    {/* ========================================================= */}
    {/* SECTION — COMPANY METRICS */}
    {/* ========================================================= */}
    <Section title="Company Metrics" bg="bg-teal-50 dark:bg-teal-950/20">
      <DetailGrid>
        <Detail label="Revenue" value={safe(ipo.metrics?.revenue)} />
        <Detail label="Profit" value={safe(ipo.metrics?.profit)} />
        <Detail label="EBITDA Margin" value={safe(ipo.metrics?.ebitda)} />
        <Detail label="RoCE" value={safe(ipo.metrics?.roce)} />
        <Detail label="Debt / Equity" value={safe(ipo.metrics?.debtEquity)} />
      </DetailGrid>
    </Section>

    {/* ========================================================= */}
    {/* SECTION — STRENGTHS & RISKS */}
    {/* ========================================================= */}
    <Section title="Strengths & Risks" bg="bg-slate-100 dark:bg-[#020617]">
      <div className="grid md:grid-cols-2 gap-6">

        <div className="bg-white dark:bg-[#020617] shadow-sm rounded-xl p-5 border border-transparent dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Strengths
          </h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {(ipo.strengths || ["Growing sector", "Healthy balance sheet", "Strong promoter background"])
              .map((s, i) => <li key={i}>• {s}</li>)}
          </ul>
        </div>

        <div className="bg-white dark:bg-[#020617] shadow-sm rounded-xl p-5 border border-transparent dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Risks
          </h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {(ipo.risks || ["Competitive pressure", "Input cost volatility", "Market cyclicality"])
              .map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
        </div>

      </div>
    </Section>

    {/* ========================================================= */}
    {/* SECTION — VALUATION SNAPSHOT */}
    {/* ========================================================= */}
    <Section title="Valuation Snapshot" bg="bg-blue-50 dark:bg-blue-950/20">
      <DetailGrid>
        <Detail label="PE Ratio" value={safe(ipo.valuation?.pe)} />
        <Detail label="Industry PE" value={safe(ipo.valuation?.industryPE)} />
        <Detail label="Valuation View" value={safe(ipo.valuation?.view || "Neutral")} />
      </DetailGrid>
    </Section>

    {/* ========================================================= */}
    {/* SECTION — QUOTA ALLOCATION */}
    {/* ========================================================= */}
    <Section title="Investor Quota Allocation" bg="bg-slate-100 dark:bg-[#020617]">
      <DetailGrid>
        <Detail label="Retail" value={safe(ipo.retailQuota)} />
        <Detail label="QIB" value={safe(ipo.qibQuota)} />
        <Detail label="NII" value={safe(ipo.niiQuota)} />
      </DetailGrid>
    </Section>

    {/* ========================================================= */}
    {/* SECTION — IPO DETAILS */}
    {/* ========================================================= */}
    <Section title="IPO Details" bg="bg-white dark:bg-[#020617]">
      <DetailGrid>
        <Detail label="Bidding dates" value={safe(ipo.ipoDetails?.biddingDates)} />
        <Detail label="Lot size" value={safe(ipo.ipoDetails?.lotSize)} />
        <Detail label="Min Investment" value={safe(ipo.ipoDetails?.minInvestment)} />
        <Detail label="Issue Size" value={safe(ipo.ipoDetails?.issueSize)} />
        <Detail label="Face Value" value={safe(ipo.ipoDetails?.faceValue)} />
        <Detail label="Sector" value={safe(ipo.sector)} />

        <div className="rounded-xl bg-slate-50 dark:bg-slate-900 px-4 py-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            RHP Document
          </p>
          {ipo.ipoDetails?.rhp ? (
            <a
              href={ipo.ipoDetails.rhp}
              className="text-blue-700 dark:text-blue-400 text-sm font-semibold hover:underline"
            >
              View RHP ↗
            </a>
          ) : (
            <p className="text-sm text-slate-400">–</p>
          )}
        </div>

        <Detail label="Allotment" value={safe(ipo.ipoDetails?.allotmentDate)} />
        <Detail label="Listing Date" value={safe(ipo.ipoDetails?.listingDate)} />
      </DetailGrid>
    </Section>

    {/* FAQ */}
    <IpoFaq />
  </div>
</div>

  );
}

/* ========================================================= */
/* SHARED COMPONENTS */
/* ========================================================= */

function Section({ children, title, bg }) {
  return (
   <section
  className={`rounded-2xl shadow-sm px-6 py-6 mb-10 
  ${bg} 
  bg-white dark:bg-[#020617] 
  border border-transparent dark:border-slate-800`}
>
  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
    {title}
  </h2>
  {children}
</section>

  );
}

function HighlightGrid({ children }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{children}</div>;
}

function HighlightCard({ label, value, color }) {
  return (
    <div
      className={`
        rounded-xl px-4 py-3 shadow-sm
        ${color}
        dark:bg-slate-900/60
        border border-transparent dark:border-slate-800
      `}
    >
      <p className="text-xs text-slate-600 dark:text-slate-400">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
        {value}
      </p>
    </div>
  );
}


function DetailGrid({ children }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {children}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div
      className="
        rounded-xl bg-slate-50 px-4 py-3
        dark:bg-slate-900/60
        border border-transparent dark:border-slate-800
      "
    >
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

