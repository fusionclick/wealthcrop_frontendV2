// components/MFChart.jsx
import React, { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

export default function MFChart({ data, height = 320 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy old chart
    if (chartRef.current) {
      try { chartRef.current.remove(); } catch {}
      chartRef.current = null;
    }

    function cssVar(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}


    const isDark = document.documentElement.classList.contains("dark");

const chart = createChart(containerRef.current, {
  width: containerRef.current.clientWidth,
  height,

  layout: {
    background: {
      color: isDark ? "transparent" : "#ffffff",
    },
    textColor: isDark ? cssVar("--text-secondary") : "#1e293b",
  },

  grid: {
    vertLines: {
      color: isDark ? cssVar("--border-color") : "#f3f4f6",
    },
    horzLines: {
      color: isDark ? cssVar("--border-color") : "#f3f4f6",
    },
  },

  crosshair: {
    mode: 1,
    vertLine: {
      width: 1,
      color: isDark ? cssVar("--text-secondary") : "#9ca3af",
      style: 2,
    },
    horzLine: {
      visible: false,
    },
  },

  rightPriceScale: {
    borderVisible: true,
    borderColor: isDark ? cssVar("--border-color") : "#00000011",
    scaleMargins: {
      top: 0.28,
      bottom: 0.18,
    },
  },

  timeScale: {
    borderVisible: true,
    borderColor: isDark ? cssVar("--border-color") : "#00000011",
    fixRightEdge: false,
    rightOffset: 0,
    minBarSpacing: 0.5,
  },
});



    chartRef.current = chart;


const lineSeries = chart.addLineSeries({
  color: "#00b26a",
  lineWidth: 2,
  lineType: 0,
  lastValueVisible: true,
  priceLineVisible: true,
});



    const safeData = Array.isArray(data) ? data : [];

    lineSeries.setData(
      safeData.map((d) => ({
        time: d.timestamp,
        value: d.nav,
      }))
    );

    // fit whole range (30D–10Y) into width
    setTimeout(() => {
      chart.timeScale().fitContent();
    }, 0);

    // Groww-style top-left tooltip

const tooltip = document.createElement("div");
tooltip.style.position = "absolute";
tooltip.style.top = "6px";
tooltip.style.left = "10px";
tooltip.style.padding = "4px 8px";
tooltip.style.borderRadius = "6px";
tooltip.style.fontSize = "13px";
tooltip.style.zIndex = "10";
tooltip.style.display = "none";
tooltip.style.pointerEvents = "none";

/* THEME AWARE STYLES */
tooltip.style.background = isDark
  ? "var(--white-10)"
  : "white";

tooltip.style.color = isDark
  ? "var(--text-primary)"
  : "#4b5563";

tooltip.style.boxShadow = isDark
  ? "0 2px 8px rgba(0,0,0,0.45)"
  : "0 2px 6px rgba(0,0,0,0.12)";

tooltip.style.border = isDark
  ? "1px solid var(--border-color)"
  : "1px solid #e5e7eb";

containerRef.current.appendChild(tooltip);


    chart.subscribeCrosshairMove((param) => {
      const point = param.seriesData.get(lineSeries);
      if (!point || !param.time) {
        tooltip.style.display = "none";
        return;
      }

      const date = new Date(point.time * 1000).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      tooltip.innerHTML = `NAV: ₹${point.value} | ${date}`;
      tooltip.style.display = "block";
    });

    return () => {
      try { chart.remove(); } catch {}
    };
  }, [data, height]);

  return (
   <div
className="
  w-full rounded-xl shadow-sm overflow-hidden !pb-0 !mb-0 !h-auto
  border border-slate-300 bg-white

  dark:border-[var(--border-color)]
  dark:bg-[var(--card-bg)]
"
>
  <div
    ref={containerRef}
    style={{ height, position: "relative" }}
  />
</div>

  );
}
