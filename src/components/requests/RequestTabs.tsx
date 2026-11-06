'use client';

import { useState } from 'react';
import { submitLeaveRequest, submitDutyTripRequest } from '@/actions/leaveAndDutyActions';
import {
  CalendarDays,
  Briefcase,
  ListOrdered,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { LeaveRequest, DutyTrip, User } from '@prisma/client';

interface RequestTabsProps {
  myLeaves: (LeaveRequest & { approver?: User | null })[];
  myTrips: (DutyTrip & { approver?: User | null })[];
}

export function RequestTabs({ myLeaves, myTrips }: RequestTabsProps) {
  const [activeTab, setActiveTab] = useState<'leave' | 'trip' | 'history'>('leave');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const handleLeaveSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await submitLeaveRequest(formData);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        (e.target as HTMLFormElement).reset();
        setActiveTab('history');
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan sistem' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTripSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await submitDutyTripRequest(formData);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        (e.target as HTMLFormElement).reset();
        setActiveTab('history');
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan sistem' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 p-2 gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('leave');
            setFeedback(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'leave'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-sky-600" />
          <span>Pengajuan Cuti & Izin</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('trip');
            setFeedback(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'trip'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4 text-amber-600" />
          <span>Pengajuan Dinas Luar Kota</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('history');
            setFeedback(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-white text-sky-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListOrdered className="w-4 h-4 text-slate-600" />
          <span>Riwayat Pengajuan ({myLeaves.length + myTrips.length})</span>
        </button>
      </div>

      <div className="p-6">
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-xs font-medium leading-relaxed ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tab 1: Form Cuti */}
        {activeTab === 'leave' && (
          <form onSubmit={handleLeaveSubmit} className="max-w-2xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jenis Permohonan
              </label>
              <select
                name="type"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              >
                <option value="CUTI_TAHUNAN">Cuti Tahunan</option>
                <option value="IZIN">Izin Keperluan Mendesak</option>
                <option value="SAKIT">Izin Sakit</option>
                <option value="CUTI_MELAHIRKAN">Cuti Melahirkan</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  name="startDate"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  name="endDate"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alasan Pengajuan
              </label>
              <textarea
                name="reason"
                required
                rows={3}
                placeholder="Jelaskan alasan atau keperluan pengajuan cuti secara rinci..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Lampiran Berkas Pendukung (Surat Dokter / Surat Keterangan - Opsional)
              </label>
              <input
                type="file"
                name="attachment"
                accept=".pdf,image/*"
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-6 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-sky-600/20 cursor-pointer flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Mengirim Pengajuan...' : 'Kirim Permohonan Cuti'}</span>
            </button>
          </form>
        )}

        {/* Tab 2: Form Dinas Luar */}
        {activeTab === 'trip' && (
          <form onSubmit={handleTripSubmit} className="max-w-2xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Tugas / Kegiatan Kedinasan
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="Contoh: Rapat Koordinasi Kurikulum LLDIKTI IX"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kota / Lokasi Tujuan Dinas
              </label>
              <input
                type="text"
                name="destination"
                required
                placeholder="Contoh: Kantor LLDIKTI IX Makassar / Hotel Claro"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  name="startDate"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  name="endDate"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor Surat Tugas (Jika Sudah Terbit)
              </label>
              <input
                type="text"
                name="letterNumber"
                placeholder="Contoh: 142/ST-STIMI/XI/2026"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Upload Berkas Surat Tugas (PDF/Foto)
              </label>
              <input
                type="file"
                name="letterAttachment"
                accept=".pdf,image/*"
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-amber-200 flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>{isSubmitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Dinas Luar'}</span>
            </button>
          </form>
        )}

        {/* Tab 3: Daftar Pengajuan Saya */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-sky-600" />
                <span>Riwayat Permohonan Cuti & Izin</span>
              </h3>
              {myLeaves.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada permohonan cuti diajukan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Jenis</th>
                        <th className="py-2.5 px-3">Periode</th>
                        <th className="py-2.5 px-3">Hari</th>
                        <th className="py-2.5 px-3">Alasan</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Catatan Atasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {myLeaves.map((leave) => (
                        <tr key={leave.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold">{leave.type}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {new Date(leave.startDate).toLocaleDateString('id-ID')} s/d{' '}
                            {new Date(leave.endDate).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 font-bold">{leave.totalDays} hari</td>
                          <td className="py-2.5 px-3 max-w-xs truncate">{leave.reason}</td>
                          <td className="py-2.5 px-3">
                            {leave.status === 'APPROVED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3" /> Disetujui
                              </span>
                            ) : leave.status === 'REJECTED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                <X className="w-3 h-3" /> Ditolak
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <Clock className="w-3 h-3" /> Menunggu
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{leave.approverNote || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-600" />
                <span>Riwayat Pengajuan Dinas Luar Kota</span>
              </h3>
              {myTrips.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada pengajuan dinas luar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Tugas</th>
                        <th className="py-2.5 px-3">Tujuan</th>
                        <th className="py-2.5 px-3">Periode</th>
                        <th className="py-2.5 px-3">No. Surat</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {myTrips.map((trip) => (
                        <tr key={trip.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold">{trip.title}</td>
                          <td className="py-2.5 px-3">{trip.destination}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {new Date(trip.startDate).toLocaleDateString('id-ID')} s/d{' '}
                            {new Date(trip.endDate).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-2.5 px-3 font-mono">{trip.letterNumber || '-'}</td>
                          <td className="py-2.5 px-3">
                            {trip.status === 'APPROVED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3" /> Disetujui
                              </span>
                            ) : trip.status === 'REJECTED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                <X className="w-3 h-3" /> Ditolak
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                <Clock className="w-3 h-3" /> Menunggu
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{trip.approverNote || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
