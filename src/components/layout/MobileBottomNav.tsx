'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  CalendarCheck,
  FileText,
  Clock,
  ShieldAlert,
  BarChart3,
  Users,
  Settings,
} from 'lucide-react';

export function MobileBottomNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) return null;

  const role = session.user.role;

  const getLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { href: '/admin/dashboard', label: 'Ringkasan', icon: BarChart3 },
          { href: '/admin/monitoring', label: 'Monitoring', icon: Clock },
          { href: '/admin/pegawai', label: 'Pegawai', icon: Users },
          { href: '/admin/pengaturan', label: 'Gedung', icon: Settings },
          { href: '/admin/laporan', label: 'Laporan', icon: FileText },
        ];
      case 'ATASAN':
        return [
          { href: '/atasan/dashboard', label: 'Presensi', icon: CalendarCheck },
          { href: '/atasan/approval', label: 'Persetujuan', icon: ShieldAlert },
          { href: '/pegawai/riwayat', label: 'Riwayat', icon: Clock },
        ];
      case 'PEGAWAI':
      default:
        return [
          { href: '/pegawai/dashboard', label: 'Presensi', icon: CalendarCheck },
          { href: '/pegawai/pengajuan', label: 'Cuti & Dinas', icon: FileText },
          { href: '/pegawai/riwayat', label: 'Riwayat', icon: Clock },
        ];
    }
  };

  const links = getLinks();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 py-2 px-3 shadow-lg safe-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 relative ${
                isActive
                  ? 'text-sky-700 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition ${
                  isActive ? 'bg-sky-100/80 text-sky-700 shadow-2xs border border-sky-200/60' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[70px]">
                {link.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600 absolute -bottom-1" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
