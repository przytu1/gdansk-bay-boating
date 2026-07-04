// Live vessel positions from AISStream.io (https://aisstream.io)
// Free, real-time terrestrial AIS over WebSocket. Requires a free API key
// (VITE_AISSTREAM_TOKEN). No anonymous endpoint exists for this region.

const WS_URL = 'wss://stream.aisstream.io/v0/stream'

// Gdańsk Bay + approaches, two opposite corners [[lat, lng], [lat, lng]]
export const AIS_BBOX = [[53.8, 18.3], [54.95, 19.95]]

const STALE_MS = 15 * 60 * 1000   // drop vessels not heard from in 15 min
const FLUSH_MS = 1500             // throttle map updates
const PRUNE_MS = 30 * 1000        // periodic prune of stale vessels
const MAX_RETRY_DELAY = 30 * 1000
// Initial load: keep buffering (no map render) until two consecutive check
// rounds add no new vessel. Each vessel only appears when it next transmits,
// so this lets the inflow settle before revealing everything at once.
const ROUND_MS = 5000
const SETTLE_ROUNDS = 2
const MAX_LOAD_MS = 2 * 60 * 1000   // cap the initial load; reveal vessels after this
// Cache the last picture so the next launch can show vessels instantly and
// refresh them live, instead of waiting through the initial-load phase.
const CACHE_KEY = 'bay-nav-ais-cache-v1'
const CACHE_TTL = 60 * 60 * 1000   // ignore cached positions older than 1 h
const CACHE_WRITE_MS = 10 * 1000   // throttle cache writes while live

function readAisCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY))
    if (!c || !Array.isArray(c.vessels) || !c.vessels.length) return null
    if (Date.now() - c.ts > CACHE_TTL) return null
    return c
  } catch {
    return null
  }
}

export function clearAisCache() {
  try { localStorage.removeItem(CACHE_KEY) } catch {}
}

// ── Ship type categories (AIS "Type of ship and cargo", 0–99) ───────────────
// category drives the marker colour; label is shown in the popup.
export const SHIP_CATEGORIES = {
  cargo:     { color: '#15803d', label: 'Statek towarowy' },
  tanker:    { color: '#dc2626', label: 'Tankowiec' },
  passenger: { color: '#2563eb', label: 'Statek pasażerski' },
  highspeed: { color: '#0891b2', label: 'Jednostka szybka' },
  fishing:   { color: '#a16207', label: 'Jednostka rybacka' },
  sailing:   { color: '#7c3aed', label: 'Żaglowiec' },
  pleasure:  { color: '#9333ea', label: 'Jacht / łódź rekreacyjna' },
  tug:       { color: '#ea580c', label: 'Holownik / jednostka pomocnicza' },
  authority: { color: '#0d9488', label: 'Jednostka służb' },
  other:     { color: '#6b7280', label: 'Inna / nieznana jednostka' },
}

const SPECIAL_TYPES = {
  30: ['fishing', 'Jednostka rybacka'],
  31: ['tug', 'Holownik'],
  32: ['tug', 'Holownik (długie holowanie)'],
  33: ['tug', 'Pogłębiarka / prace podwodne'],
  34: ['tug', 'Nurkowanie'],
  35: ['authority', 'Operacje wojskowe'],
  36: ['sailing', 'Żaglowiec'],
  37: ['pleasure', 'Jacht / łódź rekreacyjna'],
  50: ['authority', 'Pilotówka'],
  51: ['authority', 'Jednostka ratownicza (SAR)'],
  52: ['tug', 'Holownik'],
  53: ['tug', 'Tender portowy'],
  54: ['authority', 'Jednostka przeciwpożarowa'],
  55: ['authority', 'Jednostka służb porządkowych'],
  58: ['authority', 'Transport medyczny'],
}

export function shipTypeInfo(code) {
  if (code == null || code === 0) {
    return { category: 'other', label: 'Nieznany typ', code: null }
  }
  if (SPECIAL_TYPES[code]) {
    const [category, label] = SPECIAL_TYPES[code]
    return { category, label, code }
  }
  let category = 'other'
  if (code >= 40 && code <= 49) category = 'highspeed'
  else if (code >= 60 && code <= 69) category = 'passenger'
  else if (code >= 70 && code <= 79) category = 'cargo'
  else if (code >= 80 && code <= 89) category = 'tanker'
  return { category, label: SHIP_CATEGORIES[category].label, code }
}

const NAV_STATUS = {
  0: 'W drodze (na silniku)',
  1: 'Na kotwicy',
  2: 'Bez możliwości manewru',
  3: 'Ograniczona zdolność manewrowa',
  4: 'Ograniczony zanurzeniem',
  5: 'Zacumowany',
  6: 'Na mieliźnie',
  7: 'Zajęty połowem',
  8: 'W drodze (pod żaglami)',
  11: 'Holowanie z tyłu',
  12: 'Holowanie z przodu',
  14: 'AIS-SART (alarm ratunkowy)',
}

export function navStatusLabel(code) {
  if (code == null) return null
  return NAV_STATUS[code] || null
}

