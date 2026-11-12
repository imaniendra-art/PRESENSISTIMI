import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/layout/Navbar';
import { Calendar, Clock, MapPin, CheckCircle2, AlertTriangle, Briefcase, Camera } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RiwayatPegawaiPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const attendances = await prisma.attendance.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      dutyTrip: true,
    },
    orderBy: {
      date: 'desc',
    },
    take: 30,
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              Riwayat Presensi Pegawai
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar catatan kehadiran Anda selama 30 hari kerja terakhir
            </p>
          </div>
        </div>

        {/* Tabel / Kartu Riwayat */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {attendances.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Belum Ada Catatan Kehadiran</p>
              <p className="text-xs mt-1">Presensi pertama Anda akan tercatat secara otomatis di sini.</p>
            </div>
          ) : (
            <>
              {/* Tampilan Khusus Mobile: Kartu Vertikal Ringkas (sm:hidden) */}
              <div className="block sm:hidden divide-y divide-slate-100">
                {attendances.map((item) => (
                  <div key={`mob-${item.id}`} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {new Date(item.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        {item.clockInDistance !== null && (
                          <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{Math.round(item.clockInDistance)}m dari gedung</span>
                          </p>
                        )}
                      </div>

                      <div>
                        {item.isDinasLuar ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Briefcase className="w-3 h-3" />
                            <span>Dinas Luar</span>
                          </span>
                        ) : item.clockInStatus === 'TEPAT_WAKTU' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Tepat Waktu</span>
                          </span>
                        ) : item.clockInStatus === 'TERLAMBAT' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Terlambat</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </div>
                    </div>

                    {/* Jam Masuk & Pulang */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Masuk</span>
                        {item.clockInTime ? (
                          <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(item.clockInTime).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Pulang</span>
                        {item.clockOutTime ? (
                          <span className="font-bold text-sky-700 flex items-center gap-1 mt-0.5 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(item.clockOutTime).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum Pulang</span>
                        )}
                      </div>
                    </div>

                    {/* Foto & Catatan */}
                    {(item.clockInPhoto || item.clockOutPhoto || item.clockInNote || item.dutyTrip?.title) && (
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <p className="text-[11px] text-slate-500 truncate flex-1">
                          {item.clockInNote || item.dutyTrip?.title || ''}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.clockInPhoto && (
                            <a
                              href={item.clockInPhoto}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg inline-flex items-center gap-1 text-[10px] font-semibold transition border border-slate-200/60"
                            >
                              <Camera className="w-3 h-3 text-slate-500" />
                              <span>Foto Masuk</span>
                            </a>
                          )}
                          {item.clockOutPhoto && (
                            <a
                              href={item.clockOutPhoto}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg inline-flex items-center gap-1 text-[10px] font-semibold transition border border-slate-200/60"
                            >
                              <Camera className="w-3 h-3 text-slate-500" />
                              <span>Foto Pulang</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Tampilan Desktop / Tablet: Tabel Lengkap (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Tanggal</th>
                      <th className="py-3.5 px-4 font-bold">Jam Masuk</th>
                      <th className="py-3.5 px-4 font-bold">Jam Pulang</th>
                      <th className="py-3.5 px-4 font-bold">Status Kehadiran</th>
                      <th className="py-3.5 px-4 font-bold">Jarak Kampus</th>
                      <th className="py-3.5 px-4 font-bold">Bukti Selfie</th>
                      <th className="py-3.5 px-4 font-bold">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {attendances.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {new Date(item.date).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.clockInTime ? (
                            <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {new Date(item.clockInTime).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.clockOutTime ? (
                            <div className="flex items-center gap-1.5 font-medium text-blue-700">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {new Date(item.clockOutTime).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Belum Pulang</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.isDinasLuar ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Briefcase className="w-3 h-3" />
                              <span>Dinas Luar</span>
                            </span>
                          ) : item.clockInStatus === 'TEPAT_WAKTU' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Tepat Waktu</span>
                            </span>
                          ) : item.clockInStatus === 'TERLAMBAT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Terlambat</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                          {item.clockInDistance !== null ? (
                            <span className="flex items-center gap-1 font-mono">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{Math.round(item.clockInDistance)}m</span>
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {item.clockInPhoto && (
                              <a
                                href={item.clockInPhoto}
                                target="_blank"
                                rel="noreferrer"
                                title="Lihat Selfie Masuk"
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg inline-flex items-center gap-1 text-[10px] font-medium transition"
                              >
                                <Camera className="w-3 h-3" />
                                <span>Masuk</span>
                              </a>
                            )}
                            {item.clockOutPhoto && (
                              <a
                                href={item.clockOutPhoto}
                                target="_blank"
                                rel="noreferrer"
                                title="Lihat Selfie Pulang"
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg inline-flex items-center gap-1 text-[10px] font-medium transition"
                              >
                                <Camera className="w-3 h-3" />
                                <span>Pulang</span>
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                          {item.clockInNote || item.dutyTrip?.title || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
