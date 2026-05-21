import React, { useEffect, useRef, useState } from "react";
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

// ⭐ DATA SANITIZER FIX
// --------------------------------------------------------
function cleanData(raw) {
  return [...raw]
    .map((d) => ({
      ...d,
      timestamp: Math.floor(d.timestamp / 1000), // convert MS -> seconds int
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
    .filter((d, i, arr) => i === 0 || d.timestamp !== arr[i - 1].timestamp); // remove duplicates
}

export default function CandleChart({ stockName = "Sun Pharma Adv. Res" }) {
  const containerRef = useRef(null);
  const chartInstance = useRef(null);

  const [currentTF, setCurrentTF] = useState("1D");
  const [showVolume, setShowVolume] = useState(true);
  const [chartType, setChartType] = useState("candles");
  const [ohlc, setOhlc] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy old chart
    if (chartInstance.current) {
      chartInstance.current.remove();
      chartInstance.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 430,
      layout: { background: { color: "#fff" }, textColor: "#1e293b" },
      grid: {
        vertLines: { color: "#f3f4f6" },
        horzLines: { color: "#f3f4f6" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.30 } },
    });

    chartInstance.current = chart;

    // ⭐ CLEAN & SAFE DATA
    const DATA = cleanData(timeframeMap[currentTF]);

    // --------------------------------------------------
    // ⭐ MAIN SERIES
    // --------------------------------------------------
    let mainSeries;

    if (chartType === "candles") {
      mainSeries = chart.addCandlestickSeries({
        upColor: "#00b26a",
        downColor: "#ff4d4f",
        wickUpColor: "#00b26a",
        wickDownColor: "#ff4d4f",
      });
    } else {
      mainSeries = chart.addLineSeries({
        color: "#00b26a",
        lineWidth: 2,
      });
    }

    mainSeries.setData(
      DATA.map((d) => ({
        time: d.timestamp,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        value: d.close,
      }))
    );

    // --------------------------------------------------
    // ⭐ VOLUME SERIES (Separate bottom panel)
    // --------------------------------------------------
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        priceScaleId: "volume",
        scaleMargins: { top: 0.75, bottom: 0 },
        priceFormat: { type: "volume" },
      });

      chart.priceScale("volume").applyOptions({
        visible: true,
        scaleMargins: { top: 0.75, bottom: 0 },
      });

      volumeSeries.setData(
        DATA.map((d) => ({
          time: d.timestamp,
          value: d.volume,
          color: d.close > d.open ? "#00b26a77" : "#ff4d4f77",
        }))
      );
    }

    // --------------------------------------------------
    // ⭐ CROSSHAIR OHLC
    // --------------------------------------------------
    chart.subscribeCrosshairMove((param) => {
      const p = param.seriesData.get(mainSeries);
      if (p) {
        setOhlc({
          open: p.open ?? p.value,
          high: p.high ?? p.value,
          low: p.low ?? p.value,
          close: p.close ?? p.value,
        });
      }
    });

  }, [currentTF, showVolume, chartType]);

  return (
    <div className="w-full">

      {/* Stock Name */}
      <div className="text-xl font-semibold mb-3">{stockName}</div>

      {/* OHLC */}
      <div className="flex items-center gap-6 bg-gray-50 p-3 rounded-lg border mb-3 shadow-sm">
        {ohlc ? (
          <>
            <span className="text-gray-700">O <b>{ohlc.open}</b></span>
            <span className="text-gray-700">H <b>{ohlc.high}</b></span>
            <span className="text-gray-700">L <b>{ohlc.low}</b></span>
            <span className="text-gray-700">C <b>{ohlc.close}</b></span>
          </>
        ) : (
          <span className="text-gray-400">Hover on chart to see OHLC</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-2">

        <div className="flex items-center gap-4">
          {/* Volume toggle */}
          <label className="flex gap-2 items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showVolume}
              onChange={() => setShowVolume(!showVolume)}
            />
            <span className="text-gray-700">Volume</span>
          </label>

          {/* Chart Type */}
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="border px-3 py-1 rounded-md bg-white"
          >
            <option value="candles">Candles</option>
            <option value="line">Line</option>
          </select>
        </div>

        <div className="flex gap-3">
          <button className="border px-4 py-1 rounded-md">Customize</button>
          <button className="border px-4 py-1 rounded-md">Terminal</button>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{ height: "430px" }}
        className="rounded-xl border shadow-sm"
      />

      <div className="flex gap-2 justify-center mt-4 flex-wrap">
        {Object.keys(timeframeMap).map((tf) => (
          <button
            key={tf}
            onClick={() => setCurrentTF(tf)}
            className={`px-4 py-1 rounded-full border text-sm ${
              currentTF === tf
                ? "bg-black text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {tf}
          </button>
        ))}
      </div>
    </div>
  );
}
