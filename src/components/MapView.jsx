import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { translateType, translateColour, translateCardinal, translateLateral } from '../utils/translations'
import { SHIP_CATEGORIES } from '../utils/aisStream'
import { fmtTime } from '../utils/eta'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const GDANSK_BAY_CENTER = [18.709516900145584, 54.428935648705995]

const SEAMARK_LAYERS = ['seamarks-points', 'seamarks-areas-fill', 'seamarks-areas-line']

function makeMarinaIcon() {
  const size = 44
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')

  ctx.shadowColor = 'rgba(0,0,0,0.32)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetY = 2

  // Navy blue background
  ctx.fillStyle = '#1e40af'
  ctx.fillRect(0, 0, size, size)
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Black border
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2.5
  ctx.strokeRect(1.25, 1.25, size - 2.5, size - 2.5)

  // Anchor symbol (white)
  ctx.strokeStyle = '#ffffff'
  ctx.fillStyle = '#ffffff'
  ctx.lineWidth = 3.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const cx = 22

  // Ring at top
  ctx.beginPath()
  ctx.arc(cx, 10, 5, 0, Math.PI * 2)
  ctx.stroke()

  // Shaft
  ctx.beginPath()
  ctx.moveTo(cx, 10)
  ctx.lineTo(cx, 37)
  ctx.stroke()

  // Crossbar (stock)
  ctx.beginPath()
  ctx.moveTo(cx - 10, 20)
  ctx.lineTo(cx + 10, 20)
  ctx.stroke()

  // Left arm
  ctx.beginPath()
  ctx.moveTo(cx, 37)
  ctx.bezierCurveTo(cx - 4, 37, cx - 12, 34, cx - 12, 27)
  ctx.stroke()

  // Right arm
  ctx.beginPath()
  ctx.moveTo(cx, 37)
  ctx.bezierCurveTo(cx + 4, 37, cx + 12, 34, cx + 12, 27)
  ctx.stroke()

  // Arm tips
  ctx.beginPath()
  ctx.arc(cx - 12, 27, 3.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx + 12, 27, 3.5, 0, Math.PI * 2)
  ctx.fill()

  return ctx.getImageData(0, 0, size, size)
}

function makeStopIcon() {
  const size = 44
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')

  ctx.shadowColor = 'rgba(0,0,0,0.32)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetY = 2

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Black border
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2.5
  ctx.strokeRect(1.25, 1.25, size - 2.5, size - 2.5)

  // Anchor symbol (black)
  ctx.strokeStyle = '#000000'
  ctx.fillStyle = '#000000'
  ctx.lineWidth = 3.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const cx = 22

  ctx.beginPath()
  ctx.arc(cx, 10, 5, 0, Math.PI * 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx, 10)
  ctx.lineTo(cx, 37)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx - 10, 20)
  ctx.lineTo(cx + 10, 20)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx, 37)
  ctx.bezierCurveTo(cx - 4, 37, cx - 12, 34, cx - 12, 27)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx, 37)
  ctx.bezierCurveTo(cx + 4, 37, cx + 12, 34, cx + 12, 27)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx - 12, 27, 3.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx + 12, 27, 3.5, 0, Math.PI * 2)
  ctx.fill()

  return ctx.getImageData(0, 0, size, size)
}

