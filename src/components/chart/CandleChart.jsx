// components/CandleChart.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { createChart } from "lightweight-charts";
import {
  data_1D,
  data_1W,
  data_1M,
  data_3M,
  data_6M,
  data_1Y,
  data_3Y,
  data_5Y,
  data_All,
} from "./chartData";

// map UI button -> dataset key
const mapSelectionToKey = {
  "1D":"1D",
  "7D": "1W",
  "30D": "1M",
  "3M": "3M",
  "6M": "6M",
  "1Y": "1Y",
  "3Y": "3Y",
  "5Y": "5Y",
  "10Y": "All",
  ALL: "All",
};

const timeframeMap = {
  "1D": data_1D,
  "1W": data_1W,
  "1M": data_1M,
  "3M": data_3M,
  "6M": data_6M,
  "1Y": data_1Y,
  "3Y": data_3Y,
  "5Y": data_5Y,
  All: data_All,
};

/**
 * cleanData: safer timestamp normalization and deduplication
 *
 * Heuristics:
 *  - If timestamps look like milliseconds (max > 1e12) convert to seconds.
 *  - If timestamps are already in seconds (<= 1e12) keep them.
 *  - Deduplicate only when timestamps are identical **after** normalization.
 *
 * This avoids accidentally collapsing many intraday candles into the same second.
 */
function cleanData(raw = []) {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  // copy & sort by raw timestamp (numeric)
  const copy = raw
    .filter(Boolean)
    .map((d) => ({ ...d, __rawTs: Number(d.timestamp) || 0 }))
    .sort((a, b) => a.__rawTs - b.__rawTs);

  // detect unit: if max raw ts is very large treat as ms, else seconds
  const maxRaw = copy[copy.length - 1].__rawTs;
  const isMs = maxRaw > 1e12; // ms timestamps are ~1.6e12+ in current epoch

  // normalize
  const normalized = copy.map((d) => {
    const ts = isMs ? Math.floor(d.__rawTs / 1000) : Math.floor(d.__rawTs);
    return {
      ...d,
      timestamp: ts,
    };
  });

  // dedupe: only remove consecutive entries with identical normalized timestamp
  const deduped = [];
  for (let i = 0; i < normalized.length; i++) {
    if (i === 0) {
      deduped.push(normalized[i]);
    } else {
      if (normalized[i].timestamp !== normalized[i - 1].timestamp) {
        deduped.push(normalized[i]);
      } else {
        // If timestamps collide (same second), keep the one with unique OHLC if present.
        // Prefer the later entry if OHLC differs (prevents accidental drop of real bars).
        const prev = deduped[deduped.length - 1];
        const cur = normalized[i];
        const prevOHLC = `${prev.open}-${prev.high}-${prev.low}-${prev.close}`;
        const curOHLC = `${cur.open}-${cur.high}-${cur.low}-${cur.close}`;
        if (prevOHLC !== curOHLC) {
          deduped[deduped.length - 1] = cur; // replace with more recent differing bar
        }
        // else keep previous (duplicate)
      }
    }
  }

  // return only necessary fields (keep original shape)
  return deduped.map(({ timestamp, open, high, low, close, volume }) => ({
    timestamp,
    open,
    high,
    low,
    close,
    volume,
  }));
}

