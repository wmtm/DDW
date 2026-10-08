import { MAPTILER_KEY } from './maptiler'

/**
 * Curated stops into the Esri World Imagery Wayback archive — a free,
 * keyless archive of dated satellite imagery snapshots. Release numbers
 * verified to return real (non-empty) tiles over the estate. Kept on Esri
 * since there's no paid equivalent for dated historical imagery, and it's a
 * secondary feature people dip into occasionally rather than what loads by
 * default.
 * https://livingatlas.arcgis.com/wayback/
 */
export interface HistoricalYear {
  year: number
  releaseNum: number
}

export const historicalYears: HistoricalYear[] = [
  { year: 2014, releaseNum: 10 },
  { year: 2016, releaseNum: 3515 },
  { year: 2018, releaseNum: 13161 },
  { year: 2020, releaseNum: 23001 },
  { year: 2022, releaseNum: 42663 },
  { year: 2024, releaseNum: 41468 },
]

export function waybackTileUrl(releaseNum: number): string {
  return `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/${releaseNum}/{z}/{y}/{x}`
}

/**
 * Live/current satellite imagery — more recent than any dated Wayback
 * snapshot above, and what loads by default. On MapTiler (paid, reliable)
 * rather than Esri's free tier, which was the single biggest source of
 * "map won't load" reports since this is the default basemap. Note the
 * {z}/{x}/{y} order here is standard XYZ, unlike Esri's {z}/{y}/{x} above.
 */
export function currentImageryTileUrl(): string {
  return `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}?key=${MAPTILER_KEY}`
}

/** Which satellite imagery snapshot is selected: a specific archive year, the live feed, or none. */
export type ImagerySelection = number | 'current' | null
