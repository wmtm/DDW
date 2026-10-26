import { estateBoundingBox } from './boundary'

/** Camera framing MapLibre flies to while the 3D platform view (Isolate3DView) is open or opening. */
export const ISOLATE_VIEW = {
  longitude: (estateBoundingBox.minLng + estateBoundingBox.maxLng) / 2,
  latitude: (estateBoundingBox.minLat + estateBoundingBox.maxLat) / 2,
  zoom: 13.6,
  pitch: 62,
  bearing: -20,
}
