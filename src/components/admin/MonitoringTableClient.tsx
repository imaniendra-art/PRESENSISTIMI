'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Building2,
  MapPin,
  ExternalLink,
  CheckCircle2,
  ClockAlert,
  Briefcase,
  Camera,
  X,
  Users,
  Clock,
  LogIn,
  LogOut,
} from 'lucide-react';
import { getTimezoneFromCoordinates } from '@/lib/time';
import { formatDistance, getRegionDescription } from '@/lib/geo';

export interface MonitoringAttendanceData {
  id: string;
  locationName?: string | null;
  clockInTime?: string | null;
  clockInLat?: number | null;
  clockInLng?: number | null;
  clockInPhoto?: string | null;
  clockInStatus?: string | null;
  clockInDistance?: number | null;
  clockOutTime?: string | null;
  clockOutLat?: number | null;
  clockOutLng?: number | null;
  clockOutPhoto?: string | null;
  clockOutStatus?: string | null;
  clockOutDistance?: number | null;
  isDinasLuar: boolean;
}

export interface MonitoringUserRow {
  id: string;
  name: string;
  nip: string;
  jabatan: string;
  unitKerja: string;
  assignedLocationName?: string | null;
  attendance: MonitoringAttendanceData | null;
}

interface MonitoringTableClientProps {
  users: MonitoringUserRow[];
  formattedDateDisplay: string;
  totalEmployees: number;
  totalHadir: number;
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

// Helper untuk menyederhanakan nama lokasi/gedung agar tidak panjang di tabel
function formatLocationShort(name?: string | null): string {
  if (!name) return 'Kampus 1';
  const lower = name.toLowerCase();
  if (
    lower.includes('kampus ii') ||
    lower.includes('kampus 2') ||
    lower.includes('pascasarjana')
  ) {
    return 'Kampus 2';
  }
  if (
    lower.includes('kampus i') ||
    lower.includes('kampus 1') ||
    lower.includes('stimi') ||
    lower.includes('utama')
  ) {
    return 'Kampus 1';
  }
  return name.replace(/^Target:\s*/i, '').trim();
}

export function MonitoringTableClient({
  users,
  formattedDateDisplay,
  totalEmployees,
  totalHadir,
}: MonitoringTableClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activePhotoModal, setActivePhotoModal] = useState<ActivePhotoModalData | null>(null);

