import { useState } from 'react'
import { ROUTE_MARKER_ICONS, DEFAULT_ROUTE_MARKER_ICON } from '../utils/routeMarkerIcons'

export default function RouteMarkerForm({ point, onSave, onCancel }) {
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState(DEFAULT_ROUTE_MARKER_ICON)

  function handleSubmit(e) {
    e.preventDefault()
    onSave({ title: title.trim(), icon })
  }

  return (
    <div className="fuel-form-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="fuel-form">
        <div className="fuel-form-header" style={{ background: '#7c3aed' }}>Nowy punkt niezależny</div>
        <div className="fuel-form-coords">
          {point.lat.toFixed(5)}°N &nbsp;&nbsp; {point.lng.toFixed(5)}°E
        </div>
        <form onSubmit={handleSubmit}>
          <div className="fuel-form-field">
            <label>Ikona</label>
            <div className="marker-icon-picker">
              {ROUTE_MARKER_ICONS.map(i => (
                <button
                  key={i.key}
                  type="button"
                  className={`marker-icon-btn${icon === i.key ? ' marker-icon-btn--active' : ''}`}
                  style={{ '--marker-icon-color': i.color }}
                  onClick={() => setIcon(i.key)}
                  title={i.label}
                  aria-label={i.label}
                  aria-pressed={icon === i.key}
                >
                  {i.emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="fuel-form-field">
            <label htmlFor="rm-title">Tytuł</label>
            <input
              id="rm-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="np. Punkt widokowy na latarnię"
              autoFocus
            />
          </div>
          <div className="fuel-form-actions">
            <button type="button" className="fuel-form-cancel" onClick={onCancel}>Anuluj</button>
            <button type="submit" className="fuel-form-save" style={{ background: '#7c3aed' }}>Dodaj punkt</button>
          </div>
        </form>
      </div>
    </div>
  )
}
