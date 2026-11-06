'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CameraCapture } from './CameraCapture';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { calculateHaversineDistance } from '@/lib/geo';
import { submitClockIn, submitClockOut } from '@/actions/presenceActions';
import {
  MapPin,
  Clock,
  Briefcase,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  Building,
  Building2,
  Sparkles,
  Radio,
} from 'lucide-react';
import { Attendance, CampusSetting, CampusLocation, DutyTrip } from '@prisma/client';

interface PresensiCardProps {
  campusSetting: CampusSetting;
  campusLocations?: CampusLocation[];
  todayAttendance: (Attendance & { dutyTrip?: DutyTrip | null; location?: CampusLocation | null }) | null;
  activeDutyTrip?: DutyTrip | null;
  assignedLocation?: CampusLocation | null;
}

export function PresensiCard({
  campusSetting,
  campusLocations = [],
  todayAttendance,
  activeDutyTrip,
  assignedLocation,
}: PresensiCardProps) {
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isDinasLuar, setIsDinasLuar] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Jam digital live berdetak setiap detik
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshLocation = useCallback(() => {
    setIsLocating(true);
    setGeoError(null);

    if (!('geolocation' in navigator)) {
      setGeoError('Perangkat Anda tidak mendukung fitur Geolocation');
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
        setGeoError('Gagal memperoleh titik GPS. Pastikan izin lokasi aktif.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        console.error('GPS initial error:', err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Evaluasi Lokasi Gedung & Geofencing Dinamis
  const locationEval = useMemo(() => {
    if (!coords) return null;

    if (assignedLocation) {
      // 1. Terkunci ke 1 Gedung Spesifik
      const dist = calculateHaversineDistance(
        coords.lat,
        coords.lng,
        assignedLocation.latitude,
        assignedLocation.longitude
      );
      return {
        targetName: assignedLocation.name,
        targetCode: assignedLocation.code,
        distance: dist,
        maxRadius: assignedLocation.radiusMeters,
        isInside: dist <= assignedLocation.radiusMeters,
        isSpecific: true,
      };
    }

    // 2. Fleksibel di Semua Gedung Kampus
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
        targetCode: nearest.code,
        distance: minDist,
        maxRadius: nearest.radiusMeters,
        isInside: minDist <= nearest.radiusMeters,
        isSpecific: false,
      };
    }

    // Fallback ke pengaturan default
    const dist = calculateHaversineDistance(
      coords.lat,
      coords.lng,
      campusSetting.latitude,
      campusSetting.longitude
    );
    return {
      targetName: campusSetting.campusName,
      targetCode: null,
      distance: dist,
      maxRadius: campusSetting.radiusMeters,
      isInside: dist <= campusSetting.radiusMeters,
      isSpecific: false,
    };
  }, [coords, assignedLocation, campusLocations, campusSetting]);

  const isInsideRadius = locationEval ? locationEval.isInside : false;
  const hasClockedIn = Boolean(todayAttendance?.clockInTime);
  const hasClockedOut = Boolean(todayAttendance?.clockOutTime);

  const handleClockIn = async () => {
    if (!coords) {
      setAlert({ type: 'error', message: 'Titik koordinat GPS belum terdeteksi.' });
      return;
    }
    if (!photoBase64) {
      setAlert({ type: 'error', message: 'Harap ambil foto selfie verifikasi terlebih dahulu.' });
      return;
    }
    if (!isDinasLuar && !isInsideRadius) {
      setAlert({
        type: 'error',
        message: `Anda berada di luar radius gedung ${locationEval?.targetName} (${Math.round(
          locationEval?.distance || 0
        )}m). Batas toleransi adalah ${locationEval?.maxRadius}m.`,
      });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      const res = await submitClockIn({
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: coords.accuracy,
        photoBase64,
        isDinasLuar,
        dutyTripId: activeDutyTrip?.id,
        note,
      });

      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setPhotoBase64(null);
        setNote('');
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Terjadi kesalahan sistem saat mengirim presensi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!coords) {
      setAlert({ type: 'error', message: 'Titik koordinat GPS belum terdeteksi.' });
      return;
    }
    if (!photoBase64) {
      setAlert({ type: 'error', message: 'Harap ambil foto selfie verifikasi kepulangan.' });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      const res = await submitClockOut({
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: coords.accuracy,
        photoBase64,
        note,
      });

      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setPhotoBase64(null);
        setNote('');
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Terjadi kesalahan saat memproses presensi pulang.' });
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

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
      {/* Header Presensi - Fresh Campus Emerald Theme */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 text-white border-b border-emerald-900/30 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <Building className="w-4 h-4 text-emerald-400" />
            <span>{campusSetting.campusName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-300">Jam Kerja Standar:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-900/60 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-200">
              {campusSetting.workStart} - {campusSetting.workEnd} WITA
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold mb-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Portal Presensi Digital Kampus</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Presensi Hari Ini
            </h2>
            <p className="text-slate-300 text-xs mt-1">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>

            <div className="flex items-center gap-2 mt-3">
              {hasClockedIn && (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Sudah Presensi Masuk
                </span>
              )}
              {hasClockedOut && (
                <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-400/40 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  Sudah Presensi Pulang
                </span>
              )}
            </div>
          </div>

          {/* Jam Digital Live Berdetak */}
          <div className="bg-emerald-950/70 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-4 text-center shadow-lg shadow-black/20 self-start md:self-auto min-w-[200px]">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-300 font-bold uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>Waktu Nyata (WITA)</span>
            </div>
            <div className="font-mono tabular-nums text-3xl sm:text-4xl font-extrabold text-white tracking-wider mt-1 drop-shadow-sm">
              {formattedTime}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Sinkronisasi Server STIMI</span>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* Alert Pesan Notifikasi */}
        {alert && (
          <div
            className={`p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed animate-slide-up ${
              alert.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="font-medium text-xs">{alert.message}</span>
          </div>
        )}

        {/* Informasi Status Masuk & Pulang Hari Ini */}
        {hasClockedIn && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 bg-slate-50 border border-slate-200/90 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Jam Masuk</p>
                  <p className="text-base font-extrabold text-slate-900 font-mono tabular-nums">
                    {todayAttendance?.clockInTime
                      ? new Date(todayAttendance.clockInTime).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-sans font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {todayAttendance?.clockInStatus}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Jam Pulang</p>
                  <p className="text-base font-extrabold text-slate-900 font-mono tabular-nums">
                    {todayAttendance?.clockOutTime
                      ? new Date(todayAttendance.clockOutTime).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Belum Presensi Pulang'}
                    {todayAttendance?.clockOutStatus && (
                      <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-sans font-semibold bg-teal-100 text-teal-800 border border-teal-200">
                        {todayAttendance.clockOutStatus}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Badge Lokasi Gedung yang Tercatat */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Presensi terekam resmi di: <strong>{todayAttendance?.locationName || todayAttendance?.location?.name || 'Kampus STIMI'}</strong>
                {todayAttendance?.clockInDistance !== null && todayAttendance?.clockInDistance !== undefined && (
                  <span className="text-emerald-800 font-mono text-[11px] ml-1">
                    (Jarak: ±{Math.round(todayAttendance.clockInDistance)}m)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Indikator Status Geofencing GPS Radar Interaktif */}
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/70 flex flex-col gap-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Radar animated dot */}
              <span className="relative flex h-3.5 w-3.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isInsideRadius || isDinasLuar ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                    isInsideRadius || isDinasLuar ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </span>
              <span className="text-xs font-bold text-slate-800">
                Status Radar Geofence Kampus
              </span>
            </div>
            <button
              type="button"
              onClick={refreshLocation}
              disabled={isLocating}
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold underline flex items-center gap-1"
            >
              <Radio className="w-3 h-3 text-emerald-600" />
              <span>Segarkan Sinyal</span>
            </button>
          </div>

          {isLocating ? (
            <p className="text-xs text-slate-500 flex items-center gap-2 py-1">
              <span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              Mengunci sinyal satelit GPS perangkat Anda...
            </p>
          ) : geoError ? (
            <p className="text-xs text-rose-600 font-semibold">{geoError}</p>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Koordinat Anda:</span>
                <span className="font-mono tabular-nums text-slate-900 font-semibold">
                  {coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : 'Menunggu izin GPS...'}
                </span>
              </div>

              {/* Akurasi Satelit */}
              {coords?.accuracy && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Presisi Sinyal Satelit:</span>
                  <span
                    className={`font-mono tabular-nums font-semibold ${
                      coords.accuracy <= 50 ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    ±{Math.round(coords.accuracy)} meter{' '}
                    <span className="font-sans font-normal text-[10px]">
                      {coords.accuracy <= 50 ? '(Akurasi Tinggi)' : '(Sinyal Lemah)'}
                    </span>
                  </span>
                </div>
              )}

              {/* Peringatan jika akurasi GPS terlalu lemah */}
              {coords && coords.accuracy > 50 && (
                <div className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Akurasi GPS ±{Math.round(coords.accuracy)}m. Untuk presisi maksimal, pastikan Anda berada di dekat ventilasi/jendela atau aktifkan Wi-Fi perangkat.
                  </span>
                </div>
              )}

              {locationEval && (
                <>
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
                    <span>
                      {locationEval.isSpecific ? 'Gedung Penugasan Anda:' : 'Gedung Kampus Terdekat:'}
                    </span>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      {locationEval.targetName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Jarak Fisik ke Gedung:</span>
                    <span className="font-semibold text-slate-900 font-mono tabular-nums">
                      {Math.round(locationEval.distance)} meter{' '}
                      <span className="text-slate-500 font-sans font-normal text-[11px]">
                        (Batas radius: {locationEval.maxRadius}m)
                      </span>
                    </span>
                  </div>
                </>
              )}

              <div className="pt-2">
                {isDinasLuar ? (
                  <div className="px-3 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-semibold text-[11px] flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Mode Dinas Luar Kota Aktif — Pengecekan radius gedung kampus dilewati secara sah.</span>
                  </div>
                ) : isInsideRadius ? (
                  <div className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold text-[11px] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ Di Dalam Radius {locationEval?.targetName} (Presensi Sah & Terverifikasi)</span>
                  </div>
                ) : (
                  <div className="px-3 py-2 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 font-semibold text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      {assignedLocation
                        ? `Di luar radius penugasan ${assignedLocation.name}. Harap mendekat ke lokasi penugasan.`
                        : 'Di luar radius seluruh gedung kampus STIMI. Harap mendekat ke salah satu area kampus.'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Formulir Presensi Kamera (Jika belum masuk atau belum pulang) */}
        {(!hasClockedIn || !hasClockedOut) && (
          <div className="space-y-4">
            {!hasClockedIn && (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-slate-600" />
                  <div>
                    <label
                      htmlFor="dinasLuarToggle"
                      className="text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      Sedang Bertugas Dinas Luar Kota?
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Aktifkan untuk presensi tugas di luar gedung kampus STIMI
                    </p>
                  </div>
                </div>
                <input
                  id="dinasLuarToggle"
                  type="checkbox"
                  checked={isDinasLuar}
                  onChange={(e) => setIsDinasLuar(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Kehadiran (Opsional):
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isDinasLuar ? 'Contoh: Rapat koordinasi di LLDIKTI IX' : 'Catatan harian...'}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {hasClockedIn
                    ? 'Verifikasi Foto Wajah (Presensi Pulang)'
                    : 'Verifikasi Foto Wajah (Presensi Masuk)'}
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

            <div className="pt-2">
              {!hasClockedIn ? (
                <button
                  type="button"
                  disabled={isSubmitting || !photoBase64 || (!isDinasLuar && !isInsideRadius)}
                  onClick={handleClockIn}
                  className="w-full py-4 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memproses Presensi Masuk...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Presensi Masuk Sekarang</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting || !photoBase64}
                  onClick={handleClockOut}
                  className="w-full py-4 px-5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-rose-600/20 text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memproses Presensi Pulang...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" />
                      <span>Presensi Pulang Sekarang</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {hasClockedIn && hasClockedOut && (
          <div className="p-6 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-center animate-slide-up">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-emerald-900">
              Presensi Hari Ini Telah Lengkap!
            </h3>
            <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
              Presensi masuk dan kepulangan Anda telah tersimpan dengan aman di server STIMI. Terima kasih atas dedikasi Anda hari ini!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
