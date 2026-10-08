/**
 * Real landmarks on the estate — numbered chutes/miradors (hunting hides/
 * stations) and other named features. Entries can arrive with just a
 * number/name/location (`photos: []`) ahead of a site visit, with photos
 * added later once they're taken.
 *
 * To add a new one with photos already in hand:
 * 1. Convert its photos from HEIC to JPEG, correcting EXIF orientation and
 *    resizing to a max dimension of ~1600px (keeps the repo from bloating).
 * 2. Put them in a new `src/assets/landmarks/<slug>/` folder, named by role
 *    (e.g. `01-structure.jpg`, `02-terrain.jpg`), and generate a matching
 *    `<role>-thumb.jpg` next to each one (~440px max dimension, quality 72 —
 *    see the thumbnail generation one-liner in git history) for the popup/
 *    tour-card thumbnail; the full-res file is only used by the lightbox.
 * 3. Import both files below and add one entry to `landmarks`, converting
 *    its GPS coordinates with `dmsToDecimal` (see geo.ts) and keeping a
 *    `// DMS: ...` comment for traceability.
 * To add one without photos yet, same thing but with `photos: []` — once
 * its photos arrive, add them the same way and update that entry in place.
 */
import { dmsToDecimal } from './geo'
import pontMimiStructure from './assets/landmarks/chute-123-pont-mimi/01-structure.jpg'
import pontMimiStructureThumb from './assets/landmarks/chute-123-pont-mimi/01-structure-thumb.jpg'
import pontMimiTerrain from './assets/landmarks/chute-123-pont-mimi/02-terrain.jpg'
import pontMimiTerrainThumb from './assets/landmarks/chute-123-pont-mimi/02-terrain-thumb.jpg'
import chute0Structure from './assets/landmarks/chute-0/01-structure.jpg'
import chute0StructureThumb from './assets/landmarks/chute-0/01-structure-thumb.jpg'
import chute0Terrain from './assets/landmarks/chute-0/02-terrain.jpg'
import chute0TerrainThumb from './assets/landmarks/chute-0/02-terrain-thumb.jpg'
import chute0Vue from './assets/landmarks/chute-0/03-vue.jpg'
import chute0VueThumb from './assets/landmarks/chute-0/03-vue-thumb.jpg'
import chute2Structure from './assets/landmarks/chute-2/01-structure.jpg'
import chute2StructureThumb from './assets/landmarks/chute-2/01-structure-thumb.jpg'
import chute2Terrain from './assets/landmarks/chute-2/02-terrain.jpg'
import chute2TerrainThumb from './assets/landmarks/chute-2/02-terrain-thumb.jpg'
import chute2Vue from './assets/landmarks/chute-2/03-vue.jpg'
import chute2VueThumb from './assets/landmarks/chute-2/03-vue-thumb.jpg'
import chute3Structure from './assets/landmarks/chute-3/01-structure.jpg'
import chute3StructureThumb from './assets/landmarks/chute-3/01-structure-thumb.jpg'
import chute3Terrain from './assets/landmarks/chute-3/02-terrain.jpg'
import chute3TerrainThumb from './assets/landmarks/chute-3/02-terrain-thumb.jpg'
import chute3Vue from './assets/landmarks/chute-3/03-vue.jpg'
import chute3VueThumb from './assets/landmarks/chute-3/03-vue-thumb.jpg'
import chute4Structure from './assets/landmarks/chute-4-grosse-roche/01-structure.jpg'
import chute4StructureThumb from './assets/landmarks/chute-4-grosse-roche/01-structure-thumb.jpg'
import chute4Vue from './assets/landmarks/chute-4-grosse-roche/02-vue.jpg'
import chute4VueThumb from './assets/landmarks/chute-4-grosse-roche/02-vue-thumb.jpg'
import chute1Structure from './assets/landmarks/chute-1/01-structure.jpg'
import chute1StructureThumb from './assets/landmarks/chute-1/01-structure-thumb.jpg'
import chute12Structure from './assets/landmarks/chute-12/01-structure.jpg'
import chute12StructureThumb from './assets/landmarks/chute-12/01-structure-thumb.jpg'
import chute12Terrain from './assets/landmarks/chute-12/02-terrain.jpg'
import chute12TerrainThumb from './assets/landmarks/chute-12/02-terrain-thumb.jpg'
import chute12Vue from './assets/landmarks/chute-12/03-vue.jpg'
import chute12VueThumb from './assets/landmarks/chute-12/03-vue-thumb.jpg'
import chute3BisStructure from './assets/landmarks/chute-3-bis/01-structure.jpg'
import chute3BisStructureThumb from './assets/landmarks/chute-3-bis/01-structure-thumb.jpg'
import chute3BisTerrain from './assets/landmarks/chute-3-bis/02-terrain.jpg'
import chute3BisTerrainThumb from './assets/landmarks/chute-3-bis/02-terrain-thumb.jpg'
import chute3BisVue from './assets/landmarks/chute-3-bis/03-vue.jpg'
import chute3BisVueThumb from './assets/landmarks/chute-3-bis/03-vue-thumb.jpg'
import chute148Structure from './assets/landmarks/chute-148/01-structure.jpg'
import chute148StructureThumb from './assets/landmarks/chute-148/01-structure-thumb.jpg'
import chute149Structure from './assets/landmarks/chute-149/01-structure.jpg'
import chute149StructureThumb from './assets/landmarks/chute-149/01-structure-thumb.jpg'
import largeCoral1Vue from './assets/landmarks/large-coral-1/01-vue.jpg'
import largeCoral1VueThumb from './assets/landmarks/large-coral-1/01-vue-thumb.jpg'
import shootingRangeVue1 from './assets/landmarks/shooting-range/01-vue.jpg'
import shootingRangeVue1Thumb from './assets/landmarks/shooting-range/01-vue-thumb.jpg'
import shootingRangeVue2 from './assets/landmarks/shooting-range/02-vue.jpg'
import shootingRangeVue2Thumb from './assets/landmarks/shooting-range/02-vue-thumb.jpg'
import shootingRangeVue3 from './assets/landmarks/shooting-range/03-vue.jpg'
import shootingRangeVue3Thumb from './assets/landmarks/shooting-range/03-vue-thumb.jpg'
import theYardVue from './assets/landmarks/the-yard/01-vue.jpg'
import theYardVueThumb from './assets/landmarks/the-yard/01-vue-thumb.jpg'
import theYardExterieur from './assets/landmarks/the-yard/02-exterieur.jpg'
import theYardExterieurThumb from './assets/landmarks/the-yard/02-exterieur-thumb.jpg'
import theYardInterieur from './assets/landmarks/the-yard/03-interieur.jpg'
import theYardInterieurThumb from './assets/landmarks/the-yard/03-interieur-thumb.jpg'
import ancienGate2Vue from './assets/landmarks/ancien-gate-2/01-vue.jpg'
import ancienGate2VueThumb from './assets/landmarks/ancien-gate-2/01-vue-thumb.jpg'
import mangeoireVue1 from './assets/landmarks/ancien-gate-1-mangeoire/01-vue.jpg'
import mangeoireVue1Thumb from './assets/landmarks/ancien-gate-1-mangeoire/01-vue-thumb.jpg'
import mangeoireVue2 from './assets/landmarks/ancien-gate-1-mangeoire/02-vue.jpg'
import mangeoireVue2Thumb from './assets/landmarks/ancien-gate-1-mangeoire/02-vue-thumb.jpg'
import chute61Structure from './assets/landmarks/chute-61/01-structure.jpg'
import chute61StructureThumb from './assets/landmarks/chute-61/01-structure-thumb.jpg'
import chute61StructureProche from './assets/landmarks/chute-61/02-structure-proche.jpg'
import chute61StructureProcheThumb from './assets/landmarks/chute-61/02-structure-proche-thumb.jpg'
import chute72Structure from './assets/landmarks/chute-72/01-structure.jpg'
import chute72StructureThumb from './assets/landmarks/chute-72/01-structure-thumb.jpg'
import chuteF2Structure from './assets/landmarks/chute-f2/01-structure.jpg'
import chuteF2StructureThumb from './assets/landmarks/chute-f2/01-structure-thumb.jpg'
import chuteTbcStructure from './assets/landmarks/chute-tbc/01-structure.jpg'
import chuteTbcStructureThumb from './assets/landmarks/chute-tbc/01-structure-thumb.jpg'
import chuteTbcMarqueLezard from './assets/landmarks/chute-tbc/02-marque-lezard.jpg'
import chuteTbcMarqueLezardThumb from './assets/landmarks/chute-tbc/02-marque-lezard-thumb.jpg'
import chute178Vue from './assets/landmarks/chute-178/01-vue.jpg'
import chute178VueThumb from './assets/landmarks/chute-178/01-vue-thumb.jpg'
import chuteF2Vue2 from './assets/landmarks/chute-f2/02-vue.jpg'
import chuteF2Vue2Thumb from './assets/landmarks/chute-f2/02-vue-thumb.jpg'
import chuteF2Vue3 from './assets/landmarks/chute-f2/03-vue.jpg'
import chuteF2Vue3Thumb from './assets/landmarks/chute-f2/03-vue-thumb.jpg'
import chute176Structure from './assets/landmarks/chute-176/01-structure.jpg'
import chute176StructureThumb from './assets/landmarks/chute-176/01-structure-thumb.jpg'
import chute176VueCerfs from './assets/landmarks/chute-176/02-vue-cerfs.jpg'
import chute176VueCerfsThumb from './assets/landmarks/chute-176/02-vue-cerfs-thumb.jpg'
import chute177Structure from './assets/landmarks/chute-177/01-structure.jpg'
import chute177StructureThumb from './assets/landmarks/chute-177/01-structure-thumb.jpg'
import chute176Panorama from './assets/landmarks/chute-176/03-panorama.jpg'
import chute176PanoramaThumb from './assets/landmarks/chute-176/03-panorama-thumb.jpg'
import chuteF1Structure from './assets/landmarks/chute-f1/01-structure.jpg'
import chuteF1StructureThumb from './assets/landmarks/chute-f1/01-structure-thumb.jpg'
import chuteF1Panorama from './assets/landmarks/chute-f1/02-panorama.jpg'
import chuteF1PanoramaThumb from './assets/landmarks/chute-f1/02-panorama-thumb.jpg'
import chuteF1Panorama2 from './assets/landmarks/chute-f1/03-panorama-2.jpg'
import chuteF1Panorama2Thumb from './assets/landmarks/chute-f1/03-panorama-2-thumb.jpg'

