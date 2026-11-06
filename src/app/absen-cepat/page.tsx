import { prisma } from '@/lib/prisma';
import { QuickPresenceCard } from '@/components/presence/QuickPresenceCard';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Presensi Cepat — PRESENSISTIMI',
  description: 'Mode presensi cepat tanpa login untuk dosen dan tenaga kependidikan STIMI Makassar.',
};

export default async function AbsenCepatPage() {
  let campusSetting = await prisma.campusSetting.findFirst();

  if (!campusSetting) {
    campusSetting = await prisma.campusSetting.create({
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

  const campusLocations = await prisma.campusLocation.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Top Bar Branding */}
      <div className="max-w-lg mx-auto w-full flex items-center justify-center mb-5">
        <Link href="/" className="flex items-center gap-2.5 group text-center">
          <Image
            src="/logo.png"
            alt="Logo STIMI Makassar"
            width={40}
            height={40}
            priority
            className="w-10 h-10 object-contain drop-shadow-xs"
          />
          <div className="text-left">
            <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-none">
              PRESENSI<span className="text-sky-600">STIMI</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-600 font-bold tracking-wider uppercase block mt-1">
              PORTAL KEHADIRAN STIMI YAPMI MAKASSAR
            </span>
          </div>
        </Link>
      </div>

      {/* Main Card Component */}
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full">
          <QuickPresenceCard
            campusSetting={campusSetting}
            campusLocations={campusLocations}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-[11px] text-slate-400">
        &copy; {new Date().getFullYear()} Sekolah Tinggi Ilmu Manajemen Indonesia (STIMI) Makassar. All rights reserved.
      </footer>
    </div>
  );
}
