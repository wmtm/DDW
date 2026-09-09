export type TerrainType = 'forest' | 'field' | 'water' | 'trail'

export interface TerrainZone {
  id: string
  name: string
  type: TerrainType
  description: string
  /** Closed polygon ring [lng, lat][]. */
  coordinates: [number, number][]
}

export const terrainTypeLabels: Record<TerrainType, string> = {
  forest: 'Forest',
  field: 'Open field',
  water: 'Water',
  trail: 'Trail corridor',
}

export const terrainTypeColors: Record<TerrainType, string> = {
  forest: '#2d6a4f',
  field: '#c9e4a3',
  water: '#4a90d9',
  trail: '#e0a458',
}

/**
 * Hand-placed against satellite imagery to approximate visible tree cover,
 * clearings, and trails — not a surveyed land-cover dataset. Replace with
 * real vector data when available.
 */
export const terrainZones: TerrainZone[] = [
  {
    id: 'main-clearing',
    name: 'Main clearing',
    type: 'field',
    description: 'Open grassy area used off-season for weddings and events.',
    coordinates: [
      [57.3665, -20.2995],
      [57.371, -20.2985],
      [57.371, -20.3025],
      [57.3665, -20.3035],
      [57.3665, -20.2995],
    ],
  },
]
