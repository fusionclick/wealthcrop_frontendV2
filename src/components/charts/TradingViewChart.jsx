import { normalizeTvSymbol, tradingViewChartUrl } from "../../utils/tradingView";

/** TradingView chart via widgetembed iframe — script embed often ignores symbol and defaults to AAPL */
const TradingViewChart = ({ symbol, height = 400 }) => {
  const tvSymbol = normalizeTvSymbol(symbol);

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

  const src =
    `https://s.tradingview.com/widgetembed/?` +
    new URLSearchParams({
      symbol: tvSymbol,
      interval: "D",
      hidesidetoolbar: "0",
      symboledit: "1",
      saveimage: "0",
      toolbarbg: "f1f3f6",
      theme: "light",
      style: "1",
      timezone: "Asia/Kolkata",
      withdateranges: "1",
      locale: "en",
    }).toString();

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
      <iframe
        key={tvSymbol}
        src={src}
        title={`${tvSymbol} chart`}
        style={{ width: "100%", height, border: 0 }}
        allowFullScreen
      />
    </div>
  );
};

export default TradingViewChart;
