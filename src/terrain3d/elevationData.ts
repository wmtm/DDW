import elevationMeta from '../assets/elevation/estate_elevation.json'

/**
 * Pre-baked elevation grid for the estate, cut once from Copernicus DEM
 * GLO-30 (the best free global DEM available — see estate_elevation.json's
 * `source` field) rather than tiled live like the MapLibre basemap. The
 * parcel is small and the terrain never changes, so a single dense grid
 * fetched once at build time beats stitching an XYZ tile pyramid at runtime:
 * no seams, no re-fetching per visit, full control over quality.
 *
 * See src/assets/elevation/estate_elevation.json for the exact bounds this
 * grid covers (padded ~300m beyond the parcel boundary) and
 * scripts in the project history for how it was extracted.
 */

const BIN_URL = new URL('../assets/elevation/estate_elevation.bin', import.meta.url).href

export interface ElevationGrid {
  width: number
  height: number
  minLng: number
  maxLng: number
  minLat: number
  maxLat: number
  minElevation: number
  maxElevation: number
  /** Row-major, north-to-south (row 0 is the northernmost row), float32 meters. */
  data: Float32Array
}

/**
 * Radar DEMs like Copernicus GLO-30 carry a meter-or-two of per-pixel
 * speckle noise (sensor + canopy-height variation) that's invisible at
 * real-world scale but turns into a "crumpled paper" texture once the
 * terrain is exaggerated several times over for this fairly flat site. A
 * couple of passes of a small weighted blur removes that high-frequency
 * noise while leaving the actual hill-scale relief (which spans many grid
 * cells) intact.
 */
function smoothGrid(data: Float32Array, width: number, height: number, passes: number): Float32Array {
  let src = data
  for (let p = 0; p < passes; p++) {
    const dst = new Float32Array(src.length)
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
            sum += src[ny * width + nx] * w
            weight += w
          }
        }
        dst[y * width + x] = sum / weight
      }
    }
    src = dst
  }
  return src
}

let cachedGrid: Promise<ElevationGrid> | null = null

export function loadElevationGrid(): Promise<ElevationGrid> {
  if (!cachedGrid) {
    cachedGrid = fetch(BIN_URL)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const width = elevationMeta.width
        const height = elevationMeta.height
        const data = smoothGrid(new Float32Array(buffer), width, height, 2)
        let minElevation = Infinity
        let maxElevation = -Infinity
        for (const v of data) {
          if (v < minElevation) minElevation = v
          if (v > maxElevation) maxElevation = v
        }
        return {
          width,
          height,
          minLng: elevationMeta.minLng,
          maxLng: elevationMeta.maxLng,
          minLat: elevationMeta.minLat,
          maxLat: elevationMeta.maxLat,
          minElevation,
          maxElevation,
          data,
        }
      })
  }
  return cachedGrid
}

/** Bilinear-sampled elevation (meters) at an arbitrary lng/lat within the grid's bounds. */
export function sampleElevation(grid: ElevationGrid, lng: number, lat: number): number {
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
