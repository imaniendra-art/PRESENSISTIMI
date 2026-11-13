'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { saveAvatarImage } from '@/lib/fileStorage';
import { revalidatePath } from 'next/cache';

export interface ActionResponse {
  success: boolean;
  message: string;
  avatarUrl?: string;
}

/**
 * Server Action: Update Profil Pegawai (Email, No. HP, Foto Avatar)
 */
export async function updateProfile(formData: FormData): Promise<ActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Sesi login tidak sah atau telah berakhir.' };
  }

  const emailRaw = formData.get('email') as string | null;
  const phoneRaw = formData.get('phone') as string | null;
  const avatarFile = formData.get('avatar') as File | null;
  const avatarBase64 = formData.get('avatarBase64') as string | null;

  const email = emailRaw?.trim() ? emailRaw.trim().toLowerCase() : null;
  const phone = phoneRaw?.trim() ? phoneRaw.trim() : null;

  // Validasi format email jika diisi
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Format alamat email tidak valid.' };
  }

  // Validasi format nomor HP jika diisi (minimal 9 digit angka)
  if (phone && (!/^[0-9+\s-]{9,20}$/.test(phone) || phone.replace(/\D/g, '').length < 9)) {
    return { success: false, message: 'Format nomor telepon/HP tidak valid (minimal 9 digit).' };
  }

  let newAvatarUrl: string | undefined = undefined;

  // 1. Simpan foto jika diunggah via file
  if (avatarFile && avatarFile.size > 0 && avatarFile.type.startsWith('image/')) {
    try {
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      newAvatarUrl = await saveAvatarImage(buffer, session.user.nip);
    } catch (err) {
      console.error('Gagal mengompresi foto avatar:', err);
      return { success: false, message: 'Gagal memproses dan mengompres foto profil.' };
    }
  } else if (avatarBase64 && avatarBase64.startsWith('data:image/')) {
    try {
      newAvatarUrl = await saveAvatarImage(avatarBase64, session.user.nip);
    } catch (err) {
      console.error('Gagal menyimpan foto avatar base64:', err);
      return { success: false, message: 'Gagal memproses foto avatar.' };
    }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email,
        phone,
        ...(newAvatarUrl ? { avatarUrl: newAvatarUrl } : {}),
      },
    });

    revalidatePath('/profil');
    revalidatePath('/admin/monitoring');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/pegawai');

    return {
      success: true,
      message: 'Profil dan informasi kontak Anda berhasil diperbarui!',
      avatarUrl: newAvatarUrl,
    };
  } catch (error) {
    console.error('Gagal memperbarui profil pengguna:', error);
    return { success: false, message: 'Terjadi kesalahan pada server saat menyimpan profil.' };
  }
}

/**
 * Server Action: Ganti Kata Sandi (Password) Akun
 */
export async function changePassword(formData: FormData): Promise<ActionResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Sesi login tidak sah atau telah berakhir.' };
  }

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, message: 'Semua kolom kata sandi wajib diisi.' };
  }

  if (newPassword.length < 6) {
    return { success: false, message: 'Kata sandi baru minimal 6 karakter.' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, message: 'Konfirmasi kata sandi baru tidak sesuai.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return { success: false, message: 'Akun pegawai tidak ditemukan.' };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return { success: false, message: 'Kata sandi saat ini (lama) tidak cocok/salah.' };
    }

    // Hash kata sandi baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    revalidatePath('/profil');

    return {
      success: true,
      message: 'Kata sandi berhasil diperbarui! Silakan gunakan kata sandi baru untuk login berikutnya.',
    };
  } catch (error) {
    console.error('Gagal mengganti kata sandi:', error);
    return { success: false, message: 'Terjadi kesalahan sistem saat mengganti kata sandi.' };
  }
}
