import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { CampusSettingsForm } from '@/components/admin/CampusSettingsForm';

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

  const locations = await prisma.campusLocation.findMany({
    include: {
      _count: {
        select: { assignedUsers: true, attendances: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Pengaturan Multi-Gedung & Jam Kerja Kampus
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola titik lokasi seluruh gedung kampus STIMI Makassar, batas radius meter geofencing, dan aturan jam operasional
          </p>
        </div>

        <CampusSettingsForm setting={setting} locations={locations} />
      </main>
    </div>
  );
}
