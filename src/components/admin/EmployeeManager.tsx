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
} from 'lucide-react';
import { User as UserType, CampusLocation } from '@prisma/client';

interface EmployeeManagerProps {
  users: (UserType & { atasan?: UserType | null; assignedLocation?: CampusLocation | null })[];
  superiors: UserType[];
  campusLocations: CampusLocation[];
}

export function EmployeeManager({ users, superiors, campusLocations }: EmployeeManagerProps) {
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected user for edit/reset/delete
  const [selectedUser, setSelectedUser] = useState<(UserType & { assignedLocation?: CampusLocation | null }) | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  // Search & Filter & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterLocation, setFilterLocation] = useState<string>('ALL');

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

  // Filtered & Sorted users list
  const filteredUsers = useMemo(() => {
    const list = users.filter((u) => {
      const matchQuery =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.jabatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.unitKerja.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = filterRole === 'ALL' || u.role === filterRole;

      const matchLoc =
        filterLocation === 'ALL' ||
        (filterLocation === 'UNASSIGNED' && !u.assignedLocationId) ||
        u.assignedLocationId === filterLocation;

      return matchQuery && matchRole && matchLoc;
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

      {/* Header Actions & Tools */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            <span>Manajemen Pegawai & Dosen ({users.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola akun, penugasan lokasi gedung presensi (Gedung I, Gedung II, atau Fleksibel), dan atasan langsung
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Ekspor Excel */}
          <button
            type="button"
            onClick={handleExportEmployees}
            title="Unduh seluruh data pegawai ke format Excel (.xlsx)"
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-300/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor Data Excel</span>
          </button>

          {/* Tombol Import Excel */}
          <button
            type="button"
            onClick={() => {
              setIsImportModalOpen(true);
              setImportRows([]);
              setImportFileName('');
              setImportErrors([]);
            }}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-200 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Excel / CSV</span>
          </button>

          {/* Tombol Tambah Manual */}
          <button
            type="button"
            onClick={() => {
              setIsAddModalOpen(true);
              setAlert(null);
            }}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-sky-600/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pegawai</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. ID, nama, jabatan, unit kerja..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Peran */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Semua Peran ({users.length})</option>
            <option value="PEGAWAI">Dosen / Pegawai ({users.filter((u) => u.role === 'PEGAWAI').length})</option>
            <option value="ATASAN">Atasan / Kaprodi ({users.filter((u) => u.role === 'ATASAN').length})</option>
            <option value="ADMIN">Admin SDM ({users.filter((u) => u.role === 'ADMIN').length})</option>
          </select>

          {/* Filter Gedung */}
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Semua Penugasan Gedung</option>
            <option value="UNASSIGNED">Fleksibel (Semua Gedung)</option>
            {campusLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabel Data Pegawai */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-3 font-bold text-center w-12">No</th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 font-bold cursor-pointer hover:bg-slate-100/80 transition select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>No. ID & Nama Pegawai</span>
                    {sortField === 'name' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-sky-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-sky-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('role')}
                  className="py-3.5 px-4 font-bold cursor-pointer hover:bg-slate-100/80 transition select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Peran (Role)</span>
                    {sortField === 'role' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-sky-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-sky-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('jabatan')}
                  className="py-3.5 px-4 font-bold cursor-pointer hover:bg-slate-100/80 transition select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Jabatan & Unit Kerja</span>
                    {sortField === 'jabatan' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-sky-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-sky-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('location')}
                  className="py-3.5 px-4 font-bold cursor-pointer hover:bg-slate-100/80 transition select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Lokasi Penugasan Presensi</span>
                    {sortField === 'location' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-sky-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-sky-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 font-bold">Atasan Langsung</th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3.5 px-4 font-bold text-center cursor-pointer hover:bg-slate-100/80 transition select-none group"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Status</span>
                    {sortField === 'status' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-sky-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-sky-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 font-bold text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak Ada Pegawai yang Sesuai</p>
                    <p className="text-[11px] mt-0.5">Coba ubah kata kunci pencarian atau filter lokasi Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-500 text-center text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">No. ID: {user.nip}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{user.email || 'Tanpa Email'}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === 'ATASAN'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{user.jabatan}</p>
                      <p className="text-[11px] text-slate-500">{user.unitKerja}</p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {user.assignedLocation ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{user.assignedLocation.name}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Semua Gedung (Fleksibel)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {user.atasan ? (
                        <div>
                          <p className="font-medium text-slate-800">{user.atasan.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            No. ID: {user.atasan.nip}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Tombol Edit */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Edit Data Pegawai & Lokasi Penugasan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Tombol Reset Password */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsResetModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition"
                          title="Reset Kata Sandi"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Tombol Aktifkan / Nonaktifkan */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user.id)}
                          className={`p-1.5 rounded-lg transition ${
                            user.isActive
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={user.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        >
                          {user.isActive ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {/* Tombol Hapus Pegawai */}
                        {user.role !== 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserToDelete(user);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus Pegawai Permanen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
