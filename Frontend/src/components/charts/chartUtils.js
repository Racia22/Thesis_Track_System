export const CHART_COLORS = {
  primary: '#2557d6',
  primaryHover: '#1d45b0',
  secondary: '#93b4fd',
  secondaryHover: '#608bfa',
}

export function niceNumber(value) {
  if (value <= 0) return 1
  const exponent = Math.floor(Math.log10(value))
  const fraction = value / 10 ** exponent
  let niceFraction
  if (fraction <= 1) niceFraction = 1
  else if (fraction <= 2) niceFraction = 2
  else if (fraction <= 5) niceFraction = 5
  else niceFraction = 10
  return niceFraction * 10 ** exponent
}

export function computeTicks(maxValue, tickCount = 4) {
  const niceMax = niceNumber(Math.max(maxValue, 1))
  const step = niceNumber(niceMax / tickCount) || 1
  const ticks = []
  for (let t = 0; t <= niceMax + step / 2; t += step) {
    ticks.push(Math.round(t * 10) / 10)
  }
  return { ticks, niceMax: ticks[ticks.length - 1] }
}

export function roundedTopRectPath(x, y, width, height, radius) {
  if (height <= 0) return ''
  const r = Math.min(radius, width / 2, height)
  return [
    `M${x},${y + height}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${y + height}`,
    'Z',
  ].join(' ')
}

export function roundedRightRectPath(x, y, width, height, radius) {
  if (width <= 0) return ''
  const r = Math.min(radius, width, height / 2)
  return [
    `M${x},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${y + height - r}`,
    `Q${x + width},${y + height} ${x + width - r},${y + height}`,
    `L${x},${y + height}`,
    'Z',
  ].join(' ')
}
