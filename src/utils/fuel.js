const CACHE_KEY = 'bay-nav-fuel-v3'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000

const BBOX = '53.8,18.3,54.9,19.95'

const OVERPASS_QUERY = `[out:json][timeout:30];
(
  node["amenity"="fuel"]["motorboat"](${BBOX});
  node["amenity"="fuel"]["boat"](${BBOX});
  node["amenity"="fuel"]["ship"](${BBOX});
  node["waterway"="fuel"](${BBOX});
  way["waterway"="fuel"](${BBOX});
  node["seamark:type"="fuel_station"](${BBOX});
  way["seamark:type"="fuel_station"](${BBOX});
  node["seamark:type"="bunker_station"](${BBOX});
  way["seamark:type"="bunker_station"](${BBOX});
  node["seamark:small_craft_facility:category"~"fuel_station"](${BBOX});
  way["seamark:small_craft_facility:category"~"fuel_station"](${BBOX});
  way["amenity"="fuel"]["motorboat"](${BBOX});
  way["amenity"="fuel"]["boat"](${BBOX});
  node["amenity"="fuel"]["name"~"marina|lotos|orlen|mol|pali",i](${BBOX});
  way["amenity"="fuel"]["name"~"marina|lotos|orlen|mol|pali",i](${BBOX});
);
out center;`

// Known marine fuel stations not yet correctly tagged in OSM.
// Coordinates are approximate marina/dock positions.
// Source: marcinpalacz.pl (verified 2024 season)
const STATIC_FUEL_STATIONS = [
  {
    name: 'Stacja paliw – Marina Gdynia',
    coordinates: [18.541, 54.514],
    tags: {
      operator: 'Lotos',
      phone: '+48 519 075 699',
      opening_hours: 'Maj–Wrz: pn–nd 08:00–20:00',
      'fuel:diesel': 'yes',
      'fuel:petrol': 'yes',
      _source: 'marcinpalacz.pl',
    },
  },
  {
    name: 'Stacja paliw – Marina Puck',
    coordinates: [18.416, 54.723],
    tags: {
      operator: 'Orlen',
      phone: '+48 24 256 49 06',
      opening_hours: 'Maj–Wrz: pn–nd 08:00–20:00',
      'fuel:diesel': 'yes',
      'fuel:petrol': 'yes',
      _source: 'marcinpalacz.pl',
    },
  },
  {
    name: 'Stacja paliw Motława – Gdańsk',
    coordinates: [18.658, 54.349],
    tags: {
      operator: 'MOL',
      phone: '+48 519 076 372',
      opening_hours: 'Maj–Wrz: pn–nd 08:00–20:00',
      'fuel:diesel': 'yes',
      'fuel:petrol': 'yes',
      _source: 'marcinpalacz.pl',
    },
  },
]

// Skip static station if an OSM result is already within ~400m
function isNearAny(coord, features, threshDeg = 0.0036) {
  return features.some(f => {
    const c = f.geometry.coordinates
    return Math.abs(c[0] - coord[0]) < threshDeg && Math.abs(c[1] - coord[1]) < threshDeg
  })
}

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

  for (const s of STATIC_FUEL_STATIONS) {
    if (!isNearAny(s.coordinates, features)) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: s.coordinates },
        properties: { name: s.name, ...s.tags },
      })
    }
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
