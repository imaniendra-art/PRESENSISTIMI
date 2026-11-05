'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function updateCampusSettings(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Hanya Admin SDM yang dapat mengubah pengaturan kampus' };
  }

  const campusName = formData.get('campusName') as string;
  const address = formData.get('address') as string;
  const latitude = parseFloat(formData.get('latitude') as string);
  const longitude = parseFloat(formData.get('longitude') as string);
  const radiusMeters = parseFloat(formData.get('radiusMeters') as string);
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
        latitude,
        longitude,
        radiusMeters,
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
        latitude,
        longitude,
        radiusMeters,
        workStart,
        workEnd,
        gracePeriodMinutes,
        updatedById: session.user.id,
      },
    });
  }

  revalidatePath('/admin/pengaturan');
  revalidatePath('/pegawai/dashboard');

  return { success: true, message: 'Pengaturan kampus & radius geofence berhasil diperbarui!' };
}

export async function createEmployee(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Tidak memiliki hak akses' };
  }

  const nip = (formData.get('nip') as string)?.trim();
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const role = (formData.get('role') as Role) || Role.PEGAWAI;
  const jabatan = (formData.get('jabatan') as string)?.trim();
  const unitKerja = (formData.get('unitKerja') as string)?.trim();
  const atasanId = (formData.get('atasanId') as string) || null;

  if (!nip || !name || !email || !password || !jabatan || !unitKerja) {
    return { success: false, message: 'Semua kolom bertanda bintang wajib diisi' };
  }

  // Cek duplikasi NIP atau Email
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ nip }, { email }],
    },
  });

  if (existing) {
    return { success: false, message: 'NIP atau Email sudah terdaftar di sistem' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

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
      isActive: true,
    },
  });

  revalidatePath('/admin/pegawai');

  return { success: true, message: `Pegawai ${name} (NIP: ${nip}) berhasil ditambahkan!` };
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
