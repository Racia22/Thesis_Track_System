import { useState } from 'react'
import { CHART_COLORS, computeTicks, roundedTopRectPath } from './chartUtils'

const HEIGHT = 260
const MARGIN = { top: 24, right: 16, bottom: 44, left: 36 }
const BAR_GAP = 3

const DEFAULT_SERIES = [{ key: 'value', label: 'Value', color: CHART_COLORS.primary, hover: CHART_COLORS.primaryHover }]

/**
 * Bar chart over categories. The SVG scales to its container, so pass `width` close to the
 * rendered width to keep label text near its nominal size. Pass `series` to draw grouped bars: each series reads
 * `datum[series.key]`; the default single series reads `datum.value`.
 */
export default function VerticalBarChart({ data, series = DEFAULT_SERIES, valueSuffix = '', formatValue, width: WIDTH = 640 }) {
  const [hoverIndex, setHoverIndex] = useState(null)

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const maxValue = Math.max(...data.flatMap((d) => series.map((s) => d[s.key] ?? 0)), 0)
  const { ticks, niceMax } = computeTicks(maxValue)

  const slotWidth = plotWidth / data.length
  const groupWidth = Math.min(slotWidth * (series.length > 1 ? 0.7 : 0.5), series.length > 1 ? 56 : 40)
  const barWidth = (groupWidth - BAR_GAP * (series.length - 1)) / series.length

  const format = formatValue ?? ((v) => `${v}${valueSuffix}`)
  const showLegend = series.length > 1

  return (
    <div>
      {showLegend && (
        <div className="mb-3 flex flex-wrap gap-4">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Bar chart">
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {ticks.map((tick) => {
              const y = plotHeight - (tick / niceMax) * plotHeight
              return (
                <g key={tick}>
                  <line x1={0} x2={plotWidth} y1={y} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray={tick === 0 ? undefined : '3 3'} />
                  <text x={-8} y={y} textAnchor="end" dominantBaseline="middle" fill="#94a3b8" fontSize={11}>
                    {tick}
                  </text>
                </g>
              )
            })}

            {data.map((d, i) => {
              const groupX = i * slotWidth + (slotWidth - groupWidth) / 2
              const isHovered = hoverIndex === i
              const words = d.label.split(' ')

              return (
                <g key={d.label}>
                  {isHovered && (
                    <rect x={i * slotWidth + 2} y={0} width={slotWidth - 4} height={plotHeight} fill="#f1f5f9" rx={4} />
                  )}
                  {series.map((s, si) => {
                    const value = d[s.key] ?? 0
                    const barHeight = niceMax > 0 ? (value / niceMax) * plotHeight : 0
                    const x = groupX + si * (barWidth + BAR_GAP)
                    const y = plotHeight - barHeight
                    return (
                      <g key={s.key}>
                        {value > 0 && (
                          <path d={roundedTopRectPath(x, y, barWidth, barHeight, 3)} fill={isHovered ? s.hover ?? s.color : s.color} />
                        )}
                        {value > 0 && !showLegend && (
                          <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fill="#0f172a" fontSize={11} fontWeight={600}>
                            {format(value)}
                          </text>
                        )}
                      </g>
                    )
                  })}
                  <text x={i * slotWidth + slotWidth / 2} y={plotHeight + 16} textAnchor="middle" fill="#64748b" fontSize={10}>
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
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
            style={{
              left: `${((MARGIN.left + hoverIndex * slotWidth + slotWidth / 2) / WIDTH) * 100}%`,
              top: `${((MARGIN.top - 6) / HEIGHT) * 100}%`,
            }}
          >
            <p className="mb-1 font-semibold">{data[hoverIndex].label}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center gap-1.5 whitespace-nowrap text-white/80">
                {showLegend && <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />}
                {showLegend && `${s.label}: `}
                <span className="font-medium text-white">{format(data[hoverIndex][s.key] ?? 0)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
