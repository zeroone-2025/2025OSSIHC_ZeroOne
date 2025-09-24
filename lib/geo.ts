export function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const aTerm = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  const c = 2 * Math.atan2(Math.sqrt(aTerm), Math.sqrt(1 - aTerm))
  return R * c
}

export function etaMins(distanceM: number, walkSpeedMps = 1.2): number {
  const safeSpeed = walkSpeedMps > 0 ? walkSpeedMps : 1.2
  const minutes = distanceM / (safeSpeed * 60)
  return Math.max(1, Math.round(minutes))
}
