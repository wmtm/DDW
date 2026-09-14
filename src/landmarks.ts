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
import chute0Structure from './assets/landmarks/chute-0/01-structure.jpg'
import chute0Terrain from './assets/landmarks/chute-0/02-terrain.jpg'
import chute0Vue from './assets/landmarks/chute-0/03-vue.jpg'
import chute2Structure from './assets/landmarks/chute-2/01-structure.jpg'
import chute2Terrain from './assets/landmarks/chute-2/02-terrain.jpg'
import chute2Vue from './assets/landmarks/chute-2/03-vue.jpg'

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
    id: 'chute-2',
    number: 2,
    name: '',
    category: 'mirador',
    description: 'Mirador construit sur un affleurement rocheux, entouré de végétation, avec accès par échelle en bois.',
    // DMS: 20°17'23.0"S 57°22'14.1"E
    latitude: dmsToDecimal(20, 17, 23.0, 'S'),
    longitude: dmsToDecimal(57, 22, 14.1, 'E'),
    photos: [
      { src: chute2Structure, caption: 'Structure du mirador' },
      { src: chute2Terrain, caption: 'Terrain environnant' },
      { src: chute2Vue, caption: 'Vue depuis le mirador' },
    ],
  },
  {
    id: 'chute-0',
    number: 0,
    name: '',
    category: 'mirador',
    description: 'Mirador construit dans un arbre isolé, avec une échelle d\'accès, surplombant une clairière ouverte.',
    // DMS: 20°17'27.5"S 57°22'04.7"E
    latitude: dmsToDecimal(20, 17, 27.5, 'S'),
    longitude: dmsToDecimal(57, 22, 4.7, 'E'),
    photos: [
      { src: chute0Structure, caption: 'Structure du mirador' },
      { src: chute0Terrain, caption: 'Terrain environnant' },
      { src: chute0Vue, caption: 'Vue depuis le mirador' },
    ],
  },
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
