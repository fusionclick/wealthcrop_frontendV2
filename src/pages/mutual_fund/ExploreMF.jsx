import { FaLandmark, FaCoins, FaChartLine, FaChartPie } from "react-icons/fa";
import { MdChevronRight } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { postApi } from "../../api/api";
import { useMemo, useState } from "react";
import FundListSkeleton from "../../components/ui/skeleton/main/FundListSkeleton";
import { nodeUrl, fundPath } from "../../utils/nodeApi";
import AmcMark from "../../components/AmcMark";
import { navLabel, navDate, useNavMap } from "../../utils/navSocket";
import FundBadges from "../../components/FundBadges";
import { toastInfo } from "../../utils/notifyCustom";
import { titleCase, fmtPct } from "../../utils/schemeName";

const PAGE_SIZE = 20;
const collections = [
  { name: "Gold Funds", slug: "gold_funds", icon: <FaCoins size={22} className="text-amber-500" /> },
  { name: "Large Cap", slug: "large_cap", icon: <FaChartPie size={22} className="text-indigo-500" /> },
  { name: "Mid Cap", slug: "mid_cap", icon: <FaChartLine size={22} className="text-cyan-500" /> },
  { name: "Small Cap", slug: "small_cap", icon: <FaChartPie size={22} className="text-pink-500" /> },
  { name: "High Return", slug: "high_return", icon: <FaChartLine size={22} className="text-emerald-500" /> },
  { name: "5 Star Funds", slug: "5_star_funds", icon: <FaLandmark size={22} className="text-sky-500" /> },
  { name: "Kotak Funds", slug: "kotak_funds", icon: <FaLandmark size={22} className="text-red-500" /> },
];

// Server-side filters — BSE ke apne per-scheme flags. Yahan filter karna is liye zaroori
// hai ke page sirf 20 rows ka hai; client par chhaanne se poore catalogue ka "Direct only"
// kabhi 20 se zyada nahi nikalta.
// "Regular (business)" and "Direct (normal)" said nothing true: both are retail plans, and
// the only difference is the distributor commission built into the expense ratio. Name them
// the way SEBI, the AMCs and the scheme names themselves do.
const FILTERS = [
  {
    key: "plan",
    label: "Plan",
    options: [["", "All plans"], ["regular", "Regular plan"], ["direct", "Direct plan"]],
  },
  { key: "sip", label: "SIP", options: [["", "SIP: Any"], ["yes", "SIP: Yes"], ["no", "SIP: No"]] },
  {
    key: "mode",
    label: "Held as",
    options: [["physical", "Physical"], ["demat", "Demat"], ["", "Demat & physical"]],
  },
  // SEBI's six riskometer levels. The backend only ever labels a scheme with one of these
  // or leaves it null, so an unknown-risk fund is never swept into a level it was not given.
  {
    key: "risk",
    label: "Risk",
    options: [
      ["", "Risk: Any"],
      ["Low", "Low"],
      ["Low to Moderate", "Low to Moderate"],
      ["Moderate", "Moderate"],
      ["Moderately High", "Moderately High"],
      ["High", "High"],
      ["Very High", "Very High"],
    ],
  },
  // Transaction availability, straight off BSE's per-scheme rows. The last two are the
  // scheme's income-distribution option rather than a lumpsum[]/systematic[] rulebook, but
  // they are a transaction attribute the investor picks on (ticket 2) and the backend
  // filters them from the same index row.
  {
    key: "txn",
    label: "Supports",
    options: [
      ["", "Supports: Any"],
      ["sip", "SIP"],
      ["swp", "SWP"],
      ["stp", "STP"],
      ["lumpsum", "Lumpsum"],
      ["sip,swp", "SIP + SWP"],
      ["idcw_payout", "IDCW Payout"],
      ["idcw_reinvest", "Dividend Reinvestment"],
    ],
  },
  {
    key: "minAge",
    label: "Fund age",
    options: [["", "Age: Any"], ["1", "1+ years"], ["3", "3+ years"], ["5", "5+ years"], ["10", "10+ years"]],
  },
  // Ticket 11 — fund size. ₹ crore, matching the backend's minAum band. A fund BSE never
  // published a size for drops out of an explicit band rather than counting as zero.
  {
    key: "minAum",
    label: "Fund size",
    options: [
      ["", "AUM: Any"],
      ["500", "₹500 Cr+"],
      ["1000", "₹1,000 Cr+"],
      ["5000", "₹5,000 Cr+"],
      ["10000", "₹10,000 Cr+"],
    ],
  },
];

