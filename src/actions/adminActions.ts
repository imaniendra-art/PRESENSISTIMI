'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// ==========================================
// PENGATURAN JAM KERJA KAMPUS
// ==========================================

export async function updateCampusSettings(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Hanya Admin SDM yang dapat mengubah pengaturan kampus' };
  }

  const campusName = (formData.get('campusName') as string)?.trim() || 'STIMI Makassar';
  const address = (formData.get('address') as string)?.trim() || 'Kampus STIMI Makassar';
  const workStart = (formData.get('workStart') as string)?.trim() || '08:00';
  const workEnd = (formData.get('workEnd') as string)?.trim() || '16:30';
  const earliestClockIn = (formData.get('earliestClockIn') as string)?.trim() || '06:30';
  const gracePeriodMinutes = parseInt(formData.get('gracePeriodMinutes') as string, 10) || 15;
  const radiusMeters = parseFloat(formData.get('radiusMeters') as string) || 100.0;
  const wfaFriday = formData.get('wfaFriday') === 'true' || formData.get('wfaFriday') === 'on';
  const workDays = (formData.get('workDays') as string)?.trim() || '1,2,3,4,5';

  const existing = await prisma.campusSetting.findFirst();

  const payload = {
    campusName,
    address,
    workStart,
    workEnd,
    earliestClockIn,
    gracePeriodMinutes,
    radiusMeters,
    wfaFriday,
    workDays,
    updatedById: session.user.id,
  };

  if (existing) {
    await prisma.campusSetting.update({
      where: { id: existing.id },
      data: payload,
    });
  } else {
    await prisma.campusSetting.create({
      data: payload,
    });
  }

  revalidatePath('/admin/pengaturan');
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/monitoring');
  revalidatePath('/pegawai/dashboard');
  revalidatePath('/atasan/dashboard');
  revalidatePath('/absen-cepat');

  return { success: true, message: 'Pengaturan kampus & jam operasional berhasil diperbarui!' };
}

// ==========================================
// MANAJEMEN MULTI-GEDUNG KAMPUS
// ==========================================

export async function createCampusLocation(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Tidak memiliki hak akses' };
  }

  const name = (formData.get('name') as string)?.trim();
  const code = (formData.get('code') as string)?.trim() || null;
  const address = (formData.get('address') as string)?.trim();
  const latitude = parseFloat(formData.get('latitude') as string);
  const longitude = parseFloat(formData.get('longitude') as string);
  const radiusMeters = parseFloat(formData.get('radiusMeters') as string) || 100.0;

  if (!name || !address || isNaN(latitude) || isNaN(longitude)) {
    return { success: false, message: 'Nama gedung, alamat, dan titik koordinat GPS wajib diisi' };
  }

  await prisma.campusLocation.create({
    data: {
      name,
      code,
      address,
      latitude,
      longitude,
      radiusMeters,
      isActive: true,
    },
  });

  revalidatePath('/admin/pengaturan');
  revalidatePath('/pegawai/dashboard');

  return { success: true, message: `Gedung "${name}" berhasil ditambahkan ke daftar lokasi resmi STIMI!` };
}

export async function updateCampusLocation(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Tidak memiliki hak akses' };
  }

  const id = formData.get('id') as string;
  const name = (formData.get('name') as string)?.trim();
  const code = (formData.get('code') as string)?.trim() || null;
  const address = (formData.get('address') as string)?.trim();
  const latitude = parseFloat(formData.get('latitude') as string);
  const longitude = parseFloat(formData.get('longitude') as string);
  const radiusMeters = parseFloat(formData.get('radiusMeters') as string) || 100.0;

  if (!id || !name || !address || isNaN(latitude) || isNaN(longitude)) {
    return { success: false, message: 'Semua kolom wajib diisi dengan benar' };
  }

  await prisma.campusLocation.update({
    where: { id },
    data: {
      name,
      code,
      address,
      latitude,
      longitude,
      radiusMeters,
    },
  });

  revalidatePath('/admin/pengaturan');
  revalidatePath('/pegawai/dashboard');

  return { success: true, message: `Data lokasi gedung "${name}" berhasil diperbarui!` };
}

export async function toggleCampusLocationStatus(locationId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Tidak memiliki hak akses' };
  }

  const loc = await prisma.campusLocation.findUnique({ where: { id: locationId } });
  if (!loc) {
    return { success: false, message: 'Lokasi gedung tidak ditemukan' };
  }

  const updated = await prisma.campusLocation.update({
    where: { id: locationId },
    data: { isActive: !loc.isActive },
  });

  revalidatePath('/admin/pengaturan');
  revalidatePath('/pegawai/dashboard');

  return {
    success: true,
    message: `Status gedung "${updated.name}" diubah menjadi ${updated.isActive ? 'Aktif' : 'Nonaktif'}`,
  };
}

