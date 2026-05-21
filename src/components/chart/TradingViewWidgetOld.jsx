//  TradingViewWidget.jsx
import React, { useEffect, useRef, memo } from "react";

function TradingViewWidget({
  symbol = "NSE:TATAMOTORS",
  height = 600,
  width = "100%",
  theme = "light",
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/tv.js";

    script.onload = () => {
      new window.TradingView.widget({
        autosize: true,
        symbol: symbol,
        interval: "D",
        timezone: "Asia/Kolkata",
        theme: theme,
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        withdateranges: true,   // ⭐ SHOW DATE RANGES
        allow_symbol_change: true,
        hide_side_toolbar: false,
        details: true,
        studies: ["MACD@tv-basicstudies"], // ⭐ WORKS HERE
        container_id: "tv-chart-container",
      });
    };

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [symbol, theme]);

  return (
    <div
      id="tv-chart-container"
      ref={containerRef}
      style={{ width: width, height: height }}
    />
  );
}

export default memo(TradingViewWidget);
