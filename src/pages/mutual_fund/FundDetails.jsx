import React, { useMemo, useState } from "react";
import { FiShare2 } from "react-icons/fi";
import { AiOutlineStar } from "react-icons/ai";
import { MdOutlineInfo } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import DonutChart from "../../components/DonutChart";
import MFChart from "../../components/chart/MFChart";
import MutualFundInvestPage from "./MutualFundInvestPage";
import { RedeemForm } from "./RedeemMF";
import Riskometer from "../../components/Riskometer";
import FundBadges from "../../components/FundBadges";
import { postApi, postApiWithToken } from "../../api/api";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import FundDetailsPageSkeleton from "../../components/ui/skeleton/main/FundDetailsPageSkeleton";
import { fundSipPath, holdingMatchesScheme, isMfSaved, nodeUrl, toggleMfWatchlist } from "../../utils/nodeApi";
import { toastSuccess } from "../../utils/notifyCustom";
import { titleCase, fmtAge, fmtDate } from "../../utils/schemeName";

const fmtPct = (v) => (v == null || Number.isNaN(Number(v)) ? "—" : `${Number(v).toFixed(2)}%`);
const inr = (v) => (v == null || Number.isNaN(Number(v)) ? "—" : `₹${Number(v).toLocaleString("en-IN")}`);

const FundDetails = () => {
  const { isin } = useParams();
  const { code } = useParams();
  const navigate = useNavigate();
  const { data: investorData } = useSelector((state) => state.investorData);
  const ucc = investorData?.kyc?.ucc_code;
  const [mode, setMode] = useState("sip");
  const [sipAmt, setSipAmt] = useState(5000);
  const [lumpAmt, setLumpAmt] = useState(10000);
  const [duration, setDuration] = useState(1);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [hoverIndex2, setHoverIndex2] = useState(null);
  const [saved, setSaved] = useState(() => isMfSaved(isin, code));
  const [buyModal, setBuyModal] = useState(false);
  const [sellModal, setSellModal] = useState(false);
  
    const detailsUrl = nodeUrl(import.meta.env.VITE_SCHEME_DETAILS || "/scheme-details");
  
  const { data: details, isLoading } = useQuery({
    queryKey: ["FUND_FULL_DETAILS", isin, code],
    queryFn: async () => postApi(detailsUrl, { isin, scheme_code: code }),
    enabled: !!isin && !!code,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });

  const { data: holdings = [] } = useQuery({
    queryKey: ["bsePortfolio", ucc],
    queryFn: () => postApiWithToken(nodeUrl("/getClientPortfolio"), { data: { ucc } }, { silent: true }),
    select: (res) => (Array.isArray(res?.data?.holdings) ? res.data.holdings : []),
    enabled: !!ucc,
  });

  const schemeInfo = details?.data?.scheme_info;
  const fundsList = useMemo(() => {
    const base = details?.data?.lists?.[0] || {};
    const extra = details?.data || {};
    const returns = extra.returns || schemeInfo?.returns || base.returns || {};
    const nav = schemeInfo?.current_nav ?? schemeInfo?.nav ?? base.nav;
    return {
      ...base,
      ...schemeInfo,
      nav,
      returns,
      name: schemeInfo?.name || base.name,
      category: schemeInfo?.category || extra.scheme_info?.category || base.category,
      minSip: schemeInfo?.minSip ?? base.minSip ?? 500,
      minLumpsum: schemeInfo?.minLumpsum ?? base.minLumpsum ?? 5000,
      minRedeem: schemeInfo?.minRedeem ?? base.minRedeem ?? 1000,
      expense: schemeInfo?.expense ?? base.expense,
      exitLoad: schemeInfo?.exitLoad ?? base.exitLoad,
      risk: schemeInfo?.risk ?? base.risk,
      holdings: extra.holdings || schemeInfo?.holdings || [],
      assetSplit: extra.assetSplit || [],
      sectors: extra.sectors || [],
      // Ticket 5 — the month the AMC disclosed this portfolio for.
      holdingsAsOf: extra.holdingsAsOf || null,
      categoryAvg: extra.categoryAvg || {},
      rank: extra.rank || {},
      advancedRatios: schemeInfo?.advancedRatios || extra.advancedRatios,
      // Everything BSE does not publish, filled in by the backend's enrichment layer, plus
      // the per-transaction rulebook BSE DOES publish (lumpsum[] / systematic[]).
      transactions: extra.transactions || schemeInfo?.transactions || null,
      periodReturns: extra.periodReturns || null,
      rolling: extra.rollingReturns || null,
      riskMetrics: extra.riskMetrics || null,
      fundManagers: schemeInfo?.fundManagers || [],
      objective: schemeInfo?.objective || null,
      factsheetUrl: schemeInfo?.factsheetUrl || null,
      inceptionDate: schemeInfo?.inceptionDate || null,
      ageYears: schemeInfo?.ageYears ?? null,
      // Ticket 3 — fund size, already normalised to ₹ crore by the backend.
      aum: schemeInfo?.aum ?? null,
      lockIn: schemeInfo?.lockIn || base.lockIn || null,
      benchmark: schemeInfo?.benchmark || base.benchmark || null,
      payout: schemeInfo?.payout || base.payout || null,
      txn: schemeInfo?.txn || base.txn || null,
    };
  }, [details, schemeInfo]);

  const thisHolding = useMemo(
    () =>
      holdings.find((h) =>
        holdingMatchesScheme(h, {
          isin,
          code,
          schemeBse: fundsList?.scheme_bse_code,
        })
      ) || null,
    [holdings, isin, code, fundsList?.scheme_bse_code]
  );

  function futureValueSIP(P, annualR, years) {
    const i = annualR / 12;
    const n = years * 12;
    if (i === 0) return P * n;
    return P * (Math.pow(1 + i, n) - 1) / i;
  }

  function futureValueLumpsum(PV, annualR, years) {
    return PV * Math.pow(1 + annualR, years);
  }

  function percentGain(fv, invested) {
    if (invested === 0) return 0;
    return ((fv - invested) / invested) * 100;
  }

  const fund = {
    ...fundsList,
    annualRates: {
      1: (Number(fundsList?.returns?.["1Y"]) || 0) / 100,
      3: (Number(fundsList?.returns?.["3Y"]) || 0) / 100,
      5: (Number(fundsList?.returns?.["5Y"]) || 0) / 100,
    },
    minSip: fundsList?.minSip || 500,
    minLumpsum: fundsList?.minLumpsum || 1000,
    category: fundsList?.category || "",
    holdings: fundsList?.holdings || [],
  };
  const rateForYears = (y) => {
    if (y <= 1) return fund.annualRates[1];
    if (y <= 3) return fund.annualRates[3] || fund.annualRates[1];
    return fund.annualRates[5] || fund.annualRates[3] || fund.annualRates[1];
  };
  const annualR_for_duration = rateForYears(duration);

  const totalSIPInvested = sipAmt * 12 * duration;
  const sipFV = Math.round(futureValueSIP(sipAmt, annualR_for_duration, duration));
  const sipGainPct = percentGain(sipFV, totalSIPInvested);

  const lumpResults = [1, 3, 5].map((yr) => {
    const r = fund.annualRates?.[yr] ?? fund.annualRates?.[3] ?? 0;
    const invested = lumpAmt;
    const fv = Math.round(futureValueLumpsum(lumpAmt, r, yr));
    const gainPct = percentGain(fv, invested);
    return { yr, invested, fv, gainPct, r };
  });

  const selectedLumpRate = rateForYears(duration);
  const lumpFV_selected = Math.round(futureValueLumpsum(lumpAmt, selectedLumpRate, duration));
  const lumpGainPct_selected = percentGain(lumpFV_selected, lumpAmt);
  

  const shareFund = async () => {
    const title = fundsList?.name || "WealthCrop fund";
    const url = window.location.href;
    const text = `Check ${title} on WealthCrop`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toastSuccess("Link copied");
    } catch (e) {
      if (e?.name === "AbortError") return;
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank");
    }
  };

  const toggleSave = () => {
    const nowSaved = toggleMfWatchlist({
      isin,
      code,
      name: fundsList?.name || "Fund",
      nav: fundsList?.nav,
    });
    setSaved(nowSaved);
    toastSuccess(nowSaved ? "Saved to watchlist" : "Removed from watchlist");
  };

  const openBuy = () => setBuyModal(true);
  const openSell = () => setSellModal(true);
  const closeModal = () => {
    setBuyModal(false);
    setSellModal(false);
  };



