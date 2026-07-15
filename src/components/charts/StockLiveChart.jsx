import { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { fetchStockChart } from "../../api/marketApi";

const StockLiveChart = ({ symbol, height = 360 }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!symbol || !containerRef.current) return;

    let cancelled = false;
    setError(false);

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: { background: { color: "#fff" }, textColor: "#1e293b" },
      grid: {
        vertLines: { color: "#f3f4f6" },
        horzLines: { color: "#f3f4f6" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });
    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#dc2626",
      borderVisible: false,
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
    });

    fetchStockChart(symbol)
      .then((res) => {
        if (cancelled) return;
        const rows = (res?.data ?? [])
          .filter((c) => c.close > 0)
          .map((c) => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }));
        if (rows.length === 0) {
          setError(true);
          return;
        }
        series.setData(rows);
        chart.timeScale().fitContent();
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    const onResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol, height]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center text-sm text-slate-500"
        style={{ height }}
      >
        Chart data loading…
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" style={{ height }} />;
};

export default StockLiveChart;