  // Ambil daftar unik Unit Kerja untuk dropdown filter
  const unitList = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.unitKerja?.trim()) {
        set.add(u.unitKerja.trim());
      }
    });
    return Array.from(set).sort();
  }, [users]);

  // Handle ESC key untuk menutup modal foto
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

  // Format jam lokal dan WITA
  const formatTime = (timeIso?: string | null, lng?: number | null) => {
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

  // Filter client-side instan
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 1. Filter Pencarian Nama / NIP
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = user.name.toLowerCase().includes(q);
        const matchNip = user.nip.toLowerCase().includes(q);
        if (!matchName && !matchNip) return false;
      }

      // 2. Filter Unit Kerja
      if (unitFilter !== 'ALL' && user.unitKerja?.trim() !== unitFilter) {
        return false;
      }

      // 3. Filter Status Kehadiran
      if (statusFilter !== 'ALL') {
        const att = user.attendance;
        if (statusFilter === 'BELUM') {
          if (att && att.clockInTime) return false;
        } else if (statusFilter === 'TEPAT') {
          if (!att || att.clockInStatus !== 'TEPAT_WAKTU' || att.isDinasLuar) return false;
        } else if (statusFilter === 'LAMBAT') {
          if (!att || att.clockInStatus !== 'TERLAMBAT' || att.isDinasLuar) return false;
        } else if (statusFilter === 'DINAS') {
          if (!att || !att.isDinasLuar) return false;
        } else if (statusFilter === 'HADIR') {
          if (!att || !att.clockInTime) return false;
        }
      }

      return true;
    });
  }, [users, searchQuery, unitFilter, statusFilter]);

  return (
    <>
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden w-full">
        {/* Toolbar Pencarian & Filter Cepat (Web & Mobile) */}
        <div className="p-3 sm:p-5 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Daftar Presensi Pegawai</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-sky-700 font-semibold normal-case font-sans">
                {formattedDateDisplay}
              </span>
            </h3>
          </div>

          {/* Controls Bar: Search Input, Unit Dropdown, Status Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
            {/* Search Input */}
            <div className="sm:col-span-6 lg:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau No. ID pegawai..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Unit Kerja */}
            <div className="sm:col-span-3 lg:col-span-4">
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs cursor-pointer truncate"
              >
                <option value="ALL">Semua Unit Kerja ({totalEmployees})</option>
                {unitList.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status Kehadiran */}
            <div className="sm:col-span-3 lg:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs cursor-pointer truncate"
              >
                <option value="ALL">Semua Status</option>
                <option value="HADIR">Hadir ({totalHadir})</option>
                <option value="TEPAT">Tepat Waktu</option>
                <option value="LAMBAT">Terlambat</option>
                <option value="DINAS">Dinas Luar</option>
                <option value="BELUM">Belum Presensi ({totalEmployees - totalHadir})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tampilan Desktop: Tabel Proporsional 100% Lebar Layar (Zero Horizontal Scroll) */}
        <div className="hidden md:block w-full overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Users className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-sm font-bold text-slate-700">
                Tidak ada pegawai yang sesuai dengan filter
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Coba ubah kata kunci pencarian nama atau setel ulang filter unit kerja dan status kehadiran.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setUnitFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="mt-2 px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse table-fixed">
              {/* Alokasi Lebar Kolom Proporsional (Total Tepat 100% Pas Layar) */}
              <colgroup>
                <col className="w-[4%]" />
                <col className="w-[19%]" />
                <col className="w-[15%]" />
                <col className="w-[12%]" />
                {/* Presensi Masuk (Total 25%) */}
                <col className="w-[8%]" />
                <col className="w-[6%]" />
                <col className="w-[11%]" />
                {/* Presensi Pulang (Total 25%) */}
                <col className="w-[8%]" />
                <col className="w-[6%]" />
                <col className="w-[11%]" />
              </colgroup>

              {/* Header 2 Tingkat: Grup MASUK & Grup PULANG */}
              <thead>
                <tr className="bg-sky-50/70 text-slate-700 uppercase tracking-wider text-[10px] border-b border-sky-100">
                  <th
                    rowSpan={2}
                    className="py-2.5 px-2 font-extrabold text-center border-r border-sky-100/80"
                  >
                    No.
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2.5 px-3 font-extrabold border-r border-sky-100/80"
                  >
                    Pegawai
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2.5 px-3 font-extrabold border-r border-sky-100/80"
                  >
                    Unit & Jabatan
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2.5 px-2 font-extrabold text-center border-r border-sky-100/80"
                  >
                    Status
                  </th>

                  {/* Header Grup PRESENSI MASUK */}
                  <th
                    colSpan={3}
                    className="py-2 px-2 font-black text-center bg-emerald-50 text-emerald-800 border-r border-emerald-200/80 tracking-normal"
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Presensi Masuk</span>
                    </span>
                  </th>

                  {/* Header Grup PRESENSI PULANG */}
                  <th
                    colSpan={3}
                    className="py-2 px-2 font-black text-center bg-sky-50 text-sky-800 tracking-normal"
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <LogOut className="w-3.5 h-3.5 text-sky-600" />
                      <span>Presensi Pulang</span>
                    </span>
                  </th>
                </tr>

                {/* Sub-Header Kolom Masuk & Pulang */}
                <tr className="bg-slate-50/90 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  {/* Kolom Masuk: Jam, Foto, Lokasi */}
                  <th className="py-1.5 px-2.5 font-bold bg-emerald-50/40 text-emerald-900 border-r border-emerald-100/60">
                    Jam
                  </th>
                  <th className="py-1.5 px-1.5 text-center font-bold bg-emerald-50/40 text-emerald-900 border-r border-emerald-100/60">
                    Foto
                  </th>
                  <th className="py-1.5 px-2.5 font-bold bg-emerald-50/40 text-emerald-900 border-r border-sky-100">
                    Lokasi & Jarak
                  </th>

                  {/* Kolom Pulang: Jam, Foto, Lokasi */}
                  <th className="py-1.5 px-2.5 font-bold bg-sky-50/40 text-sky-900 border-r border-sky-100/60">
                    Jam
                  </th>
                  <th className="py-1.5 px-1.5 text-center font-bold bg-sky-50/40 text-sky-900 border-r border-sky-100/60">
                    Foto
                  </th>
                  <th className="py-1.5 px-2.5 font-bold bg-sky-50/40 text-sky-900">
                    Lokasi & Jarak
                  </th>
                </tr>
              </thead>

              {/* Isi Data Tabel */}
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((user, idx) => {
                  const att = user.attendance;
                  const inTimeInfo = formatTime(att?.clockInTime, att?.clockInLng);
                  const outTimeInfo = formatTime(
                    att?.clockOutTime,
                    att?.clockOutLng || att?.clockInLng
                  );

                  return (
                    <tr key={user.id} className="hover:bg-sky-50/30 transition">
                      {/* 1. Nomor Urut */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-500 text-xs border-r border-slate-100">
                        {idx + 1}
                      </td>

                      {/* 2. Pegawai */}
                      <td className="py-2.5 px-3 border-r border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[11px] uppercase text-slate-600 shrink-0">
                            {user.name.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {user.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              No. ID: {user.nip}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 3. Unit Kerja & Jabatan */}
                      <td className="py-2.5 px-3 border-r border-slate-100">
                        <p className="font-semibold text-slate-800 truncate">
                          {user.unitKerja}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {user.jabatan}
                        </p>
                      </td>

                      {/* 4. Status Kehadiran */}
                      <td className="py-2.5 px-2 whitespace-nowrap text-center border-r border-slate-100">
                        {!att || !att.clockInTime ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-100 text-slate-600">
                            Belum
                          </span>
                        ) : att.isDinasLuar ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-purple-100 text-purple-800">
                            <Briefcase className="w-3 h-3" /> Dinas
                          </span>
                        ) : att.clockInStatus === 'TEPAT_WAKTU' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Tepat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-rose-100 text-rose-800">
                            <ClockAlert className="w-3 h-3" /> Lambat
                          </span>
                        )}
                      </td>

                      {/* ===== BAGIAN MASUK ===== */}
                      {/* 5. Jam Masuk */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap border-r border-emerald-100/60 bg-emerald-50/10">
                        {inTimeInfo ? (
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {inTimeInfo.localTime}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum</span>
                        )}
                      </td>

                      {/* 6. Foto Masuk */}
                      <td className="py-2.5 px-1.5 text-center border-r border-emerald-100/60 bg-emerald-50/10">
                        {att?.clockInPhoto ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActivePhotoModal({
                                type: 'MASUK',
                                photoUrl: att.clockInPhoto!,
                                userName: user.name,
                                userNip: user.nip,
                                userJabatan: user.jabatan,
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
                                location: `${formatLocationShort(att.locationName)}${
                                  att.clockInLat && att.clockInLng
                                    ? ` • ${getRegionDescription(
                                        att.clockInLat,
                                        att.clockInLng
                                      )}`
                                    : ''
                                }`,
                              });
                            }}
                            className="relative w-7 h-7 rounded-lg overflow-hidden bg-slate-100 border border-emerald-200 shadow-2xs hover:scale-105 transition cursor-pointer mx-auto"
                            title="Klik untuk zoom Selfie Masuk"
                          >
                            <img
                              src={att.clockInPhoto}
                              alt={`Masuk ${user.name}`}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-white text-[6px] font-black text-center uppercase py-0.2">
                              Msk
                            </span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum</span>
                        )}
                      </td>

                      {/* 7. Lokasi & Jarak Masuk */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap border-r border-sky-100 bg-emerald-50/10">
                        {att && att.clockInTime ? (
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-bold text-slate-800 text-[11px] truncate">
                              {formatLocationShort(att.locationName)}
                            </span>
                            {att.clockInDistance !== null &&
                              att.clockInDistance !== undefined && (
                                <span className="text-[10px] text-emerald-800 font-mono font-bold shrink-0">
                                  • {formatDistance(att.clockInDistance)}
                                </span>
                              )}
                            {att.clockInLat && att.clockInLng && (
                              <a
                                href={`https://www.google.com/maps?q=${att.clockInLat},${att.clockInLng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-600 hover:text-sky-800 inline-flex items-center shrink-0 ml-0.5"
                                title="Lihat titik GPS Masuk di Maps"
                              >
                                <MapPin className="w-2.5 h-2.5 text-rose-500" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum</span>
                        )}
                      </td>

                      {/* ===== BAGIAN PULANG ===== */}
                      {/* 8. Jam Pulang */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap border-r border-sky-100/60 bg-sky-50/10">
                        {outTimeInfo ? (
                          <span className="font-mono font-bold text-slate-800 text-xs">
                            {outTimeInfo.localTime}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum</span>
                        )}
                      </td>

                      {/* 9. Foto Pulang */}
                      <td className="py-2.5 px-1.5 text-center border-r border-sky-100/60 bg-sky-50/10">
                        {att?.clockOutPhoto ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActivePhotoModal({
                                type: 'PULANG',
                                photoUrl: att.clockOutPhoto!,
                                userName: user.name,
                                userNip: user.nip,
                                userJabatan: user.jabatan,
                                timeStr: outTimeInfo
                                  ? `${outTimeInfo.localTime} ${outTimeInfo.tzLabel}`
                                  : '-',
                                status:
                                  att.clockOutStatus === 'NORMAL'
                                    ? 'Pulang Normal'
                                    : att.clockOutStatus === 'PULANG_CEPAT'
                                    ? 'Pulang Cepat'
                                    : 'Dinas Luar',
                                statusType:
                                  att.clockOutStatus === 'NORMAL'
                                    ? 'info'
                                    : att.clockOutStatus === 'PULANG_CEPAT'
                                    ? 'warning'
                                    : 'purple',
                                location: `${formatLocationShort(att.locationName)}${
                                  att.clockOutLat && att.clockOutLng
                                    ? ` • ${getRegionDescription(
                                        att.clockOutLat,
                                        att.clockOutLng
                                      )}`
                                    : ''
                                }`,
                              });
                            }}
                            className="relative w-7 h-7 rounded-lg overflow-hidden bg-slate-100 border border-sky-200 shadow-2xs hover:scale-105 transition cursor-pointer mx-auto"
                            title="Klik untuk zoom Selfie Pulang"
                          >
                            <img
                              src={att.clockOutPhoto}
                              alt={`Pulang ${user.name}`}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-sky-600/90 text-white text-[6px] font-black text-center uppercase py-0.2">
                              Plg
                            </span>
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum</span>
                        )}
                      </td>

                      {/* 10. Lokasi & Jarak Pulang */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap bg-sky-50/10">
                        {att?.clockOutTime ? (
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-bold text-slate-800 text-[11px] truncate">
                              {formatLocationShort(att.locationName)}
                            </span>
                            {att.clockOutDistance !== null &&
                              att.clockOutDistance !== undefined && (
                                <span className="text-[10px] text-sky-800 font-mono font-bold shrink-0">
                                  • {formatDistance(att.clockOutDistance)}
                                </span>
                              )}
                            {att.clockOutLat && att.clockOutLng && (
                              <a
                                href={`https://www.google.com/maps?q=${att.clockOutLat},${att.clockOutLng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-600 hover:text-sky-800 inline-flex items-center shrink-0 ml-0.5"
                                title="Lihat titik GPS Pulang di Maps"
                              >
                                <MapPin className="w-2.5 h-2.5 text-rose-500" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Tampilan Mobile: Kartu Ringkas Responsif (md:hidden) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredUsers.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-slate-400">
              Tidak ada data yang sesuai filter
            </div>
          ) : (
            filteredUsers.map((user, idx) => {
              const att = user.attendance;
              const inTimeInfo = formatTime(att?.clockInTime, att?.clockInLng);
              const outTimeInfo = formatTime(
                att?.clockOutTime,
                att?.clockOutLng || att?.clockInLng
              );

              return (
                <div key={`mob-${user.id}`} className="p-3.5 space-y-2.5">
                  {/* Header Baris Mobile: No Urut + Nama & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          No. ID: {user.nip} • {user.unitKerja}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {!att || !att.clockInTime ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                          Belum
                        </span>
                      ) : att.isDinasLuar ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-800">
                          <Briefcase className="w-3 h-3" /> Dinas
                        </span>
                      ) : att.clockInStatus === 'TEPAT_WAKTU' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Tepat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">
                          <ClockAlert className="w-3 h-3" /> Lambat
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2 Kolom Mobile: Presensi Masuk & Presensi Pulang */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {/* Blok Masuk */}
                    <div className="bg-emerald-50/40 p-2 rounded-xl border border-emerald-100/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                          <LogIn className="w-3 h-3" /> Masuk
                        </span>
                        {inTimeInfo ? (
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {inTimeInfo.localTime}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Belum</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        {att?.clockInPhoto ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActivePhotoModal({
                                type: 'MASUK',
                                photoUrl: att.clockInPhoto!,
                                userName: user.name,
                                userNip: user.nip,
                                userJabatan: user.jabatan,
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
                                location: `${formatLocationShort(att.locationName)}${
                                  att.clockInLat && att.clockInLng
                                    ? ` • ${getRegionDescription(
                                        att.clockInLat,
                                        att.clockInLng
                                      )}`
                                    : ''
                                }`,
                              });
                            }}
                            className="relative w-7 h-7 rounded-lg overflow-hidden bg-white border border-emerald-300 shadow-2xs shrink-0 cursor-pointer"
                          >
                            <img
                              src={att.clockInPhoto}
                              alt={`Masuk ${user.name}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Belum</span>
                        )}

                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-slate-800 truncate">
                            {att?.clockInTime ? formatLocationShort(att.locationName) : 'Belum'}
                          </p>
                          {att?.clockInDistance !== null && att?.clockInDistance !== undefined && (
                            <p className="text-[9px] text-emerald-800 font-mono font-bold">
                              {formatDistance(att.clockInDistance)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Blok Pulang */}
                    <div className="bg-sky-50/40 p-2 rounded-xl border border-sky-100/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase text-sky-800 flex items-center gap-1">
                          <LogOut className="w-3 h-3" /> Pulang
                        </span>
                        {outTimeInfo ? (
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {outTimeInfo.localTime}
                          </span>
                        ) : (
                          <span className="text-[10px] italic text-slate-400">Belum</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        {att?.clockOutPhoto ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActivePhotoModal({
                                type: 'PULANG',
                                photoUrl: att.clockOutPhoto!,
                                userName: user.name,
                                userNip: user.nip,
                                userJabatan: user.jabatan,
                                timeStr: outTimeInfo
                                  ? `${outTimeInfo.localTime} ${outTimeInfo.tzLabel}`
                                  : '-',
                                status:
                                  att.clockOutStatus === 'NORMAL'
                                    ? 'Pulang Normal'
                                    : att.clockOutStatus === 'PULANG_CEPAT'
                                    ? 'Pulang Cepat'
                                    : 'Dinas Luar',
                                statusType:
                                  att.clockOutStatus === 'NORMAL'
                                    ? 'info'
                                    : att.clockOutStatus === 'PULANG_CEPAT'
                                    ? 'warning'
                                    : 'purple',
                                location: `${formatLocationShort(att.locationName)}${
                                  att.clockOutLat && att.clockOutLng
                                    ? ` • ${getRegionDescription(
                                        att.clockOutLat,
                                        att.clockOutLng
                                      )}`
                                    : ''
                                }`,
                              });
                            }}
                            className="relative w-7 h-7 rounded-lg overflow-hidden bg-white border border-sky-300 shadow-2xs shrink-0 cursor-pointer"
                          >
                            <img
                              src={att.clockOutPhoto}
                              alt={`Pulang ${user.name}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Belum</span>
                        )}

                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-slate-800 truncate">
                            {att?.clockOutTime
                              ? formatLocationShort(att.locationName)
                              : 'Belum'}
                          </p>
                          {att?.clockOutDistance !== null && att?.clockOutDistance !== undefined && (
                            <p className="text-[9px] text-sky-800 font-mono font-bold">
                              {formatDistance(att.clockOutDistance)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Lightbox Modal: Preview Foto Selfie Resolusi Besar */}
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
              <img
                src={activePhotoModal.photoUrl}
                alt={`Selfie ${activePhotoModal.type} - ${activePhotoModal.userName}`}
                className="w-full h-full object-contain"
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
