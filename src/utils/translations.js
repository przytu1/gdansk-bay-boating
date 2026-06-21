const SEAMARK_TYPES_PL = {
  buoy_lateral: 'Pławka boczna',
  buoy_cardinal: 'Pławka kardynalna',
  buoy_isolated_danger: 'Pławka niebezpieczeństwa izolowanego',
  buoy_safe_water: 'Pławka bezpiecznej wody',
  buoy_special_purpose: 'Pławka specjalnego przeznaczenia',
  buoy_mooring: 'Boja cumownicza',
  buoy_installation: 'Boja instalacyjna',
  light_major: 'Latarnia morska',
  light_minor: 'Światło nawigacyjne',
  light_float: 'Latarniowiec',
  light_vessel: 'Okręt latarniowy',
  lighthouse: 'Latarnia morska',
  beacon_lateral: 'Stawiarka boczna',
  beacon_cardinal: 'Stawiarka kardynalna',
  beacon_isolated_danger: 'Stawiarka niebezpieczeństwa izolowanego',
  beacon_safe_water: 'Stawiarka bezpiecznej wody',
  beacon_special_purpose: 'Stawiarka specjalnego przeznaczenia',
  landmark: 'Znak lądowy',
  restricted_area: 'Obszar zastrzeżony',
  precautionary_area: 'Obszar ostrożności',
  separation_zone: 'Strefa rozdzielenia ruchu',
  traffic_separation_scheme: 'System rozdzielenia ruchu',
  traffic_separation_lane: 'Tor rozdzielenia ruchu',
  separation_boundary: 'Granica strefy rozdzielenia ruchu',
  inshore_traffic_zone: 'Przybrzeżna strefa ruchu',
  anchorage: 'Kotwicowisko',
  anchor_berth: 'Miejsce kotwiczenia',
  dumping_ground: 'Wysypisko odpadów morskich',
  spoil_ground: 'Teren zwałki urobku',
  fishing_ground: 'Łowisko',
  cable_area: 'Obszar kabli podmorskich',
  pipeline_area: 'Obszar rurociągów',
  dredged_area: 'Obszar pogłębiony',
  fairway: 'Tor wodny',
  recommended_track: 'Zalecany tor drogi',
  sea_area: 'Obszar morski',
  harbour: 'Port',
  berth: 'Nabrzeże',
  mooring: 'Cumowisko',
  pile: 'Pal cumowniczy',
  pontoon: 'Ponton',
  platform: 'Platforma',
  wreck: 'Wrak',
  rock: 'Skała / Mielizna',
  obstruction: 'Przeszkoda',
}

const COLOURS_PL = {
  red: 'czerwony',
  green: 'zielony',
  yellow: 'żółty',
  black: 'czarny',
  white: 'biały',
  orange: 'pomarańczowy',
  blue: 'niebieski',
  violet: 'fioletowy',
  amber: 'bursztynowy',
  grey: 'szary',
  gray: 'szary',
  brown: 'brązowy',
  magenta: 'karmazynowy',
  fluorescent_yellow: 'żółty fluorescencyjny',
  fluorescent_orange: 'pomarańczowy fluorescencyjny',
  fluorescent_red: 'czerwony fluorescencyjny',
}

const CARDINALS_PL = {
  north: 'północna',
  south: 'południowa',
  east: 'wschodnia',
  west: 'zachodnia',
}

const LATERALS_PL = {
  port: 'lewa burta (czerwona)',
  starboard: 'prawa burta (zielona)',
  preferred_channel_port: 'preferowany kanał — lewa burta',
  preferred_channel_starboard: 'preferowany kanał — prawa burta',
}

const CATEGORIES_PL = {
  military: 'wojskowy',
  nature_reserve: 'rezerwat przyrody',
  wildlife_refuge: 'ostoja przyrody',
  anchoring_prohibited: 'zakaz kotwiczenia',
  fishing_prohibited: 'zakaz połowów',
  swimming_prohibited: 'zakaz pływania',
  diving_prohibited: 'zakaz nurkowania',
  speed_restricted: 'ograniczenie prędkości',
  special_purpose: 'specjalnego przeznaczenia',
  outfall: 'wylot ścieków',
  odas: 'boja oceanograficzna',
  work_in_progress: 'roboty w toku',
  telegraph_cable: 'kabel telegraficzny',
  pipeline: 'rurociąg',
  spoil_ground: 'zwałka urobku',
  barge: 'barka',
  buoyage: 'oznakowanie bojowe',
  unrestricted_anchorage: 'kotwicowisko bez ograniczeń',
  deep_water_anchorage: 'kotwicowisko dla dużych jednostek',
  tanker_anchorage: 'kotwicowisko dla tankowców',
  quarantine_anchorage: 'kotwicowisko kwarantannowe',
  dumping_ground: 'wysypisko odpadów morskich',
  dredging: 'roboty pogłębiarskie',
  exercise_area: 'obszar ćwiczeń',
  nature_reserve_area: 'obszar rezerwatu',
}

export function translateType(type) {
  return SEAMARK_TYPES_PL[type] || (type || 'Znak nawigacyjny').replace(/_/g, ' ')
}

export function translateColour(colour) {
  if (!colour) return ''
  return colour.split(';').map(c => COLOURS_PL[c.trim()] || c.trim()).join(' / ')
}

export function translateCardinal(direction) {
  return CARDINALS_PL[direction?.toLowerCase()] || direction || ''
}

export function translateLateral(category) {
  return LATERALS_PL[category] || (category || '').replace(/_/g, ' ')
}

export function translateCategory(category) {
  return CATEGORIES_PL[category] || (category || '').replace(/_/g, ' ')
}
