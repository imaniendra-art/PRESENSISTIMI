import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { getStartOfDay } from '@/lib/time';
import { calculateHaversineDistance } from '@/lib/geo';
import { MonitoringHeader } from '@/components/admin/MonitoringHeader';
import {
  MonitoringTableClient,
  MonitoringUserRow,
} from '@/components/admin/MonitoringTableClient';
import { Users, CheckCircle2, ClockAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AdminMonitoringPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function AdminMonitoringPage({
  searchParams,
}: AdminMonitoringPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  const resolvedParams = await searchParams;
  const now = new Date();

  // Format YYYY-MM-DD dalam zona waktu WITA Makassar
  const formatYMD = (d: Date) => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  };

  const todayStr = formatYMD(now);
  let currentDateStr = todayStr;

  if (resolvedParams?.date && /^\d{4}-\d{2}-\d{2}$/.test(resolvedParams.date)) {
    currentDateStr = resolvedParams.date;
  }

  const isToday = currentDateStr === todayStr;

  const [y, m, d] = currentDateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d, 12, 0, 0, 0);

  // Rentang query toleran zona waktu (WITA/WIB) untuk tanggal target
  const startOfQueryDay = new Date(`${currentDateStr}T00:00:00+08:00`);
  startOfQueryDay.setHours(startOfQueryDay.getHours() - 3);

  const endOfQueryDay = new Date(`${currentDateStr}T23:59:59+08:00`);
  endOfQueryDay.setHours(endOfQueryDay.getHours() + 3);

  const formattedDateDisplay = targetDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Ambil data kampus, pejabat penilai, cuti pending, pegawai aktif, serta cuti & dinas aktif hari ini secara konkuren
  const [campusSetting, totalAtasan, pendingLeaves, users, activeLeaves, activeDuties] = await Promise.all([
    prisma.campusSetting.findFirst(),
    prisma.user.count({ where: { role: 'ATASAN', isActive: true } }),
    prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
    prisma.user.findMany({
      where: {
        isActive: true,
        role: { not: 'ADMIN' },
      },
      include: {
        assignedLocation: true,
        attendances: {
          where: {
            date: {
              gte: startOfQueryDay,
              lte: endOfQueryDay,
            },
          },
          include: {
            location: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: endOfQueryDay },
        endDate: { gte: startOfQueryDay },
      },
      select: {
        id: true,
        userId: true,
        type: true,
        reason: true,
      },
    }),
    prisma.dutyTrip.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: endOfQueryDay },
        endDate: { gte: startOfQueryDay },
      },
      select: {
        id: true,
        userId: true,
        title: true,
        destination: true,
        letterNumber: true,
      },
    }),
  ]);

  // Statistik Kehadiran
  const totalEmployees = users.length;
  const attendedUsers = users.filter(
    (u) => u.attendances.length > 0 && u.attendances[0].clockInTime
  );
  const totalHadir = attendedUsers.length;
  const persentaseHadir =
    totalEmployees > 0 ? Math.round((totalHadir / totalEmployees) * 100) : 0;
  const tepatWaktu = attendedUsers.filter(
    (u) => u.attendances[0].clockInStatus === 'TEPAT_WAKTU' && !u.attendances[0].isDinasLuar
  ).length;
  const terlambat = attendedUsers.filter(
    (u) => u.attendances[0].clockInStatus === 'TERLAMBAT' && !u.attendances[0].isDinasLuar
  ).length;
  const dinasLuar = attendedUsers.filter((u) => u.attendances[0].isDinasLuar).length;
  const belumPresensi = Math.max(0, totalEmployees - totalHadir);

  // Serialisasi data untuk tabel interaktif client
  const serializedUsers: MonitoringUserRow[] = users.map((u) => {
    const att = u.attendances[0] || null;
    let calculatedDist = att?.clockInDistance;
    if (
      (calculatedDist === null || calculatedDist === undefined || calculatedDist === 0) &&
      att?.clockInLat &&
      att?.clockInLng &&
      campusSetting
    ) {
      calculatedDist = calculateHaversineDistance(
        att.clockInLat,
        att.clockInLng,
        campusSetting.latitude,
        campusSetting.longitude
      );
    }

    let calculatedOutDist = att?.clockOutDistance;
    if (
      (calculatedOutDist === null || calculatedOutDist === undefined || calculatedOutDist === 0) &&
      att?.clockOutLat &&
      att?.clockOutLng &&
      campusSetting
    ) {
      calculatedOutDist = calculateHaversineDistance(
        att.clockOutLat,
        att.clockOutLng,
        campusSetting.latitude,
        campusSetting.longitude
      );
    }

    const userLeave = activeLeaves.find((l) => l.userId === u.id) || null;
    const userDuty = activeDuties.find((d) => d.userId === u.id) || null;

    return {
      id: u.id,
      name: u.name,
      nip: u.nip,
      jabatan: u.jabatan || 'Staf',
      unitKerja: u.unitKerja || 'Unit Lainnya',
      assignedLocationName: u.assignedLocation?.name || null,
      activeLeave: userLeave
        ? {
            id: userLeave.id,
            type: userLeave.type,
            reason: userLeave.reason,
          }
        : null,
      activeDutyTrip: userDuty
        ? {
            id: userDuty.id,
            title: userDuty.title,
            destination: userDuty.destination,
            letterNumber: userDuty.letterNumber,
          }
        : null,
      attendance: att
        ? {
            id: att.id,
            locationName: att.locationName || att.location?.name || 'Kampus STIMI',
            clockInTime: att.clockInTime ? att.clockInTime.toISOString() : null,
            clockInLat: att.clockInLat,
            clockInLng: att.clockInLng,
            clockInPhoto: att.clockInPhoto,
            clockInStatus: att.clockInStatus,
            clockInDistance: calculatedDist,
            clockOutTime: att.clockOutTime ? att.clockOutTime.toISOString() : null,
            clockOutLat: att.clockOutLat,
            clockOutLng: att.clockOutLng,
            clockOutPhoto: att.clockOutPhoto,
            clockOutStatus: att.clockOutStatus,
            clockOutDistance: calculatedOutDist,
            isDinasLuar: att.isDinasLuar,
          }
        : null,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-8 space-y-2.5 sm:space-y-6">
        {/* Soft Sky Hero Card - Simetris & Selaras dengan Overview */}
        <MonitoringHeader
          currentDateStr={currentDateStr}
          formattedDateDisplay={formattedDateDisplay}
          isToday={isToday}
        />

        {/* 4 Kartu Metrik Utama - 1 Baris 4 Kolom Identik dengan Overview */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-4 w-full">
          {/* Card 1: Total Pegawai */}
          <div className="bg-white p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-200 transition">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                <span className="sm:hidden">Total</span>
                <span className="hidden sm:inline">Total Pegawai</span>
              </span>
              <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-sm sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
              {totalEmployees}
            </p>
            <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">
              {totalAtasan}{' '}
              <span className="hidden sm:inline">Pejabat Penilai</span>
              <span className="sm:hidden">Atasan</span>
            </p>
          </div>

          {/* Card 2: Hadir Hari Ini */}
          <div className="bg-white p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-200 transition">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                <span className="sm:hidden">Hadir</span>
                <span className="hidden sm:inline">Hadir Hari Ini</span>
              </span>
              <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-sm sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight flex items-baseline gap-1">
              <span>{totalHadir}</span>
              <span className="text-[9px] sm:text-xs font-semibold text-emerald-600 font-sans tracking-tight">
                ({persentaseHadir}%)
              </span>
            </p>
            <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">
              {tepatWaktu}{' '}
              <span className="hidden sm:inline">Tepat Waktu</span>
              <span className="sm:hidden">Tepat</span>
            </p>
          </div>

          {/* Card 3: Terlambat Masuk */}
          <div className="bg-white p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-200 transition">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                <span className="sm:hidden">Lambat</span>
                <span className="hidden sm:inline">Terlambat Masuk</span>
              </span>
              <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                <ClockAlert className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-sm sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
              {terlambat}
            </p>
            <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">
              {dinasLuar}{' '}
              <span className="hidden sm:inline">Tugas Dinas Luar</span>
              <span className="sm:hidden">Dinas</span>
            </p>
          </div>

          {/* Card 4: Belum Presensi */}
          <div className="bg-white p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs hover:border-rose-200 transition">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                <span className="sm:hidden">Belum</span>
                <span className="hidden sm:inline">Belum Presensi</span>
              </span>
              <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-sm sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
              {belumPresensi}
            </p>
            <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">
              {activeLeaves.length > 0 ? (
                <>
                  <span className="text-amber-700 font-bold">{activeLeaves.length}</span>{' '}
                  <span className="hidden sm:inline">Cuti/Izin Aktif</span>
                  <span className="sm:hidden">Cuti/Izin</span>
                </>
              ) : (
                <>
                  {pendingLeaves}{' '}
                  <span className="hidden sm:inline">Izin Menunggu</span>
                  <span className="sm:hidden">Izin</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Tabel Data Monitoring Presensi Lengkap dengan Toolbar Filter & Modal Lightbox */}
        <MonitoringTableClient
          users={serializedUsers}
          formattedDateDisplay={formattedDateDisplay}
          totalEmployees={totalEmployees}
          totalHadir={totalHadir}
        />
      </main>
    </div>
  );
}
