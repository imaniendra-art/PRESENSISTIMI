'use client';

import { useState } from 'react';
import {
  updateCampusSettings,
  createCampusLocation,
  updateCampusLocation,
  toggleCampusLocationStatus,
  deleteCampusLocation,
  createWorkSchedule,
  updateWorkSchedule,
  deleteWorkSchedule,
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
  ShieldCheck,
  CalendarDays,
  Sparkles,
  Sliders,
  Laptop,
} from 'lucide-react';
import { LiveClock } from '@/components/common/LiveClock';

export interface WorkScheduleItem {
  id: string;
  name: string;
  code?: string | null;
  workStart: string;
  workEnd: string;
  scheduleType: string;
  workDays?: string | null;
  monthlyTargetDays?: number | null;
  description?: string | null;
  isDefault?: boolean;
  isActive: boolean;
  _count?: {
    users: number;
  };
}

interface CampusSettingsFormProps {
  setting: CampusSetting & {
    earliestClockIn?: string;
    wfaFriday?: boolean;
    workDays?: string;
  };
  locations: (CampusLocation & {
    _count?: {
      assignedUsers: number;
      attendances: number;
    };
  })[];
  workSchedules?: WorkScheduleItem[];
}

const DAYS_OF_WEEK = [
  { value: '1', label: 'Sen' },
  { value: '2', label: 'Sel' },
  { value: '3', label: 'Rab' },
  { value: '4', label: 'Kam' },
  { value: '5', label: 'Jum' },
  { value: '6', label: 'Sab' },
];

function formatDaysDisplay(daysStr?: string | null): string {
  if (!daysStr) return 'Senin - Jumat';
  const dayMap: Record<string, string> = {
    '1': 'Senin',
    '2': 'Selasa',
    '3': 'Rabu',
    '4': 'Kamis',
    '5': 'Jumat',
    '6': 'Sabtu',
    '0': 'Minggu',
  };
  return daysStr
    .split(',')
    .map((d) => dayMap[d.trim()] || d.trim())
    .join(', ');
}

