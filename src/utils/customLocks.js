const STORAGE_KEY = 'bay-nav-user-locks-v1'

// Coordinates verified against OpenStreetMap (Overpass + Nominatim, June 2026)
export const BUILT_IN_LOCKS = [
  {
    id: 'builtin-nowy-swiat',
    name: 'Śluza Nowy Świat',
    subtitle: 'Przekop Mierzei Wiślanej',
    type: 'lock',
    info: 'Czynna całą dobę (24/7)\nVHF: kanał 14\nTel: +48 55 611 08 00\nMinimalna głębokość: 5,0 m\nKomora: 100 m × 16 m',
    lng: 19.3120,
    lat: 54.3568,
    _builtin: true,
  },
  {
    id: 'builtin-przegalina',
    name: 'Śluza Przegalina',
    subtitle: 'Martwa Wisła – Przekop Wisły',
    type: 'lock',
    info: 'Otwierana na żądanie\nVHF: kanał 12\nTel: +48 58 309 20 23\nŁączy Martwą Wisłę z Przekopem Wisły',
    lng: 18.923385,
    lat: 54.308793,
    _builtin: true,
  },
  {
    id: 'builtin-gdanska-glowa',
    name: 'Śluza Gdańska Głowa',
    subtitle: 'Rzeka Szkarpawa / kanał delta Wisły',
    type: 'lock',
    info: 'Otwierana na żądanie\nVHF: kanał 12\nTel: +48 55 278 85 90',
    lng: 18.9522,
    lat: 54.2668,
    _builtin: true,
  },
  {
    id: 'builtin-olowianka',
    name: 'Most Stągiewny',
    subtitle: 'Most zwodzony, rzeka Motława – Ołowianka',
    type: 'bridge',
    info: 'Otwieranie na żądanie (sezon maj–wrzesień)\nGodziny obsługi: 8:00–22:00\nTel: +48 58 301 80 00\nWymaga wcześniejszego zgłoszenia',
    lng: 18.6603,
    lat: 54.3474,
    _builtin: true,
  },
  {
    id: 'builtin-most-rybina',
    name: 'Most zwodzony – Tujsk',
    subtitle: 'Rzeka Szkarpawa (okolice Rybiny)',
    type: 'bridge',
    info: 'Otwieranie na żądanie\nTel: +48 55 278 85 90\nZgłoszenie co najmniej 30 min wcześniej',
    lng: 19.1182,
    lat: 54.2842,
    _builtin: true,
  },
  {
    id: 'builtin-most-czterech-pancernych',
    name: 'Most Czterech Pancernych',
    subtitle: 'Most zwodzony, Pętla Żuławska',
    type: 'bridge',
    info: 'Otwieranie na żądanie\nTel: +48 55 278 85 90',
    lng: 19.1812,
    lat: 54.3234,
    _builtin: true,
  },
  {
    id: 'builtin-biala-gora',
    name: 'Śluza Biała Góra',
    subtitle: 'Rzeka Nogat – połączenie z Wisłą',
    type: 'lock',
    info: 'Otwierana na żądanie (całą dobę w sezonie)\nVHF: kanał 12\nTel: +48 55 272 04 41\nŁączy Wisłę z rzekami Nogat i Szkarpawa',
    lng: 18.8838,
    lat: 53.9141,
    _builtin: true,
  },
]

export function loadUserLocks() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

export function saveUserLocks(locks) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(locks)) } catch {}
}

export function locksToGeoJSON(locks) {
  return {
    type: 'FeatureCollection',
    features: (locks || []).map(s => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lng ?? 0, s.lat ?? 0] },
      properties: {
        name: s.name || '',
        subtitle: s.subtitle || '',
        type: s.type || 'lock',
        info: s.info || '',
        id: s.id || '',
        _builtin: s._builtin ? 'true' : 'false',
      },
    })),
  }
}
