'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Camera,
  X,
  MapPin,
} from 'lucide-react';
import { getTimezoneFromCoordinates } from '@/lib/time';
import { getRegionDescription } from '@/lib/geo';

export interface RecentActivityItem {
  id: string;
  user: {
    id: string;
    name: string;
    nip: string;
    jabatan: string;
    unitKerja?: string | null;
  };
  locationName?: string | null;
  clockInTime: string | null;
  clockInLat?: number | null;
  clockInLng?: number | null;
  clockInPhoto?: string | null;
  clockInStatus?: string | null;
  clockOutTime: string | null;
  clockOutLat?: number | null;
  clockOutLng?: number | null;
  clockOutPhoto?: string | null;
  clockOutStatus?: string | null;
  isDinasLuar: boolean;
}

interface RecentActivityFeedProps {
  initialActivities: RecentActivityItem[];
}

interface ActivePhotoModalData {
  type: 'MASUK' | 'PULANG';
  photoUrl: string;
  userName: string;
  userNip: string;
  userJabatan: string;
  timeStr: string;
  status: string;
  statusType: 'success' | 'warning' | 'purple' | 'info';
  location: string;
}

export function RecentActivityFeed({ initialActivities }: RecentActivityFeedProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<ActivePhotoModalData | null>(null);

  // Fungsi trigger refresh manual
  const handleRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    });
  };

  // Background auto-refresh setiap 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  // Handle ESC key untuk menutup modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePhotoModal(null);
      }
    };
    if (activePhotoModal) {
      window.addEventListener('keydown', onKeyDown);
    }
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePhotoModal]);

  const formatDisplayTime = (timeIso?: string | null, lng?: number | null) => {
    if (!timeIso) return null;
    const d = new Date(timeIso);
    const tz = getTimezoneFromCoordinates(lng);
    const isWib = tz === 'Asia/Jakarta';
    const isWit = tz === 'Asia/Jayapura';
    const tzLabel = isWib ? 'WIB' : isWit ? 'WIT' : 'WITA';
    const localTime = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz,
    });
    const witaTime = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Makassar',
    });
    return { localTime, witaTime, tzLabel };
  };

  return (
    <>
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs h-full flex flex-col">
        {/* Header Card: Judul, Tombol Segarkan, & Link Monitoring */}
        <div className="flex items-center justify-between mb-3 pb-2.5 sm:mb-4 sm:pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
              Aktivitas Presensi Terkini
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Tombol Segarkan Real-Time */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Segarkan feed presensi sekarang (Auto-refresh aktif tiap 30 detik)"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-700 border border-slate-200 hover:border-sky-200 text-[10px] sm:text-xs font-semibold transition cursor-pointer disabled:opacity-60"
            >
              <RefreshCw
                className={`w-3 h-3 text-sky-600 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Segarkan</span>
            </button>

            {/* Link ke Halaman Monitoring Lengkap */}
            <Link
              href="/admin/monitoring"
              className="text-[11px] sm:text-xs text-sky-700 hover:text-sky-800 font-bold flex items-center gap-0.5 group px-1.5 py-1 rounded-lg hover:bg-sky-50 transition"
              title="Buka tabel monitoring presensi lengkap seluruh pegawai"
            >
              <span>Selengkapnya</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </Link>
          </div>
        </div>

        {/* Daftar Feed Presensi Terkini */}
        {initialActivities.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 sm:py-10 px-4 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-1">
              <Users className="w-5 h-5 stroke-[1.75]" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-700">
              Belum ada aktivitas presensi hari ini
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
              Catatan kehadiran dan kepulangan pegawai akan muncul secara live di feed ini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 space-y-2.5">
            {initialActivities.map((att) => {
              const inTimeInfo = formatDisplayTime(att.clockInTime, att.clockInLng);
              const outTimeInfo = formatDisplayTime(att.clockOutTime, att.clockOutLng || att.clockInLng);

              return (
                <div
                  key={att.id}
                  className="pt-2.5 first:pt-0 flex items-center justify-between gap-2 sm:gap-3"
                >
                  {/* Sisi Kiri: Foto Selfie (Masuk & Pulang) + Identitas Pegawai */}
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    {/* Dual Thumbnail Avatar (Masuk & Pulang) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Thumbnail Selfie Masuk */}
                      {att.clockInPhoto ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePhotoModal({
                              type: 'MASUK',
                              photoUrl: att.clockInPhoto!,
                              userName: att.user.name,
                              userNip: att.user.nip,
                              userJabatan: att.user.jabatan,
                              timeStr: inTimeInfo
                                ? `${inTimeInfo.localTime} ${inTimeInfo.tzLabel}`
                                : '-',
                              status: att.isDinasLuar
                                ? 'Dinas Luar'
                                : att.clockInStatus === 'TEPAT_WAKTU'
                                ? 'Tepat Waktu'
                                : 'Terlambat Masuk',
                              statusType: att.isDinasLuar
                                ? 'purple'
                                : att.clockInStatus === 'TEPAT_WAKTU'
                                ? 'success'
                                : 'warning',
                              location: `${att.locationName || 'Kampus STIMI'}${
                                att.clockInLat && att.clockInLng
                                  ? ` • ${getRegionDescription(att.clockInLat, att.clockInLng)}`
                                  : ''
                              }`,
                            });
                          }}
                          className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-slate-100 border border-emerald-200/90 shadow-2xs hover:scale-105 transition group cursor-pointer"
                          title="Klik untuk perbesar Selfie Masuk"
                        >
                          <Image
                            src={att.clockInPhoto}
                            alt={`Selfie Masuk ${att.user.name}`}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-white text-[7px] font-black text-center uppercase tracking-tighter leading-none py-0.5">
                            Msk
                          </span>
                        </button>
                      ) : (
                        <div
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400"
                          title="Tidak ada foto masuk"
                        >
                          <span className="text-[9px] font-bold uppercase text-slate-500">
                            {att.user.name.slice(0, 2)}
                          </span>
                          <span className="text-[6.5px] font-bold text-slate-400 uppercase">
                            Msk
                          </span>
                        </div>
                      )}

                      {/* Thumbnail Selfie Pulang */}
                      {att.clockOutPhoto ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActivePhotoModal({
                              type: 'PULANG',
                              photoUrl: att.clockOutPhoto!,
                              userName: att.user.name,
                              userNip: att.user.nip,
                              userJabatan: att.user.jabatan,
                              timeStr: outTimeInfo
                                ? `${outTimeInfo.localTime} ${outTimeInfo.tzLabel}`
                                : '-',
                              status:
                                att.clockOutStatus === 'NORMAL'
                                  ? 'Pulang Normal'
                                  : att.clockOutStatus === 'PULANG_CEPAT'
                                  ? 'Pulang Lebih Cepat'
                                  : 'Dinas Luar',
                              statusType:
                                att.clockOutStatus === 'NORMAL'
                                  ? 'info'
                                  : att.clockOutStatus === 'PULANG_CEPAT'
                                  ? 'warning'
                                  : 'purple',
                              location: `${att.locationName || 'Kampus STIMI'}${
                                att.clockOutLat && att.clockOutLng
                                  ? ` • ${getRegionDescription(att.clockOutLat, att.clockOutLng)}`
                                  : ''
                              }`,
                            });
                          }}
                          className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-slate-100 border border-sky-200/90 shadow-2xs hover:scale-105 transition group cursor-pointer"
                          title="Klik untuk perbesar Selfie Pulang"
                        >
                          <Image
                            src={att.clockOutPhoto}
                            alt={`Selfie Pulang ${att.user.name}`}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-sky-600/90 text-white text-[7px] font-black text-center uppercase tracking-tighter leading-none py-0.5">
                            Plg
                          </span>
                        </button>
                      ) : (
                        <div
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-50/90 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300"
                          title="Belum presensi pulang"
                        >
                          <Clock className="w-3 h-3 text-slate-300" />
                          <span className="text-[6.5px] font-bold text-slate-400 uppercase">
                            Plg
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Informasi Pegawai */}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {att.user.name}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                        {att.user.jabatan} • No. ID: {att.user.nip}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <span className="text-[9px] sm:text-[10px] text-emerald-800 font-semibold truncate max-w-[120px] sm:max-w-none">
                          {att.locationName || 'Kampus STIMI'}
                        </span>
                        {att.clockInLat && att.clockInLng && (
                          <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate max-w-[100px] sm:max-w-none">
                            • {getRegionDescription(att.clockInLat, att.clockInLng)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sisi Kanan: Jam Masuk & Jam Pulang Berserta Status */}
                  <div className="text-right shrink-0 space-y-1">
                    {/* Baris Masuk */}
                    <div className="flex items-center justify-end gap-1.5">
                      {inTimeInfo ? (
                        <span className="font-mono tabular-nums text-[11px] sm:text-xs font-bold text-slate-900 leading-none whitespace-nowrap">
                          {inTimeInfo.localTime}{' '}
                          <span className="text-[9px] font-sans font-medium text-slate-500">
                            {inTimeInfo.tzLabel}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">-</span>
                      )}

                      <span
                        className={`inline-block text-[9px] sm:text-[9.5px] px-1.5 py-0.2 rounded font-bold whitespace-nowrap ${
                          att.isDinasLuar
                            ? 'bg-purple-100 text-purple-800'
                            : att.clockInStatus === 'TEPAT_WAKTU'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {att.isDinasLuar
                          ? 'Dinas'
                          : att.clockInStatus === 'TEPAT_WAKTU'
                          ? 'Tepat'
                          : 'Lambat'}
                      </span>
                    </div>

                    {/* Baris Pulang */}
                    <div className="flex items-center justify-end gap-1.5">
                      {att.clockOutTime && outTimeInfo ? (
                        <>
                          <span className="font-mono tabular-nums text-[11px] sm:text-xs font-bold text-slate-800 leading-none whitespace-nowrap">
                            {outTimeInfo.localTime}{' '}
                            <span className="text-[9px] font-sans font-medium text-slate-500">
                              {outTimeInfo.tzLabel}
                            </span>
                          </span>
                          <span
                            className={`inline-block text-[9px] sm:text-[9.5px] px-1.5 py-0.2 rounded font-bold whitespace-nowrap ${
                              att.clockOutStatus === 'NORMAL'
                                ? 'bg-sky-100 text-sky-800'
                                : att.clockOutStatus === 'PULANG_CEPAT'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {att.clockOutStatus === 'NORMAL' ? 'Normal' : 'Cepat'}
                          </span>
                        </>
                      ) : (
                        <span className="text-[9.5px] font-semibold text-slate-400 font-mono">
                          Belum Pulang
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Modal: Preview Foto Selfie Masuk / Pulang */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setActivePhotoModal(null)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${
                    activePhotoModal.type === 'MASUK' ? 'bg-emerald-600' : 'bg-sky-600'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    Foto Selfie {activePhotoModal.type === 'MASUK' ? 'Masuk' : 'Pulang'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium truncate">
                    {activePhotoModal.userName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActivePhotoModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Area Tampilan Foto */}
            <div className="relative w-full aspect-square bg-slate-950 flex items-center justify-center overflow-hidden">
              <Image
                src={activePhotoModal.photoUrl}
                alt={`Selfie ${activePhotoModal.type} - ${activePhotoModal.userName}`}
                fill
                unoptimized
                className="object-contain"
              />
            </div>

            {/* Footer Modal: Keterangan Waktu, Status, & Lokasi */}
            <div className="p-3.5 sm:p-4 bg-white space-y-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Waktu Absen
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {activePhotoModal.timeStr}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Status
                  </span>
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold mt-0.5 ${
                      activePhotoModal.statusType === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activePhotoModal.statusType === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : activePhotoModal.statusType === 'purple'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {activePhotoModal.status}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-snug break-words">
                  {activePhotoModal.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
