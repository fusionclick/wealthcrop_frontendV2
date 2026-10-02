import { FaLandmark, FaCoins, FaChartLine, FaChartPie } from "react-icons/fa";
import { MdChevronRight } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { postApi } from "../../api/api";
import { useMemo, useState } from "react";
import FundListSkeleton from "../../components/ui/skeleton/main/FundListSkeleton";
import { nodeUrl, fundPath, fundSipPath } from "../../utils/nodeApi";
import AmcMark from "../../components/AmcMark";
import { navLabel, navDate, useNavMap } from "../../utils/navSocket";
import FundBadges, { DIRECT_NOT_OFFERED, isDirectPlan } from "../../components/FundBadges";
import AddToBasket from "../../components/AddToBasket";
import { toastInfo } from "../../utils/notifyCustom";
import { titleCase, fmtPct } from "../../utils/schemeName";

const PAGE_SIZE = 20;
// Audit #11 — collections are quick filters on the list below (the server's `category`
// slug), so "High Return" and "5 Star Funds" now mean real data: funds with a 3-year return,
// ranked by it, and funds the rating feed gives five stars. They used to be name searches
// for "FLEXI CAP" and "BLUECHIP".
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
//
// Audit #11 — one labelled group per thing the client ranks on (Category, Risk, Returns, AUM,
// Age, Transaction) instead of one flat row of dropdowns. `facet` options come from the
// catalogue itself (the response's `facets`), not from a list typed in here.
const FILTER_GROUPS = [
  {
    title: "Category",
    filters: [
      { key: "schemeCategory", label: "Category", facet: "category", any: "All categories" },
      { key: "subCategory", label: "Sub-category", facet: "sub", any: "All sub-categories" },
      { key: "plan", label: "Plan", options: [["", "All plans"], ["regular", "Regular plan"], ["direct", "Direct plan"]] },
    ],
  },
  // SEBI's six riskometer levels. The backend only ever labels a scheme with one of these
  // or leaves it null, so an unknown-risk fund is never swept into a level it was not given.
  {
    title: "Risk",
    filters: [
      {
        key: "risk",
        label: "Risk",
        options: [
          ["", "Any risk"],
          ["Low", "Low"],
          ["Low to Moderate", "Low to Moderate"],
          ["Moderate", "Moderate"],
          ["Moderately High", "Moderately High"],
          ["High", "High"],
          ["Very High", "Very High"],
        ],
      },
    ],
  },
  // A fund without a return for the chosen period drops out of the filter rather than
  // counting as 0% (catalogue.query).
  {
    title: "Returns",
    filters: [
      { key: "returnPeriod", label: "Return period", options: [["1Y", "1Y return"], ["3Y", "3Y return"], ["5Y", "5Y return"]] },
      { key: "minReturn", label: "Minimum return (%)", input: true, suffix: "% or more", placeholder: "e.g. 12" },
    ],
  },
  // ₹ crore, matching the backend's minAum band. Any figure can be typed; the datalist only
  // suggests the usual cut-offs. A fund with no published size drops out of an explicit
  // band rather than counting as zero.
  {
    title: "AUM",
    filters: [
      { key: "minAum", label: "Minimum fund size (₹ Cr)", input: true, suffix: "₹ Cr or more", placeholder: "e.g. 500", presets: [500, 1000, 5000, 10000] },
    ],
  },
  {
    title: "Age",
    filters: [
      { key: "minAge", label: "Fund age", options: [["", "Any age"], ["1", "1+ years"], ["3", "3+ years"], ["5", "5+ years"], ["10", "10+ years"]] },
    ],
  },
  // Transaction availability, straight off BSE's per-scheme rows. The income option is its
  // own control now (it used to be two entries inside "Supports"); both reach the server as
  // one AND-combined `txn` list.
  {
    title: "Transaction",
    filters: [
      {
        key: "txn",
        label: "Supports",
        options: [["", "Supports: Any"], ["sip", "SIP"], ["swp", "SWP"], ["stp", "STP"], ["lumpsum", "Lumpsum"], ["sip,swp", "SIP + SWP"]],
      },
      {
        key: "idcw",
        label: "Income option",
        options: [["", "Any option"], ["growth", "Growth"], ["idcw_payout", "IDCW Payout"], ["idcw_reinvest", "Dividend Reinvestment"]],
      },
      { key: "sip", label: "SIP", options: [["", "SIP: Any"], ["yes", "SIP: Yes"], ["no", "SIP: No"]] },
    ],
  },
];

