import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { EmployeeManager } from '@/components/admin/EmployeeManager';

export const dynamic = 'force-dynamic';

export default async function AdminPegawaiPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  const [users, superiors, campusLocations, workSchedules] = await Promise.all([
    prisma.user.findMany({
      include: {
        atasan: true,
        assignedLocation: true,
        workSchedule: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      where: {
        role: { in: ['ATASAN', 'ADMIN'] },
        isActive: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.campusLocation.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.workSchedule.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-8 space-y-2.5 sm:space-y-6">
        <EmployeeManager
          users={users}
          superiors={superiors}
          campusLocations={campusLocations}
          workSchedules={workSchedules}
        />
      </main>
    </div>
  );
}
