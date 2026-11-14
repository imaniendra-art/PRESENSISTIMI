'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { LiveClock } from '@/components/common/LiveClock';

interface MonitoringHeaderProps {
  currentDateStr: string; // YYYY-MM-DD
  formattedDateDisplay: string; // "Jumat, 6 November 2026"
  isToday: boolean;
}

export function MonitoringHeader({
  currentDateStr,
  formattedDateDisplay,
  isToday,
}: MonitoringHeaderProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ubah tanggal via URL query params
  const handleDateChange = (newDateStr: string) => {
    if (!newDateStr) return;
    router.push(`/admin/monitoring?date=${newDateStr}`);
  };

  // Navigasi geser 1 hari (Kemarin / Besok)
  const shiftDay = (days: number) => {
    const [y, m, d] = currentDateStr.split('-').map(Number);
    const current = new Date(y, m - 1, d);
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

  // Manual Refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    });
  };

  // Auto-refresh background per 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="bg-gradient-to-br from-sky-50/90 via-white to-sky-50/40 rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-sky-100/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4">
      {/* Sisi Kiri: Judul 2-Baris Simetris & Jam Live di Sampingnya pada Mobile */}
      <div className="flex items-center justify-between gap-2 w-full lg:w-auto">
        <div className="min-w-0">
          <h1 className="text-sm sm:text-2xl font-black text-slate-900 tracking-tight leading-tight whitespace-nowrap">
            Monitoring Kehadiran
          </h1>
          <p className="text-xs sm:text-lg font-extrabold text-slate-700 tracking-tight mt-0.5 leading-tight whitespace-nowrap">
            STIMI YAPMI Makassar
          </p>
        </div>

        {/* Jam Live di Samping Judul (Khusus Mobile) */}
        <div className="lg:hidden shrink-0">
          <LiveClock />
        </div>
      </div>

      {/* Sisi Kanan: Kontrol Tanggal, Live Clock, & Tombol Segarkan (Desktop) */}
      <div className="hidden lg:flex items-center gap-2.5 shrink-0">
        {/* Box Date Switcher */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/95 border border-sky-100 rounded-2xl shadow-2xs">
          <button
            type="button"
            onClick={() => shiftDay(-1)}
            className="p-1.5 hover:bg-sky-50 text-slate-600 hover:text-sky-700 rounded-xl transition cursor-pointer"
            title="Lihat 1 Hari Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-1">
            <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
            <input
              type="date"
              value={currentDateStr}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-xs font-bold font-mono text-slate-800 focus:outline-none cursor-pointer"
            />
            {isToday ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                Hari Ini
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                Riwayat Lalu
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => shiftDay(1)}
            className="p-1.5 hover:bg-sky-50 text-slate-600 hover:text-sky-700 rounded-xl transition cursor-pointer"
            title="Lihat 1 Hari Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tombol Shortcut Kembali ke Hari Ini */}
        {!isToday && (
          <button
            type="button"
            onClick={handleGoToday}
            className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Kembali ke Rekap Kehadiran Hari Ini"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Hari Ini</span>
          </button>
        )}

        {/* Live Clock di Desktop */}
        <LiveClock />

        {/* Tombol Segarkan Real-Time */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/95 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-sky-100 hover:border-sky-200 rounded-2xl text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-60"
          title="Segarkan data presensi sekarang (Auto-refresh aktif tiap 30s)"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-sky-600 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Sisi Bawah Mobile: Kontrol Tanggal & Tombol Segarkan 1-Baris Rapi */}
      <div className="grid grid-cols-12 gap-1.5 pt-2 border-t border-sky-100/80 lg:hidden w-full items-center">
        <div className="col-span-8 flex items-center justify-between bg-white/90 border border-sky-100 rounded-xl px-1.5 py-1 shadow-2xs">
          <button
            type="button"
            onClick={() => shiftDay(-1)}
            className="p-1 hover:bg-sky-50 text-slate-600 rounded-lg transition"
            title="Kemarin"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <input
            type="date"
            value={currentDateStr}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-transparent text-[11px] font-bold font-mono text-slate-800 focus:outline-none cursor-pointer max-w-[110px]"
          />

          <button
            type="button"
            onClick={() => shiftDay(1)}
            className="p-1 hover:bg-sky-50 text-slate-600 rounded-lg transition"
            title="Besok"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tombol Hari Ini atau Segarkan di Mobile */}
        <div className="col-span-4 flex items-center gap-1">
          {!isToday ? (
            <button
              type="button"
              onClick={handleGoToday}
              className="flex-1 py-1.5 px-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Hari Ini</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 py-1.5 px-2 bg-white/90 text-slate-700 border border-sky-100 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs"
            >
              <RefreshCw
                className={`w-3 h-3 text-sky-600 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>Segarkan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
