'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  CalendarCheck,
  FileText,
  Users,
  Settings,
  BarChart3,
  LogOut,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) return null;

  const role = session.user.role;

  const getNavLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { href: '/admin/dashboard', label: 'Overview', icon: BarChart3 },
          { href: '/admin/monitoring', label: 'Monitor Hari Ini', icon: Clock },
          { href: '/admin/pegawai', label: 'Data Pegawai', icon: Users },
          { href: '/admin/pengaturan', label: 'Pengaturan', icon: Settings },
          { href: '/admin/laporan', label: 'Rekap & Ekspor', icon: FileText },
        ];
      case 'ATASAN':
        return [
          { href: '/atasan/dashboard', label: 'Presensi Saya', icon: CalendarCheck },
          { href: '/atasan/approval', label: 'Persetujuan Tim', icon: ShieldAlert },
          { href: '/pegawai/riwayat', label: 'Riwayat Kehadiran', icon: FileText },
        ];
      case 'PEGAWAI':
      default:
        return [
          { href: '/pegawai/dashboard', label: 'Presensi', icon: CalendarCheck },
          { href: '/pegawai/pengajuan', label: 'Cuti & Dinas Luar', icon: FileText },
          { href: '/pegawai/riwayat', label: 'Riwayat Saya', icon: Clock },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Logo STIMI Makassar"
                  width={40}
                  height={40}
                  priority
                  className="w-10 h-10 object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-none">
                  PRESENSI<span className="text-sky-600">STIMI</span>
                </span>
                <span className="text-[9px] text-slate-500 font-bold tracking-wider uppercase block mt-0.5">
                  PORTAL KEHADIRAN STIMI YAPMI MAKASSAR
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/profil"
              className={`flex items-center gap-2.5 p-1 sm:p-1.5 sm:pr-2.5 rounded-2xl transition border group ${
                pathname === '/profil'
                  ? 'bg-sky-50 border-sky-300 text-sky-800'
                  : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
              }`}
              title="Buka Profil & Pengaturan Akun"
            >
              {session.user.image ? (
                <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-2xs">
                  {(session.user.name || 'U').slice(0, 2)}
                </div>
              )}

              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 group-hover:text-sky-700 transition leading-tight">
                  {session.user.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-500 font-mono">
                    No. ID: {session.user.nip}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : role === 'ATASAN'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {role}
                  </span>
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Keluar dari Akun"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200/60 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
