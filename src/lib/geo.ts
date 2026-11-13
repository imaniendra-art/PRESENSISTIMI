/**
 * Menghitung jarak antara dua koordinat geografis dalam meter
 * menggunakan formula Haversine lingkaran lengkung bumi.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Pembulatan 1 desimal
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format jarak meter ke representasi manusiawi (m atau km)
 */
export function formatDistance(meters?: number | null): string {
  if (meters === null || meters === undefined || isNaN(meters)) return '-';
  if (meters >= 1000) {
    const km = meters / 1000;
    return `±${km >= 10 ? Math.round(km) : km.toFixed(1)} km`;
  }
  return `±${Math.round(meters)}m`;
}

/**
 * Memberikan keterangan nama wilayah perkiraan berdasarkan koordinat GPS
 */
export function getRegionDescription(lat?: number | null, lng?: number | null): string {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return '';
  }
  // Surabaya & Sekitarnya
  if (lat >= -7.5 && lat <= -7.0 && lng >= 112.5 && lng <= 113.0) {
    return 'Surabaya, Jatim (WIB)';
  }
  // Jabodetabek
  if (lat >= -6.4 && lat <= -6.0 && lng >= 106.6 && lng <= 107.1) {
    return 'Jabodetabek (WIB)';
  }
  // Bandung
  if (lat >= -7.0 && lat <= -6.8 && lng >= 107.5 && lng <= 107.8) {
    return 'Bandung (WIB)';
  }
  // Makassar
  if (lat >= -5.3 && lat <= -5.0 && lng >= 119.3 && lng <= 119.6) {
    return 'Makassar (WITA)';
  }
  // Berdasarkan longitude garis zona waktu Indonesia
  if (lng < 115.0) {
    return 'Zona WIB (Luar Makassar)';
  }
  if (lng >= 125.0) {
    return 'Zona WIT (Indonesia Timur)';
  }
  return 'Zona WITA';
}
