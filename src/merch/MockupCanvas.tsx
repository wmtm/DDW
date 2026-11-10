import { useEffect, useId, useRef } from 'react'
import ProductBase, { logoVariantFor } from './bases'
import { drawLogo, blendModeFor } from './mockup'
import type { Product } from './types'
import logoCrestLight from '../assets/merch/logo-crest-light.png'
import logoCrestDark from '../assets/merch/logo-crest-dark.png'
import logoPocketLight from '../assets/merch/logo-pocket-light.png'
import logoPocketDark from '../assets/merch/logo-pocket-dark.png'

const LOGO_SOURCES = {
  crest: { light: logoCrestLight, dark: logoCrestDark },
  pocket: { light: logoPocketLight, dark: logoPocketDark },
}

const imageCache = new Map<string, HTMLImageElement>()
function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src)
  if (cached) return Promise.resolve(cached)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.set(src, img)
      resolve(img)
    }
    img.onerror = reject
    img.src = src
  })
}

const STAGE_SIZE = 1200

interface Props {
  product: Product
  colorId: string
  className?: string
}

/**
 * One product mockup: the SVG base (bases/) underneath, a canvas with the
 * logo composited on top (mockup.ts) using mix-blend-mode so the browser
 * does the final blend against the base's own colour. Re-draws whenever
 * the product or chosen colour changes — colour changes also flip
 * between the light/dark logo ink automatically (logoVariantFor).
 */
export default function MockupCanvas({ product, colorId, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageId = useId()
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0]
  const variant = logoVariantFor(color.hex)

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const src = LOGO_SOURCES[product.logoZone.logo][variant]

    loadImage(src).then((img) => {
      if (cancelled) return
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Drawing commands (mockup.ts) work in the same 0–1000 unit square as
      // the SVG stage below; scale up to the canvas's actual pixel size.
      const scale = canvas.width / 1000
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      drawLogo(ctx, img, product.logoZone, color.hex)
    })

    return () => {
      cancelled = true
    }
  }, [product, color.hex, variant])

  return (
    <div className={`merch-mockup-stage ${className ?? ''}`}>
      <ProductBase base={product.base} color={color.hex} stageId={stageId} />
      <canvas
        ref={canvasRef}
        width={STAGE_SIZE}
        height={STAGE_SIZE}
        className="merch-mockup-canvas"
        style={{ mixBlendMode: blendModeFor(product.logoZone, variant) }}
      />
    </div>
  )
}
