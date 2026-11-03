/**
 * Local equirectangular projection for the 3D scene: lng/lat → meters on an
 * X (east) / Z (south) plane anchored at the estate's center, matching the
 * same projection style already used for area/distance math in geo.ts (just
 * expressed as X/Z instead of X/Y, since Three.js reserves Y for "up").
 */

const EARTH_RADIUS_M = 6371000

export interface LocalOrigin {
  lng: number
  lat: number
  /** cos(lat) at the origin, cached since every projected point needs it. */
  cosLat: number
}

export function createLocalOrigin(lng: number, lat: number): LocalOrigin {
  return { lng, lat, cosLat: Math.cos((lat * Math.PI) / 180) }
}

/** Projects lng/lat to local meters: +X is east, +Z is south. */
export function toLocalXZ(origin: LocalOrigin, lng: number, lat: number): [number, number] {
  const x = ((lng - origin.lng) * Math.PI) / 180 * EARTH_RADIUS_M * origin.cosLat
  const z = -(((lat - origin.lat) * Math.PI) / 180) * EARTH_RADIUS_M
  return [x, z]
}

/** Inverse of toLocalXZ — local meters back to lng/lat (for sampling the DEM/texture at a mesh vertex). */
export function fromLocalXZ(origin: LocalOrigin, x: number, z: number): [number, number] {
  const lng = origin.lng + (x / (EARTH_RADIUS_M * origin.cosLat)) * (180 / Math.PI)
  const lat = origin.lat - (z / EARTH_RADIUS_M) * (180 / Math.PI)
  return [lng, lat]
}

/** Even-odd point-in-polygon test, ring is a closed [x, z][] loop (first point may or may not repeat the last). */
export function pointInPolygon(x: number, z: number, ring: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i]
    const [xj, zj] = ring[j]
    const intersects = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi
    if (intersects) inside = !inside
  }
  return inside
}
