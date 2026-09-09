/** Converts a degrees/minutes/seconds coordinate (as read off a GPS device) to decimal degrees. */
export function dmsToDecimal(
  degrees: number,
  minutes: number,
  seconds: number,
  hemisphere: 'N' | 'S' | 'E' | 'W',
): number {
  const sign = hemisphere === 'S' || hemisphere === 'W' ? -1 : 1
  return sign * (degrees + minutes / 60 + seconds / 3600)
}

export function haversineDistanceMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const [lon1, lat1] = a
  const [lon2, lat2] = b
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** Total length of a multi-point path (sum of consecutive segment distances). */
export function pathLengthMeters(points: [number, number][]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += haversineDistanceMeters(points[i - 1], points[i])
  }
  return total
}

/**
 * Area enclosed by a closed polygon ring, via the shoelace formula on an
 * equirectangular projection local to the ring — accurate enough for an
 * estate-sized area (not meant for large/global polygons).
 */
export function polygonAreaSquareMeters(ring: [number, number][]): number {
  if (ring.length < 3) return 0
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const lat0 = toRad(ring[0][1])
  const project = ([lon, lat]: [number, number]): [number, number] => [
    toRad(lon) * Math.cos(lat0) * R,
    toRad(lat) * R,
  ]
  const projected = ring.map(project)
  let sum = 0
  for (let i = 0; i < projected.length; i++) {
    const [x1, y1] = projected[i]
    const [x2, y2] = projected[(i + 1) % projected.length]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum) / 2
}
