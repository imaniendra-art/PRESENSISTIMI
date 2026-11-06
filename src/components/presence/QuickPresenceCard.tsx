'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CameraCapture } from './CameraCapture';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { calculateHaversineDistance } from '@/lib/geo';
import { lookupEmployeeByNip, submitQuickPresence } from '@/actions/presenceActions';
import {
  MapPin,
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building,
  Building2,
  Sparkles,
  Zap,
  Radio,
  Search,
  UserCheck,
  ShieldCheck,
  Lock,
  ArrowRight,
  RotateCcw,
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

export function QuickPresenceCard({
  campusSetting,
  campusLocations = [],
}: QuickPresenceCardProps) {
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
  const [pinInput, setPinInput] = useState('');
  const [isSearchingNip, setIsSearchingNip] = useState(false);
  const [employee, setEmployee] = useState<EmployeePreview | null>(null);
  const [attendance, setAttendance] = useState<TodayAttendanceStatus | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Camera & Submission State
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-Reset 4 Detik
  const [successData, setSuccessData] = useState<{
    employeeName: string;
    actionType: 'IN' | 'OUT';
    time: string;
    locationName: string;
  } | null>(null);
  const [countdown, setCountdown] = useState(4);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Jam berdetak live setiap 1 detik
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
    refreshLocation();
  }, [refreshLocation]);

  // Evaluasi Geofence Dinamis
  const locationEval = useMemo(() => {
    if (!coords) return null;

    if (employee?.assignedLocationName && employee.assignedLocationRadius) {
      // Terikat ke gedung tertentu
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

    // Default: Gedung terdekat dari semua gedung kampus STIMI
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

  const isInsideRadius = locationEval ? locationEval.isInside : false;

  // Pencarian NIP Pegawai
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
      } else {
        setEmployee(null);
        setAttendance(null);
        setLookupError(res.message || 'NIP tidak terdaftar di sistem STIMI.');
      }
    } catch {
      setLookupError('Terjadi kendala saat memeriksa NIP. Coba lagi.');
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
    setPinInput('');
    setEmployee(null);
    setAttendance(null);
    setPhotoBase64(null);
    setAlert(null);
    setLookupError(null);
    setSuccessData(null);
    setCountdown(4);
  }, []);

  // Submit Presensi Cepat
  const handleSubmit = async () => {
    if (!employee) {
      setAlert({ type: 'error', message: 'Harap masukkan NIP pegawai yang valid terlebih dahulu.' });
      return;
    }

    if (!coords) {
      setAlert({ type: 'error', message: 'Sinyal GPS belum terdeteksi. Izinkan akses lokasi pada browser Anda.' });
      return;
    }

    if (!isInsideRadius) {
      setAlert({
        type: 'error',
        message: `Presensi ditolak. Anda berada di luar batas gedung ${locationEval?.targetName} (${Math.round(
          locationEval?.distance || 0
        )}m). Batas toleransi radius adalah ${locationEval?.maxRadius}m.`,
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
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: coords.accuracy,
        photoBase64,
        pin: pinInput,
      });

      if (res.success && res.actionType) {
        setSuccessData({
          employeeName: res.employeeName || employee.name,
          actionType: res.actionType,
          time: res.time || 'WITA',
          locationName: res.locationName || locationEval?.targetName || 'Kampus STIMI',
        });

        // Haptic feedback pada HP
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate?.([60, 50, 60]);
          } catch {}
        }

        // Mulai hitung mundur 4 detik untuk auto-reset
        setCountdown(4);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              handleResetForm();
              return 4;
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

  // JIKA SUDAH SUKSES: Tampilkan Layar Sukses & Countdown Auto-Reset
  if (successData) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden max-w-lg mx-auto p-6 sm:p-8 text-center animate-slide-up space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto border-2 border-sky-200 shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold font-mono uppercase tracking-wider inline-block mb-2">
            {successData.actionType === 'IN' ? '✓ Presensi Masuk Berhasil' : '✓ Presensi Pulang Berhasil'}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {successData.employeeName}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tercatat resmi di {successData.locationName} pada pukul{' '}
            <strong className="text-slate-800 font-mono">{successData.time}</strong>
          </p>
        </div>

        {/* Progress Bar Countdown Auto-Reset */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Siap untuk pegawai berikutnya dalam:</span>
            <span className="font-mono font-bold text-sky-700 tabular-nums">
              {countdown} detik
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${(countdown / 4) * 100}%` }}
              className="h-full bg-sky-600 transition-all duration-1000 ease-linear rounded-full"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetForm}
          className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-950/20 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Presensi Pegawai Lain Sekarang</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden max-w-lg mx-auto">
      {/* Header Presensi Cepat - Clean & Fresh Biru Langit (#87CEEB) */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-5 sm:p-6 text-white border-b border-sky-800/40 relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Presensi Cepat Pegawai
            </h1>
            <p className="text-sky-200/90 text-[11px] mt-1 font-medium">
              Cukup ketik NIP, verifikasi foto selfie, dan langsung tercatat.
            </p>
          </div>

          {/* Jam Live Digital WITA */}
          <div className="bg-sky-900/60 backdrop-blur-md border border-[#87CEEB]/40 rounded-2xl px-3.5 py-2 text-center shrink-0 shadow-inner">
            <span className="text-[9px] text-[#87CEEB] font-bold uppercase tracking-widest block">
              Live WITA
            </span>
            <span className="font-mono tabular-nums text-xl sm:text-2xl font-extrabold text-white">
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Notifikasi Pesan */}
        {alert && (
          <div
            className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-xs leading-relaxed animate-slide-up ${
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

        {/* Status Radar Geofence GPS Ringkas */}
        <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isInsideRadius ? 'bg-sky-400' : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isInsideRadius ? 'bg-sky-500' : 'bg-rose-500'
                }`}
              />
            </span>
            <div>
              <span className="font-bold text-slate-800 block text-xs">
                {isLocating
                  ? 'Mengunci titik GPS...'
                  : isInsideRadius
                  ? `Di Dalam Radius: ${locationEval?.targetName}`
                  : `Di Luar Radius: ${locationEval?.targetName || 'Kampus'}`}
              </span>
              {locationEval && (
                <span className="text-[10px] text-slate-500 font-mono">
                  Jarak: ±{Math.round(locationEval.distance)}m (Batas: {locationEval.maxRadius}m)
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={refreshLocation}
            disabled={isLocating}
            className="text-[11px] text-sky-700 hover:text-sky-800 font-bold underline shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Radio className="w-3 h-3 text-sky-600" />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Input NIP Pegawai */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>Nomor Induk Pegawai (NIP):</span>
            <span className="text-[11px] text-slate-400 font-normal">Contoh: DSN01, TNK01</span>
          </label>

          <div className="relative">
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
              placeholder="Ketik NIP Anda..."
              autoCapitalize="characters"
              className="w-full pl-3.5 pr-10 py-3 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition uppercase tracking-wider"
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

          {/* Tombol Masuk Akun di Bawah NIP */}
          <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
            <span className="text-slate-500 text-[11px]">Bukan presensi cepat?</span>
            <Link
              href="/login"
              className="text-sky-700 hover:text-sky-800 font-bold text-[11px] underline flex items-center gap-1 cursor-pointer"
            >
              <span>Masuk Akun Pribadi / Admin →</span>
            </Link>
          </div>
        </div>

        {/* Kartu Preview Identitas Pegawai Terdeteksi */}
        {employee && (
          <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 animate-slide-up space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {employee.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {employee.name}
                  </p>
                  <p className="text-[11px] text-sky-800 font-medium">
                    {employee.jabatan} • {employee.unitKerja}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300 text-[10px] font-bold font-mono">
                {employee.nip}
              </span>
            </div>

            {/* Status Kehadiran Hari Ini */}
            <div className="pt-2 border-t border-sky-200/70 flex items-center justify-between text-xs">
              <span className="text-slate-600">Status Hari Ini:</span>
              <span className="font-semibold text-slate-900">
                {!attendance?.hasClockedIn ? (
                  <span className="text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full text-[11px]">
                    Belum Presensi Masuk
                  </span>
                ) : !attendance?.hasClockedOut ? (
                  <span className="text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full text-[11px]">
                    ✓ Sudah Masuk (Siap Pulang)
                  </span>
                ) : (
                  <span className="text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full text-[11px]">
                    ✓ Selesai (Masuk & Pulang Lengkap)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Input PIN / 4 Angka Opsional */}
        {employee && (
          <div className="space-y-1.5 animate-slide-up">
            <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>PIN / Sandi Verifikasi (Opsional):</span>
              </span>
              <span className="text-[10px] text-slate-400">4 angka terakhir NIP atau sandi</span>
            </label>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Masukkan 4 angka terakhir NIP / sandi..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>
        )}

        {/* Kamera Selfie Portrait 3:4 */}
        {employee && (
          <div className="space-y-2 animate-slide-up">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>
                {attendance?.hasClockedIn
                  ? 'Ambil Foto Wajah (Presensi Pulang)'
                  : 'Ambil Foto Wajah (Presensi Masuk)'}
              </span>
            </label>

            <ErrorBoundary fallbackTitle="Kamera Mengalami Kendala">
              <CameraCapture
                capturedImage={photoBase64}
                onCapture={(img) => setPhotoBase64(img)}
                onRetake={() => setPhotoBase64(null)}
                disabled={isSubmitting}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* Tombol Eksekusi Presensi Cepat */}
        {employee && (
          <div className="pt-2 animate-slide-up">
            {!attendance?.hasClockedIn ? (
              <button
                type="button"
                disabled={isSubmitting || !photoBase64 || !isInsideRadius}
                onClick={handleSubmit}
                className="w-full py-4 px-5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-lg shadow-sky-950/20 border border-sky-400/30 text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mencatat Presensi Masuk...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>⚡ Presensi Masuk Sekarang</span>
                  </>
                )}
              </button>
            ) : !attendance?.hasClockedOut ? (
              <button
                type="button"
                disabled={isSubmitting || !photoBase64 || !isInsideRadius}
                onClick={handleSubmit}
                className="w-full py-4 px-5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-950/20 border border-rose-400/30 text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mencatat Presensi Pulang...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>⚡ Presensi Pulang Sekarang</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 text-center">
                <CheckCircle2 className="w-8 h-8 text-sky-600 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-sky-900">
                  Presensi Hari Ini Sudah Lengkap
                </p>
                <p className="text-[11px] text-sky-700 mt-0.5">
                  Anda sudah melakukan presensi masuk dan pulang hari ini.
                </p>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="mt-3 text-xs text-sky-700 underline font-semibold cursor-pointer"
                >
                  Ganti ke Pegawai Lain
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
