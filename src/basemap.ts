export type BasemapStyle = 'satellite' | 'map' | 'hybrid' | 'terrain'

export const basemapOptions: { value: BasemapStyle; label: string }[] = [
  { value: 'satellite', label: 'Satellite' },
  { value: 'map', label: 'Map' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'terrain', label: 'Terrain' },
]

/** Layer ids from mapStyle.ts, grouped for per-basemap visibility toggling. */
export const landcoverLayerIds = ['landcover-wood', 'landcover-grass', 'landcover-sand', 'park']
export const waterLayerIds = ['waterway', 'water']
export const roadLayerIds = ['road-path', 'road-minor', 'road-major']
export const buildingLayerIds = ['building', 'building-3d']

export function layerVisibilityFor(basemap: BasemapStyle) {
  return {
    landcover: basemap === 'map' ? 'visible' : 'none',
    water: basemap === 'satellite' ? 'none' : 'visible',
    roads: basemap === 'map' || basemap === 'hybrid' ? 'visible' : 'none',
    buildings: basemap === 'map' || basemap === 'hybrid' ? 'visible' : 'none',
  } as const
}

/** Whether this basemap should have the satellite raster imagery layer loaded. */
export function usesSatelliteImagery(basemap: BasemapStyle): boolean {
  return basemap === 'satellite' || basemap === 'hybrid'
}
