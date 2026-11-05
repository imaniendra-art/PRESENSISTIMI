'use client';

import { useState } from 'react';
import { createEmployee, toggleEmployeeStatus } from '@/actions/adminActions';
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import { User as UserType } from '@prisma/client';

interface EmployeeManagerProps {
  users: (UserType & { atasan?: UserType | null })[];
  superiors: UserType[];
}

export function EmployeeManager({ users, superiors }: EmployeeManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCreateEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await createEmployee(formData);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsModalOpen(false);
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

  return (
    <div className="space-y-6">
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

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Daftar Pegawai & Dosen ({users.length})</h2>
          <p className="text-xs text-slate-500">Kelola akun, hak akses peran, dan penugasan atasan langsung</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsModalOpen(true);
            setAlert(null);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-indigo-200 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pegawai Baru</span>
        </button>
      </div>

      {/* Tabel Data Pegawai */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-bold">NIP & Nama</th>
                <th className="py-3.5 px-4 font-bold">Email</th>
                <th className="py-3.5 px-4 font-bold">Peran (Role)</th>
                <th className="py-3.5 px-4 font-bold">Jabatan & Unit Kerja</th>
                <th className="py-3.5 px-4 font-bold">Atasan Langsung</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">NIP: {user.nip}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{user.email}</td>
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
                  <td className="py-3.5 px-4">
                    {user.atasan ? (
                      <div>
                        <p className="font-medium text-slate-800">{user.atasan.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          NIP: {user.atasan.nip}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {user.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(user.id)}
                      className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                        user.isActive
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={user.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                    >
                      {user.isActive ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Pegawai */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Tambah Pegawai / Dosen Baru</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    NIP / NIDN *
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
                    Email Resmi STIMI *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="andi@stimi.ac.id"
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
                      {sup.name} ({sup.jabatan} - {sup.nip})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
    </div>
  );
}
