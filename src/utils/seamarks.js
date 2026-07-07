const CACHE_KEY = 'bay-nav-seamarks-v2'
const CACHE_TTL = 24 * 60 * 60 * 1000

export function getSeamarksCacheInfo() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (!cached) return null
    return { timestamp: cached.ts, count: cached.data?.features?.length ?? 0 }
  } catch {
    return null
  }
}

export function clearSeamarksCache() {
  localStorage.removeItem(CACHE_KEY)
}

export async function fetchSeamarks() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data
  } catch {}

  const res = await fetch('/seamarks.json')
  if (!res.ok) throw new Error(`Seamarks data error ${res.status}`)

  const data = await res.json()

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
  } catch {}

  return data
}