export function CampusSettingsForm({ setting, locations, workSchedules = [] }: CampusSettingsFormProps) {
  const [activeTab, setActiveTab] = useState<'LOCATIONS' | 'HOURS' | 'SCHEDULES'>('LOCATIONS');

  // Modals for Location
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [isEditLocationModalOpen, setIsEditLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);

  // Modals for WorkSchedule
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [isEditScheduleModalOpen, setIsEditScheduleModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkScheduleItem | null>(null);
  const [scheduleTypeState, setScheduleTypeState] = useState<'STANDARD' | 'CUSTOM_DAYS' | 'MONTHLY_QUOTA'>('STANDARD');
  const [scheduleDaysState, setScheduleDaysState] = useState<string[]>(['1', '2', '3', '4', '5']);

  const toggleScheduleDay = (dayVal: string) => {
    if (scheduleDaysState.includes(dayVal)) {
      if (scheduleDaysState.length > 1) {
        setScheduleDaysState(scheduleDaysState.filter((d) => d !== dayVal));
      }
    } else {
      setScheduleDaysState([...scheduleDaysState, dayVal].sort());
    }
  };

  const openAddScheduleModal = () => {
    setScheduleTypeState('STANDARD');
    setScheduleDaysState(['1', '2', '3', '4', '5']);
    setIsAddScheduleModalOpen(true);
    setAlert(null);
  };

  const openEditScheduleModal = (ws: WorkScheduleItem) => {
    setSelectedSchedule(ws);
    const validScheduleTypes = ['STANDARD', 'CUSTOM_DAYS', 'MONTHLY_QUOTA'] as const;
    const isScheduleType = (v: unknown): v is 'STANDARD' | 'CUSTOM_DAYS' | 'MONTHLY_QUOTA' =>
      typeof v === 'string' && (validScheduleTypes as readonly string[]).includes(v);
    setScheduleTypeState(isScheduleType(ws.scheduleType) ? ws.scheduleType : 'STANDARD');
    if (ws.workDays) {
      setScheduleDaysState(ws.workDays.split(',').map((s) => s.trim()));
    } else {
      setScheduleDaysState(['1', '2', '3', '4', '5']);
    }
    setIsEditScheduleModalOpen(true);
    setAlert(null);
  };

  // Form states for location modal
  const [modalLat, setModalLat] = useState('');
  const [modalLng, setModalLng] = useState('');
  const [isGettingGps, setIsGettingGps] = useState(false);

  // General async states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // State Kebijakan Hari Kerja
  const [wfaFridayState, setWfaFridayState] = useState<boolean>(
    setting.wfaFriday !== undefined ? setting.wfaFriday : true
  );

  // Controlled states for Jam Standar & Simulasi Alur Presensi
  const [workStartVal, setWorkStartVal] = useState(setting.workStart || '09:00');
  const [workEndVal, setWorkEndVal] = useState(setting.workEnd || '16:00');
  const [earliestVal, setEarliestVal] = useState(setting.earliestClockIn || '06:30');
  const [graceVal, setGraceVal] = useState<number>(setting.gracePeriodMinutes ?? 15);
  const [radiusVal, setRadiusVal] = useState<number>(setting.radiusMeters ?? 100);

  // State Hari Kerja Interaktif (Bisa Dicentang / Dipilih)
  const [activeDays, setActiveDays] = useState<string[]>(
    setting.workDays ? setting.workDays.split(',').map((d) => d.trim()) : ['1', '2', '3', '4', '5']
  );

  const toggleActiveDay = (val: string) => {
    if (activeDays.includes(val)) {
      if (activeDays.length > 1) {
        setActiveDays(activeDays.filter((d) => d !== val));
      }
    } else {
      setActiveDays([...activeDays, val].sort());
    }
  };

  const setPresetDays = (preset: 'MON_FRI' | 'MON_SAT') => {
    if (preset === 'MON_FRI') {
      setActiveDays(['1', '2', '3', '4', '5']);
    } else {
      setActiveDays(['1', '2', '3', '4', '5', '6']);
    }
  };

  const getGraceTimeLimit = (startTime: string, graceMinutes: number) => {
    try {
      const [h, m] = startTime.split(':').map((x) => parseInt(x, 10));
      const totalM = h * 60 + m + (graceMinutes || 0);
      const endH = Math.floor(totalM / 60) % 24;
      const endM = totalM % 60;
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    } catch {
      return '09:15';
    }
  };

  const graceLimitDisplay = getGraceTimeLimit(workStartVal, graceVal);

  const activeLocationsCount = locations.filter((loc) => loc.isActive).length;

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
      setAlert({ type: 'error', message: 'Terjadi kesalahan sistem saat menambah gedung' });
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

  // Submit: Pengaturan Jam Kerja & Kebijakan
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
      setAlert({ type: 'error', message: 'Gagal menyimpan pengaturan kampus' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit: Tambah Pola Jadwal Baru
  const handleCreateSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await createWorkSchedule(formData);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsAddScheduleModalOpen(false);
        (e.target as HTMLFormElement).reset();
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Gagal menambahkan pola jadwal kerja' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit: Edit Pola Jadwal
  const handleUpdateSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateWorkSchedule(formData);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsEditScheduleModalOpen(false);
        setSelectedSchedule(null);
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Gagal memperbarui pola jadwal kerja' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit: Hapus Pola Jadwal
  const handleDeleteSchedule = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pola jadwal "${name}"?`)) {
      return;
    }
    setAlert(null);
    try {
      const res = await deleteWorkSchedule(id);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Gagal menghapus pola jadwal' });
    }
  };

  return (
    <div className="space-y-2.5 sm:space-y-6">
      {/* Alert Notifikasi */}
      {alert && (
        <div
          className={`p-3 sm:p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold leading-relaxed animate-in fade-in duration-200 ${
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

      {/* Soft Sky Hero Card - Simetris & Selaras dengan Overview, Monitoring & Data Pegawai */}
      <div className="bg-gradient-to-br from-sky-50/90 via-white to-sky-50/40 rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-sky-100/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
        {/* Header Row: Judul di Kiri & Jam Live di Sampingnya (Khusus Mobile Mengisi Space Kosong) */}
        <div className="flex items-center justify-between gap-2 w-full lg:w-auto">
          <div className="min-w-0">
            <h1 className="text-sm sm:text-2xl font-black text-slate-900 tracking-tight leading-tight whitespace-nowrap">
              Pengaturan Kampus & Presensi
            </h1>
            <p className="text-xs sm:text-lg font-extrabold text-slate-700 tracking-tight mt-0.5 leading-tight whitespace-nowrap">
              STIMI YAPMI Makassar
            </p>
          </div>

          {/* Jam Live Real-Time di Samping Tulisan (Tampil di Mobile) */}
          <div className="lg:hidden shrink-0">
            <LiveClock />
          </div>
        </div>

        {/* Sisi Kanan Desktop: Live Clock */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <LiveClock />
        </div>

        {/* Sisi Bawah Mobile: 4 Pill Box Keterangan Simetris (100% Selaras Overview) */}
        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 pt-1.5 sm:pt-2 border-t border-sky-100/80 lg:hidden w-full">
          <div className="flex items-center justify-center gap-1 py-1 px-1 bg-white/90 border border-sky-100 rounded-xl shadow-2xs min-w-0">
            <Building2 className="w-3 h-3 text-sky-600 shrink-0" />
            <span className="text-[9.5px] font-bold text-slate-800 whitespace-nowrap">
              {locations.length} Gedung
            </span>
          </div>

          <div className="flex items-center justify-center gap-0.5 py-1 px-0.5 bg-white/90 border border-sky-100 rounded-xl shadow-2xs min-w-0">
            <Clock className="w-2.5 h-2.5 text-sky-600 shrink-0" />
            <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-800 font-mono tracking-tighter whitespace-nowrap">
              {setting.workStart}-{setting.workEnd}
            </span>
          </div>

          <div className="flex items-center justify-center gap-1 py-1 px-1 bg-white/90 border border-sky-100 rounded-xl shadow-2xs min-w-0">
            <ShieldCheck className="w-3 h-3 text-sky-600 shrink-0" />
            <span className="text-[9.5px] font-bold text-slate-800 whitespace-nowrap">
              ±{setting.gracePeriodMinutes}m Tol.
            </span>
          </div>

          <div className="flex items-center justify-center gap-1 py-1 px-1 bg-white/90 border border-sky-100 rounded-xl shadow-2xs min-w-0">
            <CalendarDays className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="text-[9.5px] font-bold text-slate-800 whitespace-nowrap">
              {workSchedules.length} Pola
            </span>
          </div>
        </div>
      </div>

      {/* 4 Kartu Metrik Utama - 1 Baris 4 Kolom Identik dengan Overview, Monitoring & Data Pegawai */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-4 w-full">
        {/* Card 1: Total Gedung */}
        <div className="bg-white p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-200 transition">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              <span className="sm:hidden">Gedung</span>
              <span className="hidden sm:inline">Total Gedung</span>
            </span>
            <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
              <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-sm sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
            {locations.length}
          </p>
          <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">
            {activeLocationsCount}{' '}
            <span className="hidden sm:inline">Gedung Aktif</span>
            <span className="sm:hidden">Aktif</span>
          </p>
        </div>

        {/* Card 2: Jam Masuk */}
        <div className="bg-white p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              <span className="sm:hidden">Masuk</span>
              <span className="hidden sm:inline">Jam Masuk</span>
            </span>
            <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-sm sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
            {setting.workStart}
          </p>
          <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">
            <span className="hidden sm:inline">Batas Waktu Pagi</span>
            <span className="sm:hidden">WITA</span>
          </p>
        </div>

        {/* Card 3: Jam Pulang */}
        <div className="bg-white p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs hover:border-sky-200 transition">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              <span className="sm:hidden">Pulang</span>
              <span className="hidden sm:inline">Jam Pulang</span>
            </span>
            <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shrink-0">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-sm sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
            {setting.workEnd}
          </p>
          <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">
            <span className="hidden sm:inline">Batas Waktu Sore</span>
            <span className="sm:hidden">WITA</span>
          </p>
        </div>

        {/* Card 4: Toleransi Keterlambatan */}
        <div className="bg-white p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-200 transition">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              <span className="sm:hidden">Toleransi</span>
              <span className="hidden sm:inline">Toleransi Hadir</span>
            </span>
            <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
              <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-sm sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
            {setting.gracePeriodMinutes}m
          </p>
          <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">
            <span className="hidden sm:inline">Bebas Terlambat</span>
            <span className="sm:hidden">Bebas Lambat</span>
          </p>
        </div>
      </div>

      {/* Main Settings Container dengan Segmented Navigation */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden w-full">
        {/* Modern Segmented Tab Switcher */}
        <div className="p-2 sm:p-3 bg-slate-50/70 border-b border-slate-100">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('LOCATIONS')}
              className={`py-2 px-2 sm:px-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer truncate ${
                activeTab === 'LOCATIONS'
                  ? 'bg-white text-sky-700 shadow-xs border border-sky-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="truncate">Lokasi Gedung</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('HOURS')}
              className={`py-2 px-2 sm:px-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer truncate ${
                activeTab === 'HOURS'
                  ? 'bg-white text-sky-700 shadow-xs border border-sky-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="truncate">Jam Standar Kampus</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SCHEDULES')}
              className={`py-2 px-2 sm:px-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer truncate ${
                activeTab === 'SCHEDULES'
                  ? 'bg-white text-sky-700 shadow-xs border border-sky-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="truncate">Pola & Shift Kerja</span>
            </button>
          </div>
        </div>

        {/* ================= TAB 1: DAFTAR MULTI-GEDUNG ================= */}
        {activeTab === 'LOCATIONS' && (
          <div className="p-3 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sky-50/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-sky-100/80">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Daftar Master Titik Gedung STIMI</span>
                  <span className="text-slate-300 font-normal">|</span>
                  <span className="text-sky-700 font-semibold font-sans text-xs">
                    {locations.length} lokasi terdaftar
                  </span>
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                  Setiap gedung memiliki koordinat GPS dan batas radius toleransi presensi masing-masing.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setModalLat('');
                  setModalLng('');
                  setIsAddLocationModalOpen(true);
                  setAlert(null);
                }}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-sky-600/20 cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Gedung Baru</span>
              </button>
            </div>

            {/* Grid Kartu Gedung */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className={`bg-white rounded-2xl sm:rounded-3xl border p-3.5 sm:p-5 shadow-xs transition space-y-3 relative ${
                    loc.isActive
                      ? 'border-slate-200/90 hover:border-sky-300'
                      : 'border-slate-200 bg-slate-50/50 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
                          loc.isActive
                            ? 'bg-sky-50 text-sky-700 border border-sky-100'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                          {loc.name}
                        </h4>
                        {loc.code && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9.5px] font-mono font-bold">
                            {loc.code}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                        loc.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {loc.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-600 flex items-start gap-1.5 line-clamp-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{loc.address}</span>
                  </p>

                  <div className="p-2.5 sm:p-3 bg-slate-50/80 rounded-xl sm:rounded-2xl border border-slate-100 text-xs text-slate-700 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">
                        Koordinat GPS
                      </span>
                      <span className="font-mono text-[10.5px] font-semibold text-slate-800 truncate block">
                        {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">
                        Batas Geofence
                      </span>
                      <span className="font-bold text-sky-700 text-[11px] block">
                        {loc.radiusMeters} meter
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-[10.5px] text-slate-500">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{loc._count?.assignedUsers || 0} Pegawai Terdaftar</span>
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
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(loc.id)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          loc.isActive
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={loc.isActive ? 'Nonaktifkan Gedung' : 'Aktifkan Gedung'}
                      >
                        {loc.isActive ? (
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteLocation(loc.id, loc.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus Gedung"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 2: JAM STANDAR KAMPUS & KEBIJAKAN ================= */}
        {activeTab === 'HOURS' && (
          <div className="p-3 sm:p-6 max-w-4xl space-y-6">
            <form onSubmit={handleUpdateHours} className="space-y-6">
              {/* Seksi 0: Header Keterangan Tab */}
              <div className="bg-sky-50/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-sky-100/80">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-sky-600" />
                  <span>Konfigurasi Waktu Operasional Presensi & Kebijakan Kampus</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                  Pengaturan ini berlaku sebagai standar baku institusi STIMI YAPMI Makassar bagi seluruh pegawai reguler dan acuan sistem geofencing.
                </p>
              </div>

              {/* Seksi 1: Visual Timeline & Simulasi Alur Presensi Harian (Soft Sky & Clean Theme) */}
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-sky-50/70 via-white to-sky-50/30 border border-sky-100 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-100/80 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-sky-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      <span>Simulasi Alur Presensi Harian (WITA)</span>
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
                      <span>Jam Kerja: {workStartVal} - {workEndVal} WITA</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-emerald-700 font-semibold text-xs">
                        Toleransi s/d {graceLimitDisplay}
                      </span>
                    </h4>
                  </div>
                  <span className="text-[10px] bg-white text-sky-700 px-3 py-1 rounded-xl border border-sky-200/90 shadow-2xs self-start sm:self-auto font-mono font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Preview Logika</span>
                  </span>
                </div>

                {/* Grid 4 Kartu Tahapan - Bersih, Terang, Elegan & Setema */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Tahap 1: Pagi Dibuka */}
                  <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-sky-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-sky-700">Pagi Dibuka</span>
                      <span className="font-mono text-xs sm:text-sm font-black text-sky-900 bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-100">
                        {earliestVal}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-900 pt-0.5">Presensi Masuk Aktif</p>
                    <p className="text-[9.5px] text-slate-500 leading-snug">
                      Pegawai dapat mulai absen masuk di lokasi kampus
                    </p>
                  </div>

                  {/* Tahap 2: Tepat Waktu */}
                  <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-emerald-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-700">Jam Masuk</span>
                      <span className="font-mono text-xs sm:text-sm font-black text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                        {workStartVal}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-900 pt-0.5">Batas Tepat Waktu</p>
                    <p className="text-[9.5px] text-slate-500 leading-snug">
                      Absen sebelum jam ini tercatat &quot;Tepat Waktu&quot;
                    </p>
                  </div>

                  {/* Tahap 3: Masa Toleransi */}
                  <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-amber-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-amber-700">Toleransi</span>
                      <span className="font-mono text-xs sm:text-sm font-black text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                        s/d {graceLimitDisplay}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-900 pt-0.5">±{graceVal} Mnt Bebas Lambat</p>
                    <p className="text-[9.5px] text-slate-500 leading-snug">
                      Lewat {graceLimitDisplay} WITA tercatat &quot;Lambat&quot;
                    </p>
                  </div>

                  {/* Tahap 4: Pulang Dibuka */}
                  <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-indigo-200/90 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-700">Presensi Pulang</span>
                      <span className="font-mono text-xs sm:text-sm font-black text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                        {workEndVal}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-900 pt-0.5">Tombol Pulang Aktif</p>
                    <p className="text-[9.5px] text-slate-500 leading-snug">
                      Mulai {workEndVal} WITA dapat absen pulang
                    </p>
                  </div>
                </div>
              </div>

              {/* Seksi 2: Pengaturan Jam Kerja Utama */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Ketentuan Jam Masuk & Pulang Baku (WITA)</span>
                  </h4>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-semibold">
                    Zona Waktu WITA (Makassar)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Jendela Buka Pagi (Awal Absen) *
                    </label>
                    <input
                      type="time"
                      name="earliestClockIn"
                      value={earliestVal}
                      onChange={(e) => setEarliestVal(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    />
                    <p className="text-[9.5px] text-slate-500 mt-1">
                      Presensi masuk dibuka mulai jam ini
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Jam Masuk Standar *
                    </label>
                    <input
                      type="time"
                      name="workStart"
                      value={workStartVal}
                      onChange={(e) => setWorkStartVal(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    />
                    <p className="text-[9.5px] text-slate-500 mt-1">
                      Batas waktu masuk normal
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Jam Pulang Standar *
                    </label>
                    <input
                      type="time"
                      name="workEnd"
                      value={workEndVal}
                      onChange={(e) => setWorkEndVal(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    />
                    <p className="text-[9.5px] text-slate-500 mt-1">
                      Presensi pulang resmi dibuka
                    </p>
                  </div>
                </div>

                {/* Kolom Toleransi & Radius dengan Quick Select Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  {/* Toleransi */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Toleransi Keterlambatan (Menit) *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="gracePeriodMinutes"
                        value={graceVal}
                        onChange={(e) => setGraceVal(parseInt(e.target.value, 10) || 0)}
                        min={0}
                        max={60}
                        required
                        className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                      />
                      <span className="text-xs text-slate-600 font-medium">Menit</span>

                      {/* Quick Select Buttons */}
                      <div className="flex items-center gap-1 ml-auto">
                        {[0, 10, 15, 30].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setGraceVal(mins)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              graceVal === mins
                                ? 'bg-sky-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[9.5px] text-slate-500">
                      Hingga pukul <strong className="text-slate-800 font-mono">{graceLimitDisplay}</strong> pegawai tetap dihitung Tepat Waktu.
                    </p>
                  </div>

                  {/* Radius Geofence Standar */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Radius Geofence Standar (Meter) *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        name="radiusMeters"
                        value={radiusVal}
                        onChange={(e) => setRadiusVal(parseFloat(e.target.value) || 100)}
                        min={10}
                        max={1000}
                        required
                        className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                      />
                      <span className="text-xs text-slate-600 font-medium">Meter</span>

                      {/* Quick Select Buttons */}
                      <div className="flex items-center gap-1 ml-auto">
                        {[35, 50, 100, 150].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRadiusVal(r)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              radiusVal === r
                                ? 'bg-sky-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {r}m
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[9.5px] text-slate-500">
                      Radius GPS default jika lokasi gedung belum memiliki setelan khusus.
                    </p>
                  </div>
                </div>
              </div>

              {/* Seksi 3: Jadwal Hari Kerja & Kebijakan WFO/WFA Mingguan */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-purple-600" />
                    <span>Jadwal Hari Kerja Aktif & Kebijakan WFO / WFA</span>
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPresetDays('MON_FRI')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                        activeDays.length === 5 && !activeDays.includes('6')
                          ? 'bg-purple-100 text-purple-700 font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      5 Hari (Sen-Jum)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetDays('MON_SAT')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                        activeDays.includes('6')
                          ? 'bg-purple-100 text-purple-700 font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      6 Hari (+Sabtu)
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                      Pilih Hari Kerja Aktif Institusi (Klik untuk mengaktifkan/menonaktifkan):
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { label: 'Senin', val: '1' },
                        { label: 'Selasa', val: '2' },
                        { label: 'Rabu', val: '3' },
                        { label: 'Kamis', val: '4' },
                        { label: 'Jumat', val: '5' },
                        { label: 'Sabtu', val: '6' },
                      ].map((day) => {
                        const isSelected = activeDays.includes(day.val);
                        return (
                          <button
                            key={day.val}
                            type="button"
                            onClick={() => toggleActiveDay(day.val)}
                            className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-0.5 cursor-pointer ${
                              isSelected
                                ? 'bg-sky-50 text-sky-800 border-sky-300 font-bold shadow-2xs'
                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 font-medium'
                            }`}
                          >
                            <span className="text-xs">{day.label}</span>
                            <span className={`text-[9px] ${isSelected ? 'text-sky-600 font-semibold' : 'text-slate-400'}`}>
                              {isSelected ? '✓ Masuk' : 'Libur'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <input type="hidden" name="workDays" value={activeDays.join(',')} />
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      * Terpilih: <strong className="text-slate-800">{activeDays.length} Hari Kerja Aktif</strong> per minggu. Di hari libur, sistem monitoring tidak menganggap pegawai mangkir.
                    </p>
                  </div>

                  {/* Toggle Kebijakan Jumat WFA Fleksibel */}
                  <div className="p-3.5 bg-gradient-to-r from-purple-50/80 to-white border border-purple-100 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Kebijakan Hari Jumat: WFA Fleksibel</span>
                        {wfaFridayState ? (
                          <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-2 py-0.2 rounded-full">
                            Aktif
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.2 rounded-full">
                            Nonaktif
                          </span>
                        )}
                      </span>
                      <p className="text-[10px] text-slate-500 max-w-lg leading-relaxed">
                        Jika diaktifkan, pada hari Jumat pegawai diperbolehkan presensi masuk dan pulang dari luar kampus (Work From Anywhere) tanpa terkena batasan radius geofence.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        name="wfaFriday"
                        checked={wfaFridayState}
                        onChange={(e) => setWfaFridayState(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Seksi 4: Profil & Alamat Kampus */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <span>Identitas Perguruan Tinggi</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Institusi Kampus *
                    </label>
                    <input
                      type="text"
                      name="campusName"
                      defaultValue={setting.campusName}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Alamat Utama Kampus *
                    </label>
                    <input
                      type="text"
                      name="address"
                      defaultValue={setting.address}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Action Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-600/20 cursor-pointer disabled:opacity-60 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan Pengaturan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Pengaturan Kampus</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 3: MASTER POLA & SHIFT KERJA ================= */}
        {activeTab === 'SCHEDULES' && (
          <div className="p-3 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sky-50/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-sky-100/80">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Master Pola Jam Kerja Civitas (Template Dosen & Staf)</span>
                  <span className="text-slate-300 font-normal">|</span>
                  <span className="text-sky-700 font-semibold font-sans text-xs">
                    {workSchedules.length} pola terdaftar
                  </span>
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                  Template pola jam kerja ini otomatis muncul sebagai pilihan dropdown di menu Data Pegawai saat mengatur jadwal dosen atau staf.
                </p>
              </div>

              <button
                type="button"
                onClick={openAddScheduleModal}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-sky-600/20 cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pola Baru</span>
              </button>
            </div>

            {/* Grid Kartu Pola Jadwal */}
            {workSchedules.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Belum ada pola kerja kustom</p>
                <p className="text-[11px] text-slate-400">Klik tombol &apos;Tambah Pola Baru&apos; untuk membuat template jam kerja dosen/staf</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {workSchedules.map((ws) => (
                  <div
                    key={ws.id}
                    className="p-4 rounded-2xl border border-slate-200/90 hover:border-sky-300 bg-white shadow-2xs hover:shadow-sm transition space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {ws.name}
                          </h4>
                          {ws.code && (
                            <span className="text-[9px] font-mono text-slate-400">
                              Kode: {ws.code}
                            </span>
                          )}
                        </div>

                        {ws.scheduleType === 'STANDARD' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            Reguler
                          </span>
                        ) : ws.scheduleType === 'CUSTOM_DAYS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                            Hari Tertentu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                            Target Bulanan
                          </span>
                        )}
                      </div>

                      {ws.description && (
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          {ws.description}
                        </p>
                      )}

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-semibold">Jam Kerja:</span>
                          <span className="font-mono font-bold text-slate-800 text-[11px]">
                            {ws.workStart} - {ws.workEnd} WITA
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-semibold">Skema:</span>
                          <span className="font-semibold text-slate-700 text-[10.5px]">
                            {ws.scheduleType === 'CUSTOM_DAYS'
                              ? formatDaysDisplay(ws.workDays)
                              : ws.scheduleType === 'MONTHLY_QUOTA'
                              ? `${ws.monthlyTargetDays || 4} Hari / Bulan`
                              : 'Senin - Jumat'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{ws._count?.users || 0} Dosen/Pegawai</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditScheduleModal(ws)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition cursor-pointer"
                          title="Edit Pola Jadwal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(ws.id, ws.name)}
                          disabled={(ws._count?.users || 0) > 0}
                          className={`p-1.5 rounded-lg transition ${
                            (ws._count?.users || 0) > 0
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                          }`}
                          title={
                            (ws._count?.users || 0) > 0
                              ? 'Tidak dapat dihapus karena digunakan oleh pegawai'
                              : 'Hapus Pola Jadwal'
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODAL: TAMBAH GEDUNG ================= */}
      {isAddLocationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>Tambah Lokasi Gedung Kampus</span>
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
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Gedung / Kampus *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Contoh: Kampus Utama STIMI"
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
                    placeholder="KAMPUS_A"
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
                  placeholder="Jl. Perintis Kemerdekaan KM. 9, Makassar"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              {/* Tombol Ambil GPS */}
              <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-2xl flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-sky-900 block">Ambil Koordinat Posisi Anda?</span>
                  <span className="text-[10px] text-sky-700">Gunakan GPS perangkat Anda saat ini</span>
                </div>
                <button
                  type="button"
                  onClick={handleGetGpsCoords}
                  disabled={isGettingGps}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>{isGettingGps ? 'Mencari...' : 'Gunakan GPS'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
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
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-sky-600/20 cursor-pointer"
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-600" />
                <span className="truncate">Edit Gedung: {selectedLocation.name}</span>
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

              <div className="grid grid-cols-3 gap-2.5">
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

              <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-2xl flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-sky-900 block">Ambil GPS Saat Ini?</span>
                  <span className="text-[10px] text-sky-700">Perbarui koordinat dengan lokasi Anda</span>
                </div>
                <button
                  type="button"
                  onClick={handleGetGpsCoords}
                  disabled={isGettingGps}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>{isGettingGps ? 'Mencari...' : 'Gunakan GPS'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
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
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-sky-600/20 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH POLA JADWAL ================= */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-sky-600" />
                <span>Tambah Pola Jadwal / Shift Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Pola Jadwal *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Contoh: Dosen Kelas Siang"
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
                    placeholder="DSN_SIANG"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Jam Masuk & Pulang */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jam Masuk *
                  </label>
                  <input
                    type="time"
                    name="workStart"
                    defaultValue="09:00"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jam Pulang *
                  </label>
                  <input
                    type="time"
                    name="workEnd"
                    defaultValue="16:00"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Pilihan Skema Kehadiran */}
              <input type="hidden" name="scheduleType" value={scheduleTypeState} />
              <input type="hidden" name="workDays" value={scheduleDaysState.join(',')} />

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Skema Kewajiban Kehadiran
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setScheduleTypeState('STANDARD')}
                    className={`px-2 py-2 rounded-xl text-center border text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                      scheduleTypeState === 'STANDARD'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>📅 Reguler</span>
                    <span className={`text-[8.5px] font-normal ${scheduleTypeState === 'STANDARD' ? 'text-sky-100' : 'text-slate-400'}`}>
                      Senin - Jumat
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleTypeState('CUSTOM_DAYS')}
                    className={`px-2 py-2 rounded-xl text-center border text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                      scheduleTypeState === 'CUSTOM_DAYS'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>🗓️ Hari Tertentu</span>
                    <span className={`text-[8.5px] font-normal ${scheduleTypeState === 'CUSTOM_DAYS' ? 'text-sky-100' : 'text-slate-400'}`}>
                      Pilih Hari Hadir
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleTypeState('MONTHLY_QUOTA')}
                    className={`px-2 py-2 rounded-xl text-center border text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                      scheduleTypeState === 'MONTHLY_QUOTA'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>🎯 Target Bulanan</span>
                    <span className={`text-[8.5px] font-normal ${scheduleTypeState === 'MONTHLY_QUOTA' ? 'text-sky-100' : 'text-slate-400'}`}>
                      Kuota X Hari/Bln
                    </span>
                  </button>
                </div>
              </div>

              {/* Pilihan Hari Tertentu */}
              {scheduleTypeState === 'CUSTOM_DAYS' && (
                <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200/80 space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-700">
                    Pilih Hari Wajib Hadir / Mengajar di Kampus:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = scheduleDaysState.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleScheduleDay(day.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-sky-600 text-white shadow-2xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9.5px] text-slate-500">
                    * Di luar hari yang dipilih, dosen otomatis berstatus &quot;Bebas Tugas&quot; di monitoring.
                  </p>
                </div>
              )}

              {/* Target Bulanan */}
              {scheduleTypeState === 'MONTHLY_QUOTA' && (
                <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200/80 space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-700">
                    Target Kehadiran per Bulan (Hari):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="monthlyTargetDays"
                      min="1"
                      max="31"
                      defaultValue={4}
                      className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono"
                    />
                    <span className="text-xs text-slate-600 font-medium">Hari / Bulan</span>
                  </div>
                  <p className="text-[9.5px] text-slate-500">
                    * Cocok untuk dosen tanpa jabfung (seperti Pak Irfan) yang hadir fleksibel dengan target kumulatif bulanan.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Keterangan / Catatan Pola (Opsional)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Contoh: Digunakan untuk dosen yang hanya mengajar di kelas reguler siang"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-sky-600/20 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pola Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT POLA JADWAL ================= */}
      {isEditScheduleModalOpen && selectedSchedule && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-600" />
                <span className="truncate">Edit Pola Jadwal: {selectedSchedule.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditScheduleModalOpen(false);
                  setSelectedSchedule(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSchedule} className="space-y-3.5">
              <input type="hidden" name="scheduleId" value={selectedSchedule.id} />

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Pola Jadwal *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedSchedule.name}
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
                    defaultValue={selectedSchedule.code || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Jam Masuk & Pulang */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jam Masuk *
                  </label>
                  <input
                    type="time"
                    name="workStart"
                    defaultValue={selectedSchedule.workStart}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jam Pulang *
                  </label>
                  <input
                    type="time"
                    name="workEnd"
                    defaultValue={selectedSchedule.workEnd}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Pilihan Skema Kehadiran */}
              <input type="hidden" name="scheduleType" value={scheduleTypeState} />
              <input type="hidden" name="workDays" value={scheduleDaysState.join(',')} />

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Skema Kewajiban Kehadiran
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setScheduleTypeState('STANDARD')}
                    className={`px-2 py-2 rounded-xl text-center border text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                      scheduleTypeState === 'STANDARD'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>📅 Reguler</span>
                    <span className={`text-[8.5px] font-normal ${scheduleTypeState === 'STANDARD' ? 'text-sky-100' : 'text-slate-400'}`}>
                      Senin - Jumat
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleTypeState('CUSTOM_DAYS')}
                    className={`px-2 py-2 rounded-xl text-center border text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                      scheduleTypeState === 'CUSTOM_DAYS'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>🗓️ Hari Tertentu</span>
                    <span className={`text-[8.5px] font-normal ${scheduleTypeState === 'CUSTOM_DAYS' ? 'text-sky-100' : 'text-slate-400'}`}>
                      Pilih Hari Hadir
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleTypeState('MONTHLY_QUOTA')}
                    className={`px-2 py-2 rounded-xl text-center border text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                      scheduleTypeState === 'MONTHLY_QUOTA'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>🎯 Target Bulanan</span>
                    <span className={`text-[8.5px] font-normal ${scheduleTypeState === 'MONTHLY_QUOTA' ? 'text-sky-100' : 'text-slate-400'}`}>
                      Kuota X Hari/Bln
                    </span>
                  </button>
                </div>
              </div>

              {/* Pilihan Hari Tertentu */}
              {scheduleTypeState === 'CUSTOM_DAYS' && (
                <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200/80 space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-700">
                    Pilih Hari Wajib Hadir / Mengajar di Kampus:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = scheduleDaysState.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleScheduleDay(day.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-sky-600 text-white shadow-2xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9.5px] text-slate-500">
                    * Di luar hari yang dipilih, dosen otomatis berstatus &quot;Bebas Tugas&quot; di monitoring.
                  </p>
                </div>
              )}

              {/* Target Bulanan */}
              {scheduleTypeState === 'MONTHLY_QUOTA' && (
                <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200/80 space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-700">
                    Target Kehadiran per Bulan (Hari):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="monthlyTargetDays"
                      min="1"
                      max="31"
                      defaultValue={selectedSchedule.monthlyTargetDays || 4}
                      className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono"
                    />
                    <span className="text-xs text-slate-600 font-medium">Hari / Bulan</span>
                  </div>
                  <p className="text-[9.5px] text-slate-500">
                    * Cocok untuk dosen tanpa jabfung (seperti Pak Irfan) yang hadir fleksibel dengan target kumulatif bulanan.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Keterangan / Catatan Pola (Opsional)
                </label>
                <textarea
                  name="description"
                  defaultValue={selectedSchedule.description || ''}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditScheduleModalOpen(false);
                    setSelectedSchedule(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-sky-600/20 cursor-pointer"
                >
                  {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
