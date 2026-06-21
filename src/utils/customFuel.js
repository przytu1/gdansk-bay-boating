const STORAGE_KEY = 'bay-nav-custom-fuel-v1'

export function loadCustomFuelStations() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

export function saveCustomFuelStations(stations) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stations)) } catch {}
}

export function stationsToGeoJSON(stations) {
  return {
    type: 'FeatureCollection',
    features: (stations || []).map(s => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lng ?? 0, s.lat ?? 0] },
      properties: { name: s.name || '', info: s.info || '', id: s.id || '' },
    })),
  }
}
