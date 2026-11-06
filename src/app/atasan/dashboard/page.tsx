import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { PresensiCard } from '@/components/presence/PresensiCard';
import { getPresenceInitialData } from '@/actions/presenceActions';
import Link from 'next/link';
import { Users, ClipboardCheck, ArrowRight, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AtasanDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { user, campusSetting, campusLocations, todayAttendance, activeDutyTrip } =
    await getPresenceInitialData();

  // Dapatkan daftar bawahan
  const bawahan = await prisma.user.findMany({
    where: { atasanId: user.id },
    select: { id: true, name: true, nip: true, jabatan: true },
  });

  const bawahanIds = bawahan.map((b) => b.id);

  // Hitung jumlah pengajuan yang pending dari bawahan
  const [pendingLeavesCount, pendingTripsCount] = await Promise.all([
    prisma.leaveRequest.count({
      where: {
        userId: { in: bawahanIds },
        status: 'PENDING',
      },
    }),
    prisma.dutyTrip.count({
      where: {
        userId: { in: bawahanIds },
        status: 'PENDING',
      },
    }),
  ]);

  const totalPending = pendingLeavesCount + pendingTripsCount;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Atasan - Fresh Sky Blue Theme Selaras */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 rounded-3xl p-6 text-white shadow-xl shadow-sky-600/15 border border-sky-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 border border-white/30 rounded-full text-white text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-100" />
              <span>Portal Pimpinan / Pejabat Penilai STIMI</span>
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

        {/* Panel Notifikasi Persetujuan Tim Bawahan */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Persetujuan Cuti & Dinas Luar Tim ({totalPending} Menunggu)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ada permohonan staf binaan Anda yang membutuhkan verifikasi dan keputusan Anda.
              </p>
            </div>
          </div>

          <Link
            href="/atasan/approval"
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-sky-600/20 self-start sm:self-auto shrink-0"
          >
            <span>Buka Inbox Approval</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Statistik Tim & Unit Kerja */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Staf Binaan Langsung</p>
              <p className="text-base font-bold text-slate-800">{bawahan.length} Dosen / Pegawai</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Unit Kerja</p>
              <p className="text-sm font-bold text-slate-800 truncate">{user.unitKerja}</p>
            </div>
          </div>
        </div>

        {/* Presensi Pribadi Atasan */}
        <div className="max-w-3xl mx-auto pt-2">
          <div className="mb-3 text-center sm:text-left">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Presensi Kehadiran Pribadi Pimpinan
            </h2>
          </div>
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
