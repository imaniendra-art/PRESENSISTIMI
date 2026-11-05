import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { ReportGenerator } from '@/components/admin/ReportGenerator';

export const dynamic = 'force-dynamic';

export default async function AdminLaporanPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const firstDay = new Date(currentYear, now.getMonth(), 1);
  const lastDay = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59);

  const [campusSetting, users, attendances] = await Promise.all([
    prisma.campusSetting.findFirst(),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.attendance.findMany({
      where: {
        date: {
          gte: firstDay,
          lte: lastDay,
        },
      },
    }),
  ]);

  const reportData = users.map((u) => {
    const userAtts = attendances.filter((a) => a.userId === u.id);
    const totalHadir = userAtts.filter((a) => a.clockInTime).length;
    const tepatWaktu = userAtts.filter((a) => a.clockInStatus === 'TEPAT_WAKTU').length;
    const terlambat = userAtts.filter((a) => a.clockInStatus === 'TERLAMBAT').length;
    const dinasLuar = userAtts.filter((a) => a.isDinasLuar).length;

    return {
      nip: u.nip,
      name: u.name,
      jabatan: u.jabatan,
      unitKerja: u.unitKerja,
      totalHadir,
      tepatWaktu,
      terlambat,
      dinasLuar,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Rekapitulasi Kehadiran & Ekspor Laporan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unduh rekap data presensi ke format Excel (.xlsx) atau cetak format resmi PDF untuk arsip institusi
          </p>
        </div>

        {campusSetting && (
          <ReportGenerator
            campusSetting={campusSetting}
            reportData={reportData}
            selectedMonth={currentMonth}
            selectedYear={currentYear}
          />
        )}
      </main>
    </div>
  );
}