function makeLockBridgeIcon() {
  const size = 44
  const c = document.createElement('canvas')
  c.width = size; c.height = size
  const ctx = c.getContext('2d')

  ctx.shadowColor = 'rgba(0,0,0,0.32)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetY = 2

  // Yellow background — same colour scheme as the fuel-station icon
  ctx.fillStyle = '#facc15'
  ctx.fillRect(0, 0, size, size)
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0

  // Black border
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2.5
  ctx.strokeRect(1.25, 1.25, size - 2.5, size - 2.5)

  // Black pictogram — a movable/lift bridge, as on the road-sign symbol
  ctx.fillStyle = '#000000'
  ctx.strokeStyle = '#000000'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Support piers
  ctx.fillRect(6, 24, 7, 14)
  ctx.fillRect(31, 24, 7, 14)

  // Flat deck span (left half), from the left pier to the hinge
  ctx.fillRect(6, 20, 18, 4)

  // Raised leaf (right half), lifted open around the hinge
  ctx.beginPath()
  ctx.moveTo(24.5, 23.3)
  ctx.lineTo(21.5, 20.7)
  ctx.lineTo(34.5, 4.7)
  ctx.lineTo(37.5, 7.3)
  ctx.closePath()
  ctx.fill()

  // Hinge pivot
  ctx.beginPath()
  ctx.arc(23, 22, 2.5, 0, Math.PI * 2)
  ctx.fill()

  // Water line
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(4, 40); ctx.lineTo(40, 40)
  ctx.stroke()

  return ctx.getImageData(0, 0, size, size)
}

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

  // Yellow square background
  ctx.fillStyle = '#facc15'
  ctx.fillRect(0, 0, size, size)
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Black border
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2.5
  ctx.strokeRect(1.25, 1.25, size - 2.5, size - 2.5)

  // Pump body (black rectangle)
  ctx.fillStyle = '#000000'
  ctx.fillRect(9, 9, 13, 23)

  // Display window (yellow cutout)
  ctx.fillStyle = '#facc15'
  ctx.fillRect(10.5, 10.5, 10, 6.5)

  // Nozzle arm (black)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2.8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(22, 15)
  ctx.lineTo(29, 15)
  ctx.lineTo(29, 23)
  ctx.lineTo(27, 25)
  ctx.stroke()

  // Base bar (black)
  ctx.fillStyle = '#000000'
  ctx.fillRect(8, 31, 15, 3)

  // Return ImageData — explicitly supported by Mapbox addImage on all platforms
  return ctx.getImageData(0, 0, size, size)
}

// Underway marker: a concave-quadrilateral arrow (dart/deltoid), drawn pointing
// north so Mapbox `icon-rotate` aligns it with course/heading. One per category colour.
function makeVesselArrowIcon(color) {
  const size = 40
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')

  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 3
  ctx.shadowOffsetY = 1

  ctx.beginPath()
  ctx.moveTo(20, 3)    // bow tip
  ctx.lineTo(32, 35)   // starboard rear corner
  ctx.lineTo(20, 27)   // concave notch (stern, pulled in toward the bow)
  ctx.lineTo(8, 35)    // port rear corner
  ctx.closePath()

  ctx.fillStyle = color
  ctx.fill()

  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.stroke()

  return ctx.getImageData(0, 0, size, size)
}

// Stationary marker (anchored / moored / aground): a square rotated 45°
// (rhombus), so it reads clearly as "not moving" next to the arrow shape.
function makeVesselDiamondIcon(color) {
  const size = 40
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')

  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 3
  ctx.shadowOffsetY = 1

  ctx.beginPath()
  ctx.moveTo(20, 5)    // top
  ctx.lineTo(35, 20)   // right
  ctx.lineTo(20, 35)   // bottom
  ctx.lineTo(5, 20)    // left
  ctx.closePath()

  ctx.fillStyle = color
  ctx.fill()

  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.stroke()

  return ctx.getImageData(0, 0, size, size)
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"]/g, ch => (
    ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&quot;'
  ))
}

