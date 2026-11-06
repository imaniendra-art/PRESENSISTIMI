import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database PRESENSISTIMI...');

  // 1. Inisialisasi Pengaturan Jam Kerja Kampus STIMI
  const existingSetting = await prisma.campusSetting.findFirst();
  if (!existingSetting) {
    const setting = await prisma.campusSetting.create({
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
    console.log('✅ Pengaturan Kampus dibuat:', setting.campusName);
  } else {
    console.log('ℹ️ Pengaturan Kampus sudah ada:', existingSetting.campusName);
  }

  // 2. Inisialisasi Lokasi Gedung Kampus STIMI
  const existingLocations = await prisma.campusLocation.count();
  let loc1Id: string | null = null;
  let loc2Id: string | null = null;

  if (existingLocations === 0) {
    const loc1 = await prisma.campusLocation.create({
      data: {
        name: 'Kampus I - Gedung Utama STIMI',
        code: 'KAMPUS_1',
        address: 'Jl. Perintis Kemerdekaan No. 1, Makassar, Sulawesi Selatan',
        latitude: -5.147665,
        longitude: 119.432732,
        radiusMeters: 100.0,
        isActive: true,
      },
    });
    loc1Id = loc1.id;
    console.log('✅ Lokasi Gedung 1 dibuat:', loc1.name);

    const loc2 = await prisma.campusLocation.create({
      data: {
        name: 'Kampus II - Gedung Pascasarjana & Laboratorium',
        code: 'KAMPUS_2',
        address: 'Jl. A.P. Pettarani No. 88, Makassar, Sulawesi Selatan',
        latitude: -5.152120,
        longitude: 119.438500,
        radiusMeters: 120.0,
        isActive: true,
      },
    });
    loc2Id = loc2.id;
    console.log('✅ Lokasi Gedung 2 dibuat:', loc2.name);
  } else {
    const locs = await prisma.campusLocation.findMany({ take: 2 });
    loc1Id = locs[0]?.id || null;
    loc2Id = locs[1]?.id || null;
    console.log('ℹ️ Lokasi Gedung sudah ada:', existingLocations, 'gedung terdaftar');
  }

  // 3. Hash Password Default
  const adminPassword = await bcrypt.hash('adminstimi123', 10);
  const atasanPassword = await bcrypt.hash('atasan123', 10);
  const pegawaiPassword = await bcrypt.hash('dosen123', 10);

  // 4. User Admin HRD / SDM (Bebas di Semua Gedung)
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
      assignedLocationId: null, // Fleksibel di Semua Gedung
      isActive: true,
    },
  });
  console.log('✅ User Admin siap:', admin.nip, '-', admin.name);

  // 5. User Atasan / Pejabat Penilai (Fleksibel di Semua Gedung)
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
      assignedLocationId: null,
      isActive: true,
    },
  });
  console.log('✅ User Atasan siap:', atasan.nip, '-', atasan.name);

  // 6. User Pegawai / Dosen (Ditugaskan di Kampus I)
  const pegawai = await prisma.user.upsert({
    where: { nip: 'DOSEN001' },
    update: {
      atasanId: atasan.id,
      assignedLocationId: loc1Id,
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
      assignedLocationId: loc1Id, // Ditugaskan khusus di Kampus I
      isActive: true,
    },
  });
  console.log('✅ User Pegawai/Dosen siap (Lokasi: Kampus I):', pegawai.nip, '-', pegawai.name);

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
