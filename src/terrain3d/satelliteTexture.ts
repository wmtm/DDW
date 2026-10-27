import * as THREE from 'three'
import { MAPTILER_KEY } from '../maptiler'
import { BOUNDARY_LOCAL, SCENE_ORIGIN, TERRAIN_LNGLAT_BOUNDS } from './terrainContext'
import { fromLocalXZ } from './projection'
import type { TerrainContext } from './terrainContext'

/**
 * Builds the terrain's diffuse texture: the same MapTiler satellite tiles
 * the main MapLibre map already uses (fetched live, in the visitor's own
 * browser — this sandbox can't reach api.maptiler.com to pre-bake it, but
 * the production site reaches it fine, same as the main map does), stitched
 * for just the estate's bounding box, with a subtle baked hillshade
 * multiplied in for relief clarity and a contrast/saturation boost. A
 * second canvas carries the parcel-boundary mask used as the terrain
 * material's alpha map, so the mesh reads as cleanly clipped to the
 * property line.
 */

// At this estate's footprint, MapTiler's z17 (~143 tiles) only gets ~1.1m/px
// of real source detail — soft once the camera gets close. z18 (~500 tiles,
// ~0.56m/px) is a real sharpness jump for a one-time fetch made only when
// the 3D view is opened, not on every pan/zoom like the 2D basemap.
const MAX_TILES = 520

function lngToTileX(lng: number, z: number): number {
  return Math.floor(((lng + 180) / 360) * 2 ** z)
}
function latToTileY(lat: number, z: number): number {
  const latRad = (lat * Math.PI) / 180
  return Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * 2 ** z,
  )
}
function tileXToLng(x: number, z: number): number {
  return (x / 2 ** z) * 360 - 180
}
function tileYToLat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
}

function pickZoom(minLng: number, maxLng: number, minLat: number, maxLat: number): number {
  for (let z = 19; z >= 12; z--) {
    const x0 = lngToTileX(minLng, z)
    const x1 = lngToTileX(maxLng, z)
    const y0 = latToTileY(maxLat, z)
    const y1 = latToTileY(minLat, z)
    const count = (x1 - x0 + 1) * (y1 - y0 + 1)
    if (count <= MAX_TILES) return z
  }
  return 12
}

const TILE_LOAD_TIMEOUT_MS = 8000

/** Resolves to null (never rejects) on error or timeout, so one slow/unreachable tile can't hang the whole stitch. */
async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    const timer = setTimeout(() => resolve(null), TILE_LOAD_TIMEOUT_MS)
    img.onload = () => {
      clearTimeout(timer)
      resolve(img)
    }
    img.onerror = () => {
      clearTimeout(timer)
      resolve(null)
    }
    img.src = url
  })
}

interface StitchResult {
  canvas: HTMLCanvasElement
  /** Bounds of the stitched image in lng/lat, since tile edges don't land exactly on the requested bbox. */
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number }
}

async function stitchSatelliteTiles(
  minLng: number,
  maxLng: number,
  minLat: number,
  maxLat: number,
): Promise<StitchResult | null> {
  const TILE_SIZE = 256
  const z = pickZoom(minLng, maxLng, minLat, maxLat)
  const x0 = lngToTileX(minLng, z)
  const x1 = lngToTileX(maxLng, z)
  const y0 = latToTileY(maxLat, z)
  const y1 = latToTileY(minLat, z)
  const cols = x1 - x0 + 1
  const rows = y1 - y0 + 1
  if (cols <= 0 || rows <= 0 || cols * rows > MAX_TILES * 2) return null

  const canvas = document.createElement('canvas')
  canvas.width = cols * TILE_SIZE
  canvas.height = rows * TILE_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const loads: Promise<void>[] = []
  let loadedAny = false
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const url = `https://api.maptiler.com/tiles/satellite-v2/${z}/${tx}/${ty}?key=${MAPTILER_KEY}`
      loads.push(
        loadImage(url).then((img) => {
          if (!img) return
          loadedAny = true
          ctx.drawImage(img, (tx - x0) * TILE_SIZE, (ty - y0) * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        }),
      )
    }
  }
  await Promise.all(loads)
  if (!loadedAny) return null

  return {
    canvas,
    bounds: {
      minLng: tileXToLng(x0, z),
      maxLng: tileXToLng(x1 + 1, z),
      minLat: tileYToLat(y1 + 1, z),
      maxLat: tileYToLat(y0, z),
    },
  }
}

