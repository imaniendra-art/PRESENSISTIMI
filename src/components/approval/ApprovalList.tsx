'use client';

import { useState } from 'react';
import { reviewLeaveRequest, reviewDutyTripRequest } from '@/actions/leaveAndDutyActions';
import {
  Check,
  X,
  Calendar,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  FileText,
  User,
} from 'lucide-react';
import { LeaveRequest, DutyTrip, User as UserType } from '@prisma/client';

interface ApprovalListProps {
  pendingLeaves: (LeaveRequest & { user: UserType })[];
  pendingTrips: (DutyTrip & { user: UserType })[];
}

export function ApprovalList({ pendingLeaves, pendingTrips }: ApprovalListProps) {
  const [activeTab, setActiveTab] = useState<'leaves' | 'trips'>('leaves');
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    type: 'leave' | 'trip';
    action: 'APPROVED' | 'REJECTED';
    userName: string;
  } | null>(null);
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleConfirmReview = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    setAlert(null);

    try {
      if (selectedItem.type === 'leave') {
        const res = await reviewLeaveRequest({
          leaveId: selectedItem.id,
          status: selectedItem.action,
          note,
        });
        if (res.success) {
          setAlert({ type: 'success', message: res.message });
          setSelectedItem(null);
          setNote('');
        } else {
          setAlert({ type: 'error', message: res.message });
        }
      } else {
        const res = await reviewDutyTripRequest({
          tripId: selectedItem.id,
          status: selectedItem.action,
          note,
        });
        if (res.success) {
          setAlert({ type: 'success', message: res.message });
          setSelectedItem(null);
          setNote('');
        } else {
          setAlert({ type: 'error', message: res.message });
        }
      }
    } catch {
      setAlert({ type: 'error', message: 'Terjadi kesalahan sistem saat memproses permohonan' });
    } finally {
      setIsProcessing(false);
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 gap-2 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'leaves'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Permohonan Cuti / Izin ({pendingLeaves.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trips')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'trips'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Pengajuan Dinas Luar Kota ({pendingTrips.length})</span>
        </button>
      </div>

      {/* Konten Tab Permohonan Cuti */}
      {activeTab === 'leaves' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {pendingLeaves.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-700">Semua Permohonan Cuti Selesai</p>
              <p className="text-xs text-slate-500 mt-1">
                Tidak ada permohonan cuti staf yang menunggu verifikasi saat ini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <User className="w-4 h-4 text-indigo-600" />
                        {leave.user.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        (NIP: {leave.user.nip})
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {leave.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Periode: </span>
                      {new Date(leave.startDate).toLocaleDateString('id-ID')} s/d{' '}
                      {new Date(leave.endDate).toLocaleDateString('id-ID')} ({leave.totalDays} hari)
                    </p>

                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Alasan: </span>
                      {leave.reason}
                    </p>

                    {leave.attachmentUrl && (
                      <a
                        href={leave.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-semibold underline mt-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lihat Lampiran Berkas</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedItem({
                          id: leave.id,
                          type: 'leave',
                          action: 'APPROVED',
                          userName: leave.user.name,
                        })
                      }
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-200"
                    >
                      <Check className="w-4 h-4" />
                      <span>Setujui</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedItem({
                          id: leave.id,
                          type: 'leave',
                          action: 'REJECTED',
                          userName: leave.user.name,
                        })
                      }
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-rose-200"
                    >
                      <X className="w-4 h-4" />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Konten Tab Pengajuan Dinas Luar */}
      {activeTab === 'trips' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {pendingTrips.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-700">
                Semua Tugas Dinas Luar Terverifikasi
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Tidak ada pengajuan tugas dinas luar yang menunggu persetujuan.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <User className="w-4 h-4 text-amber-600" />
                        {trip.user.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        (NIP: {trip.user.nip})
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800">{trip.title}</p>

                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Tujuan: </span>
                      {trip.destination}
                    </p>

                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Periode: </span>
                      {new Date(trip.startDate).toLocaleDateString('id-ID')} s/d{' '}
                      {new Date(trip.endDate).toLocaleDateString('id-ID')}
                    </p>

                    {trip.letterNumber && (
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">No. Surat: </span>
                        {trip.letterNumber}
                      </p>
                    )}

                    {trip.letterAttachmentUrl && (
                      <a
                        href={trip.letterAttachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-semibold underline mt-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lihat Berkas Surat Tugas</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedItem({
                          id: trip.id,
                          type: 'trip',
                          action: 'APPROVED',
                          userName: trip.user.name,
                        })
                      }
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-200"
                    >
                      <Check className="w-4 h-4" />
                      <span>Setujui</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedItem({
                          id: trip.id,
                          type: 'trip',
                          action: 'REJECTED',
                          userName: trip.user.name,
                        })
                      }
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-rose-200"
                    >
                      <X className="w-4 h-4" />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog Konfirmasi Approval */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Konfirmasi {selectedItem.action === 'APPROVED' ? 'Persetujuan' : 'Penolakan'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Apakah Anda yakin ingin{' '}
              <span className="font-semibold text-slate-700">
                {selectedItem.action === 'APPROVED' ? 'menyetujui' : 'menolak'}
              </span>{' '}
              permohonan dari <span className="font-bold">{selectedItem.userName}</span>?
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Atasan (Opsional):
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Berikan instruksi atau alasan bila diperlukan..."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmReview}
                className={`px-4 py-2.5 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5 ${
                  selectedItem.action === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                }`}
              >
                {isProcessing ? 'Menyimpan...' : 'Konfirmasi Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
