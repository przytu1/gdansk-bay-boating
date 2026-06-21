const R_KM = 6371
const KM_PER_NM = 1.852

function haversineKm([lng1, lat1], [lng2, lat2]) {
  const rad = d => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return R_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function totalDistanceKm(points) {
  let total = 0
  for (let i = 1; i < points.length; i++) total += haversineKm(points[i - 1], points[i])
  return total
}

export function kmToNm(km) {
  return km / KM_PER_NM
}

export function segmentNm(p1, p2) {
  return haversineKm(p1, p2) / KM_PER_NM
}
