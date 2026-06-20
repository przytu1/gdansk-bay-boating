import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const GDANSK_BAY_CENTER = [18.709516900145584, 54.428935648705995]

const SEAMARK_LAYERS = ['seamarks-points', 'seamarks-areas-fill', 'seamarks-areas-line']

const TYPE_LABELS = {
  buoy_lateral: 'Lateral Buoy',
  buoy_cardinal: 'Cardinal Buoy',
  buoy_isolated_danger: 'Isolated Danger Buoy',
  buoy_safe_water: 'Safe Water Buoy',
  buoy_special_purpose: 'Special Purpose Buoy',
  light_major: 'Major Light',
  light_minor: 'Minor Light',
  lighthouse: 'Lighthouse',
  beacon_lateral: 'Lateral Beacon',
  beacon_cardinal: 'Cardinal Beacon',
  landmark: 'Landmark',
  restricted_area: 'Restricted Area',
  precautionary_area: 'Precautionary Area',
  separation_zone: 'Traffic Separation Zone',
  wreck: 'Wreck',
  rock: 'Rock / Shoal',
  obstruction: 'Obstruction',
}

function formatType(type) {
  return TYPE_LABELS[type] || (type || 'Navigation Mark').replace(/_/g, ' ')
}

function buildPopupHTML(props) {
  const name = props.name || props['seamark:name'] || ''
  const type = formatType(props['seamark:type'])
  const lines = []

  const cardinal = props['seamark:buoy_cardinal:category']
  if (cardinal) lines.push(`Direction: <strong>${cardinal}</strong>`)

  const lateral = props['seamark:buoy_lateral:category']
  if (lateral) lines.push(`Side: <strong>${lateral}</strong>`)

  const lightChar = props['seamark:light:character'] || props['seamark:light:1:character']
  if (lightChar) {
    const period = props['seamark:light:period'] || props['seamark:light:1:period']
    lines.push(`Light: <strong>${lightChar}${period ? ' ' + period + 's' : ''}</strong>`)
  }

  const colour = props['seamark:buoy_lateral:colour']
    || props['seamark:buoy_cardinal:colour']
    || props['seamark:colour']
  if (colour) lines.push(`Colour: <strong>${colour.replace(/;/g, ' / ')}</strong>`)

  return `<div class="seamark-popup">
    <div class="seamark-popup-title">${name || type}</div>
    ${name ? `<div class="seamark-popup-type">${type}</div>` : ''}
    ${lines.length ? `<div class="seamark-popup-details">${lines.map(l => `<div>${l}</div>`).join('')}</div>` : ''}
  </div>`
}

export default function MapView({ isMeasuring, measurePoints, onAddPoint, seamarksVisible, seamarksData }) {
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
            'match', ['get', 'seamark:type'],
            'restricted_area', '#fc8181',
            'precautionary_area', '#f6ad55',
            'separation_zone', '#90cdf4',
            '#a0aec0',
          ],
          'fill-opacity': 0.2,
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
            'match', ['get', 'seamark:type'],
            'restricted_area', '#e53e3e',
            'precautionary_area', '#dd6b20',
            'separation_zone', '#3182ce',
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

      // Seamark point popup
      map.on('click', 'seamarks-points', e => {
        const feature = e.features[0]
        new mapboxgl.Popup({ maxWidth: '260px' })
          .setLngLat(feature.geometry.coordinates.slice())
          .setHTML(buildPopupHTML(feature.properties))
          .addTo(map)
      })

      map.on('mouseenter', 'seamarks-points', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'seamarks-points', () => {
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
    const update = () => {
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
    }
    map.isStyleLoaded() ? update() : map.once('load', update)
  }, [measurePoints])

  // Seamarks data + visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const update = () => {
      if (seamarksData) map.getSource('seamarks')?.setData(seamarksData)
      const vis = seamarksVisible && seamarksData ? 'visible' : 'none'
      SEAMARK_LAYERS.forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis)
      })
    }
    map.isStyleLoaded() ? update() : map.once('load', update)
  }, [seamarksVisible, seamarksData])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