export type LandmarkCategory = 'mirador' | 'water-point' | 'historic-marker' | 'other' | 'special-spot' | 'coral-reef'

export interface LandmarkPhoto {
  /** Full-resolution image, used by the lightbox. */
  src: string
  /** Small (~440px) variant for the popup/tour-card thumbnail, so opening a
   * pin doesn't download the full photo just to show it shrunk to 220px. */
  thumb: string
  caption?: string
}

export type LandmarkSize = 'small' | 'large'

export interface Landmark {
  id: string
  /**
   * The hunt's station number, where the category has one (e.g. miradors).
   * Usually numeric, but a few stations are labeled instead (e.g. "F1",
   * "TBC") — kept as a string in those cases. Null otherwise.
   */
  number: number | string | null
  name: string
  category: LandmarkCategory
  description: string
  longitude: number
  latitude: number
  photos: LandmarkPhoto[]
  /** Flagged in red on the map while its number/name is still pending confirmation with the board. */
  needsReview?: boolean
  /** Rough size estimate, where known. */
  size?: LandmarkSize
}

/** Sort key for `number`: real numbers first in order, labels (e.g. "F1") after, in array order. */
export function landmarkNumberSortKey(number: Landmark['number']): number {
  return typeof number === 'number' ? number : Infinity
}

