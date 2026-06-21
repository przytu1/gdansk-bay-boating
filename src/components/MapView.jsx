import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { translateType, translateColour, translateCardinal, translateLateral } from '../utils/translations'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const GDANSK_BAY_CENTER = [18.709516900145584, 54.428935648705995]

const SEAMARK_LAYERS = ['seamarks-points', 'seamarks-areas-fill', 'seamarks-areas-line']

function makeFuelIcon() {
  const size = 44
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')

  // Drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.32)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetY = 2

  // Background circle
  ctx.beginPath()
  ctx.arc(22, 22, 19, 0, Math.PI * 2)
  ctx.fillStyle = '#c05621'
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // White ring
  ctx.beginPath()
  ctx.arc(22, 22, 19, 0, Math.PI * 2)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.stroke()

  // Pump body (white rectangle)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(9, 9, 13, 23)

  // Display window (darker cutout)
  ctx.fillStyle = '#92400e'
  ctx.fillRect(10.5, 10.5, 10, 6.5)

  // Nozzle arm
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2.8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(22, 15)    // exits pump body
  ctx.lineTo(29, 15)    // horizontal right
  ctx.lineTo(29, 23)    // vertical down
  ctx.lineTo(27, 25)    // nozzle tip
  ctx.stroke()

  // Base bar
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(8, 31, 15, 3)

  // Return ImageData — explicitly supported by Mapbox addImage on all platforms
  return ctx.getImageData(0, 0, size, size)
}

function buildFuelPopupHTML(props) {
  const name = props.name || 'Stacja paliw'
  const lines = []

  const fuels = []
  if (props['fuel:diesel'] === 'yes') fuels.push('olej napędowy')
  if (props['fuel:octane_95'] === 'yes' || props['fuel:petrol'] === 'yes') fuels.push('benzyna')
  if (props['fuel:lpg'] === 'yes') fuels.push('LPG')
  if (fuels.length) lines.push(`Paliwa: <strong>${fuels.join(', ')}</strong>`)

  const hours = props.opening_hours
  if (hours) lines.push(`Godziny: <strong>${hours}</strong>`)

  const phone = props.phone || props['contact:phone']
  if (phone) lines.push(`Telefon: <strong>${phone}</strong>`)

  const vhf = props['communication:radio'] || props['seamark:vhf_channel']
  if (vhf) lines.push(`VHF: <strong>kanał ${vhf}</strong>`)

  const operator = props.operator
  if (operator) lines.push(`Operator: <strong>${operator}</strong>`)

  return `<div class="seamark-popup">
    <div class="seamark-popup-title">${name}</div>
    <div class="seamark-popup-type">Stacja paliw dla łodzi</div>
    ${lines.length ? `<div class="seamark-popup-details">${lines.map(l => `<div>${l}</div>`).join('')}</div>` : ''}
  </div>`
}

function buildPopupHTML(props) {
  const name = props.name || props['seamark:name'] || ''
  const type = translateType(props['seamark:type'])
  const lines = []

  const cardinal = props['seamark:buoy_cardinal:category']
  if (cardinal) lines.push(`Kierunek: <strong>${translateCardinal(cardinal)}</strong>`)

  const lateral = props['seamark:buoy_lateral:category']
  if (lateral) lines.push(`Strona: <strong>${translateLateral(lateral)}</strong>`)

  const lightChar = props['seamark:light:character'] || props['seamark:light:1:character']
  if (lightChar) {
    const period = props['seamark:light:period'] || props['seamark:light:1:period']
    lines.push(`Światło: <strong>${lightChar}${period ? ' ' + period + 's' : ''}</strong>`)
  }

  const colour = props['seamark:buoy_lateral:colour']
    || props['seamark:buoy_cardinal:colour']
    || props['seamark:colour']
  if (colour) lines.push(`Kolor: <strong>${translateColour(colour)}</strong>`)

  const info = props['seamark:information'] || props.description || ''
  if (info) lines.push(`Info: <strong>${info}</strong>`)

  return `<div class="seamark-popup">
    <div class="seamark-popup-title">${name || type}</div>
    ${name ? `<div class="seamark-popup-type">${type}</div>` : ''}
    ${lines.length ? `<div class="seamark-popup-details">${lines.map(l => `<div>${l}</div>`).join('')}</div>` : ''}
  </div>`
}

