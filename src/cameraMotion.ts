import type { Map as MLMap } from 'maplibre-gl'

export interface CameraTarget {
  center: [number, number]
  zoom: number
  pitch: number
  bearing: number
}

/** Smooth ease-in-out-cubic — slow start, fast middle, slow finish, instead of flyTo's default easing (closer to ease-out, which starts moving at full speed). */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

/**
 * Eases the camera to a target view. Wraps flyTo with house defaults so
 * every programmatic move (recenter, chute selection, tour navigation, 3D
 * isolate transition) feels consistent — and, since a multi-second camera
 * flight is exactly the kind of motion prefers-reduced-motion exists for,
 * snaps straight to the target instead when that's set.
 */
export function flyToEstate(map: MLMap, target: CameraTarget, durationMs = 2200) {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  map.flyTo({
    center: target.center,
    zoom: target.zoom,
    pitch: target.pitch,
    bearing: target.bearing,
    duration: reducedMotion ? 0 : durationMs,
    curve: 1.4,
    easing: easeInOutCubic,
    essential: true,
  })
}
