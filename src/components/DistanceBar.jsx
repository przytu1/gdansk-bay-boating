import { useState, useEffect } from 'react'
import { totalDistanceKm, kmToNm } from '../utils/distance'
import './DistanceBar.css'

export default function DistanceBar({ points, editingMeasurement, onSave }) {
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    if (editingMeasurement) setName(editingMeasurement.name)
  }, [editingMeasurement?.id])

  if (points.length < 2) {
    return (
      <div className="distance-bar distance-bar--hint">
        Click on the map to place measurement points
      </div>
    )
  }

  const km = totalDistanceKm(points)
  const nm = kmToNm(km)

  function handleSaveClick() {
    if (!saving) { setSaving(true); return }
    if (name.trim()) {
      onSave(name.trim())
      setSaving(false)
    }
  }

  return (
    <div className="distance-bar">
      <div className="distance-values">
        <span className="distance-km">{km.toFixed(2)} km</span>
        <span className="distance-sep">·</span>
        <span className="distance-nm">{nm.toFixed(2)} NM</span>
        <span className="distance-pts">{points.length} pts</span>
      </div>
      <div className="distance-actions">
        {saving ? (
          <>
            <input
              className="distance-name-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name this measurement…"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveClick()
                if (e.key === 'Escape') setSaving(false)
              }}
            />
            <button
              className="distance-btn distance-btn--primary"
              onClick={handleSaveClick}
              disabled={!name.trim()}
            >
              Confirm
            </button>
            <button className="distance-btn" onClick={() => setSaving(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button className="distance-btn distance-btn--primary" onClick={handleSaveClick}>
            {editingMeasurement ? `Update "${editingMeasurement.name}"` : 'Save'}
          </button>
        )}
      </div>
    </div>
  )
}
