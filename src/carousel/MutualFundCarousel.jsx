import { useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MdOutlineArrowDropDown, MdOutlineArrowDropUp } from "react-icons/md";
import { postApi } from "../api/api";
import { fetchFno, fetchStockList } from "../api/marketApi";
import { nodeUrl } from "../utils/nodeApi";

function tickerMode(pathname = "") {
  const p = pathname.toLowerCase();
  if (p.includes("mutual_fund") || p.includes("mutual-fund")) return "funds";
  if (p.includes("future_and_options") || p.includes("future_option") || p.includes("future")) return "fno";
  return "stocks";
}

function MutualFundCarousel() {
  const { pathname } = useLocation();
  const mode = tickerMode(pathname);

  const { data: stockData } = useQuery({
    queryKey: ["ticker-stocks"],
    // ponytail: quick=true lastPrice 0 deta hai — ticker 0.00 dikhata tha
    queryFn: () => fetchStockList("NIFTY 50", 25),
    enabled: mode === "stocks",
    staleTime: 60_000,
  });

  const { data: fundData } = useQuery({
    queryKey: ["ticker-funds"],
    queryFn: () => postApi(nodeUrl(import.meta.env.VITE_GET_ALL_FUNDS || "/master-scheme-list"), { start: 0, length: 25 }),
    enabled: mode === "funds",
    staleTime: 120_000,
  });

  const { data: fnoData } = useQuery({
    queryKey: ["ticker-fno"],
    queryFn: () => fetchFno("top-traded", "equity"),
    enabled: mode === "fno",
    staleTime: 60_000,
  });

  const items = useMemo(() => {
    if (mode === "stocks") {
      const rows = stockData?.data ?? stockData ?? [];
      return (Array.isArray(rows) ? rows : []).slice(0, 25).map((s) => ({
        key: s.symbol,
        label: s.symbol || s.companyName,
        value: Number(s.lastPrice ?? s.ltp ?? 0).toFixed(2),
        change: Number(s.pChange ?? s.percentChange ?? 0),
        href: s.symbol ? `/stocks/${encodeURIComponent(s.symbol)}` : null,
      }));
    }
    if (mode === "funds") {
      const rows = fundData?.data?.lists ?? [];
      return rows.slice(0, 25).map((f, i) => ({
        key: f.scheme_isin || f.scheme_bse_code || i,
        label: f.name,
        value: Number(f.nav || 0).toFixed(2),
        change: Number(f.returns?.["1Y"] ?? 0),
        href: f.scheme_isin && f.scheme_bse_code
          ? `/mutual_fund/${f.scheme_isin}/${f.scheme_bse_code}`
          : null,
      }));
    }
    const rows = fnoData?.data ?? fnoData ?? [];
    return (Array.isArray(rows) ? rows : []).slice(0, 25).map((r, i) => ({
      key: r.symbol || r.name || i,
      label: r.name || r.symbol,
      value: Number(r.lastPrice ?? r.ltp ?? 0).toFixed(2),
      change: Number(r.pChange ?? r.percentChange ?? 0),
      href: null,
    }));
  }, [mode, stockData, fundData, fnoData]);

  if (!items.length) return null;

  const strip = [...items, ...items];

  return (
    <div className="w-full bg-white dark:bg-gray-900 overflow-hidden border-b border-gray-100 dark:border-white/10" style={{ height: 40 }}>
      <div className="flex whitespace-nowrap items-center h-full animate-marquee w-max">
        {strip.map((item, idx) => {
          const up = item.change >= 0;
          const color = up ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
          const Arrow = up ? MdOutlineArrowDropUp : MdOutlineArrowDropDown;
          const inner = (
            <>
              <span className="font-medium text-blue-950 dark:text-white">{item.label}</span>
              <span className="mx-2 text-sm text-gray-700 dark:text-gray-400">{item.value}</span>
              <span className={`${color} text-sm inline-flex items-center`}>
                <Arrow className="text-lg" />
                {item.change.toFixed(2)}%
              </span>
            </>
          );
          return item.href ? (
            <Link key={`${item.key}-${idx}`} to={item.href} className="flex items-center px-4 hover:bg-gray-100 dark:hover:bg-white/10">
              {inner}
            </Link>
          ) : (
            <div key={`${item.key}-${idx}`} className="flex items-center px-4">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MutualFundCarousel;
