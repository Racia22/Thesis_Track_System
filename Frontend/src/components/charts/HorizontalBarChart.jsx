import { useState } from 'react'
import { computeTicks, roundedRightRectPath } from './chartUtils'

const WIDTH = 640
const ROW_HEIGHT = 36
const MARGIN = { top: 8, right: 40, bottom: 28, left: 140 }
const BAR_COLOR = '#FF6B35'
const BAR_COLOR_HOVER = '#e35a28'

export default function HorizontalBarChart({ data, valueSuffix = '', formatValue }) {
  const [hoverIndex, setHoverIndex] = useState(null)

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const plotHeight = data.length * ROW_HEIGHT
  const height = plotHeight + MARGIN.top + MARGIN.bottom
  const maxValue = Math.max(...data.map((d) => d.value), 0)
  const { ticks, niceMax } = computeTicks(maxValue, 3)

  const barHeight = Math.min(ROW_HEIGHT * 0.55, 22)
  const format = formatValue ?? ((v) => `${v}${valueSuffix}`)

  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No data yet.</p>
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" role="img" aria-label="Horizontal bar chart">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {ticks.map((tick) => {
            const x = niceMax > 0 ? (tick / niceMax) * plotWidth : 0
            return (
              <g key={tick}>
                <line x1={x} x2={x} y1={0} y2={plotHeight} stroke="#e5e7eb" strokeWidth={1} />
                <text x={x} y={plotHeight + 16} textAnchor="middle" className="fill-gray-400" fontSize={11}>
                  {tick}
                </text>
              </g>
            )
          })}

          {data.map((d, i) => {
            const barWidth = niceMax > 0 ? (d.value / niceMax) * plotWidth : 0
            const y = i * ROW_HEIGHT + (ROW_HEIGHT - barHeight) / 2
            const isHovered = hoverIndex === i

            return (
              <g key={d.label}>
                <text x={-12} y={i * ROW_HEIGHT + ROW_HEIGHT / 2} textAnchor="end" dominantBaseline="middle" className="fill-[#1A1A2E]" fontSize={12}>
                  {d.label}
                </text>
                {d.value > 0 && (
                  <path d={roundedRightRectPath(0, y, barWidth, barHeight, 4)} fill={isHovered ? BAR_COLOR_HOVER : BAR_COLOR} />
                )}
                <text x={barWidth + 8} y={i * ROW_HEIGHT + ROW_HEIGHT / 2} dominantBaseline="middle" className="fill-[#1A1A2E]" fontSize={12} fontWeight={600}>
                  {format(d.value)}
                </text>
                <rect
                  x={0}
                  y={i * ROW_HEIGHT}
                  width={plotWidth + MARGIN.right}
                  height={ROW_HEIGHT}
                  fill="transparent"
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              </g>
            )
          })}
        </g>
      </svg>

      {hoverIndex !== null && (
        <div
          className="pointer-events-none absolute -translate-y-1/2 rounded-md bg-[#1A1A2E] px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{
            left: `${(MARGIN.left / WIDTH) * 100}%`,
            top: `${((MARGIN.top + hoverIndex * ROW_HEIGHT + ROW_HEIGHT / 2) / height) * 100}%`,
          }}
        >
          <p className="font-semibold">{data[hoverIndex].label}</p>
          <p className="text-white/70">{format(data[hoverIndex].value)}</p>
        </div>
      )}
    </div>
  )
}
