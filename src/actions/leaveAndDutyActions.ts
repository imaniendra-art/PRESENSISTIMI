'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveUploadedFile } from '@/lib/fileStorage';
import { LeaveType, RequestStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function submitLeaveRequest(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Sesi berakhir, silakan login kembali' };
  }

  const userId = session.user.id;
  const type = formData.get('type') as LeaveType;
  const startDateStr = formData.get('startDate') as string;
  const endDateStr = formData.get('endDate') as string;
  const reason = formData.get('reason') as string;
  const attachment = formData.get('attachment') as File | null;

  if (!type || !startDateStr || !endDateStr || !reason) {
    return { success: false, message: 'Semua kolom wajib diisi' };
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (endDate < startDate) {
    return { success: false, message: 'Tanggal selesai tidak boleh sebelum tanggal mulai' };
  }

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Dapatkan atasan dari pegawai
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { atasanId: true },
  });

  let attachmentUrl: string | null = null;
  if (attachment && attachment.size > 0) {
    try {
      attachmentUrl = await saveUploadedFile(attachment, 'leaves');
    } catch (e) {
      console.error('Gagal upload attachment cuti:', e);
    }
  }

  await prisma.leaveRequest.create({
    data: {
      userId,
      type,
      startDate,
      endDate,
      totalDays,
      reason,
      attachmentUrl,
      status: RequestStatus.PENDING,
      approverId: user?.atasanId || null,
    },
  });

  revalidatePath('/pegawai/pengajuan');
  revalidatePath('/atasan/approval');

  return { success: true, message: 'Permohonan cuti/izin berhasil diajukan!' };
}

export async function submitDutyTripRequest(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Sesi berakhir, silakan login kembali' };
  }

  const userId = session.user.id;
  const title = formData.get('title') as string;
  const destination = formData.get('destination') as string;
  const startDateStr = formData.get('startDate') as string;
  const endDateStr = formData.get('endDate') as string;
  const letterNumber = formData.get('letterNumber') as string;
  const letterAttachment = formData.get('letterAttachment') as File | null;

  if (!title || !destination || !startDateStr || !endDateStr) {
    return { success: false, message: 'Nama kegiatan, tujuan, dan tanggal wajib diisi' };
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { atasanId: true },
  });

  let letterAttachmentUrl: string | null = null;
  if (letterAttachment && letterAttachment.size > 0) {
    try {
      letterAttachmentUrl = await saveUploadedFile(letterAttachment, 'duty_letters');
    } catch (e) {
      console.error('Gagal upload surat tugas:', e);
    }
  }

  await prisma.dutyTrip.create({
    data: {
      userId,
      title,
      destination,
      startDate,
      endDate,
      letterNumber: letterNumber || null,
      letterAttachmentUrl,
      status: RequestStatus.PENDING,
      approverId: user?.atasanId || null,
    },
  });

  revalidatePath('/pegawai/pengajuan');
  revalidatePath('/atasan/approval');

  return { success: true, message: 'Pengajuan dinas luar berhasil dikirim!' };
}

export async function reviewLeaveRequest(data: {
  leaveId: string;
  status: RequestStatus;
  note?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Sesi berakhir' };
  }

  if (session.user.role !== 'ATASAN' && session.user.role !== 'ADMIN') {
    return { success: false, message: 'Anda tidak memiliki hak menyetujui permohonan' };
  }

  await prisma.leaveRequest.update({
    where: { id: data.leaveId },
    data: {
      status: data.status,
      approverId: session.user.id,
      approverNote: data.note || null,
      approvedAt: new Date(),
    },
  });

  revalidatePath('/atasan/approval');
  revalidatePath('/pegawai/pengajuan');

  return {
    success: true,
    message: `Permohonan cuti telah di-${data.status === 'APPROVED' ? 'setujui' : 'tolak'}`,
  };
}

export async function reviewDutyTripRequest(data: {
  tripId: string;
  status: RequestStatus;
  note?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Sesi berakhir' };
  }

  if (session.user.role !== 'ATASAN' && session.user.role !== 'ADMIN') {
    return { success: false, message: 'Anda tidak memiliki hak menyetujui permohonan' };
  }

  await prisma.dutyTrip.update({
    where: { id: data.tripId },
    data: {
      status: data.status,
      approverId: session.user.id,
      approverNote: data.note || null,
      approvedAt: new Date(),
    },
  });

  revalidatePath('/atasan/approval');
  revalidatePath('/pegawai/pengajuan');

  return {
    success: true,
    message: `Pengajuan dinas luar telah di-${data.status === 'APPROVED' ? 'setujui' : 'tolak'}`,
  };
}
