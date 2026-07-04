const STORAGE_KEY = 'bay-nav-user-locks-v1'

// Coordinates verified against OpenStreetMap (Overpass + Nominatim, June 2026).
// Operating hours, VHF channels and phone numbers verified against the official
// RZGW Gdańsk (Wody Polskie) 2026 navigation-season notice, Gdański Zarząd Dróg,
// and Pętla Żuławska waterway guides (July 2026) — none of these locks/bridges
// open freely "on demand" at any time; each runs a published lockage schedule.
export const BUILT_IN_LOCKS = [
  {
    id: 'builtin-nowy-swiat',
    name: 'Śluza Nowy Świat',
    subtitle: 'Przekop Mierzei Wiślanej',
    type: 'lock',
    info: 'Czynna wg harmonogramu (NIE 24/7) – 8 śluzowań/dobę, cały rok\nZ Zalewu na Zatokę: 7:30, 10:30, 13:30, 16:30\nZ Zatoki na Zalew: 9:00, 12:00, 15:00, 17:45\nZgłoszenie z wyprzedzeniem, przybycie 30 min przed terminem\nVHF: kanał 68 (obowiązkowy)\nTel: +48 58 347 39 72\nKomora: 100 m × 16 m, min. głębokość 5,0 m',
    lng: 19.3120,
    lat: 54.3568,
    _builtin: true,
  },
  {
    id: 'builtin-przegalina',
    name: 'Śluza Przegalina',
    subtitle: 'Martwa Wisła – Przekop Wisły',
    type: 'lock',
    info: 'Czynna: 24.04–04.10 codziennie 7:00–19:00\nPoza sezonem: pn–pt 7:00–15:00 (weekendy nieczynne)\nPoza godzinami: zgłoszenie min. 2 dni robocze wcześniej do 13:00\nTel: (58) 323 93 76, kom. 786 876 453\nŁączy Martwą Wisłę z Przekopem Wisły',
    lng: 18.923385,
    lat: 54.308793,
    _builtin: true,
  },
  {
    id: 'builtin-gdanska-glowa',
    name: 'Śluza Gdańska Głowa',
    subtitle: 'Rzeka Szkarpawa / kanał delta Wisły',
    type: 'lock',
    info: 'Czynna: 24/25.04–04.10 codziennie 7:00–19:00\nPoza sezonem: pn–pt 7:00–15:00, weekendy po uzgodnieniu (do czwartku)\nZalecany telefon ok. 30 min przed przypłynięciem\nTel: +48 55 247 17 07, kom. +48 735 094 723',
    lng: 18.9522,
    lat: 54.2668,
    _builtin: true,
  },
  {
    id: 'builtin-olowianka',
    name: 'Most Stągiewny',
    subtitle: 'Most zwodzony, rzeka Motława – Ołowianka',
    type: 'bridge',
    info: 'Zwodzony wg harmonogramu (nie na żądanie), cały rok\n1 IV–31 X: 8:10, 10:10, 12:10, 14:10, 16:10, 18:10, 20:10\n1 XI–31 III: 10:10, 12:10, 14:10\nZgłoszenie min. 1 h przed, tel. 513 382 832 (całodobowo)\nVHF: kanał 14 lub 15\nObsługa: Gdański Zarząd Dróg',
    lng: 18.6603,
    lat: 54.3474,
    _builtin: true,
  },
  {
    id: 'builtin-most-rybina',
    name: 'Most zwodzony w Rybinie',
    subtitle: 'Rzeka Szkarpawa',
    type: 'bridge',
    info: 'Otwierany wg harmonogramu: 15 IV–15 X godz. 8:00, 9:00, 11:00, 12:00, 13:00, 15:00, 17:00, 19:00, 20:00, 21:30\nPoza sezonem: 9:00, 14:00\nTel: 509 498 395',
    lng: 19.1182,
    lat: 54.2842,
    _builtin: true,
  },
  {
    id: 'builtin-most-czterech-pancernych',
    name: 'Most Czterech Pancernych',
    subtitle: 'Most zwodzony, Sztutowo – Pętla Żuławska',
    type: 'bridge',
    info: 'Otwierany wg harmonogramu: 25 IV–31 VIII godz. 10:00, 12:00, 14:00, 16:00, 18:00\n1 IX–11 X godz. 10:00, 14:00\nPoza terminami: zgłoszenie min. 12 h (dni robocze) / 24 h (weekend) wcześniej\nTel: 784 933 175 (obsługa 7:00–15:00)',
    lng: 19.1812,
    lat: 54.3234,
    _builtin: true,
  },
  {
    id: 'builtin-biala-gora',
    name: 'Śluza Biała Góra',
    subtitle: 'Rzeka Nogat – połączenie z Wisłą',
    type: 'lock',
    info: 'Czynna: 25.04–04.10 codziennie 7:00–19:00 (ostatnie śluzowanie 18:20)\nPoza godzinami (dni robocze): zgłoszenie do 14:00 w dniu śluzowania\nTel: +48 55 277 16 91, kom. 797 511 541\nŁączy Wisłę z rzekami Nogat i Szkarpawa',
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