export async function deleteCampusLocation(locationId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Tidak memiliki hak akses' };
  }

  // Cek apakah ada pegawai yang sedang ditugaskan di gedung ini
  const assignedCount = await prisma.user.count({
    where: { assignedLocationId: locationId },
  });

  if (assignedCount > 0) {
    return {
      success: false,
      message: `Tidak dapat menghapus gedung ini karena terdapat ${assignedCount} pegawai yang sedang ditugaskan di lokasi ini. Silakan pindahkan penugasan mereka terlebih dahulu atau nonaktifkan gedung.`,
    };
  }

  await prisma.campusLocation.delete({
    where: { id: locationId },
  });

  revalidatePath('/admin/pengaturan');
  revalidatePath('/pegawai/dashboard');

  return { success: true, message: 'Gedung berhasil dihapus dari sistem' };
}

// ==========================================
// MANAJEMEN MASTER POLA & SHIFT KERJA
// ==========================================

export async function ensureDefaultWorkSchedules() {
  try {
    const count = await prisma.workSchedule.count();
    if (count === 0) {
      await prisma.workSchedule.createMany({
        data: [
          {
            name: 'Reguler Kampus (Standar)',
            code: 'REGULER',
            workStart: '09:00',
            workEnd: '16:00',
            scheduleType: 'STANDARD',
            workDays: '1,2,3,4,5',
            description: 'Jam kerja reguler civitas kampus hari Senin s/d Jumat',
            isDefault: true,
            isActive: true,
          },
          {
            name: 'Dosen Kelas Siang',
            code: 'DOSEN_SIANG',
            workStart: '13:00',
            workEnd: '17:00',
            scheduleType: 'CUSTOM_DAYS',
            workDays: '2,4',
            description: 'Khusus dosen yang mengajar kelas siang pada hari tertentu (misal Selasa & Kamis)',
            isDefault: false,
            isActive: true,
          },
          {
            name: 'Dosen Fleksibel Bulanan (Pak Irfan)',
            code: 'DOSEN_FLEKSIBEL',
            workStart: '09:00',
            workEnd: '16:00',
            scheduleType: 'MONTHLY_QUOTA',
            monthlyTargetDays: 4,
            description: 'Dosen tanpa jabatan fungsional dengan kewajiban kumulatif 4 hari kehadiran per bulan',
            isDefault: false,
            isActive: true,
          },
        ],
      });
    }
  } catch (err) {
    console.error('ensureDefaultWorkSchedules error:', err);
  }
}

export async function createWorkSchedule(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Tidak memiliki hak akses' };
  }

  const name = (formData.get('name') as string)?.trim();
  const code = (formData.get('code') as string)?.trim() || null;
  const workStart = (formData.get('workStart') as string)?.trim() || '09:00';
  const workEnd = (formData.get('workEnd') as string)?.trim() || '16:00';
  const scheduleType = (formData.get('scheduleType') as string) || 'STANDARD';
  const workDays = (formData.get('workDays') as string)?.trim() || (scheduleType === 'CUSTOM_DAYS' ? '2,4' : '1,2,3,4,5');
  const monthlyTargetDays = parseInt(formData.get('monthlyTargetDays') as string, 10) || 4;
  const description = (formData.get('description') as string)?.trim() || null;

  if (!name) {
    return { success: false, message: 'Nama pola jadwal kerja wajib diisi' };
  }

  await prisma.workSchedule.create({
    data: {
      name,
      code,
      workStart,
      workEnd,
      scheduleType,
      workDays: scheduleType === 'CUSTOM_DAYS' ? workDays : null,
      monthlyTargetDays: scheduleType === 'MONTHLY_QUOTA' ? monthlyTargetDays : null,
      description,
      isActive: true,
    },
  });

  revalidatePath('/admin/pengaturan');
  revalidatePath('/admin/pegawai');

  return { success: true, message: `Pola jadwal "${name}" berhasil ditambahkan!` };
}

