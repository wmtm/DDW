import { dmsToDecimal } from './geo'

export interface Poi {
  id: string
  name: string
  description: string
  longitude: number
  latitude: number
}

/** Always-visible estate reference points — not affected by any layer toggle. */
export const pois: Poi[] = [
  {
    id: 'reception-hall',
    name: 'Campement de chasse',
    description: 'Hunting camp / lodge on the estate.',
    // DMS: 20°17'45.2"S 57°22'24.6"E
    latitude: dmsToDecimal(20, 17, 45.2, 'S'),
    longitude: dmsToDecimal(57, 22, 24.6, 'E'),
  },
  {
    id: 'entree',
    name: 'Entrée',
    description: 'Main entrance to the estate.',
    // DMS: 20°17'41.7"S 57°22'00.7"E
    latitude: dmsToDecimal(20, 17, 41.7, 'S'),
    longitude: dmsToDecimal(57, 22, 0.7, 'E'),
  },
]