function buildVesselPopupHTML(props) {
  const name = props.name ? escapeHTML(props.name) : `MMSI ${escapeHTML(props.mmsi)}`
  const typeLabel = props.typeLabel
    ? escapeHTML(props.typeLabel) + (props.typeCode ? ` (typ ${props.typeCode})` : '')
    : 'Jednostka pływająca'
  const lines = []

  lines.push(`MMSI: <strong>${escapeHTML(props.mmsi)}</strong>`)
  if (props.navStatus) lines.push(`Status: <strong>${escapeHTML(props.navStatus)}</strong>`)
  if (props.sog != null) lines.push(`Prędkość: <strong>${Number(props.sog).toFixed(1)} kn</strong>`)
  if (props.cog != null) lines.push(`Kurs (COG): <strong>${Math.round(props.cog)}°</strong>`)
  if (props.heading != null) lines.push(`Dziób (HDG): <strong>${Math.round(props.heading)}°</strong>`)
  if (props.destination) lines.push(`Cel podróży: <strong>${escapeHTML(props.destination)}</strong>`)
  if (props.lengthM || props.widthM) {
    const dims = [props.lengthM ? `${props.lengthM} m dł.` : null, props.widthM ? `${props.widthM} m szer.` : null]
      .filter(Boolean).join(' × ')
    lines.push(`Wymiary: <strong>${dims}</strong>`)
  }
  if (props.draught != null) lines.push(`Zanurzenie: <strong>${Number(props.draught).toFixed(1)} m</strong>`)
  if (props.callSign) lines.push(`Sygnał wywoławczy: <strong>${escapeHTML(props.callSign)}</strong>`)
  if (props.imo) lines.push(`IMO: <strong>${escapeHTML(props.imo)}</strong>`)
  if (props.lastSeen) {
    const t = new Date(props.lastSeen).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    lines.push(`Ostatni sygnał: <strong>${t}</strong>`)
  }

  return `<div class="seamark-popup">
    <div class="seamark-popup-title">${name}</div>
    <div class="seamark-popup-type">${typeLabel}</div>
    <div class="seamark-popup-details">${lines.map(l => `<div>${l}</div>`).join('')}</div>
  </div>`
}

function buildFuelPopupHTML(props) {
  const name = (props && props.name) ? props.name : 'Stacja paliw'
  const rawInfo = (props && props.info != null) ? String(props.info) : ''
  const infoLines = rawInfo.split('\n').filter(Boolean)

  return `<div class="seamark-popup">
    <div class="seamark-popup-title">${name}</div>
    <div class="seamark-popup-type">Stacja paliw dla łodzi</div>
    ${infoLines.length ? `<div class="seamark-popup-details">${infoLines.map(l => `<div>${l}</div>`).join('')}</div>` : ''}
  </div>`
}

function buildMeasurePointPopupHTML(props) {
  const isStop = props.type === 'stop'
  const icon = isStop ? '⚓' : '⛵'
  const name = props.name ? escapeHTML(props.name) : 'Punkt trasy'
  const lines = []

  if (isStop) {
    if (props.stopNote) lines.push(escapeHTML(props.stopNote))
    const dur = parseFloat(props.stopDuration)
    if (dur > 0) lines.push(`Czas postoju: <strong>${dur} min</strong>`)
  }

  if (props.timeKind) {
    lines.push(`${escapeHTML(props.timeKind)}: <strong>${escapeHTML(props.timeValue)}</strong>`)
  }

  if (props.fuelCapacity != null) {
    const levelText = props.fuelLevel != null
      ? `${Math.round(props.fuelLevel)} l / ${Math.round(props.fuelCapacity)} l`
      : '—'
    const pct = props.fuelLevel != null
      ? Math.max(0, Math.min(100, (props.fuelLevel / props.fuelCapacity) * 100))
      : 0
    lines.push(
      `<div class="popup-fuel-line">Stan paliwa: <strong>${levelText}</strong>` +
      `<span class="popup-fuel-gauge"><span class="popup-fuel-gauge-fill" style="width:${pct}%"></span></span></div>`
    )
  }

  return `<div class="seamark-popup">
    <div class="seamark-popup-title">${icon} ${name}</div>
    ${lines.length ? `<div class="seamark-popup-details">${lines.map(l => `<div>${l}</div>`).join('')}</div>` : ''}
  </div>`
}

