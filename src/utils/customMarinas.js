const STORAGE_KEY = 'bay-nav-user-marinas-v1'

export const BUILT_IN_MARINAS = [
  {
    id: 'builtin-marina-gdansk',
    name: 'Marina Gdańsk',
    info: 'Przystań jachtowa przy Motławie w centrum Gdańska\nMiejsca cumownicze, prąd, woda',
    lat: 54.3489, lng: 18.6599, _builtin: true,
  },
  {
    id: 'builtin-marina-sopot',
    name: 'Marina Sopot',
    info: 'Przystań jachtowa w Sopocie\nMiejsca cumownicze, prąd, woda',
    lat: 54.4477, lng: 18.5777, _builtin: true,
  },
  {
    id: 'builtin-marina-gdynia',
    name: 'Marina Gdynia',
    info: 'Główna marina Gdyni przy nabrzeżu Śródmieścia\nPełne usługi serwisowe, tankowanie',
    lat: 54.5170, lng: 18.5526, _builtin: true,
  },
  {
    id: 'builtin-marina-puck',
    name: 'Marina Puck',
    info: 'Przystań jachtowa w Pucku na Zatoce Puckiej\nMiejsca cumownicze, zaplecze sanitarne',
    lat: 54.7238, lng: 18.4128, _builtin: true,
  },
  {
    id: 'builtin-port-wladyslawowo',
    name: 'Port Władysławowo',
    info: 'Port rybacko-jachtowy u nasady Półwyspu Helskiego\nSchronienie przed sztormem, cumowanie jachtów',
    lat: 54.797375, lng: 18.416170, _builtin: true,
  },
  {
    id: 'builtin-przestan-kuznica',
    name: 'Przystań Kuźnica',
    info: 'Przystań żeglarska na Półwyspie Helskim',
    lat: 54.732492, lng: 18.582353, _builtin: true,
  },
  {
    id: 'builtin-marina-jastarnia',
    name: 'Marina Jastarnia',
    info: 'Przystań jachtowa w Jastarni\nCiche miejsce na Zatoce Puckiej, media, zaplecze',
    lat: 54.695522, lng: 18.676503, _builtin: true,
  },
  {
    id: 'builtin-marina-hel',
    name: 'Marina Hel',
    info: 'Przystań jachtowa na końcu Półwyspu Helskiego\nMiejsca cumownicze, media',
    lat: 54.601840, lng: 18.801227, _builtin: true,
  },
  {
    id: 'builtin-marina-przelom',
    name: 'Marina Przełom',
    info: 'Marina na Martwej Wiśle w Gdańsku',
    lat: 54.358337, lng: 18.781595, _builtin: true,
  },
  {
    id: 'builtin-marina-ncz',
    name: 'Marina Narodowe Centrum Żeglarstwa',
    info: 'Marina Narodowego Centrum Żeglarstwa w Gdańsku\nNowoczesna infrastruktura, media, zaplecze',
    lat: 54.367573, lng: 18.778628, _builtin: true,
  },
  {
    id: 'builtin-przestan-sobieszewo',
    name: 'Przystań Sobieszewo',
    info: 'Przystań żeglarska na Wyspie Sobieszewskiej',
    lat: 54.346315, lng: 18.815338, _builtin: true,
  },
  {
    id: 'builtin-przestan-nadwislanska',
    name: 'Przystań Nadwiślańska',
    info: 'Przystań żeglarska nad Martwą Wisłą – Sobieszewo',
    lat: 54.346530, lng: 18.812777, _builtin: true,
  },
  {
    id: 'builtin-marina-blotnik',
    name: 'Marina Błotnik',
    info: 'Marina na Martwej Wiśle przy Przekopie Wisły',
    lat: 54.288913, lng: 18.921855, _builtin: true,
  },
  {
    id: 'builtin-mikoszewo',
    name: 'Przystań Mikoszewo',
    info: 'Przystań na ujściu Przekopu Wisły\nPunkt wejścia z Zatoki Gdańskiej na Pętlę Żuławską',
    lat: 54.3343, lng: 18.9668, _builtin: true,
  },
  {
    id: 'builtin-przestan-rybina',
    name: 'Przystań Żeglarska w Rybinie',
    info: 'Przystań żeglarska w Rybinie na Szkarpawie',
    lat: 54.285158, lng: 19.114123, _builtin: true,
  },
  {
    id: 'builtin-przestan-wankowicz',
    name: 'Przystań Żeglarska im. Melchiora Wańkowicza',
    info: 'Przystań żeglarska im. M. Wańkowicza – Pętla Żuławska',
    lat: 54.273102, lng: 19.224272, _builtin: true,
  },
  {
    id: 'builtin-przestan-osw-fala',
    name: 'Przystań Żeglarska OSW Fala',
    info: 'Ośrodek Sportu Wodnego Fala – Zalew Wiślany',
    lat: 54.161178, lng: 19.390827, _builtin: true,
  },
  {
    id: 'builtin-nowy-dwor-gdanski',
    name: 'Przystań Nowy Dwór Gdański',
    info: 'Przystań na Pętli Żuławskiej (Nogat/Szkarpawa)\nPunkt bazowy do eksploracji Żuław',
    lat: 54.2134, lng: 19.1204, _builtin: true,
  },
  {
    id: 'builtin-przestan-malbork',
    name: 'Przystań Jachtowa Malbork',
    info: 'Przystań jachtowa nad Nogatem w Malborku\nBlisko zamku krzyżackiego',
    lat: 54.047938, lng: 19.038762, _builtin: true,
  },
  {
    id: 'builtin-marina-biala-gora',
    name: 'Marina Biała Góra',
    info: 'Marina przy śluzie Biała Góra – połączenie Wisły z Nogatem i Szkarpawą',
    lat: 53.914900, lng: 18.885605, _builtin: true,
  },
  {
    id: 'builtin-przestan-tczew',
    name: 'Przystań Tczew',
    info: 'Przystań jachtowa nad Wisłą w Tczewie',
    lat: 54.086787, lng: 18.805660, _builtin: true,
  },
  {
    id: 'builtin-port-elblag',
    name: 'Port Elbląg',
    info: 'Port na rzece Elbląg – brama do Pętli Żuławskiej i Zalewu Wiślanego\nCumowanie, zaplecze, serwis',
    lat: 54.1754, lng: 19.3851, _builtin: true,
  },
  {
    id: 'builtin-tolkmicko',
    name: 'Przystań Tolkmicko',
    info: 'Port jachtowy na Zalewie Wiślanym\nMiejsca cumownicze, zaplecze',
    lat: 54.3234, lng: 19.5229, _builtin: true,
  },
  {
    id: 'builtin-frombork',
    name: 'Marina Frombork',
    info: 'Przystań na Zalewie Wiślanym, przy katedrze Kopernika\nCumowanie, zaplecze podstawowe',
    lat: 54.359890, lng: 19.676905, _builtin: true,
  },
  {
    id: 'builtin-krynica-morska',
    name: 'Porto Marina Krynica Morska',
    info: 'Przystań na Mierzei Wiślanej\nMiejsca cumownicze na Zalewie Wiślanym',
    lat: 54.378678, lng: 19.446395, _builtin: true,
  },
  {
    id: 'builtin-katy-rybackie',
    name: 'Marina Kąty Rybackie',
    info: 'Przystań żeglarska w Kątach Rybackich – Zalew Wiślany',
    lat: 54.340623, lng: 19.238253, _builtin: true,
  },
  {
    id: 'builtin-nowa-pasleka',
    name: 'Przystań Nowa Pasłęka',
    info: 'Przystań przy ujściu rzeki Pasłęki do Zalewu Wiślanego',
    lat: 54.431848, lng: 19.770595, _builtin: true,
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