// Ranking. These run on the SERVER across the whole filtered catalogue — the old select
// sorted the 20 rows already on screen and had to admit it in its label ("sorted on this
// page"), which meant "NAV: high to low" never actually found the highest NAV.
const SORTS = [
  ["", "Sort: Default"],
  ["returns_1y:desc", "1Y return: high to low"],
  ["returns_3y:desc", "3Y return: high to low"],
  ["returns_5y:desc", "5Y return: high to low"],
  ["rating:desc", "Rating: high to low"],
  ["aum:desc", "Fund size: high to low"],
  ["aum:asc", "Fund size: low to high"],
  ["age:desc", "Oldest first"],
  ["expense:asc", "Expense ratio: low to high"],
  ["min_sip:asc", "Minimum SIP: low to high"],
  ["nav:desc", "NAV: high to low"],
  ["nav:asc", "NAV: low to high"],
  ["name:asc", "Name A-Z"],
];

// Physical stays the platform's default — units sit with the RTA and no demat account is
// needed, which is what most investors here have — but silently now (Audit #11): no
// Physical/Demat control or wording reaches the investor.
// Compliance #31 — the list opens on Regular plans, the only ones a distributor may offer.
// The Plan control shows it and Direct plans stay one choice away, labelled as not offered.
const DEFAULT_FILTERS = {
  plan: "regular",
  sip: "",
  mode: "physical",
  risk: "",
  txn: "",
  idcw: "",
  minAge: "",
  minAum: "",
  minReturn: "",
  returnPeriod: "1Y",
  schemeCategory: "",
  subCategory: "",
  category: "",
};

// How many funds can sit in the comparison tray at once. The compare endpoint loads a full
// NAV history per fund, and more than a handful of overlapping lines is unreadable anyway.
const MAX_COMPARE = 4;

