import { useState, useCallback, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import MapView from './components/MapView'
import DistanceBar from './components/DistanceBar'
import { fetchSeamarks, getSeamarksCacheInfo, clearSeamarksCache } from './utils/seamarks'

const STORAGE_KEY = 'bay-nav-measurements'

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  // Tools (exclusive, interactive)
  const [activeTool, setActiveTool] = useState(null)
  const [measurePoints, setMeasurePoints] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [savedMeasurements, setSavedMeasurements] = useState(loadSaved)

  // Layer toggles (independent)
  const [visibleLayers, setVisibleLayers] = useState({ seamarks: false })
  const [seamarksData, setSeamarksData] = useState(null)
  const [seamarksLoading, setSeamarksLoading] = useState(false)
  const [seamarksError, setSeamarksError] = useState(null)
  const [seamarksInfo, setSeamarksInfo] = useState(getSeamarksCacheInfo)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMeasurements))
  }, [savedMeasurements])

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

  function handleToolChange(toolId) {
    const next = activeTool === toolId ? null : toolId
    setActiveTool(next)
    setMeasurePoints([])
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
        prev.map(m => m.id === editingId ? { ...m, name, points: measurePoints } : m)
      )
    } else {
      const id = crypto.randomUUID()
      setSavedMeasurements(prev => [...prev, { id, name, points: measurePoints, createdAt: Date.now() }])
      setEditingId(id)
    }
  }

  function handleLoadMeasurement(m) {
    setActiveTool('measure')
    setMeasurePoints(m.points)
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
        />
        {activeTool === 'measure' && (
          <DistanceBar
            points={measurePoints}
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
