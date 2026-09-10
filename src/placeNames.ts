/**
 * Named plains/areas on the estate, shown as plain text labels on the map
 * (no pin). Only rendered once zoomed in past `minZoom` — 15 is a
 * reasonable default, matching the app's default overview zoom, so names
 * only appear once zoomed in past that. No data yet — entries to come.
 */
export interface PlaceName {
  id: string
  name: string
  longitude: number
  latitude: number
  minZoom: number
}

export const placeNames: PlaceName[] = []
