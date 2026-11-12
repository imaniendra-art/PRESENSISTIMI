import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { ReportGenerator } from '@/components/admin/ReportGenerator';

export const dynamic = 'force-dynamic';

interface AdminLaporanPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function AdminLaporanPage({ searchParams }: AdminLaporanPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  const resolvedParams = await searchParams;
  const now = new Date();

  const currentMonth = resolvedParams?.month
    ? Math.max(1, Math.min(12, parseInt(resolvedParams.month) || now.getMonth() + 1))
    : now.getMonth() + 1;

  const currentYear = resolvedParams?.year
    ? parseInt(resolvedParams.year) || now.getFullYear()
    : now.getFullYear();

  const firstDay = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0);
  const lastDay = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

  // Cek apakah periode yang dipilih adalah bulan yang sedang berjalan
  const isCurrentMonth =
    now.getFullYear() === currentYear && now.getMonth() + 1 === currentMonth;

  // Tanggal batas perhitungan hari kerja (jika bulan berjalan, s/d hari ini agar adil tanpa Alfa palsu)
  const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const cutoffDay = isCurrentMonth ? Math.min(now.getDate(), totalDaysInMonth) : totalDaysInMonth;

  // Hitung daftar hari kerja efektif STIMI (5 hari kerja: Senin s/d Jumat)
  const workingDaysList: Date[] = [];
  let totalWfoDays = 0; // Senin - Kamis (WFO Kampus)
  let totalWfaDays = 0; // Jumat (WFAnywhere)

  for (let day = 1; day <= cutoffDay; day++) {
    const d = new Date(currentYear, currentMonth - 1, day);
    const dayOfWeek = d.getDay(); // 0 = Minggu, 1 = Senin, ... 5 = Jumat, 6 = Sabtu
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingDaysList.push(d);
      if (dayOfWeek === 5) {
        totalWfaDays++;
      } else {
        totalWfoDays++;
      }
    }
  }

  const effectiveWorkingDays = workingDaysList.length;

  // Query database lengkap: CampusSetting, Pegawai Aktif, Presensi, dan Pengajuan Izin/Cuti
  const [campusSetting, users, attendances, leaveRequests] = await Promise.all([
    prisma.campusSetting.findFirst(),
    prisma.user.findMany({
      where: { isActive: true },
      include: { assignedLocation: true },
      orderBy: { name: 'asc' },
    }),
    prisma.attendance.findMany({
      where: {
        date: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      include: {
        location: true,
        dutyTrip: true,
        user: {
          select: { nip: true, name: true, unitKerja: true },
        },
      },
      orderBy: [{ date: 'asc' }, { clockInTime: 'asc' }],
    }),
    prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: lastDay },
        endDate: { gte: firstDay },
      },
    }),
  ]);

  // Transformasi Data Rekapitulasi Bulanan per Pegawai
  const reportData = users.map((u) => {
    const userAtts = attendances.filter((a) => a.userId === u.id);
    const totalHadir = userAtts.filter((a) => a.clockInTime).length;

    // Hadir WFO: Senin - Kamis (bukan dinas luar)
    const hadirWfo = userAtts.filter((a) => {
      if (!a.clockInTime || a.isDinasLuar) return false;
      const dayOfWeek = new Date(a.date).getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 4;
    }).length;

    // Hadir WFA: Jumat (bukan dinas luar)
    const hadirWfa = userAtts.filter((a) => {
      if (!a.clockInTime || a.isDinasLuar) return false;
      const dayOfWeek = new Date(a.date).getDay();
      return dayOfWeek === 5;
    }).length;

    const tepatWaktu = userAtts.filter((a) => a.clockInStatus === 'TEPAT_WAKTU').length;
    const terlambat = userAtts.filter((a) => a.clockInStatus === 'TERLAMBAT').length;
    const pulangCepat = userAtts.filter((a) => a.clockOutStatus === 'PULANG_CEPAT').length;
    const dinasLuar = userAtts.filter((a) => a.isDinasLuar).length;

    // Perhitungan Izin / Cuti / Sakit (ICS) yang disetujui atasan
    const userLeaves = leaveRequests.filter((l) => l.userId === u.id);
    let izinCutiSakit = 0;

    for (const wDate of workingDaysList) {
      const isDateInLeave = userLeaves.some((l) => {
        const start = new Date(l.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(l.endDate);
        end.setHours(23, 59, 59, 999);
        return wDate >= start && wDate <= end;
      });

      if (isDateInLeave) {
        // Hanya dihitung jika pegawai tidak clock-in pada hari tersebut
        const hasAttended = userAtts.some((a) => {
          const aDate = new Date(a.date);
          return (
            aDate.getFullYear() === wDate.getFullYear() &&
            aDate.getMonth() === wDate.getMonth() &&
            aDate.getDate() === wDate.getDate() &&
            Boolean(a.clockInTime)
          );
        });

        if (!hasAttended) {
          izinCutiSakit++;
        }
      }
    }

    // Alfa = Hari Kerja Efektif - (Total Hadir Fisik/WFA + Dinas Luar + IzinCutiSakit)
    const attendedOrDinas = userAtts.filter((a) => a.clockInTime || a.isDinasLuar).length;
    const alfa = Math.max(0, effectiveWorkingDays - (attendedOrDinas + izinCutiSakit));

    const persentase =
      effectiveWorkingDays > 0
        ? Math.min(100, Math.round(((attendedOrDinas) / effectiveWorkingDays) * 1000) / 10)
        : 0;

    return {
      nip: u.nip,
      name: u.name,
      jabatan: u.jabatan,
      unitKerja: u.unitKerja,
      lokasiPenugasan: u.assignedLocation ? u.assignedLocation.name : 'Semua Gedung (Fleksibel)',
      hariKerjaEfektif: effectiveWorkingDays,
      totalHadir,
      hadirWfo,
      hadirWfa,
      tepatWaktu,
      terlambat,
      pulangCepat,
      dinasLuar,
      izinCutiSakit,
      alfa,
      persentaseKehadiran: persentase,
    };
  });

  // Transformasi Data Log Presensi Harian Lengkap (Sheet 2)
  const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const dailyLogs = attendances.map((a, idx) => {
    const aDate = new Date(a.date);
    const dayOfWeek = aDate.getDay();
    const dayName = indonesianDays[dayOfWeek];

    const dateStr = aDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    let modeKerja = 'WFO Kampus';
    if (a.isDinasLuar) {
      modeKerja = 'Dinas Luar Kota';
    } else if (dayOfWeek === 5) {
      modeKerja = 'WFAnywhere (Jumat)';
    }

    const clockInStr = a.clockInTime
      ? new Date(a.clockInTime).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' WITA'
      : '-';

    const clockInStatusStr =
      a.clockInStatus === 'TEPAT_WAKTU'
        ? 'Tepat Waktu'
        : a.clockInStatus === 'TERLAMBAT'
        ? 'Terlambat'
        : a.clockInStatus === 'DINAS_LUAR'
        ? 'Dinas Luar'
        : '-';

    const clockOutStr = a.clockOutTime
      ? new Date(a.clockOutTime).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' WITA'
      : '-';

    const clockOutStatusStr =
      a.clockOutStatus === 'NORMAL'
        ? 'Pulang Normal'
        : a.clockOutStatus === 'PULANG_CEPAT'
        ? 'Pulang Cepat'
        : a.clockOutStatus === 'DINAS_LUAR'
        ? 'Dinas Luar'
        : '-';

    let durasiStr = '-';
    if (a.clockInTime && a.clockOutTime) {
      const diffMs = new Date(a.clockOutTime).getTime() - new Date(a.clockInTime).getTime();
      if (diffMs > 0) {
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        durasiStr = `${hours} Jam ${mins} Menit`;
      }
    }

    return {
      no: idx + 1,
      tanggal: dateStr,
      hari: dayName,
      modeKerja,
      nip: a.user.nip,
      name: a.user.name,
      unitKerja: a.user.unitKerja,
      jamMasuk: clockInStr,
      statusMasuk: clockInStatusStr,
      jamPulang: clockOutStr,
      statusPulang: clockOutStatusStr,
      durasiKerja: durasiStr,
      lokasi: a.locationName || a.location?.name || 'Kampus STIMI',
    };
  });

  // Statistik Agregat Institusi (KPI)
  const totalPegawai = reportData.length;
  const avgKehadiran =
    totalPegawai > 0
      ? Math.round(
          (reportData.reduce((acc, r) => acc + r.persentaseKehadiran, 0) / totalPegawai) * 10
        ) / 10
      : 0;
  const totalHadirWfo = reportData.reduce((acc, r) => acc + r.hadirWfo, 0);
  const totalHadirWfa = reportData.reduce((acc, r) => acc + r.hadirWfa, 0);
  const totalTerlambat = reportData.reduce((acc, r) => acc + r.terlambat, 0);
  const totalPulangCepat = reportData.reduce((acc, r) => acc + r.pulangCepat, 0);
  const totalIzinCuti = reportData.reduce((acc, r) => acc + r.izinCutiSakit, 0);
  const totalAlfa = reportData.reduce((acc, r) => acc + r.alfa, 0);

  const kpiStats = {
    totalPegawai,
    avgKehadiran,
    totalHadirWfo,
    totalHadirWfa,
    totalTerlambat,
    totalPulangCepat,
    totalIzinCuti,
    totalAlfa,
    effectiveWorkingDays,
    totalWfoDays,
    totalWfaDays,
    isCurrentMonth,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Rekapitulasi Kehadiran & Ekspor Laporan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unduh rekap data presensi ke format Excel multi-sheet (.xlsx) atau cetak format resmi PDF Landscape untuk arsip institusi
          </p>
        </div>

        {campusSetting && (
          <ReportGenerator
            campusSetting={campusSetting}
            reportData={reportData}
            dailyLogs={dailyLogs}
            kpiStats={kpiStats}
            selectedMonth={currentMonth}
            selectedYear={currentYear}
          />
        )}
      </main>
    </div>
  );
}