/** "Min ₹500 (platform)" — Audit #2: a minimum only the platform set says so. */
const minLabel = (amount, source) => `Min ₹${amount}${source === "platform" ? " (platform)" : ""}`;

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
        // The Supports and Income-option controls are one AND-combined list on the server.
        txn: [filters.txn, filters.idcw].filter(Boolean).join(","),
        sort: sortField,
        order: sortOrder,
      }),
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
  });

  const funds = data?.data?.lists || [];
  // `total` is the size of the FILTERED set, counted across the whole catalogue before the
  // page is cut — so the count and the page count are both honest.
  const total = Number(data?.data?.total ?? data?.data?.count ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const facets = data?.data?.facets || [];

  // Audit #11 — picking a category narrows the sub-categories to the ones under it; with no
  // category picked every sub-category is on offer.
  const subOptions = useMemo(() => {
    const picked = facets.find((f) => f.category === filters.schemeCategory);
    if (picked) return picked.subCategories;
    return [...new Set(facets.flatMap((f) => f.subCategories))].sort((a, b) => a.localeCompare(b));
  }, [facets, filters.schemeCategory]);

  const optionsFor = (f) => {
    if (f.facet === "category") return [["", f.any], ...facets.map((x) => [x.category, x.category])];
    if (f.facet === "sub") return [["", f.any], ...subOptions.map((s) => [s, s])];
    return f.options;
  };

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
    // Audit #1 — the ISIN alone in the address bar ("~code" only for a fund without one). The
    // exact codes ride in router state: an IDCW payout and reinvestment option share an ISIN.
    const ids = compare.map((c) => c.isin || `~${c.code || ""}`).join(",");
    navigate(`/mutual_fund/compare?funds=${encodeURIComponent(ids)}`, {
      state: { codes: Object.fromEntries(compare.filter((c) => c.isin).map((c) => [c.isin, c.code])) },
    });
  };

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setQuery(search.trim());
  };

  const setFilter = (key, value) => {
    setPage(0);
    setFilters((f) => {
      const next = { ...f, [key]: value };
      // A sub-category that does not exist under the new category would match nothing.
      if (key === "schemeCategory") {
        const subs = facets.find((x) => x.category === value)?.subCategories;
        if (value && !subs?.includes(f.subCategory)) next.subCategory = "";
      }
      return next;
    });
  };

  const pickCollection = (slug) => {
    setFilter("category", filters.category === slug ? "" : slug);
    document.getElementById("all-funds")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const narrowed = Boolean(query || sort) || Object.entries(filters).some(([k, v]) => v !== DEFAULT_FILTERS[k]);
  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setSort("");
    setSearch("");
    setQuery("");
    setPage(0);
  };

  const openFund = (f) => {
    if (f?.sip_allowed === true) {
      toastInfo(f.minSip ? `SIP available — from ₹${f.minSip}/month` : "SIP available on this fund");
    }
    // Audit #1 — ISIN in the address bar; the exact BSE code rides in router state.
    navigate(fundPath(f.scheme_isin, f.scheme_bse_code), { state: { code: f.scheme_bse_code } });
  };

  // Audit #11 — the same targets the fund page's own buttons use: its Invest Now modal (opened
  // on arrival, with the exact code in router state and only the ISIN in the address bar), and
  // the SIP setup page handed the fund so it opens filled in.
  const invest = (f) =>
    navigate(fundPath(f.scheme_isin, f.scheme_bse_code), { state: { code: f.scheme_bse_code, buy: true } });

  const startSip = (f) =>
    navigate(fundSipPath(f.scheme_isin, f.scheme_bse_code), {
      state: {
        fund: {
          name: f.name,
          scheme_bse_code: f.scheme_bse_code,
          scheme_isin: f.scheme_isin,
          minSip: f.minSip,
          nav: f.nav,
        },
      },
    });

  const filterClass = (f) =>
    `border rounded-xl px-3 py-2 text-sm shadow-sm dark:bg-[var(--white-10)] dark:border-[var(--border-color)] ${
      // Green means "you narrowed this", so compare against the default rather than against
      // empty — otherwise the return period would be green before anyone touches it.
      filters[f.key] !== DEFAULT_FILTERS[f.key]
        ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:text-emerald-300"
        : "border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)]"
    }`;

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
                  <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mt-1 line-clamp-1">{f.scheme_amc_name || "Mutual Fund"}</p>
                  {f.scheme_isin && (
                    <p className="text-[10px] font-mono text-slate-400 dark:text-[var(--text-secondary)] mt-0.5">{f.scheme_isin}</p>
                  )}
                  <FundBadges fund={f} className="mt-2" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-[var(--text-primary)] mt-3">
                    {navLabel(f, navs)}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mt-1">{navDate(f, navs) || ""}</p>
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
            Try Asset Allocation
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
          {collections.map((item) => {
            const on = filters.category === item.slug;
            return (
              <button
                key={item.slug}
                onClick={() => pickCollection(item.slug)}
                aria-pressed={on}
                className="snap-start shrink-0 w-24 flex flex-col items-center gap-2 group"
              >
                <div
                  className={`w-16 h-16 rounded-full bg-white dark:bg-[var(--card-bg)] border shadow-sm flex items-center justify-center group-hover:shadow-md transition ${
                    on ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-slate-200 dark:border-[var(--border-color)]"
                  }`}
                >
                  {item.icon}
                </div>
                <p className="text-xs font-medium text-center leading-tight text-slate-700 dark:text-[var(--text-secondary)]">{item.name}</p>
              </button>
            );
          })}
        </Rail>
      </div>

      <div id="all-funds" className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4 scroll-mt-24">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">All Mutual Funds</h2>
          {/* Audit #11 — this used to say "Loading catalogue…" whenever nothing matched. */}
          <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)] mt-1">
            {isLoading ? "Loading catalogue…" : `${total.toLocaleString("en-IN")} ${total === 1 ? "scheme" : "schemes"} found`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Sort"
            value={sort}
            onChange={(e) => {
              setPage(0);
              setSort(e.target.value);
            }}
            className={`border rounded-xl px-3 py-2 text-sm shadow-sm dark:bg-[var(--white-10)] dark:border-[var(--border-color)] ${
              sort ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:text-emerald-300" : "border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)]"
            }`}
          >
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={clearAll}
            disabled={!narrowed}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[var(--border-color)] text-sm font-medium text-slate-700 dark:text-[var(--text-primary)] disabled:opacity-40"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 mb-5">
        {FILTER_GROUPS.map((group) => (
          <fieldset
            key={group.title}
            className="rounded-lg border border-slate-200 dark:border-[var(--border-color)] bg-white dark:bg-[var(--card-bg)] px-3 pb-3 pt-1"
          >
            <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-[var(--text-secondary)]">
              {group.title}
            </legend>
            <div className="flex flex-wrap items-center gap-2">
              {group.filters.map((f) =>
                f.input ? (
                  <label key={f.key} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[var(--text-secondary)]">
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      aria-label={f.label}
                      list={f.presets ? `${f.key}-presets` : undefined}
                      placeholder={f.placeholder}
                      value={filters[f.key]}
                      onChange={(e) => setFilter(f.key, e.target.value)}
                      className={`w-28 ${filterClass(f)}`}
                    />
                    {f.suffix}
                    {f.presets && (
                      <datalist id={`${f.key}-presets`}>
                        {f.presets.map((v) => (
                          <option key={v} value={v} />
                        ))}
                      </datalist>
                    )}
                  </label>
                ) : (
                  <select
                    key={f.key}
                    aria-label={f.label}
                    value={filters[f.key]}
                    onChange={(e) => setFilter(f.key, e.target.value)}
                    className={filterClass(f)}
                  >
                    {optionsFor(f).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                )
              )}
            </div>
          </fieldset>
        ))}
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
              a button that fills the rest of it — and the actions beside that. */}
          {shown.map((fund) => {
            const key = `${fund.scheme_isin}|${fund.scheme_bse_code}`;
            const picked = inCompare.has(key);
            return (
              <div
                key={key}
                className={`w-full flex flex-wrap sm:flex-nowrap items-center gap-x-3 px-4 transition ${
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
                    {/* Audit #1 — the ISIN, small, under the name: what the investor sees on their CAS. */}
                    <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                      {fund.scheme_isin && <span className="font-mono">{fund.scheme_isin} · </span>}
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
                        {fund.minLumpsum ? minLabel(fund.minLumpsum, fund.minSource?.lumpsum) : navDate(fund, navs) || ""}
                      </p>
                    )}
                  </div>

                  <MdChevronRight className="text-xl shrink-0 text-slate-400 dark:text-[var(--text-secondary)]" />
                </button>

                {/* Audit #11 — Invest Now / Start SIP / Add to basket on the card itself. Start
                    SIP only where BSE says the scheme takes one, as on the fund page.
                    Compliance #31 — a Direct plan gets the reason instead of buy actions. */}
                {isDirectPlan(fund) ? (
                  <p className="w-full sm:w-36 pb-3 sm:py-3 pl-7 sm:pl-0 shrink-0 text-[11px] text-amber-700 dark:text-amber-400">
                    {DIRECT_NOT_OFFERED}
                  </p>
                ) : (
                <div className="w-full sm:w-auto flex sm:flex-col gap-1.5 pb-3 sm:py-3 pl-7 sm:pl-0 shrink-0">
                  {fund.txn?.lumpsum !== false && (
                    <button
                      type="button"
                      onClick={() => invest(fund)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                    >
                      Invest Now
                    </button>
                  )}
                  {fund.sip_allowed === true && (
                    <button
                      type="button"
                      onClick={() => startSip(fund)}
                      className="px-3 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                    >
                      Start SIP
                    </button>
                  )}
                  <AddToBasket fund={fund} />
                </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !funds.length && (
        <div className="text-center text-gray-500 dark:text-[var(--text-secondary)] py-10">
          <p>{narrowed ? "No funds match these filters." : "No funds to show right now."}</p>
          {narrowed && (
            <button type="button" onClick={clearAll} className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline">
              Clear filters
            </button>
          )}
        </div>
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
