import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import {
  ReportGenerator,
  EmployeeIndividualReport,
  EmployeeDailyLog,
  ReportSummaryRow,
} from '@/components/admin/ReportGenerator';

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

  // Hitung seluruh hari kerja efektif dalam 1 bulan penuh (Senin s/d Jumat)
  const allWorkingDaysInMonth: Date[] = [];
  let totalWfoDays = 0; // Senin - Kamis (WFO Kampus)
  let totalWfaDays = 0; // Jumat (WFAnywhere)

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const d = new Date(currentYear, currentMonth - 1, day);
    const dayOfWeek = d.getDay(); // 0 = Minggu, 1 = Senin, ... 5 = Jumat, 6 = Sabtu
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      allWorkingDaysInMonth.push(d);
      if (day <= cutoffDay) {
        if (dayOfWeek === 5) {
          totalWfaDays++;
        } else {
          totalWfoDays++;
        }
      }
    }
  }

  // Hari kerja yang sudah berjalan s/d cutoffDay
  const elapsedWorkingDays = allWorkingDaysInMonth.filter((d) => d.getDate() <= cutoffDay);
  const effectiveWorkingDays = elapsedWorkingDays.length;

  // Query database lengkap: CampusSetting, Pegawai Aktif + WorkSchedule, Presensi, dan Pengajuan Izin/Cuti
  const [campusSetting, users, attendances, leaveRequests] = await Promise.all([
    prisma.campusSetting.findFirst(),
    prisma.user.findMany({
      where: {
        isActive: true,
        role: { not: 'ADMIN' },
      },
      include: {
        assignedLocation: true,
        workSchedule: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.attendance.findMany({
      where: {
        date: {
          gte: firstDay,
          lte: lastDay,
        },
        user: {
          role: { not: 'ADMIN' },
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

  const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // 1. Transformasi Data Rekapitulasi Bulanan Seluruh Pegawai (Tab 1 & Sheet 1)
  const reportData: ReportSummaryRow[] = users.map((u) => {
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

    for (const wDate of elapsedWorkingDays) {
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
        ? Math.min(100, Math.round((attendedOrDinas / effectiveWorkingDays) * 1000) / 10)
        : 0;

    return {
      userId: u.id,
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

  // 2. Transformasi Data Log Presensi Harian Lengkap Keseluruhan (Sheet 2)
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
          timeZone: 'Asia/Makassar',
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
          timeZone: 'Asia/Makassar',
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

  // 3. Transformasi Data Rincian Presensi Individual per SDM (Tab 2)
  const individualReports: EmployeeIndividualReport[] = users.map((u) => {
    const userAtts = attendances.filter((a) => a.userId === u.id);
    const userLeaves = leaveRequests.filter((l) => l.userId === u.id);

    const userWorkStart = u.workSchedule?.workStart || campusSetting?.workStart || '09:00';
    const [startH, startM] = userWorkStart.split(':').map((v) => parseInt(v, 10) || 0);
    const startMinutesOfDay = startH * 60 + startM;

    let totalWorkMinutes = 0;
    let totalLateMinutes = 0;

    const userDailyLogs: EmployeeDailyLog[] = allWorkingDaysInMonth.map((wDate, idx) => {
      const dayNum = wDate.getDate();
      const isPastOrToday = dayNum <= cutoffDay;
      const isToday = isCurrentMonth && dayNum === now.getDate();
      const dayOfWeek = wDate.getDay();
      const dayName = indonesianDays[dayOfWeek];

      const dateStr = wDate.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const dateDisplay = `${dayName}, ${wDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`;

      // Cari presensi di hari tersebut
      const att = userAtts.find((a) => {
        const aDate = new Date(a.date);
        return (
          aDate.getFullYear() === wDate.getFullYear() &&
          aDate.getMonth() === wDate.getMonth() &&
          aDate.getDate() === wDate.getDate()
        );
      });

      // Cari pengajuan izin/cuti yang mencakup hari tersebut
      const leave = userLeaves.find((l) => {
        const start = new Date(l.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(l.endDate);
        end.setHours(23, 59, 59, 999);
        return wDate >= start && wDate <= end;
      });

      let statusType: EmployeeDailyLog['statusType'] = 'BELUM_BERJALAN';
      let statusLabel = 'Masa Mendatang';
      let clockInTimeStr: string | null = null;
      let clockInStatus: 'TEPAT_WAKTU' | 'TERLAMBAT' | 'DINAS_LUAR' | null = null;
      let clockInStatusLabel: string | null = null;
      let lateMinutes = 0;
      let clockOutTimeStr: string | null = null;
      let clockOutStatus: 'NORMAL' | 'PULANG_CEPAT' | 'DINAS_LUAR' | null = null;
      let clockOutStatusLabel: string | null = null;
      let durationMinutes = 0;
      let durationDisplay = '-';
      let locationDisplay =
        att?.locationName ||
        att?.location?.name ||
        u.assignedLocation?.name ||
        'Kampus STIMI';
      let note: string | null = null;

      if (att && (att.clockInTime || att.isDinasLuar)) {
        if (att.isDinasLuar) {
          statusType = 'DINAS_LUAR';
          statusLabel = 'Dinas Luar Kota';
        } else if (dayOfWeek === 5) {
          statusType = 'HADIR_WFA';
          statusLabel = 'WFAnywhere (Jumat)';
        } else {
          statusType = 'HADIR_WFO';
          statusLabel = 'WFO Kampus';
        }

        if (att.clockInTime) {
          const inDate = new Date(att.clockInTime);
          clockInTimeStr =
            inDate.toLocaleTimeString('id-ID', {
              timeZone: 'Asia/Makassar',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }) + ' WITA';

          clockInStatus = att.clockInStatus;
          if (att.clockInStatus === 'TERLAMBAT') {
            const inWitaHours =
              parseInt(
                inDate.toLocaleTimeString('id-ID', {
                  timeZone: 'Asia/Makassar',
                  hour: '2-digit',
                  hour12: false,
                }),
                10
              ) || 0;
            const inWitaMins =
              parseInt(
                inDate.toLocaleTimeString('id-ID', {
                  timeZone: 'Asia/Makassar',
                  minute: '2-digit',
                  hour12: false,
                }),
                10
              ) || 0;
            const inTotalMins = inWitaHours * 60 + inWitaMins;
            lateMinutes = Math.max(0, inTotalMins - startMinutesOfDay);
            clockInStatusLabel = `Terlambat ${lateMinutes > 0 ? `+${lateMinutes}m` : ''}`;
            totalLateMinutes += lateMinutes;
          } else if (att.clockInStatus === 'TEPAT_WAKTU') {
            clockInStatusLabel = 'Tepat Waktu';
          } else if (att.isDinasLuar) {
            clockInStatusLabel = 'Dinas Luar';
          }
        }

        if (att.clockOutTime) {
          const outDate = new Date(att.clockOutTime);
          clockOutTimeStr =
            outDate.toLocaleTimeString('id-ID', {
              timeZone: 'Asia/Makassar',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }) + ' WITA';

          clockOutStatus = att.clockOutStatus;
          if (att.clockOutStatus === 'NORMAL') {
            clockOutStatusLabel = 'Pulang Normal';
          } else if (att.clockOutStatus === 'PULANG_CEPAT') {
            clockOutStatusLabel = 'Pulang Cepat';
          } else {
            clockOutStatusLabel = 'Presensi Pulang';
          }
        } else if (att.clockInTime && isPastOrToday && !isToday) {
          clockOutStatusLabel = 'Tidak Absen Pulang';
        } else if (att.clockInTime && isToday) {
          clockOutStatusLabel = 'Sedang Bekerja';
        }

        if (att.clockInTime && att.clockOutTime) {
          const diffMs = new Date(att.clockOutTime).getTime() - new Date(att.clockInTime).getTime();
          if (diffMs > 0) {
            durationMinutes = Math.floor(diffMs / (1000 * 60));
            totalWorkMinutes += durationMinutes;
            const h = Math.floor(durationMinutes / 60);
            const m = durationMinutes % 60;
            durationDisplay = `${h} Jam ${m} Mnt`;
          }
        }

        note =
          att.clockInNote ||
          att.clockOutNote ||
          (att.isDinasLuar ? att.dutyTrip?.title || 'Dinas Luar Kota' : null);
      } else if (leave) {
        statusType = 'IZIN_CUTI';
        const leaveTypeDisplay =
          leave.type === 'SAKIT'
            ? 'Izin Sakit'
            : leave.type === 'CUTI_TAHUNAN'
            ? 'Cuti Tahunan'
            : leave.type === 'CUTI_MELAHIRKAN'
            ? 'Cuti Melahirkan'
            : leave.type === 'IZIN'
            ? 'Izin'
            : 'Izin Lainnya';
        statusLabel = leaveTypeDisplay;
        note = leave.reason || null;
      } else if (isPastOrToday) {
        statusType = 'ALFA';
        statusLabel = 'Alfa (Mangkir)';
      } else {
        statusType = 'BELUM_BERJALAN';
        statusLabel = 'Masa Mendatang';
      }

      return {
        no: idx + 1,
        date: dateStr,
        dateDisplay,
        dayName,
        dayOfWeek,
        isToday,
        isPastOrToday,
        statusType,
        statusLabel,
        clockInTime: clockInTimeStr,
        clockInStatus,
        clockInStatusLabel,
        lateMinutes,
        clockOutTime: clockOutTimeStr,
        clockOutStatus,
        clockOutStatusLabel,
        durationMinutes,
        durationDisplay,
        locationDisplay,
        note,
      };
    });

    const totalHadir = userDailyLogs.filter(
      (d) => d.statusType === 'HADIR_WFO' || d.statusType === 'HADIR_WFA'
    ).length;
    const hadirWfo = userDailyLogs.filter((d) => d.statusType === 'HADIR_WFO').length;
    const hadirWfa = userDailyLogs.filter((d) => d.statusType === 'HADIR_WFA').length;
    const tepatWaktu = userDailyLogs.filter((d) => d.clockInStatus === 'TEPAT_WAKTU').length;
    const terlambat = userDailyLogs.filter((d) => d.clockInStatus === 'TERLAMBAT').length;
    const pulangCepat = userDailyLogs.filter((d) => d.clockOutStatus === 'PULANG_CEPAT').length;
    const dinasLuar = userDailyLogs.filter((d) => d.statusType === 'DINAS_LUAR').length;
    const izinCutiSakit = userDailyLogs.filter((d) => d.statusType === 'IZIN_CUTI').length;
    const alfa = userDailyLogs.filter((d) => d.statusType === 'ALFA').length;

    const attendedOrDinas = totalHadir + dinasLuar;
    const persentaseKehadiran =
      effectiveWorkingDays > 0
        ? Math.min(100, Math.round((attendedOrDinas / effectiveWorkingDays) * 1000) / 10)
        : 0;

    const workH = Math.floor(totalWorkMinutes / 60);
    const workM = totalWorkMinutes % 60;
    const totalWorkHoursDisplay = `${workH} Jam ${workM} Mnt`;

    return {
      userId: u.id,
      nip: u.nip,
      name: u.name,
      email: u.email,
      phone: u.phone,
      jabatan: u.jabatan,
      unitKerja: u.unitKerja,
      lokasiPenugasan: u.assignedLocation ? u.assignedLocation.name : 'Semua Gedung (Fleksibel)',
      scheduleName: u.workSchedule ? u.workSchedule.name : 'Jadwal Reguler Kampus',
      scheduleDetails: `${u.workSchedule?.workStart || campusSetting?.workStart || '09:00'} - ${
        u.workSchedule?.workEnd || campusSetting?.workEnd || '16:00'
      } WITA`,
      stats: {
        hariKerjaEfektif: effectiveWorkingDays,
        totalHadir,
        hadirWfo,
        hadirWfa,
        tepatWaktu,
        terlambat,
        totalLateMinutes,
        pulangCepat,
        dinasLuar,
        izinCutiSakit,
        alfa,
        persentaseKehadiran,
        totalWorkMinutes,
        totalWorkHoursDisplay,
      },
      dailyLogs: userDailyLogs,
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
    <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white print:min-h-0 print:p-0">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 print:p-0 print:m-0 print:max-w-none print:w-full print:space-y-0">
        {campusSetting && (
          <ReportGenerator
            campusSetting={campusSetting}
            reportData={reportData}
            dailyLogs={dailyLogs}
            individualReports={individualReports}
            kpiStats={kpiStats}
            selectedMonth={currentMonth}
            selectedYear={currentYear}
          />
        )}
      </main>
    </div>
  );
}
