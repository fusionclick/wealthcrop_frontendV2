// GrowChart.jsx
import React, { useRef, useEffect, useState } from "react";
import { createChart } from "lightweight-charts";

// --------------------------
// 1️⃣ Candle Data Generator
// --------------------------
function generateCandles(startTimestamp, count, intervalDays = 1) {
  const candles = [];
  let lastClose = 150 + Math.random() * 20;

  for (let i = 0; i < count; i++) {
    const timestamp = startTimestamp + i * intervalDays * 86400000;

    const open = lastClose;

    const up = Math.random() * 5;
    const down = Math.random() * 5;

    // Ensure high >= open >= low
    const high = +(open + up).toFixed(2);
    const low = +(open - down).toFixed(2);

    // Close inside [low, high]
    const close = +(low + Math.random() * (high - low)).toFixed(2);
    lastClose = close;

    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume: Math.floor(500000 + Math.random() * 1500000),
    });
  }

  return candles;
}

const NOW = Date.now();

const data_1D = generateCandles(NOW - 100 * 86400000, 100, 1);
const data_1W = generateCandles(NOW - 10 * 86400000, 10, 1);
const data_1M = generateCandles(NOW - 30 * 86400000, 30, 1);
const data_3M = generateCandles(NOW - 90 * 86400000, 90, 1);
const data_6M = generateCandles(NOW - 180 * 86400000, 180, 1);
const data_1Y = generateCandles(NOW - 365 * 86400000, 365, 1);
const data_3Y = generateCandles(NOW - 36 * 30 * 86400000, 36, 30);
const data_5Y = generateCandles(NOW - 60 * 30 * 86400000, 60, 30);
const data_10Y = generateCandles(NOW - 240 * 15 * 86400000, 240, 15);

// Combine all data (sorted)
const data_All = [
  ...data_10Y,
  ...data_5Y,
  ...data_3Y,
  ...data_1Y,
  ...data_6M,
  ...data_3M,
  ...data_1M,
  ...data_1W,
  ...data_1D,
].sort((a, b) => a.timestamp - b.timestamp);

// --------------------------
// 2️⃣ GrowChart Component
// --------------------------
export default function GrowChart({ data = data_All, symbol = "TATAMOTORS" }) {
  const chartRef = useRef(null);
  const chartObj = useRef({ chart: null, mainSeries: null, volumeSeries: null });

  const [tf, setTf] = useState("1D");
  const [chartType, setChartType] = useState("candles");
  const [ohlc, setOhlc] = useState(null);
  const [showVolume, setShowVolume] = useState(true);

  const timeframeButtons = ["1D","1W","1M","3M","6M","1Y","3Y","5Y","All"];

  // --------------------------
  // Convert and filter data
  // --------------------------
  const convertData = (arr = []) => {
  const sorted = arr
    .map((d) => ({
      time: Math.floor(Number(d.timestamp) / 1000),
      open: Number(d.open),
      high: Number(d.high),
      low: Number(d.low),
      close: Number(d.close),
      volume: Number(d.volume ?? 0),
    }))
    .filter((d) =>
      !isNaN(d.time) &&
      !isNaN(d.open) &&
      !isNaN(d.high) &&
      !isNaN(d.low) &&
      !isNaN(d.close)
    )
    .sort((a, b) => a.time - b.time);

  // Make strictly ascending by adding +1 second to duplicates
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].time <= sorted[i - 1].time) {
      sorted[i].time = sorted[i - 1].time + 1;
    }
  }

  return sorted;
};


  // --------------------------
  // Create chart once
  // --------------------------
  useEffect(() => {
    if (!chartRef.current || chartObj.current.chart) return;

    const c = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 420,
      layout: { background: { color: "#fff" }, textColor: "#000" },
      grid: { vertLines: { color: "#f3f3f3" }, horzLines: { color: "#f3f3f3" } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });

    chartObj.current.chart = c;

    const handleResize = () => {
      c.applyOptions({ width: chartRef.current.clientWidth });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      c.remove();
    };
  }, []);

  // --------------------------
  // Update chart on data/type/volume change
  // --------------------------
  useEffect(() => {
    if (!chartObj.current.chart) return;
    const c = chartObj.current.chart;
    const safeData = convertData(data);

    // Remove old series
    if (chartObj.current.mainSeries) {
      c.removeSeries(chartObj.current.mainSeries);
      chartObj.current.mainSeries = null;
    }
    if (chartObj.current.volumeSeries) {
      c.removeSeries(chartObj.current.volumeSeries);
      chartObj.current.volumeSeries = null;
    }

    // Main series
    let mainSeries;
    if (chartType === "candles") {
      mainSeries = c.addCandlestickSeries({
        upColor: "#16c784",
        downColor: "#ea3943",
        wickUpColor: "#16c784",
        wickDownColor: "#ea3943",
        borderVisible: false,
      });
    } else if (chartType === "line") {
      mainSeries = c.addLineSeries({ color: "#2962ff", lineWidth: 2 });
    } else {
      mainSeries = c.addAreaSeries({
        topColor: "rgba(41,98,255,0.4)",
        bottomColor: "rgba(41,98,255,0.1)",
        lineColor: "#2962ff",
        lineWidth: 2,
      });
    }

    mainSeries.setData(safeData);
    chartObj.current.mainSeries = mainSeries;

    // Volume series
    if (showVolume) {
      const volumeSeries = c.addHistogramSeries({
        priceScaleId: "",
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      volumeSeries.setData(
        safeData.map((d) => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? "#16c78455" : "#ea394355",
        }))
      );

      chartObj.current.volumeSeries = volumeSeries;
    }

    // Crosshair OHLC
    c.subscribeCrosshairMove((param) => {
      const v = param.seriesData.get(mainSeries);
      setOhlc(v || null);
    });
  }, [data, chartType, showVolume]);

  // --------------------------
  // Render
  // --------------------------
  return (
    <div className="w-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold">{symbol}</div>
        <div className="flex gap-4 text-sm">
          {ohlc ? (
            <>
              <span>O <b>{ohlc.open}</b></span>
              <span>H <b>{ohlc.high}</b></span>
              <span>L <b>{ohlc.low}</b></span>
              <span>C <b>{ohlc.close}</b></span>
            </>
          ) : (
            <span className="text-gray-400">Hover chart…</span>
          )}
        </div>
        <button className="px-3 py-1 border rounded">Customize</button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-3">
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className="border p-1 rounded"
        >
          <option value="candles">Candles</option>
          <option value="line">Line</option>
          <option value="area">Area</option>
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showVolume}
            onChange={() => setShowVolume(!showVolume)}
          />
          Volume
        </label>
      </div>

      {/* Chart */}
      <div ref={chartRef} style={{ width: "100%", height: 420, borderRadius: 12 }} />

      {/* Timeframes */}
      <div className="flex justify-center gap-2 mt-4 flex-wrap">
        {timeframeButtons.map((t) => (
          <button
            key={t}
            onClick={() => setTf(t)}
            className={`px-4 py-1 rounded-full border ${
              tf === t ? "bg-black text-white" : ""
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
