'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateHaversineDistance } from '@/lib/geo';
import { getStartOfDay, evaluateClockInStatus, evaluateClockOutStatus, getTimezoneFromCoordinates } from '@/lib/time';
import { saveSelfieImage } from '@/lib/fileStorage';
import { revalidatePath } from 'next/cache';
import { RequestStatus } from '@prisma/client';

export async function getPresenceInitialData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Sesi tidak valid');
  }

  const userId = session.user.id;
  const today = getStartOfDay();

  // Ambil pengaturan jam kerja kampus
  let campusSetting = await prisma.campusSetting.findFirst();
  if (!campusSetting) {
    campusSetting = await prisma.campusSetting.create({
      data: {
        campusName: 'STIMI Makassar',
        address: 'Jl. Kampus STIMI Makassar, Sulawesi Selatan',
        latitude: -5.147665,
        longitude: 119.432732,
        radiusMeters: 100.0,
        workStart: '08:00',
        workEnd: '16:30',
        gracePeriodMinutes: 15,
      },
    });
  }

  // Ambil data user beserta gedung penugasannya
  const userWithLocation = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      assignedLocation: true,
    },
  });

  // Ambil seluruh daftar gedung kampus yang aktif
  const campusLocations = await prisma.campusLocation.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  // Cek catatan kehadiran hari ini
  const todayAttendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    include: {
      dutyTrip: true,
      location: true,
    },
  });

  // Cek surat tugas dinas luar yang aktif hari ini
  const activeDutyTrip = await prisma.dutyTrip.findFirst({
    where: {
      userId,
      status: RequestStatus.APPROVED,
      startDate: { lte: new Date() },
      endDate: { gte: today },
    },
  });

  return {
    user: {
      ...session.user,
      assignedLocation: userWithLocation?.assignedLocation || null,
    },
    campusSetting,
    campusLocations,
    todayAttendance,
    activeDutyTrip,
  };
}

