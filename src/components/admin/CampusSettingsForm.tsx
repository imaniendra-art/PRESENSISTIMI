'use client';

import { useState } from 'react';
import {
  updateCampusSettings,
  createCampusLocation,
  updateCampusLocation,
  toggleCampusLocationStatus,
  deleteCampusLocation,
} from '@/actions/adminActions';
import { CampusSetting, CampusLocation } from '@prisma/client';
import {
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  LocateFixed,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Users,
} from 'lucide-react';

interface CampusSettingsFormProps {
  setting: CampusSetting;
  locations: (CampusLocation & {
    _count?: {
      assignedUsers: number;
      attendances: number;
    };
  })[];
}

export function CampusSettingsForm({ setting, locations }: CampusSettingsFormProps) {
  const [activeTab, setActiveTab] = useState<'LOCATIONS' | 'HOURS'>('LOCATIONS');

  // Modals for Location
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [isEditLocationModalOpen, setIsEditLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);

  // Form states for location modal
  const [modalLat, setModalLat] = useState('');
  const [modalLng, setModalLng] = useState('');
  const [isGettingGps, setIsGettingGps] = useState(false);

  // General async states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Ambil titik GPS perangkat langsung
  const handleGetGpsCoords = () => {
    setIsGettingGps(true);
    setAlert(null);

    if (!('geolocation' in navigator)) {
      setAlert({ type: 'error', message: 'Browser tidak mendukung GPS Geolocation' });
      setIsGettingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setModalLat(pos.coords.latitude.toFixed(6));
        setModalLng(pos.coords.longitude.toFixed(6));
        setIsGettingGps(false);
        setAlert({
          type: 'success',
          message: `Koordinat GPS berhasil diperoleh: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)} (Akurasi: ±${Math.round(pos.coords.accuracy)}m)`,
        });
      },
      (err) => {
        console.error('Error GPS:', err);
        setAlert({ type: 'error', message: 'Gagal membaca koordinat GPS perangkat' });
        setIsGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Submit: Tambah Gedung
  const handleCreateLocation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await createCampusLocation(formData);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsAddLocationModalOpen(false);
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Terjadi kesalahan sistem' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit: Edit Gedung
  const handleUpdateLocation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateCampusLocation(formData);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsEditLocationModalOpen(false);
        setSelectedLocation(null);
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Gagal memperbarui gedung' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit: Toggle Status Aktif Gedung
  const handleToggleStatus = async (id: string) => {
    setAlert(null);
    try {
      const res = await toggleCampusLocationStatus(id);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Gagal mengubah status gedung' });
    }
  };

  // Submit: Hapus Gedung
  const handleDeleteLocation = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus gedung "${name}" dari sistem?`)) {
      return;
    }
    setAlert(null);
    try {
      const res = await deleteCampusLocation(id);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Gagal menghapus gedung' });
    }
  };

  // Submit: Pengaturan Jam Kerja
  const handleUpdateHours = async (e: React.FormEvent<HTMLFormElement>) => {
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
      setAlert({ type: 'error', message: 'Gagal menyimpan pengaturan jam kerja' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notifikasi */}
      {alert && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 text-xs font-medium leading-relaxed ${
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

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('LOCATIONS')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'LOCATIONS'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Daftar Gedung & Lokasi Kampus ({locations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HOURS')}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'HOURS'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Jam Operasional Institusi</span>
        </button>
      </div>

      {/* ================= TAB 1: DAFTAR MULTI-GEDUNG ================= */}
      {activeTab === 'LOCATIONS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Master Lokasi Gedung STIMI</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Setiap gedung memiliki titik GPS dan radius toleransi sendiri. Pegawai dapat ditugaskan ke gedung tertentu atau bebas di semua gedung.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setModalLat('');
                setModalLng('');
                setIsAddLocationModalOpen(true);
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-sky-200 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Gedung Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className={`bg-white rounded-3xl border p-5 shadow-xs transition space-y-3 relative ${
                  loc.isActive ? 'border-slate-200 hover:border-sky-300' : 'border-slate-200 bg-slate-50/50 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        loc.isActive
                          ? 'bg-sky-50 text-sky-700 border border-sky-100'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{loc.name}</h4>
                      {loc.code && (
                        <span className="inline-block mt-0.5 px-2 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-mono font-bold">
                          {loc.code}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      loc.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {loc.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{loc.address}</span>
                </p>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Koordinat GPS</span>
                    <span className="font-mono text-[11px] font-semibold text-slate-800">
                      {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Batas Radius Geofence</span>
                    <span className="font-bold text-sky-700">{loc.radiusMeters} meter</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {loc._count?.assignedUsers || 0} Pegawai
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLocation(loc);
                        setModalLat(loc.latitude.toString());
                        setModalLng(loc.longitude.toString());
                        setIsEditLocationModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                      title="Edit Gedung"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(loc.id)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        loc.isActive ? 'text-slate-400 hover:text-rose-600' : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={loc.isActive ? 'Nonaktifkan Gedung' : 'Aktifkan Gedung'}
                    >
                      {loc.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteLocation(loc.id, loc.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Hapus Gedung"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 2: JAM KERJA INSTITUSI ================= */}
      {activeTab === 'HOURS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Ketentuan Jam Masuk & Pulang</h3>
              <p className="text-xs text-slate-500">Berlaku seragam untuk seluruh gedung kampus STIMI Makassar</p>
            </div>
          </div>

          <form onSubmit={handleUpdateHours} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Institusi Perguruan Tinggi
              </label>
              <input
                type="text"
                name="campusName"
                defaultValue={setting.campusName}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Utama Kampus
              </label>
              <textarea
                name="address"
                defaultValue={setting.address}
                required
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jam Masuk Standar (WITA)
                </label>
                <input
                  type="time"
                  name="workStart"
                  defaultValue={setting.workStart}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jam Pulang Standar (WITA)
                </label>
                <input
                  type="time"
                  name="workEnd"
                  defaultValue={setting.workEnd}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Toleransi Keterlambatan (Menit)
              </label>
              <input
                type="number"
                name="gracePeriodMinutes"
                defaultValue={setting.gracePeriodMinutes}
                min={0}
                max={60}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Contoh: 15 menit berarti pegawai yang presensi sebelum 08:15 tetap dinyatakan Tepat Waktu.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-200 cursor-pointer"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Ketentuan Jam Kerja'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: TAMBAH GEDUNG ================= */}
      {isAddLocationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                Tambah Lokasi Gedung Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Gedung / Kampus *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Contoh: Kampus III - Gedung FEB"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kode Singkat
                  </label>
                  <input
                    type="text"
                    name="code"
                    placeholder="KAMPUS_3"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alamat Lengkap Gedung *
                </label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  placeholder="Jl. Contoh No. 123, Makassar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              {/* Tombol Ambil GPS */}
              <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-sky-900 block">Isi Koordinat dari Posisi Anda?</span>
                  <span className="text-[10px] text-sky-700">Jika Anda sedang berada di lokasi gedung tersebut</span>
                </div>
                <button
                  type="button"
                  onClick={handleGetGpsCoords}
                  disabled={isGettingGps}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>{isGettingGps ? 'Mencari...' : 'Gunakan GPS'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={modalLat}
                    onChange={(e) => setModalLat(e.target.value)}
                    required
                    placeholder="-5.147665"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={modalLng}
                    onChange={(e) => setModalLng(e.target.value)}
                    required
                    placeholder="119.432732"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Radius (Meter) *
                  </label>
                  <input
                    type="number"
                    name="radiusMeters"
                    defaultValue={100}
                    min={10}
                    max={1000}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddLocationModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-sky-200 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Gedung'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT GEDUNG ================= */}
      {isEditLocationModalOpen && selectedLocation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-600" />
                Edit Gedung: {selectedLocation.name}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditLocationModalOpen(false);
                  setSelectedLocation(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLocation} className="space-y-3.5">
              <input type="hidden" name="id" value={selectedLocation.id} />

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Gedung / Kampus *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedLocation.name}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kode Singkat
                  </label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={selectedLocation.code || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alamat Lengkap Gedung *
                </label>
                <textarea
                  name="address"
                  defaultValue={selectedLocation.address}
                  required
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-sky-900 block">Ambil GPS Saat Ini?</span>
                  <span className="text-[10px] text-sky-700">Perbarui koordinat dengan lokasi perangkat Anda</span>
                </div>
                <button
                  type="button"
                  onClick={handleGetGpsCoords}
                  disabled={isGettingGps}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>{isGettingGps ? 'Mencari...' : 'Gunakan GPS'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={modalLat}
                    onChange={(e) => setModalLat(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={modalLng}
                    onChange={(e) => setModalLng(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Radius (Meter) *
                  </label>
                  <input
                    type="number"
                    name="radiusMeters"
                    defaultValue={selectedLocation.radiusMeters}
                    min={10}
                    max={1000}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditLocationModalOpen(false);
                    setSelectedLocation(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-sky-200 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
