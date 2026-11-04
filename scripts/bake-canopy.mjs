import { fromUrl } from 'geotiff'
import { Agent, setGlobalDispatcher } from 'undici'

// This file isn't a valid COG (effectively 1 row per strip — see
// facebookresearch/HighResCanopyHeight#7), so a windowed read fires one
// HTTP request per row in the window (thousands, for our bbox). Node's
// default undici pool caps concurrent connections per host low enough that
// most of those queue past their connect timeout — raise both.
setGlobalDispatcher(new Agent({ connections: 64, connect: { timeout: 30000 } }))

const TILE_URL = 'https://dataforgood-fb-data.s3.amazonaws.com/forests/v1/alsgedi_global_v6_float/chm/301032203.tif'

// Target bbox: estate boundary (src/boundary.ts) padded ~0.002° (~200m) on
// each side — comfortably beyond TERRAIN_LNGLAT_BOUNDS's own 0.0015° pad,
// so the canopy grid covers everywhere the mesh can sample it.
const PAD_DEG = 0.002
const BBOX_LNGLAT = {
  minLng: 57.3653016 - PAD_DEG,
  maxLng: 57.389363 + PAD_DEG,
  minLat: -20.3137423 - PAD_DEG,
  maxLat: -20.2856844 + PAD_DEG,
}

function lngLatToWebMercator(lng, lat) {
  const R = 6378137
  const x = (lng * Math.PI * R) / 180
  const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
  return [x, y]
}

const t0 = Date.now()
const tiff = await fromUrl(TILE_URL, { allowFullFile: false })
const image = await tiff.getImage()
const [imgMinX, imgMinY, imgMaxX, imgMaxY] = image.getBoundingBox()
const [resX, resY] = image.getResolution()
const width = image.getWidth()
const height = image.getHeight()
console.log(`opened in ${Date.now() - t0}ms`, { imgMinX, imgMinY, imgMaxX, imgMaxY, resX, resY, width, height })

const [minMercX, minMercY] = lngLatToWebMercator(BBOX_LNGLAT.minLng, BBOX_LNGLAT.minLat)
const [maxMercX, maxMercY] = lngLatToWebMercator(BBOX_LNGLAT.maxLng, BBOX_LNGLAT.maxLat)
console.log('target mercator bbox', { minMercX, minMercY, maxMercX, maxMercY })

// origin is top-left (max Y); resY is negative.
const pxLeft = Math.floor((minMercX - imgMinX) / resX)
const pxRight = Math.ceil((maxMercX - imgMinX) / resX)
const pxTop = Math.floor((maxMercY - imgMaxY) / resY)
const pxBottom = Math.ceil((minMercY - imgMaxY) / resY)
console.log('pixel window', { pxLeft, pxTop, pxRight, pxBottom, w: pxRight - pxLeft, h: pxBottom - pxTop })

const t1 = Date.now()
const rasters = await image.readRasters({ window: [pxLeft, pxTop, pxRight, pxBottom] })
console.log(`read in ${Date.now() - t1}ms`, 'rasters', rasters.length, rasters[0].constructor.name, rasters[0].length)
const data = rasters[0]
let min = Infinity,
  max = -Infinity,
  sum = 0
for (const v of data) {
  if (v < min) min = v
  if (v > max) max = v
  sum += v
}
console.log('stats', { min, max, mean: sum / data.length })
