import { getPresenceInitialData } from '@/actions/presenceActions';
import { PresensiCard } from '@/components/presence/PresensiCard';
import { Navbar } from '@/components/layout/Navbar';
import { prisma } from '@/lib/prisma';
import { Calendar, CheckCircle, ClockAlert, Award } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PegawaiDashboardPage() {
  const { user, campusSetting, campusLocations, todayAttendance, activeDutyTrip } =
    await getPresenceInitialData();

  // Ambil data statistik kehadiran bulan berjalan untuk pegawai ini
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthAttendances = await prisma.attendance.findMany({
    where: {
      userId: user.id,
      date: { gte: firstDayOfMonth },
    },
    orderBy: { date: 'desc' },
  });

  const totalHadir = monthAttendances.filter((a) => a.clockInTime).length;
  const tepatWaktu = monthAttendances.filter(
    (a) => a.clockInStatus === 'TEPAT_WAKTU'
  ).length;
  const terlambat = monthAttendances.filter(
    (a) => a.clockInStatus === 'TERLAMBAT'
  ).length;
  const dinasLuar = monthAttendances.filter((a) => a.isDinasLuar).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Profil Pegawai - Fresh Sky Blue Theme Selaras */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 rounded-3xl p-6 text-white shadow-xl shadow-sky-600/15 relative overflow-hidden border border-sky-400/30">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 border border-white/30 rounded-full text-white text-xs font-semibold mb-2">
                <Award className="w-3.5 h-3.5 text-sky-100" />
                <span>Portal Kepegawaian STIMI</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Selamat Datang, {user.name}
              </h1>
              <p className="text-sky-100 text-xs mt-1">
                {user.jabatan} • {user.unitKerja} (NIP: {user.nip})
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/30 text-center sm:text-right">
              <span className="text-[11px] text-sky-100 block">Jam Operasional Hari Ini</span>
              <span className="text-sm font-bold text-white">
                {campusSetting.workStart} - {campusSetting.workEnd} WITA
              </span>
            </div>
          </div>
        </div>

        {/* Statistik Ringkas Bulan Ini */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Hadir Bulan Ini</p>
              <p className="text-lg font-bold text-slate-800">{totalHadir} Hari</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Tepat Waktu</p>
              <p className="text-lg font-bold text-slate-800">{tepatWaktu} Hari</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <ClockAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Terlambat</p>
              <p className="text-lg font-bold text-slate-800">{terlambat} Hari</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Dinas Luar</p>
              <p className="text-lg font-bold text-slate-800">{dinasLuar} Tugas</p>
            </div>
          </div>
        </div>

        {/* Kartu Presensi Kamera & Geofencing Real-Time */}
        <div className="max-w-3xl mx-auto">
          <PresensiCard
            campusSetting={campusSetting}
            campusLocations={campusLocations}
            todayAttendance={todayAttendance}
            activeDutyTrip={activeDutyTrip}
            assignedLocation={user.assignedLocation}
          />
        </div>
      </main>
    </div>
  );
}
