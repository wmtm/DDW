import canopyMeta from '../assets/canopy/estate_canopy.json'

/**
 * Pre-baked canopy-height grid for the estate, cut once from Meta/WRI's
 * global canopy-height map (see estate_canopy.json's `source` field) the
 * same way estate_elevation.bin was cut from the Copernicus DEM — see
 * elevationData.ts and scripts/bake-canopy.mjs. Values are height *above
 * the ground* in whole meters (0 where there's no canopy — a clearing,
 * track or firebreak), not absolute elevation.
 */

const BIN_URL = new URL('../assets/canopy/estate_canopy.bin', import.meta.url).href

export interface CanopyGrid {
  width: number
  height: number
  minLng: number
  maxLng: number
  minLat: number
  maxLat: number
  /** Row-major, north-to-south (row 0 is the northernmost row), meters above ground, one byte per sample. */
  data: Uint8Array
}

/**
 * A single light 3x3 blur pass — just enough to round off single-pixel
 * sensor speckle. Unlike the DEM's two passes (elevationData.ts), a track
 * or firebreak here can be only a few source pixels wide, so smoothing any
 * harder would blur the very clearings this data exists to show.
 */
function smoothGridLight(data: Uint8Array, width: number, height: number): Uint8Array {
  const dst = new Uint8Array(data.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0
      let weight = 0
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy
        if (ny < 0 || ny >= height) continue
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          if (nx < 0 || nx >= width) continue
          const w = dx === 0 && dy === 0 ? 4 : dx === 0 || dy === 0 ? 2 : 1
          sum += data[ny * width + nx] * w
          weight += w
        }
      }
      dst[y * width + x] = Math.round(sum / weight)
    }
  }
  return dst
}

let cachedGrid: Promise<CanopyGrid> | null = null

export function loadCanopyGrid(): Promise<CanopyGrid> {
  if (!cachedGrid) {
    cachedGrid = fetch(BIN_URL)
      .then((res) => res.arrayBuffer())
      .then((buffer) => ({
        width: canopyMeta.width,
        height: canopyMeta.height,
        minLng: canopyMeta.minLng,
        maxLng: canopyMeta.maxLng,
        minLat: canopyMeta.minLat,
        maxLat: canopyMeta.maxLat,
        data: smoothGridLight(new Uint8Array(buffer), canopyMeta.width, canopyMeta.height),
      }))
  }
  return cachedGrid
}

/** Bilinear-sampled canopy height (meters above ground) at an arbitrary lng/lat; 0 outside the grid's bounds. */
export function sampleCanopy(grid: CanopyGrid, lng: number, lat: number): number {
  if (lng < grid.minLng || lng > grid.maxLng || lat < grid.minLat || lat > grid.maxLat) return 0

  const u = ((lng - grid.minLng) / (grid.maxLng - grid.minLng)) * (grid.width - 1)
  // Row 0 is the northernmost row (max lat), so v grows southward.
  const v = ((grid.maxLat - lat) / (grid.maxLat - grid.minLat)) * (grid.height - 1)

  const u0 = Math.max(0, Math.min(grid.width - 1, Math.floor(u)))
  const v0 = Math.max(0, Math.min(grid.height - 1, Math.floor(v)))
  const u1 = Math.min(grid.width - 1, u0 + 1)
  const v1 = Math.min(grid.height - 1, v0 + 1)
  const fu = Math.max(0, Math.min(1, u - u0))
  const fv = Math.max(0, Math.min(1, v - v0))

  const at = (x: number, y: number) => grid.data[y * grid.width + x]
  const top = at(u0, v0) * (1 - fu) + at(u1, v0) * fu
  const bottom = at(u0, v1) * (1 - fu) + at(u1, v1) * fu
  return top * (1 - fv) + bottom * fv
}