//   const fundamentals = [
//   { label: "Top 5", value: "45%" },
//   { label: "Top 20", value: "87%" },
//   { label: "P/E Ratio", value: "66.22" },
//   { label: "P/B Ratio", value: "9.00" },

//   { label: "Alpha", value: "4.56" },
//   { label: "Beta", value: "0.92" },
//   { label: "Sharpe", value: "1.10" },
//   { label: "Sortino", value: "1.37" },
// ];

const ratios = fundsList?.advancedRatios;

// Only metrics the published NAV series can actually support, and a metric is shown only
// when it was measured. Top 5 / Top 20 needed portfolio holdings, and Alpha / Beta needed
// the scheme's benchmark price series — we have neither, so the backend stopped returning
// them rather than deriving them from constants, and the tiles are gone with them.
const fundamentals = [
  { label: "Volatility", value: ratios?.volatility, suffix: "%" },
  { label: "Sharpe", value: ratios?.sharpe },
  { label: "Sortino", value: ratios?.sortino },
  { label: "Max Drawdown", value: ratios?.maxDrawdown, suffix: "%" },
  // Measured, not assumed: the backend computes both against a real index price series —
  // the scheme's own benchmark where BSE names one, otherwise the index SEBI prescribes for
  // its category. Which of the two it was is on the tooltip, so a category benchmark is
  // never read as the AMC's own. No index the backend can price = no tiles, as before.
  { label: "Alpha", value: ratios?.alpha, suffix: "%", vs: ratios?.benchmark },
  { label: "Beta", value: ratios?.beta, vs: ratios?.benchmark },
  { label: "P/E Ratio", value: ratios?.peRatio },
  { label: "P/B Ratio", value: ratios?.pbRatio },
].filter((m) => m.value != null);

const rf = ratios?.riskFreeRate;
// Says so out loud when the index came from the scheme's category rather than from the AMC
// naming it. Alpha and Beta against a standard category index are still real numbers, but
// the investor should know which of the two they are reading.
const benchmarkOrigin =
  fundsList?.riskMetrics?.benchmarkSource === "category"
    ? ", the standard benchmark for this category"
    : "";
const advancedDefinitions = {
  "Volatility": "Annualised standard deviation of the fund's daily NAV moves over the last year. Higher means the NAV swings more.",
  // The return inside Sharpe and Sortino is the annualised ARITHMETIC mean of the daily
  // moves, which is what the ratio is defined on — not the compounded figure shown on the
  // "1Y" card above. The two differ by roughly half the variance, so on a volatile fund
  // they can even carry opposite signs. Say so, rather than let it read as a bug.
  "Sharpe": `Return above the risk-free rate${rf != null ? ` (${rf}%)` : ""} per unit of total volatility, over the last year. Higher is better risk-adjusted performance. It uses the average of the daily moves, so it will not match the compounded 1Y return exactly.`,
  "Sortino": `Same idea as Sharpe, but only falls below the risk-free rate${rf != null ? ` (${rf}%)` : ""} count as risk. It ignores upside swings.`,
  "Max Drawdown": "The worst peak-to-trough fall in NAV over the last year — how far the fund dropped before recovering.",
  Alpha: `Return earned beyond what this fund's market exposure alone would explain, measured against ${
    fundsList?.riskMetrics?.benchmark || "its benchmark"
  }${benchmarkOrigin}${fundsList?.riskMetrics?.benchmarkIsPriceIndex ? " (price index, so a TRI-based alpha would read slightly lower)" : ""}. Positive means the manager added value.`,
  Beta: `How much the fund moves for each 1% move in ${
    fundsList?.riskMetrics?.benchmark || "its benchmark"
  }${benchmarkOrigin}. Above 1 is more volatile than the index, below 1 is less.`,
  "P/E Ratio": "Price-to-Earnings Ratio shows how much investors are willing to pay for each unit of earnings. A higher P/E may indicate growth expectations.",
  "P/B Ratio": "Price-to-Book Ratio compares a company's market price to its book value. A lower P/B can indicate undervaluation or financial stability.",
};

const [activeInfo, setActiveInfo] = useState(null);

