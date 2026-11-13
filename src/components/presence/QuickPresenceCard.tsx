'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CameraCapture, CameraCaptureHandle } from './CameraCapture';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { calculateHaversineDistance } from '@/lib/geo';
import { lookupEmployeeByNip, submitQuickPresence } from '@/actions/presenceActions';
import {
  Radio,
  Search,
  User,
  KeyRound,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Zap,
  Camera,
  LogIn,
  LogOut,
  Briefcase,
  Sparkles,
  X,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { CampusSetting, CampusLocation } from '@prisma/client';
import Link from 'next/link';

interface QuickPresenceCardProps {
  campusSetting: CampusSetting;
  campusLocations?: CampusLocation[];
}

interface EmployeePreview {
  id: string;
  name: string;
  nip: string;
  jabatan: string;
  unitKerja: string;
  assignedLocationName: string | null;
  assignedLocationRadius: number | null;
}

interface TodayAttendanceStatus {
  hasClockedIn: boolean;
  clockInTime: string | null;
  clockInStatus: string | null;
  hasClockedOut: boolean;
  clockOutTime: string | null;
  clockOutStatus: string | null;
}

interface SavedEmployee {
  nip: string;
  name: string;
}

const STORAGE_KEY = 'presensi_stimi_saved_ids';

export function QuickPresenceCard({
  campusSetting,
  campusLocations = [],
}: QuickPresenceCardProps) {
  // Saved IDs di Perangkat (localStorage)
  const [savedEmployees, setSavedEmployees] = useState<SavedEmployee[]>([]);
  // GPS State
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Live Clock WITA
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Form State
  const [nipInput, setNipInput] = useState('');
  const [isSearchingNip, setIsSearchingNip] = useState(false);
  const [employee, setEmployee] = useState<EmployeePreview | null>(null);
  const [attendance, setAttendance] = useState<TodayAttendanceStatus | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Camera & Submission State
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isDinasLuar, setIsDinasLuar] = useState(false);
  const [dinasLuarNote, setDinasLuarNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data Struk Sukses
  const [successData, setSuccessData] = useState<{
    employeeName: string;
    nip: string;
    actionType: 'IN' | 'OUT';
    time: string;
    dateStr: string;
    locationName: string;
    status?: string;
    latitude?: number;
    longitude?: number;
    distance?: number;
    isDinasLuar?: boolean;
    photoUrl?: string;
  } | null>(null);
  const [countdown, setCountdown] = useState(25);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cameraRef = useRef<CameraCaptureHandle>(null);

  // Jam berdetak live setiap 1 detik
  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentTime(new Date());
    }, 0);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(timer);
    };
  }, []);

  // Muat No. ID yang tersimpan di perangkat (localStorage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setSavedEmployees(parsed);
          }
        }
      } catch {
        // Abaikan error storage
      }
    }
  }, []);

  // Simpan No. ID ke memori perangkat
  const saveEmployeeToLocal = useCallback((nip: string, name: string) => {
    if (typeof window === 'undefined' || !nip) return;
    try {
      const clean = nip.trim().toUpperCase();
      setSavedEmployees((prev) => {
        const filtered = prev.filter((p) => p.nip.toUpperCase() !== clean);
        const updated = [{ nip: clean, name: name.trim() }, ...filtered].slice(0, 5);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Abaikan error storage
    }
  }, []);

  // Hapus No. ID dari memori perangkat
  const handleRemoveSavedEmployee = useCallback((nip: string) => {
    if (typeof window === 'undefined') return;
    try {
      const clean = nip.trim().toUpperCase();
      setSavedEmployees((prev) => {
        const updated = prev.filter((p) => p.nip.toUpperCase() !== clean);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Abaikan error storage
    }
  }, []);

  // GPS Refresher
  const refreshLocation = useCallback(() => {
    setIsLocating(true);
    setGeoError(null);

    if (!('geolocation' in navigator)) {
      setGeoError('Perangkat Anda tidak mendukung fitur GPS Geolocation.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setIsLocating(false);
      },
      (err) => {
        console.error('GPS error:', err);
        setGeoError('Gagal memperoleh GPS. Pastikan izin lokasi aktif.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshLocation();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshLocation]);

  // Evaluasi Geofence Dinamis
  const locationEval = useMemo(() => {
    if (!coords) return null;

    if (employee?.assignedLocationName && employee.assignedLocationRadius) {
      const assignedLoc = campusLocations.find(
        (l) => l.name.toLowerCase() === employee.assignedLocationName?.toLowerCase()
      );

      if (assignedLoc) {
        const dist = calculateHaversineDistance(
          coords.lat,
          coords.lng,
          assignedLoc.latitude,
          assignedLoc.longitude
        );
        return {
          targetName: assignedLoc.name,
          distance: dist,
          maxRadius: assignedLoc.radiusMeters,
          isInside: dist <= assignedLoc.radiusMeters,
        };
      }
    }

    if (campusLocations.length > 0) {
      let nearest = campusLocations[0];
      let minDist = calculateHaversineDistance(
        coords.lat,
        coords.lng,
        nearest.latitude,
        nearest.longitude
      );

      for (let i = 1; i < campusLocations.length; i++) {
        const d = calculateHaversineDistance(
          coords.lat,
          coords.lng,
          campusLocations[i].latitude,
          campusLocations[i].longitude
        );
        if (d < minDist) {
          minDist = d;
          nearest = campusLocations[i];
        }
      }

      return {
        targetName: nearest.name,
        distance: minDist,
        maxRadius: nearest.radiusMeters,
        isInside: minDist <= nearest.radiusMeters,
      };
    }

    const dist = calculateHaversineDistance(
      coords.lat,
      coords.lng,
      campusSetting.latitude,
      campusSetting.longitude
    );
    return {
      targetName: campusSetting.campusName,
      distance: dist,
      maxRadius: campusSetting.radiusMeters,
      isInside: dist <= campusSetting.radiusMeters,
    };
  }, [coords, employee, campusLocations, campusSetting]);

  const isFriday = currentTime ? currentTime.getDay() === 5 : new Date().getDay() === 5;
  const isInsideRadius = isFriday || (locationEval ? locationEval.isInside : false);

  // Pencarian No. ID Pegawai
  const handleSearchNip = async (customNip?: string) => {
    const targetNip = customNip || nipInput;
    if (!targetNip.trim()) {
      setEmployee(null);
      setAttendance(null);
      setLookupError(null);
      return;
    }

    setIsSearchingNip(true);
    setLookupError(null);
    setAlert(null);

    try {
      const res = await lookupEmployeeByNip(targetNip.trim());
      if (res.success && res.user && res.attendance) {
        setEmployee(res.user);
        setAttendance(res.attendance);
        saveEmployeeToLocal(res.user.nip, res.user.name);
      } else {
        setEmployee(null);
        setAttendance(null);
        setLookupError(res.message || 'No. ID tidak terdaftar di sistem STIMI.');
      }
    } catch {
      setLookupError('Terjadi kendala saat memeriksa No. ID. Coba lagi.');
    } finally {
      setIsSearchingNip(false);
    }
  };

  // Reset Formulir Cepat
  const handleResetForm = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setNipInput('');
    setEmployee(null);
    setAttendance(null);
    setPhotoBase64(null);
    setAlert(null);
    setLookupError(null);
    setSuccessData(null);
    setCountdown(4);
    setIsDinasLuar(false);
    setDinasLuarNote('');
  }, []);

  // Submit Presensi Cepat
  const handleSubmit = async () => {
    if (!employee) {
      setAlert({ type: 'error', message: 'Harap masukkan No. ID pegawai yang valid terlebih dahulu.' });
      return;
    }

    if (!coords) {
      setAlert({ type: 'error', message: 'Sinyal GPS belum terdeteksi. Izinkan akses lokasi pada browser Anda.' });
      return;
    }

    if (!isInsideRadius && !isDinasLuar) {
      setAlert({
        type: 'error',
        message: `Presensi ditolak. Anda berada di luar batas gedung ${locationEval?.targetName} (${Math.round(
          locationEval?.distance || 0
        )}m). Jika sedang bertugas dinas luar, silakan aktifkan opsi Dinas Luar di bawah.`,
      });
      return;
    }

    if (isDinasLuar && dinasLuarNote.trim().length < 5) {
      setAlert({
        type: 'error',
        message: 'Keterangan agenda/lokasi dinas luar wajib diisi (minimal 5 karakter).',
      });
      return;
    }

    if (!photoBase64) {
      setAlert({ type: 'error', message: 'Harap ambil foto selfie verifikasi wajah Anda.' });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      const res = await submitQuickPresence({
        nip: employee.nip,
        latitude: coords?.lat || -5.123286,
        longitude: coords?.lng || 119.489704,
        accuracy: coords?.accuracy || 10,
        photoBase64,
        isSimulation: false,
        isDinasLuar,
        note: dinasLuarNote.trim(),
      });

      if (res.success && res.actionType) {
        const todayDateFormatted = new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        setSuccessData({
          employeeName: res.employeeName || employee.name,
          nip: employee.nip,
          actionType: res.actionType,
          time: res.time || 'WITA',
          dateStr: todayDateFormatted,
          locationName: res.locationName || locationEval?.targetName || 'Kampus STIMI',
          status: res.status,
          latitude: coords?.lat,
          longitude: coords?.lng,
          distance: Math.round(locationEval?.distance || 0),
          isDinasLuar,
          photoUrl: photoBase64 || undefined,
        });

        // Simpan No. ID ke memori perangkat
        saveEmployeeToLocal(employee.nip, employee.name);

        // Haptic feedback pada HP
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate?.([60, 50, 60]);
          } catch {}
        }

        // Mulai hitung mundur santai 25 detik untuk auto-reset
        setCountdown(25);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              handleResetForm();
              return 25;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Terjadi gangguan koneksi server saat mengirim presensi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : '--:--:--';

  // JIKA SUDAH SUKSES: Tampilkan Struk Digital Bukti Presensi Lengkap
  if (successData) {
    const isMasuk = successData.actionType === 'IN';
    const statusLabel =
      successData.status === 'TEPAT_WAKTU'
        ? 'Tepat Waktu'
        : successData.status === 'TERLAMBAT'
        ? 'Terlambat'
        : successData.status === 'DINAS_LUAR'
        ? 'Dinas Luar'
        : 'Tercatat Resmi';

    return (
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-w-md mx-auto p-5 sm:p-6 text-left animate-slide-up space-y-4">
        {/* Header Struk Resmi */}
        <div className="text-center pb-3.5 border-b border-slate-100">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-xs mb-2">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black tracking-wide uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Presensi Berhasil Terekam</span>
          </span>
          <h2 className="text-base sm:text-lg font-black text-slate-900 mt-2">
            BUKTI PRESENSI RESMI
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            PORTAL KEHADIRAN STIMI YAPMI MAKASSAR
          </p>
        </div>

        {/* Kartu Rincian Struk */}
        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
          {/* Data Pegawai */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Pegawai</span>
              <p className="font-extrabold text-slate-900 text-sm truncate">{successData.employeeName}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">No. ID</span>
              <span className="font-mono font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-lg text-xs">
                {successData.nip}
              </span>
            </div>
          </div>

          {/* Jenis Presensi & Status */}
          <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-slate-200/70">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Jenis Presensi</span>
              <span className={`inline-flex items-center gap-1 font-bold mt-0.5 ${isMasuk ? 'text-sky-700' : 'text-amber-700'}`}>
                {isMasuk ? 'Presensi Masuk' : 'Presensi Pulang'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Status Kehadiran</span>
              <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] mt-0.5 ${
                successData.status === 'TEPAT_WAKTU'
                  ? 'bg-emerald-100 text-emerald-800'
                  : successData.status === 'DINAS_LUAR'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Waktu & Tanggal */}
          <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-slate-200/70">
            <div>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                <Calendar className="w-3 h-3 text-slate-400" />
                Tanggal
              </span>
              <p className="font-medium text-slate-800 mt-0.5">{successData.dateStr}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                <Clock className="w-3 h-3 text-slate-400" />
                Waktu Rekam
              </span>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{successData.time}</p>
            </div>
          </div>

          {/* Lokasi Gedung & Koordinat Titik GPS */}
          <div className="space-y-1.5 pb-2.5 border-b border-slate-200/70">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
              <MapPin className="w-3 h-3 text-slate-400" />
              Titik Lokasi & Radius
            </span>
            <p className="font-bold text-slate-900 text-xs">{successData.locationName}</p>
            {typeof successData.latitude === 'number' && typeof successData.longitude === 'number' && (
              <div className="p-2 rounded-xl bg-white border border-slate-200 text-[11px] font-mono text-slate-600 flex items-center justify-between">
                <span>
                  {successData.latitude.toFixed(6)}, {successData.longitude.toFixed(6)}
                </span>
                <span className="font-sans font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                  {successData.isDinasLuar
                    ? 'Dinas Luar'
                    : `Radius: ${successData.distance ?? 0}m`}
                </span>
              </div>
            )}
          </div>

          {/* Foto Selfie (Jika Ada) */}
          {successData.photoUrl && (
            <div className="pt-0.5">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase mb-1.5">
                <Camera className="w-3 h-3 text-slate-400" />
                Foto Selfie Terekam
              </span>
              <div className="relative w-20 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={successData.photoUrl}
                  alt="Selfie Presensi"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Petunjuk Tangkapan Layar */}
        <p className="text-[11px] text-center text-slate-400 font-medium">
          💡 Anda dapat mengambil <strong>Screenshot</strong> halaman ini sebagai bukti kehadiran Anda.
        </p>

        {/* Tombol Aksi */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleResetForm}
            className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Selesai (Tutup Struk)</span>
          </button>

          <button
            type="button"
            onClick={handleResetForm}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Presensi Pegawai Lain ({countdown}s)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Form Card - 100% Identik Padding & Margin dengan Halaman Login */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        {/* Header Kartu: Judul, Tanggal & Jam Digital WITA Menonjol */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />
              <span>Absen Cepat</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Jam Digital WITA Lebih Besar */}
          <div className="bg-sky-50 border border-sky-200/90 px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
            </span>
            <span className="text-[10px] text-sky-800 font-bold uppercase tracking-wider">WITA</span>
            <span className="font-mono tabular-nums text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Notifikasi Pesan Kesalahan / Peringatan */}
        {alert && (
          <div
            className={`p-3 rounded-xl flex items-start gap-2 text-xs leading-relaxed animate-slide-up ${
              alert.type === 'success'
                ? 'bg-sky-50 text-sky-900 border border-sky-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="font-medium text-xs">{alert.message}</span>
          </div>
        )}

        {geoError && !alert && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{geoError}</span>
          </div>
        )}

        {/* Bar Status Radar Geofence GPS Ringkas */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isInsideRadius || isDinasLuar ? 'bg-sky-400' : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isInsideRadius || isDinasLuar ? 'bg-sky-500' : 'bg-rose-500'
                }`}
              />
            </span>
            <div className="min-w-0">
              <span className="font-bold text-slate-800 block text-xs truncate">
                {isLocating
                  ? 'Mengunci titik GPS...'
                  : isFriday
                  ? 'Pola WFA (Jumat - Bebas Lokasi)'
                  : isDinasLuar
                  ? 'Mode Dinas Luar Aktif'
                  : isInsideRadius
                  ? `Di Dalam Radius: ${locationEval?.targetName}`
                  : `Di Luar Radius: ${locationEval?.targetName || 'Kampus'}`}
              </span>
              {locationEval && (
                <span className="text-[10px] text-slate-500 font-mono block">
                  {isFriday
                    ? 'Hari Jumat: Presensi fleksibel WFA STIMI'
                    : isDinasLuar
                    ? 'Bebas radius geofence (wajib isi agenda tugas)'
                    : `Jarak: ±${Math.round(locationEval.distance)}m (Batas: ${locationEval.maxRadius}m)`}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={refreshLocation}
            disabled={isLocating}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Input No. ID Pegawai (Tampil saat pegawai belum dipilih) */}
        {!employee ? (
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Nomor ID (No. ID)</span>
              <span className="text-[11px] text-slate-400 font-normal">Contoh: DSN01, TNK01</span>
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={nipInput}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setNipInput(val);
                  if (val.length >= 3) {
                    handleSearchNip(val);
                  } else {
                    setEmployee(null);
                    setAttendance(null);
                    setLookupError(null);
                  }
                }}
                onBlur={() => handleSearchNip()}
                placeholder="Masukkan No. ID (contoh: DSN01)..."
                autoCapitalize="characters"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition uppercase tracking-wider"
              />
              <div className="absolute right-3.5 top-3.5 text-slate-400">
                {isSearchingNip ? (
                  <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </div>
            </div>

            {lookupError && (
              <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{lookupError}</span>
              </p>
            )}

            {/* Quick Picker: No. ID yang Tersimpan di Perangkat Ini */}
            {savedEmployees.length > 0 && (
              <div className="pt-1 pb-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    Pilih No. ID Tersimpan:
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Tersimpan di HP ini</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {savedEmployees.map((saved) => (
                    <div
                      key={saved.nip}
                      className="group inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50/70 rounded-xl text-xs transition shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setNipInput(saved.nip);
                          handleSearchNip(saved.nip);
                        }}
                        className="flex items-center gap-1.5 font-bold text-slate-800 hover:text-sky-700 text-left cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-mono font-black flex items-center justify-center">
                          {saved.nip.slice(0, 2)}
                        </span>
                        <span className="font-mono text-[11px] text-sky-700 font-extrabold">{saved.nip}</span>
                        <span className="text-[11px] text-slate-600 font-medium truncate max-w-[110px] sm:max-w-[140px]">
                          {saved.name}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSavedEmployee(saved.nip);
                        }}
                        title="Hapus No. ID ini dari perangkat"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tombol Masuk Akun Langsung */}
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Masuk Akun</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Inline Employee Recognition Pill (Super Hemat Ruang Layar HP) */
          <div className="p-2.5 rounded-2xl bg-sky-50/90 border border-sky-200 flex items-center justify-between text-xs animate-slide-up">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {employee.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-extrabold text-slate-900 text-xs truncate max-w-[150px] sm:max-w-[200px]">
                    {employee.name}
                  </span>
                  <span className="px-1.5 py-0.2 bg-sky-200/70 text-sky-900 border border-sky-300 rounded text-[9px] font-mono font-bold shrink-0">
                    No. ID: {employee.nip}
                  </span>
                </div>
                <p className="text-[10px] text-sky-800 font-medium truncate mt-0.5">
                  {!attendance?.hasClockedIn
                    ? 'Belum Presensi Masuk'
                    : !attendance?.hasClockedOut
                    ? 'Sudah Masuk (Siap Pulang)'
                    : 'Presensi Lengkap Hari Ini'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetForm}
              className="text-[11px] text-sky-700 hover:text-sky-900 font-bold bg-white border border-sky-300 px-2.5 py-1 rounded-xl shrink-0 cursor-pointer shadow-2xs hover:bg-sky-50 transition"
            >
              Ganti
            </button>
          </div>
        )}

        {/* Kamera Selfie Kompak (Viewfinder Bersih Tanpa Tombol di Atas Gambar) */}
        {employee && (
          <div className="animate-slide-up">
            <ErrorBoundary fallbackTitle="Kamera Mengalami Kendala">
              <CameraCapture
                ref={cameraRef}
                compact={true}
                hideInternalShutter={true}
                capturedImage={photoBase64}
                onCapture={(img) => setPhotoBase64(img)}
                onRetake={() => setPhotoBase64(null)}
                disabled={isSubmitting}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* Tombol Eksekusi Aksi: Ambil Foto / Presensi */}
        {employee && (
          <div className="animate-slide-up space-y-2 pt-0.5">
            {/* TAHAP 1: SEBELUM FOTO DIAMBIL -> TOMBOL DI BAWAH BERFUNGSI SEBAGAI SHUTTER JEPRET */}
            {!photoBase64 ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => cameraRef.current?.takeSnapshot()}
                className="w-full py-3.5 px-4 font-extrabold rounded-xl shadow-md text-sm transition flex items-center justify-center gap-2 cursor-pointer bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white shadow-sky-600/20"
              >
                <Camera className="w-4 h-4" />
                <span>Ambil Foto Wajah</span>
              </button>
            ) : (
              <>
                {/* Opsi Dinas Luar jika berada di luar radius (Senin - Kamis) */}
                {!isInsideRadius && !isFriday && (
                  <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200 text-left space-y-2.5 animate-slide-up shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                          <Briefcase className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-amber-950 block truncate">
                            Sedang Tugas Dinas Luar?
                          </span>
                          <span className="text-[10px] text-amber-700 block truncate">
                            Aktifkan jika bertugas di luar kampus
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDinasLuar(!isDinasLuar);
                          if (isDinasLuar) setDinasLuarNote('');
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                          isDinasLuar
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-amber-200 hover:bg-amber-300 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {isDinasLuar ? '✓ Mode Aktif' : 'Aktifkan'}
                      </button>
                    </div>

                    {isDinasLuar && (
                      <div className="space-y-1.5 pt-2 border-t border-amber-200/80 animate-slide-up">
                        <label className="block text-[11px] font-bold text-amber-950">
                          Keterangan Agenda / Lokasi Dinas Luar (Wajib):
                        </label>
                        <input
                          type="text"
                          value={dinasLuarNote}
                          onChange={(e) => setDinasLuarNote(e.target.value)}
                          placeholder="Contoh: Rapat Koordinasi di LLDIKTI IX / Sosialisasi..."
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                        <p className="text-[10px] text-amber-700">
                          *Wajib diisi min. 5 karakter. Status tercatat resmi untuk verifikasi Atasan & Admin.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {!attendance?.hasClockedIn ? (
                  /* TAHAP 2A: FOTO SUDAH DIAMBIL & BELUM PRESENSI MASUK */
                  <button
                    type="button"
                    disabled={
                      isSubmitting ||
                      (!isInsideRadius && (!isDinasLuar || dinasLuarNote.trim().length < 5))
                    }
                    onClick={handleSubmit}
                    className={`w-full py-3.5 px-4 font-extrabold rounded-xl shadow-md text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                      !isInsideRadius && !isDinasLuar
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed shadow-none'
                        : isDinasLuar && dinasLuarNote.trim().length < 5
                        ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                        : isDinasLuar
                        ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-amber-900/20'
                        : 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white shadow-sky-600/20'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mencatat Presensi Masuk...</span>
                      </>
                    ) : !isInsideRadius && !isDinasLuar ? (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>Di Luar Radius Kampus</span>
                      </>
                    ) : isDinasLuar ? (
                      <>
                        <Briefcase className="w-4 h-4" />
                        <span>
                          {dinasLuarNote.trim().length < 5
                            ? 'Tulis Keterangan Dinas Luar'
                            : '⚡ Presensi Masuk (Dinas Luar)'}
                        </span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>⚡ Presensi Masuk Sekarang</span>
                      </>
                    )}
                  </button>
                ) : !attendance?.hasClockedOut ? (
                  /* TAHAP 2B: FOTO SUDAH DIAMBIL & SIAP PRESENSI PULANG */
                  <button
                    type="button"
                    disabled={
                      isSubmitting ||
                      (!isInsideRadius && (!isDinasLuar || dinasLuarNote.trim().length < 5))
                    }
                    onClick={handleSubmit}
                    className={`w-full py-3.5 px-4 font-extrabold rounded-xl shadow-md text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                      !isInsideRadius && !isDinasLuar
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed shadow-none'
                        : isDinasLuar && dinasLuarNote.trim().length < 5
                        ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                        : isDinasLuar
                        ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-amber-900/20'
                        : 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-rose-950/20'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Mencatat Presensi Pulang...</span>
                      </>
                    ) : !isInsideRadius && !isDinasLuar ? (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>Di Luar Radius Kampus</span>
                      </>
                    ) : isDinasLuar ? (
                      <>
                        <Briefcase className="w-4 h-4" />
                        <span>
                          {dinasLuarNote.trim().length < 5
                            ? 'Tulis Keterangan Dinas Luar'
                            : '⚡ Presensi Pulang (Dinas Luar)'}
                        </span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" />
                        <span>⚡ Presensi Pulang Sekarang</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-center">
                    <CheckCircle2 className="w-6 h-6 text-sky-600 mx-auto mb-1" />
                    <p className="text-xs font-bold text-sky-900">
                      Presensi Hari Ini Sudah Lengkap
                    </p>
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="mt-2 text-xs text-sky-700 underline font-semibold cursor-pointer"
                    >
                      Ganti ke Pegawai Lain
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Tombol Masuk Akun Langsung */}
            <div className="pt-1">
              <Link
                href="/login"
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-200/90 transition cursor-pointer shadow-2xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>Masuk Akun</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
