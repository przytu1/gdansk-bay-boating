import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import Sidebar from './components/Sidebar'
import MapView from './components/MapView'
import DistanceBar from './components/DistanceBar'
import CoordBar from './components/CoordBar'
import FuelStationForm from './components/FuelStationForm'
import { fetchSeamarks, getSeamarksCacheInfo, clearSeamarksCache } from './utils/seamarks'
import { BUILT_IN_FUEL_STATIONS, loadCustomFuelStations, saveCustomFuelStations, stationsToGeoJSON } from './utils/customFuel'
import { BUILT_IN_MARINAS, loadUserMarinas, saveUserMarinas, marinasToGeoJSON } from './utils/customMarinas'
import { BUILT_IN_LOCKS, loadUserLocks, saveUserLocks, locksToGeoJSON } from './utils/customLocks'
import { createAisStream } from './utils/aisStream'

const STORAGE_KEY = 'bay-nav-measurements'
const AIS_LOAD_KEY = 'bay-nav-ais-last-load-ms'

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  // Tools (exclusive, interactive)
  const [activeTool, setActiveTool] = useState(null)
  const [measurePoints, setMeasurePoints] = useState([])
  const [measureSpeeds, setMeasureSpeeds] = useState([])
  const [measureDepartureTime, setMeasureDepartureTime] = useState('')
  const [coordPoint, setCoordPoint] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [savedMeasurements, setSavedMeasurements] = useState(loadSaved)

  // Layer toggles (independent)
  const [visibleLayers, setVisibleLayers] = useState({ seamarks: false, fuel: false, marinas: false, locks: false, ships: false })
  const [customFuelStations, setCustomFuelStations] = useState(loadCustomFuelStations)
  const [isPlacingFuel, setIsPlacingFuel] = useState(false)
  const [pendingFuelPoint, setPendingFuelPoint] = useState(null)
  const [userMarinas, setUserMarinas] = useState(loadUserMarinas)
  const [isPlacingMarina, setIsPlacingMarina] = useState(false)
  const [pendingMarinaPoint, setPendingMarinaPoint] = useState(null)
  const [userLocks, setUserLocks] = useState(loadUserLocks)
  const [isPlacingLock, setIsPlacingLock] = useState(false)
  const [pendingLockPoint, setPendingLockPoint] = useState(null)
  const [seamarksData, setSeamarksData] = useState(null)
  const [seamarksLoading, setSeamarksLoading] = useState(false)
  const [seamarksError, setSeamarksError] = useState(null)
  const [seamarksInfo, setSeamarksInfo] = useState(getSeamarksCacheInfo)

  // Live vessel positions (AIS)
  const [vesselsData, setVesselsData] = useState({ type: 'FeatureCollection', features: [] })
  const [aisStatus, setAisStatus] = useState(null)
  const [aisNonce, setAisNonce] = useState(0)
  const [, setAisTick] = useState(0)
  const [prevLoadDuration, setPrevLoadDuration] = useState(() => {
    const v = localStorage.getItem(AIS_LOAD_KEY)
    return v ? Number(v) : null
  })
  const aisStreamRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMeasurements))
  }, [savedMeasurements])

  // Persist custom fuel stations
  useEffect(() => {
    saveCustomFuelStations(customFuelStations)
  }, [customFuelStations])

  const fuelData = useMemo(() => stationsToGeoJSON([...BUILT_IN_FUEL_STATIONS, ...customFuelStations]), [customFuelStations])

  useEffect(() => { saveUserMarinas(userMarinas) }, [userMarinas])
  const marinasData = useMemo(() => marinasToGeoJSON([...BUILT_IN_MARINAS, ...userMarinas]), [userMarinas])

  useEffect(() => { saveUserLocks(userLocks) }, [userLocks])
  const locksData = useMemo(() => locksToGeoJSON([...BUILT_IN_LOCKS, ...userLocks]), [userLocks])

  // Update cache info whenever data loads
  useEffect(() => {
    if (seamarksData) setSeamarksInfo(getSeamarksCacheInfo())
  }, [seamarksData])

  // Fetch seamarks on first toggle-on
  useEffect(() => {
    if (!visibleLayers.seamarks || seamarksData) return
    setSeamarksLoading(true)
    setSeamarksError(null)
    fetchSeamarks()
      .then(data => { setSeamarksData(data); setSeamarksLoading(false) })
      .catch(() => { setSeamarksError('Nie udało się załadować znaków nawigacyjnych. Sprawdź połączenie.'); setSeamarksLoading(false) })
  }, [visibleLayers.seamarks, seamarksData])

  // Open/close the AIS WebSocket stream when the ships layer is toggled
  useEffect(() => {
    if (!visibleLayers.ships) {
      setAisStatus(null)
      return
    }
    const apiKey = import.meta.env.VITE_AISSTREAM_TOKEN
    if (!apiKey) {
      setAisStatus({
        state: 'error',
        message: 'Brak klucza API. Dodaj VITE_AISSTREAM_TOKEN do pliku .env (darmowy klucz: aisstream.io), a następnie zrestartuj aplikację.',
      })
      return
    }
    setVesselsData({ type: 'FeatureCollection', features: [] })
    setAisStatus({ state: 'connecting' })
    const stream = createAisStream({
      apiKey,
      onData: setVesselsData,
      onStatus: st => setAisStatus(prev => (prev && prev.state === 'error' && !st.state)
        ? prev
        : { ...(prev || {}), ...st }),
    })
    aisStreamRef.current = stream
    stream.start()
    return () => { stream.stop(); aisStreamRef.current = null }
  }, [visibleLayers.ships, aisNonce])

  // Keep the loading stopwatch ticking once per second while buffering.
  useEffect(() => {
    if (aisStatus?.state !== 'loading') return
    const id = setInterval(() => setAisTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [aisStatus?.state])

  // Persist how long the last full load took, so the next one can show it.
  useEffect(() => {
    if (aisStatus?.loadDurationMs) {
      localStorage.setItem(AIS_LOAD_KEY, String(aisStatus.loadDurationMs))
      setPrevLoadDuration(aisStatus.loadDurationMs)
    }
  }, [aisStatus?.loadDurationMs])

  function handleRefreshAis() {
    setVesselsData({ type: 'FeatureCollection', features: [] })
    setAisStatus({ state: 'connecting' })
    setAisNonce(n => n + 1)
  }

  function handleStartPlaceFuel() {
    setMenuOpen(false)
    setIsPlacingFuel(true)
    setPendingFuelPoint(null)
    setVisibleLayers(prev => ({ ...prev, fuel: true }))
  }

  function handleMapFuelPoint(point) {
    setPendingFuelPoint(point)
  }

  function handleSaveFuelStation({ name, info }) {
    const point = pendingFuelPoint
    if (!point) return
    const newStation = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
      name,
      info: info || '',
      lng: point.lng,
      lat: point.lat,
      createdAt: Date.now(),
    }
    setCustomFuelStations(prev => [...prev, newStation])
    setPendingFuelPoint(null)
    setIsPlacingFuel(false)
  }

  function handleCancelFuelPlace() {
    setIsPlacingFuel(false)
    setPendingFuelPoint(null)
  }

  function handleDeleteFuelStation(id) {
    setCustomFuelStations(prev => prev.filter(s => s.id !== id))
  }

  function handleStartPlaceMarina() {
    setMenuOpen(false)
    setIsPlacingMarina(true)
    setPendingMarinaPoint(null)
    setVisibleLayers(prev => ({ ...prev, marinas: true }))
  }

  function handleMapMarinaPoint(point) {
    setPendingMarinaPoint(point)
  }

  function handleSaveMarina({ name, info }) {
    const point = pendingMarinaPoint
    if (!point) return
    const newMarina = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
      name,
      info: info || '',
      lng: point.lng,
      lat: point.lat,
      createdAt: Date.now(),
    }
    setUserMarinas(prev => [...prev, newMarina])
    setPendingMarinaPoint(null)
    setIsPlacingMarina(false)
  }

  function handleCancelMarinaPlace() {
    setIsPlacingMarina(false)
    setPendingMarinaPoint(null)
  }

  function handleDeleteMarina(id) {
    setUserMarinas(prev => prev.filter(m => m.id !== id))
  }

  function handleStartPlaceLock() {
    setMenuOpen(false)
    setIsPlacingLock(true)
    setPendingLockPoint(null)
    setVisibleLayers(prev => ({ ...prev, locks: true }))
  }

  function handleMapLockPoint(point) {
    setPendingLockPoint(point)
  }

  function handleSaveLock({ name, info }) {
    const point = pendingLockPoint
    if (!point) return
    const newLock = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
      name,
      subtitle: '',
      type: 'lock',
      info: info || '',
      lng: point.lng,
      lat: point.lat,
      createdAt: Date.now(),
    }
    setUserLocks(prev => [...prev, newLock])
    setPendingLockPoint(null)
    setIsPlacingLock(false)
  }

  function handleCancelLockPlace() {
    setIsPlacingLock(false)
    setPendingLockPoint(null)
  }

  function handleDeleteLock(id) {
    setUserLocks(prev => prev.filter(l => l.id !== id))
  }

  function handleRefreshSeamarks() {
    clearSeamarksCache()
    setSeamarksData(null)
    setSeamarksError(null)
    setSeamarksInfo(null)
    setSeamarksLoading(true)
    fetchSeamarks()
      .then(data => { setSeamarksData(data); setSeamarksLoading(false) })
      .catch(() => { setSeamarksError('Nie udało się zaktualizować bazy. Sprawdź połączenie.'); setSeamarksLoading(false) })
  }

  function handleMeasureSpeedChange(index, value) {
    setMeasureSpeeds(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function handleToolChange(toolId) {
    const next = activeTool === toolId ? null : toolId
    setActiveTool(next)
    setMeasurePoints([])
    setMeasureSpeeds([])
    setMeasureDepartureTime('')
    setCoordPoint(null)
    setEditingId(null)
  }

  function handleLayerToggle(layerId) {
    setVisibleLayers(prev => ({ ...prev, [layerId]: !prev[layerId] }))
  }

  const handleAddPoint = useCallback((lngLat) => {
    setMeasurePoints(pts => [...pts, lngLat])
  }, [])

  function handleSaveMeasurement(name) {
    if (editingId) {
      setSavedMeasurements(prev =>
        prev.map(m => m.id === editingId
          ? { ...m, name, points: measurePoints, speeds: measureSpeeds, departureTime: measureDepartureTime }
          : m)
      )
    } else {
      const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)
      setSavedMeasurements(prev => [...prev, {
        id, name, points: measurePoints,
        speeds: measureSpeeds, departureTime: measureDepartureTime,
        createdAt: Date.now(),
      }])
      setEditingId(id)
    }
  }

  function handleLoadMeasurement(m) {
    setActiveTool('measure')
    setMeasurePoints(m.points)
    setMeasureSpeeds(m.speeds || [])
    setMeasureDepartureTime(m.departureTime || '')
    setEditingId(m.id)
    setMenuOpen(false)
  }

  function handleDeleteMeasurement(id) {
    setSavedMeasurements(prev => prev.filter(m => m.id !== id))
    if (editingId === id) { setMeasurePoints([]); setEditingId(null) }
  }

  const editingMeasurement = savedMeasurements.find(m => m.id === editingId) ?? null

  return (
    <div className="layout">
      <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Otwórz menu">
        <HamburgerIcon />
      </button>
      <Sidebar
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeTool={activeTool}
        onToolChange={handleToolChange}
        visibleLayers={visibleLayers}
        onLayerToggle={handleLayerToggle}
        seamarksLoading={seamarksLoading}
        seamarksError={seamarksError}
        seamarksInfo={seamarksInfo}
        onRefreshSeamarks={handleRefreshSeamarks}
        aisStatus={aisStatus}
        aisPrevLoadDuration={prevLoadDuration}
        onRefreshAis={handleRefreshAis}
        customFuelStations={customFuelStations}
        builtInFuelCount={BUILT_IN_FUEL_STATIONS.length}
        onStartPlaceFuel={handleStartPlaceFuel}
        onDeleteFuelStation={handleDeleteFuelStation}
        userMarinas={userMarinas}
        builtInMarinaCount={BUILT_IN_MARINAS.length}
        onStartPlaceMarina={handleStartPlaceMarina}
        onDeleteMarina={handleDeleteMarina}
        userLocks={userLocks}
        builtInLockCount={BUILT_IN_LOCKS.length}
        onStartPlaceLock={handleStartPlaceLock}
        onDeleteLock={handleDeleteLock}
        savedMeasurements={savedMeasurements}
        editingId={editingId}
        onLoadMeasurement={handleLoadMeasurement}
        onDeleteMeasurement={handleDeleteMeasurement}
      />
      <main className="map-pane">
        <MapView
          isMeasuring={activeTool === 'measure'}
          measurePoints={measurePoints}
          onAddPoint={handleAddPoint}
          seamarksVisible={visibleLayers.seamarks}
          seamarksData={seamarksData}
          fuelVisible={visibleLayers.fuel}
          fuelData={fuelData}
          isPlacingFuel={isPlacingFuel}
          onPlaceFuelPoint={handleMapFuelPoint}
          marinasVisible={visibleLayers.marinas}
          marinasData={marinasData}
          isPlacingMarina={isPlacingMarina}
          onPlaceMarinaPoint={handleMapMarinaPoint}
          locksVisible={visibleLayers.locks}
          locksData={locksData}
          isPlacingLock={isPlacingLock}
          onPlaceLockPoint={handleMapLockPoint}
          vesselsVisible={visibleLayers.ships}
          vesselsData={vesselsData}
          isCoords={activeTool === 'coords'}
          coordPoint={coordPoint}
          onCoordPoint={setCoordPoint}
        />
        {isPlacingFuel && !pendingFuelPoint && (
          <div className="place-fuel-banner">
            <span>Kliknij na mapie gdzie znajduje się stacja paliw</span>
            <button onClick={handleCancelFuelPlace}>Anuluj</button>
          </div>
        )}
        {pendingFuelPoint && (
          <FuelStationForm
            point={pendingFuelPoint}
            onSave={handleSaveFuelStation}
            onCancel={handleCancelFuelPlace}
            formTitle="Nowa stacja paliw"
            namePlaceholder="np. Marina Gdynia – Lotos"
            infoPlaceholder={'Olej napędowy, benzyna\nGodziny: maj–wrz 8:00–20:00\nTel: +48 519 075 699'}
            saveLabel="Zapisz stację"
            headerColor="#15803d"
          />
        )}
        {isPlacingMarina && !pendingMarinaPoint && (
          <div className="place-fuel-banner" style={{ background: '#1e40af' }}>
            <span>Kliknij na mapie gdzie znajduje się marina lub przystań</span>
            <button onClick={handleCancelMarinaPlace}>Anuluj</button>
          </div>
        )}
        {pendingMarinaPoint && (
          <FuelStationForm
            point={pendingMarinaPoint}
            onSave={handleSaveMarina}
            onCancel={handleCancelMarinaPlace}
            formTitle="Nowa marina / przystań"
            namePlaceholder="np. Przystań Sobieszewo"
            infoPlaceholder={'Głębokość: 2.5 m\nMiejsca: 30 jachtów\nMedia: prąd, woda\nTel: +48 ...'}
            saveLabel="Zapisz marinę"
            headerColor="#1e40af"
          />
        )}
        {isPlacingLock && !pendingLockPoint && (
          <div className="place-fuel-banner" style={{ background: '#0e7490' }}>
            <span>Kliknij na mapie gdzie znajduje się śluza lub most zwodzony</span>
            <button onClick={handleCancelLockPlace}>Anuluj</button>
          </div>
        )}
        {pendingLockPoint && (
          <FuelStationForm
            point={pendingLockPoint}
            onSave={handleSaveLock}
            onCancel={handleCancelLockPlace}
            formTitle="Nowa śluza / most zwodzony"
            namePlaceholder="np. Śluza Kanał Portowy"
            infoPlaceholder={'Otwierana na żądanie\nVHF: kanał 12\nTel: +48 ...'}
            saveLabel="Zapisz"
            headerColor="#0e7490"
          />
        )}
        {activeTool === 'coords' && (
          <CoordBar point={coordPoint} />
        )}
        {activeTool === 'measure' && (
          <DistanceBar
            points={measurePoints}
            speeds={measureSpeeds}
            departureTime={measureDepartureTime}
            onSpeedChange={handleMeasureSpeedChange}
            onDepartureTimeChange={setMeasureDepartureTime}
            editingMeasurement={editingMeasurement}
            onSave={handleSaveMeasurement}
          />
        )}
      </main>
    </div>
  )
}

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect y="3" width="22" height="2.5" rx="1.25" fill="currentColor" />
      <rect y="9.75" width="22" height="2.5" rx="1.25" fill="currentColor" />
      <rect y="16.5" width="22" height="2.5" rx="1.25" fill="currentColor" />
    </svg>
  )
}
