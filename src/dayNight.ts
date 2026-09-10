import type { LightSpecification, SkySpecification } from 'maplibre-gl'

const MAURITIUS_TIME_ZONE = 'Indian/Mauritius'

function mauritiusHourFraction(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: MAURITIUS_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return hour + minute / 60
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpHexColor(from: string, to: string, t: number): string {
  const parse = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const [r1, g1, b1] = parse(from)
  const [r2, g2, b2] = parse(to)
  const r = Math.round(lerp(r1, r2, t))
  const g = Math.round(lerp(g1, g2, t))
  const b = Math.round(lerp(b1, b2, t))
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/** 0 at night, 1 at solar noon, smooth dawn/dusk transition around 6h-18h. */
export function daylightFactor(date: Date): number {
  const hourFrac = mauritiusHourFraction(date)
  return Math.max(0, Math.sin((Math.PI * (hourFrac - 6)) / 12))
}

export function computeDayNight(date: Date): { light: LightSpecification; sky: SkySpecification } {
  const t = daylightFactor(date)

  const light: LightSpecification = {
    anchor: 'viewport',
    color: lerpHexColor('#3b4a66', '#fffaf0', t),
    intensity: lerp(0.25, 0.65, t),
    position: [1.15, 200, lerp(75, 25, t)],
  }

  const sky: SkySpecification = {
    'sky-color': lerpHexColor('#0b1026', '#88c9f9', t),
    'horizon-color': lerpHexColor('#1a2340', '#d6ecff', t),
    'fog-color': lerpHexColor('#0b1026', '#ffffff', t),
    'fog-ground-blend': 0.5,
    'horizon-fog-blend': 0.5,
    'sky-horizon-blend': 0.5,
    'atmosphere-blend': lerp(0.6, 0.85, t),
  }

  return { light, sky }
}
