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
  /**
   * The best-fit plane through the whole DEM, evaluated at local X/Z — the
   * estate's regional tilt toward the coast, with the local bumps averaged
   * out. `heightAtLocal(x,z) - trendAtLocal(x,z)` is the local relief alone,
   * with ~zero mean: that's what the exaggeration slider should amplify,
   * not the regional slope itself (see DETREND_PLANE below).
   */
  trendAtLocal: (x: number, z: number) => number
}

/**
 * Least-squares plane z = a*x + b*z + c through every DEM sample (in local
 * scene meters), via the normal equations for that 3-parameter fit. This
 * estate's elevation grid spans real coastal relief (tens of meters of
 * overall tilt across the property, independent of the gentler local
 * bumps) — exaggerating that whole tilt the same way as the local relief
 * made the block read as warped/tipped rather than textured. Solving for
 * the plane once at load time and holding the regional tilt at a flat 1x
 * (only the residual local relief gets the exaggeration slider) keeps the
 * block looking grounded at any exaggeration setting.
 */
function fitPlane(xs: Float64Array, zs: Float64Array, ys: Float64Array): (x: number, z: number) => number {
  const n = xs.length
  let sx = 0,
    sz = 0,
    sy = 0,
    sxx = 0,
    szz = 0,
    sxz = 0,
    sxy = 0,
    szy = 0
  for (let i = 0; i < n; i++) {
    const x = xs[i],
      z = zs[i],
      y = ys[i]
    sx += x
    sz += z
    sy += y
    sxx += x * x
    szz += z * z
    sxz += x * z
    sxy += x * y
    szy += z * y
  }
  // Solve [[sxx,sxz,sx],[sxz,szz,sz],[sx,sz,n]] * [a,b,c]^T = [sxy,szy,sy]^T via Cramer's rule.
  const m = [
    [sxx, sxz, sx],
    [sxz, szz, sz],
    [sx, sz, n],
  ]
  const rhs = [sxy, szy, sy]
  const det3 = (r: number[][]) =>
    r[0][0] * (r[1][1] * r[2][2] - r[1][2] * r[2][1]) -
    r[0][1] * (r[1][0] * r[2][2] - r[1][2] * r[2][0]) +
    r[0][2] * (r[1][0] * r[2][1] - r[1][1] * r[2][0])
  const d = det3(m)
  if (Math.abs(d) < 1e-9) {
    const meanY = sy / n
    return () => meanY
  }
  const withCol = (col: number) => m.map((row, i) => row.map((v, j) => (j === col ? rhs[i] : v)))
  const a = det3(withCol(0)) / d
  const b = det3(withCol(1)) / d
  const c = det3(withCol(2)) / d
  return (x: number, z: number) => a * x + b * z + c
}

/**
 * The height actually drawn on screen: the regional plane held at 1x, plus
 * the local relief (the real height's departure from that plane) scaled by
 * the exaggeration slider. Every component that places geometry at a
 * terrain height (the mesh, the cutaway wall tops, markers) goes through
 * this one function so they can never drift out of sync with each other.
 */
export function displayHeightAtLocal(terrain: TerrainContext, x: number, z: number, exaggeration: number): number {
  const trend = terrain.trendAtLocal(x, z)
  const real = terrain.heightAtLocal(x, z)
  return trend + (real - trend) * exaggeration
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

      const n = grid.width * grid.height
      const xs = new Float64Array(n)
      const zs = new Float64Array(n)
      const ys = new Float64Array(n)
      let k = 0
      for (let row = 0; row < grid.height; row++) {
        const lat = grid.maxLat - (row / (grid.height - 1)) * (grid.maxLat - grid.minLat)
        for (let col = 0; col < grid.width; col++) {
          const lng = grid.minLng + (col / (grid.width - 1)) * (grid.maxLng - grid.minLng)
          const [x, z] = toLocalXZ(SCENE_ORIGIN, lng, lat)
          xs[k] = x
          zs[k] = z
          ys[k] = grid.data[row * grid.width + col]
          k++
        }
      }
      const trendAtLocal = fitPlane(xs, zs, ys)

      return { grid, heightAt, heightAtLocal, trendAtLocal }
    })
  }
  return cached
}