export async function updateWorkSchedule(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Tidak memiliki hak akses' };
  }

  const scheduleId = formData.get('scheduleId') as string;
  const name = (formData.get('name') as string)?.trim();
  const code = (formData.get('code') as string)?.trim() || null;
  const workStart = (formData.get('workStart') as string)?.trim() || '09:00';
  const workEnd = (formData.get('workEnd') as string)?.trim() || '16:00';
  const scheduleType = (formData.get('scheduleType') as string) || 'STANDARD';
  const workDays = (formData.get('workDays') as string)?.trim() || (scheduleType === 'CUSTOM_DAYS' ? '2,4' : '1,2,3,4,5');
  const monthlyTargetDays = parseInt(formData.get('monthlyTargetDays') as string, 10) || 4;
  const description = (formData.get('description') as string)?.trim() || null;

  if (!scheduleId || !name) {
    return { success: false, message: 'ID dan Nama pola jadwal kerja wajib diisi' };
  }

  await prisma.workSchedule.update({
    where: { id: scheduleId },
    data: {
      name,
      code,
      workStart,
      workEnd,
      scheduleType,
      workDays: scheduleType === 'CUSTOM_DAYS' ? workDays : null,
      monthlyTargetDays: scheduleType === 'MONTHLY_QUOTA' ? monthlyTargetDays : null,
      description,
    },
  });

  // Sinkronkan data ke pegawai yang menggunakan template ini
  await prisma.user.updateMany({
    where: { workScheduleId: scheduleId },
    data: {
      customWorkStart: workStart,
      customWorkEnd: workEnd,
      workScheduleType: scheduleType,
      workDays: scheduleType === 'CUSTOM_DAYS' ? workDays : null,
      monthlyTargetDays: scheduleType === 'MONTHLY_QUOTA' ? monthlyTargetDays : null,
    },
  });

  revalidatePath('/admin/pengaturan');
  revalidatePath('/admin/pegawai');
  revalidatePath('/admin/monitoring');

  return { success: true, message: `Pola jadwal "${name}" berhasil diperbarui!` };
}

export async function deleteWorkSchedule(scheduleId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Tidak memiliki hak akses' };
  }

  const assignedCount = await prisma.user.count({
    where: { workScheduleId: scheduleId },
  });

  if (assignedCount > 0) {
    return {
      success: false,
      message: `Tidak dapat menghapus pola ini karena sedang digunakan oleh ${assignedCount} pegawai/dosen. Silakan pindahkan jadwal mereka terlebih dahulu.`,
    };
  }

  await prisma.workSchedule.delete({
    where: { id: scheduleId },
  });

  revalidatePath('/admin/pengaturan');
  revalidatePath('/admin/pegawai');

  return { success: true, message: 'Pola jadwal berhasil dihapus dari sistem' };
}

// ==========================================
// MANAJEMEN PEGAWAI & PENUGASAN LOKASI
// ==========================================

