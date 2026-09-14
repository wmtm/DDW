import { estateBoundary, estateBoundingBox } from './boundary'

const MASK_PADDING_DEG = 0.5

/**
 * A polygon covering a wide area around the estate with the estate boundary
 * cut out as a hole — filling it hides everything outside the property.
 */
export const inverseMaskGeoJSON: GeoJSON.Feature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [estateBoundingBox.minLng - MASK_PADDING_DEG, estateBoundingBox.minLat - MASK_PADDING_DEG],
        [estateBoundingBox.maxLng + MASK_PADDING_DEG, estateBoundingBox.minLat - MASK_PADDING_DEG],
        [estateBoundingBox.maxLng + MASK_PADDING_DEG, estateBoundingBox.maxLat + MASK_PADDING_DEG],
        [estateBoundingBox.minLng - MASK_PADDING_DEG, estateBoundingBox.maxLat + MASK_PADDING_DEG],
        [estateBoundingBox.minLng - MASK_PADDING_DEG, estateBoundingBox.minLat - MASK_PADDING_DEG],
      ],
      estateBoundary,
    ],
  },
}

export const ISOLATE_VIEW = {
  longitude: (estateBoundingBox.minLng + estateBoundingBox.maxLng) / 2,
  latitude: (estateBoundingBox.minLat + estateBoundingBox.maxLat) / 2,
  zoom: 13.6,
  pitch: 62,
  bearing: -20,
}
