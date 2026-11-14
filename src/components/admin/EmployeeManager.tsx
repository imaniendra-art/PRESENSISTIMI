'use client';

import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resetEmployeePassword,
  bulkImportEmployees,
  toggleEmployeeStatus,
  BulkEmployeeRow,
} from '@/actions/adminActions';
import {
  UserPlus,
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Edit2,
  KeyRound,
  Trash2,
  Search,
  X,
  Users,
  Building2,
  MapPin,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Clock,
  CalendarDays,
  Target,
} from 'lucide-react';
import { User as PrismaUser, CampusLocation } from '@prisma/client';

export interface WorkScheduleOption {
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
}

export type UserType = PrismaUser & {
  workScheduleId?: string | null;
  workSchedule?: WorkScheduleOption | null;
  customWorkStart?: string | null;
  customWorkEnd?: string | null;
  workScheduleType?: string | null;
  workDays?: string | null;
  monthlyTargetDays?: number | null;
};

interface EmployeeManagerProps {
  users: (UserType & { atasan?: UserType | null; assignedLocation?: CampusLocation | null; workSchedule?: WorkScheduleOption | null })[];
  superiors: UserType[];
  campusLocations: CampusLocation[];
  workSchedules?: WorkScheduleOption[];
}

const DAYS_OF_WEEK = [
  { value: '1', label: 'Sen' },
  { value: '2', label: 'Sel' },
  { value: '3', label: 'Rab' },
  { value: '4', label: 'Kam' },
  { value: '5', label: 'Jum' },
  { value: '6', label: 'Sab' },
];

