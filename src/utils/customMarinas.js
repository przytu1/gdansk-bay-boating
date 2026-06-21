const STORAGE_KEY = 'bay-nav-user-marinas-v1'

export const BUILT_IN_MARINAS = [
  {
    id: 'builtin-marina-gdansk',
    name: 'Marina Gdańsk',
    info: 'Przystań jachtowa przy Motławie w centrum Gdańska\nMiejsca cumownicze, prąd, woda',
    lat: 54.3490, lng: 18.6540, _builtin: true,
  },
  {
    id: 'builtin-marina-sopot',
    name: 'Marina Sopot',
    info: 'Przystań jachtowa w Sopocie\nMiejsca cumownicze, prąd, woda',
    lat: 54.4408, lng: 18.5682, _builtin: true,
  },
  {
    id: 'builtin-marina-gdynia',
    name: 'Marina Gdynia',
    info: 'Główna marina Gdyni przy nabrzeżu Śródmieścia\nPełne usługi serwisowe, tankowanie',
    lat: 54.5143, lng: 18.5395, _builtin: true,
  },
  {
    id: 'builtin-marina-puck',
    name: 'Marina Puck',
    info: 'Przystań jachtowa w Pucku na Zatoce Puckiej\nMiejsca cumownicze, zaplecze sanitarne',
    lat: 54.7228, lng: 18.4155, _builtin: true,
  },
  {
    id: 'builtin-port-wladyslawowo',
    name: 'Port Władysławowo',
    info: 'Port rybacko-jachtowy u nasady Półwyspu Helskiego\nSchronienie przed sztormem, cumowanie jachtów',
    lat: 54.7958, lng: 18.4201, _builtin: true,
  },
  {
    id: 'builtin-przestan-rewa',
    name: 'Przystań Rewa',
    info: 'Mała przystań jachtowa przy wejściu do Zatoki Puckiej',
    lat: 54.6183, lng: 18.5239, _builtin: true,
  },
  {
    id: 'builtin-marina-jastarnia',
    name: 'Marina Jastarnia',
    info: 'Przystań jachtowa w Jastarni\nCiche miejsce na Zatoce Puckiej, media, zaplecze',
    lat: 54.6964, lng: 18.6789, _builtin: true,
  },
  {
    id: 'builtin-marina-hel',
    name: 'Marina Hel',
    info: 'Przystań jachtowa na końcu Półwyspu Helskiego\nMiejsca cumownicze, media',
    lat: 54.6042, lng: 18.8007, _builtin: true,
  },
  {
    id: 'builtin-mikoszewo',
    name: 'Przystań Mikoszewo',
    info: 'Przystań na ujściu Przekopu Wisły\nPunkt wejścia z Zatoki Gdańskiej na Pętlę Żuławską',
    lat: 54.3534, lng: 18.9184, _builtin: true,
  },
  {
    id: 'builtin-nowy-dwor-gdanski',
    name: 'Przystań Nowy Dwór Gdański',
    info: 'Przystań na Pętli Żuławskiej (Nogat/Szkarpawa)\nPunkt bazowy do eksploracji Żuław',
    lat: 54.2134, lng: 19.1204, _builtin: true,
  },
  {
    id: 'builtin-port-elblag',
    name: 'Port Elbląg',
    info: 'Port na rzece Elbląg – brama do Pętli Żuławskiej i Zalewu Wiślanego\nCumowanie, zaplecze, serwis',
    lat: 54.1556, lng: 19.4077, _builtin: true,
  },
  {
    id: 'builtin-tolkmicko',
    name: 'Przystań Tolkmicko',
    info: 'Przystań jachtowa na Zalewie Wiślanym\nMiejsca cumownicze, zaplecze',
    lat: 54.3211, lng: 19.5320, _builtin: true,
  },
  {
    id: 'builtin-frombork',
    name: 'Marina Frombork',
    info: 'Przystań na Zalewie Wiślanym, przy katedrze Kopernika\nCumowanie, zaplecze podstawowe',
    lat: 54.3590, lng: 19.6803, _builtin: true,
  },
  {
    id: 'builtin-krynica-morska',
    name: 'Przystań Krynica Morska',
    info: 'Przystań na Mierzei Wiślanej\nMiejsca cumownicze na Zalewie Wiślanym',
    lat: 54.3878, lng: 19.4529, _builtin: true,
  },
]

export function loadUserMarinas() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

export function saveUserMarinas(marinas) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(marinas)) } catch {}
}

export function marinasToGeoJSON(marinas) {
  return {
    type: 'FeatureCollection',
    features: (marinas || []).map(m => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [m.lng ?? 0, m.lat ?? 0] },
      properties: { name: m.name || '', info: m.info || '', id: m.id || '', _builtin: m._builtin ? 'true' : '' },
    })),
  }
}
