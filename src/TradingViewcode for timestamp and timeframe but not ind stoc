// TradingViewWidget.jsx
import React, { useEffect, useRef, memo } from "react";

/**
 * Usage:
 * <TradingViewWidget
 *    symbol="NSE:TATAMOTORS"
 *    height={600}
 *    width="100%"            // or a number (px)
 *    autosize={true}
 *    theme="light"          // or "dark"
 *    showIndicators={true}
 * />
 *
 * Important: For Indian stocks pass exchange prefix: "NSE:TATAMOTORS" or "BSE:500570"
 */

function TradingViewWidget({
  symbol = "NSE:TATAMOTORS",
  height = 500,
  width = "100%",
  autosize = true,
  theme = "light",
  showIndicators = false,
  containerId = "tv-widget",
}) {
  const containerRef = useRef(null);
  const widgetReadyRef = useRef(false);
  const scriptRef = useRef(null);

  // Helper: ensure symbol has exchange prefix — if user passes plain symbol try to prefix with NSE
  const normalizeSymbol = (s) => {
    if (!s) return s;
    if (s.includes(":")) return s;
    // common default for Indian stocks. If your app uses different exchanges, set accordingly.
    return `NSE:${s}`;
  };

  useEffect(() => {
    const normalizedSymbol = normalizeSymbol(symbol);

    if (!containerRef.current) return;

    // set explicit container size (games the widget to get correct initial sizing).
    // If autosize=true we still set the container CSS size so the widget can measure it.
    containerRef.current.style.width =
      typeof width === "number" ? `${width}px` : width;
    containerRef.current.style.height = `${height}px`;

    // Clear any previous widget (important on rerenders/prop changes)
    containerRef.current.innerHTML = "";

    // Load tv.js once and instantiate widget
    // If tv.js already loaded, instantiate immediately; else load and instantiate in onload.
    const createWidget = () => {
      try {
        // Some environments set window.TradingView after tv.js loaded
        if (!window.TradingView || !window.TradingView.widget) {
          console.warn("TradingView library unavailable");
          return;
        }

        // Build config (use many options so timeframes/date ranges/toolbar appear)
        const config = {
          autosize: !!autosize,
          symbol: normalizedSymbol,
          interval: "D",
          timezone: "Asia/Kolkata",
          theme: theme === "dark" ? "dark" : "light",
          style: "1",
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: true,
          hide_side_toolbar: false,
          details: true,
          withdateranges: true, // show date ranges below
          study_gas_limit: 10,
        };

        // studies / indicators – TradingView expects an array of strings for studies
        if (showIndicators) {
          // Example study keys; change to what you need (MACD, RSI, EMA etc)
          config.studies = ["MACD@tv-basicstudies", "RSI@tv-basicstudies"];
        }

        // If autosize is false, send explicit width/height numbers (TradingView expects numbers)
        if (!autosize) {
          if (typeof width === "number") config.width = width;
          config.height = height;
        }

        // The container id for widget (unique)
        config.container_id = containerId;

        // create widget
        // Note: TradingView.widget mutates DOM and creates iframe, etc.
        new window.TradingView.widget(config);

        widgetReadyRef.current = true;
      } catch (err) {
        console.error("TradingView widget init error", err);
      }
    };

    // if script already loaded, just create widget
    if (window.TradingView && window.TradingView.widget) {
      createWidget();
    } else {
      // add script and create when ready
      const s = document.createElement("script");
      s.src = "https://s3.tradingview.com/tv.js";
      s.async = true;
      s.onload = () => {
        // small delay to ensure global available
        setTimeout(createWidget, 50);
      };
      s.onerror = () => console.error("Failed to load TradingView script");
      document.head.appendChild(s);
      scriptRef.current = s;
    }

    // CLEANUP
    return () => {
      // Remove script if we added it (optional — leave if other widgets rely on it)
      if (scriptRef.current && scriptRef.current.parentNode) {
        // don't remove if other components might use it; only remove if you added it and won't need later.
        // document.head.removeChild(scriptRef.current);
        scriptRef.current = null;
      }

      // Clear container to remove widget iframe
      if (containerRef.current) containerRef.current.innerHTML = "";
      widgetReadyRef.current = false;
    };
    // re-run on props change
  }, [symbol, height, width, autosize, theme, showIndicators, containerId]);

  // NOTE: If TradingView shows "symbol only available on TradingView" popup, it's data restriction.
  // Try passing a fully qualified symbol: "NSE:TATAMOTORS" or "BSE:532540", etc.

  return (
    <div
      id={containerId}
      ref={containerRef}
      className="tradingview-widget-container"
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: `${height}px`,
        // Make sure parent has no collapsing margins so TradingView can measure the container
        display: "block",
      }}
    />
  );
}

export default memo(TradingViewWidget);
