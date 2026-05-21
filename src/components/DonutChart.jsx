import React from 'react'

const DonutChart = ({data, hoverIndex, setHoverIndex}) => {
    // TOTAL PERCENT
  const total = data.reduce((a, b) => a + b.value, 0);

  // SVG setup
  const radius = 70;
  const strokeWidth = 25;
  let cumulative = 0;

  return (
    <div className="relative w-88 h-58 flex items-center justify-center">
        <svg width="180" height="170" viewBox="0 0 200 200">
          <g transform="rotate(-90 100 100)">
            {data.map((item, index) => {
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
                  stroke={item.color}
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
          ₹32,710Cr
        </div>
      </div>
  )
}

export default DonutChart