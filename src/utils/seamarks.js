const CACHE_KEY = 'bay-nav-seamarks-v1'
const CACHE_TTL = 24 * 60 * 60 * 1000

// Gdańsk Bay bounding box: south, west, north, east
const BBOX = '54.2,18.3,54.9,19.2'

const OVERPASS_QUERY = `[out:json][timeout:30];
(
  node["seamark:type"](${BBOX});
  way["seamark:type"](${BBOX});
);
out body geom;`

function osmToGeoJSON(response) {
  const features = []

  for (const el of response.elements) {
    if (el.type === 'node') {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [el.lon, el.lat] },
        properties: el.tags || {},
      })
    } else if (el.type === 'way' && el.geometry?.length > 2) {
      const coords = el.geometry.map(p => [p.lon, p.lat])
      const first = coords[0], last = coords[coords.length - 1]
      if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first)
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: el.tags || {},
      })
    }
  }

  return { type: 'FeatureCollection', features }
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
