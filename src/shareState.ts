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

export function buildShareUrl(state: ShareState): string {
  const params = new URLSearchParams()
  if (state.longitude !== undefined) params.set('lng', state.longitude.toFixed(6))
  if (state.latitude !== undefined) params.set('lat', state.latitude.toFixed(6))
  if (state.zoom !== undefined) params.set('z', state.zoom.toFixed(2))
  if (state.pitch !== undefined) params.set('p', state.pitch.toFixed(1))
  if (state.bearing !== undefined) params.set('b', state.bearing.toFixed(1))
  if (state.showOverlay !== undefined) params.set('ov', state.showOverlay ? '1' : '0')
  if (state.historicalYear !== undefined && state.historicalYear !== null) {
    params.set('hy', String(state.historicalYear))
  }
  if (state.basemap) params.set('bm', state.basemap)

  return `${window.location.origin}${window.location.pathname}?${params.toString()}`
}