/** Crops a stitched tile canvas down to exactly the requested bbox, at a target output size. */
function cropToBounds(
  stitched: StitchResult,
  minLng: number,
  maxLng: number,
  minLat: number,
  maxLat: number,
  outSize: number,
): HTMLCanvasElement {
  const { canvas, bounds } = stitched
  const sx = ((minLng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * canvas.width
  const sw = ((maxLng - minLng) / (bounds.maxLng - bounds.minLng)) * canvas.width
  const sy = ((bounds.maxLat - maxLat) / (bounds.maxLat - bounds.minLat)) * canvas.height
  const sh = ((maxLat - minLat) / (bounds.maxLat - bounds.minLat)) * canvas.height

  const out = document.createElement('canvas')
  const aspect = sw / sh
  out.width = outSize
  out.height = Math.round(outSize / aspect)
  const ctx = out.getContext('2d')
  if (!ctx) return out
  ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, out.width, out.height)
  return out
}

/** Simple analytic hillshade from a 3x3 Sobel-style slope estimate, baked once at a fixed default sun angle. */
function paintHillshade(
  target: HTMLCanvasElement,
  terrain: TerrainContext,
  minLng: number,
  maxLng: number,
  minLat: number,
  maxLat: number,
) {
  const ctx = target.getContext('2d')
  if (!ctx) return
  const w = target.width
  const h = target.height
  const shadeCanvas = document.createElement('canvas')
  shadeCanvas.width = w
  shadeCanvas.height = h
  const sctx = shadeCanvas.getContext('2d')
  if (!sctx) return
  const img = sctx.createImageData(w, h)

  // Default baked sun: upper-left, matching the estateSlab.ts cutaway's LIGHT direction convention loosely.
  const lightX = -0.55
  const lightZ = -0.62
  const lightY = 0.55
  const lightLen = Math.hypot(lightX, lightY, lightZ)
  const lx = lightX / lightLen
  const ly = lightY / lightLen
  const lz = lightZ / lightLen

  const stepLng = (maxLng - minLng) / w
  const stepLat = (maxLat - minLat) / h
  // Meters per degree, local to this bbox — good enough for a small parcel.
  const mPerDegLng = 111320 * Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180))
  const mPerDegLat = 111320

  // The output texture (outSize, typically >1000px) is sampled at a far
  // finer resolution than the DEM's native ~30m grid. Estimating the slope
  // with a finite-difference offset smaller than one DEM cell just measures
  // the bilinear interpolant's own facet boundaries, not real terrain slope
  // — that aliasing is what made the baked hillshade read as a dense
  // cross-hatch of fake creases. Flooring the offset to the DEM's own pixel
  // spacing keeps the gradient estimate at the data's actual resolution.
  const demStepLng = (terrain.grid.maxLng - terrain.grid.minLng) / (terrain.grid.width - 1)
  const demStepLat = (terrain.grid.maxLat - terrain.grid.minLat) / (terrain.grid.height - 1)
  const offsetLng = Math.max(stepLng * 2, demStepLng)
  const offsetLat = Math.max(stepLat * 2, demStepLat)
  const sampleStepLngM = offsetLng * mPerDegLng
  const sampleStepLatM = offsetLat * mPerDegLat

  for (let py = 0; py < h; py++) {
    const lat = maxLat - (py / h) * (maxLat - minLat)
    for (let px = 0; px < w; px++) {
      const lng = minLng + (px / w) * (maxLng - minLng)
      const hL = terrain.heightAt(lng - offsetLng, lat)
      const hR = terrain.heightAt(lng + offsetLng, lat)
      const hD = terrain.heightAt(lng, lat - offsetLat)
      const hU = terrain.heightAt(lng, lat + offsetLat)
      const dzdx = (hR - hL) / (2 * sampleStepLngM || 1)
      const dzdz = (hD - hU) / (2 * sampleStepLatM || 1)
      let nx = -dzdx
      let nz = -dzdz
      let ny = 1
      const nLen = Math.hypot(nx, ny, nz) || 1
      nx /= nLen
      ny /= nLen
      nz /= nLen
      const intensity = Math.max(0, nx * lx + ny * ly + nz * lz)
      const idx = (py * w + px) * 4
      const v = Math.round(255 * intensity)
      img.data[idx] = v
      img.data[idx + 1] = v
      img.data[idx + 2] = v
      img.data[idx + 3] = 255
    }
  }
  sctx.putImageData(img, 0, 0)

  // Multiply blend, kept subtle so it reads as texture micro-contrast rather than a second light source.
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = 0.35
  ctx.drawImage(shadeCanvas, 0, 0)
  ctx.restore()
  ctx.globalAlpha = 1
}

