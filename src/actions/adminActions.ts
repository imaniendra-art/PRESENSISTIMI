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

  const campusName = formData.get('campusName') as string;
  const address = formData.get('address') as string;
  const workStart = formData.get('workStart') as string;
  const workEnd = formData.get('workEnd') as string;
  const gracePeriodMinutes = parseInt(formData.get('gracePeriodMinutes') as string, 10);

  const existing = await prisma.campusSetting.findFirst();

  if (existing) {
    await prisma.campusSetting.update({
      where: { id: existing.id },
      data: {
        campusName,
        address,
        workStart,
        workEnd,
        gracePeriodMinutes,
        updatedById: session.user.id,
      },
    });
  } else {
    await prisma.campusSetting.create({
      data: {
        campusName,
        address,
        workStart,
        workEnd,
        gracePeriodMinutes,
        updatedById: session.user.id,
      },
    });
  }

  revalidatePath('/admin/pengaturan');
  revalidatePath('/pegawai/dashboard');

  return { success: true, message: 'Pengaturan jam kerja institusi berhasil diperbarui!' };
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

  if (!nip || !name || !password || !jabatan || !unitKerja) {
    return { success: false, message: 'Semua kolom bertanda bintang (NIP, Nama, Password, Jabatan, Unit Kerja) wajib diisi' };
  }

  // Cek duplikasi NIP
  const existingNip = await prisma.user.findUnique({
    where: { nip },
  });

  if (existingNip) {
    return { success: false, message: `NIP ${nip} sudah terdaftar di sistem` };
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
    return { success: false, message: `NIP ${nip} sudah digunakan oleh pegawai lain` };
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
