import { segmentNm } from './distance'

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
    const spd = parseFloat(speeds?.[i])
    if (!spd || spd <= 0) { times.push(null); continue }
    const dist = segmentNm(points[i], points[i + 1])
    const stopMin = points[i].type === 'stop' ? (parseFloat(points[i].stopDuration) || 0) : 0
    times.push(prev + stopMin + (dist / spd) * 60)
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