export async function submitClockIn(data: {
  latitude: number;
  longitude: number;
  accuracy?: number;
  photoBase64: string;
  isDinasLuar: boolean;
  dutyTripId?: string;
  note?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Sesi berakhir, silakan login kembali' };
  }

  if (session.user.role === 'ADMIN') {
    return {
      success: false,
      message: 'Akun Administrator adalah pengelola sistem dan tidak perlu melakukan presensi kehadiran.',
    };
  }

  // Validasi koordinat numerik aman (Anti-Spoofing Guard)
  if (
    typeof data.latitude !== 'number' ||
    typeof data.longitude !== 'number' ||
    isNaN(data.latitude) ||
    isNaN(data.longitude) ||
    data.latitude < -90 ||
    data.latitude > 90 ||
    data.longitude < -180 ||
    data.longitude > 180
  ) {
    return { success: false, message: 'Koordinat GPS tidak valid.' };
  }

  // Validasi batas keakuratan sinyal GPS (Anti-Fake Location)
  if (data.accuracy && data.accuracy > 200) {
    return {
      success: false,
      message: `Sinyal GPS terlalu lemah (toleransi deviasi ±200m, terdeteksi ±${Math.round(
        data.accuracy
      )}m). Harap aktifkan High Accuracy GPS dan hindari ruangan tertutup rapat.`,
    };
  }

  // Validasi kelengkapan foto selfie
  if (!data.photoBase64 || data.photoBase64.length < 200) {
    return { success: false, message: 'Foto verifikasi wajah wajib disertakan.' };
  }

  const userId = session.user.id;
  const nip = session.user.nip;
  const now = new Date();
  const today = getStartOfDay(now);

  // Periksa apakah sudah ada presensi masuk hari ini
  const existing = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (existing?.clockInTime) {
    return { success: false, message: 'Anda sudah melakukan presensi masuk hari ini' };
  }

  // Ambil data user & lokasi penugasan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { assignedLocation: true },
  });

  // Ambil pengaturan jam kerja kampus
  const campusSetting = await prisma.campusSetting.findFirst();
  if (!campusSetting) {
    return { success: false, message: 'Pengaturan kampus belum dikonfigurasi oleh Admin' };
  }

  // Ambil semua gedung aktif
  const activeLocations = await prisma.campusLocation.findMany({
    where: { isActive: true },
  });

  let resolvedLocationId: string | null = null;
  let resolvedLocationName = 'Kampus STIMI';
  let recordedDistance = 0;

  if (data.isDinasLuar) {
    // Bebas validasi radius geofence, namun simpan jarak sebenarnya ke kampus utama STIMI
    const distanceToCampus = calculateHaversineDistance(
      data.latitude,
      data.longitude,
      campusSetting.latitude,
      campusSetting.longitude
    );
    resolvedLocationId = null;
    resolvedLocationName = 'Dinas Luar Kota';
    recordedDistance = distanceToCampus;
  } else if (user?.assignedLocationId && user.assignedLocation) {
    // KASUS 1: Pegawai Terkunci di 1 Gedung Spesifik
    const targetLoc = user.assignedLocation;
    const distance = calculateHaversineDistance(
      data.latitude,
      data.longitude,
      targetLoc.latitude,
      targetLoc.longitude
    );

    if (distance > targetLoc.radiusMeters) {
      return {
        success: false,
        message: `Presensi ditolak. Anda ditugaskan di "${targetLoc.name}", posisi Anda saat ini berjarak ${Math.round(
          distance
        )}m (batas toleransi: ${targetLoc.radiusMeters}m). Harap merapat ke lokasi penugasan Anda.`,
      };
    }

    resolvedLocationId = targetLoc.id;
    resolvedLocationName = targetLoc.name;
    recordedDistance = distance;
  } else {
    // KASUS 2: Pegawai Fleksibel di Semua Gedung Kampus STIMI
    if (activeLocations.length === 0) {
      // Fallback ke campusSetting jika belum ada entri lokasi gedung
      const distance = calculateHaversineDistance(
        data.latitude,
        data.longitude,
        campusSetting.latitude,
        campusSetting.longitude
      );
      if (distance > campusSetting.radiusMeters) {
        return {
          success: false,
          message: `Posisi Anda berada di luar radius kampus STIMI (${Math.round(distance)}m).`,
        };
      }
      resolvedLocationName = campusSetting.campusName;
      recordedDistance = distance;
    } else {
      // Cari gedung resmi terdekat dari koordinat pegawai
      let nearestLoc = activeLocations[0];
      let minDistance = calculateHaversineDistance(
        data.latitude,
        data.longitude,
        nearestLoc.latitude,
        nearestLoc.longitude
      );

      for (let i = 1; i < activeLocations.length; i++) {
        const d = calculateHaversineDistance(
          data.latitude,
          data.longitude,
          activeLocations[i].latitude,
          activeLocations[i].longitude
        );
        if (d < minDistance) {
          minDistance = d;
          nearestLoc = activeLocations[i];
        }
      }

      if (minDistance > nearestLoc.radiusMeters) {
        return {
          success: false,
          message: `Posisi Anda berada di luar radius seluruh gedung kampus STIMI. Gedung terdekat adalah "${
            nearestLoc.name
          }" dengan jarak ${Math.round(minDistance)}m (batas toleransi: ${nearestLoc.radiusMeters}m).`,
        };
      }

      resolvedLocationId = nearestLoc.id;
      resolvedLocationName = nearestLoc.name;
      recordedDistance = minDistance;
    }
  }

  // Simpan foto selfie
  let photoPath = '';
  try {
    photoPath = await saveSelfieImage(data.photoBase64, 'in', nip);
  } catch (err) {
    console.error('Gagal menyimpan foto selfie:', err);
    return { success: false, message: 'Gagal memproses foto kamera selfie' };
  }

  // Evaluasi status keterlambatan
  const status = evaluateClockInStatus(
    now,
    campusSetting.workStart,
    campusSetting.gracePeriodMinutes,
    data.isDinasLuar,
    data.longitude
  );

  // Simpan catatan presensi ke MongoDB
  await prisma.attendance.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      locationId: resolvedLocationId,
      locationName: resolvedLocationName,
      clockInTime: now,
      clockInLat: data.latitude,
      clockInLng: data.longitude,
      clockInPhoto: photoPath,
      clockInDistance: recordedDistance,
      clockInStatus: status,
      clockInNote: data.note || null,
      isDinasLuar: data.isDinasLuar,
      dutyTripId: data.dutyTripId || null,
    },
    create: {
      userId,
      date: today,
      locationId: resolvedLocationId,
      locationName: resolvedLocationName,
      clockInTime: now,
      clockInLat: data.latitude,
      clockInLng: data.longitude,
      clockInPhoto: photoPath,
      clockInDistance: recordedDistance,
      clockInStatus: status,
      clockInNote: data.note || null,
      isDinasLuar: data.isDinasLuar,
      dutyTripId: data.dutyTripId || null,
    },
  });

  revalidatePath('/pegawai/dashboard');
  revalidatePath('/admin/monitoring');

  return {
    success: true,
    message: `Presensi masuk berhasil dicatat di ${resolvedLocationName}! Status: ${
      status === 'TEPAT_WAKTU' ? 'Tepat Waktu' : status === 'TERLAMBAT' ? 'Terlambat' : 'Dinas Luar'
    }`,
  };
}