export async function createEmployee(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Tidak memiliki hak akses' };
  }

  const nip = (formData.get('nip') as string)?.trim();
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim() || null;
  const password = formData.get('password') as string;
  const role = (formData.get('role') as Role) || Role.PEGAWAI;
  const jabatan = (formData.get('jabatan') as string)?.trim();
  const unitKerja = (formData.get('unitKerja') as string)?.trim();
  const atasanId = (formData.get('atasanId') as string) || null;
  const assignedLocationId = (formData.get('assignedLocationId') as string) || null;
  
  // Sinkronisasi Template Pola Kerja
  const workScheduleIdRaw = (formData.get('workScheduleId') as string) || null;
  let finalWorkScheduleId: string | null = null;
  let finalWorkStart = (formData.get('customWorkStart') as string)?.trim() || null;
  let finalWorkEnd = (formData.get('customWorkEnd') as string)?.trim() || null;
  let finalScheduleType = (formData.get('workScheduleType') as string) || 'STANDARD';
  let finalWorkDays = (formData.get('workDays') as string)?.trim() || null;
  let finalMonthlyDays = formData.get('monthlyTargetDays') ? parseInt(formData.get('monthlyTargetDays') as string, 10) : null;

  if (workScheduleIdRaw && workScheduleIdRaw !== 'DEFAULT' && workScheduleIdRaw !== 'CUSTOM' && workScheduleIdRaw !== 'none') {
    const ws = await prisma.workSchedule.findUnique({
      where: { id: workScheduleIdRaw },
    });
    if (ws) {
      finalWorkScheduleId = ws.id;
      finalWorkStart = ws.workStart;
      finalWorkEnd = ws.workEnd;
      finalScheduleType = ws.scheduleType;
      finalWorkDays = ws.workDays;
      finalMonthlyDays = ws.monthlyTargetDays;
    }
  } else if (workScheduleIdRaw === 'DEFAULT') {
    finalWorkScheduleId = null;
    finalWorkStart = null;
    finalWorkEnd = null;
    finalScheduleType = 'STANDARD';
    finalWorkDays = null;
    finalMonthlyDays = null;
  }

  if (!nip || !name || !password || !jabatan || !unitKerja) {
    return { success: false, message: 'Semua kolom bertanda bintang (No. ID, Nama, Password, Jabatan, Unit Kerja) wajib diisi' };
  }

  // Cek duplikasi NIP
  const existingNip = await prisma.user.findUnique({
    where: { nip },
  });

  if (existingNip) {
    return { success: false, message: `No. ID ${nip} sudah terdaftar di sistem` };
  }

  // Cek duplikasi Email (jika diisi)
  if (email) {
    const existingEmail = await prisma.user.findFirst({
      where: { email },
    });
    if (existingEmail) {
      return { success: false, message: `Email ${email} sudah digunakan oleh pegawai lain` };
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const finalLocationId = assignedLocationId && assignedLocationId !== 'ALL' && assignedLocationId !== 'none'
    ? assignedLocationId
    : null;

  await prisma.user.create({
    data: {
      nip,
      name,
      email,
      password: hashedPassword,
      role,
      jabatan,
      unitKerja,
      atasanId: atasanId && atasanId !== 'none' ? atasanId : null,
      assignedLocationId: finalLocationId,
      workScheduleId: finalWorkScheduleId,
      customWorkStart: finalWorkStart || null,
      customWorkEnd: finalWorkEnd || null,
      workScheduleType: finalScheduleType || 'STANDARD',
      workDays: finalScheduleType === 'CUSTOM_DAYS' ? finalWorkDays : null,
      monthlyTargetDays: finalScheduleType === 'MONTHLY_QUOTA' ? (finalMonthlyDays || 4) : null,
      isActive: true,
    },
  });

  revalidatePath('/admin/pegawai');

  return { success: true, message: `Pegawai ${name} (NIP: ${nip}) berhasil ditambahkan!` };
}

export async function updateEmployee(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Tidak memiliki hak akses' };
  }

  const userId = formData.get('userId') as string;
  const nip = (formData.get('nip') as string)?.trim();
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim() || null;
  const role = (formData.get('role') as Role) || Role.PEGAWAI;
  const jabatan = (formData.get('jabatan') as string)?.trim();
  const unitKerja = (formData.get('unitKerja') as string)?.trim();
  const atasanId = (formData.get('atasanId') as string) || null;
  const assignedLocationId = (formData.get('assignedLocationId') as string) || null;
  
  // Sinkronisasi Template Pola Kerja
  const workScheduleIdRaw = (formData.get('workScheduleId') as string) || null;
  let finalWorkScheduleId: string | null = null;
  let finalWorkStart = (formData.get('customWorkStart') as string)?.trim() || null;
  let finalWorkEnd = (formData.get('customWorkEnd') as string)?.trim() || null;
  let finalScheduleType = (formData.get('workScheduleType') as string) || 'STANDARD';
  let finalWorkDays = (formData.get('workDays') as string)?.trim() || null;
  let finalMonthlyDays = formData.get('monthlyTargetDays') ? parseInt(formData.get('monthlyTargetDays') as string, 10) : null;

  if (workScheduleIdRaw && workScheduleIdRaw !== 'DEFAULT' && workScheduleIdRaw !== 'CUSTOM' && workScheduleIdRaw !== 'none') {
    const ws = await prisma.workSchedule.findUnique({
      where: { id: workScheduleIdRaw },
    });
    if (ws) {
      finalWorkScheduleId = ws.id;
      finalWorkStart = ws.workStart;
      finalWorkEnd = ws.workEnd;
      finalScheduleType = ws.scheduleType;
      finalWorkDays = ws.workDays;
      finalMonthlyDays = ws.monthlyTargetDays;
    }
  } else if (workScheduleIdRaw === 'DEFAULT') {
    finalWorkScheduleId = null;
    finalWorkStart = null;
    finalWorkEnd = null;
    finalScheduleType = 'STANDARD';
    finalWorkDays = null;
    finalMonthlyDays = null;
  }

  if (!userId || !nip || !name || !jabatan || !unitKerja) {
    return { success: false, message: 'Semua kolom wajib diisi' };
  }

  // Cek duplikasi NIP pada pengguna lain
  const conflictNip = await prisma.user.findFirst({
    where: {
      id: { not: userId },
      nip,
    },
  });

  if (conflictNip) {
    return { success: false, message: `No. ID ${nip} sudah digunakan oleh pegawai lain` };
  }

  // Cek duplikasi Email pada pengguna lain (jika diisi)
  if (email) {
    const conflictEmail = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        email,
      },
    });
    if (conflictEmail) {
      return { success: false, message: `Email ${email} sudah digunakan oleh pegawai lain` };
    }
  }

  const finalAtasanId = atasanId && atasanId !== 'none' && atasanId !== userId ? atasanId : null;
  const finalLocationId = assignedLocationId && assignedLocationId !== 'ALL' && assignedLocationId !== 'none'
    ? assignedLocationId
    : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      nip,
      name,
      email,
      role,
      jabatan,
      unitKerja,
      atasanId: finalAtasanId,
      assignedLocationId: finalLocationId,
      workScheduleId: finalWorkScheduleId,
      customWorkStart: finalWorkStart || null,
      customWorkEnd: finalWorkEnd || null,
      workScheduleType: finalScheduleType || 'STANDARD',
      workDays: finalScheduleType === 'CUSTOM_DAYS' ? finalWorkDays : null,
      monthlyTargetDays: finalScheduleType === 'MONTHLY_QUOTA' ? (finalMonthlyDays || 4) : null,
    },
  });

  revalidatePath('/admin/pegawai');
  revalidatePath('/admin/monitoring');

  return { success: true, message: `Data pegawai ${name} berhasil diperbarui!` };
}

