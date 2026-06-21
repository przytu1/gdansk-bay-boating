import { useState } from 'react'
import './CoordBar.css'

function toDDM(deg, isLat) {
  const abs = Math.abs(deg)
  const d = Math.floor(abs)
  const m = ((abs - d) * 60).toFixed(4)
  const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W')
  return `${d}° ${m}' ${dir}`
}

function toDD(deg, isLat) {
  const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W')
  return `${Math.abs(deg).toFixed(6)}° ${dir}`
}

export default function CoordBar({ point }) {
  const [copied, setCopied] = useState(false)

  if (!point) {
    return (
      <div className="coord-bar-wrapper">
        <div className="coord-bar coord-bar--hint">
          Kliknij mapę, aby odczytać współrzędne punktu
        </div>
      </div>
    )
  }

  const [lng, lat] = point
  const ddmLat = toDDM(lat, true)
  const ddmLng = toDDM(lng, false)
  const ddLat = toDD(lat, true)
  const ddLng = toDD(lng, false)
  const copyText = `${ddmLat}, ${ddmLng}`

  function handleCopy() {
    navigator.clipboard?.writeText(copyText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="coord-bar-wrapper">
      <div className="coord-bar" onClick={handleCopy} title="Kliknij, aby skopiować do schowka">
        <div className="coord-values">
          <div className="coord-ddm">
            <span className="coord-ddm-val">{ddmLat}</span>
            <span className="coord-ddm-sep">·</span>
            <span className="coord-ddm-val">{ddmLng}</span>
          </div>
          <div className="coord-dd">
            {ddLat} · {ddLng}
          </div>
        </div>
        <button className={`coord-copy-btn${copied ? ' coord-copy-btn--done' : ''}`} onClick={handleCopy}>
          {copied ? '✓ Skopiowano' : 'Kopiuj'}
        </button>
      </div>
    </div>
  )
}
