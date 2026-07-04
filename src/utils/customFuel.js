const STORAGE_KEY = 'bay-nav-custom-fuel-v1'

// Coordinates given as degrees + decimal minutes (DMM) by the user, converted
// to decimal degrees at 6 decimal places (~0.11 m precision), July 2026.
export const BUILT_IN_FUEL_STATIONS = [
  {
    id: 'builtin-mol-gdansk',
    name: 'MOL Gdańsk',
    info: 'Stacja paliw wodnych – Marina Gdańsk\nOlej napędowy, benzyna\nGodziny: 8:00–20:00, 7 dni w tygodniu',
    lat: 54.354302, lng: 18.665888, _builtin: true,
  },
  {
    id: 'builtin-orlen-gdynia',
    name: 'Orlen Gdynia',
    info: 'Stacja paliw wodnych – Marina Gdynia\nOlej napędowy, benzyna\nGodziny: 8:00–20:00, 7 dni w tygodniu',
    lat: 54.517703, lng: 18.554828, _builtin: true,
  },
  {
    id: 'builtin-orlen-puck',
    name: 'Orlen Puck',
    info: 'Stacja paliw wodnych – Marina Puck\nOlej napędowy, benzyna\nGodziny: 9:00–18:00, 7 dni w tygodniu',
    lat: 54.722590, lng: 18.417313, _builtin: true,
  },
  {
    id: 'builtin-stacja-tolkmicko',
    name: 'Stacja paliw Tolkmicko',
    info: 'Stacja paliw – Przystań Tolkmicko, Zalew Wiślany\nPon–Pt: 6:00–18:00\nSobota: 7:00–16:00\nNiedziela: 8:00–15:00',
    lat: 54.320973, lng: 19.523145, _builtin: true,
  },
]

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
      properties: { name: s.name || '', info: s.info || '', id: s.id || '', _builtin: s._builtin ? 'true' : '' },
    })),
  }
}
