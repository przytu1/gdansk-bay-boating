import { segmentNm, segmentKm } from '../utils/distance'
import { computeETAs, fmtTime, fmtDuration, DEFAULT_SPEED_KN } from '../utils/eta'
import { computeFuelLevels } from '../utils/fuel'
import './DistanceBar.css'

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function FuelGauge({ level, capacity }) {
  const pct = level == null ? 0 : Math.max(0, Math.min(100, (level / capacity) * 100))
  return (
    <span className="eta-fuel-gauge">
      <span className="eta-fuel-gauge-fill" style={{ width: `${pct}%` }} />
    </span>
  )
}

export default function DistanceBar({
  points, speeds, departureTime,
  onSpeedChange, onDepartureTimeChange, onPointChange, onPointDelete,
  fuel, onFuelChange,
  onClose,
}) {
  if (points.length < 1) return null

  const etas = computeETAs(points, speeds, departureTime)
  const lastEta = etas.length >= 2 ? etas[etas.length - 1] : null
  const firstEta = etas.length >= 1 ? etas[0] : null
  const totalMinutes = (lastEta != null && firstEta != null) ? lastEta - firstEta : null

  const fuelCapacity = parseFloat(fuel?.capacity)
  const fuelConfigured = !isNaN(fuelCapacity) && fuelCapacity > 0
  const fuelLevels = fuelConfigured ? computeFuelLevels(points, fuel.start, fuel.consumption) : []

  return (
    <div className="route-config-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="route-config-panel">
        <div className="route-config-header">
          <h3>Konfiguracja trasy</h3>
          <button className="route-config-close" onClick={onClose} aria-label="Zamknij">✕</button>
        </div>

        <div className="route-config-body">
          <div className="fuel-config-card">
            <div className="fuel-config-header">⛽ Paliwo</div>
            <div className="fuel-config-fields">
              <label className="eta-seg-field">
                <span className="eta-field-label">Pojemność baku</span>
                <span className="eta-fuel-input-group">
                  <input
                    type="number"
                    className="eta-fuel-input"
                    value={fuel?.capacity ?? ''}
                    onChange={e => onFuelChange({ capacity: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="1"
                    inputMode="numeric"
                  />
                  <span className="eta-fuel-input-unit">l</span>
                </span>
              </label>
              <label className="eta-seg-field">
                <span className="eta-field-label">Stan początkowy</span>
                <span className="eta-fuel-input-group">
                  <input
                    type="number"
                    className="eta-fuel-input"
                    value={fuel?.start ?? ''}
                    onChange={e => onFuelChange({ start: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="1"
                    inputMode="numeric"
                  />
                  <span className="eta-fuel-input-unit">l</span>
                </span>
              </label>
              <label className="eta-seg-field">
                <span className="eta-field-label">Spalanie</span>
                <span className="eta-fuel-input-group">
                  <input
                    type="number"
                    className="eta-fuel-input"
                    value={fuel?.consumption ?? ''}
                    onChange={e => onFuelChange({ consumption: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="0.5"
                    inputMode="decimal"
                  />
                  <span className="eta-fuel-input-unit">l/100km</span>
                </span>
              </label>
            </div>
          </div>

          {points.map((pt, i) => {
            const isLast = i === points.length - 1
            const isStop = pt.type === 'stop'
            const seq = pt.seq ?? (i + 1)
            const defaultTitle = isStop ? `Postój ${seq}` : `Punkt ${seq}`
            const distNm = !isLast ? segmentNm(pt, points[i + 1]) : null
            const distKm = !isLast ? segmentKm(pt, points[i + 1]) : null
            const rawSpd = speeds?.[i]
            const spd = (rawSpd === undefined || rawSpd === null) ? DEFAULT_SPEED_KN : parseFloat(rawSpd)
            const segMin = (distNm && spd > 0) ? (distNm / spd) * 60 : null
            const fuelLevel = fuelConfigured ? (fuelLevels[i] ?? null) : null

            return (
              <div key={i} className={`eta-waypoint${isStop ? ' eta-waypoint--stop' : ''}`}>
                <div className="eta-title-row">
                  <span className="eta-anchor-badge">{isStop ? '⚓' : '⛵'}</span>
                  <input
                    type="text"
                    className="eta-title-input"
                    value={pt.name ?? ''}
                    onChange={e => onPointChange(i, { name: e.target.value })}
                    placeholder={defaultTitle}
                  />
                  <button
                    type="button"
                    className="eta-delete-btn"
                    onClick={() => onPointDelete(i)}
                    aria-label={`Usuń ${pt.name?.trim() || defaultTitle}`}
                    title="Usuń punkt"
                  >
                    <TrashIcon />
                  </button>
                </div>

                <div className="eta-point-row">
                  <div className="eta-seg-field">
                    <span className="eta-field-label">Typ punktu</span>
                    <div className="eta-type-toggle">
                      <button
                        type="button"
                        className={`eta-type-btn${!isStop ? ' eta-type-btn--active' : ''}`}
                        onClick={() => onPointChange(i, { type: 'waypoint' })}
                      >
                        W ruchu
                      </button>
                      <button
                        type="button"
                        className={`eta-type-btn${isStop ? ' eta-type-btn--active' : ''}`}
                        onClick={() => onPointChange(i, { type: 'stop' })}
                      >
                        Postój
                      </button>
                    </div>
                  </div>

                  <div className="eta-seg-field">
                    {i === 0 ? (
                      <>
                        <span className="eta-field-label">Godzina odjazdu</span>
                        <input
                          type="time"
                          className="eta-time-input"
                          value={departureTime || ''}
                          onChange={e => onDepartureTimeChange(e.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        <span className="eta-field-label">Godzina przybycia</span>
                        <span className={`eta-time-value${etas[i] == null ? ' eta-time-value--unknown' : ''}`}>
                          {fmtTime(etas[i])}
                        </span>
                      </>
                    )}
                  </div>

                  {fuelConfigured && (
                    <div className="eta-seg-field">
                      <span className="eta-field-label">Stan baku</span>
                      <span className="eta-fuel-display">
                        <span className="eta-fuel-value">
                          {fuelLevel != null ? `${Math.round(fuelLevel)} l` : '—'}
                        </span>
                        <FuelGauge level={fuelLevel} capacity={fuelCapacity} />
                      </span>
                    </div>
                  )}
                </div>

                {isStop && (
                  <div className="eta-stop-config">
                    <label className="eta-seg-field">
                      <span className="eta-field-label">Czas postoju</span>
                      <span className="eta-stop-duration">
                        <input
                          type="number"
                          className="eta-stop-duration-input"
                          value={pt.stopDuration ?? ''}
                          onChange={e => onPointChange(i, { stopDuration: e.target.value })}
                          placeholder="0"
                          min="0"
                          step="5"
                          inputMode="numeric"
                        />
                        <span className="eta-stop-duration-unit">min</span>
                      </span>
                    </label>
                    <label className="eta-seg-field eta-seg-field--note">
                      <span className="eta-field-label">Opis postoju</span>
                      <input
                        type="text"
                        className="eta-stop-note-input"
                        value={pt.stopNote ?? ''}
                        onChange={e => onPointChange(i, { stopNote: e.target.value })}
                        placeholder="np. tankowanie, śluzowanie, nocleg"
                      />
                    </label>
                    {fuelConfigured && (
                      <label className="eta-seg-field">
                        <span className="eta-field-label">Stan baku po tankowaniu</span>
                        <span className="eta-fuel-input-group">
                          <input
                            type="number"
                            className="eta-fuel-input"
                            value={pt.fuelOverride ?? ''}
                            onChange={e => onPointChange(i, { fuelOverride: e.target.value })}
                            placeholder="—"
                            min="0"
                            step="1"
                            inputMode="numeric"
                          />
                          <span className="eta-fuel-input-unit">l</span>
                        </span>
                      </label>
                    )}
                  </div>
                )}

                {!isLast && (
                  <div className="eta-segment">
                    <div className="eta-seg-field">
                      <span className="eta-field-label">Prędkość na odcinku</span>
                      <span className="eta-speed">
                        <input
                          type="number"
                          className="eta-speed-field"
                          value={speeds?.[i] ?? DEFAULT_SPEED_KN}
                          onChange={e => onSpeedChange(i, e.target.value)}
                          placeholder="—"
                          min="0.1"
                          max="99"
                          step="0.5"
                          inputMode="decimal"
                        />
                        <span className="eta-speed-unit">kn</span>
                      </span>
                    </div>
                    <div className="eta-seg-field">
                      <span className="eta-field-label">Długość odcinka</span>
                      <span className="eta-seg-dist">{distKm.toFixed(2)} km</span>
                    </div>
                    {segMin != null && (
                      <div className="eta-seg-field">
                        <span className="eta-field-label">Czas przejścia</span>
                        <span className="eta-seg-dur">{fmtDuration(segMin)}</span>
                      </div>
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
      </div>
    </div>
  )
}
