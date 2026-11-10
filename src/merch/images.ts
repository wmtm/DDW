import manifest from './imageManifest.generated.json'

/** One photo, at both sizes the build pipeline generates — see scripts/build-merch-images.mjs. */
export interface MerchImage {
  view: 'face' | 'dos' | 'detail'
  transparent: boolean
  thumb: { src: string; w: number; h: number }
  full: { src: string; w: number; h: number }
}

type Manifest = Record<string, Record<string, MerchImage[]>>

const MANIFEST = manifest as Manifest

function withBase(src: string): string {
  return `${import.meta.env.BASE_URL}${src}`
}

function resolveUrls(images: MerchImage[]): MerchImage[] {
  return images.map((img) => ({
    ...img,
    thumb: { ...img.thumb, src: withBase(img.thumb.src) },
    full: { ...img.full, src: withBase(img.full.src) },
  }))
}

/** Every colour this product has at least one real photo for, in product.colors order is left to the caller. */
export function availableColorIds(productId: string): string[] {
  return Object.keys(MANIFEST[productId] ?? {})
}

export function hasAnyImages(productId: string): boolean {
  return availableColorIds(productId).length > 0
}

/** The views (face/dos/detail) available for this product + colour, with URLs resolved against the site's base path. */
export function imagesFor(productId: string, colorId: string): MerchImage[] {
  const images = MANIFEST[productId]?.[colorId]
  return images ? resolveUrls(images) : []
}
