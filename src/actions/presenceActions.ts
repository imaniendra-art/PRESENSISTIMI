'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateHaversineDistance } from '@/lib/geo';
import { getStartOfDay, evaluateClockInStatus, evaluateClockOutStatus } from '@/lib/time';
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

  // Ambil pengaturan kampus
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
    user: session.user,
    campusSetting,
    todayAttendance,
    activeDutyTrip,
  };
}

export async function submitClockIn(data: {
  latitude: number;
  longitude: number;
  photoBase64: string;
  isDinasLuar: boolean;
  dutyTripId?: string;
  note?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Sesi berakhir, silakan login kembali' };
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

  // Ambil pengaturan kampus
  const campusSetting = await prisma.campusSetting.findFirst();
  if (!campusSetting) {
    return { success: false, message: 'Pengaturan kampus belum dikonfigurasi oleh Admin' };
  }

  // Hitung jarak Haversine ke kampus
  const distance = calculateHaversineDistance(
    data.latitude,
    data.longitude,
    campusSetting.latitude,
    campusSetting.longitude
  );

  // Jika bukan dinas luar, validasi radius
  if (!data.isDinasLuar && distance > campusSetting.radiusMeters) {
    return {
      success: false,
      message: `Posisi Anda berada di luar radius kampus STIMI (${Math.round(distance)} meter dari pusat kampus, batas radius maksimal ${campusSetting.radiusMeters} meter). Silakan mendekat ke area kampus atau pilih opsi Dinas Luar jika sedang bertugas.`,
    };
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
    data.isDinasLuar
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
      clockInTime: now,
      clockInLat: data.latitude,
      clockInLng: data.longitude,
      clockInPhoto: photoPath,
      clockInDistance: distance,
      clockInStatus: status,
      clockInNote: data.note || null,
      isDinasLuar: data.isDinasLuar,
      dutyTripId: data.dutyTripId || null,
    },
    create: {
      userId,
      date: today,
      clockInTime: now,
      clockInLat: data.latitude,
      clockInLng: data.longitude,
      clockInPhoto: photoPath,
      clockInDistance: distance,
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
    message: `Presensi masuk berhasil dicatat! Status: ${
      status === 'TEPAT_WAKTU' ? 'Tepat Waktu' : status === 'TERLAMBAT' ? 'Terlambat' : 'Dinas Luar'
    }`,
  };
}

export async function submitClockOut(data: {
  latitude: number;
  longitude: number;
  photoBase64: string;
  note?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Sesi berakhir, silakan login kembali' };
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

  const distance = calculateHaversineDistance(
    data.latitude,
    data.longitude,
    campusSetting.latitude,
    campusSetting.longitude
  );

  // Jika bukan dinas luar, validasi radius
  if (!existing.isDinasLuar && distance > campusSetting.radiusMeters) {
    return {
      success: false,
      message: `Presensi pulang ditolak karena berada di luar radius kampus (${Math.round(distance)} meter).`,
    };
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
  const status = evaluateClockOutStatus(now, campusSetting.workEnd, existing.isDinasLuar);

  await prisma.attendance.update({
    where: {
      id: existing.id,
    },
    data: {
      clockOutTime: now,
      clockOutLat: data.latitude,
      clockOutLng: data.longitude,
      clockOutPhoto: photoPath,
      clockOutDistance: distance,
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