export const landmarkCategoryLabels: Record<LandmarkCategory, string> = {
  mirador: 'Chute / mirador',
  'water-point': "Point d'eau",
  'historic-marker': 'Repère historique',
  other: 'Autre élément',
  'special-spot': 'Lieu remarquable',
  'coral-reef': 'Corail & récif ancien',
}

export const landmarkCategoryColors: Record<LandmarkCategory, string> = {
  mirador: '#f4a300',
  'water-point': '#4a90d9',
  'historic-marker': '#a3785c',
  other: '#9b59b6',
  'special-spot': '#2a9d8f',
  'coral-reef': '#ff6f59',
}

/** Small glyph shown inside the pin for categories that aren't numbered chutes. */
export const landmarkCategoryIcons: Partial<Record<LandmarkCategory, string>> = {
  'special-spot': '🚩',
  'coral-reef': '🪸',
}

export const landmarks: Landmark[] = [
  {
    id: 'kiosk-vert',
    number: null,
    name: 'Kiosk Vert',
    category: 'special-spot',
    description: 'Kiosque vert, point de rencontre sur le domaine.',
    // DMS: 20°18'18.4"S 57°22'14.9"E
    latitude: dmsToDecimal(20, 18, 18.4, 'S'),
    longitude: dmsToDecimal(57, 22, 14.9, 'E'),
    photos: [],
  },
  {
    id: 'shooting-range',
    number: null,
    name: 'Shooting range',
    category: 'special-spot',
    description: 'Pas de tir du domaine.',
    // DMS: 20°18'30.7"S 57°22'10.3"E
    latitude: dmsToDecimal(20, 18, 30.7, 'S'),
    longitude: dmsToDecimal(57, 22, 10.3, 'E'),
    photos: [
      { src: shootingRangeVue1, thumb: shootingRangeVue1Thumb, caption: 'Vue du pas de tir' },
      { src: shootingRangeVue2, thumb: shootingRangeVue2Thumb, caption: 'Pas de tir' },
      { src: shootingRangeVue3, thumb: shootingRangeVue3Thumb, caption: 'Pas de tir, autre angle' },
    ],
  },
  {
    id: 'ancien-gate-2',
    number: null,
    name: 'Ancien gate 2',
    category: 'special-spot',
    description: 'Ancien portail du domaine.',
    // DMS: 20°18'32.8"S 57°22'09.5"E
    latitude: dmsToDecimal(20, 18, 32.8, 'S'),
    longitude: dmsToDecimal(57, 22, 9.5, 'E'),
    photos: [{ src: ancienGate2Vue, thumb: ancienGate2VueThumb, caption: 'Ancien portail' }],
  },
  {
    id: 'ancien-gate-1-mangeoire',
    number: null,
    name: 'Ancien gate 1 and Vieille mangeoire',
    category: 'special-spot',
    description: 'Ancien portail et ancienne mangeoire du domaine.',
    // DMS: 20°18'35.1"S 57°22'13.3"E
    latitude: dmsToDecimal(20, 18, 35.1, 'S'),
    longitude: dmsToDecimal(57, 22, 13.3, 'E'),
    photos: [
      { src: mangeoireVue1, thumb: mangeoireVue1Thumb, caption: 'Vieille mangeoire' },
      { src: mangeoireVue2, thumb: mangeoireVue2Thumb, caption: 'Vieille mangeoire, autre angle' },
    ],
  },
  {
    id: 'the-yard',
    number: null,
    name: 'The Yard',
    category: 'special-spot',
    description: 'Zone de rassemblement du domaine.',
    // DMS: 20°18'42.9"S 57°22'13.3"E
    latitude: dmsToDecimal(20, 18, 42.9, 'S'),
    longitude: dmsToDecimal(57, 22, 13.3, 'E'),
    photos: [
      { src: theYardVue, thumb: theYardVueThumb, caption: 'Vue d\'ensemble' },
      { src: theYardExterieur, thumb: theYardExterieurThumb, caption: 'Vue extérieure' },
      { src: theYardInterieur, thumb: theYardInterieurThumb, caption: 'Vue intérieure' },
    ],
  },
  {
    id: 'large-coral-1',
    number: null,
    name: 'Large coral 1',
    category: 'coral-reef',
    description: 'Grand corail, vestige d\'un ancien récif corallien.',
    // DMS: 20°18'38.4"S 57°22'17.6"E
    latitude: dmsToDecimal(20, 18, 38.4, 'S'),
    longitude: dmsToDecimal(57, 22, 17.6, 'E'),
    photos: [{ src: largeCoral1Vue, thumb: largeCoral1VueThumb, caption: 'Vue du corail' }],
  },
  {
    id: 'chute-59',
    number: 59,
    name: 'Rattle Snake',
    category: 'mirador',
    description: 'Chute recensée, en attente de visite et de photos.',
    // DMS: 20°18'18.9"S 57°22'09.0"E
    latitude: dmsToDecimal(20, 18, 18.9, 'S'),
    longitude: dmsToDecimal(57, 22, 9.0, 'E'),
    size: 'small',
    photos: [],
  },
  {
    id: 'chute-60',
    number: 60,
    name: '',
    category: 'mirador',
    description: 'Chute recensée, en attente de visite et de photos.',
    // DMS: 20°18'18.1"S 57°22'17.8"E
    latitude: dmsToDecimal(20, 18, 18.1, 'S'),
    longitude: dmsToDecimal(57, 22, 17.8, 'E'),
    size: 'large',
    photos: [],
  },
  {
    id: 'chute-61',
    number: 61,
    name: '',
    category: 'mirador',
    description: 'Mirador construit dans un arbre touffu, en bordure d\'une zone rocheuse dégagée.',
    // DMS: 20°18'18.7"S 57°22'23.9"E
    latitude: dmsToDecimal(20, 18, 18.7, 'S'),
    longitude: dmsToDecimal(57, 22, 23.9, 'E'),
    photos: [
      { src: chute61Structure, thumb: chute61StructureThumb, caption: 'Vue d\'ensemble du mirador' },
      { src: chute61StructureProche, thumb: chute61StructureProcheThumb, caption: 'Structure du mirador' },
    ],
  },
  {
    id: 'chute-72',
    number: 72,
    name: 'Bonhomme Baissac',
    category: 'mirador',
    description: 'Mirador construit dans un arbre, en bordure d\'une zone boisée.',
    // DMS: 20°18'24.0"S 57°22'31.9"E
    latitude: dmsToDecimal(20, 18, 24.0, 'S'),
    longitude: dmsToDecimal(57, 22, 31.9, 'E'),
    photos: [{ src: chute72Structure, thumb: chute72StructureThumb, caption: 'Structure du mirador' }],
  },
  {
    id: 'chute-73',
    number: 73,
    name: '',
    category: 'mirador',
    description: 'Chute recensée, en attente de visite et de photos.',
    // DMS: 20°18'28.6"S 57°22'31.7"E
    latitude: dmsToDecimal(20, 18, 28.6, 'S'),
    longitude: dmsToDecimal(57, 22, 31.7, 'E'),
    photos: [],
  },
  {
    id: 'chute-176',
    number: 176,
    name: '',
    category: 'mirador',
    description: 'Mirador construit dans un grand arbre, avec vue sur une clairière fréquentée par des cerfs.',
    // DMS: 20°18'40.0"S 57°22'12.9"E
    latitude: dmsToDecimal(20, 18, 40.0, 'S'),
    longitude: dmsToDecimal(57, 22, 12.9, 'E'),
    size: 'large',
    photos: [
      { src: chute176Structure, thumb: chute176StructureThumb, caption: 'Structure du mirador' },
      { src: chute176VueCerfs, thumb: chute176VueCerfsThumb, caption: 'Vue sur la clairière, cerfs visibles' },
      { src: chute176Panorama, thumb: chute176PanoramaThumb, caption: 'Panorama depuis le mirador' },
    ],
  },
  {
    id: 'chute-177',
    number: 177,
    name: '',
    category: 'mirador',
    description: 'Chute recensée, en attente de visite et de photos.',
    // DMS: 20°18'35.3"S 57°22'17.8"E
    latitude: dmsToDecimal(20, 18, 35.3, 'S'),
    longitude: dmsToDecimal(57, 22, 17.8, 'E'),
    size: 'large',
    photos: [{ src: chute177Structure, thumb: chute177StructureThumb, caption: 'Structure du mirador' }],
  },
  {
    id: 'chute-178',
    number: 178,
    name: 'Tekoma',
    category: 'mirador',
    description: 'Mirador construit dans un arbre, en lisière d\'une zone dégagée, avec vue sur la montagne.',
    // DMS: 20°18'32.9"S 57°22'23.9"E
    latitude: dmsToDecimal(20, 18, 32.9, 'S'),
    longitude: dmsToDecimal(57, 22, 23.9, 'E'),
    photos: [{ src: chute178Vue, thumb: chute178VueThumb, caption: 'Vue depuis le mirador' }],
  },
  {
    id: 'chute-179',
    number: 179,
    name: '',
    category: 'mirador',
    description: 'Chute recensée, en attente de visite et de photos.',
    // DMS: 20°18'29.1"S 57°22'23.9"E
    latitude: dmsToDecimal(20, 18, 29.1, 'S'),
    longitude: dmsToDecimal(57, 22, 23.9, 'E'),
    photos: [],
  },
  {
    id: 'chute-f1',
    number: 'F1',
    name: '',
    category: 'mirador',
    description: 'Mirador construit dans un arbre, en bordure d\'un champ dégagé avec vue sur la montagne.',
    // DMS: 20°18'33.0"S 57°22'10.8"E
    latitude: dmsToDecimal(20, 18, 33.0, 'S'),
    longitude: dmsToDecimal(57, 22, 10.8, 'E'),
    photos: [
      { src: chuteF1Structure, thumb: chuteF1StructureThumb, caption: 'Structure du mirador' },
      { src: chuteF1Panorama, thumb: chuteF1PanoramaThumb, caption: 'Panorama depuis le mirador' },
      { src: chuteF1Panorama2, thumb: chuteF1Panorama2Thumb, caption: 'Panorama depuis le mirador, autre angle' },
    ],
  },
  {
    id: 'chute-f2',
    number: 'F2',
    name: '',
    category: 'mirador',
    description: 'Mirador construit dans un arbre, en bordure d\'un champ dégagé.',
    // DMS: 20°18'28.5"S 57°22'09.4"E
    latitude: dmsToDecimal(20, 18, 28.5, 'S'),
    longitude: dmsToDecimal(57, 22, 9.4, 'E'),
    size: 'small',
    photos: [
      { src: chuteF2Structure, thumb: chuteF2StructureThumb, caption: 'Structure du mirador' },
      { src: chuteF2Vue2, thumb: chuteF2Vue2Thumb, caption: 'Vue depuis le mirador' },
      { src: chuteF2Vue3, thumb: chuteF2Vue3Thumb, caption: 'Vue depuis le mirador, autre angle' },
    ],
  },
  {
    id: 'chute-tbc',
    number: 'TBC',
    name: '',
    category: 'mirador',
    description: 'Chute recensée, numéro et nom à confirmer avec le comité — un lézard est peint sur un poteau à proximité.',
    // DMS: 20°18'31.3"S 57°22'13.1"E
    latitude: dmsToDecimal(20, 18, 31.3, 'S'),
    longitude: dmsToDecimal(57, 22, 13.1, 'E'),
    size: 'large',
    needsReview: true,
    photos: [
      { src: chuteTbcStructure, thumb: chuteTbcStructureThumb, caption: 'Structure du mirador' },
      { src: chuteTbcMarqueLezard, thumb: chuteTbcMarqueLezardThumb, caption: 'Lézard peint sur un poteau à proximité' },
    ],
  },
  {
    id: 'chute-148',
    number: 148,
    name: '',
    category: 'mirador',
    description: 'Mirador construit dans un arbre, entre plusieurs troncs.',
    // DMS: 20°17'57.0"S 57°23'04.1"E
    latitude: dmsToDecimal(20, 17, 57.0, 'S'),
    longitude: dmsToDecimal(57, 23, 4.1, 'E'),
    photos: [{ src: chute148Structure, thumb: chute148StructureThumb, caption: 'Structure du mirador' }],
  },
  {
    id: 'chute-149',
    number: 149,
    name: '',
    category: 'mirador',
    description: 'Mirador construit à la base d\'un grand arbre aux racines apparentes.',
    // DMS: 20°18'00.0"S 57°23'03.3"E
    latitude: dmsToDecimal(20, 18, 0.0, 'S'),
    longitude: dmsToDecimal(57, 23, 3.3, 'E'),
    photos: [{ src: chute149Structure, thumb: chute149StructureThumb, caption: 'Structure du mirador' }],
  },
  {
    id: 'chute-12',
    number: 12,
    name: '',
    category: 'mirador',
    description: 'Mirador construit dans un arbre en bordure d\'un chemin de terre, avec échelle en bambou.',
    // DMS: 20°17'39.7"S 57°22'17.4"E
    latitude: dmsToDecimal(20, 17, 39.7, 'S'),
    longitude: dmsToDecimal(57, 22, 17.4, 'E'),
    photos: [
      { src: chute12Structure, thumb: chute12StructureThumb, caption: 'Structure du mirador' },
      { src: chute12Terrain, thumb: chute12TerrainThumb, caption: 'Terrain environnant' },
      { src: chute12Vue, thumb: chute12VueThumb, caption: 'Vue depuis le mirador' },
    ],
  },
  {
    id: 'chute-1',
    number: 1,
    name: '',
    category: 'mirador',
    description: 'Mirador construit dans un grand arbre touffu, en bordure d\'un chemin de terre.',
    // DMS: 20°17'31.2"S 57°22'08.8"E
    latitude: dmsToDecimal(20, 17, 31.2, 'S'),
    longitude: dmsToDecimal(57, 22, 8.8, 'E'),
    photos: [{ src: chute1Structure, thumb: chute1StructureThumb, caption: 'Structure du mirador' }],
  },
  {
    id: 'chute-4-grosse-roche',
    number: 4,
    name: 'Grosse Roche',
    category: 'mirador',
    description: 'Mirador construit dans un arbre, à la base d\'un amas de gros blocs de roche volcanique.',
    // DMS: 20°17'16.9"S 57°22'16.1"E
    latitude: dmsToDecimal(20, 17, 16.9, 'S'),
    longitude: dmsToDecimal(57, 22, 16.1, 'E'),
    photos: [
      { src: chute4Structure, thumb: chute4StructureThumb, caption: 'Structure du mirador' },
      { src: chute4Vue, thumb: chute4VueThumb, caption: 'Vue depuis le mirador' },
    ],
  },
  {
    id: 'chute-3-bis',
    number: 3,
    name: '',
    category: 'mirador',
    description: 'Mirador construit dans un arbre isolé en clairière, structure sur pieds tripode/croisillons.',
    // DMS: 20°17'15.7"S 57°22'09.6"E
    latitude: dmsToDecimal(20, 17, 15.7, 'S'),
    longitude: dmsToDecimal(57, 22, 9.6, 'E'),
    needsReview: true,
    photos: [
      { src: chute3BisStructure, thumb: chute3BisStructureThumb, caption: 'Structure du mirador' },
      { src: chute3BisTerrain, thumb: chute3BisTerrainThumb, caption: 'Terrain environnant' },
      { src: chute3BisVue, thumb: chute3BisVueThumb, caption: 'Vue depuis le mirador' },
    ],
  },
  {
    id: 'chute-3',
    number: 3,
    name: 'Momo',
    category: 'mirador',
    description: 'Mirador construit au sommet d\'un enchevêtrement d\'arbustes et de branchages.',
    // DMS: 20°17'18.5"S 57°22'04.4"E
    latitude: dmsToDecimal(20, 17, 18.5, 'S'),
    longitude: dmsToDecimal(57, 22, 4.4, 'E'),
    photos: [
      { src: chute3Structure, thumb: chute3StructureThumb, caption: 'Structure du mirador' },
      { src: chute3Terrain, thumb: chute3TerrainThumb, caption: 'Terrain environnant' },
      { src: chute3Vue, thumb: chute3VueThumb, caption: 'Vue depuis le mirador' },
    ],
  },
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
      { src: chute2Structure, thumb: chute2StructureThumb, caption: 'Structure du mirador' },
      { src: chute2Terrain, thumb: chute2TerrainThumb, caption: 'Terrain environnant' },
      { src: chute2Vue, thumb: chute2VueThumb, caption: 'Vue depuis le mirador' },
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
      { src: chute0Structure, thumb: chute0StructureThumb, caption: 'Structure du mirador' },
      { src: chute0Terrain, thumb: chute0TerrainThumb, caption: 'Terrain environnant' },
      { src: chute0Vue, thumb: chute0VueThumb, caption: 'Vue depuis le mirador' },
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
      { src: pontMimiStructure, thumb: pontMimiStructureThumb, caption: 'Structure du mirador' },
      { src: pontMimiTerrain, thumb: pontMimiTerrainThumb, caption: 'Terrain environnant' },
    ],
  },
]
