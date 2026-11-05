import { AttendanceStatus, ClockOutStatus } from '@prisma/client';

/**
 * Menghasilkan tanggal awal hari (00:00:00.000) untuk indexing unik per hari
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Memeriksa apakah waktu saat ini masuk dalam kategori tepat waktu atau terlambat
 * berdasarkan jam masuk standar (misal "08:00") dan toleransi keterlambatan (menit).
 */
export function evaluateClockInStatus(
  currentTime: Date,
  workStart: string,
  gracePeriodMinutes: number,
  isDinasLuar: boolean
): AttendanceStatus {
  if (isDinasLuar) {
    return AttendanceStatus.DINAS_LUAR;
  }

  const [startHour, startMinute] = workStart.split(':').map(Number);
  const targetTime = new Date(currentTime);
  targetTime.setHours(startHour, startMinute, 0, 0);

  // Tambahkan toleransi keterlambatan
  const maxOnTime = new Date(targetTime.getTime() + gracePeriodMinutes * 60 * 1000);

  if (currentTime.getTime() <= maxOnTime.getTime()) {
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
  isDinasLuar: boolean
): ClockOutStatus {
  if (isDinasLuar) {
    return ClockOutStatus.DINAS_LUAR;
  }

  const [endHour, endMinute] = workEnd.split(':').map(Number);
  const targetEndTime = new Date(currentTime);
  targetEndTime.setHours(endHour, endMinute, 0, 0);

  if (currentTime.getTime() < targetEndTime.getTime()) {
    return ClockOutStatus.PULANG_CEPAT;
  }

  return ClockOutStatus.NORMAL;
}
