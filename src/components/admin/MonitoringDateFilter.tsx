'use client';

import { useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface MonitoringDateFilterProps {
  currentDateStr: string; // YYYY-MM-DD
  formattedDateDisplay: string; // "Jumat, 6 November 2026"
  isToday: boolean;
}

export function MonitoringDateFilter({
  currentDateStr,
  formattedDateDisplay,
  isToday,
}: MonitoringDateFilterProps) {
  const router = useRouter();

  // Ubah tanggal via URL query params
  const handleDateChange = (newDateStr: string) => {
    if (!newDateStr) return;
    router.push(`/admin/monitoring?date=${newDateStr}`);
  };

  // Navigasi geser 1 hari (Kemarin / Besok)
  const shiftDay = (days: number) => {
    const current = new Date(currentDateStr + 'T00:00:00');
    current.setDate(current.getDate() + days);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    handleDateChange(`${yyyy}-${mm}-${dd}`);
  };

  // Shortcut ke Hari Ini
  const handleGoToday = () => {
    router.push('/admin/monitoring');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">
              {formattedDateDisplay}
            </h3>
            {isToday ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Hari Ini
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Riwayat Lalu
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Pilih tanggal tertentu untuk melihat rekapitulasi kehadiran harian sebelumnya
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Tombol Geser Mundur 1 Hari (H-1) */}
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition"
          title="Lihat 1 Hari Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Input Date Picker HTML5 */}
        <div className="relative">
          <input
            type="date"
            value={currentDateStr}
            onChange={(e) => handleDateChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {/* Tombol Geser Maju 1 Hari (H+1) */}
        <button
          type="button"
          onClick={() => shiftDay(1)}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition"
          title="Lihat 1 Hari Berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Tombol Kembali ke Hari Ini (Hanya muncul jika bukan hari ini) */}
        {!isToday && (
          <button
            type="button"
            onClick={handleGoToday}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kembali ke Hari Ini</span>
          </button>
        )}
      </div>
    </div>
  );
}
