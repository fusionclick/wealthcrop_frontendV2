import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";

const timeframes = [
  "1D", "1W", "1M", "3M", "6M", "1Y", "3Y", "5Y", "All"
];

export default function CandleChart({ data }) {
  const chartRef = useRef(null);
  const [showVolume, setShowVolume] = useState(false);
  const [ohlc, setOhlc] = useState(null); // For showing O,H,L,C on top

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 420,
      layout: { background: { color: "#ffffff" }, textColor: "#000" },
      grid: {
        vertLines: { color: "#eee" },
        horzLines: { color: "#eee" },
      },
      crosshair: {
        mode: 1,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e",
    });

    candleSeries.setData(
      data.map((d) => ({
        time: d.timestamp / 1000,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    );

    let volumeSeries = null;

    if (showVolume) {
      volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      volumeSeries.setData(
        data.map((d) => ({
          time: d.timestamp / 1000,
          value: d.volume,
          color: d.close > d.open ? "#22c55e88" : "#ef444488",
        }))
      );
    }

    // Show OHLC on hover
    candleSeries.subscribeCrosshairMove((param) => {
      if (param?.seriesData?.get(candleSeries)) {
        const c = param.seriesData.get(candleSeries);
        setOhlc({
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        });
      }
    });

    return () => {
      chart.remove();
    };
  }, [data, showVolume]);

  return (
    <div className="w-full">
      {/* Top OHLC display */}
      <div className="flex gap-4 mb-3 text-sm">
        {ohlc ? (
          <>
            <span>O <b>{ohlc.open}</b></span>
            <span>H <b>{ohlc.high}</b></span>
            <span>L <b>{ohlc.low}</b></span>
            <span>C <b>{ohlc.close}</b></span>
          </>
        ) : (
          <span className="text-gray-400">Hover chart to see OHLC</span>
        )}
      </div>

      {/* Volume toggle */}
      <div className="flex gap-2 mb-2 items-center">
        <input
          type="checkbox"
          checked={showVolume}
          onChange={() => setShowVolume(!showVolume)}
        />
        <span>Volume</span>
      </div>

      {/* Chart */}
      <div
        ref={chartRef}
        className="w-full"
        style={{ borderRadius: "10px", overflow: "hidden" }}
      />

      {/* Timeframe Buttons */}
      <div className="flex gap-3 justify-center mt-4">
        {timeframes.map((t) => (
          <button
            key={t}
            className="px-3 py-1 rounded-full border hover:bg-gray-100 text-sm"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