export default function CandleChart({ height = 320 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const mainSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const crosshairUnsubRef = useRef(null);

  // firstMountRef: ensure default OHLC is set only once on initial mount/load
  const firstMountRef = useRef(true);

  const timeframeButtons = ["1D", "7D", "30D", "3M", "6M", "1Y", "3Y", "5Y", "10Y", "ALL"];

  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");
  const [showVolume, setShowVolume] = useState(true);
  const [chartType, setChartType] = useState("candles"); // 'candles' | 'line'
  const [ohlc, setOhlc] = useState(null);

  // select raw dataset based on UI selection
  const rawData = useMemo(() => {
    const key = mapSelectionToKey[selectedTimeframe] ?? "1D";
    return timeframeMap[key] ?? [];
  }, [selectedTimeframe]);
  
  const DATA = useMemo(() => cleanData(rawData), [rawData]);
  
  const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const isDark = document.documentElement.classList.contains("dark");

  // -------- CREATE CHART (once) --------
  useEffect(() => {
    if (!containerRef.current) return;

    // remove previous chart if any
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch {}
      chartRef.current = null;
    }


const chart = createChart(containerRef.current, {
  // width: containerRef.current.clientWidth,
  autoSize: true,
  height,

  layout: {
    background: {
      color: isDark ? cssVar("--gray-900") : "#ffffff",
    },
    textColor: isDark ? cssVar("--text-secondary") : "#1e293b",
  },

  grid: {
    vertLines: {
      color: isDark ? cssVar("--white-5") : "#f3f4f6",
    },
    horzLines: {
      color: isDark ? cssVar("--white-5") : "#f3f4f6",
    },
  },

  crosshair: { mode: 1 },

  priceScale: {
    borderColor: isDark ? cssVar("--border-color") : "#cbd5e1",
  },

  rightPriceScale: {
    borderColor: isDark ? cssVar("--border-color") : "#cbd5e1",
    scaleMargins: { top: 0.12, bottom: 0.22 },
  },

  timeScale: {
    borderColor: isDark ? cssVar("--border-color") : "#cbd5e1",
    fixRightEdge: false,
    rightOffset: 6,
    barSpacing: 10,
  },
});




    chartRef.current = chart;

    return () => {
      try {
        if (crosshairUnsubRef.current) crosshairUnsubRef.current();
      } catch {}
      try {
        chart.remove();
      } catch {}
      chartRef.current = null;
    };
    // intentionally empty deps -> create once
  }, []);

  

  // -------- UPDATE SERIES when DATA, showVolume or chartType change --------
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // remove old main series & volume series
    try {
      if (mainSeriesRef.current) {
        chart.removeSeries(mainSeriesRef.current);
        mainSeriesRef.current = null;
      }
    } catch {}

    try {
      if (volumeSeriesRef.current) {
        chart.removeSeries(volumeSeriesRef.current);
        volumeSeriesRef.current = null;
      }
    } catch {}

    // MAIN SERIES
    let mainSeries;
    if (chartType === "line") {
      mainSeries = chart.addLineSeries({
        color: "#00b26a",
        lineWidth: 2,
        priceFormat: { type: "price", precision: 2 },
      });

      // line series needs { time, value }
      const lineData = DATA.map((d) => ({ time: d.timestamp, value: d.close }));
      mainSeries.setData(lineData);
    } else {
      mainSeries = chart.addCandlestickSeries({
        upColor: "#00b26a",
        downColor: "#ff4d4f",
        wickUpColor: "#00b26a",
        wickDownColor: "#ff4d4f",
        borderVisible: false,
      });

      const candleData = DATA.map((d) => ({
        time: d.timestamp,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      mainSeries.setData(candleData);
    }
    mainSeriesRef.current = mainSeries;

    // DEFAULT OHLC: only on the first mount (keeps behavior you wanted)
    if (firstMountRef.current && DATA.length > 0) {
      const last = DATA[DATA.length - 1];
      setOhlc({ open: last.open, high: last.high, low: last.low, close: last.close });
      firstMountRef.current = false;
    }

    // VOLUME: attach to its own price scale named "volume"
    if (showVolume) {
      const vol = chart.addHistogramSeries({
        priceScaleId: "volume",
        priceFormat: { type: "volume" },
        // FIXED vertical split: main chart reserves top ~78-82%, volume gets remainder
        scaleMargins: { top: 0.80, bottom: 0 },
        lastValueVisible: false,
      });

      vol.setData(
  DATA.map((d) => ({
    time: d.timestamp,
    value: d.volume,
    color:
      d.close > d.open
        ? (isDark ? cssVar("--vol-up") : "#00b26a66")
        : (isDark ? cssVar("--vol-down") : "#ff4d4f66"),
  }))
);

      // Ensure volume price scale options are applied so it sits as a bottom panel and doesn't overlap
      try {
        chart.priceScale("volume").applyOptions({
          visible: true,
          scaleMargins: { top: 0.80, bottom: 0 },
          borderVisible: false,
        });
      } catch (e) {
        // ignore if priceScale not ready
      }

      volumeSeriesRef.current = vol;
    } else {
      // hide volume scale if present
      try {
        chart.priceScale("volume").applyOptions({ visible: false });
      } catch (e) {}
    }

    // CROSSHAIR subscription: unsubscribe previous then subscribe
    try {
      if (crosshairUnsubRef.current) {
        crosshairUnsubRef.current();
        crosshairUnsubRef.current = null;
      }
    } catch {}

    const unsub = chart.subscribeCrosshairMove((param) => {
      const p = param.seriesData.get(mainSeries);
      if (p) {
        setOhlc({
          open: p.open ?? p.value,
          high: p.high ?? p.value,
          low: p.low ?? p.value,
          close: p.close ?? p.value,
        });
      }
      // DO NOT clear OHLC when p is falsy — keep last known
    });

    crosshairUnsubRef.current = unsub;

    // cleanup for this effect run is handled by next run (we removed series at start)
  }, [DATA, showVolume, chartType]);

    /* ---------------- RESIZE OBSERVER ---------------- */
  useEffect(() => {
    if (!chartRef.current || !containerRef.current) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        chartRef.current.applyOptions({width, height})
      }
    });

    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const fmt = (v) =>
    typeof v === "number" ? v.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : v;



  return (
    <div className="w-full">
      {/* Timeframes */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {timeframeButtons.map((tf) => (
          <button
  key={tf}
  onClick={() => setSelectedTimeframe(tf)}
  className={`px-3 py-1 rounded-md text-sm transition ${
    selectedTimeframe === tf
      ? "bg-blue-600 text-white"
      : `
          bg-gray-100 text-gray-700
          dark:bg-[var(--gray-800)]
          dark:text-[var(--text-secondary)]
        `
  }
  dark:${selectedTimeframe === tf ? "bg-blue-500 text-white" : ""}
  `}
>
  {tf}
</button>

        ))}
      </div>

      {/* Chart container */}
      <div
        ref={containerRef}
        className="w-full border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm overflow-hidden"
        style={{ height }}
      />

      {/* OHLC */}
      <div
  className="
    mt-3 p-3 rounded-lg flex gap-4 text-sm
    bg-gray-50 border border-slate-300 text-blue-950

    dark:bg-[var(--gray-800)]
    dark:border-[var(--border-color)]
    dark:text-[var(--text-primary)]
  "
>
  {ohlc ? (
    <>
      <span>O: <b>{fmt(ohlc.open)}</b></span>
      <span>H: <b>{fmt(ohlc.high)}</b></span>
      <span>L: <b>{fmt(ohlc.low)}</b></span>
      <span>C: <b>{fmt(ohlc.close)}</b></span>
    </>
  ) : (
    <span className="text-gray-500 dark:text-[var(--text-secondary)]">
      Hover to view OHLC
    </span>
  )}
</div>


      {/* Controls */}
      <div className="flex items-center gap-6 mt-4">

  {/* Custom Checkbox */}
 <label
  className="
    flex items-center gap-2 font-medium cursor-pointer select-none
    text-slate-700

    dark:text-[var(--text-secondary)]
  "
>
  <input
    type="checkbox"
    checked={showVolume}
    onChange={() => setShowVolume((s) => !s)}
    className="
      h-4 w-4 rounded cursor-pointer
      accent-blue-600

      dark:accent-blue-500
    "
  />
  <span>Volume</span>
</label>


  {/* Styled Select Dropdown */}
<select
  value={chartType}
  onChange={(e) => setChartType(e.target.value)}
  className="
    px-3 py-1.5
    rounded-md
    text-sm
    cursor-pointer
    outline-none
    transition
    shadow-sm

    bg-white
    border border-slate-300
    text-slate-700
    hover:border-slate-400

    dark:bg-[var(--gray-800)]
    dark:border-[var(--border-color)]
    dark:text-[var(--text-primary)]
  "
>
  <option value="candles">Candlestick</option>
  <option value="line">Line</option>
</select>


</div>

    </div>
  );
}