function buildLockPopupHTML(props) {
  const isGate = props._featureType === 'lock_gate'
  const name = props.name || (isGate ? 'Wrota śluzy' : 'Śluza')
  const subtitle = isGate ? 'Wrota śluzy' : 'Śluza'
  const lines = []

  const len = props['lock:length'] || props['seamark:lock:length']
  const wid = props['lock:width'] || props['seamark:lock:width']
  const dep = props['lock:depth'] || props['maxdraught'] || props['seamark:lock:depth']

  if (len && wid) lines.push(`Wymiary komory: <strong>${len} m × ${wid} m</strong>`)
  else if (len) lines.push(`Długość: <strong>${len} m</strong>`)
  else if (wid) lines.push(`Szerokość: <strong>${wid} m</strong>`)
  if (dep) lines.push(`Głębokość progu: <strong>${dep} m</strong>`)

  const hours = props.opening_hours
  if (hours) lines.push(`Godziny: <strong>${hours}</strong>`)

  const phone = props.phone || props['contact:phone']
  if (phone) lines.push(`Telefon: <strong>${phone}</strong>`)

  const vhf = props['seamark:vhf_channel'] || props['communication:radio']
  if (vhf) lines.push(`VHF: <strong>kanał ${vhf}</strong>`)

  const fee = props.fee
  if (fee === 'yes') lines.push(`Opłata: <strong>tak</strong>`)
  else if (fee === 'no') lines.push(`Opłata: <strong>nie</strong>`)
  else if (fee) lines.push(`Opłata: <strong>${fee}</strong>`)

  return `<div class="seamark-popup">
    <div class="seamark-popup-title">${name}</div>
    ${name !== subtitle ? `<div class="seamark-popup-type">${subtitle}</div>` : ''}
    ${lines.length ? `<div class="seamark-popup-details">${lines.map(l => `<div>${l}</div>`).join('')}</div>` : ''}
  </div>`
}

// ── Area popup data (researched from VTS Zatoka Gdańska / BHMW / Natura 2000) ──

