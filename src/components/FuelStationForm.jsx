import { useState } from 'react'

export default function FuelStationForm({
  point, onSave, onCancel,
  formTitle = 'Nowy punkt',
  namePlaceholder = 'Nazwa',
  infoPlaceholder = '',
  saveLabel = 'Zapisz',
  headerColor = '#15803d',
}) {
  const [name, setName] = useState('')
  const [info, setInfo] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), info: info.trim() })
  }

  return (
    <div className="fuel-form-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="fuel-form">
        <div className="fuel-form-header" style={{ background: headerColor }}>{formTitle}</div>
        <div className="fuel-form-coords">
          {point.lat.toFixed(5)}°N &nbsp;&nbsp; {point.lng.toFixed(5)}°E
        </div>
        <form onSubmit={handleSubmit}>
          <div className="fuel-form-field">
            <label htmlFor="pf-name">Nazwa</label>
            <input
              id="pf-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={namePlaceholder}
              autoFocus
            />
          </div>
          <div className="fuel-form-field">
            <label htmlFor="pf-info">Dodatkowe informacje</label>
            <textarea
              id="pf-info"
              value={info}
              onChange={e => setInfo(e.target.value)}
              placeholder={infoPlaceholder}
              rows={4}
            />
          </div>
          <div className="fuel-form-actions">
            <button type="button" className="fuel-form-cancel" onClick={onCancel}>Anuluj</button>
            <button type="submit" className="fuel-form-save" style={{ background: headerColor }} disabled={!name.trim()}>{saveLabel}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