// Absolute vs CAGR. The chart owns the visible toggle and calls back here, so the numbers
// in the returns table and the headline always agree with the line being drawn — one
// control, not two that can disagree.
// Opens on what the chart opens on. MFChart reports its mode on mount now, so a mismatched
// default here only bought one painted frame of the wrong label before it corrected itself.
const [returnMode, setReturnMode] = useState("absolute");
const periodReturns = fundsList?.periodReturns;
const shownReturns = periodReturns?.[returnMode] || null;
const annualised = returnMode === "cagr";
const pctOf = (key) => {
  if (!shownReturns) {
    // No periodReturns (an older cached response) — fall back to the legacy mixed set
    // rather than blanking the table.
    return fmtPct(fundsList?.returns?.[key]);
  }
  const v = shownReturns[key];
  return v == null ? "—" : `${Number(v).toFixed(2)}%${annualised ? " p.a." : ""}`;
};

  if (isLoading) return <FundDetailsPageSkeleton />;  

  return (

    <div className="w-full bg-gray-50 dark:bg-[var(--app-bg)] text-[#1A1A1A] py-10 px-5 lg:px-24 space-y-10">
      {/* HEADER */}
 <header className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"> 

  {/* LEFT MAIN SECTION */}
  <div className="
  col-span-2
  bg-[var(--white-10)]
  backdrop-blur-sm
  dark:border border-[var(--border-color)]
  rounded-2xl p-6 shadow-md
">

  {/* TOP: Logo + Title + Save/Share */}
  <div className="flex flex-col md:flex-row items-start md:justify-between gap-4">

    {/* LOGO + TITLE */}
    <div className="flex items-start gap-4 flex-1 min-w-0">
      <div className="w-16 h-16 rounded-xl shadow bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold">
        {(fundsList?.logoText || fundsList?.name || "F").charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">

        {/* FUND NAME — BSE shouts it; titleCase() is the one place that fixes the casing,
            and every other surface calls the same helper so they cannot drift.
            `capitalize` was removed with it: the CSS class lower-cases nothing, so it left
            "SBI ESG EXCLUSIONARY" exactly as it was. */}
        <h1 className="text-2xl font-bold text-[var(--text-primary)] break-words whitespace-normal">
          {titleCase(fundsList?.name)}
        </h1>

        {/* CATEGORY + ISIN. The BSE scheme code is our routing detail and stays off screen;
            ISIN is what the investor sees on their own CAS. */}
        <div className="flex flex-wrap items-center gap-3 mt-1">
          <span className="text-sm text-[var(--text-secondary)]">
            {fundsList?.category || fund.category || "Mutual Fund"}
          </span>
          {fundsList?.scheme_isin ? (
            <span className="text-xs font-mono text-[var(--text-secondary)]" title="ISIN">
              {fundsList.scheme_isin}
            </span>
          ) : null}
        </div>

        {/* PHYSICAL / SIP / PLAN — same BSE flags Explore shows on the card. `/scheme-details`
            runs the same mapScheme() as `/master-scheme-list`, so `physical_only`, `sip_allowed`
            and `plan` arrive on `data.scheme_info` and are already inside fundsList. The admin-set
            `admin_category` pill is the one Explore has and this page does not: it is attached
            by the catalogue, not by this endpoint. */}
        <FundBadges fund={fundsList} className="mt-2" />

        {/* SAVE + SHARE (SMALL) */}
        <div className="flex md:hidden gap-3 mt-3">
          <button
            onClick={toggleSave}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition
              ${
                saved
                  ? "bg-emerald-600 text-white"
                  : "bg-[var(--white-5)] border border-[var(--border-color)] text-[var(--text-secondary)]"
              }`}
          >
            <AiOutlineStar />
          </button>

          <button
            onClick={shareFund}
            className="
              flex items-center gap-2 px-3 py-2 rounded-xl
              bg-[var(--white-5)]
              border border-[var(--border-color)]
              text-[var(--text-secondary)]
              hover:bg-[var(--white-10)]
            "
          >
            <FiShare2 />
          </button>
        </div>

      </div>
    </div>

    {/* SAVE + SHARE (MD+) */}
    <div className="hidden md:flex md:items-center gap-3">
      <button
        onClick={toggleSave}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition
          ${
            saved
              ? "bg-emerald-600 text-white"
              : "bg-[var(--white-5)] border border-[var(--border-color)] text-[var(--text-secondary)]"
          }`}
      >
        <AiOutlineStar />
        <span>{saved ? "Saved" : "Save"}</span>
      </button>

      <button
        onClick={shareFund}
        className="
          flex items-center gap-2 px-3 py-2 rounded-xl
          bg-[var(--white-5)]
          border border-[var(--border-color)]
          text-[var(--text-secondary)]
          hover:bg-[var(--white-10)]
        "
      >
        <FiShare2 />
        <span>Share</span>
      </button>
    </div>

  </div>

  {/* MIDDLE: Performance + Invest */}
  <div className="mt-5 flex flex-wrap items-center gap-6 justify-between">

    {/* PERFORMANCE */}
    <div>
      <div className="flex items-end gap-3">
        {/* Follows the same Absolute / CAGR toggle as the chart and the table below, and
            says "p.a." only when the figure really is annualised. */}
        <h2 className="text-4xl font-extrabold text-emerald-500">
          {pctOf("3Y")}
          <span className="text-[var(--text-secondary)] text-sm font-medium ml-1">
            3Y {annualised ? "annualised" : "absolute"}
          </span>
        </h2>
    </div>
    </div>

    {/* INVEST */}
    <div className="flex gap-3 items-center flex-wrap">
      <button
        onClick={openBuy}
        className="
          px-5 py-2 rounded-xl
          bg-emerald-600 hover:bg-emerald-700
          text-white font-semibold shadow
        "
      >
        {thisHolding ? "Invest more" : "Invest Now"}
      </button>
      <button
        onClick={openSell}
        className="
          px-5 py-2 rounded-xl
          bg-red-600 hover:bg-red-700
          text-white font-semibold shadow
        "
      >
        Redeem
      </button>

      {/* The SIP setup page needs a fund, and until now nothing passed it one — its only
          entry point was a promo link carrying no state, so every registration reached BSE
          with an empty src_scheme. This is that entry point. Shown only where BSE says the
          scheme accepts a SIP. */}
      {fundsList?.sip_allowed === true && (
        <button
          onClick={() => navigate(fundSipPath(fundsList?.scheme_isin || isin, fundsList?.scheme_bse_code || code), {
            state: {
              fund: {
                name: fundsList?.name,
                scheme_bse_code: fundsList?.scheme_bse_code || code,
                scheme_isin: fundsList?.scheme_isin || isin,
                minSip: fundsList?.minSip,
                nav: fundsList?.nav,
              },
            },
          })}
          className="
            px-5 py-2 rounded-xl
            border border-emerald-600 text-emerald-700 dark:text-emerald-400
            font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-500/10
          "
        >
          Start SIP
        </button>
      )}

      <div className="text-right text-sm text-[var(--text-secondary)]">
        <div>
          Nav:
          <span className="text-[var(--text-primary)] font-medium ml-1">
            {fundsList?.nav != null ? `₹${Number(fundsList.nav).toFixed(2)}` : "—"}
          </span>
        </div>
        {fundsList?.minLumpsum ? (
        <div>
          Min lumpsum:
          <span className="text-[var(--text-primary)] font-medium ml-1">
            ₹{fundsList.minLumpsum}
          </span>
        </div>
        ) : null}
      </div>
    </div>

  </div>
</div>


  {/* RIGHT MINI PANEL */}
 <aside
  className="
    bg-[var(--white-10)]
    backdrop-blur-sm
    dark:border border-[var(--border-color)]
    rounded-2xl p-4 shadow-md
    h-full mt-4 lg:mt-0
  "
>
  <div className="flex flex-col gap-4">

    {fundsList?.expense ? (
    <div className="bg-[var(--white-5)] p-3 rounded-lg dark:border border-[var(--border-color)]">
      <p className="text-xs text-[var(--text-secondary)]">
        Expense Ratio
      </p>
      <p className="text-lg font-semibold text-[var(--text-primary)]">
        {fundsList.expense}
      </p>
    </div>
    ) : null}

    {fundsList?.week52Low != null && fundsList?.week52High != null ? (
    <div className="bg-[var(--white-5)] p-3 rounded-lg dark:border border-[var(--border-color)]">
      <p className="text-xs text-[var(--text-secondary)]">
        52W Range
      </p>
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        ₹{fundsList.week52Low} - ₹{fundsList.week52High}
      </p>
    </div>
    ) : null}

    {/* CORE SCHEME PARAMETERS — each one drawn only when it is actually known. A tile that
        says "—" is the "incorrect or hardcoded placeholder" the brief rules out; an absent
        tile is the honest form of "not published". */}
    {[
      ["ISIN", fundsList?.scheme_isin, "The public identifier printed on your CAS"],
      // Ticket 3 — the backend hands this over already in ₹ crore, unit verified against
      // published figures for two funds. Rendered in the Indian digit grouping people read
      // fund sizes in, so 148429 shows as 1,48,429.
      [
        "Fund size",
        fundsList?.aum > 0 ? `₹${Number(fundsList.aum).toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr` : null,
        "Total assets this scheme manages, across all its plans",
      ],
      ["Plan inception", fmtDate(fundsList?.inceptionDate), "When this plan started — not necessarily when the scheme launched"],
      ["Fund age", fmtAge(fundsList?.ageYears), null],
      ["Lock-in", fundsList?.lockIn?.label, "Units cannot be redeemed during this period"],
      ["Benchmark", fundsList?.benchmark, "The index this scheme measures itself against"],
      ["Rating", fundsList?.fundRating ? `${fundsList.fundRating} / 5` : null, null],
    ]
      .filter(([, v]) => v)
      .map(([label, value, hint]) => (
        <div key={label} className="bg-[var(--white-5)] p-3 rounded-lg dark:border border-[var(--border-color)]" title={hint || undefined}>
          <p className="text-xs text-[var(--text-secondary)]">{label}</p>
          <p className={`font-semibold text-[var(--text-primary)] ${label === "ISIN" ? "text-xs font-mono break-all" : "text-sm"}`}>
            {value}
          </p>
        </div>
      ))}

  </div>
</aside>


</header>


      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
  className="
    lg:col-span-2
    bg-white dark:bg-[var(--card-bg)]
    dark:border
    border-[var(--border-color)]
    rounded-2xl shadow-lg
    p-6
  "
>
  <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
    <h3 className="text-sm font-semibold text-gray-700 dark:text-[var(--text-primary)]">NAV history</h3>
    <div className="text-sm text-gray-500 dark:text-[var(--text-secondary)]">
      {schemeInfo?.nav_date ? `NAV as on ${schemeInfo.nav_date}` : `Updated: ${new Date().toLocaleTimeString()}`}
    </div>
  </div>

  <MFChart
    series={details?.data?.chartData || []}
    synthetic={!!details?.data?.synthetic}
    height={320}
    onModeChange={setReturnMode}
  />

  <div className="mt-4 grid grid-cols-2 gap-3">
    <div
      className="
        p-4 rounded-xl shadow-sm text-center
        bg-green-50 dark:bg-emerald-500/15
      "
    >
      <p
        className="
          text-xs
          text-gray-500 dark:text-[var(--text-secondary)]
        "
      >
        1-Year Return
      </p>
      <p
        className="
          font-semibold
          text-gray-900 dark:text-emerald-400
        "
      >
        {fmtPct(fundsList?.returns?.["1Y"])}
      </p>
    </div>

    <div
      className="
        p-4 rounded-xl shadow-sm text-center
        bg-orange-50 dark:bg-orange-500/15
      "
    >
      <p
        className="
          text-xs
          text-gray-500 dark:text-[var(--text-secondary)]
        "
      >
        Min. SIP
      </p>
      <p
        className="
          font-semibold
          text-gray-900 dark:text-[var(--text-primary)]
        "
      >
        {inr(fundsList?.minSip)}
      </p>
    </div>
  </div>
</div>


        {/* Needs at least 20 daily NAVs to measure anything; a brand-new scheme has none,
            and an empty tile grid under a heading reads as broken. */}
        {fundamentals.length ? (
        <aside className="bg-white/60 dark:bg-[var(--white-10)] backdrop-blur-sm border border-white/40 rounded-2xl p-4 shadow-md dark:border border-[var(--border-color)]">
          <h4 className="text-lg font-semibold text-slate-900 mb-3 dark:text-[var(--text-primary)] ">
            Advanced Ratios
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {fundamentals.map((item, index) => (
              <div
                key={index}
                className="relative p-3 bg-white dark:bg-[var(--white-10)]  rounded-md shadow-sm border border-gray-100 dark:border dark:border-[var(--border-color)] cursor-pointer"
                onClick={() =>
                  setActiveInfo(activeInfo === index ? null : index)
                }
              >
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)]">
                    {item.label}
                    {/* Alpha and Beta are meaningless without the index they were measured
                        against, so it sits on the card itself rather than only in the
                        tooltip — a number nobody hovers is a number read out of context. */}
                    {item.vs ? (
                      <span className="text-[10px] text-slate-400 dark:text-[var(--text-secondary)]"> vs {item.vs}</span>
                    ) : null}
                  </p>
                  <span className="text-gray-500 dark:text-[var(--text-secondary)] text-xs">
                    <MdOutlineInfo />
                  </span>
                </div>

                <p className="font-semibold mt-1 dark:text-[var(--text-primary)]">
                  {item.value}{item.suffix || ""}
                </p>

                {activeInfo === index && (
                  <div className="absolute top-14 left-0 w-56 p-3 bg-white border border-gray-200 rounded-lg shadow-md text-xs text-gray-700 z-50">
                    {advancedDefinitions[item.label]}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <span className="text-gray-500">
              <MdOutlineInfo />
            </span>
            <span>
              Click any metric to view its definition
              {ratios?.window ? ` · measured over the last ${ratios.window} NAV days` : ""}
            </span>
          </div>
        </aside>
        ) : null}
      </div>

      {/* Return Calculator */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Return Calculator */}
        <div className="bg-white dark:bg-[var(--white-10)] dark:border border-[var(--border-color)] shadow-lg rounded-2xl p-6 flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold dark:text-[var(--text-primary)]">Return Calculator</h2>
            {/* <button className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition">
        Invest in Fund
      </button> */}
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode("sip")}
              className={`px-4 py-2 rounded-full border font-medium ${
                mode === "sip"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white border-gray-300"
              }`}
            >
              Monthly SIP
            </button>

            <button
              onClick={() => setMode("lumpsum")}
              className={`px-4 py-2 rounded-full border font-medium ${
                mode === "lumpsum"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white border-gray-300"
              }`}
            >
              One-Time
            </button>
          </div>

          {mode === "sip" && (
            <div>
              <p className="font-semibold text-lg mb-2 dark:text-[var(--text-primary)]">
                ₹{sipAmt.toLocaleString()} per month
              </p>
              <input
                type="range"
                min={fund.minSip}
                max={50000}
                step={500}
                value={sipAmt}
                onChange={(e) => setSipAmt(Number(e.target.value))}
                className="w-full mb-4 "
              />

              <p className="text-gray-600 mb-2 dark:text-[var(--text-primary)]">
                Duration: {duration} year{duration > 1 ? "s" : ""}
              </p>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full mb-4"
              />

              <div className="mt-4 border-t pt-4 text-sm dark:text-[var(--text-secondary)]">
                <p>Total investment of ₹{totalSIPInvested.toLocaleString()}</p>
                <p className="font-semibold mt-2">
                  Would have become{" "}
                  <span className="text-green-600">
                    ₹{sipFV.toLocaleString()} ({sipGainPct.toFixed(2)}%)
                  </span>
                </p>

                {/* The investor has just chosen an amount and a duration here; carrying
                    both into the setup form beats making them type it again. */}
                {fundsList?.sip_allowed === true && (
                  <button
                    onClick={() =>
                      navigate(fundSipPath(fundsList?.scheme_isin || isin, fundsList?.scheme_bse_code || code), {
                        state: {
                          fund: {
                            name: fundsList?.name,
                            scheme_bse_code: fundsList?.scheme_bse_code || code,
                            scheme_isin: fundsList?.scheme_isin || isin,
                            minSip: fundsList?.minSip,
                            nav: fundsList?.nav,
                          },
                          amount: sipAmt,
                          years: duration,
                        },
                      })
                    }
                    className="mt-4 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    Start this SIP
                  </button>
                )}
              </div>
            </div>
          )}

          {mode === "lumpsum" && (
            <div>
              <p className="font-semibold text-lg mb-2 dark:text-[var(--text-primary)]">
                ₹{lumpAmt.toLocaleString()}
              </p>
              <input
                type="range"
                min={fund.minLumpsum}
                max={200000}
                step={500}
                value={lumpAmt}
                onChange={(e) => setLumpAmt(Number(e.target.value))}
                className="w-full mb-4"
              />

              <p className="text-gray-600 mb-2 dark:text-[var(--text-primary)]">
                Duration: {duration} year{duration > 1 ? "s" : ""}
              </p>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full mb-4"
              />

              <div className="mt-4 border-t pt-4 text-sm dark:text-[var(--text-secondary)]">
                <p>Investment of ₹{lumpAmt.toLocaleString()}</p>
                <p className="font-semibold mt-2">
                  Would have become{" "}
                  <span className="text-green-600">
                    ₹{lumpFV_selected.toLocaleString()} (
                    {lumpGainPct_selected.toFixed(2)}%)
                  </span>
                </p>

                {/* <div className="mt-4">
            <p className="text-gray-600 mb-2 font-medium">Breakdown</p>
            {lumpResults.map((res) => (
              <div key={res.yr} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                <div>
                  <div className="font-medium">{res.yr} year{res.yr > 1 ? "s" : ""}</div>
                  <div className="text-gray-500">Annual rate: {(res.r * 100).toFixed(2)}%</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹{res.fv.toLocaleString()}</div>
                  <div className="text-green-600">{res.gainPct.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div> */}
              </div>
            </div>
          )}
        </div>

        {/* Minimum Investments */}
        <div className="bg-white dark:bg-[var(--white-10)] dark:border border-[var(--border-color)] shadow-lg rounded-2xl p-6 flex-1 h-80">
          <h2 className="text-2xl font-semibold mb-6 dark:text-[var(--text-primary)]">
            Minimum Investment Amounts
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between border-b py-2">
              <span className="text-gray-600 dark:text-[var(--text-secondary)]">Min. for 1st investment</span>
              <span className="font-semibold dark:text-[var(--text-primary)]">{inr(fundsList?.minLumpsum)}</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-gray-600 dark:text-[var(--text-secondary)]">
                Min. for 2nd investment onwards
              </span>
              <span className="font-semibold dark:text-[var(--text-primary)]">{inr(fundsList?.minRedeem || fundsList?.minLumpsum)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-[var(--text-secondary)]">Min. for SIP</span>
              <span className="font-semibold dark:text-[var(--text-primary)]">{inr(fundsList?.minSip)}</span>
            </div>
          </div>
        </div>
      </div>


      {/* HOW YOU CAN TRANSACT — BSE publishes a separate rulebook per transaction type and
          per frequency (lumpsum[] / systematic[]), including the ONLY dates it will accept.
          Nothing on this card is a default: a type BSE did not send simply is not listed,
          and the 500 / 5000 minimums that used to be pinned on in the backend are gone. */}
      {fundsList?.transactions && Object.keys(fundsList.transactions).length ? (
        <div className="bg-[var(--white-10)] border border-[var(--border-color)] shadow-lg rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-1 text-[var(--text-primary)]">How you can invest</h2>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            Published by BSE for this scheme. Anything not listed here is not offered on it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              ["lumpsum", "Lumpsum"],
              ["sip", "SIP"],
              ["swp", "SWP"],
              ["stpIn", "STP (in)"],
              ["stpOut", "STP (out)"],
              ["redemption", "Redemption"],
              ["switchIn", "Switch in"],
              ["switchOut", "Switch out"],
            ]
              .map(([key, label]) => [key, label, fundsList.transactions[key]])
              .filter(([, , t]) => t && t.allowed)
              .map(([key, label, t]) => (
                <div key={key} className="bg-[var(--white-5)] p-4 rounded-xl dark:border border-[var(--border-color)]">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[var(--text-primary)]">{label}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                      AVAILABLE
                    </span>
                  </div>
                  <dl className="mt-2 space-y-1 text-sm">
                    {t.minAmount != null && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-[var(--text-secondary)]">Minimum</dt>
                        <dd className="text-[var(--text-primary)] font-medium">{inr(t.minAmount)}</dd>
                      </div>
                    )}
                    {t.minAdditional != null && t.minAdditional > 0 && t.minAdditional !== t.minAmount && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-[var(--text-secondary)]">Additional</dt>
                        <dd className="text-[var(--text-primary)] font-medium">{inr(t.minAdditional)}</dd>
                      </div>
                    )}
                    {t.cutoff && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-[var(--text-secondary)]">Cut-off</dt>
                        <dd className="text-[var(--text-primary)] font-medium">{t.cutoff}</dd>
                      </div>
                    )}
                    {(t.frequencies || []).filter((f) => f.registrationAllowed).length > 0 && (
                      <div className="pt-1">
                        <dt className="text-[var(--text-secondary)] text-xs">Frequencies</dt>
                        <dd className="mt-1 space-y-1">
                          {t.frequencies
                            .filter((f) => f.registrationAllowed)
                            .map((f) => (
                              <div key={f.frequency} className="text-xs text-[var(--text-primary)]">
                                <span className="font-medium">{f.frequency}</span>
                                {f.minAmount != null && <span className="text-[var(--text-secondary)]"> · min {inr(f.minAmount)}</span>}
                                {f.minInstallments != null && (
                                  <span className="text-[var(--text-secondary)]"> · from {f.minInstallments} instalments</span>
                                )}
                                {f.dates?.length > 0 && f.dates.length < 28 && (
                                  <span className="text-[var(--text-secondary)]"> · dates {f.dates.join(", ")}</span>
                                )}
                              </div>
                            ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      {/* FUND MANAGER + OBJECTIVE — neither exists in BSE's master; both come from the
          enrichment source, and the section disappears when it has nothing real to show. */}
      {(fundsList?.fundManagers?.length || fundsList?.objective) ? (
        <div className="bg-[var(--white-10)] border border-[var(--border-color)] shadow-lg rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">About this fund</h2>
          {fundsList.fundManagers?.length ? (
            <div className="mb-4">
              <p className="text-xs text-[var(--text-secondary)] mb-1">
                Fund manager{fundsList.fundManagers.length > 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {fundsList.fundManagers.map((m) => (
                  <span key={m} className="px-3 py-1 rounded-full text-sm bg-[var(--white-5)] text-[var(--text-primary)] dark:border border-[var(--border-color)]">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {fundsList.objective ? (
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Investment objective</p>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{fundsList.objective}</p>
            </div>
          ) : null}
          {fundsList.factsheetUrl ? (
            <a
              href={fundsList.factsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-sm font-medium text-blue-600 hover:underline"
            >
              Scheme documents from the AMC →
            </a>
          ) : null}
        </div>
      ) : null}

      {/* ROLLING RETURNS — what EVERY window in this fund's history returned, not the one
          window that happens to end today. Computed from the same NAV series as the chart;
          a period the fund is too young for is simply absent. */}
      {fundsList?.rolling && Object.values(fundsList.rolling).some(Boolean) ? (
        <div className="bg-[var(--white-10)] border border-[var(--border-color)] shadow-lg rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-1 text-[var(--text-primary)]">Rolling returns</h2>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            Every historical window of this length, annualised — the spread matters more than any single number.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-secondary)] text-xs">
                  <th className="py-2 pr-4">Period</th>
                  <th className="py-2 pr-4">Average</th>
                  <th className="py-2 pr-4">Median</th>
                  <th className="py-2 pr-4">Worst</th>
                  <th className="py-2 pr-4">Best</th>
                  <th className="py-2 pr-4">Positive</th>
                  <th className="py-2">Windows</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(fundsList.rolling)
                  .filter(([, v]) => v)
                  .map(([period, v]) => (
                    <tr key={period} className="border-t border-[var(--border-color)]">
                      <td className="py-2 pr-4 font-medium text-[var(--text-primary)]">{period}</td>
                      <td className="py-2 pr-4 text-[var(--text-primary)]">{fmtPct(v.average)}{v.annualised ? " p.a." : ""}</td>
                      <td className="py-2 pr-4 text-[var(--text-primary)]">{fmtPct(v.median)}{v.annualised ? " p.a." : ""}</td>
                      <td className="py-2 pr-4 text-red-500">{fmtPct(v.min)}</td>
                      <td className="py-2 pr-4 text-emerald-600">{fmtPct(v.max)}</td>
                      <td className="py-2 pr-4 text-[var(--text-primary)]">{fmtPct(v.positivePct)}</td>
                      <td className="py-2 text-[var(--text-secondary)]">{v.windows}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Holdings come from the AMC's monthly portfolio disclosure, which none of our
          feeds carry, so it is uploaded through the admin panel and served from there. Still
          hidden entirely when there is none, the way the two donuts below already are. */}
      {(fundsList?.holdings || []).length ? (
      <div className="bg-[var(--white-10)] border border-[var(--border-color)] shadow-lg rounded-2xl p-6 max-w-4xl">
  <h2 className="text-2xl font-semibold mb-1 text-[var(--text-primary)]">Top Holdings</h2>
  {/* A portfolio is a point-in-time fact — saying which month it is stops a stale upload
      being read as today's positions. */}
  <p className="text-xs text-[var(--text-secondary)] mb-4">
    {fundsList?.holdingsAsOf
      ? `As disclosed by the AMC on ${fmtDate(fundsList.holdingsAsOf)}`
      : "As disclosed by the AMC"}
  </p>
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead>
        <tr className="text-left bg-[var(--white-5)] border-b border-[var(--border-color)]">
          <th className="py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">Name</th>
          <th className="py-3 px-4 text-sm font-semibold text-[var(--text-secondary)] hidden lg:table-cell">Sector</th>
          <th className="py-3 px-4 text-sm font-semibold text-[var(--text-secondary)] hidden lg:table-cell">Instrument</th>
          <th className="py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">Assets</th>
        </tr>
      </thead>
      <tbody>
        {(fundsList?.holdings || []).map((h, i) => (
          <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--white-5)]">
            <td className="py-3 px-4 text-[var(--text-primary)]">{h.name}</td>
            <td className="py-3 px-4 text-[var(--text-secondary)] hidden lg:table-cell">{h.sector}</td>
            <td className="py-3 px-4 text-[var(--text-secondary)] hidden lg:table-cell">{h.instrument}</td>
            <td className="py-3 px-4 text-[var(--text-secondary)]">{h.asset}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
      ) : null}

      {(fundsList?.assetSplit || []).length ? (
      <div className="lg:flex gap-12 items-start mt-10 hidden">
        <div className="space-y-3 w-1/2">
          <h2 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">Holding Analysis</h2>
          <p className="mb-3 text-[var(--text-secondary)]">Equity / Debt / Cash Split</p>
          {fundsList.assetSplit.map((item, index) => (
            <div key={item.label} className={`flex items-center gap-3 cursor-pointer ${hoverIndex === null || hoverIndex === index ? "opacity-100" : "opacity-30"}`}
              onMouseEnter={() => setHoverIndex(index)} onMouseLeave={() => setHoverIndex(null)}>
              <span className="h-3 w-3 rounded-full" style={{ background: item.color }} />
              <span className="text-[var(--text-primary)]">{item.label}</span>
              <span className="text-[var(--text-secondary)]">{item.value}%</span>
            </div>
          ))}
        </div>
        <div className="w-1/2">
          <DonutChart data={fundsList.assetSplit} hoverIndex={hoverIndex} setHoverIndex={setHoverIndex} />
        </div>
      </div>
      ) : null}

      {(fundsList?.sectors || []).length ? (
      <div className="lg:flex gap-12 items-start mt-10 hidden">
        <div className="space-y-3 w-1/2">
          <h2 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">Equity Sector Allocation</h2>
          {fundsList.sectors.map((item, index) => (
            <div key={item.label} className={`flex items-center gap-3 cursor-pointer ${hoverIndex2 === null || hoverIndex2 === index ? "opacity-100" : "opacity-30"}`}
              onMouseEnter={() => setHoverIndex2(index)} onMouseLeave={() => setHoverIndex2(null)}>
              <span className="h-3 w-3 rounded-full" style={{ background: item.color }} />
              <span className="text-[var(--text-primary)]">{item.label}</span>
              <span className="text-[var(--text-secondary)]">{item.value}%</span>
            </div>
          ))}
        </div>
        <div className="w-1/2">
          <DonutChart data={fundsList.sectors} hoverIndex={hoverIndex2} setHoverIndex={setHoverIndex2} />
        </div>
      </div>
      ) : null}

      {/* Portfolio composition — holdings, asset split and sectors — comes from the AMC's
          monthly disclosure, which no feed wired into this platform publishes. Rather than
          three silently missing cards, say so once and point at the document that does have
          it: the factsheet URL we already hold for this exact scheme. */}
      {!(fundsList?.holdings || []).length &&
      !(fundsList?.assetSplit || []).length &&
      !(fundsList?.sectors || []).length ? (
        <div className="bg-[var(--white-10)] border border-[var(--border-color)] shadow-lg rounded-2xl p-6 max-w-4xl mt-10">
          <h2 className="text-2xl font-semibold mb-2 text-[var(--text-primary)]">Portfolio &amp; Top Holdings</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            This scheme&apos;s holdings are published by the AMC in its monthly portfolio
            disclosure, which this platform does not yet receive as a data feed.
            {fundsList?.factsheetUrl ? " The AMC's own factsheet has the current list:" : ""}
          </p>
          {fundsList?.factsheetUrl ? (
            <a
              href={fundsList.factsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 underline"
            >
              View the factsheet for {titleCase(fundsList?.name || "this scheme")} →
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="bg-[var(--white-10)] backdrop-blur-lg shadow-xl rounded-3xl p-6 max-w-4xl mt-10 overflow-x-auto border border-[var(--border-color)]">
  <h2 className="text-2xl font-bold mb-5 text-[var(--text-primary)]">📊 Returns & Rankings</h2>
  <table className="min-w-full table-auto border-collapse text-sm sm:text-base">
    <thead>
      {/* The old header labelled 1Y "Annualised" and 5Y "Absolute" across a colSpan that did
          not line up — and the underlying numbers really were mixed (1Y absolute, 3Y/5Y
          compounded) under one row called "Fund returns". One mode now governs the whole
          row, and it says which one. */}
      <tr className="border-y border-[var(--border-color)] bg-[var(--white-5)]">
        <th className="py-3 px-4 font-semibold text-left text-[var(--text-secondary)]">
          Category: <span className="text-sky-400 font-bold">{fundsList?.category || "Mutual Fund"}</span>
        </th>
        <th className="py-3 px-4 font-semibold text-left text-emerald-400" colSpan={5}>
          {annualised ? "Annualised (CAGR)" : "Absolute"} returns
          <span className="ml-2 text-xs font-normal text-[var(--text-secondary)]">
            — switch with the Absolute / CAGR toggle on the chart
          </span>
        </th>
      </tr>
      <tr className="text-xs sm:text-sm bg-[var(--white-5)] border-b border-[var(--border-color)]">
        <th className="py-2 px-4"></th>
        {["1Y", "3Y", "5Y", "10Y"].map((k) => (
          <th key={k} className="py-2 px-4 text-[var(--text-secondary)]">{k}</th>
        ))}
        <th className="py-2 px-4 text-[var(--text-secondary)]">Since inception</th>
      </tr>
    </thead>
    <tbody>
      <tr className="hover:bg-[var(--white-5)]">
        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">Fund returns</td>
        <td className="py-3 px-4 font-semibold text-emerald-400">{pctOf("1Y")}</td>
        <td className="py-3 px-4 font-semibold text-sky-400">{pctOf("3Y")}</td>
        <td className="py-3 px-4 font-semibold text-indigo-400">{pctOf("5Y")}</td>
        <td className="py-3 px-4 font-semibold text-violet-400">{pctOf("10Y")}</td>
        <td className="py-3 px-4 font-semibold text-[var(--text-secondary)]">
          {periodReturns
            ? annualised
              ? periodReturns.inceptionCagr != null
                ? `${periodReturns.inceptionCagr.toFixed(2)}% p.a.`
                : "—"
              : periodReturns.inception != null
              ? `${periodReturns.inception.toFixed(2)}%`
              : "—"
            : fmtPct(fundsList?.returns?.ALL)}
        </td>
      </tr>
      <tr className="hover:bg-[var(--white-5)] border-y border-[var(--border-color)]">
        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">Category average</td>
        <td className="py-3 px-4 text-emerald-400">{fmtPct(fundsList?.categoryAvg?.["1Y"])}</td>
        <td className="py-3 px-4 text-sky-400">{fmtPct(fundsList?.categoryAvg?.["3Y"])}</td>
        <td className="py-3 px-4 text-indigo-400">{fmtPct(fundsList?.categoryAvg?.["5Y"])}</td>
        <td className="py-3 px-4 text-[var(--text-secondary)]">—</td>
        <td className="py-3 px-4 text-[var(--text-secondary)]">{fundsList?.categoryAvg?.ALL != null ? fmtPct(fundsList.categoryAvg.ALL) : "NA"}</td>
      </tr>
      <tr className="hover:bg-[var(--white-5)]">
        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">Rank within category</td>
        {["1Y", "3Y", "5Y", "10Y", "ALL"].map((k) => (
          <td key={k} className="py-3 px-4">
            {fundsList?.rank?.[k] != null ? (
              <span className="bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full font-bold">{fundsList.rank[k]}</span>
            ) : "NA"}
          </td>
        ))}
      </tr>
    </tbody>
  </table>
</div>


      {/* Expense Ratio, Exit Load & Tax */}
     <div
  className="
    bg-[var(--white-10)]
    shadow-md
    rounded-2xl
    p-6
    max-w-3xl
    mt-10
    border border-[var(--border-color)]
    space-y-5
  "
>
  <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
    Expense Ratio, Exit Load & Tax
  </h2>

  {/* Expense Ratio */}
  <div
    className="
      p-4 rounded-xl
      border border-[var(--border-color)]
      bg-[var(--white-5)]
    "
  >
    <p className="font-semibold text-[var(--text-primary)]">
      Expense Ratio
    </p>
    <p className="text-[var(--text-primary)] mt-1">
      {fundsList?.expense != null ? String(fundsList.expense) : "—"}
    </p>
    <p className="text-[var(--text-secondary)] text-sm mt-1">
      Inclusive of GST
    </p>
  </div>

  {/* Exit Load */}
  <div
    className="
      p-4 rounded-xl
      border border-[var(--border-color)]
      bg-[var(--white-5)]
    "
  >
    <p className="font-semibold text-[var(--text-primary)]">
      Exit Load
    </p>
    <p className="text-[var(--text-secondary)] text-sm mt-1">
      {fundsList?.exitLoad || "Not disclosed by the exchange."}
    </p>
  </div>

  {/* Stamp Duty */}
  <div
    className="
      p-4 rounded-xl
      border border-[var(--border-color)]
      bg-[var(--white-5)]
    "
  >
    <p className="font-semibold text-[var(--text-primary)]">
      Stamp Duty
    </p>
    <p className="text-[var(--text-secondary)] text-sm mt-1">
      0.005% (from July 1st, 2020)
    </p>
  </div>

  {/* Tax Implication */}
  <div
    className="
      p-4 rounded-xl
      border border-[var(--border-color)]
      bg-[var(--white-5)]
    "
  >
    <p className="font-semibold text-[var(--text-primary)]">
      Tax Implication
    </p>
    <p className="text-[var(--text-secondary)] text-sm mt-1 leading-relaxed">
      If you redeem within two years, returns are taxed as per your Income
      Tax slab. If you redeem after two years, returns exceeding ₹1.25
      lakh in a financial year are taxed at 12.5%.
    </p>
  </div>
</div>

<Riskometer risk = {fundsList?.risk} />



          {
            buyModal && (
             <div
  onClick={closeModal}
  className="
   fixed inset-0 z-50 
flex items-start lg:items-center justify-center
bg-black/50
pt-5 p-4
  "
>
  <div
    onClick={(e) => e.stopPropagation()}
    className="
      w-full max-w-2xl h-[86vh] lg:h-[90vh]
      bg-white
      dark:bg-[var(--card-bg)]
      backdrop-blur-lg
      rounded-2xl
      shadow-2xl
      overflow-y-auto
      p-6
      relative
      dark:border border-[var(--border-color)]
    "
  >
    <button
      onClick={closeModal}
      className="
        absolute top-5 right-6
        text-3xl
        text-[var(--text-secondary)]
        hover:text-[var(--text-primary)]
        transition
        cursor-pointer
      "
      aria-label="Close modal"
    >
      ×
    </button>

              <MutualFundInvestPage fundsList={fundsList} setBuyModal={setBuyModal}  />
  </div>
</div>

            )
          }

          {sellModal && (
            <div
              onClick={closeModal}
              className="fixed inset-0 z-50 flex items-start lg:items-center justify-center bg-black/50 pt-5 p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white dark:bg-[var(--card-bg)] rounded-2xl shadow-2xl p-6 relative dark:border border-[var(--border-color)]"
              >
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-5 text-3xl text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  aria-label="Close modal"
                >
                  ×
                </button>
                <h2 className="text-xl font-semibold pr-8">Redeem</h2>
                <p className="text-sm text-slate-500 mt-1 mb-4">{fundsList?.name}</p>
                {thisHolding ? (
                  <RedeemForm
                    holding={thisHolding}
                    locked
                    onCancel={closeModal}
                    onSuccess={() => {
                      closeModal();
                      navigate("/user/order/mutual-funds");
                    }}
                  />
                ) : (
                  <div className="text-sm text-slate-500 space-y-4">
                    <p>You don’t hold this fund yet, so there’s nothing to redeem.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSellModal(false);
                        setBuyModal(true);
                      }}
                      className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold"
                    >
                      Invest Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}


    </div>
  );
};

export default FundDetails;
