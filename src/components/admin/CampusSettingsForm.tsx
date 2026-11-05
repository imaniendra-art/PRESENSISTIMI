'use client';

import { useState } from 'react';
import { updateCampusSettings } from '@/actions/adminActions';
import { CampusSetting } from '@prisma/client';
import {
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LocateFixed,
} from 'lucide-react';

interface CampusSettingsFormProps {
  setting: CampusSetting;
}

export function CampusSettingsForm({ setting }: CampusSettingsFormProps) {
  const [lat, setLat] = useState(setting.latitude.toString());
  const [lng, setLng] = useState(setting.longitude.toString());
  const [radius, setRadius] = useState(setting.radiusMeters.toString());
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true);
    setAlert(null);

    if (!('geolocation' in navigator)) {
      setAlert({ type: 'error', message: 'Browser tidak mendukung GPS Geolocation' });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setIsGettingLocation(false);
        setAlert({
          type: 'success',
          message: `Koordinat berhasil diperbarui dari GPS perangkat: ${pos.coords.latitude.toFixed(
            6
          )}, ${pos.coords.longitude.toFixed(6)} (Akurasi: ±${Math.round(
            pos.coords.accuracy
          )} meter)`,
        });
      },
      (err) => {
        console.error('Error GPS:', err);
        setAlert({ type: 'error', message: 'Gagal mengambil koordinat GPS saat ini' });
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateCampusSettings(formData);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Terjadi kesalahan sistem saat menyimpan' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-3xl">
      {alert && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-xs font-medium leading-relaxed ${
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
          <span>{alert.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Kampus */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Identitas Institusi</span>
          </h3>
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kampus</label>
              <input
                type="text"
                name="campusName"
                defaultValue={setting.campusName}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Kampus</label>
              <input
                type="text"
                name="address"
                defaultValue={setting.address}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Titik Geofencing & Radius */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>Titik Pusat Geofence & Radius Toleransi</span>
            </h3>

            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span>{isGettingLocation ? 'Mencari...' : 'Gunakan GPS Saat Ini'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Latitude (Lintang)
              </label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Longitude (Bujur)
              </label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Radius Toleransi (Meter)
              </label>
              <input
                type="number"
                step="1"
                name="radiusMeters"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Pegawai hanya diizinkan presensi masuk jika berada dalam jarak $\le$ radius meter di atas.
          </p>
        </div>

        {/* Jam Kerja Standar & Toleransi */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Jam Kerja Standar & Toleransi Keterlambatan</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Masuk (Format HH:mm)
              </label>
              <input
                type="text"
                name="workStart"
                defaultValue={setting.workStart}
                required
                placeholder="08:00"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Pulang (Format HH:mm)
              </label>
              <input
                type="text"
                name="workEnd"
                defaultValue={setting.workEnd}
                required
                placeholder="16:30"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Toleransi Telat (Menit)
              </label>
              <input
                type="number"
                name="gracePeriodMinutes"
                defaultValue={setting.gracePeriodMinutes}
                required
                min="0"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-200 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan Konfigurasi...' : 'Perbarui Pengaturan Kampus'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
