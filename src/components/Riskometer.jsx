import React from "react";

    const RISK_LEVELS = [
  { label: "Low", color: "#16a34a" },
   { label: "Low to Moderate", color: "#84cc16" },
  { label: "Moderate", color: "#facc15" },
    { label: "Moderately High", color: "#fb923c" },
  { label: "High", color: "#f97316" },
  { label: "Very High", color: "#dc2626" },
];

const Riskometer = ({ risk = "Moderate" }) => {
     const index = RISK_LEVELS.findIndex(
    (r) => r.label.toLowerCase() === risk.toLowerCase()
  );

  const activeIndex = index === -1 ? 2 : index;

  // -90° → +90°
    const angle = -90 + activeIndex * 34;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* GAUGE */}
      <svg width="220" height="120" viewBox="0 0 220 120">
        {/* ARC */}
            {RISK_LEVELS.map((r, i) => {
          const start = -90 + i * 30;
          const end = start + 30;

          return (
              <path
              key={r.label}
              d={describeArc(110, 110, 90, start, end)}
               fill="none"
              stroke={r.color}
              strokeWidth="14"
                strokeLinecap="butt"
            />
          );
        })}

        {/* NEEDLE */}
        <g transform={`translate(110,110) rotate(${angle})`}>
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-70"
            stroke="currentColor"
            strokeWidth="4"
            className="text-slate-800 dark:text-slate-100"
             />
           <circle
            cx="0"
            cy="0"
              r="5"
            fill="currentColor"
            className="text-slate-800 dark:text-slate-100"
          />
        </g>
      </svg>

      {   /* CURRENT RISK TEXT */}
      <p className="text-sm font-semibold text-slate-900 dark:text-[var(--text-primary)]">
        {RISK_LEVELS[activeIndex].label}
      </p>

      {/* 6 LEVEL LABELS */}
       <div className="grid grid-cols-6 gap-1 text-[10px] text-center max-w-md">
          {RISK_LEVELS.map((r, i) => (
          <div
            key={r.label}
            className={`leading-tight ${
              i === activeIndex
                ? "font-semibold text-slate-900 dark:text-white"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {r.label}
           </div>
        ))}
      </div>

      {/* DISCLAIMER */}
       <p className="text-[10px] text-slate-500 dark:text-[var(--text-secondary)] text-center max-w-sm">
          Riskometer – based on scheme portfolio. Mutual fund investments are
        subject to market risks.
      </p>
    </div>
  );
};

  export default Riskometer;

/* ---------------- SVG HELPERS ---------------- */

      function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
     x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

        function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}
