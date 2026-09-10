import { destinationPoint } from './geo'
import type { Landmark } from './landmarks'

const CONE_HALF_ANGLE_DEG = 16
const CONE_MIN_LENGTH_M = 60
const CONE_MAX_LENGTH_M = 220
const CONE_LENGTH_PER_KMH = 6

export function windConeLengthMeters(windSpeedKmh: number): number {
  return Math.min(
    CONE_MAX_LENGTH_M,
    Math.max(CONE_MIN_LENGTH_M, CONE_MIN_LENGTH_M + windSpeedKmh * CONE_LENGTH_PER_KMH),
  )
}

/**
 * A translucent cone from each chute pointing downwind (the direction scent
 * travels, i.e. opposite the "wind coming from" bearing the weather API
 * reports) — a rough visual cue for which stands are currently upwind of
 * game versus likely to give the hunter's scent away.
 */
export function buildWindConeGeoJSON(
  chutes: Landmark[],
  windDirectionDeg: number,
  windSpeedKmh: number,
): GeoJSON.FeatureCollection {
  const downwindBearing = (windDirectionDeg + 180) % 360
  const length = windConeLengthMeters(windSpeedKmh)

  const features: GeoJSON.Feature[] = chutes.map((chute) => {
    const origin: [number, number] = [chute.longitude, chute.latitude]
    const left = destinationPoint(origin, downwindBearing - CONE_HALF_ANGLE_DEG, length)
    const right = destinationPoint(origin, downwindBearing + CONE_HALF_ANGLE_DEG, length)
    return {
      type: 'Feature',
      properties: { chuteId: chute.id },
      geometry: {
        type: 'Polygon',
        coordinates: [[origin, left, right, origin]],
      },
    }
  })

  return { type: 'FeatureCollection', features }
}