const AREA_INFO = {
  separation_zone: {
    label: 'Strefa rozdzielenia ruchu (TSS)',
    color: '#2b6cb0',
    badge: 'VTS Zatoka Gdańska',
    summary: 'Centralna strefa buforowa zatwierdzonego przez IMO Systemu Rozdzielenia Ruchu. W Zatoce Gdańskiej działają dwa TSS: „EAST" (Port Północny / Gdańsk) i „WEST" (Gdynia), monitorowane całą dobę przez Urząd Morski w Gdyni.',
    rules: [
      'Nie wchodzić ani nie przekraczać strefy z wyjątkiem sytuacji awaryjnej (COLREGS Reguła 10)',
      'Jednostki &lt;20 m mogą korzystać z Przybrzeżnej Strefy Ruchu (ITZ), aby ominąć główne tory',
      'Dołączać do torów lub je przekraczać pod kątem prostym, trzymając się prawej burty',
      'Narzędzia połowowe zakazane w strefie TSS i w odległości 150 m od granic torów',
      'Nasłuch na VHF kanał 16 — VTS Gdańsk na kanałach roboczych',
    ],
    source: 'VTS Zatoka Gdańska · Urząd Morski w Gdyni',
  },
  precautionary_area: {
    label: 'Obszar ostrożności',
    color: '#c05621',
    badge: 'Zachowaj szczególną ostrożność',
    summary: 'Obszar, w którym ruch statków zbiega się z wielu kierunków. Główny obszar ostrożności wyznacza skrzyżowanie torów TSS EAST i WEST przy boi nawigacyjnej „GN". Jednoczesny ruch ze wszystkich kierunków.',
    rules: [
      'Zmniejsz prędkość i prowadź obserwację we wszystkich kierunkach',
      'Ustąp drogi jednostkom poruszającym się wyznaczonymi torami ruchu',
      'Unikaj zatrzymywania się i trzymaj się z dala od dróg manewrowych statków handlowych',
      'Nasłuch na VHF kanał 16',
    ],
    source: 'Rozporządzenie VTS Zatoka Gdańska nr 11 (2023)',
  },
  separation_boundary: {
    label: 'Granica strefy rozdzielenia ruchu',
    color: '#2b6cb0',
    badge: 'TSS — granica zewnętrzna',
    summary: 'Zewnętrzna granica zatwierdzonego przez IMO Systemu Rozdzielenia Ruchu (TSS). Linia oznacza krawędź toru ruchu jednostek handlowych na Zatoce Gdańskiej.',
    rules: [
      'Nie przekraczaj granicy, jeśli nie zamierzasz korzystać z toru TSS',
      'Wchodź do toru pod kątem prostym, trzymając się prawej burty',
      'Zachowaj bezpieczną odległość od statków handlowych',
      'Nasłuch na VHF kanał 16 — VTS Gdańsk',
    ],
    source: 'VTS Zatoka Gdańska · Urząd Morski w Gdyni',
  },
  anchorage: {
    label: 'Kotwicowisko',
    color: '#2b4e8a',
    badge: 'Obszar kotwiczenia',
    summary: 'Wyznaczony obszar bezpiecznego kotwiczenia. Sprawdź aktualne ograniczenia głębokości i zasięg obszaru VTS przed zrzuceniem kotwicy.',
    rules: [
      'Dobierz długość łańcucha kotwicznego odpowiednio do głębokości (min. 5× głębokość)',
      'Prowadź ciągły nasłuch na VHF kanał 16',
      'Nie blokuj torów podejściowych — sprawdź granice obszaru na mapie',
      'Zgłoś przybycie do VTS Zatoka Gdańska, jeśli wymagane',
    ],
    source: 'Urząd Morski w Gdyni',
  },
  dumping_ground: {
    label: 'Wysypisko odpadów morskich',
    color: '#4a5568',
    badge: 'Obszar zrzutu',
    summary: 'Wyznaczony historyczny obszar zrzutu materiałów dennych. Dno może zawierać amunicję, substancje chemiczne lub inne odpady zdeponowane w przeszłości.',
    rules: [
      'Zakaz kotwiczenia — ryzyko zahaczenia o materiały denne',
      'Zakaz połowów włokami i narzędziami dennymi',
      'Nie używać sprzętu nurkowego bez zezwolenia',
      'Zgłaszać znalezione przedmioty do Urzędu Morskiego',
    ],
    source: 'Urząd Morski w Gdyni · BHMW',
  },
}

const RESTRICTED_CATEGORIES = {
  military: {
    label: 'Wojskowy obszar zastrzeżony',
    color: '#c53030',
    badge: 'Wejście zabronione',
    summary: 'Polski wojskowy obszar zastrzeżony (Dz.U. 2023 poz. 985). Strefy stałe obejmują tor torpedowy przy Oksywiu (baza Marynarki Wojennej w Gdyni). Tymczasowe zamknięcia ogłaszane są co tydzień przez BHMW.',
    rules: [
      'Wejście zabronione bez wcześniejszego zezwolenia Dowództwa Marynarki Wojennej',
      'Sprawdź aktywne zamknięcia na bhmw.gov.pl przed wypłynięciem',
      'Ostrzeżenia nadawane na VHF kanał 05, 61, 62 i MF 2714 kHz',
      'Egzekwowane przez Marynarkę Wojenną i Straż Graniczną',
    ],
    source: 'Dz.U. 2023 poz. 985 · BHMW (bhmw.gov.pl)',
  },
  nature_reserve: {
    label: 'Rezerwat przyrody',
    color: '#276749',
    badge: 'Obszar chroniony',
    summary: 'Morski rezerwat przyrody w sieci Natura 2000 (PLH220032 / PLB220005). Chroni łąki trawy morskiej, ławice piaskowe i ptaki lęgowe. Zatoka Pucka Wewnętrzna jest objęta ochroną od 1978 roku.',
    rules: [
      'Poruszaj się wyłącznie wyznaczonymi, głębszymi kanałami',
      'Kotwiczenie na łąkach trawy morskiej jest zabronione',
      'Obowiązują ograniczenia prędkości w celu ochrony przyrody',
      'Naruszenia zgłaszane do RDOŚ Gdańsk',
    ],
    source: 'Natura 2000 PLH220032 / PLB220005 · RDOŚ Gdańsk',
  },
  wildlife_refuge: {
    label: 'Ostoja dzikiej przyrody',
    color: '#276749',
    badge: 'Obszar chroniony',
    summary: 'Obszar wyznaczony do ochrony ptaków i ssaków morskich, w tym fok pospolitych i szarych obecnych w Zatoce Gdańskiej. Część sieci bałtyckich obszarów chronionych.',
    rules: [
      'Zmniejsz prędkość w pobliżu brzegów i miejsc odpoczynku fok',
      'Nie zbliżaj się ani nie płosz odpoczywających ptaków i fok',
      'Kotwiczenie może być ograniczone — sprawdź lokalne przepisy',
    ],
    source: 'RDOŚ Gdańsk · Natura 2000',
  },
  anchoring_prohibited: {
    label: 'Zakaz kotwiczenia',
    color: '#975a16',
    badge: 'Zakaz kotwiczenia',
    summary: 'Kotwiczenie jest zabronione, zazwyczaj ze względu na podmorskie kable, rurociągi, wrażliwe siedliska denne lub bliskość torów portowych.',
    rules: [
      'Nie kotwicz — ryzyko uszkodzenia kabla lub rurociągu',
      'Można korzystać z boi cumowniczych (jeśli są dostępne)',
    ],
    source: 'Urząd Morski w Gdyni',
  },
  fishing_prohibited: {
    label: 'Zakaz połowów',
    color: '#975a16',
    badge: 'Zakaz połowów',
    summary: 'Połowy są zabronione w celu ochrony zasobów rybnych, tarlisk lub infrastruktury podwodnej. Dotyczy wszystkich rodzajów sprzętu, w tym trollingu i wędkowania.',
    rules: [
      'Zakaz wszelkich połowów komercyjnych i rekreacyjnych',
    ],
    source: 'Urząd Morski w Gdyni',
  },
}