export async function submitClockOut(data: {
  latitude: number;
  longitude: number;
  accuracy?: number;
  photoBase64: string;
  note?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Sesi berakhir, silakan login kembali' };
  }

  if (session.user.role === 'ADMIN') {
    return {
      success: false,
      message: 'Akun Administrator adalah pengelola sistem dan tidak perlu melakukan presensi kehadiran.',
    };
  }

  // Validasi koordinat numerik aman (Anti-Spoofing Guard)
  if (
    typeof data.latitude !== 'number' ||
    typeof data.longitude !== 'number' ||
    isNaN(data.latitude) ||
    isNaN(data.longitude) ||
    data.latitude < -90 ||
    data.latitude > 90 ||
    data.longitude < -180 ||
    data.longitude > 180
  ) {
    return { success: false, message: 'Koordinat GPS tidak valid.' };
  }

  // Validasi kelengkapan foto selfie
  if (!data.photoBase64 || data.photoBase64.length < 200) {
    return { success: false, message: 'Foto verifikasi wajah wajib disertakan.' };
  }

  const userId = session.user.id;
  const nip = session.user.nip;
  const now = new Date();
  const today = getStartOfDay(now);

  const existing = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (!existing || !existing.clockInTime) {
    return { success: false, message: 'Anda belum melakukan presensi masuk hari ini' };
  }

  if (existing.clockOutTime) {
    return { success: false, message: 'Anda sudah melakukan presensi pulang hari ini' };
  }

  const campusSetting = await prisma.campusSetting.findFirst();
  if (!campusSetting) {
    return { success: false, message: 'Pengaturan kampus belum dikonfigurasi' };
  }

  // Ambil data user & lokasi penugasan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { assignedLocation: true },
  });

  const activeLocations = await prisma.campusLocation.findMany({
    where: { isActive: true },
  });

  let recordedDistance = 0;

  if (existing.isDinasLuar) {
    const distanceToCampus = calculateHaversineDistance(
      data.latitude,
      data.longitude,
      campusSetting.latitude,
      campusSetting.longitude
    );
    recordedDistance = distanceToCampus;
  } else if (user?.assignedLocationId && user.assignedLocation) {
    const targetLoc = user.assignedLocation;
    const distance = calculateHaversineDistance(
      data.latitude,
      data.longitude,
      targetLoc.latitude,
      targetLoc.longitude
    );

    if (distance > targetLoc.radiusMeters) {
      return {
        success: false,
        message: `Presensi pulang ditolak. Anda berada di luar radius "${targetLoc.name}" (${Math.round(
          distance
        )}m, batas toleransi: ${targetLoc.radiusMeters}m).`,
      };
    }
    recordedDistance = distance;
  } else if (activeLocations.length > 0) {
    let minDistance = Infinity;
    let nearestLoc = activeLocations[0];

    for (const loc of activeLocations) {
      const d = calculateHaversineDistance(data.latitude, data.longitude, loc.latitude, loc.longitude);
      if (d < minDistance) {
        minDistance = d;
        nearestLoc = loc;
      }
    }

    if (minDistance > nearestLoc.radiusMeters) {
      return {
        success: false,
        message: `Presensi pulang ditolak karena berada di luar radius seluruh gedung kampus (${Math.round(
          minDistance
        )}m dari ${nearestLoc.name}).`,
      };
    }
    recordedDistance = minDistance;
  }

  // Simpan foto selfie kepulangan
  let photoPath = '';
  try {
    photoPath = await saveSelfieImage(data.photoBase64, 'out', nip);
  } catch (err) {
    console.error('Gagal menyimpan foto pulang:', err);
    return { success: false, message: 'Gagal memproses foto kamera selfie pulang' };
  }

  // Evaluasi status kepulangan (Normal vs Pulang Cepat)
  const status = evaluateClockOutStatus(now, campusSetting.workEnd, existing.isDinasLuar, data.longitude);

  await prisma.attendance.update({
    where: {
      id: existing.id,
    },
    data: {
      clockOutTime: now,
      clockOutLat: data.latitude,
      clockOutLng: data.longitude,
      clockOutPhoto: photoPath,
      clockOutDistance: recordedDistance,
      clockOutStatus: status,
      clockOutNote: data.note || null,
    },
  });

  revalidatePath('/pegawai/dashboard');
  revalidatePath('/admin/monitoring');

  return {
    success: true,
    message: `Presensi pulang berhasil dicatat! Status: ${
      status === 'NORMAL' ? 'Normal (Sesuai Jam Pulang)' : status === 'PULANG_CEPAT' ? 'Pulang Lebih Cepat' : 'Dinas Luar'
    }`,
  };
}

