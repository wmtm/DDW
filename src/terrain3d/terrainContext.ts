import { estateBoundary, estateBoundingBox } from '../boundary'
import { createLocalOrigin, toLocalXZ, type LocalOrigin } from './projection'
import { loadElevationGrid, sampleElevation, type ElevationGrid } from './elevationData'

/** Same center point isolateMode.ts already uses for the MapLibre isolate-view camera. */
export const SCENE_ORIGIN: LocalOrigin = createLocalOrigin(
  (estateBoundingBox.minLng + estateBoundingBox.maxLng) / 2,
  (estateBoundingBox.minLat + estateBoundingBox.maxLat) / 2,
)

/** The estate boundary ring (closed, first point repeats the last) in local X/Z meters. */
export const BOUNDARY_LOCAL: [number, number][] = estateBoundary.map(([lng, lat]) =>
  toLocalXZ(SCENE_ORIGIN, lng, lat),
)

export const BOUNDARY_LOCAL_BOUNDS = BOUNDARY_LOCAL.reduce(
  (acc, [x, z]) => ({
    minX: Math.min(acc.minX, x),
    maxX: Math.max(acc.maxX, x),
    minZ: Math.min(acc.minZ, z),
    maxZ: Math.max(acc.maxZ, z),
  }),
  { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity },
)

const BOUNDARY_LNGLAT_BOUNDS = estateBoundary.reduce(
  (acc, [lng, lat]) => ({
    minLng: Math.min(acc.minLng, lng),
    maxLng: Math.max(acc.maxLng, lng),
    minLat: Math.min(acc.minLat, lat),
    maxLat: Math.max(acc.maxLat, lat),
  }),
  { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity },
)

/** Degrees of padding beyond the boundary bbox the terrain mesh/texture both extend to, for a clean edge to clip against. */
export const TEXTURE_BBOX_PAD_DEG = 0.0015

/** The lng/lat rectangle the terrain mesh geometry and its diffuse/alpha textures both cover — kept in one place so they can't drift apart. */
export const TERRAIN_LNGLAT_BOUNDS = {
  minLng: BOUNDARY_LNGLAT_BOUNDS.minLng - TEXTURE_BBOX_PAD_DEG,
  maxLng: BOUNDARY_LNGLAT_BOUNDS.maxLng + TEXTURE_BBOX_PAD_DEG,
  minLat: BOUNDARY_LNGLAT_BOUNDS.minLat - TEXTURE_BBOX_PAD_DEG,
  maxLat: BOUNDARY_LNGLAT_BOUNDS.maxLat + TEXTURE_BBOX_PAD_DEG,
}

export interface TerrainContext {
  grid: ElevationGrid
  /** Elevation in meters (unexaggerated) at a given lng/lat. */
  heightAt: (lng: number, lat: number) => number
  /** Elevation in meters (unexaggerated) at local scene X/Z meters. */
  heightAtLocal: (x: number, z: number) => number
}

let cached: Promise<TerrainContext> | null = null

export function loadTerrainContext(): Promise<TerrainContext> {
  if (!cached) {
    cached = loadElevationGrid().then((grid) => {
      const heightAt = (lng: number, lat: number) => sampleElevation(grid, lng, lat)
      const heightAtLocal = (x: number, z: number) => {
        // Inverse of toLocalXZ, inlined to avoid a function-call round trip
        // for every one of tens of thousands of mesh vertices.
        const lng = SCENE_ORIGIN.lng + (x / (6371000 * SCENE_ORIGIN.cosLat)) * (180 / Math.PI)
        const lat = SCENE_ORIGIN.lat - (z / 6371000) * (180 / Math.PI)
        return sampleElevation(grid, lng, lat)
      }
      return { grid, heightAt, heightAtLocal }
    })
  }
  return cached
}
