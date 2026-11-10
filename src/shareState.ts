import type { BasemapStyle } from './basemap'
import type { ImagerySelection } from './historicalImagery'

export interface ShareState {
  longitude?: number
  latitude?: number
  zoom?: number
  pitch?: number
  bearing?: number
  showOverlay?: boolean
  historicalYear?: ImagerySelection
  basemap?: BasemapStyle
}

const BASEMAP_VALUES: BasemapStyle[] = ['satellite', 'map', 'hybrid', 'terrain']

function parseNumber(value: string | null): number | undefined {
  if (value === null) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export function parseShareStateFromUrl(): ShareState {
  const params = new URLSearchParams(window.location.search)
  const historicalYearParam = params.get('hy')
  const basemapParam = params.get('bm')

  return {
    longitude: parseNumber(params.get('lng')),
    latitude: parseNumber(params.get('lat')),
    zoom: parseNumber(params.get('z')),
    pitch: parseNumber(params.get('p')),
    bearing: parseNumber(params.get('b')),
    showOverlay: params.has('ov') ? params.get('ov') === '1' : undefined,
    historicalYear:
      historicalYearParam === 'current'
        ? 'current'
        : historicalYearParam
          ? (parseNumber(historicalYearParam) ?? null)
          : undefined,
    basemap:
      basemapParam && BASEMAP_VALUES.includes(basemapParam as BasemapStyle)
        ? (basemapParam as BasemapStyle)
        : undefined,
  }
}