function buildAreaPopupHTML(props) {
  const type = props['seamark:type']
  const category = props['seamark:restricted_area:category']
    || props['seamark:precautionary_area:category']
    || props['seamark:separation_zone:category']
  const name = props.name || props['seamark:name'] || ''
  const operator = props.operator || props['seamark:operator'] || ''

  let info
  if (type === 'restricted_area') {
    info = RESTRICTED_CATEGORIES[category] || {
      label: 'Obszar zastrzeżony',
      color: '#c53030',
      badge: 'Wejście ograniczone',
      summary: 'Ruch na tym obszarze jest ograniczony. Przed wejściem sprawdź komunikaty Urzędu Morskiego i ostrzeżenia nawigacyjne BHMW.',
      rules: [
        'Sprawdź aktualny status na bhmw.gov.pl przed zbliżaniem się',
        'Nasłuch na VHF kanał 16 w celu otrzymania informacji o ograniczeniach',
      ],
      source: 'Urząd Morski w Gdyni',
    }
  } else {
    info = AREA_INFO[type]
  }

  if (!info) {
    return `<div class="seamark-popup"><div class="seamark-popup-title">${name || translateType(type)}</div></div>`
  }

  const title = name || info.label
  const rulesHTML = info.rules?.length
    ? `<ul class="area-popup-rules">${info.rules.map(r => `<li>${r}</li>`).join('')}</ul>`
    : ''
  const operatorHTML = operator ? `<div class="area-popup-meta">Operator: ${operator}</div>` : ''
  const categoryHTML = (category && name) ? `<div class="area-popup-meta">Kategoria: ${category.replace(/_/g, ' ')}</div>` : ''

  return `<div class="area-popup">
    <div class="area-popup-header" style="background:${info.color}">
      <div class="area-popup-title">${title}</div>
      <div class="area-popup-badge">${info.badge}</div>
    </div>
    <div class="area-popup-body">
      ${name && name !== info.label ? `<div class="area-popup-type">${info.label}</div>` : ''}
      <p class="area-popup-summary">${info.summary}</p>
      ${rulesHTML}
      ${categoryHTML}${operatorHTML}
      ${info.source ? `<div class="area-popup-source">Źródło: ${info.source}</div>` : ''}
    </div>
  </div>`
}

