import type { Map as MLMap } from 'maplibre-gl'

export interface Waypoint {
  center: [number, number]
  zoom: number
  pitch: number
  bearing: number
  duration: number
}

/**
 * Scripted camera path over the estate. Anchored on the real boundary
 * traced in Google My Maps (see boundary.ts): an establishing shot over
 * the true bounding-box centroid, then sweeps to the northern, eastern,
 * and southern edges of the actual outline, before settling on the map's
 * default resting view.
 */
export const tourWaypoints: Waypoint[] = [
  { center: [57.3774, -20.2996], zoom: 13.3, pitch: 45, bearing: 0, duration: 0 },
  { center: [57.3667613, -20.2908203], zoom: 15.5, pitch: 70, bearing: -30, duration: 4000 },
  { center: [57.388597, -20.3061302], zoom: 16, pitch: 72, bearing: 60, duration: 4500 },
  { center: [57.3692446, -20.31263], zoom: 15, pitch: 65, bearing: 150, duration: 5000 },
  { center: [57.368, -20.302], zoom: 15, pitch: 60, bearing: -20, duration: 4000 },
]

function flyToAsync(map: MLMap, wp: Waypoint, cancelled: { current: boolean }) {
  return new Promise<void>((resolve) => {
    if (cancelled.current) {
      resolve()
      return
    }
    const onEnd = () => {
      map.off('moveend', onEnd)
      resolve()
    }
    map.on('moveend', onEnd)
    map.flyTo({
      center: wp.center,
      zoom: wp.zoom,
      pitch: wp.pitch,
      bearing: wp.bearing,
      duration: wp.duration,
      essential: true,
    })
  })
}

export async function runTour(map: MLMap, cancelled: { current: boolean }) {
  for (const wp of tourWaypoints) {
    if (cancelled.current) return
    await flyToAsync(map, wp, cancelled)
  }
}
