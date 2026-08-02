import { useState, useMemo } from 'react'
import { estimateTileCount, MAX_ESTIMATED_TILES } from '../utils/offlineMaps'

const HEADER_COLOR = '#0e7490'

export default function OfflineAreaForm({ bounds, onConfirm, onCancel }) {
  const [name, setName] = useState('')
  const [minZoom, setMinZoom] = useState(10)
  const [maxZoom, setMaxZoom] = useState(15)

  const invalidRange = minZoom > maxZoom
  const estimate = useMemo(
    () => (invalidRange ? 0 : estimateTileCount(bounds, minZoom, maxZoom)),
    [bounds, minZoom, maxZoom, invalidRange]
  )
  const tooMany = estimate > MAX_ESTIMATED_TILES

  function handleSubmit(e) {
    e.preventDefault()
    if (invalidRange || tooMany) return
    onConfirm({ name: name.trim() || 'Obszar offline', minZoom, maxZoom })
  }

  const [[west, south], [east, north]] = bounds

  return (
    <div className="fuel-form-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="fuel-form">
        <div className="fuel-form-header" style={{ background: HEADER_COLOR }}>Pobierz obszar offline</div>
        <div className="fuel-form-coords">
          {south.toFixed(4)}–{north.toFixed(4)}°N &nbsp;·&nbsp; {west.toFixed(4)}–{east.toFixed(4)}°E
        </div>
        <form onSubmit={handleSubmit}>
          <div className="fuel-form-field">
            <label htmlFor="of-name">Nazwa obszaru</label>
            <input
              id="of-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="np. Zatoka Gdańska"
              autoFocus
            />
          </div>
          <div className="fuel-form-field">
            <label>Zakres powiększenia</label>
            <div className="offline-zoom-row">
              <input
                type="number"
                min="0"
                max="20"
                value={minZoom}
                onChange={e => setMinZoom(Number(e.target.value))}
              />
              <span>–</span>
              <input
                type="number"
                min="0"
                max="20"
                value={maxZoom}
                onChange={e => setMaxZoom(Number(e.target.value))}
              />
            </div>
          </div>
          <p className={`offline-estimate${tooMany ? ' offline-estimate--warn' : ''}`}>
            {invalidRange
              ? 'Minimalne powiększenie musi być mniejsze lub równe maksymalnemu.'
              : `Szacunkowo ~${estimate.toLocaleString('pl-PL')} kafelków (~${Math.max(1, Math.round(estimate * 50 / 1024))} MB)`}
            {tooMany && ' — zmniejsz obszar lub zakres powiększenia.'}
          </p>
          <div className="fuel-form-actions">
            <button type="button" className="fuel-form-cancel" onClick={onCancel}>Anuluj</button>
            <button
              type="submit"
              className="fuel-form-save"
              style={{ background: HEADER_COLOR }}
              disabled={invalidRange || tooMany}
            >
              Pobierz obszar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
