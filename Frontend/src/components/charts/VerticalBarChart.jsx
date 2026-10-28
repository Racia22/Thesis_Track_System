import { useState } from 'react'
import { computeTicks, roundedTopRectPath } from './chartUtils'

const WIDTH = 640
const HEIGHT = 260
const MARGIN = { top: 24, right: 16, bottom: 44, left: 36 }
const BAR_COLOR = '#FF6B35'
const BAR_COLOR_HOVER = '#e35a28'

export default function VerticalBarChart({ data, valueSuffix = '', formatValue }) {
  const [hoverIndex, setHoverIndex] = useState(null)

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const maxValue = Math.max(...data.map((d) => d.value), 0)
  const { ticks, niceMax } = computeTicks(maxValue)

  const slotWidth = plotWidth / data.length
  const barWidth = Math.min(slotWidth * 0.5, 40)

  const format = formatValue ?? ((v) => `${v}${valueSuffix}`)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Bar chart">
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {ticks.map((tick) => {
            const y = plotHeight - (tick / niceMax) * plotHeight
            return (
              <g key={tick}>
                <line x1={0} x2={plotWidth} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={1} />
                <text x={-8} y={y} textAnchor="end" dominantBaseline="middle" className="fill-gray-400" fontSize={11}>
                  {tick}
                </text>
              </g>
            )
          })}

          {data.map((d, i) => {
            const barHeight = niceMax > 0 ? (d.value / niceMax) * plotHeight : 0
            const x = i * slotWidth + (slotWidth - barWidth) / 2
            const y = plotHeight - barHeight
            const isHovered = hoverIndex === i
            const words = d.label.split(' ')

            return (
              <g key={d.label}>
                {d.value > 0 && (
                  <path d={roundedTopRectPath(x, y, barWidth, barHeight, 4)} fill={isHovered ? BAR_COLOR_HOVER : BAR_COLOR} />
                )}
                {d.value > 0 && (
                  <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className="fill-[#1A1A2E]" fontSize={11} fontWeight={600}>
                    {format(d.value)}
                  </text>
                )}
                <text x={i * slotWidth + slotWidth / 2} y={plotHeight + 16} textAnchor="middle" className="fill-gray-500" fontSize={10}>
                  {words.map((word, wi) => (
                    <tspan key={wi} x={i * slotWidth + slotWidth / 2} dy={wi === 0 ? 0 : 11}>
                      {word}
                    </tspan>
                  ))}
                </text>
                <rect
                  x={i * slotWidth}
                  y={0}
                  width={slotWidth}
                  height={plotHeight}
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
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md bg-[#1A1A2E] px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{
            left: `${((MARGIN.left + hoverIndex * slotWidth + slotWidth / 2) / WIDTH) * 100}%`,
            top: `${((MARGIN.top - 10) / HEIGHT) * 100}%`,
          }}
        >
          <p className="font-semibold">{format(data[hoverIndex].value)}</p>
          <p className="text-white/70">{data[hoverIndex].label}</p>
        </div>
      )}
    </div>
  )
}
