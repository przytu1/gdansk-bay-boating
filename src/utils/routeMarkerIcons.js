// Built-in icon set for independent route markers (points near a route that
// aren't waypoints themselves, e.g. tourist attractions). Shared between the
// map rendering code and the picker UI so both stay in sync.
export const ROUTE_MARKER_ICONS = [
  { key: 'star', emoji: '⭐', label: 'Ulubione', color: '#f59e0b' },
  { key: 'flag', emoji: '🚩', label: 'Punkt zainteresowania', color: '#7c3aed' },
  { key: 'camera', emoji: '📷', label: 'Punkt widokowy', color: '#0e7490' },
  { key: 'food', emoji: '🍴', label: 'Gastronomia', color: '#ea580c' },
  { key: 'warning', emoji: '⚠️', label: 'Uwaga', color: '#dc2626' },
  { key: 'info', emoji: 'ℹ️', label: 'Informacja', color: '#2563eb' },
]

export const DEFAULT_ROUTE_MARKER_ICON = ROUTE_MARKER_ICONS[0].key

export function getRouteMarkerIcon(key) {
  return ROUTE_MARKER_ICONS.find(i => i.key === key) || ROUTE_MARKER_ICONS[0]
}
