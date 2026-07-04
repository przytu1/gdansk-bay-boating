import { segmentKm } from './distance'

function applyOverride(pt, level) {
  if (pt?.type === 'stop' && pt.fuelOverride !== '' && pt.fuelOverride != null) {
    const ov = parseFloat(pt.fuelOverride)
    if (!isNaN(ov)) return ov
  }
  return level
}

// Returns an array parallel to `points`: the fuel level (in litres) at each
// point, after any manual refuel override recorded at a "Postój" point.
export function computeFuelLevels(points, fuelStart, consumptionPer100km) {
  if (points.length < 1) return []
  const startLevel = parseFloat(fuelStart)
  if (isNaN(startLevel)) return []
  const cons = parseFloat(consumptionPer100km)

  const levels = [applyOverride(points[0], startLevel)]
  for (let i = 0; i + 1 < points.length; i++) {
    const prevLevel = levels[i]
    if (prevLevel == null) { levels.push(null); continue }
    const dist = segmentKm(points[i], points[i + 1])
    const used = (!isNaN(cons) && cons > 0) ? (dist / 100) * cons : null
    const depleted = used != null ? prevLevel - used : null
    levels.push(depleted == null ? null : applyOverride(points[i + 1], depleted))
  }
  return levels
}
