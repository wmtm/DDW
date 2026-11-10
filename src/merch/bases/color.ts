/** Small color-math helpers so every base render can derive highlight/shadow
 * gradient stops and pick a logo variant from a single product color hex,
 * instead of hand-picking shades per color in the catalogue config. */

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return '#' + [clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, '0')).join('')
}

/** amt > 0 lightens, amt < 0 darkens, by a fraction of the way to white/black. */
export function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex)
  const target = amt > 0 ? 255 : 0
  const f = Math.abs(amt)
  return rgbToHex(r + (target - r) * f, g + (target - g) * f, b + (target - b) * f)
}

/** Relative luminance (0–1), used to decide whether a color reads as "dark" or "light". */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** Which logo ink reads correctly against this product color. */
export function logoVariantFor(hex: string): 'light' | 'dark' {
  return luminance(hex) < 0.42 ? 'light' : 'dark'
}
