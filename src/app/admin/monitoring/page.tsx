import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { getStartOfDay } from '@/lib/time';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Camera,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminMonitoringPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  const today = getStartOfDay();

  // Ambil semua pegawai aktif
  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      attendances: {
        where: { date: today },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Monitoring Kehadiran Real-Time Hari Ini
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            • Pantauan langsung status clock-in dan verifikasi foto selfie seluruh pegawai STIMI
          </p>
        </div>

        {/* Tabel Monitoring */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Pegawai</th>
                  <th className="py-3.5 px-4 font-bold">Unit Kerja</th>
                  <th className="py-3.5 px-4 font-bold">Status Hari Ini</th>
                  <th className="py-3.5 px-4 font-bold">Jam Masuk</th>
                  <th className="py-3.5 px-4 font-bold">Jam Pulang</th>
                  <th className="py-3.5 px-4 font-bold">Jarak Kampus</th>
                  <th className="py-3.5 px-4 font-bold">Foto Selfie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((user) => {
                  const att = user.attendances[0];
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">NIP: {user.nip}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800">{user.unitKerja}</p>
                        <p className="text-[10px] text-slate-500">{user.jabatan}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {!att ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Belum Presensi
                          </span>
                        ) : att.isDinasLuar ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Briefcase className="w-3 h-3" /> Dinas Luar
                          </span>
                        ) : att.clockInStatus === 'TEPAT_WAKTU' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Tepat Waktu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" /> Terlambat
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {att?.clockInTime ? (
                          <span className="font-mono font-bold text-slate-800">
                            {new Date(att.clockInTime).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {att?.clockOutTime ? (
                          <span className="font-mono font-bold text-slate-800">
                            {new Date(att.clockOutTime).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Belum</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {att?.clockInDistance !== null && att?.clockInDistance !== undefined ? (
                          <span className="flex items-center gap-1 font-mono text-slate-600">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {Math.round(att.clockInDistance)}m
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {att?.clockInPhoto ? (
                            <a
                              href={att.clockInPhoto}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg inline-flex items-center gap-1 text-[10px] font-semibold transition"
                            >
                              <Camera className="w-3 h-3" />
                              <span>Selfie</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