function buildCustomLockPopupHTML(props) {
  const name = (props && props.name) ? props.name : 'Śluza / Most'
  const subtitle = (props && props.subtitle) ? String(props.subtitle) : ''
  const type = (props && props.type) ? String(props.type) : 'lock'
  const typeLabel = type === 'bridge' ? 'Most zwodzony' : 'Śluza'
  const rawInfo = (props && props.info != null) ? String(props.info) : ''
  const infoLines = rawInfo.split('\n').filter(Boolean)

  return `<div class="seamark-popup">
    <div class="seamark-popup-title">${name}</div>
    <div class="seamark-popup-type">${subtitle || typeLabel}</div>
    ${infoLines.length ? `<div class="seamark-popup-details">${infoLines.map(l => `<div>${l}</div>`).join('')}</div>` : ''}
  </div>`
}

function buildMarinaPopupHTML(props) {
  const name = (props && props.name) ? props.name : 'Marina / Przystań'
  const rawInfo = (props && props.info != null) ? String(props.info) : ''
  const infoLines = rawInfo.split('\n').filter(Boolean)

  return `<div class="seamark-popup">
    <div class="seamark-popup-title">${name}</div>
    <div class="seamark-popup-type">Marina / Przystań</div>
    ${infoLines.length ? `<div class="seamark-popup-details">${infoLines.map(l => `<div>${l}</div>`).join('')}</div>` : ''}
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

export default function MapView({
  isMeasuring, measurePoints, measureEtas, measureFuel, measureFuelLevels, onAddPoint,
  seamarksVisible, seamarksData,
  fuelVisible, fuelData, isPlacingFuel, onPlaceFuelPoint,
  marinasVisible, marinasData, isPlacingMarina, onPlaceMarinaPoint,
  locksVisible, locksData, isPlacingLock, onPlaceLockPoint,
  vesselsVisible, vesselsData,
  isCoords, coordPoint, onCoordPoint,
  locationHistoryVisible, locationHistoryPoints,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const measurePopupRef = useRef(null)
  const measurePopupSeqRef = useRef(null)
  const isMeasuringRef = useRef(isMeasuring)
  const onAddPointRef = useRef(onAddPoint)
  const isPlacingFuelRef = useRef(isPlacingFuel)
  const onPlaceFuelPointRef = useRef(onPlaceFuelPoint)
  const isPlacingMarinaRef = useRef(isPlacingMarina)
  const onPlaceMarinaPointRef = useRef(onPlaceMarinaPoint)
  const isPlacingLockRef = useRef(isPlacingLock)
  const onPlaceLockPointRef = useRef(onPlaceLockPoint)
  const isCoordsRef = useRef(isCoords)
  const onCoordPointRef = useRef(onCoordPoint)

  useEffect(() => { isMeasuringRef.current = isMeasuring }, [isMeasuring])
  useEffect(() => { onAddPointRef.current = onAddPoint }, [onAddPoint])
  useEffect(() => { isPlacingFuelRef.current = isPlacingFuel }, [isPlacingFuel])
  useEffect(() => { onPlaceFuelPointRef.current = onPlaceFuelPoint }, [onPlaceFuelPoint])
  useEffect(() => { isPlacingMarinaRef.current = isPlacingMarina }, [isPlacingMarina])
  useEffect(() => { onPlaceMarinaPointRef.current = onPlaceMarinaPoint }, [onPlaceMarinaPoint])
  useEffect(() => { isPlacingLockRef.current = isPlacingLock }, [isPlacingLock])
  useEffect(() => { onPlaceLockPointRef.current = onPlaceLockPoint }, [onPlaceLockPoint])
  useEffect(() => { isCoordsRef.current = isCoords }, [isCoords])
  useEffect(() => { onCoordPointRef.current = onCoordPoint }, [onCoordPoint])

  useEffect(() => {
    if (mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: GDANSK_BAY_CENTER,
      zoom: 11,
    })

    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    })
    map.addControl(geolocateControl, 'top-right')
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.addControl(new mapboxgl.ScaleControl({ unit: 'nautical' }), 'bottom-left')

    map.on('load', () => {
      // Auto-activate GPS tracking so the user's position is visible immediately
      setTimeout(() => geolocateControl.trigger(), 500)

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
          'icon-size': 0.5,
          'icon-allow-overlap': true,
          'icon-anchor': 'center',
        },
      })

      map.on('click', 'fuel-points', e => {
        if (isMeasuringRef.current || isPlacingFuelRef.current) return
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

      // ── Marinas ──────────────────────────────────────────────────
      map.addImage('marina-icon', makeMarinaIcon())

      map.addSource('marinas', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: 'marina-points',
        type: 'symbol',
        source: 'marinas',
        layout: {
          visibility: 'none',
          'icon-image': 'marina-icon',
          'icon-size': 0.5,
          'icon-allow-overlap': true,
          'icon-anchor': 'center',
        },
      })

      map.on('click', 'marina-points', e => {
        if (isMeasuringRef.current || isPlacingFuelRef.current || isPlacingMarinaRef.current) return
        const feature = e.features[0]
        new mapboxgl.Popup({ maxWidth: '320px', closeButton: false, className: 'seamark-point-popup' })
          .setLngLat(feature.geometry.coordinates.slice())
          .setHTML(buildMarinaPopupHTML(feature.properties))
          .addTo(map)
      })

      map.on('mouseenter', 'marina-points', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'marina-points', () => {
        map.getCanvas().style.cursor = isMeasuringRef.current ? 'crosshair' : ''
      })

      // ── Locks & bridges ─────────────────────────────────────────
      map.addImage('lock-icon', makeLockBridgeIcon())

      map.addSource('locks', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: 'lock-points',
        type: 'symbol',
        source: 'locks',
        layout: {
          visibility: 'none',
          'icon-image': 'lock-icon',
          'icon-size': 0.5,
          'icon-allow-overlap': true,
          'icon-anchor': 'center',
        },
      })

      map.on('click', 'lock-points', e => {
        if (isMeasuringRef.current || isPlacingLockRef.current) return
        const feature = e.features[0]
        new mapboxgl.Popup({ maxWidth: '320px', closeButton: false, className: 'seamark-point-popup' })
          .setLngLat(feature.geometry.coordinates.slice())
          .setHTML(buildCustomLockPopupHTML(feature.properties))
          .addTo(map)
      })

      map.on('mouseenter', 'lock-points', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'lock-points', () => {
        map.getCanvas().style.cursor = isMeasuringRef.current ? 'crosshair' : ''
      })

      // ── Live vessel positions (AIS) ─────────────────────────────
      Object.entries(SHIP_CATEGORIES).forEach(([cat, { color }]) => {
        map.addImage(`vessel-${cat}-moving`, makeVesselArrowIcon(color))
        map.addImage(`vessel-${cat}-anchored`, makeVesselDiamondIcon(color))
      })

      map.addSource('vessels', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        attribution: 'Pozycje AIS © <a href="https://aisstream.io/">AISStream.io</a>',
      })

      map.addLayer({
        id: 'vessel-points',
        type: 'symbol',
        source: 'vessels',
        layout: {
          visibility: 'none',
          'icon-image': ['get', 'iconKey'],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 0.55, 14, 0.9],
          'icon-rotate': ['get', 'rotation'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-anchor': 'center',
          'text-field': ['get', 'name'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 11, 0, 12.5, 11],
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-optional': true,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#1a202c',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
      })

      map.on('click', 'vessel-points', e => {
        if (isMeasuringRef.current || isPlacingFuelRef.current || isPlacingMarinaRef.current || isPlacingLockRef.current) return
        const feature = e.features[0]
        new mapboxgl.Popup({ maxWidth: '320px', closeButton: false, className: 'seamark-point-popup' })
          .setLngLat(feature.geometry.coordinates.slice())
          .setHTML(buildVesselPopupHTML(feature.properties))
          .addTo(map)
      })

      map.on('mouseenter', 'vessel-points', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'vessel-points', () => {
        map.getCanvas().style.cursor = isMeasuringRef.current ? 'crosshair' : ''
      })

      // ── Coord point marker ──────────────────────────────────────
      map.addSource('coord-point', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'coord-marker',
        type: 'circle',
        source: 'coord-point',
        paint: {
          'circle-radius': 7,
          'circle-color': '#0077cc',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
        },
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
        filter: ['!=', ['get', 'type'], 'stop'],
        paint: {
          'circle-radius': 5,
          'circle-color': '#e53e3e',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      map.addImage('stop-icon', makeStopIcon())
      map.addLayer({
        id: 'measure-stops',
        type: 'symbol',
        source: 'measure-points',
        filter: ['==', ['get', 'type'], 'stop'],
        layout: {
          'icon-image': 'stop-icon',
          'icon-size': 0.5,
          'icon-allow-overlap': true,
          'icon-anchor': 'center',
        },
      })

      const openMeasurePointPopup = e => {
        const feature = e.features[0]
        measurePopupRef.current?.remove()
        const popup = new mapboxgl.Popup({ maxWidth: '260px', closeButton: false, className: 'seamark-point-popup' })
          .setLngLat(feature.geometry.coordinates.slice())
          .setHTML(buildMeasurePointPopupHTML(feature.properties))
          .addTo(map)
        popup.on('close', () => {
          if (measurePopupRef.current === popup) {
            measurePopupRef.current = null
            measurePopupSeqRef.current = null
          }
        })
        measurePopupRef.current = popup
        measurePopupSeqRef.current = feature.properties.seq
      }

      map.on('click', 'measure-points', openMeasurePointPopup)
      map.on('mouseenter', 'measure-points', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'measure-points', () => {
        map.getCanvas().style.cursor = isMeasuringRef.current ? 'crosshair' : ''
      })

      map.on('click', 'measure-stops', openMeasurePointPopup)
      map.on('mouseenter', 'measure-stops', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'measure-stops', () => {
        map.getCanvas().style.cursor = isMeasuringRef.current ? 'crosshair' : ''
      })

      // ── Location history layers ──────────────────────────────────
      map.addSource('location-history-line', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
      })
      map.addLayer({
        id: 'location-history-line',
        type: 'line',
        source: 'location-history-line',
        paint: { 'line-color': '#e53e3e', 'line-width': 2.5 },
      })

      map.addSource('location-history-points', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: 'location-history-points',
        type: 'circle',
        source: 'location-history-points',
        paint: {
          'circle-radius': 5,
          'circle-color': '#e53e3e',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })
    })

    // Popups close themselves on the 'preclick' event (fired just before 'click'),
    // so by the time 'click' runs the ref is already cleared — capture the
    // pre-close state here instead, to suppress this click's other actions.
    let popupOpenBeforeClick = false
    map.on('preclick', () => {
      popupOpenBeforeClick = !!measurePopupRef.current
    })

    // General click — placement modes or measure points
    map.on('click', e => {
      if (popupOpenBeforeClick) {
        popupOpenBeforeClick = false
        return
      }
      if (isPlacingFuelRef.current) {
        onPlaceFuelPointRef.current({ lng: e.lngLat.lng, lat: e.lngLat.lat })
        return
      }
      if (isPlacingMarinaRef.current) {
        onPlaceMarinaPointRef.current({ lng: e.lngLat.lng, lat: e.lngLat.lat })
        return
      }
      if (isPlacingLockRef.current) {
        onPlaceLockPointRef.current({ lng: e.lngLat.lng, lat: e.lngLat.lat })
        return
      }
      if (isCoordsRef.current) {
        onCoordPointRef.current([e.lngLat.lng, e.lngLat.lat])
        return
      }
      if (!isMeasuringRef.current) return
      const hit = map.queryRenderedFeatures(e.point, { layers: ['seamarks-points', 'measure-points', 'measure-stops'] })
      if (hit.length > 0) return
      onAddPointRef.current({ lng: e.lngLat.lng, lat: e.lngLat.lat })
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Crosshair cursor when measuring, placing a point, or picking coords
  useEffect(() => {
    const active = isMeasuring || isPlacingFuel || isPlacingMarina || isPlacingLock || isCoords
    mapRef.current?.getCanvas().style.setProperty('cursor', active ? 'crosshair' : '')
  }, [isMeasuring, isPlacingFuel, isPlacingMarina, isPlacingLock, isCoords])

  // Update measure layer data
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.getSource('measure-line')?.setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: measurePoints.map(p => [p.lng, p.lat]) },
    })
    const fuelCapacity = parseFloat(measureFuel?.capacity)
    const fuelConfigured = !isNaN(fuelCapacity) && fuelCapacity > 0

    map.getSource('measure-points')?.setData({
      type: 'FeatureCollection',
      features: measurePoints.map((p, i) => {
        const isStop = p.type === 'stop'
        const seq = p.seq ?? (i + 1)
        const name = p.name?.trim() || (isStop ? `Postój ${seq}` : `Punkt ${seq}`)
        const t = measureEtas?.[i]
        const fuelLevel = fuelConfigured ? (measureFuelLevels?.[i] ?? null) : null
        return {
          type: 'Feature',
          properties: {
            type: p.type,
            name,
            seq,
            stopNote: p.stopNote || '',
            stopDuration: p.stopDuration || '',
            timeKind: i === 0 ? 'Odjazd' : 'Przybycie',
            timeValue: t != null ? fmtTime(t) : '—',
            fuelLevel,
            fuelCapacity: fuelConfigured ? fuelCapacity : null,
          },
          geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        }
      }),
    })

    // Close the point tooltip if its point was removed (e.g. deleted from the config panel)
    if (measurePopupSeqRef.current != null && !measurePoints.some(p => p.seq === measurePopupSeqRef.current)) {
      measurePopupRef.current?.remove()
      measurePopupRef.current = null
      measurePopupSeqRef.current = null
    }
  }, [measurePoints, measureEtas, measureFuel, measureFuelLevels])

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
    map.getSource('fuel')?.setData(fuelData)
    const vis = fuelVisible ? 'visible' : 'none'
    if (map.getLayer('fuel-points')) map.setLayoutProperty('fuel-points', 'visibility', vis)
  }, [fuelVisible, fuelData])

  // Marinas data + visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.getSource('marinas')?.setData(marinasData)
    const vis = marinasVisible ? 'visible' : 'none'
    if (map.getLayer('marina-points')) map.setLayoutProperty('marina-points', 'visibility', vis)
  }, [marinasVisible, marinasData])

  // Coord point marker
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.getSource('coord-point')?.setData({
      type: 'FeatureCollection',
      features: isCoords && coordPoint
        ? [{ type: 'Feature', geometry: { type: 'Point', coordinates: coordPoint } }]
        : [],
    })
  }, [isCoords, coordPoint])

  // Locks/bridges data + visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (locksData) map.getSource('locks')?.setData(locksData)
    const vis = locksVisible ? 'visible' : 'none'
    if (map.getLayer('lock-points')) map.setLayoutProperty('lock-points', 'visibility', vis)
  }, [locksVisible, locksData])

  // Live vessel positions data + visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (vesselsData) map.getSource('vessels')?.setData(vesselsData)
    const vis = vesselsVisible ? 'visible' : 'none'
    if (map.getLayer('vessel-points')) map.setLayoutProperty('vessel-points', 'visibility', vis)
  }, [vesselsVisible, vesselsData])

  // Location history data + visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const coords = locationHistoryVisible ? (locationHistoryPoints ?? []) : []
    map.getSource('location-history-line')?.setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: coords },
    })
    map.getSource('location-history-points')?.setData({
      type: 'FeatureCollection',
      features: coords.map(c => ({ type: 'Feature', geometry: { type: 'Point', coordinates: c } })),
    })
  }, [locationHistoryVisible, locationHistoryPoints])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
