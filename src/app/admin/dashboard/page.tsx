import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';
import { getStartOfDay } from '@/lib/time';
import {
  Users,
  CheckCircle2,
  ClockAlert,
  Settings,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  const today = getStartOfDay();

  // Ambil metrik ringkas
  const [totalPegawai, totalAtasan, attendancesToday, pendingLeaves, campusSetting] =
    await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'ATASAN', isActive: true } }),
      prisma.attendance.findMany({
        where: { date: today },
        include: { user: true },
      }),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.campusSetting.findFirst(),
    ]);

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Admin */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-200 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Portal Administrator SDM STIMI</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Pusat Kendali Kepegawaian & Presensi
            </h1>
            <p className="text-slate-300 text-xs mt-1">
              {campusSetting?.campusName} • Radius Geofence Aktif: {campusSetting?.radiusMeters} Meter
            </p>
          </div>

          <Link
            href="/admin/monitoring"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition shrink-0"
          >
            <Activity className="w-4 h-4" />
            <span>Pantau Kehadiran Real-Time Hari Ini</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Metrik Utama */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Pegawai</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totalPegawai}</p>
            <p className="text-[11px] text-slate-500 mt-1">{totalAtasan} Pejabat Penilai</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Hadir Hari Ini</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">
              {hadirMasuk}{' '}
              <span className="text-xs font-normal text-emerald-600">({persentaseHadir}%)</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">{tepatWaktu} Tepat Waktu</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Terlambat Masuk</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <ClockAlert className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{terlambat}</p>
            <p className="text-[11px] text-slate-500 mt-1">{dinasLuar} Tugas Dinas Luar</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase">Belum Presensi</span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{belumHadir}</p>
            <p className="text-[11px] text-slate-500 mt-1">{pendingLeaves} Izin Menunggu</p>
          </div>
        </div>

        {/* Menu Akses Cepat Admin */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/pegawai"
            className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-indigo-300 transition shadow-xs group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center mb-3 transition shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
              Kelola Data Pegawai
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tambah dosen/staf baru, reset sandi, penataan hierarki atasan langsung, dan status akun.
            </p>
          </Link>

          <Link
            href="/admin/pengaturan"
            className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-indigo-300 transition shadow-xs group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center mb-3 transition shadow-xs">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition">
              Pengaturan Kampus & Geofence
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Konfigurasi titik latitude/longitude kampus, radius toleransi meter, dan jam kerja standar.
            </p>
          </Link>

          <Link
            href="/admin/laporan"
            className="p-5 bg-white rounded-3xl border border-slate-200 hover:border-indigo-300 transition shadow-xs group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center mb-3 transition shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition">
              Rekapitulasi & Ekspor Laporan
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Unduh laporan kehadiran bulanan format Excel (.xlsx) dan pratinjau cetak resmi PDF.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
