import { prisma } from '@/lib/prisma';
import { QuickPresenceCard } from '@/components/presence/QuickPresenceCard';
import Image from 'next/image';
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-3 px-3 sm:p-6">
      <div className="w-full max-w-md mx-auto">
        {/* Header Institusi - Dekat Kolom & Proporsional Layar Tunggal HP */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center justify-center mb-1.5">
            <Image
              src="/logo.png"
              alt="Logo STIMI Makassar"
              width={56}
              height={56}
              priority
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-xs"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
            PRESENSI<span className="text-sky-600">STIMI</span>
          </h1>
          <p className="text-slate-500 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mt-1">
            PORTAL KEHADIRAN STIMI YAPMI MAKASSAR
          </p>
        </div>

        {/* Main Card Component */}
        <QuickPresenceCard
          campusSetting={campusSetting}
          campusLocations={campusLocations}
        />

        {/* Footer */}
        <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-3 sm:mt-4">
          &copy; {new Date().getFullYear()} STIMI YAPMI Makassar. Seluruh Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
}
