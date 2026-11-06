import { PrismaClient, AttendanceStatus, ClockOutStatus, LeaveType, RequestStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Memulai simulasi pembuatan data presensi bulan Oktober 2026...');

  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: { assignedLocation: true },
  });

  const locations = await prisma.campusLocation.findMany({
    where: { isActive: true },
  });

  console.log(`Ditemukan ${users.length} pegawai aktif dan ${locations.length} gedung kampus.`);

  const defaultLocation = locations[0] || {
    id: null,
    name: 'Kampus I - Gedung Utama STIMI',
    latitude: -5.147665,
    longitude: 119.432732,
  };

  // Generate seluruh tanggal hari kerja (Senin - Jumat) di bulan Oktober 2026
  const workingDays: Date[] = [];
  for (let day = 1; day <= 31; day++) {
    const d = new Date(Date.UTC(2026, 9, day, 0, 0, 0)); // Bulan 9 di JS = Oktober (0-indexed)
    const dayOfWeek = d.getUTCDay();
    // 0 = Minggu, 6 = Sabtu
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays.push(d);
    }
  }

  console.log(`Total hari kerja di bulan Oktober 2026: ${workingDays.length} hari.`);

  let totalCreated = 0;

  for (const user of users) {
    // Tentukan kecenderungan disiplin per pegawai berdasarkan NIP hash agar variasi natural
    const hash = user.nip.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    for (let i = 0; i < workingDays.length; i++) {
      const date = workingDays[i];
      const dayNum = date.getUTCDate();
      const randomSeed = (hash * 31 + dayNum * 17) % 100;

      // Lokasi gedung untuk presensi ini
      const loc = user.assignedLocation || (locations[dayNum % locations.length] || defaultLocation);

      // Simulasi status kehadiran
      if (randomSeed < 78) {
        // 78%: Hadir Tepat Waktu
        const inMinute = 35 + ((hash + dayNum) % 24); // 07:35 - 07:59
        const inTime = new Date(Date.UTC(2026, 9, dayNum, 23, inMinute, 0)); // UTC 23:xx = WITA 07:xx
        const outMinute = 30 + ((hash + dayNum) % 30); // 16:30 - 17:00
        const outTime = new Date(Date.UTC(2026, 9, dayNum, 8, outMinute, 0)); // UTC 08:xx = WITA 16:xx

        await prisma.attendance.upsert({
          where: {
            userId_date: {
              userId: user.id,
              date,
            },
          },
          update: {
            locationId: loc.id || null,
            locationName: loc.name,
            clockInTime: inTime,
            clockInLat: loc.latitude + ((dayNum % 5) * 0.00005),
            clockInLng: loc.longitude + ((dayNum % 5) * 0.00005),
            clockInDistance: 12 + (dayNum % 15),
            clockInStatus: AttendanceStatus.TEPAT_WAKTU,
            clockInPhoto: 'https://qwprmurafwmrzqclopwk.supabase.co/storage/v1/object/public/presensistimi/selfies/sample_selfie.webp',
            clockOutTime: outTime,
            clockOutLat: loc.latitude,
            clockOutLng: loc.longitude,
            clockOutDistance: 15,
            clockOutStatus: ClockOutStatus.NORMAL,
            isDinasLuar: false,
          },
          create: {
            userId: user.id,
            date,
            locationId: loc.id || null,
            locationName: loc.name,
            clockInTime: inTime,
            clockInLat: loc.latitude,
            clockInLng: loc.longitude,
            clockInDistance: 12,
            clockInStatus: AttendanceStatus.TEPAT_WAKTU,
            clockInPhoto: 'https://qwprmurafwmrzqclopwk.supabase.co/storage/v1/object/public/presensistimi/selfies/sample_selfie.webp',
            clockOutTime: outTime,
            clockOutLat: loc.latitude,
            clockOutLng: loc.longitude,
            clockOutDistance: 15,
            clockOutStatus: ClockOutStatus.NORMAL,
            isDinasLuar: false,
          },
        });
        totalCreated++;
      } else if (randomSeed < 88) {
        // 10%: Hadir Terlambat (lewat dari jam 08:15)
        const inMinute = 16 + ((hash + dayNum) % 35); // 08:16 - 08:50
        const inTime = new Date(Date.UTC(2026, 9, dayNum, 0, inMinute, 0)); // UTC 00:xx = WITA 08:xx
        const outTime = new Date(Date.UTC(2026, 9, dayNum, 8, 35, 0)); // 16:35 WITA

        await prisma.attendance.upsert({
          where: {
            userId_date: {
              userId: user.id,
              date,
            },
          },
          update: {
            locationId: loc.id || null,
            locationName: loc.name,
            clockInTime: inTime,
            clockInLat: loc.latitude,
            clockInLng: loc.longitude,
            clockInDistance: 18,
            clockInStatus: AttendanceStatus.TERLAMBAT,
            clockInNote: 'Kemacetan lalu lintas jalur Urip Sumoharjo',
            clockInPhoto: 'https://qwprmurafwmrzqclopwk.supabase.co/storage/v1/object/public/presensistimi/selfies/sample_selfie.webp',
            clockOutTime: outTime,
            clockOutStatus: ClockOutStatus.NORMAL,
            isDinasLuar: false,
          },
          create: {
            userId: user.id,
            date,
            locationId: loc.id || null,
            locationName: loc.name,
            clockInTime: inTime,
            clockInLat: loc.latitude,
            clockInLng: loc.longitude,
            clockInDistance: 18,
            clockInStatus: AttendanceStatus.TERLAMBAT,
            clockInNote: 'Kemacetan lalu lintas jalur Urip Sumoharjo',
            clockInPhoto: 'https://qwprmurafwmrzqclopwk.supabase.co/storage/v1/object/public/presensistimi/selfies/sample_selfie.webp',
            clockOutTime: outTime,
            clockOutStatus: ClockOutStatus.NORMAL,
            isDinasLuar: false,
          },
        });
        totalCreated++;
      } else if (randomSeed < 94) {
        // 6%: Dinas Luar Kota
        const inTime = new Date(Date.UTC(2026, 9, dayNum, 0, 5, 0)); // 08:05 WITA
        const outTime = new Date(Date.UTC(2026, 9, dayNum, 8, 30, 0)); // 16:30 WITA

        await prisma.attendance.upsert({
          where: {
            userId_date: {
              userId: user.id,
              date,
            },
          },
          update: {
            locationId: null,
            locationName: 'Luar Kampus (Dinas Luar)',
            clockInTime: inTime,
            clockInLat: -5.138,
            clockInLng: 119.442,
            clockInDistance: 1400,
            clockInStatus: AttendanceStatus.DINAS_LUAR,
            clockInNote: 'Koordinasi Akreditasi Program Studi di LLDIKTI Wilayah IX',
            clockInPhoto: 'https://qwprmurafwmrzqclopwk.supabase.co/storage/v1/object/public/presensistimi/selfies/sample_selfie.webp',
            clockOutTime: outTime,
            clockOutStatus: ClockOutStatus.DINAS_LUAR,
            isDinasLuar: true,
          },
          create: {
            userId: user.id,
            date,
            locationId: null,
            locationName: 'Luar Kampus (Dinas Luar)',
            clockInTime: inTime,
            clockInLat: -5.138,
            clockInLng: 119.442,
            clockInDistance: 1400,
            clockInStatus: AttendanceStatus.DINAS_LUAR,
            clockInNote: 'Koordinasi Akreditasi Program Studi di LLDIKTI Wilayah IX',
            clockInPhoto: 'https://qwprmurafwmrzqclopwk.supabase.co/storage/v1/object/public/presensistimi/selfies/sample_selfie.webp',
            clockOutTime: outTime,
            clockOutStatus: ClockOutStatus.DINAS_LUAR,
            isDinasLuar: true,
          },
        });
        totalCreated++;
      } else if (randomSeed < 97) {
        // 3%: Pulang Cepat (Clock in tepat waktu, pulang jam 15:15)
        const inTime = new Date(Date.UTC(2026, 9, dayNum, 23, 50, 0)); // 07:50 WITA
        const outTime = new Date(Date.UTC(2026, 9, dayNum, 7, 15, 0)); // 15:15 WITA (sebelum 16:30)

        await prisma.attendance.upsert({
          where: {
            userId_date: {
              userId: user.id,
              date,
            },
          },
          update: {
            locationId: loc.id || null,
            locationName: loc.name,
            clockInTime: inTime,
            clockInLat: loc.latitude,
            clockInLng: loc.longitude,
            clockInDistance: 14,
            clockInStatus: AttendanceStatus.TEPAT_WAKTU,
            clockInPhoto: 'https://qwprmurafwmrzqclopwk.supabase.co/storage/v1/object/public/presensistimi/selfies/sample_selfie.webp',
            clockOutTime: outTime,
            clockOutStatus: ClockOutStatus.PULANG_CEPAT,
            clockOutNote: 'Izin pulang lebih awal mengurus administrasi keluarga',
            isDinasLuar: false,
          },
          create: {
            userId: user.id,
            date,
            locationId: loc.id || null,
            locationName: loc.name,
            clockInTime: inTime,
            clockInLat: loc.latitude,
            clockInLng: loc.longitude,
            clockInDistance: 14,
            clockInStatus: AttendanceStatus.TEPAT_WAKTU,
            clockInPhoto: 'https://qwprmurafwmrzqclopwk.supabase.co/storage/v1/object/public/presensistimi/selfies/sample_selfie.webp',
            clockOutTime: outTime,
            clockOutStatus: ClockOutStatus.PULANG_CEPAT,
            clockOutNote: 'Izin pulang lebih awal mengurus administrasi keluarga',
            isDinasLuar: false,
          },
        });
        totalCreated++;
      }
      // 3% sisanya tidak hadir / absen (tidak ada record attendance)
    }
  }

  // Buat beberapa LeaveRequest resmi yang APPROVED untuk melengkapi laporan
  const sampleLeaves = [
    {
      nip: 'DSN03',
      type: LeaveType.CUTI_TAHUNAN,
      startDate: new Date(Date.UTC(2026, 9, 12)),
      endDate: new Date(Date.UTC(2026, 9, 14)),
      totalDays: 3,
      reason: 'Cuti Tahunan Keperluan Keluarga',
    },
    {
      nip: 'TNK02',
      type: LeaveType.SAKIT,
      startDate: new Date(Date.UTC(2026, 9, 19)),
      endDate: new Date(Date.UTC(2026, 9, 20)),
      totalDays: 2,
      reason: 'Sakit Demam & Istirahat Dokter',
    },
    {
      nip: 'DSN05',
      type: LeaveType.IZIN,
      startDate: new Date(Date.UTC(2026, 9, 23)),
      endDate: new Date(Date.UTC(2026, 9, 23)),
      totalDays: 1,
      reason: 'Izin Menghadiri Seminar Nasional Pendidikan',
    },
  ];

  for (const item of sampleLeaves) {
    const targetUser = users.find((u) => u.nip === item.nip);
    if (targetUser) {
      await prisma.leaveRequest.create({
        data: {
          userId: targetUser.id,
          type: item.type,
          startDate: item.startDate,
          endDate: item.endDate,
          totalDays: item.totalDays,
          reason: item.reason,
          status: RequestStatus.APPROVED,
          approverId: targetUser.atasanId || targetUser.id,
          approverNote: 'Disetujui. Harap berkoordinasi dengan rekan kerja pengganti.',
          approvedAt: item.startDate,
        },
      });
    }
  }

  console.log(`✅ Berhasil membuat ${totalCreated} catatan presensi simulasi bulan Oktober 2026!`);
  console.log(`✅ Berhasil menambahkan 3 permohonan Cuti/Izin berstatus APPROVED.`);
}

main()
  .catch((e) => {
    console.error('❌ Gagal membuat simulasi data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
