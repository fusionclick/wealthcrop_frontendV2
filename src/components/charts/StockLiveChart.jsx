import { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { fetchStockChart } from "../../api/marketApi";
import { INDICATORS } from "../../utils/indicators";

/**
 * FR 5.2 — "Interactive historical price charts should support zoom, scroll, technical
 * indicator overlays. Examples: moving averages, RSI."
 *
 * Zoom and scroll come with lightweight-charts. The overlays are this file: the maths
 * lives in utils/indicators.js so it can be tested, and here it is only drawn.
 *
 * Toggling an indicator does NOT rebuild the chart or refetch. Two effects: one owns the
 * chart and the data, the other owns the indicator series. Collapsing them would mean
 * every click on "MA 20" throws away the candles and the investor's zoom level with them.
 */
const StockLiveChart = ({ symbol, height = 360 }) => {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({});
  const [bars, setBars] = useState([]);
  const [active, setActive] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!symbol || !containerRef.current) return undefined;

    let cancelled = false;
    setError(false);
    setBars([]);

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
    // The previous chart took its series with it; nothing here outlives a symbol change.
    seriesRef.current = {};

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
        // Held so an indicator can be drawn later without asking for the data again.
        setBars(rows);
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
        seriesRef.current = {};
      }
    };
  }, [symbol, height]);

  // Draw or clear the selected indicators. Only what changed is touched.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || bars.length === 0) return;

    for (const ind of INDICATORS) {
      const on = active.includes(ind.key);
      const existing = seriesRef.current[ind.key];

      if (!on) {
        if (existing) {
          chart.removeSeries(existing);
          delete seriesRef.current[ind.key];
        }
        continue;
      }
      if (existing) continue;

      const points = ind.compute(bars);
      // Not enough history for this window — draw nothing rather than a stub line.
      if (!points.length) continue;

      const line = chart.addLineSeries({
        color: ind.colour,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: ind.pane === "lower",
        // An oscillator bounded 0..100 plotted on a ₹2,400 price scale is a flat line at
        // the bottom of the chart, so it gets its own scale in the lower quarter.
        priceScaleId: ind.pane === "lower" ? ind.key : "right",
      });

      if (ind.pane === "lower") {
        chart.priceScale(ind.key).applyOptions({
          scaleMargins: { top: 0.75, bottom: 0 },
          borderVisible: false,
        });
      }

      line.setData(points);
      seriesRef.current[ind.key] = line;
    }
  }, [active, bars]);

  const toggle = (key) =>
    setActive((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

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

  return (
    <div className="w-full">
      <div ref={containerRef} className="w-full" style={{ height }} />

      {/* Offered only once there are candles to draw them on. */}
      {bars.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {INDICATORS.map((ind) => {
            const on = active.includes(ind.key);
            const enough = ind.compute(bars).length > 0;
            return (
              <button
                key={ind.key}
                type="button"
                disabled={!enough}
                onClick={() => toggle(ind.key)}
                title={enough ? undefined : "Not enough price history for this indicator"}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition disabled:opacity-40 ${
                  on ? "text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-[#94a3b8]"
                }`}
                style={on ? { backgroundColor: ind.colour } : undefined}
              >
                <span
                  className="inline-block h-0.5 w-3 rounded"
                  style={{ backgroundColor: on ? "#fff" : ind.colour }}
                />
                {ind.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StockLiveChart;
