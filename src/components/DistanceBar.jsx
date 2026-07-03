import { segmentNm } from '../utils/distance'
import { computeETAs, fmtTime, fmtDuration } from '../utils/eta'
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

export default function DistanceBar({
  points, speeds, departureTime,
  onSpeedChange, onDepartureTimeChange, onPointChange, onPointDelete,
  onClose,
}) {
  if (points.length < 1) return null

  const etas = computeETAs(points, speeds, departureTime)
  const lastEta = etas.length >= 2 ? etas[etas.length - 1] : null
  const firstEta = etas.length >= 1 ? etas[0] : null
  const totalMinutes = (lastEta != null && firstEta != null) ? lastEta - firstEta : null

  return (
    <div className="route-config-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="route-config-panel">
        <div className="route-config-header">
          <h3>Punkty trasy</h3>
          <button className="route-config-close" onClick={onClose} aria-label="Zamknij">✕</button>
        </div>

        <div className="route-config-body">
          {points.map((pt, i) => {
            const isLast = i === points.length - 1
            const isStop = pt.type === 'stop'
            const dist = !isLast ? segmentNm(pt, points[i + 1]) : null
            const spd = parseFloat(speeds?.[i])
            const segMin = (dist && spd > 0) ? (dist / spd) * 60 : null

            return (
              <div key={i} className="eta-waypoint">
                <div className="eta-point-row">
                  <span className="eta-point-label">
                    {isStop && <span className="eta-anchor-badge">⚓</span>}
                    Punkt {i + 1}
                  </span>

                  <div className="eta-type-toggle">
                    <button
                      type="button"
                      className={`eta-type-btn${!isStop ? ' eta-type-btn--active-waypoint' : ''}`}
                      onClick={() => onPointChange(i, { type: 'waypoint' })}
                    >
                      Punkt
                    </button>
                    <button
                      type="button"
                      className={`eta-type-btn${isStop ? ' eta-type-btn--active-stop' : ''}`}
                      onClick={() => onPointChange(i, { type: 'stop' })}
                    >
                      Postój
                    </button>
                  </div>

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

                  <button
                    type="button"
                    className="eta-delete-btn"
                    onClick={() => onPointDelete(i)}
                    aria-label={`Usuń punkt ${i + 1}`}
                    title="Usuń punkt"
                  >
                    <TrashIcon />
                  </button>
                </div>

                {isStop && (
                  <div className="eta-stop-config">
                    <label className="eta-stop-field">
                      <span className="eta-stop-field-label">Czas postoju</span>
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
                    <label className="eta-stop-field eta-stop-field--note">
                      <span className="eta-stop-field-label">Opis</span>
                      <input
                        type="text"
                        className="eta-stop-note-input"
                        value={pt.stopNote ?? ''}
                        onChange={e => onPointChange(i, { stopNote: e.target.value })}
                        placeholder="np. tankowanie, śluzowanie, nocleg"
                      />
                    </label>
                  </div>
                )}

                {!isLast && (
                  <div className="eta-segment">
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
      </div>
    </div>
  )
}
