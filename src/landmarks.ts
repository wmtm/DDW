/**
 * Real, site-visited landmarks on the estate — numbered chutes/miradors
 * (hunting hides/stations) and other named features, sent in one at a time
 * as they're visited and photographed.
 *
 * To add the next one:
 * 1. Convert its photos from HEIC to JPEG, correcting EXIF orientation and
 *    resizing to a max dimension of ~1600px (keeps the repo from bloating).
 * 2. Put them in a new `src/assets/landmarks/<slug>/` folder, named by role
 *    (e.g. `01-structure.jpg`, `02-terrain.jpg`).
 * 3. Import them below and add one entry to `landmarks`, converting its
 *    GPS coordinates with `dmsToDecimal` (see geo.ts) and keeping a
 *    `// DMS: ...` comment for traceability.
 */
import { dmsToDecimal } from './geo'
import pontMimiStructure from './assets/landmarks/chute-123-pont-mimi/01-structure.jpg'
import pontMimiTerrain from './assets/landmarks/chute-123-pont-mimi/02-terrain.jpg'

export type LandmarkCategory = 'mirador' | 'water-point' | 'historic-marker' | 'other'

export interface LandmarkPhoto {
  src: string
  caption?: string
}

export interface Landmark {
  id: string
  /** The hunt's station number, where the category has one (e.g. miradors). Null otherwise. */
  number: number | null
  name: string
  category: LandmarkCategory
  description: string
  longitude: number
  latitude: number
  photos: LandmarkPhoto[]
}

export const landmarkCategoryLabels: Record<LandmarkCategory, string> = {
  mirador: 'Chute / mirador',
  'water-point': "Point d'eau",
  'historic-marker': 'Repère historique',
  other: 'Autre élément',
}

export const landmarkCategoryColors: Record<LandmarkCategory, string> = {
  mirador: '#f4a300',
  'water-point': '#4a90d9',
  'historic-marker': '#a3785c',
  other: '#9b59b6',
}

export const landmarks: Landmark[] = [
  {
    id: 'chute-123-pont-mimi',
    number: 123,
    name: 'Pont Mimi',
    category: 'mirador',
    description: 'Mirador surélevé construit dans un grand arbre, surplombant une clairière rocheuse dégagée.',
    // DMS: 20°18'08.8"S 57°22'54.9"E
    latitude: dmsToDecimal(20, 18, 8.8, 'S'),
    longitude: dmsToDecimal(57, 22, 54.9, 'E'),
    photos: [
      { src: pontMimiStructure, caption: 'Structure du mirador' },
      { src: pontMimiTerrain, caption: 'Terrain environnant' },
    ],
  },
]
