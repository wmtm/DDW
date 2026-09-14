import { estateBoundary, estateBoundingBox } from './boundary'

const MASK_PADDING_DEG = 0.5

/**
 * The estate boundary inset ~18m inward, precomputed offline (shapely,
 * `estateBoundary.buffer(-18)`, local equirectangular projection at the
 * estate's latitude). Paired with `estateBoundary` as the outer ring, it
 * forms a thin ring hugging the inside edge of the property.
 */
const wolmarCliffInsetRing: [number, number][] = [
  [57.3666083, -20.2915264],
  [57.3664111, -20.29223],
  [57.3662371, -20.2928294],
  [57.3660397, -20.2935117],
  [57.3658237, -20.2943321],
  [57.3657602, -20.2945052],
  [57.3657604, -20.2945059],
  [57.3658596, -20.2945309],
  [57.3683896, -20.2950913],
  [57.3681848, -20.2959028],
  [57.3667209, -20.295758],
  [57.3658688, -20.295741],
  [57.3655787, -20.2965055],
  [57.3654765, -20.2968297],
  [57.3655091, -20.2971462],
  [57.3655891, -20.2974675],
  [57.3657212, -20.2978199],
  [57.365817, -20.2989694],
  [57.3657963, -20.2996308],
  [57.3657557, -20.3002755],
  [57.3660103, -20.3013308],
  [57.3661446, -20.3018073],
  [57.3662956, -20.30227],
  [57.3664732, -20.3025674],
  [57.3667376, -20.3028593],
  [57.3671188, -20.3036573],
  [57.3673831, -20.3044395],
  [57.3676618, -20.3054935],
  [57.3676527, -20.3064435],
  [57.3676437, -20.3066645],
  [57.3677023, -20.3068815],
  [57.3683575, -20.3090503],
  [57.3687727, -20.310283],
  [57.3691031, -20.3114998],
  [57.3693765, -20.3126227],
  [57.3695147, -20.3129083],
  [57.3696392, -20.3131015],
  [57.3700041, -20.3133937],
  [57.3703198, -20.3135787],
  [57.3705086, -20.3135758],
  [57.371701, -20.313017],
  [57.3737053, -20.3127939],
  [57.3756514, -20.3124938],
  [57.3802217, -20.3117014],
  [57.3848141, -20.3108987],
  [57.3885547, -20.310207],
  [57.3885264, -20.3101779],
  [57.3883578, -20.3097972],
  [57.3880975, -20.3088053],
  [57.3881289, -20.3081938],
  [57.3881812, -20.3076722],
  [57.3884277, -20.3060985],
  [57.3886807, -20.3051418],
  [57.3888691, -20.3041295],
  [57.3889587, -20.3037071],
  [57.3889025, -20.303216],
  [57.3891872, -20.3022282],
  [57.3891321, -20.3018738],
  [57.3890731, -20.3003592],
  [57.3888201, -20.2989502],
  [57.3863997, -20.298482],
  [57.3867202, -20.2963093],
  [57.3850827, -20.2960218],
  [57.3853639, -20.294436],
  [57.3857513, -20.2922901],
  [57.3845293, -20.2918876],
  [57.3834638, -20.2911935],
  [57.3824833, -20.2902323],
  [57.3818952, -20.2891783],
  [57.3817128, -20.2883519],
  [57.3815261, -20.2877959],
  [57.3804899, -20.2876549],
  [57.3776009, -20.2875556],
  [57.3771895, -20.2880394],
  [57.3763396, -20.2880421],
  [57.3760723, -20.2871363],
  [57.3733296, -20.2866435],
  [57.3708211, -20.2860864],
  [57.3696763, -20.2858488],
  [57.3693733, -20.2858751],
  [57.3691529, -20.2860452],
  [57.3689054, -20.2862363],
  [57.3685986, -20.2865944],
  [57.3682649, -20.2869734],
  [57.3676557, -20.287827],
  [57.3672987, -20.2887404],
  [57.3670462, -20.2898208],
  [57.3668321, -20.2908503],
  [57.3666083, -20.2915264],
]

/**
 * A thin ring hugging the inside of the estate boundary (outer edge minus an
 * inset copy of itself) — extruding only this ring, rather than the whole
 * estate polygon, keeps the real map (satellite imagery, terrain, chutes)
 * fully visible and untouched everywhere inside it. Only the rim shows the
 * "cliff" layers, giving the impression of a floating plateau instead of a
 * solid slab burying the map under a flat colored cap.
 */
export const cliffRingGeoJSON: GeoJSON.Feature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [estateBoundary, wolmarCliffInsetRing],
  },
}

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
