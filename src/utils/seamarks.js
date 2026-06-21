const CACHE_KEY = 'bay-nav-seamarks-v2'
const CACHE_TTL = 24 * 60 * 60 * 1000

// Combined bbox: Zatoka Gdańska + Pętla Żuławska (south, west, north, east)
const BBOX = '53.8,18.3,54.9,19.95'

const OVERPASS_QUERY = `[out:json][timeout:60];
(
  node["seamark:type"](${BBOX});
  way["seamark:type"](${BBOX});
  node["waterway"="lock"](${BBOX});
  way["waterway"="lock"](${BBOX});
  node["waterway"="lock_gate"](${BBOX});
);
out body geom;`

function centroid(coords) {
  const n = coords.length
  return [
    coords.reduce((s, c) => s + c[0], 0) / n,
    coords.reduce((s, c) => s + c[1], 0) / n,
  ]
}

function osmToGeoJSON(response) {
  const features = []

  for (const el of response.elements) {
    const tags = el.tags || {}
    const featureType = tags['seamark:type']
      ? 'seamark'
      : tags.waterway === 'lock_gate' ? 'lock_gate'
      : tags.waterway === 'lock' ? 'lock'
      : 'seamark'
    const props = { ...tags, _featureType: featureType }

    if (el.type === 'node') {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [el.lon, el.lat] },
        properties: props,
      })
    } else if (el.type === 'way' && el.geometry?.length > 2) {
      const coords = el.geometry.map(p => [p.lon, p.lat])
      const first = coords[0], last = coords[coords.length - 1]
      if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first)
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: props,
      })
      if (featureType === 'lock') {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: centroid(coords.slice(0, -1)) },
          properties: { ...props, _featureType: 'lock_centroid' },
        })
      }
    }
  }

  return { type: 'FeatureCollection', features }
}

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

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: OVERPASS_QUERY,
  })
  if (!res.ok) throw new Error(`Overpass error ${res.status}`)

  const json = await res.json()
  const data = osmToGeoJSON(json)

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
  } catch {}

  return data
}
