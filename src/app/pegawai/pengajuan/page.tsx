import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { RequestTabs } from '@/components/requests/RequestTabs';

export const dynamic = 'force-dynamic';

export default async function PengajuanPegawaiPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  const [myLeaves, myTrips] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { userId },
      include: { approver: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.dutyTrip.findMany({
      where: { userId },
      include: { approver: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Pengajuan Cuti, Izin & Dinas Luar Kota
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ajukan permohonan ketidakhadiran atau tugas luar kampus dengan alur persetujuan pejabat penilai
          </p>
        </div>

        <RequestTabs myLeaves={myLeaves} myTrips={myTrips} />
      </main>
    </div>
  );
}