export default function MapView({ isMeasuring, measurePoints, onAddPoint, seamarksVisible, seamarksData, fuelVisible, fuelData }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const isMeasuringRef = useRef(isMeasuring)
  const onAddPointRef = useRef(onAddPoint)

  useEffect(() => { isMeasuringRef.current = isMeasuring }, [isMeasuring])
  useEffect(() => { onAddPointRef.current = onAddPoint }, [onAddPoint])

  useEffect(() => {
    if (mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: GDANSK_BAY_CENTER,
      zoom: 11,
    })

    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    )
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.addControl(new mapboxgl.ScaleControl({ unit: 'nautical' }), 'bottom-left')

    map.on('load', () => {
      // ── Seamarks ────────────────────────────────────────────────
      map.addSource('seamarks', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        attribution: '© <a href="https://www.openseamap.org/">OpenSeaMap</a> contributors',
      })

      map.addLayer({
        id: 'seamarks-areas-fill',
        type: 'fill',
        source: 'seamarks',
        filter: ['==', ['geometry-type'], 'Polygon'],
        layout: { visibility: 'none' },
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'seamark:type'], 'restricted_area'], '#fc8181',
            ['==', ['get', 'seamark:type'], 'precautionary_area'], '#f6ad55',
            ['==', ['get', 'seamark:type'], 'separation_zone'], '#90cdf4',
            ['==', ['get', 'waterway'], 'lock'], '#fbd38d',
            '#a0aec0',
          ],
          'fill-opacity': 0.25,
        },
      })

      map.addLayer({
        id: 'seamarks-areas-line',
        type: 'line',
        source: 'seamarks',
        filter: ['==', ['geometry-type'], 'Polygon'],
        layout: { visibility: 'none' },
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'seamark:type'], 'restricted_area'], '#e53e3e',
            ['==', ['get', 'seamark:type'], 'precautionary_area'], '#dd6b20',
            ['==', ['get', 'seamark:type'], 'separation_zone'], '#3182ce',
            ['==', ['get', 'waterway'], 'lock'], '#b45309',
            '#718096',
          ],
          'line-width': 2,
          'line-dasharray': [4, 2],
        },
      })

      map.addLayer({
        id: 'seamarks-points',
        type: 'circle',
        source: 'seamarks',
        filter: ['==', ['geometry-type'], 'Point'],
        layout: { visibility: 'none' },
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 14, 8],
          'circle-color': [
            'case',
            ['all', ['==', ['get', 'seamark:type'], 'buoy_lateral'], ['==', ['get', 'seamark:buoy_lateral:category'], 'port']], '#e53e3e',
            ['all', ['==', ['get', 'seamark:type'], 'buoy_lateral'], ['==', ['get', 'seamark:buoy_lateral:category'], 'starboard']], '#38a169',
            ['all', ['==', ['get', 'seamark:type'], 'beacon_lateral'], ['==', ['get', 'seamark:beacon_lateral:category'], 'port']], '#e53e3e',
            ['all', ['==', ['get', 'seamark:type'], 'beacon_lateral'], ['==', ['get', 'seamark:beacon_lateral:category'], 'starboard']], '#38a169',
            ['==', ['get', 'seamark:type'], 'buoy_cardinal'], '#d69e2e',
            ['==', ['get', 'seamark:type'], 'beacon_cardinal'], '#d69e2e',
            ['==', ['get', 'seamark:type'], 'buoy_isolated_danger'], '#805ad5',
            ['==', ['get', 'seamark:type'], 'buoy_safe_water'], '#3182ce',
            ['in', ['get', 'seamark:type'], ['literal', ['light_major', 'light_minor', 'lighthouse']]], '#f6ad55',
            ['==', ['get', 'seamark:type'], 'wreck'], '#744210',
            ['==', ['get', 'seamark:type'], 'rock'], '#e2e8f0',
            ['in', ['get', '_featureType'], ['literal', ['lock', 'lock_centroid']]], '#92400e',
            ['==', ['get', '_featureType'], 'lock_gate'], '#b45309',
            '#718096',
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': [
            'case',
            ['==', ['get', 'seamark:type'], 'rock'], '#718096',
            '#ffffff',
          ],
        },
      })

      // Seamark / lock point popup
      map.on('click', 'seamarks-points', e => {
        const feature = e.features[0]
        const ft = feature.properties._featureType
        const isLock = ft === 'lock' || ft === 'lock_centroid' || ft === 'lock_gate'
        new mapboxgl.Popup({ maxWidth: '320px', closeButton: false, className: 'seamark-point-popup' })
          .setLngLat(feature.geometry.coordinates.slice())
          .setHTML(isLock ? buildLockPopupHTML(feature.properties) : buildPopupHTML(feature.properties))
          .addTo(map)
      })

      map.on('mouseenter', 'seamarks-points', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'seamarks-points', () => {
        map.getCanvas().style.cursor = isMeasuringRef.current ? 'crosshair' : ''
      })

      // Seamark / lock area popup
      map.on('click', 'seamarks-areas-fill', e => {
        if (isMeasuringRef.current) return
        if (map.queryRenderedFeatures(e.point, { layers: ['seamarks-points', 'fuel-points'] }).length > 0) return
        const feature = e.features[0]
        if (feature.properties._featureType === 'lock') {
          new mapboxgl.Popup({ maxWidth: '320px', closeButton: false, className: 'seamark-point-popup' })
            .setLngLat(e.lngLat)
            .setHTML(buildLockPopupHTML(feature.properties))
            .addTo(map)
          return
        }
        new mapboxgl.Popup({ maxWidth: '360px', closeButton: false, className: 'area-popup-wrapper' })
          .setLngLat(e.lngLat)
          .setHTML(buildAreaPopupHTML(feature.properties))
          .addTo(map)
      })

      map.on('mouseenter', 'seamarks-areas-fill', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'seamarks-areas-fill', () => {
        map.getCanvas().style.cursor = isMeasuringRef.current ? 'crosshair' : ''
      })

      // ── Fuel stations ────────────────────────────────────────────
      map.addImage('fuel-icon', makeFuelIcon())

      map.addSource('fuel', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: 'fuel-points',
        type: 'symbol',
        source: 'fuel',
        layout: {
          visibility: 'none',
          'icon-image': 'fuel-icon',
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-anchor': 'center',
        },
      })

      map.on('click', 'fuel-points', e => {
        if (isMeasuringRef.current) return
        const feature = e.features[0]
        new mapboxgl.Popup({ maxWidth: '320px', closeButton: false, className: 'seamark-point-popup' })
          .setLngLat(feature.geometry.coordinates.slice())
          .setHTML(buildFuelPopupHTML(feature.properties))
          .addTo(map)
      })

      map.on('mouseenter', 'fuel-points', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'fuel-points', () => {
        map.getCanvas().style.cursor = isMeasuringRef.current ? 'crosshair' : ''
      })

      // ── Measure layers ───────────────────────────────────────────
      map.addSource('measure-line', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
      })
      map.addLayer({
        id: 'measure-line',
        type: 'line',
        source: 'measure-line',
        paint: { 'line-color': '#e53e3e', 'line-width': 2.5 },
      })

      map.addSource('measure-points', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'measure-points',
        type: 'circle',
        source: 'measure-points',
        paint: {
          'circle-radius': 5,
          'circle-color': '#e53e3e',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })
    })

    // General click — measure points (skip if clicking on a seamark)
    map.on('click', e => {
      if (!isMeasuringRef.current) return
      const hit = map.queryRenderedFeatures(e.point, { layers: ['seamarks-points'] })
      if (hit.length > 0) return
      onAddPointRef.current([e.lngLat.lng, e.lngLat.lat])
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Crosshair cursor when measuring
  useEffect(() => {
    mapRef.current?.getCanvas().style.setProperty('cursor', isMeasuring ? 'crosshair' : '')
  }, [isMeasuring])

  // Update measure layer data
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.getSource('measure-line')?.setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: measurePoints },
    })
    map.getSource('measure-points')?.setData({
      type: 'FeatureCollection',
      features: measurePoints.map(coords => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords },
      })),
    })
  }, [measurePoints])

  // Seamarks data + visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (seamarksData) map.getSource('seamarks')?.setData(seamarksData)
    const vis = seamarksVisible && seamarksData ? 'visible' : 'none'
    SEAMARK_LAYERS.forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis)
    })
  }, [seamarksVisible, seamarksData])

  // Fuel data + visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (fuelData) map.getSource('fuel')?.setData(fuelData)
    const vis = fuelVisible && fuelData ? 'visible' : 'none'
    if (map.getLayer('fuel-points')) map.setLayoutProperty('fuel-points', 'visibility', vis)
  }, [fuelVisible, fuelData])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