export async function deleteEmployee(userId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Tidak memiliki hak akses' };
  }

  if (session.user.id === userId) {
    return { success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri' };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, nip: true },
  });

  if (!targetUser) {
    return { success: false, message: 'Pegawai tidak ditemukan' };
  }

  // Lepaskan keterikatan atasan agar bawahan tidak error
  await prisma.user.updateMany({
    where: { atasanId: userId },
    data: { atasanId: null },
  });

  // Lepaskan keterikatan persetujuan izin/dinas
  await prisma.leaveRequest.updateMany({
    where: { approverId: userId },
    data: { approverId: null },
  });

  await prisma.dutyTrip.updateMany({
    where: { approverId: userId },
    data: { approverId: null },
  });

  // Hapus catatan presensi pegawai terkait
  await prisma.attendance.deleteMany({
    where: { userId },
  });

  // Hapus permohonan cuti pegawai terkait
  await prisma.leaveRequest.deleteMany({
    where: { userId },
  });

  // Hapus permohonan dinas pegawai terkait
  await prisma.dutyTrip.deleteMany({
    where: { userId },
  });

  // Hapus akun pegawai
  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath('/admin/pegawai');
  revalidatePath('/admin/monitoring');
  revalidatePath('/admin/laporan');

  return {
    success: true,
    message: `Pegawai ${targetUser.name} (NIP: ${targetUser.nip}) berhasil dihapus permanen!`,
  };
}

export async function resetEmployeePassword(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Tidak memiliki hak akses' };
  }

  const userId = formData.get('userId') as string;
  const newPassword = (formData.get('newPassword') as string)?.trim();

  if (!userId || !newPassword || newPassword.length < 6) {
    return { success: false, message: 'Kata sandi baru minimal 6 karakter' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true, message: `Kata sandi untuk ${updated.name} (NIP: ${updated.nip}) berhasil direset!` };
}

export interface BulkEmployeeRow {
  nip: string;
  name: string;
  email?: string;
  password?: string;
  role?: string;
  jabatan?: string;
  unitKerja?: string;
  atasanNip?: string;
  lokasiGedung?: string;
}

