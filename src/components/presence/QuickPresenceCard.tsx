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
        )}m). Presensi cepat wajib dilakukan di area kampus STIMI.`,
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
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden max-w-md mx-auto p-5 sm:p-6 text-center animate-slide-up space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto border-2 border-sky-200 shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="px-3 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold font-mono uppercase tracking-wider inline-block mb-1.5">
            {successData.actionType === 'IN' ? '✓ Presensi Masuk Berhasil' : '✓ Presensi Pulang Berhasil'}
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
            {successData.employeeName}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tercatat di {successData.locationName} pukul{' '}
            <strong className="text-slate-800 font-mono">{successData.time}</strong>
          </p>
        </div>

        {/* Progress Bar Countdown Auto-Reset */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Siap untuk pegawai berikutnya:</span>
            <span className="font-mono font-bold text-sky-700 tabular-nums">
              {countdown} detik
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${(countdown / 4) * 100}%` }}
              className="h-full bg-sky-600 transition-all duration-1000 ease-linear rounded-full"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetForm}
          className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-950/20 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Presensi Pegawai Lain Sekarang</span>
        </button>
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
                  isInsideRadius ? 'bg-sky-400' : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isInsideRadius ? 'bg-sky-500' : 'bg-rose-500'
                }`}
              />
            </span>
            <div className="min-w-0">
              <span className="font-bold text-slate-800 block text-xs truncate">
                {isLocating
                  ? 'Mengunci titik GPS...'
                  : isInsideRadius
                  ? `Di Dalam Radius: ${locationEval?.targetName}`
                  : `Di Luar Radius: ${locationEval?.targetName || 'Kampus'}`}
              </span>
              {locationEval && (
                <span className="text-[10px] text-slate-500 font-mono block">
                  Jarak: ±{Math.round(locationEval.distance)}m (Batas: {locationEval.maxRadius}m)
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

        {/* Input NIP Pegawai (Tampil saat pegawai belum dipilih) */}
        {!employee ? (
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Nomor Induk Pegawai (NIP)</span>
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
                placeholder="Contoh: DSN01, TNK01"
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
                    {employee.nip}
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
            ) : !attendance?.hasClockedIn ? (
              /* TAHAP 2A: FOTO SUDAH DIAMBIL & BELUM PRESENSI MASUK */
              <button
                type="button"
                disabled={isSubmitting || !isInsideRadius}
                onClick={handleSubmit}
                className={`w-full py-3.5 px-4 font-extrabold rounded-xl shadow-md text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                  !isInsideRadius
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed shadow-none'
                    : 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white shadow-sky-600/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mencatat Presensi Masuk...</span>
                  </>
                ) : !isInsideRadius ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Di Luar Radius Kampus</span>
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
                disabled={isSubmitting || !isInsideRadius}
                onClick={handleSubmit}
                className={`w-full py-3.5 px-4 font-extrabold rounded-xl shadow-md text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                  !isInsideRadius
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed shadow-none'
                    : 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-rose-950/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mencatat Presensi Pulang...</span>
                  </>
                ) : !isInsideRadius ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Di Luar Radius Kampus</span>
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
