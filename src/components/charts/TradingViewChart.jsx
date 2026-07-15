import { useEffect, useRef } from "react";
import { normalizeTvSymbol, tradingViewChartUrl } from "../../utils/tradingView";

/** Real TradingView Advanced Chart — same as tradingview.com/chart/?symbol=NSE%3ATCS */
const TradingViewChart = ({ symbol, height = 400 }) => {
  const tvSymbol = normalizeTvSymbol(symbol);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!tvSymbol || !containerRef.current) return;

    const el = containerRef.current;
    el.innerHTML = "";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.height = `${height}px`;
    widget.style.width = "100%";
    el.appendChild(widget);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.textContent = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: "D",
      timezone: "Asia/Kolkata",
      theme: "light",
      style: "1",
      locale: "en",
      allow_symbol_change: true,
      calendar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      support_host: "https://www.tradingview.com",
    });
    el.appendChild(script);

    return () => {
      el.innerHTML = "";
    };
  }, [tvSymbol, height]);

  if (!tvSymbol) {
    return (
      <div
        className="flex items-center justify-center text-sm text-red-500"
        style={{ height }}
      >
        Chart unavailable for this symbol.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-semibold text-slate-700 dark:text-[var(--text-primary)]">
          {tvSymbol}
        </span>
        <a
          href={tradingViewChartUrl(tvSymbol)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Open on TradingView ↗
        </a>
      </div>
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ height, width: "100%" }}
      />
    </div>
  );
};

export default TradingViewChart;
