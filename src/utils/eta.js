import { segmentNm, KM_PER_NM } from './distance'

export const DEFAULT_SPEED_KN = 10

// Segment speeds are always stored in knots; these only convert for display/input.
export function knToKmh(kn) {
  return kn * KM_PER_NM
}

export function kmhToKn(kmh) {
  return kmh / KM_PER_NM
}

// A recorded actual arrival ("HH:MM") overrides the predicted time for that
// point; later points then compute forward from the actual value instead.
// Since the input has no date, pick whichever day (previous/same/next)
// lands closest to what was predicted, so overnight legs don't jump a day.
function applyActualArrival(pt, predicted) {
  const raw = pt?.actualArrival
  if (raw === undefined || raw === null || raw === '') return predicted
  const [hStr, mStr] = raw.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return predicted
  const timeOfDay = h * 60 + m
  if (predicted == null) return timeOfDay

  const dayBase = Math.floor(predicted / 1440) * 1440
  let best = dayBase + timeOfDay
  for (const candidate of [best - 1440, best + 1440]) {
    if (Math.abs(candidate - predicted) < Math.abs(best - predicted)) best = candidate
  }
  return best
}

export function computeETAs(points, speeds, departureTime) {
  if (!departureTime || points.length < 1) return []
  const [hStr, mStr] = departureTime.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return []

  const times = [h * 60 + m]
  for (let i = 0; i + 1 < points.length; i++) {
    const prev = times[i]
    if (prev == null) { times.push(null); continue }
    const raw = speeds?.[i]
    const spd = (raw === undefined || raw === null) ? DEFAULT_SPEED_KN : parseFloat(raw)
    let predicted = null
    if (spd && spd > 0) {
      const dist = segmentNm(points[i], points[i + 1])
      const stopMin = points[i].type === 'stop' ? (parseFloat(points[i].stopDuration) || 0) : 0
      predicted = prev + stopMin + (dist / spd) * 60
    }
    times.push(applyActualArrival(points[i + 1], predicted))
  }
  return times
}

export function fmtTime(minutes) {
  if (minutes == null || isNaN(minutes)) return '—'
  const total = Math.round(minutes)
  const days = Math.floor(total / 1440)
  const rem = ((total % 1440) + 1440) % 1440
  const h = String(Math.floor(rem / 60)).padStart(2, '0')
  const min = String(rem % 60).padStart(2, '0')
  return days > 0 ? `+${days}d ${h}:${min}` : `${h}:${min}`
}

export function fmtDuration(minutes) {
  if (minutes == null || minutes <= 0) return null
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m} min`
  return `${h}h ${String(m).padStart(2, '0')}min`
}
