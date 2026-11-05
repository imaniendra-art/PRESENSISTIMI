import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { ApprovalList } from '@/components/approval/ApprovalList';

export const dynamic = 'force-dynamic';

export default async function AtasanApprovalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Dapatkan daftar staf bawahan (atau jika Admin, tampilkan semua yang pending)
  const isSuperAdmin = session.user.role === 'ADMIN';

  let filterUserId = {};
  if (!isSuperAdmin) {
    const bawahan = await prisma.user.findMany({
      where: { atasanId: session.user.id },
      select: { id: true },
    });
    const bawahanIds = bawahan.map((b) => b.id);
    filterUserId = { in: bawahanIds };
  }

  const [pendingLeaves, pendingTrips] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        ...(isSuperAdmin ? {} : { userId: filterUserId }),
        status: 'PENDING',
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.dutyTrip.findMany({
      where: {
        ...(isSuperAdmin ? {} : { userId: filterUserId }),
        status: 'PENDING',
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Persetujuan Permohonan Tim (*Approval Inbox*)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verifikasi dan berikan keputusan atas permohonan cuti, izin, dan dinas luar kota staf
          </p>
        </div>

        <ApprovalList pendingLeaves={pendingLeaves} pendingTrips={pendingTrips} />
      </main>
    </div>
  );
}
