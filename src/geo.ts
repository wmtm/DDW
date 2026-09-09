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
