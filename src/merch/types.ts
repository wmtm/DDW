/**
 * Shared types for the merch catalogue (src/merch/) and the product
 * config in products.ts. One file so the config, the base-product
 * renderers (bases/) and the compositing engine (mockup.ts) all agree on
 * the same shapes.
 */

export type Category = 'chasse' | 'vetements' | 'accessoires' | 'enfants' | 'animaux'

/** Which base silhouette renders this product — see bases/index.tsx. */
export type BaseKind =
  | 'tshirt'
  | 'polo'
  | 'apron'
  | 'cap'
  | 'mug'
  | 'bottle'
  | 'golfBalls'
  | 'frisbee'
  | 'kidsBottle'
  | 'kidsCup'
  | 'plushDeer'
  | 'petTag'
  | 'bandana'
  | 'leash'
  | 'notebook'

/**
 * How the logo is applied to the surface — drives which compositing mode
 * mockup.ts uses: a soft multiply/texture blend for cloth, a cylindrical
 * warp for round objects, or an engraved bevel for metal.
 */
export type Finish = 'fabric' | 'print' | 'curved' | 'engraved'

/** Which logo artwork to use — see src/assets/merch. */
export type LogoVariant = 'crest' | 'pocket'

/**
 * Where the logo sits on the product, in a normalized 0–1000 square stage
 * (every base render shares that viewBox so a zone means the same thing
 * regardless of product). widthPct is the logo's width as a fraction of
 * the stage; height follows from the artwork's own aspect ratio.
 */
export interface LogoZone {
  logo: LogoVariant
  finish: Finish
  xPct: number
  yPct: number
  widthPct: number
  rotationDeg?: number
  /** 0 = flat, 1 = full wrap — only meaningful for finish: 'curved'. */
  curve?: number
}

export interface ColorOption {
  id: string
  label: string
  hex: string
}

export interface Product {
  id: string
  category: Category
  name: string
  description: string
  base: BaseKind
  colors: ColorOption[]
  sizes?: string[]
  logoZone: LogoZone
  /** True for the handful of items featured in the hero banner. */
  featured?: boolean
}

export const CATEGORY_LABELS: Record<Category, string> = {
  chasse: 'Saison de chasse',
  vetements: 'Vêtements',
  accessoires: 'Accessoires',
  enfants: 'Coin des enfants',
  animaux: 'Coin des animaux',
}
