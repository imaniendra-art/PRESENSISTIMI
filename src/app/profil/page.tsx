import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { UserCheck, Settings, BookOpen, Download } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Profil & Pengaturan Akun | STIMI Makassar',
  description: 'Kelola informasi profil, foto avatar, kontak, dan kata sandi akun presensi STIMI Makassar',
};

export default async function ProfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      atasan: { select: { name: true, jabatan: true } },
      assignedLocation: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  const createdAtFormatted = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  const userProfileData = {
    id: user.id,
    nip: user.nip,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    jabatan: user.jabatan,
    unitKerja: user.unitKerja,
    avatarUrl: user.avatarUrl,
    assignedLocationName: user.assignedLocation?.name || null,
    assignedLocationAddress: user.assignedLocation?.address || null,
    atasanName: user.atasan ? `${user.atasan.name} (${user.atasan.jabatan})` : null,
    createdAt: createdAtFormatted,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-8">
        {/* Header Halaman */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Profil & Keamanan Akun
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Kelola foto profil avatar, nomor WhatsApp, email, dan perbarui kata sandi akun Anda
            </p>
          </div>

          {session.user.role === 'ADMIN' && (
            <Link
              href="/admin/pengaturan"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:text-sky-700 hover:border-sky-300 rounded-xl text-xs font-semibold shadow-2xs transition self-start sm:self-auto cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-sky-600" />
              <span>Pengaturan Kampus</span>
            </Link>
          )}
        </div>

        {/* Editor Profil & Password */}
        <ProfileEditor initialUser={userProfileData} />

        {/* Kartu Pusat Bantuan & Buku Pedoman Penggunaan */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-sky-600/15 border border-sky-400/30 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 border border-white/30 rounded-full text-white text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-sky-100" />
              <span>Pusat Bantuan & Buku Pedoman Resmi</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              Buku Pedoman Penggunaan PRESENSISTIMI
            </h2>
            <p className="text-xs text-sky-100 leading-relaxed">
              Panduan lengkap operasional presensi selfie, geofencing GPS, tata cara pengajuan cuti & dinas luar, serta solusi kendala izin kamera/lokasi di ponsel Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/pedoman"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-sky-700 hover:bg-sky-50 active:bg-sky-100 rounded-xl text-xs font-bold shadow-md shadow-sky-950/20 transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>Buka Pedoman Interaktif</span>
            </Link>

            <a
              href="/api/pedoman/download"
              download
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white/20 hover:bg-white/30 active:bg-white/40 border border-white/30 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition cursor-pointer"
              title="Unduh langsung berkas pedoman format Markdown (.md)"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Berkas</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
