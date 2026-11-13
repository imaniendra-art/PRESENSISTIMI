import { AttendanceStatus, ClockOutStatus } from '@prisma/client';

/**
 * Mendeteksi nama zona waktu Indonesia berdasarkan longitude GPS
 * - Longitude < 115° E (Jawa, Sumatera, Kalbar, Kalteng): Asia/Jakarta (WIB / UTC+7)
 * - Longitude 115° - 125° E (Sulawesi, Bali, NTB, NTT, Kalsel, Kaltim, Kaltara): Asia/Makassar (WITA / UTC+8)
 * - Longitude >= 125° E (Maluku, Papua): Asia/Jayapura (WIT / UTC+9)
 */
export function getTimezoneFromCoordinates(longitude?: number | null): string {
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    return 'Asia/Makassar'; // Default kampus STIMI Makassar
  }
  if (longitude < 115.0) {
    return 'Asia/Jakarta'; // WIB (Surabaya, Jakarta, Bandung, dll)
  }
  if (longitude >= 125.0) {
    return 'Asia/Jayapura'; // WIT
  }
  return 'Asia/Makassar'; // WITA (Makassar, Bali, dll)
}

/**
 * Mengambil jam dan menit saat ini pada zona waktu tertentu (default: Asia/Makassar)
 */
export function getLocalHoursAndMinutes(
  date: Date = new Date(),
  timeZone: string = 'Asia/Makassar'
): { hours: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const hours = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minutes = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  return { hours, minutes };
}

/**
 * Menghasilkan tanggal awal hari (00:00:00.000) untuk indexing unik per hari
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Memeriksa apakah waktu saat ini masuk dalam kategori tepat waktu atau terlambat.
 * Mendukung adaptasi zona waktu lokal pegawai jika berada di luar Makassar (misal: di Surabaya / WIB).
 */
export function evaluateClockInStatus(
  currentTime: Date,
  workStart: string,
  gracePeriodMinutes: number,
  isDinasLuar: boolean,
  longitude?: number | null
): AttendanceStatus {
  if (isDinasLuar) {
    return AttendanceStatus.DINAS_LUAR;
  }

  const [startHour, startMinute] = workStart.split(':').map(Number);
  const maxOnTimeMinutes = startHour * 60 + startMinute + gracePeriodMinutes;

  // Jika pegawai berada di luar zona WITA (misal Surabaya/Jakarta di zona WIB),
  // gunakan zona waktu lokal pegawai agar jam 08:39 di Surabaya tidak dipaksa jadi 09:39 WITA.
  const userTimezone = getTimezoneFromCoordinates(longitude);
  const { hours, minutes } = getLocalHoursAndMinutes(currentTime, userTimezone);
  const currentTotalMinutes = hours * 60 + minutes;

  if (currentTotalMinutes <= maxOnTimeMinutes) {
    return AttendanceStatus.TEPAT_WAKTU;
  }

  return AttendanceStatus.TERLAMBAT;
}

/**
 * Memeriksa apakah kepulangan termasuk pulang cepat atau normal
 */
export function evaluateClockOutStatus(
  currentTime: Date,
  workEnd: string,
  isDinasLuar: boolean,
  longitude?: number | null
): ClockOutStatus {
  if (isDinasLuar) {
    return ClockOutStatus.DINAS_LUAR;
  }

  const [endHour, endMinute] = workEnd.split(':').map(Number);
  const endTotalMinutes = endHour * 60 + endMinute;

  const userTimezone = getTimezoneFromCoordinates(longitude);
  const { hours, minutes } = getLocalHoursAndMinutes(currentTime, userTimezone);
  const currentTotalMinutes = hours * 60 + minutes;

  if (currentTotalMinutes < endTotalMinutes) {
    return ClockOutStatus.PULANG_CEPAT;
  }

  return ClockOutStatus.NORMAL;
}
