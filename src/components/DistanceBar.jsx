import { useState, useEffect } from 'react'
import { totalDistanceKm, kmToNm, segmentNm } from '../utils/distance'
import './DistanceBar.css'

function computeETAs(points, speeds, departureTime) {
  if (!departureTime || points.length < 1) return []
  const [hStr, mStr] = departureTime.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return []

  const times = [h * 60 + m]
  for (let i = 0; i + 1 < points.length; i++) {
    const prev = times[i]
    if (prev == null) { times.push(null); continue }
    const spd = parseFloat(speeds?.[i])
    if (!spd || spd <= 0) { times.push(null); continue }
    const dist = segmentNm(points[i], points[i + 1])
    times.push(prev + (dist / spd) * 60)
  }
  return times
}

function fmtTime(minutes) {
  if (minutes == null || isNaN(minutes)) return '—'
  const total = Math.round(minutes)
  const days = Math.floor(total / 1440)
  const rem = ((total % 1440) + 1440) % 1440
  const h = String(Math.floor(rem / 60)).padStart(2, '0')
  const min = String(rem % 60).padStart(2, '0')
  return days > 0 ? `+${days}d ${h}:${min}` : `${h}:${min}`
}

function fmtDuration(minutes) {
  if (minutes == null || minutes <= 0) return null
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m} min`
  return `${h}h ${String(m).padStart(2, '0')}min`
}

export default function DistanceBar({
  points, speeds, departureTime,
  onSpeedChange, onDepartureTimeChange,
  editingMeasurement, onSave,
}) {
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [etaOpen, setEtaOpen] = useState(false)

  useEffect(() => {
    if (editingMeasurement) setName(editingMeasurement.name)
  }, [editingMeasurement?.id])

  if (points.length < 2) {
    return (
      <div className="distance-bar-wrapper">
        <div className="distance-bar distance-bar--hint">
          Kliknij mapę, aby dodać punkty trasy
        </div>
      </div>
    )
  }

  const km = totalDistanceKm(points)
  const nm = kmToNm(km)
  const etas = computeETAs(points, speeds, departureTime)
  const lastEta = etas.length >= 2 ? etas[etas.length - 1] : null
  const firstEta = etas.length >= 1 ? etas[0] : null
  const totalMinutes = (lastEta != null && firstEta != null) ? lastEta - firstEta : null

  function handleSaveClick() {
    if (!saving) { setSaving(true); return }
    if (name.trim()) { onSave(name.trim()); setSaving(false) }
  }

  return (
    <div className="distance-bar-wrapper">
      {etaOpen && (
        <div className="eta-panel">
          {points.map((pt, i) => {
            const isLast = i === points.length - 1
            const dist = !isLast ? segmentNm(pt, points[i + 1]) : null
            const spd = parseFloat(speeds?.[i])
            const segMin = (dist && spd > 0) ? (dist / spd) * 60 : null

            return (
              <div key={i} className="eta-waypoint">
                <div className="eta-point-row">
                  <span className="eta-point-label">Punkt {i + 1}</span>

                  <div className="eta-point-time">
                    {i === 0 ? (
                      <>
                        <span className="eta-meta">Odjazd:</span>
                        <input
                          type="time"
                          className="eta-time-input"
                          value={departureTime || ''}
                          onChange={e => onDepartureTimeChange(e.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        <span className="eta-meta">Przybycie:</span>
                        <span className={`eta-time-value${etas[i] == null ? ' eta-time-value--unknown' : ''}`}>
                          {fmtTime(etas[i])}
                        </span>
                      </>
                    )}
                  </div>

                  {!isLast && (
                    <div className="eta-speed">
                      <input
                        type="number"
                        className="eta-speed-field"
                        value={speeds?.[i] ?? ''}
                        onChange={e => onSpeedChange(i, e.target.value)}
                        placeholder="—"
                        min="0.1"
                        max="99"
                        step="0.5"
                        inputMode="decimal"
                      />
                      <span className="eta-speed-unit">kn</span>
                    </div>
                  )}
                </div>

                {!isLast && (
                  <div className="eta-segment">
                    <span className="eta-seg-dist">{dist.toFixed(2)} NM</span>
                    {segMin != null && (
                      <span className="eta-seg-dur">{fmtDuration(segMin)}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {totalMinutes != null && (
            <div className="eta-summary">
              Łączny czas: <strong>{fmtDuration(totalMinutes)}</strong>
              {lastEta != null && (
                <> · Przybycie: <strong>{fmtTime(lastEta)}</strong></>
              )}
            </div>
          )}
        </div>
      )}

      <div className="distance-bar">
        <div className="distance-values">
          <span className="distance-nm">{nm.toFixed(2)} NM</span>
          <span className="distance-sep">·</span>
          <span className="distance-km">{km.toFixed(2)} km</span>
          {totalMinutes != null && (
            <>
              <span className="distance-sep">·</span>
              <span className="distance-eta-total">{fmtDuration(totalMinutes)}</span>
            </>
          )}
          <span className="distance-pts">{points.length} pkt</span>
        </div>

        <div className="distance-actions">
          <button
            className={`distance-btn${etaOpen ? ' distance-btn--active' : ''}`}
            onClick={() => setEtaOpen(o => !o)}
            title="Plan trasy z ETA"
          >
            ETA {etaOpen ? '▲' : '▼'}
          </button>

          {saving ? (
            <>
              <input
                className="distance-name-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nazwa trasy…"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveClick()
                  if (e.key === 'Escape') setSaving(false)
                }}
              />
              <button className="distance-btn distance-btn--primary" onClick={handleSaveClick} disabled={!name.trim()}>
                Zapisz
              </button>
              <button className="distance-btn" onClick={() => setSaving(false)}>Anuluj</button>
            </>
          ) : (
            <button className="distance-btn distance-btn--primary" onClick={handleSaveClick}>
              {editingMeasurement ? `Aktualizuj „${editingMeasurement.name}"` : 'Zapisz'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
