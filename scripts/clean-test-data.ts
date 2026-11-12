import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Memulai proses pembersihan data transaksi dan data test...');

  // 1. Hapus seluruh data presensi (Attendances)
  const delAttendances = await prisma.attendance.deleteMany({});
  console.log(`✅ Berhasil menghapus ${delAttendances.count} catatan presensi test.`);

  // 2. Hapus seluruh data pengajuan cuti/izin (LeaveRequests)
  const delLeaves = await prisma.leaveRequest.deleteMany({});
  console.log(`✅ Berhasil menghapus ${delLeaves.count} catatan pengajuan izin/cuti test.`);

  // 3. Hapus seluruh data perjalanan dinas (DutyTrips)
  const delDutyTrips = await prisma.dutyTrip.deleteMany({});
  console.log(`✅ Berhasil menghapus ${delDutyTrips.count} catatan dinas luar test.`);

  // 4. Hapus akun demo dummy awal jika ada (DOSEN001 & ATASAN001)
  await prisma.user.updateMany({
    where: { nip: { in: ['DOSEN001', 'ATASAN001'] } },
    data: { atasanId: null },
  });
  const delDemoUsers = await prisma.user.deleteMany({
    where: {
      nip: { in: ['DOSEN001', 'ATASAN001'] },
    },
  });
  console.log(`✅ Berhasil menghapus ${delDemoUsers.count} akun demo dummy awal (DOSEN001 & ATASAN001).`);

  // 5. Bersihkan file foto selfie test di folder public/uploads/selfie
  const selfieDir = path.join(process.cwd(), 'public', 'uploads', 'selfie');
  let deletedFilesCount = 0;
  if (fs.existsSync(selfieDir)) {
    const files = fs.readdirSync(selfieDir);
    for (const file of files) {
      if (file !== '.gitkeep') {
        fs.unlinkSync(path.join(selfieDir, file));
        deletedFilesCount++;
      }
    }
  }
  console.log(`✅ Berhasil menghapus ${deletedFilesCount} file foto selfie test lokal.`);

  // 6. Verifikasi Kondisi Database Akhir
  const remainingUsers = await prisma.user.findMany({
    select: { nip: true, name: true, role: true, jabatan: true },
    orderBy: { nip: 'asc' },
  });
  const attCount = await prisma.attendance.count();
  const leaveCount = await prisma.leaveRequest.count();
  const tripCount = await prisma.dutyTrip.count();

  console.log('\n==================================================');
  console.log('📊 STATUS DATABASE BERSIH SIAP PAKAI:');
  console.log(`- Total Riwayat Presensi: ${attCount} (KOSONG & BERSIH ✅)`);
  console.log(`- Total Pengajuan Izin/Cuti: ${leaveCount} (KOSONG & BERSIH ✅)`);
  console.log(`- Total Riwayat Dinas Luar: ${tripCount} (KOSONG & BERSIH ✅)`);
  console.log(`- Total Pengguna Aktif: ${remainingUsers.length} Orang`);
  console.log('==================================================');
}

main()
  .catch((e) => {
    console.error('❌ Gagal membersihkan data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
