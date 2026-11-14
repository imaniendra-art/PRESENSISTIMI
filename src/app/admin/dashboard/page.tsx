import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';
import Image from 'next/image';
import { getStartOfDay, getTimezoneFromCoordinates } from '@/lib/time';
import { getRegionDescription } from '@/lib/geo';
import {
  Users,
  CheckCircle2,
  ClockAlert,
  ArrowRight,
  Activity,
  Building2,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  const today = getStartOfDay();

  // Hitung rentang 5 hari kerja minggu berjalan (Senin s/d Jumat)
  const currentDay = today.getDay(); // 0 = Min, 1 = Sen, ..., 6 = Sab
  const monday = new Date(today);
  const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const weekDays = [0, 1, 2, 3, 4].map((offset) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset);
    return d;
  });

  const weekEnd = new Date(weekDays[4]);
  weekEnd.setHours(23, 59, 59, 999);

  // Ambil seluruh data analitik secara konkuren (khusus civitas Dosen & Tendik, exclude Admin)
  const [
    totalPegawai,
    totalAtasan,
    attendancesToday,
    pendingLeaves,
    campusSetting,
    weeklyAttendances,
    allActiveUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true, role: { not: 'ADMIN' } } }),
    prisma.user.count({ where: { role: 'ATASAN', isActive: true } }),
    prisma.attendance.findMany({
      where: {
        date: today,
        user: { role: { not: 'ADMIN' } },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nip: true,
            jabatan: true,
            unitKerja: true,
          },
        },
      },
      orderBy: { clockInTime: 'desc' },
    }),
    prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
    prisma.campusSetting.findFirst(),
    prisma.attendance.findMany({
      where: {
        date: {
          gte: weekDays[0],
          lte: weekEnd,
        },
        user: { role: { not: 'ADMIN' } },
      },
      select: {
        date: true,
        clockInTime: true,
        clockInStatus: true,
      },
    }),
    prisma.user.findMany({
      where: { isActive: true, role: { not: 'ADMIN' } },
      select: { id: true, unitKerja: true },
    }),
  ]);

  // Metrik Utama Hari Ini
  const hadirMasuk = attendancesToday.filter((a) => a.clockInTime).length;
  const tepatWaktu = attendancesToday.filter(
    (a) => a.clockInStatus === 'TEPAT_WAKTU'
  ).length;
  const terlambat = attendancesToday.filter(
    (a) => a.clockInStatus === 'TERLAMBAT'
  ).length;
  const dinasLuar = attendancesToday.filter((a) => a.isDinasLuar).length;
  const belumHadir = Math.max(0, totalPegawai - hadirMasuk);

  const persentaseHadir =
    totalPegawai > 0 ? Math.round((hadirMasuk / totalPegawai) * 100) : 0;

  // Analisis Tren Mingguan (Senin s/d Jumat)
  const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];
  const weeklyStats = weekDays.map((d, idx) => {
    const dayTimestamp = d.getTime();
    const dayAttendances = weeklyAttendances.filter((a) => {
      const attDate = new Date(a.date).setHours(0, 0, 0, 0);
      return attDate === dayTimestamp && a.clockInTime;
    });
    const count = dayAttendances.length;
    const isToday = d.getTime() === today.getTime();
    const isFuture = d.getTime() > today.getTime();
    const pct = totalPegawai > 0 ? Math.round((count / totalPegawai) * 100) : 0;
    return {
      dayName: dayNames[idx],
      dateStr: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      count,
      pct,
      isToday,
      isFuture,
    };
  });

  // Breakdown Per Unit Kerja / Departemen
  const unitStatsMap = new Map<string, { total: number; hadir: number }>();
  const presentUserIds = new Set(
    attendancesToday.filter((a) => a.clockInTime).map((a) => a.userId)
  );

  for (const u of allActiveUsers) {
    const unit = u.unitKerja?.trim() || 'Unit Lainnya';
    if (!unitStatsMap.has(unit)) {
      unitStatsMap.set(unit, { total: 0, hadir: 0 });
    }
    const stat = unitStatsMap.get(unit)!;
    stat.total += 1;
    if (presentUserIds.has(u.id)) {
      stat.hadir += 1;
    }
  }

  const unitStats = Array.from(unitStatsMap.entries())
    .map(([name, data]) => ({
      name,
      total: data.total,
      hadir: data.hadir,
      percent: data.total > 0 ? Math.round((data.hadir / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // 5 Presensi Masuk Terkini
  const recentClockIns = attendancesToday.filter((a) => a.clockInTime).slice(0, 5);

  const formattedToday = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Compact Page Header - Clean, Focused & Space-Saving */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Overview Kehadiran
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {formattedToday} • Jam Operasional: {campusSetting?.workStart} - {campusSetting?.workEnd} WITA • Radius Geofence: {campusSetting?.radiusMeters}m
            </p>
          </div>

          <Link
            href="/admin/monitoring"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 border border-sky-200/80 transition shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-sky-600" />
            <span>Monitor Hari Ini</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Metrik Utama (Responsif: 2 kolom di HP, 4 kolom di layar lebar) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-200 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pegawai</span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">{totalPegawai}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">{totalAtasan} Pejabat Penilai</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-200 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Hadir Hari Ini</span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {hadirMasuk}{' '}
              <span className="text-xs font-semibold text-emerald-600 font-sans">({persentaseHadir}%)</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">{tepatWaktu} Tepat Waktu</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-200 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Terlambat Masuk</span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                <ClockAlert className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">{terlambat}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">{dinasLuar} Tugas Dinas Luar</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-rose-200 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Belum Presensi</span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums">{belumHadir}</p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">{pendingLeaves} Izin Menunggu</p>
          </div>
        </div>

        {/* Bagian Visualisasi Analitik & Aktivitas Terkini */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kolom Kiri: Tren Mingguan & Distribusi Unit Kerja */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tren Kehadiran Mingguan (Senin - Jumat) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sky-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      Tren Kehadiran Mingguan (Senin - Jumat)
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tingkat kedisiplinan dan absensi civitas akademika minggu berjalan
                  </p>
                </div>
                <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200/80 rounded-full text-xs font-bold font-mono">
                  Target: 100%
                </span>
              </div>

              {/* Bar Chart Visual SVG */}
              <div className="grid grid-cols-5 gap-3 pt-4 pb-2 items-end h-44 border-b border-slate-100">
                {weeklyStats.map((stat, idx) => {
                  const maxBarHeight = 120; // px
                  const barHeight = Math.max(8, Math.round((stat.pct / 100) * maxBarHeight));

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[11px] font-bold font-mono text-slate-700 tabular-nums">
                        {stat.isFuture ? '-' : `${stat.count}`}
                      </span>

                      <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl h-[120px] flex items-end justify-center p-1">
                        <div
                          style={{ height: stat.isFuture ? '4px' : `${barHeight}px` }}
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            stat.isFuture
                              ? 'bg-slate-200'
                              : stat.isToday
                              ? 'bg-gradient-to-t from-sky-600 to-sky-400 shadow-sm'
                              : 'bg-sky-600/75'
                          }`}
                        />
                      </div>

                      <div className="text-center mt-1">
                        <span
                          className={`text-xs font-bold block ${
                            stat.isToday ? 'text-sky-700 underline font-extrabold' : 'text-slate-700'
                          }`}
                        >
                          {stat.dayName}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{stat.dateStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-gradient-to-t from-sky-600 to-sky-400 inline-block" />
                  Hari Ini ({persentaseHadir}% Presensi)
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Basis: {totalPegawai} Pegawai Aktif
                </span>
              </div>
            </div>

            {/* Breakdown Berdasarkan Unit Kerja */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Distribusi Kehadiran Unit Kerja Hari Ini
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {unitStats.length} Unit Kerja
                </span>
              </div>

              <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
                {unitStats.map((unit, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[280px]">
                        {unit.name}
                      </span>
                      <span className="text-slate-600 font-mono tabular-nums font-medium">
                        <strong>{unit.hadir}</strong> / {unit.total}{' '}
                        <span className="text-sky-700 font-bold ml-1">
                          ({unit.percent}%)
                        </span>
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${unit.percent}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          unit.percent === 100
                            ? 'bg-sky-600'
                            : unit.percent > 50
                            ? 'bg-sky-500'
                            : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Aktivitas Presensi Masuk Terkini (Live Feed) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs h-full flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">
                    Aktivitas Presensi Terkini
                  </h2>
                </div>
                <Link
                  href="/admin/monitoring"
                  className="text-xs text-sky-700 hover:text-sky-800 font-bold flex items-center gap-1 group"
                >
                  <span>Selengkapnya</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </Link>
              </div>

              {recentClockIns.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
                  <Users className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                  <p className="text-xs font-semibold text-slate-600">Belum ada presensi masuk hari ini</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Catatan kehadiran pegawai yang masuk akan muncul secara live di feed ini.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 space-y-2">
                  {recentClockIns.map((att) => {
                    const timeStr = att.clockInTime
                      ? new Date(att.clockInTime).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-';

                    return (
                      <div key={att.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Foto Selfie Avatar */}
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            {att.clockInPhoto ? (
                              <Image
                                src={att.clockInPhoto}
                                alt={att.user.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-700 font-bold text-xs uppercase">
                                {att.user.name.slice(0, 2)}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {att.user.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {att.user.jabatan} • No. ID: {att.user.nip}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-emerald-800 font-medium">
                                {att.locationName || 'Kampus STIMI'}
                              </span>
                              {att.clockInLat && att.clockInLng && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  • {getRegionDescription(att.clockInLat, att.clockInLng)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {(() => {
                            const tz = getTimezoneFromCoordinates(att.clockInLng);
                            const isWib = tz === 'Asia/Jakarta';
                            const isWit = tz === 'Asia/Jayapura';
                            const tzLabel = isWib ? 'WIB' : isWit ? 'WIT' : 'WITA';
                            const localTime = new Date(att.clockInTime!).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: tz,
                            });
                            const witaTime = new Date(att.clockInTime!).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Asia/Makassar',
                            });

                            if (tzLabel === 'WITA') {
                              return (
                                <span className="font-mono tabular-nums text-xs font-bold text-slate-900 block">
                                  {witaTime}{' '}
                                  <span className="text-[10px] font-sans font-normal text-slate-500">
                                    WITA
                                  </span>
                                </span>
                              );
                            }

                            return (
                              <div>
                                <span className="font-mono tabular-nums text-xs font-bold text-slate-900 flex items-center justify-end gap-1">
                                  {localTime}{' '}
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-sans font-bold uppercase">
                                    {tzLabel}
                                  </span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  ({witaTime} WITA)
                                </span>
                              </div>
                            );
                          })()}
                          <span
                            className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold mt-1 ${
                              att.isDinasLuar
                                ? 'bg-purple-100 text-purple-800'
                                : att.clockInStatus === 'TEPAT_WAKTU'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {att.isDinasLuar ? 'Dinas Luar' : att.clockInStatus === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