/** Rasterizes the estate boundary polygon as a white-on-black mask, in the same pixel space as the diffuse texture. */
function paintBoundaryMask(size: number, minLng: number, maxLng: number, minLat: number, maxLat: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const aspectLng = maxLng - minLng
  const aspectLat = maxLat - minLat
  canvas.width = size
  canvas.height = Math.round(size * (aspectLat / aspectLng))
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  BOUNDARY_LOCAL.forEach(([x, z], i) => {
    const [lng, lat] = fromLocalXZ(SCENE_ORIGIN, x, z)
    const px = ((lng - minLng) / aspectLng) * canvas.width
    const py = ((maxLat - lat) / aspectLat) * canvas.height
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  })
  ctx.closePath()
  ctx.fill()
  return canvas
}

export interface TerrainTextures {
  map: THREE.CanvasTexture
  alphaMap: THREE.CanvasTexture
  /** lng/lat bounds the textures actually cover (slightly padded beyond the parcel for clean edges). */
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number }
}

const FALLBACK_COLOR = '#8a9a6b'

function buildFallbackTexture(size: number, bounds: TerrainTextures['bounds']): TerrainTextures {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = FALLBACK_COLOR
    ctx.fillRect(0, 0, size, size)
  }
  const map = new THREE.CanvasTexture(canvas)
  map.colorSpace = THREE.SRGBColorSpace
  const alphaMap = new THREE.CanvasTexture(paintBoundaryMask(size, bounds.minLng, bounds.maxLng, bounds.minLat, bounds.maxLat))
  return { map, alphaMap, bounds }
}

export async function buildTerrainTextures(terrain: TerrainContext, outSize = 2560): Promise<TerrainTextures> {
  const bounds = TERRAIN_LNGLAT_BOUNDS

  try {
    const stitched = await stitchSatelliteTiles(bounds.minLng, bounds.maxLng, bounds.minLat, bounds.maxLat)
    if (!stitched) return buildFallbackTexture(outSize, bounds)
    const cropped = cropToBounds(stitched, bounds.minLng, bounds.maxLng, bounds.minLat, bounds.maxLat, outSize)
    paintHillshade(cropped, terrain, bounds.minLng, bounds.maxLng, bounds.minLat, bounds.maxLat)

    const ctx = cropped.getContext('2d')
    if (ctx) {
      // Cheap contrast/saturation boost: draw through a saturate+contrast CSS filter onto a fresh canvas.
      const boosted = document.createElement('canvas')
      boosted.width = cropped.width
      boosted.height = cropped.height
      const bctx = boosted.getContext('2d')
      if (bctx) {
        bctx.filter = 'saturate(1.25) contrast(1.12) brightness(1.03)'
        bctx.drawImage(cropped, 0, 0)
        const map = new THREE.CanvasTexture(boosted)
        map.colorSpace = THREE.SRGBColorSpace
        map.anisotropy = 8
        const alphaMap = new THREE.CanvasTexture(
          paintBoundaryMask(outSize, bounds.minLng, bounds.maxLng, bounds.minLat, bounds.maxLat),
        )
        return { map, alphaMap, bounds }
      }
    }

    const map = new THREE.CanvasTexture(cropped)
    map.colorSpace = THREE.SRGBColorSpace
    const alphaMap = new THREE.CanvasTexture(
      paintBoundaryMask(outSize, bounds.minLng, bounds.maxLng, bounds.minLat, bounds.maxLat),
    )
    return { map, alphaMap, bounds }
  } catch {
    return buildFallbackTexture(outSize, bounds)
  }
}

