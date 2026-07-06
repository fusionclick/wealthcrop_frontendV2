import { useEffect, useRef, useState } from "react";

const TV_SCRIPT_SRC = "https://s3.tradingview.com/tv.js";

let tvScriptPromise;
function loadTradingViewScript() {
  if (window.TradingView) return Promise.resolve();
  if (!tvScriptPromise) {
    tvScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = TV_SCRIPT_SRC;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
  return tvScriptPromise;
}

const TradingViewChart = ({ symbol, height = 400 }) => {
  const container = useRef(null);
  const containerId = useRef(
    `tv_chart_${Math.random().toString(36).slice(2)}`
  );
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    if (!symbol) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    loadTradingViewScript()
      .then(() => {
        if (cancelled || !container.current) return;
        new window.TradingView.widget({
          container_id: containerId.current,
          autosize: true,
          symbol,
          interval: "5",
          timezone: "Asia/Kolkata",
          theme: "light",
          style: "1",
          locale: "in",
          enable_publishing: false,
          allow_symbol_change: true,
        });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return (
    <div className="relative w-full" style={{ height }}>
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 dark:text-[var(--text-secondary)]">
          Loading chart…
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-red-500">
          Chart unavailable for this symbol.
        </div>
      )}
      <div
        id={containerId.current}
        ref={container}
        className="h-full w-full"
        style={{ visibility: status === "ready" ? "visible" : "hidden" }}
      />
    </div>
  );
};

export default TradingViewChart;
