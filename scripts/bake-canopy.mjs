// Bakes a canopy-height grid for the estate from Meta/WRI's public global
// canopy-height map (Meta Data for Good + World Resources Institute, CC BY
// 4.0 — https://registry.opendata.aws/dataforgood-fb-forests/), the same
// one-off "fetch once, commit the result" approach already used for
// estate_elevation.bin (see src/terrain3d-beta/elevationData.ts). The whole
// parcel falls in a single zoom-9 quadkey tile (301032203, computed from
// the estate's bbox in src/boundary.ts via the standard Bing/Google tile
// scheme), fetched with a windowed read rather than the full ~159MB tile.
import { writeFileSync } from 'node:fs'
import { fromUrl } from 'geotiff'
import { Agent, setGlobalDispatcher } from 'undici'

// This tile isn't a valid COG (effectively 1 row per strip — see
// facebookresearch/HighResCanopyHeight#7), so a windowed read fires one
// HTTP request per row in the window (thousands, for our bbox). Node's
// default undici pool caps concurrent connections per host low enough that
// most of those queue past their connect timeout — raise both.
setGlobalDispatcher(new Agent({ connections: 64, connect: { timeout: 30000 } }))

const TILE_URL = 'https://dataforgood-fb-data.s3.amazonaws.com/forests/v1/alsgedi_global_v6_float/chm/301032203.tif'

// Estate boundary bbox (src/boundary.ts), padded ~0.002° (~200m) on each
// side — comfortably beyond TERRAIN_LNGLAT_BOUNDS's own 0.0015° pad (see
// src/terrain3d-beta/terrainContext.ts), so the canopy grid covers
// everywhere the mesh can ever sample it.
const PAD_DEG = 0.002
const BBOX_LNGLAT = {
  minLng: 57.3653016 - PAD_DEG,
  maxLng: 57.389363 + PAD_DEG,
  minLat: -20.3137423 - PAD_DEG,
  maxLat: -20.2856844 + PAD_DEG,
}

// Downsample factor applied to the source's native ~1.19m pixels, landing
// in the "~1-2m" range the spec calls for while roughly halving the file.
const DOWNSAMPLE = 2

function lngLatToWebMercator(lng, lat) {
  const R = 6378137
  const x = (lng * Math.PI * R) / 180
  const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
  return [x, y]
}

function webMercatorToLngLat(x, y) {
  const R = 6378137
  const lng = (x / R) * (180 / Math.PI)
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI)
  return [lng, lat]
}

console.log('Opening', TILE_URL)
const tiff = await fromUrl(TILE_URL, { allowFullFile: false })
const image = await tiff.getImage()
const [imgMinX, , , imgMaxY] = image.getBoundingBox()
const [resX, resY] = image.getResolution()

const [minMercX, minMercY] = lngLatToWebMercator(BBOX_LNGLAT.minLng, BBOX_LNGLAT.minLat)
const [maxMercX, maxMercY] = lngLatToWebMercator(BBOX_LNGLAT.maxLng, BBOX_LNGLAT.maxLat)

// origin is top-left (max Y); resY is negative.
const pxLeft = Math.floor((minMercX - imgMinX) / resX)
const pxRight = Math.ceil((maxMercX - imgMinX) / resX)
const pxTop = Math.floor((maxMercY - imgMaxY) / resY)
const pxBottom = Math.ceil((minMercY - imgMaxY) / resY)
const srcWidth = pxRight - pxLeft
const srcHeight = pxBottom - pxTop
console.log('reading window', { pxLeft, pxTop, pxRight, pxBottom, srcWidth, srcHeight })

const t0 = Date.now()
const rasters = await image.readRasters({ window: [pxLeft, pxTop, pxRight, pxBottom] })
const src = rasters[0]
console.log(`read ${src.length} px in ${Date.now() - t0}ms`)

// The exact mercator bbox of the pixel window actually read (after the
// floor/ceil rounding above), converted back to lng/lat for accurate
// metadata — a fraction of a pixel off from BBOX_LNGLAT, not worth caring
// about at this resolution, but worth getting right rather than reusing
// the pre-rounding request bbox.
const [actualMinLng, actualMaxLat] = webMercatorToLngLat(imgMinX + pxLeft * resX, imgMaxY + pxTop * resY)
const [actualMaxLng, actualMinLat] = webMercatorToLngLat(imgMinX + pxRight * resX, imgMaxY + pxBottom * resY)

const dstWidth = Math.floor(srcWidth / DOWNSAMPLE)
const dstHeight = Math.floor(srcHeight / DOWNSAMPLE)
const dst = new Uint8Array(dstWidth * dstHeight)
for (let dy = 0; dy < dstHeight; dy++) {
  for (let dx = 0; dx < dstWidth; dx++) {
    let sum = 0
    let count = 0
    for (let sy = 0; sy < DOWNSAMPLE; sy++) {
      const srcY = dy * DOWNSAMPLE + sy
      for (let sx = 0; sx < DOWNSAMPLE; sx++) {
        const srcX = dx * DOWNSAMPLE + sx
        sum += src[srcY * srcWidth + srcX]
        count++
      }
    }
    dst[dy * dstWidth + dx] = Math.round(sum / count)
  }
}

let min = Infinity,
  max = -Infinity,
  sum = 0
for (const v of dst) {
  if (v < min) min = v
  if (v > max) max = v
  sum += v
}
console.log('downsampled', { dstWidth, dstHeight, min, max, mean: sum / dst.length })

const outDir = new URL('../src/assets/canopy/', import.meta.url)
writeFileSync(new URL('estate_canopy.bin', outDir), Buffer.from(dst.buffer))
writeFileSync(
  new URL('estate_canopy.json', outDir),
  JSON.stringify(
    {
      width: dstWidth,
      height: dstHeight,
      minLng: actualMinLng,
      maxLng: actualMaxLng,
      minLat: actualMinLat,
      maxLat: actualMaxLat,
      minHeight: min,
      maxHeight: max,
      source: 'Meta & World Resources Institute (WRI), 2024 — global canopy height map, CC BY 4.0 (imagery: Maxar)',
      sourceUrl: 'https://registry.opendata.aws/dataforgood-fb-forests/',
    },
    null,
    2,
  ),
)
console.log('wrote', new URL('estate_canopy.bin', outDir).pathname, new URL('estate_canopy.json', outDir).pathname)
