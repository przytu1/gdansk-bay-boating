const STORAGE_KEY = 'bay-nav-custom-fuel-v1'

export function loadCustomFuelStations() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

export function saveCustomFuelStations(stations) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stations)) } catch {}
}

export function stationsToGeoJSON(stations) {
  return {
    type: 'FeatureCollection',
    features: stations.map(s => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      properties: { name: s.name, info: s.info, id: s.id },
    })),
  }
}
