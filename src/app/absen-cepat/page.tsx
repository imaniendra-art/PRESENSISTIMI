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
      {/* Header Institusi - 100% Setema dengan Halaman Login */}
      <div className="w-full max-w-md mx-auto text-center mb-6">
        <div className="inline-flex items-center justify-center mb-3">
          <Image
            src="/logo.png"
            alt="Logo STIMI Makassar"
            width={72}
            height={72}
            priority
            className="w-16 h-16 sm:w-18 sm:h-18 object-contain drop-shadow-xs"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          PRESENSI<span className="text-sky-600">STIMI</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-[11px] font-bold tracking-wider uppercase mt-1">
          PORTAL KEHADIRAN STIMI YAPMI MAKASSAR
        </p>
      </div>

      {/* Main Card Component */}
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <QuickPresenceCard
            campusSetting={campusSetting}
            campusLocations={campusLocations}
          />
        </div>
      </main>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 mt-6">
        &copy; {new Date().getFullYear()} Sekolah Tinggi Ilmu Manajemen Indonesia (STIMI) YAPMI Makassar. Seluruh Hak Cipta Dilindungi.
      </p>
    </div>
  );
}
