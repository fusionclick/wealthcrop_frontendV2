// src/components/TerminalChart.jsx
import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";

/**
 * TerminalChart
 *
 * Props:
 *  - data: array of candles (each: { timestamp (ms or s), open, high, low, close, volume })
 *  - onClose: function to close the terminal modal
 *  - symbol: optional symbol name
 *
 * Notes:
 *  - The component normalizes timestamps to seconds (Trading lightweight-charts uses seconds).
 *  - It sorts candles ASC by time and removes duplicate times (keeps first).
 *  - For different timeframes you can implement custom filters; here "All" returns full dataset.
 */
export default function TerminalChart({ data = [], onClose = () => {}, symbol = "DEMO" }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [activeTF, setActiveTF] = useState("1D");
  const [showVolume, setShowVolume] = useState(true);
  const [ohlc, setOhlc] = useState(null);

  const timeframes = ["1D", "1W", "1M", "3M", "6M", "1Y", "All"];

  // ------------------------
  // Helpers
  // ------------------------

  // normalize timestamp: accept ms (>=1e12) or seconds (<=1e10). Return seconds (integer).
  const toSeconds = (t) => {
    if (typeof t !== "number") return null;
    if (t > 1e12) return Math.floor(t / 1000); // milliseconds
    if (t > 1e10) return Math.floor(t / 1000); // defensive
    return Math.floor(t); // already seconds
  };

  // Normalize raw input item into an object: { timeSec, open, high, low, close, volume }
  const normalizeItem = (it) => {
    if (!it) return null;
    const ts = it.timestamp ?? it.time ?? it.t ?? null;
    const timeSec = toSeconds(ts);
    if (timeSec == null) return null;
    // fallback keys
    const open = Number(it.open ?? it.o ?? it.Open ?? NaN);
    const high = Number(it.high ?? it.h ?? it.High ?? NaN);
    const low = Number(it.low ?? it.l ?? it.Low ?? NaN);
    const close = Number(it.close ?? it.c ?? it.Close ?? NaN);
    const volume = Number(it.volume ?? it.v ?? 0);
    if ([open, high, low, close].some((x) => Number.isNaN(x))) {
      // some data missing: skip
      return null;
    }
    return { time: timeSec, open, high, low, close, volume };
  };

  // sort ascending and remove duplicates (by time). keep first occurance of time.
  const normalizeAndSort = (arr) => {
    if (!Array.isArray(arr)) return [];
    const normalized = [];
    for (let i = 0; i < arr.length; i++) {
      const n = normalizeItem(arr[i]);
      if (n) normalized.push(n);
    }
    normalized.sort((a, b) => a.time - b.time);
    const deduped = [];
    let prev = null;
    for (const item of normalized) {
      if (prev == null || item.time !== prev.time) {
        deduped.push(item);
        prev = item;
      }
      // if duplicate times exist, we skip later ones
    }
    return deduped;
  };

  // Return data for timeframe. For demo we use simple slicing. You can implement better filters.
  const getDataForTF = (tf) => {
    const normalized = normalizeAndSort(data);
    if (!normalized.length) return [];

    if (tf === "All") return normalized;

    // For demo: approximate ranges based on count not calendar units.
    // You can replace these with real-time windowing logic.
    const n = normalized.length;
    switch (tf) {
      case "1D":
        return normalized.slice(Math.max(0, n - 50)); // last 50 points (demo)
      case "1W":
        return normalized.slice(Math.max(0, n - 100));
      case "1M":
        return normalized.slice(Math.max(0, n - 250));
      case "3M":
        return normalized.slice(Math.max(0, n - 500));
      case "6M":
        return normalized.slice(Math.max(0, n - 800));
      case "1Y":
        return normalized.slice(Math.max(0, n - 1200));
      default:
        return normalized;
    }
  };

  // ------------------------
  // Chart setup
  // ------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    // destroy old chart if present
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        // ignore
      }
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: { background: { color: "#fff" }, textColor: "#333" },
      grid: { vertLines: { color: "#eee" }, horzLines: { color: "#eee" } },
      crosshair: { mode: 1 },
      rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { timeVisible: true },
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#2ecc71",
      downColor: "#ff6b6b",
      wickUpColor: "#2ecc71",
      wickDownColor: "#ff6b6b",
      borderVisible: false,
    });

    // Volume histogram placed on separate (empty) price scale (v4 API)
    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a33",
      priceFormat: { type: "volume" },
      priceScaleId: "", // this uses separate internal scale; we'll set chart.priceScale if needed
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const niftySeries = chart.addLineSeries({
      color: "#2962ff",
      lineWidth: 1,
    });

    const setSeriesData = () => {
      const DATA = getDataForTF(activeTF);

      // if no data, set empty and return
      if (!DATA || !DATA.length) {
        candleSeries.setData([]);
        volumeSeries.setData([]);
        niftySeries.setData([]);
        return;
      }

      // Build payloads (lightweight-charts expects times as integer seconds)
      const candlePayload = DATA.map((d) => ({
        time: Math.floor(d.time), // already seconds
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      const volPayload = DATA.map((d) => ({
        time: Math.floor(d.time),
        value: d.volume ?? 0,
        color: d.close > d.open ? "#2ecc7155" : "#ff6b6b55",
      }));

      const niftyPayload = DATA.map((d) => ({
        time: Math.floor(d.time),
        value: d.close + 20,
      }));

      // set data (will assert if data not strictly ascending or duplicate times)
      candleSeries.setData(candlePayload);
      if (showVolume) volumeSeries.setData(volPayload);
      else volumeSeries.setData([]);
      niftySeries.setData(niftyPayload);
    };

    // initial set
    setSeriesData();

    // crosshair handler for OHLC display
    chart.subscribeCrosshairMove((param) => {
      const d = param.seriesData.get(candleSeries);
      if (d) {
        setOhlc({ open: d.open, high: d.high, low: d.low, close: d.close });
      } else {
        setOhlc(null);
      }
    });

    // responsive
    const handleResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        chart.remove();
      } catch (e) {
        /* ignore */
      }
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // update data whenever data, activeTF or showVolume changes
  useEffect(() => {
    if (!chartRef.current) return;
    // get existing series references by reusing child references (we created them in mount effect)
    const chart = chartRef.current;

    // find series by using internal API: chart.getSeries() is not public; instead we keep references by closure
    // To keep it simple, recreate the chart when data changes (safe for demo). Alternative: hold series refs.
    // We'll remove & re-create chart to ensure correct ordering and fresh series.
    // NOTE: this is simpler and avoids stale refs.
    try {
      chart.remove();
    } catch (e) {
      // ignore
    }
    chartRef.current = null;

    // Re-run the mount logic by calling the same effect body: easiest approach = force re-render by creating new chart
    // But inside React hooks you can't call the previous effect; so implement small recreate here:

    const newChart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: { background: { color: "#fff" }, textColor: "#333" },
      grid: { vertLines: { color: "#eee" }, horzLines: { color: "#eee" } },
      crosshair: { mode: 1 },
      rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { timeVisible: true },
    });

    chartRef.current = newChart;

    const candleSeries = newChart.addCandlestickSeries({
      upColor: "#2ecc71",
      downColor: "#ff6b6b",
      wickUpColor: "#2ecc71",
      wickDownColor: "#ff6b6b",
      borderVisible: false,
    });

    const volumeSeries = newChart.addHistogramSeries({
      color: "#26a69a33",
      priceFormat: { type: "volume" },
      priceScaleId: "",
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const niftySeries = newChart.addLineSeries({
      color: "#2962ff",
      lineWidth: 1,
    });

    const DATA = getDataForTF(activeTF);

    if (!DATA || DATA.length === 0) {
      candleSeries.setData([]);
      volumeSeries.setData([]);
      niftySeries.setData([]);
    } else {
      const candlePayload = DATA.map((d) => ({
        time: Math.floor(d.time),
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      const volPayload = DATA.map((d) => ({
        time: Math.floor(d.time),
        value: d.volume ?? 0,
        color: d.close > d.open ? "#2ecc7155" : "#ff6b6b55",
      }));

      const niftyPayload = DATA.map((d) => ({
        time: Math.floor(d.time),
        value: d.close + 20,
      }));

      candleSeries.setData(candlePayload);
      if (showVolume) volumeSeries.setData(volPayload);
      else volumeSeries.setData([]);
      niftySeries.setData(niftyPayload);
    }

    // crosshair for the recreated chart
    newChart.subscribeCrosshairMove((param) => {
      const d = param.seriesData.get(candleSeries);
      if (d) setOhlc({ open: d.open, high: d.high, low: d.low, close: d.close });
      else setOhlc(null);
    });

    // cleanup on next run
    return () => {
      try {
        newChart.remove();
      } catch (e) {}
      chartRef.current = null;
    };
  }, [data, activeTF, showVolume]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 60,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "92%",
          height: "88%",
          margin: "auto",
          background: "#fff",
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #eee",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontWeight: 700 }}>{symbol}</div>
            <div style={{ color: "#666" }}>{/* price & change area */}</div>
            <div style={{ marginLeft: 12 }}>
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTF(tf)}
                  style={{
                    margin: "0 6px",
                    padding: "6px 10px",
                    borderRadius: 18,
                    border:
                      activeTF === tf ? "1px solid #000" : "1px solid #eee",
                    background: activeTF === tf ? "#f6f6f6" : "#fff",
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={showVolume}
                onChange={() => setShowVolume((s) => !s)}
              />
              Volume
            </label>
            <button
              onClick={() => {
                try {
                  onClose();
                } catch (e) {}
              }}
              style={{ padding: "6px 10px", borderRadius: 6 }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Chart area */}
        <div style={{ display: "flex", flex: 1 }}>
          {/* Left mock toolbar */}
          <div
            style={{
              width: 56,
              background: "#fafafa",
              borderRight: "1px solid #f0f0f0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 10,
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                background: "#fff",
                borderRadius: 6,
                boxShadow: "0 0 0 1px #eee inset",
              }}
            />
            <div
              style={{
                width: 36,
                height: 36,
                background: "#fff",
                borderRadius: 6,
                boxShadow: "0 0 0 1px #eee inset",
              }}
            />
            <div
              style={{
                width: 36,
                height: 36,
                background: "#fff",
                borderRadius: 6,
                boxShadow: "0 0 0 1px #eee inset",
              }}
            />
            <div
              style={{
                width: 36,
                height: 36,
                background: "#fff",
                borderRadius: 6,
                boxShadow: "0 0 0 1px #eee inset",
              }}
            />
          </div>

          {/* main chart */}
          <div style={{ flex: 1, position: "relative" }}>
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #f2f2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ color: "#666" }}>
                Price{" "}
                {ohlc ? `O ${ohlc.open} H ${ohlc.high} L ${ohlc.low} C ${ohlc.close}` : ""}
              </div>
              <div style={{ color: "#666" }}>{/* Right side controls */}</div>
            </div>

            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