// Ranking. These run on the SERVER across the whole filtered catalogue — the old select
// sorted the 20 rows already on screen and had to admit it in its label ("sorted on this
// page"), which meant "NAV: high to low" never actually found the highest NAV.
const SORTS = [
  ["", "Sort: BSE order"],
  ["returns_1y:desc", "1Y return: high to low"],
  ["returns_3y:desc", "3Y return: high to low"],
  ["returns_5y:desc", "5Y return: high to low"],
  ["rating:desc", "Rating: high to low"],
  ["aum:desc", "Fund size: high to low"],
  ["age:desc", "Oldest first"],
  ["expense:asc", "Expense ratio: low to high"],
  ["min_sip:asc", "Minimum SIP: low to high"],
  ["nav:desc", "NAV: high to low"],
  ["name:asc", "Name A-Z"],
];

// Physical is the default: units sit with the RTA and no demat account is needed, which is
// what most investors here have. 49 of the 50 physical schemes also allow demat, so this
// hides almost nothing — demat-only funds are one dropdown click away.
const DEFAULT_FILTERS = { plan: "", sip: "", mode: "physical", risk: "", txn: "", minAge: "", minAum: "" };

// How many funds can sit in the comparison tray at once. The compare endpoint loads a full
// NAV history per fund, and more than a handful of overlapping lines is unreadable anyway.
const MAX_COMPARE = 4;