export async function bulkImportEmployees(rows: BulkEmployeeRow[]) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Tidak memiliki hak akses' };
  }

  if (!rows || rows.length === 0) {
    return { success: false, message: 'Data baris Excel kosong' };
  }

  let createdCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  // Peta NIP -> ID User untuk relasi atasan
  const existingUsers = await prisma.user.findMany({
    select: { id: true, nip: true },
  });
  const nipToIdMap = new Map<string, string>();
  existingUsers.forEach((u) => nipToIdMap.set(u.nip.trim().toUpperCase(), u.id));

  // Peta gedung berdasarkan Nama atau Kode
  const campusLocations = await prisma.campusLocation.findMany();
  const locMap = new Map<string, string>();
  campusLocations.forEach((loc) => {
    locMap.set(loc.name.trim().toLowerCase(), loc.id);
    if (loc.code) locMap.set(loc.code.trim().toLowerCase(), loc.id);
  });

  // Antrean relasi atasan (Pass 2)
  const pendingBossLinks: { userId: string; atasanNip: string }[] = [];

  // PASS 1: Simpan / Perbarui Pegawai (NIP & Nama wajib, Email opsional)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nip = String(row.nip || '').trim();
    const name = String(row.name || '').trim();
    const email = row.email && String(row.email).trim() ? String(row.email).trim().toLowerCase() : null;
    const jabatan = String(row.jabatan || '').trim();
    const unitKerja = String(row.unitKerja || '').trim();
    const rawRole = String(row.role || 'PEGAWAI').trim().toUpperCase();
    const atasanNip = String(row.atasanNip || '').trim().toUpperCase();
    const rawLokasi = String(row.lokasiGedung || '').trim().toLowerCase();

    // Validasi utama: NIP dan Nama wajib, Email tidak wajib
    if (!nip || !name) {
      errors.push(`Baris ${i + 1}: NIP dan Nama wajib diisi (dilewati).`);
      continue;
    }

    // Pemetaan Role Cerdas (Pimpinan, Ketua, Kaprodi, Tendik, Dosen)
    let role: Role = Role.PEGAWAI;
    if (rawRole.includes('ADMIN')) {
      role = Role.ADMIN;
    } else if (
      rawRole.includes('PIMPINAN') ||
      rawRole.includes('KETUA') ||
      rawRole.includes('ATASAN') ||
      rawRole.includes('KAPRODI') ||
      rawRole.includes('WAKIL')
    ) {
      role = Role.ATASAN;
    }

    let assignedLocationId: string | null = null;
    if (rawLokasi && rawLokasi !== 'semua' && rawLokasi !== 'all' && rawLokasi !== 'fleksibel') {
      assignedLocationId = locMap.get(rawLokasi) || null;
    }

    const defaultPassword = row.password && String(row.password).trim().length >= 6
      ? String(row.password).trim()
      : 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    try {
      const existing = await prisma.user.findUnique({
        where: { nip },
      });

      let userId = '';

      if (existing) {
        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: {
            name,
            email: email !== null ? email : existing.email,
            role,
            jabatan: jabatan || existing.jabatan,
            unitKerja: unitKerja || existing.unitKerja,
            assignedLocationId: assignedLocationId !== undefined ? assignedLocationId : existing.assignedLocationId,
          },
        });
        userId = updated.id;
        updatedCount++;
      } else {
        const newUser = await prisma.user.create({
          data: {
            nip,
            name,
            email,
            password: hashedPassword,
            role,
            jabatan: jabatan || 'Dosen / Tendik',
            unitKerja: unitKerja || 'STIMI Makassar',
            assignedLocationId,
            isActive: true,
          },
        });
        userId = newUser.id;
        createdCount++;
      }

      nipToIdMap.set(nip.toUpperCase(), userId);

      if (atasanNip) {
        pendingBossLinks.push({ userId, atasanNip });
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      errors.push(`Baris ${i + 1} (${nip} - ${name}): Gagal disimpan (${e.message || 'Error'}).`);
    }
  }

  // PASS 2: Hubungkan NIP Atasan secara Akurat
  for (const item of pendingBossLinks) {
    const bossId = nipToIdMap.get(item.atasanNip);
    if (bossId && bossId !== item.userId) {
      try {
        await prisma.user.update({
          where: { id: item.userId },
          data: { atasanId: bossId },
        });
      } catch (err) {
        console.warn(`Gagal menghubungkan atasan ${item.atasanNip} untuk user ${item.userId}:`, err);
      }
    }
  }

  revalidatePath('/admin/pegawai');
  revalidatePath('/admin/monitoring');

  return {
    success: true,
    createdCount,
    updatedCount,
    errors,
    message: `Proses import selesai: ${createdCount} pegawai baru ditambahkan, ${updatedCount} pegawai diperbarui.`,
  };
}

export async function toggleEmployeeStatus(userId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Tidak memiliki hak akses' };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, message: 'Pegawai tidak ditemukan' };
  }

  if (user.id === session.user.id) {
    return { success: false, message: 'Tidak dapat menonaktifkan akun sendiri' };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  revalidatePath('/admin/pegawai');

  return {
    success: true,
    message: `Status akun ${updated.name} diubah menjadi ${
      updated.isActive ? 'Aktif' : 'Non-Aktif'
    }`,
  };
}
