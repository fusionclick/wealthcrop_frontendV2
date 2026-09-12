import { FaLandmark, FaCoins, FaChartLine, FaChartPie } from "react-icons/fa";
import { MdChevronRight, MdVerified } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getApiWithToken, postApi } from "../../api/api";
import { useMemo, useState } from "react";
import FundListSkeleton from "../../components/ui/skeleton/main/FundListSkeleton";
import { nodeUrl, fundPath } from "../../utils/nodeApi";
import AmcMark from "../../components/AmcMark";
import { navLabel, navDate, useNavMap } from "../../utils/navSocket";
import FundBadges from "../../components/FundBadges";
import { toastInfo } from "../../utils/notifyCustom";

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
];

// Physical is the default: units sit with the RTA and no demat account is needed, which is
// what most investors here have. 49 of the 50 physical schemes also allow demat, so this
// hides almost nothing — demat-only funds are one dropdown click away.
const DEFAULT_FILTERS = { plan: "", sip: "", mode: "physical" };

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

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["FUNDS", query, page, filters],
    queryFn: () =>
      postApi(url, {
        start: page * PAGE_SIZE,
        length: PAGE_SIZE,
        search: query,
        ...filters,
      }),
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,
  });

  // Kotak ke "combos" wahi cheez hain jo yahan pehle se baskets hain — naya endpoint nahi.
  const { data: baskets } = useQuery({
    queryKey: ["MF_COMBOS"],
    queryFn: () => getApiWithToken(`${import.meta.env.VITE_URL}/baskets`),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const combos = (baskets?.data?.data ?? []).slice(0, 3);

  const funds = data?.data?.lists || [];
  // ponytail: `total` BSE ke poore master ka count hai (28k+) — us mein wo schemes bhi
  // hain jo backend filter kar deta hai. Paging ke liye theek hai, ginti ke liye jhoot.
  const total = Number(data?.data?.total ?? data?.data?.count ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ponytail: sort sirf isi page par lagta hai — paging BSE ke apne master par chalti
  // hai aur poora catalogue (28k) load karna 1GB box ko mar deta hai. Isi liye label
  // par "this page" likha hai. Server-side sort chahiye to BSE ka sort param dhoondna
  // parega, master ko yahan kheenchna nahi.
  const shown = useMemo(() => {
    const nav = (f) => Number(f?.nav) || 0;
    const rows = [...funds];
    if (sort === "name") return rows.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    if (sort === "nav_desc") return rows.sort((a, b) => nav(b) - nav(a));
    if (sort === "nav_asc") return rows.sort((a, b) => nav(a) - nav(b));
    return rows;
  }, [funds, sort]);

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
                    {f.name || "—"}
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
          <a
            href="#all-funds"
            className="mt-4 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
          >
            Browse funds to SIP
          </a>
        </aside>
      </div>

      {/* Combos — user ke apne baskets. Ek bhi na ho to poora section chhupa do. */}
      {combos.length > 0 && (
        <div className="mb-8">
          <SectionHead title="Mutual Fund" accent="combos" subtitle="Invest in multiple top schemes, at once" to="/baskets" />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {combos.map((b) => (
              <Link
                key={b.id}
                to={`/basket/${b.id}`}
                className="rounded-2xl overflow-hidden bg-white dark:bg-[var(--card-bg)] border border-slate-200 dark:border-[var(--border-color)] shadow-sm hover:shadow-md transition"
              >
                <div className="p-4 flex items-start gap-3">
                  <AmcMark name={b.name} className="h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold line-clamp-1 text-slate-900 dark:text-[var(--text-primary)]">{b.name}</p>
                    {b.minSip != null && <p className="text-xs text-slate-500 mt-1">Min SIP ₹{b.minSip}</p>}
                  </div>
                  {b.funds?.length > 0 && (
                    <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-[var(--white-10)] text-slate-600 dark:text-[var(--text-secondary)]">
                      {b.funds.length} FUNDS
                    </span>
                  )}
                </div>
                <div className="px-4 py-2 bg-slate-50 dark:bg-[var(--white-10)] text-xs text-slate-600 dark:text-[var(--text-secondary)] flex items-center justify-center gap-1.5">
                  <MdVerified className="text-emerald-500" /> {b.category || "Curated"} basket
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
          <p className="text-sm text-slate-500 dark:text-[var(--text-secondary)] mt-1">
            {funds.length
              ? `${funds.length} funds you can buy${sort ? " · sorted on this page" : ""}`
              : "Loading catalogue…"}
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
            onChange={(e) => setSort(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white shadow-sm dark:bg-[var(--white-10)] dark:border-[var(--border-color)]"
          >
            <option value="">Sort: BSE order</option>
            <option value="name">Name A–Z</option>
            <option value="nav_desc">NAV: high to low</option>
            <option value="nav_asc">NAV: low to high</option>
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
          {shown.map((fund) => (
            <button
              key={`${fund.scheme_isin}-${fund.scheme_bse_code}`}
              onClick={() => openFund(fund)}
              className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-[var(--white-5)] transition"
            >
              <AmcMark name={fund.name} className="h-9 w-9 shrink-0" />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug line-clamp-2 text-slate-900 dark:text-[var(--text-primary)]">
                  {fund.name || "—"}
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
                <p className="text-[11px] text-slate-500 dark:text-[var(--text-secondary)] mt-0.5">
                  {fund.minLumpsum ? `Min ₹${fund.minLumpsum}` : navDate(fund, navs) || ""}
                </p>
              </div>

              <MdChevronRight className="text-xl shrink-0 text-slate-400 dark:text-[var(--text-secondary)]" />
            </button>
          ))}
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
    </div>
  );
};

export default ExploreMF;
