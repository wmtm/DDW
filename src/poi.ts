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
    description: 'Camp de chasse / pavillon du domaine.',
    // DMS: 20°17'45.2"S 57°22'24.6"E
    latitude: dmsToDecimal(20, 17, 45.2, 'S'),
    longitude: dmsToDecimal(57, 22, 24.6, 'E'),
  },
  {
    id: 'entree',
    name: 'Entrée',
    description: 'Entrée principale du domaine.',
    // DMS: 20°17'41.7"S 57°22'00.7"E
    latitude: dmsToDecimal(20, 17, 41.7, 'S'),
    longitude: dmsToDecimal(57, 22, 0.7, 'E'),
  },
  {
    id: 'boutique',
    name: 'La Boutique',
    description:
      "Ouverture : Lun-Ven 9h-15h · Sam 9h-11h. Emplacement approximatif en attendant un code Plus Code complet (fourni : P947+4XX) ou des coordonnées DMS.",
    // Placeholder near le Campement de chasse — à corriger dès réception d'une localisation précise.
    latitude: dmsToDecimal(20, 17, 45.2, 'S') + 0.0004,
    longitude: dmsToDecimal(57, 22, 24.6, 'E') + 0.0004,
  },
]