function formatDaysDisplay(daysStr?: string | null) {
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

function formatScheduleSummary(user: {
  workSchedule?: WorkScheduleOption | null;
  customWorkStart?: string | null;
  customWorkEnd?: string | null;
  workScheduleType?: string | null;
  workDays?: string | null;
  monthlyTargetDays?: number | null;
}) {
  const parts: string[] = [];

  if (user.workSchedule) {
    parts.push(`📋 ${user.workSchedule.name}`);
    parts.push(`⏰ ${user.workSchedule.workStart}-${user.workSchedule.workEnd}`);
    if (user.workSchedule.scheduleType === 'CUSTOM_DAYS' && user.workSchedule.workDays) {
      const dayMap: Record<string, string> = {
        '1': 'Sen',
        '2': 'Sel',
        '3': 'Rab',
        '4': 'Kam',
        '5': 'Jum',
        '6': 'Sab',
        '0': 'Min',
      };
      const days = user.workSchedule.workDays
        .split(',')
        .map((d) => dayMap[d.trim()] || d.trim())
        .filter(Boolean);
      if (days.length > 0) parts.push(`📅 ${days.join(', ')}`);
    } else if (user.workSchedule.scheduleType === 'MONTHLY_QUOTA') {
      parts.push(`🎯 ${user.workSchedule.monthlyTargetDays || 4}x/bln`);
    }
    return parts;
  }

  if (user.customWorkStart || user.customWorkEnd) {
    const start = user.customWorkStart || '09:00';
    const end = user.customWorkEnd || '16:00';
    parts.push(`⏰ ${start}-${end}`);
  }

  if (user.workScheduleType === 'CUSTOM_DAYS' && user.workDays) {
    const dayMap: Record<string, string> = {
      '1': 'Sen',
      '2': 'Sel',
      '3': 'Rab',
      '4': 'Kam',
      '5': 'Jum',
      '6': 'Sab',
      '0': 'Min',
    };
    const days = user.workDays
      .split(',')
      .map((d) => dayMap[d.trim()] || d.trim())
      .filter(Boolean);
    if (days.length > 0) {
      parts.push(`📅 ${days.join(', ')}`);
    }
  } else if (user.workScheduleType === 'MONTHLY_QUOTA') {
    parts.push(`🎯 ${user.monthlyTargetDays || 4}x/bln`);
  }

  return parts;
}

// Helper untuk menyederhanakan nama lokasi/gedung di tabel
function formatLocationDisplay(loc?: CampusLocation | null): string {
  if (!loc) return 'Fleksibel';
  const lower = loc.name.toLowerCase();
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
  return loc.name.replace(/^Target:\s*/i, '').trim();
}

export function EmployeeManager({ users, superiors, campusLocations, workSchedules = [] }: EmployeeManagerProps) {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected user for edit/reset/delete
  const [selectedUser, setSelectedUser] = useState<(UserType & { assignedLocation?: CampusLocation | null }) | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  // Work Schedule Choice states
  const [addScheduleChoice, setAddScheduleChoice] = useState<string>('DEFAULT');
  const [editScheduleChoice, setEditScheduleChoice] = useState<string>('DEFAULT');

  // Custom Work Schedule state (for manual overrides)
  const [scheduleType, setScheduleType] = useState<'STANDARD' | 'CUSTOM_DAYS' | 'MONTHLY_QUOTA'>('STANDARD');
  const [selectedDays, setSelectedDays] = useState<string[]>(['1', '2', '3', '4', '5']);

  const toggleDay = (dayVal: string) => {
    if (selectedDays.includes(dayVal)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayVal));
      }
    } else {
      setSelectedDays([...selectedDays, dayVal].sort());
    }
  };

  const openAddModal = () => {
    setAddScheduleChoice('DEFAULT');
    setScheduleType('STANDARD');
    setSelectedDays(['1', '2', '3', '4', '5']);
    setIsAddModalOpen(true);
    setAlert(null);
  };

  const openEditModal = (user: UserType & { assignedLocation?: CampusLocation | null }) => {
    const initialChoice = user.workScheduleId || (
      (user.customWorkStart || user.customWorkEnd || (user.workScheduleType && user.workScheduleType !== 'STANDARD'))
        ? 'CUSTOM'
        : 'DEFAULT'
    );
    setEditScheduleChoice(initialChoice);
    const schedType = (user.workScheduleType as any) || 'STANDARD';
    setScheduleType(schedType);
    if (user.workDays) {
      setSelectedDays(user.workDays.split(',').map((s) => s.trim()));
    } else {
      setSelectedDays(['1', '2', '3', '4', '5']);
    }
    setSelectedUser(user);
    setIsEditModalOpen(true);
    setAlert(null);
  };

  // Search & Filter & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterLocation, setFilterLocation] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  type SortField = 'nip' | 'name' | 'role' | 'jabatan' | 'unitKerja' | 'location' | 'status';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Async states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Bulk import state
  const [importRows, setImportRows] = useState<BulkEmployeeRow[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Statistik Civitas untuk 4 Kartu Metrik
  const totalEmployees = users.length;
  const countPegawai = useMemo(() => users.filter((u) => u.role === 'PEGAWAI').length, [users]);
  const countAtasan = useMemo(() => users.filter((u) => u.role === 'ATASAN').length, [users]);
  const countAdmin = useMemo(() => users.filter((u) => u.role === 'ADMIN').length, [users]);
  const countActive = useMemo(() => users.filter((u) => u.isActive).length, [users]);
  const activePercentage = totalEmployees > 0 ? Math.round((countActive / totalEmployees) * 100) : 0;

  // Filtered & Sorted users list
  const filteredUsers = useMemo(() => {
    const list = users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.nip.toLowerCase().includes(q) ||
        u.jabatan.toLowerCase().includes(q) ||
        u.unitKerja.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q));

      const matchRole = filterRole === 'ALL' || u.role === filterRole;

      const matchLoc =
        filterLocation === 'ALL' ||
        (filterLocation === 'UNASSIGNED' && !u.assignedLocationId) ||
        u.assignedLocationId === filterLocation;

      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && u.isActive) ||
        (filterStatus === 'INACTIVE' && !u.isActive);

      return matchQuery && matchRole && matchLoc && matchStatus;
    });

    return list.sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (sortField) {
        case 'nip':
          valA = a.nip.toLowerCase();
          valB = b.nip.toLowerCase();
          break;
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'role':
          valA = a.role;
          valB = b.role;
          break;
        case 'jabatan':
          valA = a.jabatan.toLowerCase();
          valB = b.jabatan.toLowerCase();
          break;
        case 'unitKerja':
          valA = a.unitKerja.toLowerCase();
          valB = b.unitKerja.toLowerCase();
          break;
        case 'location':
          valA = (a.assignedLocation?.name || 'Semua Gedung').toLowerCase();
          valB = (b.assignedLocation?.name || 'Semua Gedung').toLowerCase();
          break;
        case 'status':
          valA = a.isActive ? '1' : '0';
          valB = b.isActive ? '1' : '0';
          break;
        default:
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, searchQuery, filterRole, filterLocation, sortField, sortDirection]);

  // Handler: Ekspor Data Pegawai ke Excel (.xlsx)
  const handleExportEmployees = () => {
    const dataToExport = filteredUsers.map((u, index) => {
      const roleLabel =
        u.role === 'ADMIN'
          ? 'Administrator SDM'
          : u.role === 'ATASAN'
          ? 'Atasan Langsung / Kaprodi'
          : 'Dosen / Tenaga Kependidikan';

      const locationLabel = u.assignedLocation
        ? `${u.assignedLocation.name}${u.assignedLocation.code ? ` (${u.assignedLocation.code})` : ''}`
        : 'Semua Gedung (Fleksibel)';

      return {
        No: index + 1,
        'No. ID': u.nip,
        'Nama Lengkap': u.name,
        Peran: roleLabel,
        Jabatan: u.jabatan,
        'Unit Kerja': u.unitKerja,
        'Lokasi Penugasan': locationLabel,
        'Atasan Langsung': u.atasan?.name || '-',
        'Email / Akun': u.email || '-',
        Status: u.isActive ? 'Aktif' : 'Nonaktif',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 32 },
      { wch: 26 },
      { wch: 30 },
      { wch: 30 },
      { wch: 35 },
      { wch: 28 },
      { wch: 28 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Pegawai STIMI');

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Data_Pegawai_STIMI_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Handler: Tambah Pegawai Tunggal
  const handleCreateEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await createEmployee(formData);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsAddModalOpen(false);
        (e.target as HTMLFormElement).reset();
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Terjadi kesalahan sistem' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Edit Data Pegawai
  const handleUpdateEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateEmployee(formData);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsEditModalOpen(false);
        setSelectedUser(null);
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Gagal memperbarui data pegawai' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Reset Password Pegawai
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await resetEmployeePassword(formData);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsResetModalOpen(false);
        setSelectedUser(null);
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Gagal mereset kata sandi pegawai' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Toggle Aktif / Nonaktif
  const handleToggleStatus = async (userId: string) => {
    setAlert(null);
    try {
      const res = await toggleEmployeeStatus(userId);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Gagal mengubah status akun' });
    }
  };

  // Handler: Hapus Pegawai
  const handleDeleteEmployee = async () => {
    if (!userToDelete) return;
    setIsSubmitting(true);
    setAlert(null);

    try {
      const res = await deleteEmployee(userToDelete.id);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Gagal menghapus data pegawai' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Download Template Excel
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        NIP: 'DOSEN002',
        Nama: 'Dr. Siti Rahmah, S.E., M.Si.',
        Email: 'siti.rahmah@stimi.ac.id',
        Peran: 'PEGAWAI',
        Jabatan: 'Dosen Tetap Manajemen Pemasaran',
        UnitKerja: 'Program Studi S1 Manajemen',
        NIP_Atasan: 'ATASAN001',
        Lokasi_Gedung: 'KAMPUS_1',
        Password: 'password123',
      },
      {
        NIP: 'TENDIK001',
        Nama: 'Fajar Nugraha, S.Kom.',
        Email: 'fajar@stimi.ac.id',
        Peran: 'PEGAWAI',
        Jabatan: 'Staf Administrasi & TI',
        UnitKerja: 'Biro Administrasi Akademik',
        NIP_Atasan: 'ADMIN001',
        Lokasi_Gedung: 'Semua Gedung',
        Password: 'password123',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Pegawai');

    XLSX.writeFile(workbook, 'Template_Data_Pegawai_STIMI.xlsx');
  };

  // Handler: File Upload Excel/CSV Parser
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        const parsedRows: BulkEmployeeRow[] = rawJson.map((row) => {
          const findVal = (...keys: string[]) => {
            for (const k of keys) {
              const matchedKey = Object.keys(row).find(
                (rk) => rk.trim().toLowerCase() === k.toLowerCase()
              );
              if (matchedKey && row[matchedKey] !== undefined) {
                return String(row[matchedKey]).trim();
              }
            }
            return '';
          };

          return {
            nip: findVal('no id', 'no. id', 'noid', 'id', 'nip', 'nidn', 'nomor induk'),
            name: findVal('nama', 'name', 'nama lengkap'),
            email: findVal('email', 'surel', 'e-mail'),
            role: findVal('peran', 'role', 'posisi_peran') || 'PEGAWAI',
            jabatan: findVal('jabatan', 'position', 'fungsional') || 'Dosen / Tendik',
            unitKerja: findVal('unitkerja', 'unit_kerja', 'departemen', 'jurusan') || 'STIMI Makassar',
            atasanNip: findVal('no_id_atasan', 'id_atasan', 'nip_atasan', 'nipatasan', 'atasan_nip', 'atasan'),
            lokasiGedung: findVal('lokasi_gedung', 'lokasigedung', 'gedung', 'kampus', 'lokasi'),
            password: findVal('password', 'katasandi', 'sandi') || 'stimi123',
          };
        });

        setImportRows(parsedRows.filter((r) => r.nip && r.name));
      } catch (err) {
        console.error('Gagal membaca file Excel:', err);
        setImportErrors(['Format file tidak valid atau rusak. Pastikan file berformat .xlsx atau .csv']);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handler: Submit Bulk Import
  const handleExecuteImport = async () => {
    if (importRows.length === 0) return;
    setIsSubmitting(true);
    setImportErrors([]);

    try {
      const res = await bulkImportEmployees(importRows);
      if (res.success) {
        setAlert({
          type: 'success',
          message: res.message,
        });
        if (res.errors && res.errors.length > 0) {
          setImportErrors(res.errors);
        } else {
          setIsImportModalOpen(false);
          setImportRows([]);
          setImportFileName('');
        }
      } else {
        setAlert({ type: 'error', message: res.message });
      }
    } catch {
      setAlert({ type: 'error', message: 'Terjadi kesalahan saat memproses data import' });
    } finally {
      setIsSubmitting(false);
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

      {/* Soft Sky Hero Card - Simetris & Selaras dengan Overview & Monitoring */}
      <div className="bg-gradient-to-br from-sky-50/90 via-white to-sky-50/40 rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-sky-100/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
        {/* Baris Atas: Judul di Kiri & Tombol Tambah Pegawai di Kanan Atas pada Mobile */}
        <div className="flex items-center justify-between gap-2 w-full lg:w-auto">
          <div className="min-w-0">
            <h1 className="text-sm sm:text-2xl font-black text-slate-900 tracking-tight leading-tight whitespace-nowrap">
              Data Pegawai & Dosen
            </h1>
            <p className="text-xs sm:text-lg font-extrabold text-slate-700 tracking-tight mt-0.5 leading-tight whitespace-nowrap">
              STIMI YAPMI Makassar
            </p>
          </div>

          {/* Tombol Tambah Pegawai di Kanan Atas (Khusus Mobile - Ukuran & Padding Presisi Selaras LiveClock) */}
          <div className="lg:hidden shrink-0">
            <button
              type="button"
              onClick={openAddModal}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-[9.5px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3 h-3" />
              <span>Tambah Pegawai</span>
            </button>
          </div>
        </div>

        {/* Sisi Kanan Desktop: 3 Tombol Aksi Sejajar */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {/* Tombol Ekspor Excel */}
          <button
            type="button"
            onClick={handleExportEmployees}
            title="Unduh seluruh data pegawai ke format Excel (.xlsx)"
            className="px-3 py-2 bg-white/95 hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor Excel</span>
          </button>

          {/* Tombol Import Excel / CSV */}
          <button
            type="button"
            onClick={() => {
              setIsImportModalOpen(true);
              setImportRows([]);
              setImportFileName('');
              setImportErrors([]);
            }}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import Excel / CSV</span>
          </button>

          {/* Tombol Tambah Manual */}
          <button
            type="button"
            onClick={openAddModal}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-sky-600/20 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Pegawai</span>
          </button>
        </div>

        {/* Sisi Bawah Mobile: Tombol Ekspor & Import 1-Baris Penuh Simetris Selaras Monitoring */}
        <div className="grid grid-cols-2 gap-1.5 pt-1.5 sm:pt-2 border-t border-sky-100/80 lg:hidden w-full">
          {/* Tombol Ekspor Excel */}
          <button
            type="button"
            onClick={handleExportEmployees}
            title="Unduh seluruh data pegawai ke format Excel (.xlsx)"
            className="w-full py-1 px-2 bg-white/90 hover:bg-slate-50 text-slate-700 border border-sky-100 rounded-xl text-[9.5px] font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
          >
            <Download className="w-3 h-3 text-slate-600" />
            <span>Ekspor Data</span>
          </button>

          {/* Tombol Import Excel / CSV */}
          <button
            type="button"
            onClick={() => {
              setIsImportModalOpen(true);
              setImportRows([]);
              setImportFileName('');
              setImportErrors([]);
            }}
            className="w-full py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-[9.5px] font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
            <span>Import Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Kartu Metrik Utama - 1 Baris 4 Kolom Identik dengan Overview & Monitoring */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-4 w-full">
        {/* Card 1: Total Civitas */}
        <div className="bg-white p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-200 transition">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              <span className="sm:hidden">Total</span>
              <span className="hidden sm:inline">Total Pegawai</span>
            </span>
            <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-sm sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
            {totalEmployees}
          </p>
          <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">
            {countPegawai}{' '}
            <span className="hidden sm:inline">Dosen & Tendik</span>
            <span className="sm:hidden">Dosen</span>
          </p>
        </div>

        {/* Card 2: Dosen & Tendik */}
        <div className="bg-white p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              <span className="sm:hidden">Dosen</span>
              <span className="hidden sm:inline">Dosen & Tendik</span>
            </span>
            <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-sm sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
            {countPegawai}
          </p>
          <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">
            <span className="hidden sm:inline">Pendidik & Staf</span>
            <span className="sm:hidden">Pendidik</span>
          </p>
        </div>

        {/* Card 3: Atasan / Pejabat Penilai */}
        <div className="bg-white p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs hover:border-sky-200 transition">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              <span className="sm:hidden">Atasan</span>
              <span className="hidden sm:inline">Pejabat Penilai</span>
            </span>
            <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shrink-0">
              <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-sm sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
            {countAtasan}
          </p>
          <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">
            <span className="hidden sm:inline">Pimpinan & Kaprodi</span>
            <span className="sm:hidden">Penilai</span>
          </p>
        </div>

        {/* Card 4: Status Akun Aktif */}
        <div className="bg-white p-2 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs hover:border-purple-200 transition">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[9px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
              <span className="sm:hidden">Aktif</span>
              <span className="hidden sm:inline">Akun Aktif</span>
            </span>
            <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-sm sm:text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight flex items-baseline gap-1">
            <span>{countActive}</span>
            <span className="text-[9px] sm:text-xs font-semibold text-purple-600 font-sans tracking-tight">
              ({activePercentage}%)
            </span>
          </p>
          <p className="text-[9px] sm:text-[11px] text-slate-500 mt-0.5 sm:mt-1 truncate">
            {totalEmployees - countActive}{' '}
            <span className="hidden sm:inline">Akun Nonaktif</span>
            <span className="sm:hidden">Nonaktif</span>
          </p>
        </div>
      </div>

      {/* Tabel Data Pegawai Terpadu (Web & Mobile) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden w-full">
        {/* Toolbar Pencarian & Filter Cepat */}
        <div className="p-2.5 sm:p-5 border-b border-slate-100 bg-slate-50/50 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <h3 className="text-[10px] sm:text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="truncate">Daftar Pegawai & Dosen</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-sky-700 font-semibold normal-case font-sans text-[9.5px] sm:text-sm shrink-0">
                {filteredUsers.length} dari {totalEmployees} civitas
              </span>
            </h3>
          </div>

          {/* Controls Bar: Search Input, Role Dropdown, Location Dropdown, Status Dropdown */}
          <div className="grid grid-cols-2 sm:grid-cols-12 gap-1.5 sm:gap-2 pt-0.5">
            {/* Search Input: Lebar Penuh di Mobile (col-span-2 sm:col-span-4 lg:col-span-5) */}
            <div className="col-span-2 sm:col-span-4 lg:col-span-5 relative">
              <Search className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, No. ID, jabatan, unit..."
                className="w-full pl-7 sm:pl-9 pr-6 sm:pr-8 py-1 sm:py-2 bg-white border border-slate-200 rounded-xl text-[10px] sm:text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Peran */}
            <div className="col-span-1 sm:col-span-3 lg:col-span-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-2 sm:px-2.5 py-1 sm:py-2 bg-white border border-slate-200 rounded-xl text-[9px] sm:text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs cursor-pointer truncate"
              >
                <option value="ALL">Semua Peran ({totalEmployees})</option>
                <option value="PEGAWAI">Dosen/Tendik ({countPegawai})</option>
                <option value="ATASAN">Atasan ({countAtasan})</option>
                <option value="ADMIN">Admin SDM ({countAdmin})</option>
              </select>
            </div>

            {/* Filter Gedung Penugasan */}
            <div className="col-span-1 sm:col-span-3 lg:col-span-3">
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full px-2 sm:px-2.5 py-1 sm:py-2 bg-white border border-slate-200 rounded-xl text-[9px] sm:text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs cursor-pointer truncate"
              >
                <option value="ALL">Semua Gedung</option>
                <option value="UNASSIGNED">Fleksibel (Semua Gedung)</option>
                {campusLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-2 sm:px-2.5 py-1 sm:py-2 bg-white border border-slate-200 rounded-xl text-[9px] sm:text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition shadow-2xs cursor-pointer truncate"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif ({countActive})</option>
                <option value="INACTIVE">Nonaktif ({totalEmployees - countActive})</option>
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
                Coba ubah kata kunci pencarian atau setel ulang filter peran, gedung, dan status akun.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterRole('ALL');
                  setFilterLocation('ALL');
                  setFilterStatus('ALL');
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
                <col className="w-[24%]" />
                <col className="w-[13%]" />
                <col className="w-[21%]" />
                <col className="w-[13%]" />
                <col className="w-[12%]" />
                <col className="w-[6%]" />
                <col className="w-[7%]" />
              </colgroup>

              <thead>
                <tr className="bg-sky-50/70 text-slate-700 uppercase tracking-wider text-[10px] border-b border-sky-100">
                  <th className="py-2.5 px-2 font-extrabold text-center border-r border-sky-100/80">
                    No.
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-2.5 px-3 font-extrabold border-r border-sky-100/80 cursor-pointer hover:bg-sky-100/60 transition select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Pegawai</span>
                      {sortField === 'name' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-sky-700" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-sky-700" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('role')}
                    className="py-2.5 px-3 font-extrabold border-r border-sky-100/80 cursor-pointer hover:bg-sky-100/60 transition select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Peran</span>
                      {sortField === 'role' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-sky-700" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-sky-700" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('jabatan')}
                    className="py-2.5 px-3 font-extrabold border-r border-sky-100/80 cursor-pointer hover:bg-sky-100/60 transition select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Jabatan & Unit</span>
                      {sortField === 'jabatan' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-sky-700" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-sky-700" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('location')}
                    className="py-2.5 px-3 font-extrabold border-r border-sky-100/80 cursor-pointer hover:bg-sky-100/60 transition select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Lokasi Presensi</span>
                      {sortField === 'location' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-sky-700" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-sky-700" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition" />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-3 font-extrabold border-r border-sky-100/80">
                    Atasan Langsung
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-2.5 px-2 font-extrabold text-center border-r border-sky-100/80 cursor-pointer hover:bg-sky-100/60 transition select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-sky-700" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-sky-700" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition" />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-2 font-extrabold text-center">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((user, idx) => (
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
                          <p className="font-bold text-slate-900 truncate" title={user.name}>
                            {user.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            No. ID: {user.nip}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 3. Peran (Role) */}
                    <td className="py-2.5 px-3 border-r border-slate-100 whitespace-nowrap">
                      {user.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          <ShieldCheck className="w-3 h-3" /> Admin SDM
                        </span>
                      ) : user.role === 'ATASAN' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                          <Briefcase className="w-3 h-3" /> Atasan / Penilai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <GraduationCap className="w-3 h-3" /> Dosen / Tendik
                        </span>
                      )}
                    </td>

                    {/* 4. Jabatan & Unit Kerja */}
                    <td className="py-2.5 px-3 border-r border-slate-100">
                      <p className="font-semibold text-slate-800 truncate" title={user.jabatan}>
                        {user.jabatan}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate" title={user.unitKerja}>
                        {user.unitKerja}
                      </p>
                      {(() => {
                        const summary = formatScheduleSummary(user);
                        if (summary.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {summary.map((text, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-sky-50 text-sky-700 border border-sky-100"
                              >
                                {text}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </td>

                    {/* 5. Lokasi Penugasan */}
                    <td className="py-2.5 px-3 border-r border-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className={`w-3 h-3 shrink-0 ${user.assignedLocation ? 'text-sky-600' : 'text-slate-400'}`} />
                        <span className="font-semibold text-slate-800 truncate" title={user.assignedLocation?.name || 'Semua Gedung (Fleksibel)'}>
                          {formatLocationDisplay(user.assignedLocation)}
                        </span>
                      </div>
                    </td>

                    {/* 6. Atasan Langsung */}
                    <td className="py-2.5 px-3 border-r border-slate-100 whitespace-nowrap">
                      {user.atasan ? (
                        <p className="font-semibold text-slate-800 text-[11px] truncate" title={user.atasan.name}>
                          {user.atasan.name}
                        </p>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* 7. Status */}
                    <td className="py-2.5 px-2 text-center border-r border-slate-100 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user.id)}
                        title={user.isActive ? 'Klik untuk nonaktifkan akun' : 'Klik untuk aktifkan akun'}
                        className="inline-flex items-center gap-1 cursor-pointer transition select-none hover:opacity-80"
                      >
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ToggleRight className="w-3 h-3 text-emerald-600" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <ToggleLeft className="w-3 h-3 text-slate-400" />
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </button>
                    </td>

                    {/* 8. Aksi */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(user)}
                          className="p-1 rounded-lg text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition cursor-pointer"
                          title="Edit Data Pegawai"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsResetModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                          title="Reset Kata Sandi"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        {user.role !== 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserToDelete(user);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus Pegawai"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Tampilan Mobile: Kartu Ringkas Responsif (md:hidden) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredUsers.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-slate-400">
              Tidak ada data pegawai yang sesuai filter
            </div>
          ) : (
            filteredUsers.map((user, idx) => (
              <div key={`mob-${user.id}`} className="p-3.5 space-y-2.5">
                {/* Header Mobile: No + Nama + NIP + Badge Peran */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm truncate leading-snug">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        No. ID: {user.nip} • {user.unitKerja}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {user.role === 'ADMIN' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        Admin
                      </span>
                    ) : user.role === 'ATASAN' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                        Atasan
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Dosen/Staf
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Baris: Jabatan, Lokasi & Atasan */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-0.5">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">
                      Jabatan
                    </span>
                    <p className="text-[10px] font-semibold text-slate-800 truncate" title={user.jabatan}>
                      {user.jabatan}
                    </p>
                    <p className="text-[9px] text-slate-500 truncate">
                      Atasan: {user.atasan?.name || '-'}
                    </p>
                    {(() => {
                      const summary = formatScheduleSummary(user);
                      if (summary.length === 0) return null;
                      return (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {summary.map((text, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-bold bg-sky-50 text-sky-700 border border-sky-100"
                            >
                              {text}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-0.5">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">
                      Lokasi Presensi
                    </span>
                    <p className="text-[10px] font-semibold text-slate-800 truncate flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-sky-600 shrink-0" />
                      <span>{formatLocationDisplay(user.assignedLocation)}</span>
                    </p>
                    <div className="pt-0.5 flex items-center justify-between">
                      <span className="text-[9px] text-slate-400">Status Akun:</span>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user.id)}
                        className="text-[9px] font-bold cursor-pointer"
                      >
                        {user.isActive ? (
                          <span className="text-emerald-700">● Aktif</span>
                        ) : (
                          <span className="text-slate-400">○ Nonaktif</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Bar Mobile */}
                <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100/80">
                  <button
                    type="button"
                    onClick={() => openEditModal(user)}
                    className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsResetModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Sandi</span>
                  </button>
                  {user.role !== 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserToDelete(user);
                        setIsDeleteModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= MODAL: TAMBAH PEGAWAI MANUAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                Tambah Pegawai / Dosen Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    No. ID / NIDN *
                  </label>
                  <input
                    type="text"
                    name="nip"
                    required
                    placeholder="Contoh: DOSEN002"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Peran (Role) *
                  </label>
                  <select
                    name="role"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="PEGAWAI">Pegawai / Dosen</option>
                    <option value="ATASAN">Atasan / Pejabat Penilai</option>
                    <option value="ADMIN">Administrator HRD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap beserta Gelar *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Contoh: Andi Pratama, S.E., M.M."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Opsional, misal: nama@stimi.ac.id"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kata Sandi Awal *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jabatan Fungsional / Posisi *
                  </label>
                  <input
                    type="text"
                    name="jabatan"
                    required
                    placeholder="Dosen / Staf Akademik"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Unit Kerja / Bagian *
                  </label>
                  <input
                    type="text"
                    name="unitKerja"
                    required
                    placeholder="Prodi S1 Manajemen"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Lokasi Penugasan Gedung */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Aturan Lokasi Gedung Presensi *
                </label>
                <select
                  name="assignedLocationId"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="ALL">🌐 Semua Gedung Kampus (Fleksibel di Gedung Manapun)</option>
                  {campusLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      🏛️ {loc.name} {loc.code ? `(${loc.code})` : ''} - Radius {loc.radiusMeters}m
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Pilih gedung tertentu jika pegawai wajib hadir di lokasi tersebut, atau pilih &apos;Semua Gedung&apos; jika bebas.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Atasan Langsung (Pejabat Penilai Cuti & Tugas)
                </label>
                <select
                  name="atasanId"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="none">-- Tanpa Atasan (Langsung ke Pimpinan/Admin) --</option>
                  {superiors.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.jabatan} - No. ID: {sup.nip})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pengaturan Pola Jadwal Kerja (Preset Master Pengaturan) */}
              <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-sky-950 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    Pola Jam Kerja & Hari Wajib Presensi
                  </label>
                  <span className="text-[9px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                    Preset Pengaturan
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    Pilih Pola / Shift Kerja *
                  </label>
                  <select
                    name="workScheduleId"
                    value={addScheduleChoice}
                    onChange={(e) => setAddScheduleChoice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  >
                    <option value="DEFAULT">🏢 Standar Kampus (09:00 - 16:00, Senin - Jumat)</option>
                    {workSchedules.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        📋 {ws.name} ({ws.workStart} - {ws.workEnd} WITA
                        {ws.scheduleType === 'CUSTOM_DAYS' ? ' • Hari Tertentu' : ws.scheduleType === 'MONTHLY_QUOTA' ? ` • ${ws.monthlyTargetDays || 4}x/bln` : ''})
                      </option>
                    ))}
                    <option value="CUSTOM">⚙️ Kustomisasi Manual (Atur jam & hari khusus pegawai ini)</option>
                  </select>
                </div>

                {/* Preview jika memilih Template Master */}
                {addScheduleChoice !== 'CUSTOM' && (
                  <div className="p-3 bg-white rounded-xl border border-sky-200/80 shadow-2xs space-y-1">
                    {(() => {
                      if (addScheduleChoice === 'DEFAULT') {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900">Standar Kampus STIMI YAPMI</span>
                              <span className="text-[9.5px] bg-sky-100 text-sky-700 font-mono font-bold px-2 py-0.5 rounded-md">
                                09:00 - 16:00 WITA
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-600">
                              📅 Hari Kerja: <strong className="text-slate-800">Senin s/d Jumat</strong> (Libur: Sabtu & Minggu)
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                              * Pola standar baku seluruh pegawai & dosen reguler.
                            </p>
                          </>
                        );
                      }
                      const ws = workSchedules.find((s) => s.id === addScheduleChoice);
                      if (!ws) return null;
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-sky-950">{ws.name}</span>
                            <span className="text-[9.5px] bg-sky-100 text-sky-700 font-mono font-bold px-2 py-0.5 rounded-md">
                              {ws.workStart} - {ws.workEnd} WITA
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600">
                            {ws.scheduleType === 'STANDARD' && '📅 Skema: Senin - Jumat (Reguler)'}
                            {ws.scheduleType === 'CUSTOM_DAYS' && (
                              <span>
                                🗓️ Hari Wajib: <strong className="text-slate-800">{formatDaysDisplay(ws.workDays)}</strong>
                              </span>
                            )}
                            {ws.scheduleType === 'MONTHLY_QUOTA' && (
                              <span>
                                🎯 Target Bulanan: <strong className="text-slate-800">{ws.monthlyTargetDays || 4} Hari / Bulan</strong> (Fleksibel)
                              </span>
                            )}
                          </p>
                          {ws.description && (
                            <p className="text-[9px] text-slate-500 italic pt-0.5 border-t border-slate-100">
                              {ws.description}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Form Input Manual Khusus jika admin memilih CUSTOM */}
                {addScheduleChoice === 'CUSTOM' && (
                  <div className="space-y-3 pt-2 border-t border-sky-200/60">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          Jam Masuk Khusus
                        </label>
                        <input
                          type="time"
                          name="customWorkStart"
                          placeholder="09:00"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                        />
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          Kosongkan = ikuti jam kampus (09:00)
                        </p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          Jam Pulang Khusus
                        </label>
                        <input
                          type="time"
                          name="customWorkEnd"
                          placeholder="16:00"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                        />
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          Kosongkan = ikuti jam kampus (16:00)
                        </p>
                      </div>
                    </div>

                    <input type="hidden" name="workScheduleType" value={scheduleType} />
                    <input type="hidden" name="workDays" value={selectedDays.join(',')} />

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1.5">
                        Skema Kehadiran Dosen / Pegawai
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setScheduleType('STANDARD')}
                          className={`px-2 py-1.5 rounded-xl text-center border text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                            scheduleType === 'STANDARD'
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>📅 Reguler</span>
                          <span className={`text-[8px] font-normal ${scheduleType === 'STANDARD' ? 'text-sky-100' : 'text-slate-400'}`}>
                            Senin - Jumat
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setScheduleType('CUSTOM_DAYS')}
                          className={`px-2 py-1.5 rounded-xl text-center border text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                            scheduleType === 'CUSTOM_DAYS'
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>🗓️ Hari Tertentu</span>
                          <span className={`text-[8px] font-normal ${scheduleType === 'CUSTOM_DAYS' ? 'text-sky-100' : 'text-slate-400'}`}>
                            Pilih Hari Hadir
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setScheduleType('MONTHLY_QUOTA')}
                          className={`px-2 py-1.5 rounded-xl text-center border text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                            scheduleType === 'MONTHLY_QUOTA'
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>🎯 Target Bulanan</span>
                          <span className={`text-[8px] font-normal ${scheduleType === 'MONTHLY_QUOTA' ? 'text-sky-100' : 'text-slate-400'}`}>
                            Kuota X Hari/Bln
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Sub-form Hari Tertentu */}
                    {scheduleType === 'CUSTOM_DAYS' && (
                      <div className="p-2.5 bg-white rounded-xl border border-sky-200/80 space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-700">
                          Pilih Hari Wajib Hadir / Mengajar di Kampus:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {DAYS_OF_WEEK.map((day) => {
                            const isSelected = selectedDays.includes(day.value);
                            return (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleDay(day.value)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-sky-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[9px] text-slate-500">
                          * Pada hari di luar pilihan ini, pegawai tidak dianggap mangkir dan berstatus &quot;Bebas Tugas&quot; di monitoring.
                        </p>
                      </div>
                    )}

                    {/* Sub-form Target Bulanan */}
                    {scheduleType === 'MONTHLY_QUOTA' && (
                      <div className="p-2.5 bg-white rounded-xl border border-sky-200/80 space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-700">
                          Target Kehadiran Wajib per Bulan (Hari):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            name="monthlyTargetDays"
                            min="1"
                            max="31"
                            defaultValue={4}
                            className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                          />
                          <span className="text-xs text-slate-600 font-medium">Hari / Bulan</span>
                        </div>
                        <p className="text-[9px] text-slate-500">
                          * Cocok untuk dosen tanpa jabfung (seperti Pak Irfan) yang hadir secara fleksibel dengan target kumulatif bulanan.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-200"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT DATA PEGAWAI ================= */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                Edit Data Pegawai: {selectedUser.name}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="space-y-3.5">
              <input type="hidden" name="userId" value={selectedUser.id} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    No. ID / NIDN *
                  </label>
                  <input
                    type="text"
                    name="nip"
                    defaultValue={selectedUser.nip}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Peran (Role) *
                  </label>
                  <select
                    name="role"
                    defaultValue={selectedUser.role}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="PEGAWAI">Pegawai / Dosen</option>
                    <option value="ATASAN">Atasan / Pejabat Penilai</option>
                    <option value="ADMIN">Administrator HRD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap beserta Gelar *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedUser.name}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={selectedUser.email || ''}
                  placeholder="Opsional, misal: nama@stimi.ac.id"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jabatan Fungsional / Posisi *
                  </label>
                  <input
                    type="text"
                    name="jabatan"
                    defaultValue={selectedUser.jabatan}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Unit Kerja / Bagian *
                  </label>
                  <input
                    type="text"
                    name="unitKerja"
                    defaultValue={selectedUser.unitKerja}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Lokasi Penugasan Gedung */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Aturan Lokasi Gedung Presensi *
                </label>
                <select
                  name="assignedLocationId"
                  defaultValue={selectedUser.assignedLocationId || 'ALL'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="ALL">🌐 Semua Gedung Kampus (Fleksibel di Gedung Manapun)</option>
                  {campusLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      🏛️ {loc.name} {loc.code ? `(${loc.code})` : ''} - Radius {loc.radiusMeters}m
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Atasan Langsung (Pejabat Penilai)
                </label>
                <select
                  name="atasanId"
                  defaultValue={selectedUser.atasanId || 'none'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="none">-- Tanpa Atasan (Langsung ke Pimpinan/Admin) --</option>
                  {superiors
                    .filter((sup) => sup.id !== selectedUser.id)
                    .map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.jabatan} - No. ID: {sup.nip})
                      </option>
                    ))}
                </select>
              </div>

              {/* Pengaturan Pola Jadwal Kerja (Preset Master Pengaturan) */}
              <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-sky-950 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    Pola Jam Kerja & Hari Wajib Presensi
                  </label>
                  <span className="text-[9px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                    Preset Pengaturan
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">
                    Pilih Pola / Shift Kerja *
                  </label>
                  <select
                    name="workScheduleId"
                    value={editScheduleChoice}
                    onChange={(e) => setEditScheduleChoice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="DEFAULT">🏢 Standar Kampus (09:00 - 16:00, Senin - Jumat)</option>
                    {workSchedules.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        📋 {ws.name} ({ws.workStart} - {ws.workEnd} WITA
                        {ws.scheduleType === 'CUSTOM_DAYS' ? ' • Hari Tertentu' : ws.scheduleType === 'MONTHLY_QUOTA' ? ` • ${ws.monthlyTargetDays || 4}x/bln` : ''})
                      </option>
                    ))}
                    <option value="CUSTOM">⚙️ Kustomisasi Manual (Atur jam & hari khusus pegawai ini)</option>
                  </select>
                </div>

                {/* Preview jika memilih Template Master */}
                {editScheduleChoice !== 'CUSTOM' && (
                  <div className="p-3 bg-white rounded-xl border border-sky-200/80 shadow-2xs space-y-1">
                    {(() => {
                      if (editScheduleChoice === 'DEFAULT') {
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900">Standar Kampus STIMI YAPMI</span>
                              <span className="text-[9.5px] bg-sky-100 text-sky-700 font-mono font-bold px-2 py-0.5 rounded-md">
                                09:00 - 16:00 WITA
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-600">
                              📅 Hari Kerja: <strong className="text-slate-800">Senin s/d Jumat</strong> (Libur: Sabtu & Minggu)
                            </p>
                            <p className="text-[9px] text-slate-400 italic">
                              * Pola standar baku seluruh pegawai & dosen reguler.
                            </p>
                          </>
                        );
                      }
                      const ws = workSchedules.find((s) => s.id === editScheduleChoice);
                      if (!ws) return null;
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-sky-950">{ws.name}</span>
                            <span className="text-[9.5px] bg-sky-100 text-sky-700 font-mono font-bold px-2 py-0.5 rounded-md">
                              {ws.workStart} - {ws.workEnd} WITA
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600">
                            {ws.scheduleType === 'STANDARD' && '📅 Skema: Senin - Jumat (Reguler)'}
                            {ws.scheduleType === 'CUSTOM_DAYS' && (
                              <span>
                                🗓️ Hari Wajib: <strong className="text-slate-800">{formatDaysDisplay(ws.workDays)}</strong>
                              </span>
                            )}
                            {ws.scheduleType === 'MONTHLY_QUOTA' && (
                              <span>
                                🎯 Target Bulanan: <strong className="text-slate-800">{ws.monthlyTargetDays || 4} Hari / Bulan</strong> (Fleksibel)
                              </span>
                            )}
                          </p>
                          {ws.description && (
                            <p className="text-[9px] text-slate-500 italic pt-0.5 border-t border-slate-100">
                              {ws.description}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Form Input Manual Khusus jika admin memilih CUSTOM */}
                {editScheduleChoice === 'CUSTOM' && (
                  <div className="space-y-3 pt-2 border-t border-sky-200/60">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          Jam Masuk Khusus
                        </label>
                        <input
                          type="time"
                          name="customWorkStart"
                          defaultValue={selectedUser.customWorkStart || ''}
                          placeholder="09:00"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                        />
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          Kosongkan = ikuti jam kampus (09:00)
                        </p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">
                          Jam Pulang Khusus
                        </label>
                        <input
                          type="time"
                          name="customWorkEnd"
                          defaultValue={selectedUser.customWorkEnd || ''}
                          placeholder="16:00"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                        />
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          Kosongkan = ikuti jam kampus (16:00)
                        </p>
                      </div>
                    </div>

                    <input type="hidden" name="workScheduleType" value={scheduleType} />
                    <input type="hidden" name="workDays" value={selectedDays.join(',')} />

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1.5">
                        Skema Kehadiran Dosen / Pegawai
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setScheduleType('STANDARD')}
                          className={`px-2 py-1.5 rounded-xl text-center border text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                            scheduleType === 'STANDARD'
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>📅 Reguler</span>
                          <span className={`text-[8px] font-normal ${scheduleType === 'STANDARD' ? 'text-sky-100' : 'text-slate-400'}`}>
                            Senin - Jumat
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setScheduleType('CUSTOM_DAYS')}
                          className={`px-2 py-1.5 rounded-xl text-center border text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                            scheduleType === 'CUSTOM_DAYS'
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>🗓️ Hari Tertentu</span>
                          <span className={`text-[8px] font-normal ${scheduleType === 'CUSTOM_DAYS' ? 'text-sky-100' : 'text-slate-400'}`}>
                            Pilih Hari Hadir
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setScheduleType('MONTHLY_QUOTA')}
                          className={`px-2 py-1.5 rounded-xl text-center border text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer ${
                            scheduleType === 'MONTHLY_QUOTA'
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>🎯 Target Bulanan</span>
                          <span className={`text-[8px] font-normal ${scheduleType === 'MONTHLY_QUOTA' ? 'text-sky-100' : 'text-slate-400'}`}>
                            Kuota X Hari/Bln
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Sub-form Hari Tertentu */}
                    {scheduleType === 'CUSTOM_DAYS' && (
                      <div className="p-2.5 bg-white rounded-xl border border-sky-200/80 space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-700">
                          Pilih Hari Wajib Hadir / Mengajar di Kampus:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {DAYS_OF_WEEK.map((day) => {
                            const isSelected = selectedDays.includes(day.value);
                            return (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleDay(day.value)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-sky-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[9px] text-slate-500">
                          * Pada hari di luar pilihan ini, pegawai tidak dianggap mangkir dan berstatus &quot;Bebas Tugas&quot; di monitoring.
                        </p>
                      </div>
                    )}

                    {/* Sub-form Target Bulanan */}
                    {scheduleType === 'MONTHLY_QUOTA' && (
                      <div className="p-2.5 bg-white rounded-xl border border-sky-200/80 space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-700">
                          Target Kehadiran Wajib per Bulan (Hari):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            name="monthlyTargetDays"
                            min="1"
                            max="31"
                            defaultValue={selectedUser.monthlyTargetDays || 4}
                            className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                          />
                          <span className="text-xs text-slate-600 font-medium">Hari / Bulan</span>
                        </div>
                        <p className="text-[9px] text-slate-500">
                          * Cocok untuk dosen tanpa jabfung (seperti Pak Irfan) yang hadir secara fleksibel dengan target kumulatif bulanan.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-200"
                >
                  {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RESET PASSWORD PEGAWAI ================= */}
      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                Reset Kata Sandi
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setSelectedUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Masukkan kata sandi baru untuk <span className="font-bold text-slate-800">{selectedUser.name}</span> (NIP: {selectedUser.nip}):
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <input type="hidden" name="userId" value={selectedUser.id} />

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kata Sandi Baru *
                </label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-amber-200"
                >
                  {isSubmitting ? 'Mereset...' : 'Reset Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI HAPUS PEGAWAI ================= */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Pegawai</h3>
                <p className="text-xs text-slate-500">Tindakan ini permanen dan tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-800 mb-5 space-y-1.5">
              <p className="font-semibold text-rose-900">Apakah Anda yakin ingin menghapus akun pegawai ini?</p>
              <div className="text-[11px] text-rose-800 bg-white/70 p-2.5 rounded-xl border border-rose-200 space-y-0.5 font-medium">
                <p><span className="text-slate-500">Nama:</span> <strong className="font-bold text-slate-900">{userToDelete.name}</strong></p>
                <p><span className="text-slate-500">No. ID:</span> <span className="font-mono font-bold text-slate-900">{userToDelete.nip}</span></p>
                <p><span className="text-slate-500">Jabatan:</span> {userToDelete.jabatan}</p>
                <p><span className="text-slate-500">Unit Kerja:</span> {userToDelete.unitKerja}</p>
              </div>
              <p className="text-[10px] text-rose-600 italic pt-1">
                * Seluruh riwayat presensi, permohonan cuti, dan surat tugas pegawai ini akan otomatis dibersihkan dari database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteEmployee}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-rose-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: IMPORT MASSAL EXCEL / CSV ================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Import Massal Pegawai via Excel / CSV
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Download Template */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-700" />
                    1. Unduh Format Template Resmi STIMI
                  </h4>
                  <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                    Template menyertakan kolom No. ID, Nama, Email, Jabatan, Unit Kerja, No. ID Atasan, dan Lokasi Gedung (misal: KAMPUS_1 atau Semua Gedung).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh .xlsx</span>
                </button>
              </div>
            </div>

            {/* Step 2: Upload File */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-indigo-600" />
                  2. Pilih File Excel / CSV yang Telah Diisi
                </label>
                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center">
                  <FileSpreadsheet className="w-8 h-8 text-indigo-500 mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    {importFileName ? importFileName : 'Klik untuk Memilih File atau Drag & Drop'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Mendukung format .xlsx, .xls, atau .csv
                  </p>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preview Hasil Baca Baris */}
              {importRows.length > 0 && (
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Terdeteksi {importRows.length} Baris Data Pegawai Siap Diproses
                    </span>
                  </div>
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-1 text-[11px] text-indigo-800 divide-y divide-indigo-100">
                    {importRows.slice(0, 5).map((r, idx) => (
                      <div key={idx} className="pt-1 flex justify-between font-mono">
                        <span>{r.nip} - {r.name}</span>
                        <span className="text-slate-500 font-sans">{r.lokasiGedung || 'Semua Gedung'}</span>
                      </div>
                    ))}
                    {importRows.length > 5 && (
                      <p className="pt-1 text-[10px] text-slate-500 italic">
                        ...dan {importRows.length - 5} pegawai lainnya.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error messages if any */}
              {importErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs text-rose-800 max-h-32 overflow-y-auto">
                  <p className="font-bold text-rose-900 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Catatan Selama Proses:
                  </p>
                  {importErrors.map((err, i) => (
                    <p key={i} className="text-[11px]">• {err}</p>
                  ))}
                </div>
              )}

              {/* Tombol Eksekusi Import */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={importRows.length === 0 || isSubmitting}
                  onClick={handleExecuteImport}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-200 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Sedang Mengimport...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Proses Import {importRows.length} Pegawai</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
