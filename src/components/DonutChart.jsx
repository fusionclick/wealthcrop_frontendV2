import React from 'react'

/**
 * Slice colours, used by the donut AND by whatever renders its legend, so the two cannot
 * drift apart. Callers that carry their own `color` still win.
 *
 * This exists because every caller passes backend data — `{name, value}` with no colour —
 * so `stroke` was undefined and the whole donut drew invisible arcs. It was never seen,
 * because the only data that reaches it is an AMC disclosure and no scheme had one.
 */
export const SLICE_COLORS = [
  "#2563eb", "#059669", "#d97706", "#db2777", "#7c3aed",
  "#0891b2", "#ca8a04", "#dc2626", "#4f46e5", "#15803d",
];

export const sliceColor = (item, index) => item?.color || SLICE_COLORS[index % SLICE_COLORS.length];

const DonutChart = ({data, hoverIndex, setHoverIndex, center}) => {
    // TOTAL PERCENT
  const total = (data || []).reduce((a, b) => a + b.value, 0);

  // SVG setup
  const radius = 70;
  const strokeWidth = 25;
  let cumulative = 0;

  return (
    <div className="relative w-88 h-58 flex items-center justify-center">
        <svg width="180" height="170" viewBox="0 0 200 200">
          <g transform="rotate(-90 100 100)">
            {(data || []).map((item, index) => {
              const angle = (item.value / total) * 360;
              const startAngle = cumulative;
              const endAngle = cumulative + angle;
              cumulative += angle;

              const largeArc = angle > 180 ? 1 : 0;

              const x1 = 100 + radius * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 100 + radius * Math.sin((Math.PI * startAngle) / 180);

              const x2 = 100 + radius * Math.cos((Math.PI * endAngle) / 180);
              const y2 = 100 + radius * Math.sin((Math.PI * endAngle) / 180);

              const isActive = index === hoverIndex;

              return (
                <path
                  key={index}
                  d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                  stroke={sliceColor(item, index)}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="butt"
                  className={`transition-opacity duration-300 cursor-pointer 
                      ${hoverIndex === null || isActive ? "opacity-100" : "opacity-20"}
                    `}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              );
            })}
          </g>
        </svg>

        {/* CENTER VALUE */}
        <div className="absolute text-lg font-semibold dark:text-[var(--text-secondary)]">
          {center || ""}
        </div>
      </div>
  )
}

export default DonutChart