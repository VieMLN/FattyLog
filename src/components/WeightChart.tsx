import React, { useMemo, useRef, useState, useEffect } from 'react';
import { DayStat } from '../types';

/**
 * Props for the WeightChart SVG graph component.
 */
interface WeightChartProps {
  statsData: DayStat[];
}

/**
 * Responsive vector line chart displaying 7-day weight fluctuations with data points and axis markers.
 */
export const WeightChart: React.FC<WeightChartProps> = ({ statsData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(300);
  const chartHeight = 100;

  // Track responsive container width dynamically
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Filter valid numerical weights in the 7-day window
  const validWeights = useMemo(
    () => statsData.map((d) => d.weight).filter((w): w is number => w !== null),
    [statsData]
  );

  // Empty state fallback when no data has been logged
  if (validWeights.length === 0) {
    return (
      <div className="py-6 px-4 text-center">
        <p className="text-slate-400 text-xs">
          Trage Gewichtsdaten ein, um den Verlauf zu sehen.
        </p>
      </div>
    );
  }

  // Min, Max, and Dynamic Range calculation
  const min = Math.min(...validWeights);
  const max = Math.max(...validWeights);
  const range = max - min === 0 ? 1 : max - min;

  // Calculate SVG X and Y coordinates for each day
  const numDays = statsData.length || 1;
  const colWidth = containerWidth / numDays;

  const points = statsData.map((item, idx) => {
    const x = colWidth * idx + colWidth / 2;
    let y: number | null = null;
    if (item.weight !== null) {
      // Y-axis: Top padding 20px, Bottom padding 20px
      const ratio = (item.weight - min) / range;
      y = chartHeight - 20 - ratio * (chartHeight - 40);
    }
    return { ...item, x, y };
  });

  return (
    <div ref={containerRef} className="w-full py-2 select-none">
      {/* Chart Canvas Area */}
      <div className="relative w-full" style={{ height: chartHeight }}>
        <svg className="w-full h-full overflow-visible">
          {/* Background grid lines */}
          <line
            x1="0"
            y1={chartHeight - 20}
            x2={containerWidth}
            y2={chartHeight - 20}
            stroke="#f1f5f9"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="20"
            x2={containerWidth}
            y2="20"
            stroke="#f1f5f9"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Line segments connecting points */}
          {points.map((p1, idx) => {
            if (idx === points.length - 1) return null;
            const p2 = points[idx + 1];
            if (p1.y !== null && p2.y !== null) {
              return (
                <line
                  key={`line-${idx}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              );
            }
            return null;
          })}

          {/* Dots and Labels */}
          {points.map((p, idx) => {
            if (p.y === null || p.weight === null) return null;
            return (
              <g key={`point-${idx}`}>
                {/* Weight value above point */}
                <text
                  x={p.x}
                  y={p.y - 8}
                  textAnchor="middle"
                  className="fill-blue-600 font-bold text-[10px]"
                >
                  {p.weight}
                </text>
                {/* White outer circle */}
                <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
                {/* Center dot */}
                <circle cx={p.x} cy={p.y} r="2.5" fill="#2563eb" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* X-Axis Days Labels */}
      <div className="flex justify-between border-t border-slate-100 pt-2 mt-1">
        {statsData.map((item, idx) => (
          <div key={idx} className="flex-1 text-center">
            <span className="text-[11px] text-slate-500 font-medium">
              {item.dayLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

