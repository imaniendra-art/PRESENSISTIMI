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

  const { user, campusSetting, todayAttendance, activeDutyTrip } =
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
        {/* Banner Atasan */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-emerald-200 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Portal Pimpinan / Pejabat Penilai STIMI</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Dashboard Atasan: {user.name}
            </h1>
            <p className="text-slate-300 text-xs mt-1">
              {user.jabatan} • Membina {bawahan.length} Pegawai / Dosen
            </p>
          </div>

          {totalPending > 0 ? (
            <Link
              href="/atasan/approval"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition shrink-0"
            >
              <span>{totalPending} Permohonan Menunggu Persetujuan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="bg-white/10 px-4 py-3 rounded-2xl border border-white/10 text-center sm:text-right">
              <span className="text-[11px] text-emerald-300 block">Status Verifikasi Tim</span>
              <span className="text-xs font-bold text-white">Semua Permohonan Beres ✓</span>
            </div>
          )}
        </div>

        {/* Ringkasan Tim */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Staf Binaan</p>
              <p className="text-xl font-extrabold text-slate-800">{bawahan.length} Orang</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase">Perlu Tindakan</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-extrabold text-slate-800">{totalPending} Berkas</p>
                {totalPending > 0 && (
                  <Link
                    href="/atasan/approval"
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Buka Inbox &rarr;
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
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
            todayAttendance={todayAttendance}
            activeDutyTrip={activeDutyTrip}
          />
        </div>
      </main>
    </div>
  );
}
