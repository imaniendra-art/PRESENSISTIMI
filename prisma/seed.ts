import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database PRESENSISTIMI...');

  // 1. Inisialisasi Pengaturan Kampus STIMI
  const existingSetting = await prisma.campusSetting.findFirst();
  if (!existingSetting) {
    const setting = await prisma.campusSetting.create({
      data: {
        campusName: 'STIMI Makassar',
        address: 'Jl. Kampus STIMI Makassar, Sulawesi Selatan',
        latitude: -5.147665, // Koordinat standar kampus STIMI Makassar
        longitude: 119.432732,
        radiusMeters: 100.0,
        workStart: '08:00',
        workEnd: '16:30',
        gracePeriodMinutes: 15,
      },
    });
    console.log('✅ Pengaturan Kampus dibuat:', setting.campusName);
  } else {
    console.log('ℹ️ Pengaturan Kampus sudah ada:', existingSetting.campusName);
  }

  // 2. Hash Password Default
  const adminPassword = await bcrypt.hash('adminstimi123', 10);
  const atasanPassword = await bcrypt.hash('atasan123', 10);
  const pegawaiPassword = await bcrypt.hash('dosen123', 10);

  // 3. User Admin HRD / SDM
  const admin = await prisma.user.upsert({
    where: { nip: 'ADMIN001' },
    update: {},
    create: {
      nip: 'ADMIN001',
      name: 'Administrator Kepegawaian STIMI',
      email: 'admin@stimi.ac.id',
      password: adminPassword,
      role: Role.ADMIN,
      jabatan: 'Kepala Bagian SDM & Kepegawaian',
      unitKerja: 'Biro Administrasi Umum & SDM',
      isActive: true,
    },
  });
  console.log('✅ User Admin siap:', admin.nip, '-', admin.name);

  // 4. User Atasan / Pejabat Penilai
  const atasan = await prisma.user.upsert({
    where: { nip: 'ATASAN001' },
    update: {},
    create: {
      nip: 'ATASAN001',
      name: 'Dr. H. Ahmad Rahman, M.M.',
      email: 'ahmad.rahman@stimi.ac.id',
      password: atasanPassword,
      role: Role.ATASAN,
      jabatan: 'Ketua Program Studi Manajemen',
      unitKerja: 'Program Studi S1 Manajemen',
      isActive: true,
    },
  });
  console.log('✅ User Atasan siap:', atasan.nip, '-', atasan.name);

  // 5. User Pegawai / Dosen
  const pegawai = await prisma.user.upsert({
    where: { nip: 'DOSEN001' },
    update: {
      atasanId: atasan.id,
    },
    create: {
      nip: 'DOSEN001',
      name: 'Nurul Hidayah, S.E., M.Si.',
      email: 'nurul.hidayah@stimi.ac.id',
      password: pegawaiPassword,
      role: Role.PEGAWAI,
      jabatan: 'Dosen Tetap Manajemen Keuangan',
      unitKerja: 'Program Studi S1 Manajemen',
      atasanId: atasan.id,
      isActive: true,
    },
  });
  console.log('✅ User Pegawai/Dosen siap:', pegawai.nip, '-', pegawai.name);

  console.log('🎉 Seeding selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Gagal saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
