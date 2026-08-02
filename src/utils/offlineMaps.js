const REGIONS_KEY = 'bay-nav-offline-regions'

// Must match the cacheName of the mapbox runtime-caching rule in vite.config.js.
export const OFFLINE_CACHE_NAME = 'mapbox-offline-tiles'

// Mapbox mobile SDKs cap a single offline pack at a similar order of
// magnitude; used here to stop a huge area/zoom combo from hammering the
// Mapbox API and filling up device storage.
export const MAX_ESTIMATED_TILES = 6000

export function loadOfflineRegions() {
  try {
    return JSON.parse(localStorage.getItem(REGIONS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveOfflineRegions(regions) {
  localStorage.setItem(REGIONS_KEY, JSON.stringify(regions))
}

export function addOfflineRegion(region) {
  const regions = [...loadOfflineRegions(), region]
  saveOfflineRegions(regions)
  return regions
}

export function removeOfflineRegion(id) {
  const regions = loadOfflineRegions().filter(r => r.id !== id)
  saveOfflineRegions(regions)
  return regions
}

// Cached tiles aren't tracked per-region (regions can overlap and share
// tiles), so there's no precise per-region eviction — only a full reset.
export async function clearAllOfflineMaps() {
  saveOfflineRegions([])
  if ('caches' in window) await caches.delete(OFFLINE_CACHE_NAME)
}

function lngLatToTileXY(lng, lat, z) {
  const n = 2 ** z
  const x = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  )
  return [x, y]
}

// Rough tile-count estimate (standard XYZ tiling) shown to the user before
// downloading — the actual sweep below doesn't fetch tiles by URL, so this
// is informational only, not a precise byte count.
export function estimateTileCount(bounds, minZoom, maxZoom) {
  const [[west, south], [east, north]] = bounds
  let total = 0
  for (let z = minZoom; z <= maxZoom; z++) {
    const [x1, y1] = lngLatToTileXY(west, north, z)
    const [x2, y2] = lngLatToTileXY(east, south, z)
    total += (Math.abs(x2 - x1) + 1) * (Math.abs(y2 - y1) + 1)
  }
  return total
}

function waitForIdle(map, timeoutMs = 8000) {
  return new Promise(resolve => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      map.off('idle', finish)
      resolve()
    }
    map.once('idle', finish)
    setTimeout(finish, timeoutMs)
  })
}

// Mapbox GL JS has no public "download this region for offline use" API on
// the web (that's mobile-SDK-only) — so this sweeps the live camera across
// `bounds` at every zoom level instead, letting the normal tile loader do
// the fetching. A workbox runtime-caching rule then persists every
// api.mapbox.com response it sees, tiles included, for offline reuse.
export async function downloadRegion(map, { bounds, minZoom, maxZoom, onProgress, isCancelled }) {
  const [[west, south], [east, north]] = bounds
  const originalCenter = map.getCenter()
  const originalZoom = map.getZoom()

  const interactionHandlers = [
    map.dragPan, map.scrollZoom, map.dragRotate, map.doubleClickZoom, map.touchZoomRotate, map.keyboard,
  ].filter(Boolean)
  interactionHandlers.forEach(h => h.disable())

  try {
    const steps = []
    for (let z = minZoom; z <= maxZoom; z++) {
      map.jumpTo({ center: [(west + east) / 2, (south + north) / 2], zoom: z })
      const b = map.getBounds()
      // Shrink the measured viewport span a bit so consecutive steps overlap
      // instead of leaving gaps at the seams.
      const spanLng = (b.getEast() - b.getWest()) * 0.85
      const spanLat = (b.getNorth() - b.getSouth()) * 0.85
      const cols = Math.max(1, Math.ceil((east - west) / spanLng))
      const rows = Math.max(1, Math.ceil((north - south) / spanLat))
      const stepLng = (east - west) / cols
      const stepLat = (north - south) / rows
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          steps.push({
            zoom: z,
            center: [west + stepLng * (c + 0.5), south + stepLat * (r + 0.5)],
          })
        }
      }
    }

    for (let i = 0; i < steps.length; i++) {
      if (isCancelled?.()) break
      const step = steps[i]
      map.jumpTo({ center: step.center, zoom: step.zoom })
      await waitForIdle(map)
      onProgress?.(i + 1, steps.length)
    }
  } finally {
    map.jumpTo({ center: originalCenter, zoom: originalZoom })
    interactionHandlers.forEach(h => h.enable())
  }
}
