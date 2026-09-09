export interface Poi {
  id: string
  name: string
  description: string
  longitude: number
  latitude: number
}

/**
 * PLACEHOLDER coordinates around Flic-en-Flac / Wolmar, Mauritius.
 * Not verified against the actual estate boundary — replace with
 * real pins once confirmed (e.g. from the venue or a site visit).
 */
export const pois: Poi[] = [
  {
    id: 'reception-hall',
    name: 'Campement de chasse',
    description: 'Hunting camp / lodge on the estate (placeholder location).',
    longitude: 57.3695,
    latitude: -20.3005,
  },
]