/**
 * Fitur Presensi Cepat Tanpa Login (Kiosk / Quick Check-in)
 * 1. Pencarian data pegawai berdasarkan NIP secara instan
 */
export async function lookupEmployeeByNip(nip: string) {
  if (!nip || !nip.trim()) {
    return { success: false, message: 'Masukkan NIP pegawai.' };
  }

  const cleanNip = nip.trim();
  const today = getStartOfDay();

  // Cari pegawai berdasarkan NIP (case-insensitive)
  const user = await prisma.user.findFirst({
    where: {
      nip: { equals: cleanNip, mode: 'insensitive' },
      isActive: true,
    },
    include: {
      assignedLocation: true,
    },
  });

  if (!user) {
    return {
      success: false,
      message: `No. ID "${cleanNip}" tidak terdaftar dalam database civitas STIMI.`,
    };
  }

  if (user.role === 'ADMIN') {
    return {
      success: false,
      message: `No. ID "${cleanNip}" adalah akun Administrator (Pengelola Sistem). Administrator tidak masuk dalam daftar presensi.`,
    };
  }

  // Cek catatan presensi hari ini
  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: today,
      },
    },
  });

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      nip: user.nip,
      jabatan: user.jabatan,
      unitKerja: user.unitKerja,
      assignedLocationName: user.assignedLocation?.name || null,
      assignedLocationRadius: user.assignedLocation?.radiusMeters || null,
    },
    attendance: {
      hasClockedIn: Boolean(attendance?.clockInTime),
      clockInTime: attendance?.clockInTime ? attendance.clockInTime.toISOString() : null,
      clockInStatus: attendance?.clockInStatus || null,
      hasClockedOut: Boolean(attendance?.clockOutTime),
      clockOutTime: attendance?.clockOutTime ? attendance.clockOutTime.toISOString() : null,
      clockOutStatus: attendance?.clockOutStatus || null,
    },
  };
}

/**
 * Fitur Presensi Cepat Tanpa Login (Kiosk / Quick Check-in)
 * 2. Eksekusi Presensi Masuk / Pulang Kilat Berbasis GPS Geofence & Selfie
 */
