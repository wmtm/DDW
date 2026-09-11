import { dmsToDecimal } from './geo'

export type PoiIconType = 'house' | 'gate' | 'shop'

export interface Poi {
  id: string
  name: string
  description: string
  longitude: number
  latitude: number
  icon: PoiIconType
}

/** Always-visible estate reference points — not affected by any layer toggle. */
export const pois: Poi[] = [
  {
    id: 'reception-hall',
    name: 'Campement de chasse',
    description: 'Camp de chasse / pavillon du domaine.',
    // DMS: 20°17'45.2"S 57°22'24.6"E
    latitude: dmsToDecimal(20, 17, 45.2, 'S'),
    longitude: dmsToDecimal(57, 22, 24.6, 'E'),
    icon: 'house',
  },
  {
    id: 'entree',
    name: 'Entrée',
    description: 'Entrée principale du domaine.',
    // DMS: 20°17'41.7"S 57°22'00.7"E
    latitude: dmsToDecimal(20, 17, 41.7, 'S'),
    longitude: dmsToDecimal(57, 22, 0.7, 'E'),
    icon: 'gate',
  },
  {
    id: 'boutique',
    name: 'La Boutique',
    description: 'Ouverture : Lun-Ven 9h-15h · Sam 9h-11h.',
    latitude: -20.29462,
    longitude: 57.36496,
    icon: 'shop',
  },
]