// Nav-status codes that mean the vessel isn't underway, regardless of speed
// (anchored / moored / aground) — used to pick the stationary marker shape.
const STATIONARY_NAV_CODES = new Set([1, 5, 6])
const MOVING_SPEED_THRESHOLD_KN = 0.5

// ── Stream factory ──────────────────────────────────────────────────────────
export function createAisStream({ apiKey, onData, onStatus }) {
  const vessels = new Map()
  let ws = null
  let flushTimer = null
  let pruneTimer = null
  let roundTimer = null
  let loadTimeout = null
  let reconnectTimer = null
  let retry = 0
  let stopped = false

  // Initial-load state
  let loaded = false
  let loadStart = 0
  let lastRoundCount = 0
  let noNewRounds = 0
  let lastCacheWrite = 0

  // Number of vessels with a usable position (used both for the snapshot and
  // for the settle-detection round counter).
  function positionedCount() {
    const now = Date.now()
    let n = 0
    for (const v of vessels.values()) {
      if (now - v.lastSeen > STALE_MS) continue
      if (typeof v.lat === 'number' && typeof v.lng === 'number') n++
    }
    return n
  }

  function snapshot() {
    const now = Date.now()
    const features = []
    for (const [key, v] of vessels) {
      if (now - v.lastSeen > STALE_MS) { vessels.delete(key); continue }
      if (typeof v.lat !== 'number' || typeof v.lng !== 'number') continue

      const info = shipTypeInfo(v.type)
      const heading =
        (typeof v.heading === 'number' && v.heading !== 511) ? v.heading
        : (typeof v.cog === 'number' && v.cog !== 360) ? v.cog
        : null

      const navCode = typeof v.navStatus === 'number' ? v.navStatus : null
      const sogVal = (typeof v.sog === 'number' && v.sog < 102.3) ? v.sog : null
      const isMoving = STATIONARY_NAV_CODES.has(navCode)
        ? false
        : (sogVal != null ? sogVal >= MOVING_SPEED_THRESHOLD_KN : true)

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [v.lng, v.lat] },
        properties: {
          mmsi: v.mmsi,
          name: v.name || '',
          typeLabel: info.label,
          typeCode: info.code,
          iconKey: `vessel-${info.category}-${isMoving ? 'moving' : 'anchored'}`,
          rotation: heading == null ? 0 : heading,
          hasHeading: heading != null,
          sog: sogVal,
          cog: (typeof v.cog === 'number' && v.cog !== 360) ? v.cog : null,
          heading: (typeof v.heading === 'number' && v.heading !== 511) ? v.heading : null,
          navStatus: navStatusLabel(v.navStatus),
          callSign: v.callSign || '',
          destination: v.destination || '',
          draught: (typeof v.draught === 'number' && v.draught > 0) ? v.draught : null,
          imo: v.imo || null,
          lengthM: v.length || null,
          widthM: v.width || null,
          lastSeen: v.observedAt ?? v.lastSeen,
        },
      })
    }
    return { type: 'FeatureCollection', features }
  }

  // Push the current picture. Before the initial load settles we only report
  // progress (count + elapsed) and keep the map empty; afterwards we render.
  function publish() {
    if (loaded) {
      const fc = snapshot()
      onData(fc)
      onStatus?.({ state: 'connected', count: fc.features.length, lastUpdate: Date.now(), fromCache: false })
      maybeWriteCache()
    } else {
      onStatus?.({ state: 'loading', count: positionedCount(), loadStart })
    }
  }

  // Persist the current vessels so the next launch can seed from them.
  function writeCache() {
    try {
      const now = Date.now()
      const arr = []
      for (const v of vessels.values()) {
        if (now - v.lastSeen > STALE_MS) continue
        if (typeof v.lat !== 'number' || typeof v.lng !== 'number') continue
        arr.push(v)
      }
      if (arr.length) localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: now, vessels: arr }))
      lastCacheWrite = now
    } catch {}
  }

  function maybeWriteCache() {
    if (Date.now() - lastCacheWrite > CACHE_WRITE_MS) writeCache()
  }

  function scheduleFlush() {
    if (flushTimer) return
    flushTimer = setTimeout(() => { flushTimer = null; publish() }, FLUSH_MS)
  }

  // Every ROUND_MS during the initial load, check whether new vessels appeared.
  // After SETTLE_ROUNDS consecutive rounds with no new vessel, reveal the map.
  function checkRound() {
    if (loaded) return
    const count = positionedCount()
    if (count > lastRoundCount) noNewRounds = 0
    else noNewRounds += 1
    lastRoundCount = count
    // Don't settle on an empty picture — wait until at least one vessel arrives.
    if (count > 0 && noNewRounds >= SETTLE_ROUNDS) finishLoading()
  }

  function finishLoading() {
    if (loaded) return
    loaded = true
    if (roundTimer) { clearInterval(roundTimer); roundTimer = null }
    if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null }
    const fc = snapshot()
    onData(fc)
    onStatus?.({
      state: 'connected',
      count: fc.features.length,
      lastUpdate: Date.now(),
      loadDurationMs: Date.now() - loadStart,
    })
    writeCache()
    pruneTimer = setInterval(publish, PRUNE_MS)
  }

  function handleMessage(raw) {
    let msg
    try { msg = JSON.parse(raw) } catch { return }

    // AISStream reports auth/subscription problems as a plain error message.
    if (msg.error) {
      onStatus?.({ state: 'error', message: `AISStream: ${msg.error}` })
      stop()
      return
    }

    const meta = msg.MetaData || {}
    const mmsi = meta.MMSI ?? meta.MMSI_String
    if (mmsi == null) return
    const key = String(mmsi)
    const v = vessels.get(key) || { mmsi: key }
    v.lastSeen = Date.now()
    v.observedAt = v.lastSeen

    if (meta.ShipName && meta.ShipName.trim()) v.name = meta.ShipName.trim()
    if (typeof meta.latitude === 'number') { v.lat = meta.latitude; v.lng = meta.longitude }

    if (msg.MessageType === 'PositionReport') {
      const p = (msg.Message && msg.Message.PositionReport) || {}
      if (typeof p.Latitude === 'number') { v.lat = p.Latitude; v.lng = p.Longitude }
      if (typeof p.Cog === 'number') v.cog = p.Cog
      if (typeof p.Sog === 'number') v.sog = p.Sog
      if (typeof p.TrueHeading === 'number') v.heading = p.TrueHeading
      if (typeof p.NavigationalStatus === 'number') v.navStatus = p.NavigationalStatus
    } else if (msg.MessageType === 'ShipStaticData') {
      const s = (msg.Message && msg.Message.ShipStaticData) || {}
      if (s.Name && s.Name.trim()) v.name = s.Name.trim()
      if (typeof s.Type === 'number') v.type = s.Type
      if (s.CallSign && s.CallSign.trim()) v.callSign = s.CallSign.trim()
      if (s.Destination && s.Destination.trim()) v.destination = s.Destination.trim()
      if (typeof s.MaximumStaticDraught === 'number') v.draught = s.MaximumStaticDraught
      if (typeof s.ImoNumber === 'number' && s.ImoNumber > 0) v.imo = s.ImoNumber
      const d = s.Dimension
      if (d) {
        if (typeof d.A === 'number' && typeof d.B === 'number') v.length = d.A + d.B
        if (typeof d.C === 'number' && typeof d.D === 'number') v.width = d.C + d.D
      }
    }

    vessels.set(key, v)
    scheduleFlush()
  }

  function connect() {
    if (stopped) return
    onStatus?.({ state: retry === 0 ? 'connecting' : 'reconnecting' })
    try {
      ws = new WebSocket(WS_URL)
    } catch {
      scheduleReconnect()
      return
    }
    // AISStream sends frames as binary — decode to text before parsing.
    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      retry = 0
      onStatus?.(loaded ? { state: 'connected' } : { state: 'loading', count: positionedCount(), loadStart })
      ws.send(JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: [AIS_BBOX],
        FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
      }))
    }
    ws.onmessage = ev => {
      const d = ev.data
      if (typeof d === 'string') handleMessage(d)
      else if (d instanceof ArrayBuffer) handleMessage(new TextDecoder().decode(d))
      else if (d && typeof d.text === 'function') d.text().then(handleMessage)  // Blob fallback
    }
    ws.onerror = () => { /* close handler drives reconnect */ }
    ws.onclose = () => {
      if (stopped) return
      scheduleReconnect()
    }
  }

  function scheduleReconnect() {
    if (stopped || reconnectTimer) return
    retry += 1
    const delay = Math.min(MAX_RETRY_DELAY, 1000 * 2 ** retry)
    onStatus?.({ state: 'reconnecting' })
    reconnectTimer = setTimeout(() => { reconnectTimer = null; connect() }, delay)
  }

  function start(useCache = true) {
    stopped = false
    loaded = false
    loadStart = Date.now()
    lastRoundCount = 0
    noNewRounds = 0
    lastCacheWrite = 0

    const cached = useCache ? readAisCache() : null
    if (cached) {
      // Seed from cache: show positions immediately and refresh them live,
      // skipping the initial-load buffer entirely.
      const now = Date.now()
      for (const v of cached.vessels) {
        if (v && v.mmsi != null) vessels.set(String(v.mmsi), { ...v, lastSeen: now })
      }
      loaded = true
      const fc = snapshot()
      onData(fc)
      onStatus?.({ state: 'connected', count: fc.features.length, lastUpdate: cached.ts, fromCache: true })
      pruneTimer = setInterval(publish, PRUNE_MS)
    } else {
      // No usable cache — run the settle-detection initial load, but cap it.
      roundTimer = setInterval(checkRound, ROUND_MS)
      loadTimeout = setTimeout(finishLoading, MAX_LOAD_MS)
    }
    connect()
  }

  function stop() {
    stopped = true
    writeCache()
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null }
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    if (pruneTimer) { clearInterval(pruneTimer); pruneTimer = null }
    if (roundTimer) { clearInterval(roundTimer); roundTimer = null }
    if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null }
    if (ws) {
      ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null
      try { ws.close() } catch {}
      ws = null
    }
    vessels.clear()
  }

  return { start, stop }
}