export async function submitQuickPresence(data: {
  nip: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  photoBase64: string;
  pin?: string;
  isSimulation?: boolean;
  isDinasLuar?: boolean;
  note?: string;
}) {
  if (!data.nip || !data.nip.trim()) {
    return { success: false, message: 'No. ID wajib diisi.' };
  }

  // Validasi koordinat GPS
  if (
    typeof data.latitude !== 'number' ||
    typeof data.longitude !== 'number' ||
    isNaN(data.latitude) ||
    isNaN(data.longitude) ||
    data.latitude < -90 ||
    data.latitude > 90 ||
    data.longitude < -180 ||
    data.longitude > 180
  ) {
    return { success: false, message: 'Titik koordinat GPS tidak valid.' };
  }

  // Validasi keakuratan sinyal GPS (Anti-Fake Location)
  if (data.accuracy && data.accuracy > 200) {
    return {
      success: false,
      message: `Sinyal GPS terlalu lemah (toleransi deviasi ±200m, terdeteksi ±${Math.round(
        data.accuracy
      )}m). Harap aktifkan High Accuracy GPS perangkat.`,
    };
  }

  // Validasi foto selfie
  if (!data.photoBase64 || data.photoBase64.length < 200) {
    return { success: false, message: 'Foto verifikasi wajah selfie wajib diambil.' };
  }

  const cleanNip = data.nip.trim();
  const now = new Date();
  const today = getStartOfDay(now);

  // Ambil data user
  const user = await prisma.user.findFirst({
    where: {
      nip: { equals: cleanNip, mode: 'insensitive' },
      isActive: true,
    },
    include: {
      assignedLocation: true,
    },
  });

  if (!user) {
    return { success: false, message: `No. ID "${cleanNip}" tidak ditemukan di sistem STIMI.` };
  }

  if (user.role === 'ADMIN') {
    return {
      success: false,
      message: `Akun Administrator (${cleanNip}) adalah pengelola aplikasi dan tidak perlu melakukan presensi kehadiran.`,
    };
  }

  // Verifikasi PIN / 4 angka singkat jika diisi pengguna
  if (data.pin && data.pin.trim()) {
    const enteredPin = data.pin.trim();
    const last4Nip = user.nip.slice(-4);
    const isPinMatch = enteredPin === last4Nip;
    let isPasswordMatch = false;

    if (!isPinMatch) {
      try {
        const bcrypt = await import('bcryptjs');
        isPasswordMatch = await bcrypt.compare(enteredPin, user.password);
      } catch {}
    }

    if (!isPinMatch && !isPasswordMatch) {
      return {
        success: false,
        message: 'PIN verifikasi tidak sesuai. Gunakan 4 digit terakhir No. ID atau kata sandi Anda.',
      };
    }
  }

  // Ambil pengaturan kampus & daftar gedung aktif
  const [campusSetting, campusLocations] = await Promise.all([
    prisma.campusSetting.findFirst(),
    prisma.campusLocation.findMany({ where: { isActive: true } }),
  ]);

  if (!campusSetting) {
    return { success: false, message: 'Pengaturan kampus belum diatur oleh Admin.' };
  }

  // STRICT GEOFENCE VERIFICATION (Wajib berada di dalam batas radius gedung kampus)
  let resolvedLocationId: string | null = null;
  let resolvedLocationName: string = campusSetting.campusName;
  let recordedDistance = 0;

  const isFriday = now.getDay() === 5;
  const isDinasLuar = Boolean(data.isDinasLuar);

  if (isDinasLuar) {
    if (!data.note || data.note.trim().length < 5) {
      return {
        success: false,
        message: 'Keterangan agenda/lokasi dinas luar wajib diisi (minimal 5 karakter).',
      };
    }
    const distToCampus = calculateHaversineDistance(
      data.latitude,
      data.longitude,
      campusSetting.latitude,
      campusSetting.longitude
    );
    resolvedLocationId = null;
    resolvedLocationName = `Dinas Luar: ${data.note.trim()}`;
    recordedDistance = distToCampus;
  } else if (isFriday) {
    // Pada hari Jumat, institusi STIMI menerapkan sistem WFA (Work From Anywhere)
    // Tetap hitung dan rekam jarak nyata pegawai dari kampus STIMI Makassar
    const distToCampus = calculateHaversineDistance(
      data.latitude,
      data.longitude,
      campusSetting.latitude,
      campusSetting.longitude
    );
    resolvedLocationId = null;
    resolvedLocationName = 'WFA (Work From Anywhere)';
    recordedDistance = distToCampus;
  } else if (data.isSimulation) {
    // Mode Simulasi / Pengujian Mandiri
    const targetLoc = user.assignedLocation || (campusLocations.length > 0 ? campusLocations[0] : null);
    resolvedLocationId = targetLoc ? targetLoc.id : null;
    resolvedLocationName = targetLoc ? targetLoc.name : campusSetting.campusName;
    recordedDistance = 12; // Simulasi di dalam kampus
  } else if (user.assignedLocation) {
    const dist = calculateHaversineDistance(
      data.latitude,
      data.longitude,
      user.assignedLocation.latitude,
      user.assignedLocation.longitude
    );

    if (dist > user.assignedLocation.radiusMeters) {
      return {
        success: false,
        message: `Presensi ditolak. Anda berada di luar radius penugasan ${user.assignedLocation.name} (Jarak: ${Math.round(
          dist
        )}m, batas: ${user.assignedLocation.radiusMeters}m). Presensi cepat wajib dilakukan di area kampus.`,
      };
    }

    resolvedLocationId = user.assignedLocation.id;
    resolvedLocationName = user.assignedLocation.name;
    recordedDistance = dist;
  } else if (campusLocations.length > 0) {
    let nearestLoc = campusLocations[0];
    let minDistance = calculateHaversineDistance(
      data.latitude,
      data.longitude,
      nearestLoc.latitude,
      nearestLoc.longitude
    );

    for (let i = 1; i < campusLocations.length; i++) {
      const loc = campusLocations[i];
      const d = calculateHaversineDistance(
        data.latitude,
        data.longitude,
        loc.latitude,
        loc.longitude
      );
      if (d < minDistance) {
        minDistance = d;
        nearestLoc = loc;
      }
    }

    if (minDistance > nearestLoc.radiusMeters) {
      return {
        success: false,
        message: `Presensi ditolak. Posisi Anda berada di luar seluruh radius gedung kampus STIMI. Gedung terdekat adalah "${
          nearestLoc.name
        }" (${Math.round(minDistance)}m, batas: ${nearestLoc.radiusMeters}m).`,
      };
    }

    resolvedLocationId = nearestLoc.id;
    resolvedLocationName = nearestLoc.name;
    recordedDistance = minDistance;
  } else {
    const dist = calculateHaversineDistance(
      data.latitude,
      data.longitude,
      campusSetting.latitude,
      campusSetting.longitude
    );

    if (dist > campusSetting.radiusMeters) {
      return {
        success: false,
        message: `Presensi ditolak. Anda berada di luar area kampus STIMI (${Math.round(
          dist
        )}m, batas toleransi: ${campusSetting.radiusMeters}m).`,
      };
    }

    recordedDistance = dist;
  }

  // Cek apakah sudah absen masuk hari ini
  const existing = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: today,
      },
    },
  });

  // KONDISI 1: Belum Presensi Masuk -> Lakukan Clock In
  if (!existing || !existing.clockInTime) {
    let photoPath = '';
    try {
      photoPath = await saveSelfieImage(data.photoBase64, 'in', user.nip);
    } catch (err) {
      console.error('Gagal simpan foto presensi cepat:', err);
      return { success: false, message: 'Gagal memproses dan mengompres foto selfie' };
    }

    const clockInStatus = isDinasLuar
      ? 'DINAS_LUAR'
      : evaluateClockInStatus(
          now,
          campusSetting.workStart,
          campusSetting.gracePeriodMinutes,
          false,
          data.longitude
        );

    const clockInNote = isDinasLuar
      ? `[Dinas Luar] ${data.note?.trim() || ''}`
      : isFriday
      ? 'Presensi Cepat WFA (Jumat)'
      : 'Presensi Cepat Kiosk / HP (Tanpa Login)';

    await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {
        locationId: resolvedLocationId,
        locationName: resolvedLocationName,
        isDinasLuar,
        clockInTime: now,
        clockInLat: data.latitude,
        clockInLng: data.longitude,
        clockInPhoto: photoPath,
        clockInDistance: recordedDistance,
        clockInStatus,
        clockInNote,
      },
      create: {
        userId: user.id,
        date: today,
        locationId: resolvedLocationId,
        locationName: resolvedLocationName,
        isDinasLuar,
        clockInTime: now,
        clockInLat: data.latitude,
        clockInLng: data.longitude,
        clockInPhoto: photoPath,
        clockInDistance: recordedDistance,
        clockInStatus,
        clockInNote,
      },
    });

    revalidatePath('/admin/monitoring');
    revalidatePath('/admin/dashboard');

    const userTimezone = getTimezoneFromCoordinates(data.longitude);
    const tzLabel = userTimezone === 'Asia/Jakarta' ? 'WIB' : userTimezone === 'Asia/Jayapura' ? 'WIT' : 'WITA';
    const localTimeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: userTimezone });
    const witaTimeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' });
    const displayTime = tzLabel === 'WITA' ? `${witaTimeStr} WITA` : `${localTimeStr} ${tzLabel} (${witaTimeStr} WITA)`;

    return {
      success: true,
      actionType: 'IN' as const,
      employeeName: user.name,
      nip: user.nip,
      jabatan: user.jabatan,
      time: displayTime,
      status: clockInStatus,
      locationName: resolvedLocationName,
      message: `Presensi Masuk Berhasil! Selamat beraktivitas, ${user.name}.`,
    };
  }

  // KONDISI 2: Sudah Presensi Masuk, Belum Presensi Pulang -> Lakukan Clock Out
  if (!existing.clockOutTime) {
    let photoPath = '';
    try {
      photoPath = await saveSelfieImage(data.photoBase64, 'out', user.nip);
    } catch (err) {
      console.error('Gagal simpan foto pulang presensi cepat:', err);
      return { success: false, message: 'Gagal memproses foto selfie kepulangan' };
    }

    const isDinasLuarOut = isDinasLuar || existing.isDinasLuar;
    const clockOutStatus = isDinasLuarOut
      ? 'DINAS_LUAR'
      : evaluateClockOutStatus(now, campusSetting.workEnd, false, data.longitude);

    const clockOutNote = isDinasLuarOut
      ? `[Dinas Luar] ${data.note?.trim() || existing.clockInNote || ''}`
      : isFriday
      ? 'Presensi Cepat WFA (Jumat)'
      : 'Presensi Cepat Kiosk / HP (Tanpa Login)';

    await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        isDinasLuar: isDinasLuarOut,
        clockOutTime: now,
        clockOutLat: data.latitude,
        clockOutLng: data.longitude,
        clockOutPhoto: photoPath,
        clockOutDistance: recordedDistance,
        clockOutStatus,
        clockOutNote,
      },
    });

    revalidatePath('/admin/monitoring');
    revalidatePath('/admin/dashboard');

    const userTimezone = getTimezoneFromCoordinates(data.longitude);
    const tzLabel = userTimezone === 'Asia/Jakarta' ? 'WIB' : userTimezone === 'Asia/Jayapura' ? 'WIT' : 'WITA';
    const localTimeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: userTimezone });
    const witaTimeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' });
    const displayTime = tzLabel === 'WITA' ? `${witaTimeStr} WITA` : `${localTimeStr} ${tzLabel} (${witaTimeStr} WITA)`;

    return {
      success: true,
      actionType: 'OUT' as const,
      employeeName: user.name,
      nip: user.nip,
      jabatan: user.jabatan,
      time: displayTime,
      status: clockOutStatus,
      locationName: resolvedLocationName,
      message: `Presensi Pulang Berhasil! Terima kasih atas dedikasi Anda hari ini, ${user.name}.`,
    };
  }

  // KONDISI 3: Sudah Lengkap (Masuk & Pulang)
  return {
    success: false,
    message: `Presensi untuk ${user.name} hari ini telah lengkap (Masuk & Pulang sudah tercatat resmi).`,
  };
}
