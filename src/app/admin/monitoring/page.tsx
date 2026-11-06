import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { getStartOfDay } from '@/lib/time';
import { MonitoringDateFilter } from '@/components/admin/MonitoringDateFilter';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Camera,
  Building2,
  Users,
  Clock,
  UserX,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AdminMonitoringPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function AdminMonitoringPage({ searchParams }: AdminMonitoringPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  const resolvedParams = await searchParams;
  const today = getStartOfDay();

  let targetDate = today;
  let currentDateStr = today.toISOString().split('T')[0];

  if (resolvedParams?.date) {
    const parsed = new Date(resolvedParams.date + 'T00:00:00');
    if (!isNaN(parsed.getTime())) {
      targetDate = getStartOfDay(parsed);
      currentDateStr = resolvedParams.date;
    }
  }

  const isToday = targetDate.getTime() === today.getTime();

  const formattedDateDisplay = targetDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Ambil semua pegawai aktif beserta presensi pada tanggal target
  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      assignedLocation: true,
      attendances: {
        where: { date: targetDate },
        include: {
          location: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Hitung ringkasan statistik kehadiran
  const totalEmployees = users.length;
  const attendedUsers = users.filter((u) => u.attendances.length > 0 && u.attendances[0].clockInTime);
  const totalHadir = attendedUsers.length;
  const tepatWaktu = attendedUsers.filter((u) => u.attendances[0].clockInStatus === 'TEPAT_WAKTU').length;
  const terlambat = attendedUsers.filter((u) => u.attendances[0].clockInStatus === 'TERLAMBAT').length;
  const dinasLuar = attendedUsers.filter((u) => u.attendances[0].isDinasLuar).length;
  const belumPresensi = totalEmployees - totalHadir;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Halaman */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              Monitoring Kehadiran Pegawai
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau langsung presensi masuk, jam pulang, status kedisiplinan, gedung, dan foto selfie seluruh staf STIMI
            </p>
          </div>
        </div>

        {/* Filter Tanggal Interaktif (Hari Ini, Kemarin, Kalender) */}
        <MonitoringDateFilter
          currentDateStr={currentDateStr}
          formattedDateDisplay={formattedDateDisplay}
          isToday={isToday}
        />

        {/* Kartu Ringkasan Statistik (1 Baris Berjejer 4 Card) */}
        <div
          className="grid gap-3 w-full"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          }}
        >
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-sky-200 transition">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] sm:text-xs font-semibold truncate">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
              <span className="truncate">Total Pegawai</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 sm:mt-1.5 font-mono tabular-nums">{totalEmployees}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">Terdaftar aktif di sistem</p>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-emerald-200 transition">
            <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] sm:text-xs font-semibold truncate">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Hadir (Tepat Waktu)</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1 sm:mt-1.5 font-mono tabular-nums">{tepatWaktu}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5 truncate font-medium">
              {totalEmployees > 0 ? Math.round((tepatWaktu / totalEmployees) * 100) : 0}% kedisiplinan
            </p>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-rose-200 transition">
            <div className="flex items-center gap-1.5 text-rose-600 text-[11px] sm:text-xs font-semibold truncate">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Terlambat</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-rose-700 mt-1 sm:mt-1.5 font-mono tabular-nums">{terlambat}</p>
            <p className="text-[10px] text-rose-600 mt-0.5 truncate">Melewati batas jam masuk</p>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-amber-200 transition">
            <div className="flex items-center gap-1.5 text-amber-600 text-[11px] sm:text-xs font-semibold truncate">
              <UserX className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Belum Presensi</span>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-1 sm:mt-1.5 font-mono tabular-nums">{belumPresensi}</p>
            <p className="text-[10px] text-amber-600 mt-0.5 truncate">
              {dinasLuar > 0 ? `${dinasLuar} orang dinas luar kota` : 'Belum melakukan clock-in'}
            </p>
          </div>
        </div>

        {/* Tabel Monitoring */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Daftar Presensi: {formattedDateDisplay}
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {totalHadir} dari {totalEmployees} Pegawai Hadir
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Pegawai</th>
                  <th className="py-3.5 px-4 font-bold">Unit Kerja</th>
                  <th className="py-3.5 px-4 font-bold">Lokasi Presensi</th>
                  <th className="py-3.5 px-4 font-bold">Status Kehadiran</th>
                  <th className="py-3.5 px-4 font-bold">Jam Masuk</th>
                  <th className="py-3.5 px-4 font-bold">Jam Pulang</th>
                  <th className="py-3.5 px-4 font-bold">Jarak GPS</th>
                  <th className="py-3.5 px-4 font-bold text-center">Foto Bukti</th>
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
                        {att ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>{att.locationName || att.location?.name || 'Kampus STIMI'}</span>
                          </div>
                        ) : user.assignedLocation ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Target: {user.assignedLocation.name}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Fleksibel (Semua Gedung)</span>
                        )}
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
                            ±{Math.round(att.clockInDistance)}m
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {att?.clockInPhoto ? (
                            <a
                              href={att.clockInPhoto}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg inline-flex items-center gap-1 text-[10px] font-semibold transition"
                              title="Lihat Foto Selfie Masuk"
                            >
                              <Camera className="w-3 h-3" />
                              <span>Foto Masuk</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}

                          {att?.clockOutPhoto && (
                            <a
                              href={att.clockOutPhoto}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg inline-flex items-center gap-1 text-[10px] font-semibold transition"
                              title="Lihat Foto Selfie Pulang"
                            >
                              <Camera className="w-3 h-3" />
                              <span>Foto Pulang</span>
                            </a>
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
