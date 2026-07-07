// Regenerates public/seamarks.json from OpenStreetMap Overpass data.
// Run manually (npm run fetch-seamarks) whenever seamarks/locks need refreshing —
// the app loads the committed static file at runtime instead of querying Overpass live,
// since the public Overpass instance is unreliable/rate-limited for production traffic.
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { osmToGeoJSON } from '../src/utils/osmToGeoJSON.js'

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

// Combined bbox: Zatoka Gdańska + Pętla Żuławska (south, west, north, east)
const BBOX = '53.8,18.3,54.9,19.95'

const OVERPASS_QUERY = `[out:json][timeout:60];
(
  node["seamark:type"](${BBOX});
  way["seamark:type"](${BBOX});
  node["waterway"="lock"](${BBOX});
  way["waterway"="lock"](${BBOX});
  node["waterway"="lock_gate"](${BBOX});
);
out body geom;`

async function fetchFromMirror(url) {
  const res = await fetch(url, { method: 'POST', body: OVERPASS_QUERY })
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
  return res.json()
}

async function main() {
  let lastError
  for (const url of MIRRORS) {
    try {
      console.log(`Fetching from ${url} ...`)
      const json = await fetchFromMirror(url)
      const data = osmToGeoJSON(json)
      if (data.features.length === 0) throw new Error(`${url} -> 0 features (likely a regional-only mirror)`)
      const outPath = fileURLToPath(new URL('../public/seamarks.json', import.meta.url))
      await writeFile(outPath, JSON.stringify(data))
      console.log(`Wrote ${data.features.length} features to ${outPath}`)
      return
    } catch (err) {
      console.warn(`  failed: ${err.message}`)
      lastError = err
    }
  }
  throw lastError
}

main().catch(err => {
  console.error('fetch-seamarks failed:', err)
  process.exit(1)
})