/** Section heading + optional "View all" — Kotak har row par yehi rakhta hai. */
const SectionHead = ({ title, accent, subtitle, to }) => (
  <div className="flex items-end justify-between mb-3">
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-[var(--text-primary)]">
        {title} {accent && <span className="text-emerald-600 dark:text-emerald-400">{accent}</span>}
      </h2>
      {subtitle && <p className="text-xs text-slate-500 dark:text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
    </div>
    {to && (
      <Link to={to} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 inline-flex items-center shrink-0">
        View all <MdChevronRight className="text-lg" />
      </Link>
    )}
  </div>
);

// ponytail: native overflow-x-auto + snap — carousel library ya scroll-progress bar nahi.
// Browser ka apna scrollbar/swipe wahi kaam karta hai jo Kotak ka custom bar karta hai.
const Rail = ({ children }) => (
  <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-1 px-1">{children}</div>
);

const ExploreMF = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const navs = useNavMap();
  const url = nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list");

  const [sortField, sortOrder] = sort ? sort.split(":") : ["", ""];

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["FUNDS", query, page, filters, sort],
    queryFn: () =>
      postApi(url, {
        start: page * PAGE_SIZE,
        length: PAGE_SIZE,
        search: query,
        ...filters,
        sort: sortField,
        order: sortOrder,
      }),
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
  });

  const funds = data?.data?.lists || [];
  // ponytail: `total` BSE ke poore master ka count hai (28k+) — us mein wo schemes bhi
  // hain jo backend filter kar deta hai. Paging ke liye theek hai, ginti ke liye jhoot.
  const total = Number(data?.data?.total ?? data?.data?.count ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Sorting now happens server-side over the whole filtered catalogue and comes back
  // already ordered, so this page renders what it was given.
  const shown = funds;

  // Comparison tray. Held here rather than in the URL because the picks are made while
  // paging and filtering, and a page change must not drop them.
  const [compare, setCompare] = useState([]);
  const inCompare = useMemo(
    () => new Set(compare.map((c) => `${c.isin}|${c.code}`)),
    [compare]
  );

  const toggleCompare = (f) => {
    const key = `${f.scheme_isin}|${f.scheme_bse_code}`;
    setCompare((prev) => {
      if (prev.some((c) => `${c.isin}|${c.code}` === key)) {
        return prev.filter((c) => `${c.isin}|${c.code}` !== key);
      }
      if (prev.length >= MAX_COMPARE) {
        toastInfo(`You can compare up to ${MAX_COMPARE} funds at a time.`);
        return prev;
      }
      return [...prev, { isin: f.scheme_isin, code: f.scheme_bse_code, name: f.name }];
    });
  };

  const openCompare = () => {
    const ids = compare.map((c) => `${c.isin || ""}~${c.code || ""}`).join(",");
    navigate(`/mutual_fund/compare?funds=${encodeURIComponent(ids)}`);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setQuery(search.trim());
  };

  const setFilter = (key, value) => {
    setPage(0);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const openFund = (f) => {
    // Both facts matter and a scheme can be both: an `else if` hid the physical-only
    // warning on every SIP-capable physical fund, which is the case where it counts most.
    if (f?.sip_allowed === true) {
      toastInfo(f.minSip ? `SIP available — from ₹${f.minSip}/month` : "SIP available on this fund");
    }
    if (f?.physical_only === true) {
      toastInfo("This scheme is held physically only — it cannot be bought on a demat account.");
    }
    navigate(fundPath(f.scheme_isin, f.scheme_bse_code));
  };

  return (
    <div className="w-full py-6 px-5 md:px-10 lg:px-14">
      <form onSubmit={submitSearch} className="flex gap-2 w-full mb-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search schemes, categories…"
          className="flex-1 border border-slate-200 rounded-full px-5 py-2.5 text-sm bg-white shadow-sm dark:bg-[var(--white-10)] dark:border-[var(--border-color)]"
        />
        <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-medium">
          Search
        </button>
      </form>

      {/* Kotak ki tarah: bayen taraf fund rail, dayen taraf SIP promo */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 mb-8">
        <div className="min-w-0">
          {/* ponytail: "Top performing" nahi — master-scheme-list har row par
              returns null deta hai (mapScheme), to ranking banti hi nahi. Returns
              list par aane lagen to yahi rail sort kar ke naam badal dena. */}
          <SectionHead title="Funds to explore" to="#all-funds" />
          {isLoading ? (
            <div className="h-44 rounded-2xl bg-slate-100 dark:bg-[var(--white-10)] animate-pulse" />
          ) : (
            <Rail>
              {funds.slice(0, 8).map((f) => (
                <button
                  key={`rail-${f.scheme_isin}-${f.scheme_bse_code}`}
                  onClick={() => openFund(f)}
                  className="snap-start shrink-0 w-52 text-left rounded-lg p-4 bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border-color)] hover:border-slate-300 dark:hover:border-slate-600 transition"
                >
                  <AmcMark name={f.name} className="h-9 w-9" />
                  <p className="text-sm font-semibold mt-3 line-clamp-2 min-h-10 text-slate-900 dark:text-[var(--text-primary)]">
                    {titleCase(f.name) || "—"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{f.scheme_amc_name || "Mutual Fund"}</p>
                  <FundBadges fund={f} className="mt-2" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-[var(--text-primary)] mt-3">
                    {navLabel(f, navs)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{navDate(f, navs) || ""}</p>
                </button>
              ))}
            </Rail>
          )}
        </div>

        {/* Neo ke side panels flat hote hain — gradient hata diya, hairline hi separator hai. */}
        <aside className="rounded-lg border border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] p-6 flex flex-col items-center justify-center text-center">
          <div className="text-5xl mb-3">🚀</div>
          <p className="font-semibold text-slate-900 dark:text-[var(--text-primary)]">Don&apos;t know where to start?</p>
          {/* Was a link straight to /mutual_fund/sip-setup, which passes no fund — so the
              setup page sent BSE an empty src_scheme and every SIP registration failed.
              A SIP starts from a fund, so send them to the list. */}
          {/* This card asks exactly the question the robo advisor answers, and /advisor
              had no entry point anywhere a signed-in investor could see. */}
          <Link
            to="/advisor"
            className="mt-4 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
          >
            Ask the Advisor
          </Link>
          <a
            href="#all-funds"
            className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Browse funds to SIP
          </a>
        </aside>
      </div>

      {/* The "Mutual Fund combos" rail was removed on the client's instruction (ticket 9),
          and the /baskets fetch that fed it went with it — it was an authenticated request
          fired on every visit to Explore, including by logged-out visitors. Baskets
          themselves are untouched and still live at /baskets. */}

      <div className="mb-8">
        <SectionHead title="New Fund Offer (NFO)" to="/nfo" />
        <div className="rounded-2xl p-6 bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border-color)] text-sm text-slate-500 dark:text-[var(--text-secondary)] text-center">
          No NFOs are open right now.
        </div>
      </div>

      <div className="mb-10">
        <SectionHead title="Collections to get you started" />
        <Rail>
          {collections.map((item) => (
            <button
              key={item.slug}
              onClick={() => navigate(`/mutual_fund/collections/${item.slug}`)}
              className="snap-start shrink-0 w-24 flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border-color)] shadow-sm flex items-center justify-center group-hover:shadow-md transition">
                {item.icon}
              </div>
              <p className="text-xs font-medium text-center leading-tight text-slate-700 dark:text-[var(--text-secondary)]">{item.name}</p>
            </button>
          ))}
        </Rail>
      </div>

      <div id="all-funds" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">All Mutual Funds</h2>
          {/* `total` is the size of the FILTERED set, counted across the whole catalogue
              before the page is cut — so this number and the page count are both honest. */}
          <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)] mt-1">
            {funds.length ? `${total.toLocaleString("en-IN")} funds match` : "Loading catalogue…"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <select
              key={f.key}
              aria-label={f.label}
              value={filters[f.key]}
              onChange={(e) => setFilter(f.key, e.target.value)}
              // Green means "you narrowed this", so compare against the default rather
              // than against empty — otherwise Held-as is green before anyone touches it.
              className={`border rounded-xl px-3 py-2 text-sm shadow-sm dark:bg-[var(--white-10)] dark:border-[var(--border-color)] ${
                filters[f.key] !== DEFAULT_FILTERS[f.key]
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:text-emerald-300"
                  : "border-slate-200 bg-white"
              }`}
            >
              {f.options.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          ))}
          <select
            value={sort}
            onChange={(e) => {
              setPage(0);
              setSort(e.target.value);
            }}
            className={`border rounded-xl px-3 py-2 text-sm shadow-sm dark:bg-[var(--white-10)] dark:border-[var(--border-color)] ${
              sort ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:text-emerald-300" : "border-slate-200 bg-white"
            }`}
          >
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kotak Neo ka scheme list: card grid nahi, ek hi container me dense rows
          jo hairline se alag hoti hain. Har row — AMC mark, naam + meta, aur
          dayen taraf NAV. Grid me 4 columns par naam do lines me toot te the aur
          NAV har card me alag jagah baithti thi; list me sab ek axis par aata hai. */}
      {isLoading ? (
        FundListSkeleton()
      ) : (
        <div className="rounded-lg border border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] divide-y divide-slate-200 dark:divide-[var(--border-color)] overflow-hidden">
          {/* A checkbox cannot live inside a <button> (invalid HTML, and the click would be
              swallowed by the row), so the row is a flex container with the checkbox beside
              a button that fills the rest of it. */}
          {shown.map((fund) => {
            const key = `${fund.scheme_isin}|${fund.scheme_bse_code}`;
            const picked = inCompare.has(key);
            return (
              <div
                key={key}
                className={`w-full flex items-center gap-3 px-4 transition ${
                  picked ? "bg-emerald-50/60 dark:bg-emerald-500/5" : "hover:bg-slate-50 dark:hover:bg-[var(--white-5)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={picked}
                  onChange={() => toggleCompare(fund)}
                  aria-label={`Add ${titleCase(fund.name)} to comparison`}
                  title="Compare this fund"
                  className="shrink-0 h-4 w-4 accent-emerald-600 cursor-pointer"
                />
                <button
                  onClick={() => openFund(fund)}
                  className="min-w-0 flex-1 text-left flex items-center gap-3 py-3"
                >
                  <AmcMark name={fund.name} className="h-9 w-9 shrink-0" />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug line-clamp-2 text-slate-900 dark:text-[var(--text-primary)]">
                      {titleCase(fund.name) || "—"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                      {fund.subType || fund.category || "Mutual Fund"}
                    </p>
                    <FundBadges fund={fund} className="mt-1.5" />
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-[var(--text-primary)]">
                      {navLabel(fund, navs)}
                    </p>
                    {/* Returns on the card at last: the list rows carried `returns: null` for
                        every scheme until the enrichment pass started filling them. */}
                    {fund.returns?.["3Y"] != null ? (
                      <p className="text-[11px] mt-0.5 text-emerald-600 dark:text-emerald-400">
                        {fmtPct(fund.returns["3Y"], { annualised: true })} · 3Y
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mt-0.5">
                        {fund.minLumpsum ? `Min ₹${fund.minLumpsum}` : navDate(fund, navs) || ""}
                      </p>
                    )}
                  </div>

                  <MdChevronRight className="text-xl shrink-0 text-slate-400 dark:text-[var(--text-secondary)]" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !funds.length && (
        <p className="text-center text-gray-500 py-10">
          {Object.entries(filters).some(([k, v]) => v !== DEFAULT_FILTERS[k])
            ? "No funds on this page match these filters. Clear one, or try the next page."
            : "No funds matched this collection. Try “Demat & physical” under Held as."}
        </p>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            disabled={page === 0 || isFetching}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page + 1} of {pageCount}
          </span>
          <button
            disabled={page + 1 >= pageCount || isFetching}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Comparison tray. Survives paging and filtering, because funds worth comparing are
          rarely on the same page. */}
      {compare.length > 0 && (
        <div className="sticky bottom-4 mt-6 z-20">
          <div className="mx-auto max-w-3xl rounded-2xl border border-emerald-300 dark:border-emerald-500/30 bg-white dark:bg-[var(--card-bg)] shadow-lg p-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-[var(--text-secondary)] px-1">
              Comparing {compare.length}/{MAX_COMPARE}
            </span>
            {compare.map((c) => (
              <button
                key={`${c.isin}|${c.code}`}
                type="button"
                onClick={() => setCompare((prev) => prev.filter((x) => `${x.isin}|${x.code}` !== `${c.isin}|${c.code}`))}
                title="Remove from comparison"
                className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-[var(--white-10)] text-slate-700 dark:text-[var(--text-secondary)] max-w-[220px] truncate"
              >
                {titleCase(c.name)} ✕
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => setCompare([])}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-[var(--border-color)] text-sm"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={compare.length < 2}
                onClick={openCompare}
                title={compare.length < 2 ? "Pick at least two funds" : "Compare these funds"}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium"
              >
                Compare
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreMF;
