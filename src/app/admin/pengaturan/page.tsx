import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { CampusSettingsForm } from '@/components/admin/CampusSettingsForm';
import { ensureDefaultWorkSchedules } from '@/actions/adminActions';

export const dynamic = 'force-dynamic';

export default async function AdminPengaturanPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  let setting = await prisma.campusSetting.findFirst();
  if (!setting) {
    setting = await prisma.campusSetting.create({
      data: {
        campusName: 'STIMI Makassar',
        address: 'Jl. Kampus STIMI Makassar, Sulawesi Selatan',
        latitude: -5.147665,
        longitude: 119.432732,
        radiusMeters: 100.0,
        workStart: '08:00',
        workEnd: '16:30',
        gracePeriodMinutes: 15,
      },
    });
  }

  await ensureDefaultWorkSchedules();

  const [locations, workSchedules] = await Promise.all([
    prisma.campusLocation.findMany({
      include: {
        _count: {
          select: { assignedUsers: true, attendances: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    (prisma as any).workSchedule.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 sm:pb-8 space-y-2.5 sm:space-y-6">
        <CampusSettingsForm
          setting={setting}
          locations={locations}
          workSchedules={workSchedules}
        />
      </main>
    </div>
  );
}
