import type { LogoZone } from './types'
import { shade } from './bases/color'

/**
 * The actual logo compositing — this is the part of the "mockup system"
 * that makes a flat logo read as printed fabric, embroidery, a wrapped
 * print on a curved surface, or an engraved metal tag, instead of a flat
 * sticker pasted on top of a product photo.
 *
 * Draws onto a transparent canvas sized to the shared 1000×1000 stage
 * (see bases/Stage.tsx) — MockupCanvas.tsx layers that canvas over the
 * product's SVG base and lets the browser's own `mix-blend-mode` do the
 * final blend against the fabric/material color, rather than this code
 * re-rendering the base itself.
 */

const SUPERSAMPLE = 3

function tintBySourceAlpha(img: HTMLImageElement, w: number, h: number, color: string): HTMLCanvasElement {
  const off = document.createElement('canvas')
  off.width = Math.max(1, Math.ceil(w * SUPERSAMPLE))
  off.height = Math.max(1, Math.ceil(h * SUPERSAMPLE))
  const octx = off.getContext('2d')!
  octx.drawImage(img, 0, 0, off.width, off.height)
  octx.globalCompositeOperation = 'source-in'
  octx.fillStyle = color
  octx.fillRect(0, 0, off.width, off.height)
  return off
}

function addFabricGrain(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const off = document.createElement('canvas')
  off.width = Math.max(1, Math.ceil(w * 0.6))
  off.height = Math.max(1, Math.ceil(h * 0.6))
  const octx = off.getContext('2d')!
  const data = octx.createImageData(off.width, off.height)
  for (let i = 0; i < data.data.length; i += 4) {
    const n = 128 + (Math.random() - 0.5) * 70
    data.data[i] = data.data[i + 1] = data.data[i + 2] = n
    data.data[i + 3] = 255
  }
  octx.putImageData(data, 0, 0)
  ctx.save()
  ctx.globalCompositeOperation = 'source-atop'
  ctx.globalAlpha = 0.07
  ctx.drawImage(off, x, y, w, h)
  ctx.restore()
}

function withZoneTransform(ctx: CanvasRenderingContext2D, zone: LogoZone, draw: () => void) {
  ctx.save()
  ctx.translate(zone.xPct, zone.yPct)
  if (zone.rotationDeg) ctx.rotate((zone.rotationDeg * Math.PI) / 180)
  draw()
  ctx.restore()
}

function drawFlat(ctx: CanvasRenderingContext2D, img: HTMLImageElement, zone: LogoZone) {
  const w = zone.widthPct
  const h = w * (img.naturalHeight / img.naturalWidth)
  withZoneTransform(ctx, zone, () => {
    ctx.globalAlpha = zone.finish === 'print' ? 1 : 0.88
    ctx.drawImage(img, -w / 2, -h / 2, w, h)
    if (zone.finish === 'fabric') {
      ctx.globalAlpha = 1
      addFabricGrain(ctx, -w / 2, -h / 2, w, h)
    }
  })
}

/**
 * Fakes a wrap around a cylinder/sphere: slices the logo into thin
 * vertical strips and draws each one compressed horizontally, shortened
 * vertically and faded, by how far it sits from the centre column — the
 * same trick product-mockup tools use rather than a true 3D projection.
 */
function drawCurved(ctx: CanvasRenderingContext2D, img: HTMLImageElement, zone: LogoZone) {
  const w = zone.widthPct
  const h = w * (img.naturalHeight / img.naturalWidth)
  const curve = Math.min(zone.curve ?? 0.5, 0.95)
  const maxAngle = (Math.PI / 2) * curve
  const cols = 56
  withZoneTransform(ctx, zone, () => {
    for (let i = 0; i < cols; i++) {
      const t0 = (i / cols) * 2 - 1
      const t1 = ((i + 1) / cols) * 2 - 1
      const tm = (t0 + t1) / 2
      const cosA = Math.cos(tm * maxAngle)
      const sx = ((t0 + 1) / 2) * img.naturalWidth
      const sw = Math.max(1, ((t1 - t0) / 2) * img.naturalWidth)
      const destX0 = (t0 * (w / 2)) * Math.cos(t0 * maxAngle)
      const destX1 = (t1 * (w / 2)) * Math.cos(t1 * maxAngle)
      const destW = Math.max(0.5, destX1 - destX0)
      const destH = h * (0.72 + 0.28 * cosA)
      ctx.globalAlpha = 0.9 * Math.max(0.15, cosA)
      ctx.drawImage(img, sx, 0, sw, img.naturalHeight, destX0, -destH / 2, destW, destH)
    }
  })
}

/** Engraved metal: the logo's silhouette pressed into the material, not inked onto it. */
function drawEngraved(ctx: CanvasRenderingContext2D, img: HTMLImageElement, zone: LogoZone, metalColor: string) {
  const w = zone.widthPct
  const h = w * (img.naturalHeight / img.naturalWidth)
  const dark = shade(metalColor, -0.55)
  const light = shade(metalColor, 0.5)
  const groove = shade(metalColor, -0.22)
  const off = Math.max(2.5, w * 0.03)

  withZoneTransform(ctx, zone, () => {
    const shadowTile = tintBySourceAlpha(img, w, h, dark)
    ctx.globalAlpha = 0.55
    ctx.drawImage(shadowTile, -w / 2 + off, -h / 2 + off, w, h)

    const highlightTile = tintBySourceAlpha(img, w, h, light)
    ctx.globalAlpha = 0.55
    ctx.drawImage(highlightTile, -w / 2 - off, -h / 2 - off, w, h)

    const grooveTile = tintBySourceAlpha(img, w, h, groove)
    ctx.globalAlpha = 0.6
    ctx.drawImage(grooveTile, -w / 2, -h / 2, w, h)
  })
}

export function drawLogo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  zone: LogoZone,
  productColor: string,
) {
  switch (zone.finish) {
    case 'curved':
      drawCurved(ctx, img, zone)
      break
    case 'engraved':
      drawEngraved(ctx, img, zone, productColor)
      break
    case 'fabric':
    case 'print':
    default:
      drawFlat(ctx, img, zone)
  }
}

/**
 * mix-blend-mode for the canvas element itself. 'multiply' can only ever
 * darken the backdrop, which is correct for dark ink printed/embroidered
 * onto a light product — but a white logo on a black shirt would multiply
 * itself down to near-black and vanish. So: multiply only for the dark
 * logo ink; the light (white) ink paints normally, like screen-printed
 * white ink actually sitting on top of dark fabric. Engraved metal is
 * rendered in its own final color already, so it always composites
 * normally too.
 */
export function blendModeFor(zone: LogoZone, logoVariant: 'light' | 'dark'): 'multiply' | 'normal' {
  if (zone.finish === 'engraved') return 'normal'
  return logoVariant === 'dark' ? 'multiply' : 'normal'
}
