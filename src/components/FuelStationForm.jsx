import { useState } from 'react'

export default function FuelStationForm({ point, onSave, onCancel }) {
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
        <div className="fuel-form-header">Nowa stacja paliw</div>
        <div className="fuel-form-coords">
          {point.lat.toFixed(5)}°N &nbsp;&nbsp; {point.lng.toFixed(5)}°E
        </div>
        <form onSubmit={handleSubmit}>
          <div className="fuel-form-field">
            <label htmlFor="fuel-name">Nazwa stacji</label>
            <input
              id="fuel-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="np. Marina Gdynia – Lotos"
              autoFocus
            />
          </div>
          <div className="fuel-form-field">
            <label htmlFor="fuel-info">Dodatkowe informacje</label>
            <textarea
              id="fuel-info"
              value={info}
              onChange={e => setInfo(e.target.value)}
              placeholder={'Olej napędowy, benzyna\nGodziny: maj–wrz 8:00–20:00\nTel: +48 519 075 699'}
              rows={4}
            />
          </div>
          <div className="fuel-form-actions">
            <button type="button" className="fuel-form-cancel" onClick={onCancel}>Anuluj</button>
            <button type="submit" className="fuel-form-save" disabled={!name.trim()}>Zapisz stację</button>
          </div>
        </form>
      </div>
    </div>
  )
}
