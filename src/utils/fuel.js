const CACHE_KEY = 'bay-nav-fuel-v2'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000

const BBOX = '53.8,18.3,54.9,19.95'

const OVERPASS_QUERY = `[out:json][timeout:30];
(
  node["amenity"="fuel"]["motorboat"](${BBOX});
  node["amenity"="fuel"]["boat"](${BBOX});
  node["amenity"="fuel"]["ship"](${BBOX});
  node["seamark:type"="fuel_station"](${BBOX});
  node["waterway"="fuel"](${BBOX});
  way["amenity"="fuel"]["motorboat"](${BBOX});
  way["amenity"="fuel"]["boat"](${BBOX});
  way["seamark:type"="fuel_station"](${BBOX});
);
out center;`

function osmToGeoJSON(response) {
  const features = []
  for (const el of response.elements) {
    let coords
    if (el.type === 'node') coords = [el.lon, el.lat]
    else if (el.type === 'way' && el.center) coords = [el.center.lon, el.center.lat]
    if (!coords) continue
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coords },
      properties: el.tags || {},
    })
  }
  return { type: 'FeatureCollection', features }
}

export async function fetchFuelStations() {
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
