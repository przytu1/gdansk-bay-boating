function centroid(coords) {
  const n = coords.length
  return [
    coords.reduce((s, c) => s + c[0], 0) / n,
    coords.reduce((s, c) => s + c[1], 0) / n,
  ]
}

export function osmToGeoJSON(response) {
  const features = []

  for (const el of response.elements) {
    const tags = el.tags || {}
    const featureType = tags['seamark:type']
      ? 'seamark'
      : tags.waterway === 'lock_gate' ? 'lock_gate'
      : tags.waterway === 'lock' ? 'lock'
      : 'seamark'
    const props = { ...tags, _featureType: featureType }

    if (el.type === 'node') {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [el.lon, el.lat] },
        properties: props,
      })
    } else if (el.type === 'way' && el.geometry?.length > 2) {
      const coords = el.geometry.map(p => [p.lon, p.lat])
      const first = coords[0], last = coords[coords.length - 1]
      if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first)
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: props,
      })
      if (featureType === 'lock') {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: centroid(coords.slice(0, -1)) },
          properties: { ...props, _featureType: 'lock_centroid' },
        })
      }
    }
  }

  return { type: 'FeatureCollection', features }
}
