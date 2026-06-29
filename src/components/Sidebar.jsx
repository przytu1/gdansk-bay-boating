import { totalDistanceKm } from '../utils/distance'
import './Sidebar.css'

const NAV_ITEMS = [
  { id: 'measure', label: 'Pomiar', Icon: RulerIcon, kind: 'tool' },
  { id: 'coords', label: 'Koordynaty', Icon: CoordIcon, kind: 'tool' },
  { id: 'seamarks', label: 'Znaki nawigacyjne', Icon: SeamarksIcon, kind: 'layer' },
  { id: 'marinas', label: 'Mariny i przystanie', Icon: MarinaIcon, kind: 'layer' },
  { id: 'locks', label: 'Śluzy i mosty zwodzone', Icon: LockIcon, kind: 'layer' },
  { id: 'ships', label: 'Pozycje statków', Icon: ShipIcon, kind: 'layer' },
  { id: 'fuel', label: 'Stacje paliw', Icon: FuelStationIcon, kind: 'layer' },
  { id: 'settings', label: 'Ustawienia', Icon: SettingsIcon, kind: 'tool' },
]

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDuration(ms) {
  const s = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}:${String(s % 60).padStart(2, '0')} min` : `${s} s`
}

function aisStatusLabel(status, prevLoadMs) {
  switch (status.state) {
    case 'connecting': return 'Łączenie z serwisem AIS…'
    case 'reconnecting': return 'Ponowne łączenie z serwisem AIS…'
    case 'loading': {
      const lines = ['Trwa pierwsze pobranie pełnej listy statków…']
      lines.push(`Pobrano dotąd: ${status.count ?? 0} jednostek`)
      let t = `Czas: ${status.loadStart ? formatDuration(Date.now() - status.loadStart) : '0 s'}`
      if (prevLoadMs) t += ` (poprzednio: ${formatDuration(prevLoadMs)})`
      lines.push(t)
      return lines.join('\n')
    }
    case 'connected': {
      let s = `Na żywo · ${status.count ?? 0} jednostek w zasięgu`
      if (status.lastUpdate) s += `\nOstatnia aktualizacja: ${formatTime(status.lastUpdate)}`
      if (status.loadDurationMs) s += `\nPełne pobranie zajęło: ${formatDuration(status.loadDurationMs)}`
      return s
    }
    default: return ''
  }
}

function formatCacheDate(ts) {
  return new Date(ts).toLocaleString('pl-PL', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Sidebar({
  isOpen,
  onClose,
  activeTool,
  onToolChange,
  visibleLayers,
  onLayerToggle,
  seamarksLoading,
  seamarksError,
  seamarksInfo,
  onRefreshSeamarks,
  aisStatus,
  aisPrevLoadDuration,
  onRefreshAis,
  customFuelStations,
  builtInFuelCount,
  onStartPlaceFuel,
  onDeleteFuelStation,
  userMarinas,
  builtInMarinaCount,
  onStartPlaceMarina,
  onDeleteMarina,
  userLocks,
  builtInLockCount,
  onStartPlaceLock,
  onDeleteLock,
  savedMeasurements,
  editingId,
  onLoadMeasurement,
  onDeleteMeasurement,
}) {
  function handleNavClick(item) {
    if (item.kind === 'tool') onToolChange(item.id)
    else onLayerToggle(item.id)
  }

  function isActive(item) {
    return item.kind === 'tool' ? activeTool === item.id : visibleLayers[item.id]
  }

  return (
    <>
      <div
        className={`sidebar-overlay${isOpen ? ' sidebar-overlay--visible' : ''}`}
        onClick={onClose}
      />
      <nav className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/logo.svg" alt="" width="32" height="32" />
            <span className="sidebar-logo-text">Navigator</span>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Zamknij menu">
            <CloseIcon />
          </button>
        </div>

        <ul className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <li key={item.id}>
              <button
                className={`sidebar-nav-btn${isActive(item) ? ' sidebar-nav-btn--active' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                <item.Icon />
                <span className="sidebar-nav-label">{item.label}</span>
                {item.kind === 'layer' && (
                  <span className="sidebar-eye-icon">
                    {visibleLayers[item.id] ? <EyeIcon /> : <EyeOffIcon />}
                  </span>
                )}
                {item.id === 'seamarks' && seamarksLoading && <span className="sidebar-spinner" />}
                {item.id === 'ships' && aisStatus && (aisStatus.state === 'connecting' || aisStatus.state === 'reconnecting' || aisStatus.state === 'loading') && <span className="sidebar-spinner" />}
              </button>
              {item.id === 'seamarks' && seamarksError && isActive(item) && (
                <p className="sidebar-error">{seamarksError}</p>
              )}
              {item.id === 'ships' && isActive(item) && aisStatus && aisStatus.state === 'error' && (
                <p className="sidebar-error">{aisStatus.message}</p>
              )}
              {item.id === 'ships' && isActive(item) && aisStatus && aisStatus.state !== 'error' && (
                <div className="sidebar-ais-status">
                  <p className="sidebar-status">{aisStatusLabel(aisStatus, aisPrevLoadDuration)}</p>
                  <button
                    className="sidebar-ais-refresh"
                    onClick={onRefreshAis}
                    disabled={aisStatus.state === 'connecting' || aisStatus.state === 'reconnecting'}
                    aria-label="Odśwież pozycje statków"
                    title="Odśwież pozycje statków"
                  >
                    <RefreshIcon />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {activeTool === 'settings' && (
          <div className="sidebar-panel">
            <div className="sidebar-panel-title">Baza danych znaków</div>
            <div className="settings-db-info">
              <div className="settings-db-row">
                <span className="settings-db-label">Ostatnia aktualizacja</span>
                <span className="settings-db-value">
                  {seamarksInfo ? formatCacheDate(seamarksInfo.timestamp) : '—'}
                </span>
              </div>
              <div className="settings-db-row">
                <span className="settings-db-label">Załadowane znaki</span>
                <span className="settings-db-value">
                  {seamarksInfo ? seamarksInfo.count.toLocaleString('pl-PL') : '—'}
                </span>
              </div>
            </div>
            {seamarksError && <p className="sidebar-error sidebar-error--panel">{seamarksError}</p>}
            <button
              className="settings-update-btn"
              onClick={onRefreshSeamarks}
              disabled={seamarksLoading}
            >
              {seamarksLoading ? 'Aktualizowanie…' : 'Zaktualizuj bazę punktów nawigacyjnych'}
            </button>

            <div className="sidebar-panel-divider" />
            <div className="sidebar-panel-title">Stacje paliw</div>
            <p className="sidebar-panel-empty" style={{ marginBottom: 4 }}>
              Wbudowane: <strong>{builtInFuelCount}</strong>
            </p>
            {customFuelStations.length > 0 && (
              <ul className="sidebar-saved-list">
                {customFuelStations.map(s => (
                  <li key={s.id} className="sidebar-saved-item">
                    <span className="sidebar-saved-name sidebar-saved-name--fuel">{s.name}</span>
                    <button
                      className="sidebar-saved-delete"
                      onClick={() => onDeleteFuelStation(s.id)}
                      aria-label={`Usuń ${s.name}`}
                    >
                      <TrashIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button className="settings-update-btn settings-update-btn--green" onClick={onStartPlaceFuel}>
              Dodaj stację paliw
            </button>

            <div className="sidebar-panel-divider" />
            <div className="sidebar-panel-title">Mariny i przystanie</div>
            <p className="sidebar-panel-empty" style={{ marginBottom: 4 }}>
              Wbudowane: <strong>{builtInMarinaCount}</strong>
            </p>
            {userMarinas.length > 0 && (
              <ul className="sidebar-saved-list">
                {userMarinas.map(m => (
                  <li key={m.id} className="sidebar-saved-item">
                    <span className="sidebar-saved-name sidebar-saved-name--fuel">{m.name}</span>
                    <button
                      className="sidebar-saved-delete"
                      onClick={() => onDeleteMarina(m.id)}
                      aria-label={`Usuń ${m.name}`}
                    >
                      <TrashIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button className="settings-update-btn settings-update-btn--navy" onClick={onStartPlaceMarina}>
              Dodaj marinę / przystań
            </button>

            <div className="sidebar-panel-divider" />
            <div className="sidebar-panel-title">Śluzy i mosty zwodzone</div>
            <p className="sidebar-panel-empty" style={{ marginBottom: 4 }}>
              Wbudowane: <strong>{builtInLockCount}</strong>
            </p>
            {userLocks.length > 0 && (
              <ul className="sidebar-saved-list">
                {userLocks.map(l => (
                  <li key={l.id} className="sidebar-saved-item">
                    <span className="sidebar-saved-name sidebar-saved-name--fuel">{l.name}</span>
                    <button
                      className="sidebar-saved-delete"
                      onClick={() => onDeleteLock(l.id)}
                      aria-label={`Usuń ${l.name}`}
                    >
                      <TrashIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button className="settings-update-btn settings-update-btn--teal" onClick={onStartPlaceLock}>
              Dodaj śluzę / most zwodzony
            </button>
          </div>
        )}

        {activeTool === 'measure' && (
          <div className="sidebar-panel">
            <div className="sidebar-panel-title">Zapisane pomiary</div>
            {savedMeasurements.length === 0 ? (
              <p className="sidebar-panel-empty">Brak zapisanych pomiarów</p>
            ) : (
              <ul className="sidebar-saved-list">
                {savedMeasurements.map(m => (
                  <li
                    key={m.id}
                    className={`sidebar-saved-item${editingId === m.id ? ' sidebar-saved-item--active' : ''}`}
                  >
                    <button className="sidebar-saved-load" onClick={() => onLoadMeasurement(m)}>
                      <span className="sidebar-saved-name">{m.name}</span>
                      <span className="sidebar-saved-dist">
                        {totalDistanceKm(m.points).toFixed(2)} km
                        &nbsp;·&nbsp;
                        {(totalDistanceKm(m.points) / 1.852).toFixed(2)} NM
                      </span>
                    </button>
                    <button
                      className="sidebar-saved-delete"
                      onClick={() => onDeleteMeasurement(m.id)}
                      aria-label={`Usuń ${m.name}`}
                    >
                      <TrashIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </nav>
    </>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function SeamarksIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <path d="M6 18 Q9 16 12 18 Q15 20 18 18" />
    </svg>
  )
}

function RulerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z" />
      <path d="m14.5 12.5 2-2" />
      <path d="m11.5 9.5 2-2" />
      <path d="m8.5 6.5 2-2" />
      <path d="m17.5 15.5 2-2" />
    </svg>
  )
}

function MarinaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="8" x2="12" y2="22" />
      <line x1="5" y1="13" x2="19" y2="13" />
      <path d="M12 22 C 5 22 3 17 5 14" />
      <path d="M12 22 C 19 22 21 17 19 14" />
    </svg>
  )
}

function CoordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="7" />
      <line x1="12" y1="17" x2="12" y2="22" />
      <line x1="2" y1="12" x2="7" y2="12" />
      <line x1="17" y1="12" x2="22" y2="12" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="4" height="14" rx="0.5" />
      <rect x="17" y="5" width="4" height="14" rx="0.5" />
      <path d="M7 9 L12 12 L7 15" />
      <path d="M17 9 L12 12 L17 15" />
      <line x1="2" y1="21" x2="22" y2="21" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  )
}

function ShipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 14h18l-2 6a1 1 0 0 1-1 .7H6a1 1 0 0 1-1-.7Z" />
      <path d="M12 14V4" />
      <path d="M12 4l5 3-5 2-5-2Z" />
      <path d="M5 14V9" />
      <path d="M19 14V9" />
    </svg>
  )
}

function FuelStationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 22V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14" />
      <line x1="1" y1="22" x2="15" y2="22" />
      <rect x="5" y="10" width="8" height="5" rx="0.5" />
      <path d="M15 12h3" />
      <path d="M18 12v7" />
      <path d="M18 19l-2 2" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
