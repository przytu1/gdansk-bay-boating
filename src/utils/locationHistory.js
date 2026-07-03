const LOCATION_HISTORY_KEY = 'bay-nav-location-history'
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const MAX_POINTS = 50000

export function loadLocationHistory() {
  try {
    return JSON.parse(localStorage.getItem(LOCATION_HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveLocationHistory(history) {
  try {
    localStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(history))
  } catch {
    const trimmed = history.slice(Math.floor(history.length / 2))
    try { localStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(trimmed)) } catch {}
  }
}

export function addPosition(history, pos) {
  const cutoff = Date.now() - MAX_AGE_MS
  let next = history.filter(p => p.ts >= cutoff)
  next.push(pos)
  if (next.length > MAX_POINTS) next = next.slice(next.length - MAX_POINTS)
  return next
}

export function filterByRange(history, startTs, endTs) {
  return history.filter(p => p.ts >= startTs && p.ts <= endTs)
}
