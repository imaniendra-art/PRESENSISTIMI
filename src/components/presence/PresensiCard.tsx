'use client';

import { useState, useEffect, useCallback } from 'react';
import { CameraCapture } from './CameraCapture';
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
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Attendance, CampusSetting, DutyTrip } from '@prisma/client';

interface PresensiCardProps {
  campusSetting: CampusSetting;
  todayAttendance: (Attendance & { dutyTrip?: DutyTrip | null }) | null;
  activeDutyTrip?: DutyTrip | null;
}

export function PresensiCard({
  campusSetting,
  todayAttendance,
  activeDutyTrip,
}: PresensiCardProps) {
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isDinasLuar, setIsDinasLuar] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const distance =
    coords && campusSetting
      ? calculateHaversineDistance(
          coords.lat,
          coords.lng,
          campusSetting.latitude,
          campusSetting.longitude
        )
      : null;

  const isInsideRadius =
    distance !== null ? distance <= campusSetting.radiusMeters : false;

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
        message: `Anda berada di luar radius kampus (${Math.round(
          distance || 0
        )}m). Batas toleransi adalah ${campusSetting.radiusMeters}m.`,
      });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      const res = await submitClockIn({
        latitude: coords.lat,
        longitude: coords.lng,
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

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header Presensi */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-5 sm:p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
            <Building className="w-4 h-4 text-indigo-400" />
            <span>{campusSetting.campusName}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-indigo-200">Jam Kerja: </span>
            <span className="text-xs font-bold text-white">
              {campusSetting.workStart} - {campusSetting.workEnd}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Presensi Hari Ini</h2>
            <p className="text-indigo-200 text-xs mt-0.5">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasClockedIn && (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold">
                ✓ Sudah Masuk
              </span>
            )}
            {hasClockedOut && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-semibold">
                ✓ Sudah Pulang
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {alert && (
          <div
            className={`p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed ${
              alert.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="font-medium">{alert.message}</span>
          </div>
        )}

        {hasClockedIn && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Jam Masuk</p>
                <p className="text-sm font-bold text-slate-800">
                  {todayAttendance?.clockInTime
                    ? new Date(todayAttendance.clockInTime).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                    {todayAttendance?.clockInStatus}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Jam Pulang</p>
                <p className="text-sm font-bold text-slate-800">
                  {todayAttendance?.clockOutTime
                    ? new Date(todayAttendance.clockOutTime).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Belum Presensi Pulang'}
                  {todayAttendance?.clockOutStatus && (
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">
                      {todayAttendance.clockOutStatus}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Indikator Status Geofencing GPS */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800">Lokasi Anda</span>
            </div>
            <button
              type="button"
              onClick={refreshLocation}
              className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold underline"
            >
              Segarkan GPS
            </button>
          </div>

          {isLocating ? (
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              Mendeteksi koordinat satelit GPS perangkat...
            </p>
          ) : geoError ? (
            <p className="text-xs text-rose-600 font-medium">{geoError}</p>
          ) : (
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Koordinat:</span>
                <span className="font-mono text-slate-800">
                  {coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : 'Menunggu izin GPS...'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Jarak ke Kampus:</span>
                <span className="font-semibold text-slate-800">
                  {distance !== null ? `${Math.round(distance)} meter` : '-'} (Radius maks:{' '}
                  {campusSetting.radiusMeters}m)
                </span>
              </div>

              <div className="pt-2">
                {isDinasLuar ? (
                  <div className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px] flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mode Dinas Luar Aktif — Pengecekan radius kampus dilewati.</span>
                  </div>
                ) : isInsideRadius ? (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>✓ Di Dalam Radius Kampus STIMI (Presensi Sah)</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 font-semibold text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Di Luar Radius Kampus. Mendekatlah ke area STIMI.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
                      Aktifkan untuk presensi di lokasi penugasan luar kampus
                    </p>
                  </div>
                </div>
                <input
                  id="dinasLuarToggle"
                  type="checkbox"
                  checked={isDinasLuar}
                  onChange={(e) => setIsDinasLuar(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
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
                placeholder={isDinasLuar ? 'Contoh: Rapat dinas di LLDIKTI' : 'Catatan harian...'}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {hasClockedIn
                    ? 'Verifikasi Foto Wajah (Presensi Pulang)'
                    : 'Verifikasi Foto Wajah (Presensi Masuk)'}
                </span>
              </label>

              <CameraCapture
                capturedImage={photoBase64}
                onCapture={(img) => setPhotoBase64(img)}
                onRetake={() => setPhotoBase64(null)}
                disabled={isSubmitting}
              />
            </div>

            <div className="pt-2">
              {!hasClockedIn ? (
                <button
                  type="button"
                  disabled={isSubmitting || !photoBase64 || (!isDinasLuar && !isInsideRadius)}
                  onClick={handleClockIn}
                  className="w-full py-4 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 text-sm transition flex items-center justify-center gap-2"
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
                  className="w-full py-4 px-5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-rose-200 text-sm transition flex items-center justify-center gap-2"
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
          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-emerald-900">
              Presensi Hari Ini Telah Selesai!
            </h3>
            <p className="text-xs text-emerald-700 mt-1">
              Terima kasih atas dedikasi dan pengabdian Anda di STIMI hari ini. Selamat beristirahat!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
