'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Printer,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  Building,
  FileText,
  UserX,
  Search,
  Eye,
  Calendar,
  Briefcase,
  MapPin,
  Timer,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { CampusSetting } from '@prisma/client';
import { LiveClock } from '@/components/common/LiveClock';

export interface ReportSummaryRow {
  userId: string;
  nip: string;
  name: string;
  jabatan: string;
  unitKerja: string;
  lokasiPenugasan: string;
  hariKerjaEfektif: number;
  totalHadir: number;
  hadirWfo: number;
  hadirWfa: number;
  tepatWaktu: number;
  terlambat: number;
  pulangCepat: number;
  dinasLuar: number;
  izinCutiSakit: number;
  alfa: number;
  persentaseKehadiran: number;
}

export interface DailyLogRow {
  no: number;
  tanggal: string;
  hari: string;
  modeKerja: string;
  nip: string;
  name: string;
  unitKerja: string;
  jamMasuk: string;
  statusMasuk: string;
  jamPulang: string;
  statusPulang: string;
  durasiKerja: string;
  lokasi: string;
}

export interface EmployeeDailyLog {
  no: number;
  date: string;
  dateDisplay: string;
  dayName: string;
  dayOfWeek: number;
  isToday: boolean;
  isPastOrToday: boolean;
  statusType:
    | 'HADIR_WFO'
    | 'HADIR_WFA'
    | 'DINAS_LUAR'
    | 'IZIN_CUTI'
    | 'ALFA'
    | 'BELUM_BERJALAN';
  statusLabel: string;
  clockInTime: string | null;
  clockInStatus: 'TEPAT_WAKTU' | 'TERLAMBAT' | 'DINAS_LUAR' | null;
  clockInStatusLabel: string | null;
  lateMinutes: number;
  clockOutTime: string | null;
  clockOutStatus: 'NORMAL' | 'PULANG_CEPAT' | 'DINAS_LUAR' | null;
  clockOutStatusLabel: string | null;
  durationMinutes: number;
  durationDisplay: string;
  locationDisplay: string;
  note: string | null;
}

export interface EmployeeIndividualReport {
  userId: string;
  nip: string;
  name: string;
  email: string | null;
  phone: string | null;
  jabatan: string;
  unitKerja: string;
  lokasiPenugasan: string;
  scheduleName: string;
  scheduleDetails: string;
  stats: {
    hariKerjaEfektif: number;
    totalHadir: number;
    hadirWfo: number;
    hadirWfa: number;
    tepatWaktu: number;
    terlambat: number;
    totalLateMinutes: number;
    pulangCepat: number;
    dinasLuar: number;
    izinCutiSakit: number;
    alfa: number;
    persentaseKehadiran: number;
    totalWorkMinutes: number;
    totalWorkHoursDisplay: string;
  };
  dailyLogs: EmployeeDailyLog[];
}

export interface KpiStats {
  totalPegawai: number;
  avgKehadiran: number;
  totalHadirWfo: number;
  totalHadirWfa: number;
  totalTerlambat: number;
  totalPulangCepat: number;
  totalIzinCuti: number;
  totalAlfa: number;
  effectiveWorkingDays: number;
  totalWfoDays: number;
  totalWfaDays: number;
  isCurrentMonth: boolean;
}

interface ReportGeneratorProps {
  campusSetting: CampusSetting;
  reportData: ReportSummaryRow[];
  dailyLogs: DailyLogRow[];
  individualReports: EmployeeIndividualReport[];
  kpiStats: KpiStats;
  selectedMonth: number;
  selectedYear: number;
}

export function ReportGenerator({
  campusSetting,
  reportData,
  dailyLogs,
  individualReports,
  kpiStats,
  selectedMonth,
  selectedYear,
}: ReportGeneratorProps) {
  const router = useRouter();
  const filterMonth = selectedMonth;
  const filterYear = selectedYear;

  // Tab State: 'REKAP_SEMUA' atau 'RINCIAN_PERORANGAN'
  const [activeTab, setActiveTab] = useState<'REKAP_SEMUA' | 'RINCIAN_PERORANGAN'>(
    'REKAP_SEMUA'
  );

  // Selected Employee for Tab 2
  const [selectedUserId, setSelectedUserId] = useState<string>(
    individualReports.length > 0 ? individualReports[0].userId : ''
  );

  // Filter pencarian nama pegawai di tabel rekap
  const [rekapSearch, setRekapSearch] = useState<string>('');

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const handlePeriodChange = (month: number, year: number) => {
    router.push(`/admin/laporan?month=${month}&year=${year}`);
  };

  // Pegawai terpilih untuk laporan perorangan
  const currentIndividual =
    individualReports.find((r) => r.userId === selectedUserId) || individualReports[0];

  // Filter baris rekapitulasi berdasarkan teks pencarian
  const filteredReportData = reportData.filter((row) => {
    if (!rekapSearch.trim()) return true;
    const q = rekapSearch.toLowerCase();
    return (
      row.name.toLowerCase().includes(q) ||
      row.nip.toLowerCase().includes(q) ||
      row.jabatan.toLowerCase().includes(q) ||
      row.unitKerja.toLowerCase().includes(q)
    );
  });

  // Ekspor Excel Multi-Sheet Komprehensif (Rekap Bulanan + Log Harian Seluruh Pegawai)
  const handleExportExcelAll = () => {
    const workbook = XLSX.utils.book_new();

    // SHEET 1: REKAPITULASI BULANAN SEMUA PEGAWAI
    const summaryRows = reportData.map((row, idx) => ({
      No: idx + 1,
      'No. ID / NIP': row.nip,
      'Nama Pegawai': row.name,
      Jabatan: row.jabatan,
      'Unit Kerja': row.unitKerja,
      'Lokasi Penugasan': row.lokasiPenugasan,
      'Hari Kerja Efektif': row.hariKerjaEfektif,
      'Total Hadir': row.totalHadir,
      'Hadir WFO (Senin-Kamis)': row.hadirWfo,
      'Hadir WFA (Jumat)': row.hadirWfa,
      'Tepat Waktu': row.tepatWaktu,
      Terlambat: row.terlambat,
      'Pulang Cepat': row.pulangCepat,
      'Dinas Luar': row.dinasLuar,
      'Izin / Cuti / Sakit': row.izinCutiSakit,
      'Alfa (Tanpa Keterangan)': row.alfa,
      'Tingkat Kehadiran (%)': `${row.persentaseKehadiran}%`,
    }));

    const worksheetSummary = XLSX.utils.json_to_sheet(summaryRows);
    worksheetSummary['!cols'] = [
      { wch: 5 },
      { wch: 14 },
      { wch: 30 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 18 },
      { wch: 12 },
      { wch: 24 },
      { wch: 18 },
      { wch: 14 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 20 },
      { wch: 22 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheetSummary, 'Rekap Bulanan Pegawai');

    // SHEET 2: LOG RINCIAN PRESENSI HARIAN SELURUH PEGAWAI
    const dailyRows = dailyLogs.map((log) => ({
      No: log.no,
      Tanggal: log.tanggal,
      Hari: log.hari,
      'Mode Kerja': log.modeKerja,
      'No. ID / NIP': log.nip,
      'Nama Pegawai': log.name,
      'Unit Kerja': log.unitKerja,
      'Jam Masuk (WITA)': log.jamMasuk,
      'Status Masuk': log.statusMasuk,
      'Jam Pulang (WITA)': log.jamPulang,
      'Status Pulang': log.statusPulang,
      'Durasi Kerja': log.durasiKerja,
      'Lokasi Presensi': log.lokasi,
    }));

    const worksheetDaily = XLSX.utils.json_to_sheet(dailyRows);
    worksheetDaily['!cols'] = [
      { wch: 5 },
      { wch: 14 },
      { wch: 10 },
      { wch: 22 },
      { wch: 14 },
      { wch: 30 },
      { wch: 25 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 20 },
      { wch: 28 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheetDaily, 'Log Presensi Harian');

    const fileName = `Rekap_Presensi_Lengkap_STIMI_${monthNames[filterMonth - 1]}_${filterYear}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Ekspor Excel Khusus 1 Pegawai (Buku Presensi Individu)
  const handleExportExcelIndividual = () => {
    if (!currentIndividual) return;

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Rincian Log Harian Pegawai Terpilih
    const rows = currentIndividual.dailyLogs.map((log) => ({
      No: log.no,
      'Hari & Tanggal': log.dateDisplay,
      'Status / Mode Kerja': log.statusLabel,
      'Jam Masuk (WITA)': log.clockInTime || '-',
      'Status Masuk': log.clockInStatusLabel || '-',
      'Menit Lambat': log.lateMinutes > 0 ? `${log.lateMinutes} Menit` : '-',
      'Jam Pulang (WITA)': log.clockOutTime || '-',
      'Status Pulang': log.clockOutStatusLabel || '-',
      'Durasi Kerja': log.durationDisplay,
      'Lokasi Presensi': log.locationDisplay,
      'Catatan / Alasan': log.note || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 24 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 26 },
      { wch: 30 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `Buku Presensi ${currentIndividual.nip}`
    );

    const safeName = currentIndividual.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Presensi_Individu_${currentIndividual.nip}_${safeName}_${monthNames[filterMonth - 1]}_${filterYear}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* CSS Khusus Mode Cetak A4 Landscape / Portrait & Print Optimization */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          header,
          nav,
          footer,
          aside,
          .print-hidden,
          [data-bottom-nav] {
            display: none !important;
          }
          .print-landscape-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* 1. SOFT SKY HERO CARD - Simetris & Selaras dengan Overview, Monitoring, Data Pegawai & Pengaturan */}
      <div className="bg-gradient-to-br from-sky-50/90 via-white to-sky-50/40 rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-sky-100/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4 print-hidden print:hidden">
        {/* Header Row: Judul di Kiri & Jam Live di Sampingnya (Khusus Mobile Mengisi Space Kosong) */}
        <div className="flex items-center justify-between gap-2 w-full lg:w-auto">
          <div className="min-w-0">
            <h1 className="text-sm sm:text-2xl font-black text-slate-900 tracking-tight leading-tight whitespace-nowrap">
              Laporan & Rekapitulasi Presensi
            </h1>
            <p className="text-xs sm:text-lg font-extrabold text-slate-700 tracking-tight mt-0.5 leading-tight whitespace-nowrap">
              STIMI YAPMI Makassar
            </p>
          </div>

          {/* Jam Live Real-Time Khusus Mobile */}
          <div className="lg:hidden shrink-0">
            <LiveClock />
          </div>
        </div>

        {/* Sisi Kanan Desktop: Tombol Aksi + Live Clock */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          {activeTab === 'REKAP_SEMUA' ? (
            <>
              <button
                type="button"
                onClick={handleExportExcelAll}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Ekspor Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPDF}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak PDF Landscape</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleExportExcelIndividual}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Ekspor Excel Pegawai</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPDF}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar Individu</span>
              </button>
            </>
          )}

          <div className="h-6 w-px bg-slate-200 ml-1 mr-1" />

          <LiveClock />
        </div>

        {/* Sisi Bawah Mobile: Tombol Aksi 1-Baris Penuh Simetris */}
        <div className="grid grid-cols-2 gap-1.5 pt-1.5 sm:pt-2 border-t border-sky-100/80 lg:hidden w-full">
          {activeTab === 'REKAP_SEMUA' ? (
            <>
              <button
                type="button"
                onClick={handleExportExcelAll}
                className="px-2.5 py-1.5 bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Ekspor Excel</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPDF}
                className="px-2.5 py-1.5 bg-sky-600 active:bg-sky-700 text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              >
                <Printer className="w-3 h-3" />
                <span>Cetak PDF</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleExportExcelIndividual}
                className="px-2.5 py-1.5 bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Ekspor Excel</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPDF}
                className="px-2.5 py-1.5 bg-sky-600 active:bg-sky-700 text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
              >
                <Printer className="w-3 h-3" />
                <span>Cetak Lembar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. GRID METRIK KPI INSTITUSI: Langsung di Bawah Hero (Selaras dengan Menu Lain) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 print-hidden print:hidden">
        <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold">
            <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
            <span>Total Pegawai</span>
          </div>
          <p className="font-mono text-xl font-extrabold text-slate-900 tabular-nums">
            {kpiStats.totalPegawai} <span className="text-xs font-normal text-slate-500">Orang</span>
          </p>
        </div>

        <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>Rata Kehadiran</span>
          </div>
          <p className="font-mono text-xl font-extrabold text-emerald-600 tabular-nums">
            {kpiStats.avgKehadiran}%
          </p>
        </div>

        <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold">
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building className="w-3.5 h-3.5" />
            </div>
            <span>Hadir WFO / WFA</span>
          </div>
          <p className="font-mono text-xl font-extrabold text-slate-900 tabular-nums">
            {kpiStats.totalHadirWfo}{' '}
            <span className="text-xs font-bold text-sky-600">/ {kpiStats.totalHadirWfa}</span>
          </p>
        </div>

        <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold">
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span>Terlambat / Plg Cpt</span>
          </div>
          <p className="font-mono text-xl font-extrabold text-amber-700 tabular-nums">
            {kpiStats.totalTerlambat}{' '}
            <span className="text-xs font-normal text-slate-400">/ {kpiStats.totalPulangCepat}</span>
          </p>
        </div>

        <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span>Izin / Cuti / Sakit</span>
          </div>
          <p className="font-mono text-xl font-extrabold text-indigo-700 tabular-nums">
            {kpiStats.totalIzinCuti} <span className="text-xs font-normal text-slate-400">Hari</span>
          </p>
        </div>

        <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold">
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-3.5 h-3.5" />
            </div>
            <span>Alfa (Mangkir)</span>
          </div>
          <p className="font-mono text-xl font-extrabold text-rose-600 tabular-nums">
            {kpiStats.totalAlfa} <span className="text-xs font-normal text-slate-400">Hari</span>
          </p>
        </div>
      </div>

      {/* 3. WADAH TABEL UTAMA TERPADU: TAB SWITCHER & FILTER DI HEADER (Persis Seperti Menu Lain) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden w-full print-landscape-container print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
        {/* Toolbar Header Terpadu: Pilihan Tab di Kiri & Filter Periode di Kanan */}
        <div className="p-3 sm:p-4 bg-slate-50/80 border-b border-slate-200/90 flex flex-col lg:flex-row lg:items-center justify-between gap-3 print-hidden print:hidden">
          {/* Tab Switcher Segmented */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('REKAP_SEMUA')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'REKAP_SEMUA'
                  ? 'bg-sky-50 text-sky-800 shadow-2xs border border-sky-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="sm:hidden">Rekap Semua</span>
              <span className="hidden sm:inline">Rekap Seluruh SDM</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('RINCIAN_PERORANGAN')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'RINCIAN_PERORANGAN'
                  ? 'bg-sky-50 text-sky-800 shadow-2xs border border-sky-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="sm:hidden">Perorangan</span>
              <span className="hidden sm:inline">Rincian Perorangan (1 SDM per Bulan)</span>
            </button>
          </div>

          {/* Filter Periode Terpadu di Sebelah Kanan */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mr-1">
              <Filter className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-slate-700 font-bold hidden sm:inline">Periode:</span>
            </div>

            <button
              type="button"
              onClick={() => handlePeriodChange(10, 2026)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterMonth === 10 && filterYear === 2026
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              Okt 2026
            </button>

            <button
              type="button"
              onClick={() => handlePeriodChange(11, 2026)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterMonth === 11 && filterYear === 2026
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
              }`}
            >
              Nov 2026 (Bulan Ini)
            </button>

            {/* Dropdown Bulan */}
            <select
              value={filterMonth}
              onChange={(e) => handlePeriodChange(parseInt(e.target.value), filterYear)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
            >
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>

            {/* Dropdown Tahun */}
            <select
              value={filterYear}
              onChange={(e) => handlePeriodChange(filterMonth, parseInt(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>

        {/* 4. TAB 1: REKAPITULASI SELURUH SDM (KOMPREHENSIF) */}
        {activeTab === 'REKAP_SEMUA' && (
          <div className="p-3.5 sm:p-5 space-y-4">
            {/* Baris Pencarian Cepat di Layar Web */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-100 print-hidden print:hidden">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, NIP, atau unit kerja..."
                  value={rekapSearch}
                  onChange={(e) => setRekapSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50 text-slate-800"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Menampilkan <strong>{filteredReportData.length}</strong> dari {reportData.length} pegawai
              </p>
            </div>

          {/* Kop Surat Resmi Institusi STIMI (Tampil Utuh di Desktop & Cetak PDF, Disederhanakan di Ponsel) */}
          <div className="hidden sm:flex items-center justify-center gap-5 pb-4 border-b-2 border-slate-900 print:flex">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
              <Image
                src="/logo.png"
                alt="Logo STIMI Makassar"
                width={64}
                height={64}
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
              />
            </div>
            <div className="text-center">
              <h2 className="text-base sm:text-xl font-black uppercase tracking-wide text-slate-900">
                SEKOLAH TINGGI ILMU MANAJEMEN INDONESIA (STIMI) YAPMI MAKASSAR
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">{campusSetting.address}</p>
              <div className="mt-1.5 pt-1.5 border-t border-slate-300">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase text-slate-900 tracking-tight">
                  Laporan Rekapitulasi Kehadiran Dosen & Tenaga Kependidikan
                </h3>
                <p className="text-[10.5px] sm:text-xs text-slate-600 mt-0.5">
                  Periode: Bulan <strong>{monthNames[filterMonth - 1]} {filterYear}</strong> • Pola 5 Hari Kerja (Senin–Kamis WFO, Jumat WFA)
                  {kpiStats.isCurrentMonth && (
                    <span className="italic text-slate-500"> (Dihitung berjalan s/d hari ini: {kpiStats.effectiveWorkingDays} hari kerja)</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Baris Ringkas Layar Ponsel (sm:hidden) */}
          <div className="sm:hidden flex items-center justify-between pb-2 border-b border-slate-100 text-[11px] font-semibold text-slate-600 print:hidden">
            <span className="text-slate-800 font-bold">Rekap Presensi SDM</span>
            <span className="text-slate-500 font-mono">{monthNames[filterMonth - 1]} {filterYear}</span>
          </div>

          {/* Tampilan Desktop: Tabel Rekapitulasi 17 Kolom Mandiri (Zero Horizontal Scroll di Desktop) */}
          <div className="hidden md:block overflow-x-auto lg:overflow-x-visible w-full">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-y-2 border-slate-300 text-[10px] sm:text-[10.5px] uppercase tracking-tight">
                  <th className="py-2 px-1 font-bold text-center w-6">No</th>
                  <th className="py-2 px-1 font-bold w-18">No. ID</th>
                  <th className="py-2 px-1.5 font-bold">Nama Pegawai</th>
                  <th className="py-2 px-1 font-bold">Jabatan</th>
                  <th className="py-2 px-1 font-bold">Unit Kerja</th>
                  <th
                    className="py-2 px-0.5 font-bold text-center bg-slate-200/70 leading-tight"
                    title="Hari Kerja Efektif"
                  >
                    Hari Kerja
                  </th>
                  <th
                    className="py-2 px-0.5 font-bold text-center text-sky-800 leading-tight"
                    title="Total Hadir Fisik & WFA"
                  >
                    Total Hadir
                  </th>
                  <th
                    className="py-2 px-0.5 font-bold text-center leading-tight"
                    title="Hadir WFO di Kampus (Senin-Kamis)"
                  >
                    WFO
                  </th>
                  <th className="py-2 px-0.5 font-bold text-center leading-tight" title="Hadir WFA (Jumat)">
                    WFA
                  </th>
                  <th className="py-2 px-0.5 font-bold text-center text-emerald-700 leading-tight">Tepat Waktu</th>
                  <th className="py-2 px-0.5 font-bold text-center text-amber-700 leading-tight">Terlambat</th>
                  <th className="py-2 px-0.5 font-bold text-center text-amber-800 leading-tight">Plg Cepat</th>
                  <th className="py-2 px-0.5 font-bold text-center text-indigo-700 leading-tight">Dinas Luar</th>
                  <th
                    className="py-2 px-0.5 font-bold text-center text-purple-700 leading-tight"
                    title="Izin, Cuti Tahunan, dan Sakit"
                  >
                    Izin/Cuti
                  </th>
                  <th
                    className="py-2 px-0.5 font-bold text-center text-rose-700 leading-tight"
                    title="Alfa / Tanpa Keterangan"
                  >
                    Alfa
                  </th>
                  <th className="py-2 px-0.5 font-bold text-center bg-sky-100/70 text-sky-900 leading-tight">
                    % Hadir
                  </th>
                  <th className="py-2 px-1 font-bold text-center w-14 print:hidden print-hidden">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredReportData.map((row, idx) => (
                  <tr
                    key={row.userId}
                    className="hover:bg-sky-50/40 transition-colors print:hover:bg-transparent"
                  >
                    <td className="py-1.5 px-1 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-1.5 px-1 font-mono text-[10.5px] text-slate-600">{row.nip}</td>
                    <td className="py-1.5 px-1.5 font-bold text-slate-900 max-w-[145px] xl:max-w-none truncate" title={row.name}>
                      {row.name}
                    </td>
                    <td className="py-1.5 px-1 text-slate-600 truncate max-w-[105px] text-[10.5px]" title={row.jabatan}>
                      {row.jabatan}
                    </td>
                    <td className="py-1.5 px-1 text-slate-600 truncate max-w-[95px] text-[10.5px]" title={row.unitKerja}>
                      {row.unitKerja}
                    </td>
                    <td className="py-1.5 px-0.5 text-center font-mono font-semibold bg-slate-50 tabular-nums">
                      {row.hariKerjaEfektif}
                    </td>
                    <td className="py-1.5 px-0.5 text-center font-mono font-bold text-sky-800 tabular-nums">
                      {row.totalHadir}
                    </td>
                    <td className="py-1.5 px-0.5 text-center font-mono text-slate-700 tabular-nums">
                      {row.hadirWfo}
                    </td>
                    <td className="py-1.5 px-0.5 text-center font-mono text-slate-700 tabular-nums">
                      {row.hadirWfa}
                    </td>
                    <td className="py-1.5 px-0.5 text-center font-mono text-emerald-700 font-medium tabular-nums">
                      {row.tepatWaktu}
                    </td>
                    <td className="py-1.5 px-0.5 text-center font-mono text-amber-700 font-medium tabular-nums">
                      {row.terlambat > 0 ? (
                        <span className="text-amber-800 font-bold">{row.terlambat}</span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="py-1.5 px-0.5 text-center font-mono text-amber-800 font-medium tabular-nums">
                      {row.pulangCepat > 0 ? row.pulangCepat : '0'}
                    </td>
                    <td className="py-1.5 px-0.5 text-center font-mono text-indigo-700 font-medium tabular-nums">
                      {row.dinasLuar > 0 ? row.dinasLuar : '0'}
                    </td>
                    <td className="py-1.5 px-0.5 text-center font-mono text-purple-700 font-medium tabular-nums">
                      {row.izinCutiSakit > 0 ? row.izinCutiSakit : '0'}
                    </td>
                    <td className="py-1.5 px-0.5 text-center font-mono font-bold tabular-nums">
                      {row.alfa > 0 ? (
                        <span className="text-rose-600 bg-rose-50 px-1 py-0.2 rounded font-black">
                          {row.alfa}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-1.5 px-0.5 text-center font-mono font-black bg-sky-50 text-sky-950 tabular-nums">
                      {row.persentaseKehadiran}%
                    </td>
                    <td className="py-1.5 px-1 text-center print:hidden print-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserId(row.userId);
                          setActiveTab('RINCIAN_PERORANGAN');
                        }}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 border border-sky-200/80 transition shadow-2xs cursor-pointer"
                        title="Lihat Log Buku Presensi Lengkap Pegawai Ini"
                      >
                        <Eye className="w-3 h-3 text-sky-600" />
                        <span>Rincian</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Baris Total & Rata-rata Institusi */}
              <tfoot>
                <tr className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300">
                  <td
                    colSpan={5}
                    className="py-2 px-2 text-right uppercase tracking-wider text-[10px]"
                  >
                    Rata-rata / Total Keseluruhan:
                  </td>
                  <td className="py-2 px-0.5 text-center font-mono tabular-nums">
                    {kpiStats.effectiveWorkingDays}
                  </td>
                  <td className="py-2 px-0.5 text-center font-mono text-sky-900 tabular-nums">
                    {kpiStats.totalHadirWfo + kpiStats.totalHadirWfa}
                  </td>
                  <td className="py-2 px-0.5 text-center font-mono tabular-nums">
                    {kpiStats.totalHadirWfo}
                  </td>
                  <td className="py-2 px-0.5 text-center font-mono tabular-nums">
                    {kpiStats.totalHadirWfa}
                  </td>
                  <td className="py-2 px-0.5 text-center font-mono text-emerald-800 tabular-nums">
                    {reportData.reduce((acc, r) => acc + r.tepatWaktu, 0)}
                  </td>
                  <td className="py-2 px-0.5 text-center font-mono text-amber-800 tabular-nums">
                    {kpiStats.totalTerlambat}
                  </td>
                  <td className="py-2 px-0.5 text-center font-mono text-amber-800 tabular-nums">
                    {kpiStats.totalPulangCepat}
                  </td>
                  <td className="py-2 px-0.5 text-center font-mono text-indigo-800 tabular-nums">
                    {reportData.reduce((acc, r) => acc + r.dinasLuar, 0)}
                  </td>
                  <td className="py-2 px-0.5 text-center font-mono text-purple-800 tabular-nums">
                    {kpiStats.totalIzinCuti}
                  </td>
                  <td className="py-2 px-0.5 text-center font-mono text-rose-800 tabular-nums">
                    {kpiStats.totalAlfa}
                  </td>
                  <td className="py-2 px-0.5 text-center font-mono text-sky-950 bg-sky-200/60 font-black tabular-nums">
                    {kpiStats.avgKehadiran}%
                  </td>
                  <td className="py-2 px-1 print:hidden print-hidden" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tampilan Mobile: Tabel Kompak Minimalis 5 Kolom Vital (Zero Horizontal Scroll di Ponsel) */}
          <div className="block md:hidden w-full overflow-hidden rounded-xl border border-slate-200/90 shadow-2xs print:hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[10px] font-bold uppercase tracking-tight">
                  <th className="py-2 px-2.5">Pegawai</th>
                  <th className="py-2 px-1 text-center w-14">Hadir</th>
                  <th className="py-2 px-1 text-center w-11 text-amber-700">Lambat</th>
                  <th className="py-2 px-1 text-center w-10 text-rose-700">Alfa</th>
                  <th className="py-2 px-1.5 text-center w-14">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 bg-white">
                {filteredReportData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      Tidak ada data pegawai yang sesuai filter
                    </td>
                  </tr>
                ) : (
                  filteredReportData.map((row) => (
                    <tr key={`mob-rep-${row.userId}`} className="hover:bg-sky-50/30 transition-colors">
                      {/* 1. Pegawai: Nama, NIP & Unit */}
                      <td className="py-2 px-2.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {row.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate max-w-[130px] xs:max-w-[160px]" title={row.name}>
                              {row.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono truncate max-w-[130px] xs:max-w-[160px]">
                              {row.nip} • {row.unitKerja}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Hadir: Angka Hadir & % */}
                      <td className="py-2 px-1 text-center font-mono">
                        <span className="font-bold text-sky-900 text-xs block tabular-nums">
                          {row.totalHadir}
                        </span>
                        <span className="text-[9.5px] font-black text-emerald-700 block tabular-nums">
                          {row.persentaseKehadiran}%
                        </span>
                      </td>

                      {/* 3. Lambat */}
                      <td className="py-2 px-1 text-center font-mono tabular-nums">
                        {row.terlambat > 0 ? (
                          <span className="font-bold text-amber-800 bg-amber-50 px-1 py-0.5 rounded text-[11px]">
                            {row.terlambat}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0</span>
                        )}
                      </td>

                      {/* 4. Alfa */}
                      <td className="py-2 px-1 text-center font-mono tabular-nums">
                        {row.alfa > 0 ? (
                          <span className="font-black text-rose-600 bg-rose-50 px-1 py-0.5 rounded text-[11px]">
                            {row.alfa}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0</span>
                        )}
                      </td>

                      {/* 5. Aksi: Tombol Rincian */}
                      <td className="py-2 px-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserId(row.userId);
                            setActiveTab('RINCIAN_PERORANGAN');
                          }}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 border border-sky-200/80 transition shadow-2xs cursor-pointer w-full"
                          title="Buka Lembar Rincian Pegawai Ini"
                        >
                          <Eye className="w-3 h-3 text-sky-600" />
                          <span>Rincian</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {/* Ringkasan Total Footer Mobile */}
              <tfoot>
                <tr className="bg-slate-100 text-slate-900 font-bold border-t border-slate-200 text-[10px]">
                  <td className="py-2 px-2.5 text-right font-bold uppercase tracking-wider text-[9.5px]">
                    Total / Rata-rata:
                  </td>
                  <td className="py-2 px-1 text-center font-mono">
                    <span className="block text-sky-950 font-bold tabular-nums">
                      {kpiStats.totalHadirWfo + kpiStats.totalHadirWfa}
                    </span>
                    <span className="block text-[9.5px] font-black text-sky-950 tabular-nums">
                      {kpiStats.avgKehadiran}%
                    </span>
                  </td>
                  <td className="py-2 px-1 text-center font-mono text-amber-800 tabular-nums">
                    {kpiStats.totalTerlambat}
                  </td>
                  <td className="py-2 px-1 text-center font-mono text-rose-800 tabular-nums">
                    {kpiStats.totalAlfa}
                  </td>
                  <td className="py-2 px-1.5" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tanda Tangan Pengesahan (Siap Cetak / Desktop) */}
          <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 hidden sm:flex print:flex justify-between text-xs text-slate-800 break-inside-avoid">
            <div className="text-center w-64">
              <p>Mengetahui,</p>
              <p className="font-bold">Ketua STIMI Makassar</p>
              <div className="h-20" />
              <p className="font-bold underline">( .................................................... )</p>
              <p className="text-[11px] text-slate-500">NIDN. ........................................</p>
            </div>

            <div className="text-center w-64">
              <p>Makassar, {new Date().toLocaleDateString('id-ID')}</p>
              <p className="font-bold">Kepala Bagian SDM & Kepegawaian</p>
              <div className="h-20" />
              <p className="font-bold underline">( Administrator Kepegawaian STIMI )</p>
              <p className="text-[11px] text-slate-500">No. ID: ADMIN001</p>
            </div>
          </div>
        </div>
      )}

        {/* 5. TAB 2: RINCIAN PERORANGAN (BUKU PRESENSI 1 SDM PER BULAN) */}
        {activeTab === 'RINCIAN_PERORANGAN' && currentIndividual && (
          <div className="p-3.5 sm:p-5 space-y-4">
            {/* Toolbar Pemilih Pegawai & Aksi */}
            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print-hidden print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 shrink-0">Pilih Pegawai:</span>
                </div>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer w-full sm:min-w-[260px] shadow-2xs"
                >
                  {individualReports.map((emp) => (
                    <option key={emp.userId} value={emp.userId}>
                      {emp.name} ({emp.nip}) - {emp.jabatan}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleExportExcelIndividual}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ekspor Excel</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="sm:hidden">Cetak PDF</span>
                  <span className="hidden sm:inline">Cetak Lembar Individu</span>
                </button>
              </div>
            </div>

            {/* Kop Surat STIMI (Tampil Utuh di Desktop & Cetak PDF, Disederhanakan di Ponsel) */}
            <div className="hidden sm:flex items-center justify-center gap-5 pb-5 border-b-2 border-slate-900 print:flex">
              <div className="relative w-16 h-16 shrink-0">
                <Image
                  src="/logo.png"
                  alt="Logo STIMI Makassar"
                  width={64}
                  height={64}
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="text-center">
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-slate-900">
                  SEKOLAH TINGGI ILMU MANAJEMEN INDONESIA (STIMI) YAPMI MAKASSAR
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">{campusSetting.address}</p>
                <div className="mt-2 pt-2 border-t border-slate-300">
                  <h3 className="text-sm font-extrabold uppercase text-slate-900 tracking-tight">
                    Lembar Catatan Presensi Individu Pegawai (Buku Presensi)
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Periode: Bulan <strong>{monthNames[filterMonth - 1]} {filterYear}</strong> • Pola 5 Hari Kerja (Senin–Kamis WFO, Jumat WFA)
                  </p>
                </div>
              </div>
            </div>

            {/* Baris Info Ringkas Layar Ponsel Tab 2 */}
            <div className="sm:hidden flex items-center justify-between pb-2 border-b border-slate-100 text-[11px] font-semibold text-slate-600 print:hidden">
              <span className="text-slate-800 font-bold">Buku Presensi Pegawai</span>
              <span className="text-slate-500 font-mono">{monthNames[filterMonth - 1]} {filterYear}</span>
            </div>

            {/* Kartu Profil Pegawai Terpilih */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky-50/70 via-white to-sky-50/30 border border-sky-100 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-lg shadow-2xs">
                    {currentIndividual.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">
                        {currentIndividual.name}
                      </h3>
                      <span className="font-mono text-xs px-2 py-0.5 bg-sky-50 text-sky-800 rounded-md border border-sky-200 font-bold">
                        NIP: {currentIndividual.nip}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {currentIndividual.jabatan} • {currentIndividual.unitKerja}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-sky-700 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-sky-500" />
                        {currentIndividual.lokasiPenugasan}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white border border-sky-200/90 shadow-2xs text-[11px] font-semibold text-slate-700 space-y-0.5">
                  <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    Ketentuan Jam Kerja:
                  </div>
                  <div className="font-mono font-bold text-sky-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>{currentIndividual.scheduleName} ({currentIndividual.scheduleDetails})</span>
                  </div>
                </div>
              </div>

              {/* 6 Mini Kartu Statistik Pribadi Pegawai */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                <div className="p-3 bg-white rounded-xl border border-sky-200/80 shadow-2xs space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
                    % Kehadiran
                  </span>
                  <p className="font-mono text-lg font-black text-sky-950 tabular-nums">
                    {currentIndividual.stats.persentaseKehadiran}%
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {currentIndividual.stats.totalHadir} / {currentIndividual.stats.hariKerjaEfektif} Hari Hadir
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-blue-200/80 shadow-2xs space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                    Total Jam Kerja
                  </span>
                  <p className="font-mono text-lg font-black text-blue-950 tabular-nums">
                    {currentIndividual.stats.totalWorkHoursDisplay}
                  </p>
                  <p className="text-[10px] text-slate-500">Akumulasi Efektif</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Tepat Waktu
                  </span>
                  <p className="font-mono text-lg font-black text-emerald-700 tabular-nums">
                    {currentIndividual.stats.tepatWaktu}{' '}
                    <span className="text-xs font-normal text-slate-500">Hari</span>
                  </p>
                  <p className="text-[10px] text-emerald-600">Presensi Disiplin</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                    Terlambat
                  </span>
                  <p className="font-mono text-lg font-black text-amber-800 tabular-nums">
                    {currentIndividual.stats.terlambat}{' '}
                    <span className="text-xs font-normal text-slate-500">Hari</span>
                  </p>
                  <p className="text-[10px] text-amber-700 font-medium">
                    +{currentIndividual.stats.totalLateMinutes} mnt total
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-indigo-200/80 shadow-2xs space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                    Izin / Cuti
                  </span>
                  <p className="font-mono text-lg font-black text-indigo-700 tabular-nums">
                    {currentIndividual.stats.izinCutiSakit}{' '}
                    <span className="text-xs font-normal text-slate-500">Hari</span>
                  </p>
                  <p className="text-[10px] text-slate-500">Disetujui Atasan</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-rose-200/80 shadow-2xs space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                    Alfa (Mangkir)
                  </span>
                  <p className="font-mono text-lg font-black text-rose-600 tabular-nums">
                    {currentIndividual.stats.alfa}{' '}
                    <span className="text-xs font-normal text-slate-500">Hari</span>
                  </p>
                  <p className="text-[10px] text-slate-400">Tanpa Keterangan</p>
                </div>
              </div>
            </div>

            {/* Tampilan Desktop: Tabel Log Presensi Harian Efektif (Senin s/d Jumat) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-y-2 border-slate-300">
                    <th className="py-2.5 px-2.5 font-bold text-center w-8">No</th>
                    <th className="py-2.5 px-3 font-bold w-44">Hari & Tanggal</th>
                    <th className="py-2.5 px-3 font-bold">Status / Mode Kerja</th>
                    <th className="py-2.5 px-3 font-bold">Presensi Masuk</th>
                    <th className="py-2.5 px-3 font-bold">Presensi Pulang</th>
                    <th className="py-2.5 px-2.5 font-bold text-center w-32">Durasi Kerja</th>
                    <th className="py-2.5 px-3 font-bold">Lokasi / Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {currentIndividual.dailyLogs.map((log) => {
                    const isToday = log.isToday;
                    return (
                      <tr
                        key={log.no}
                        className={`transition-colors ${
                          isToday
                            ? 'bg-sky-50/70 font-semibold border-l-4 border-l-sky-500'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-2.5 px-2.5 text-center font-mono font-medium">
                          {log.no}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{log.dateDisplay}</span>
                            {isToday && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-sky-200 text-sky-900 font-bold uppercase">
                                Hari Ini
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {log.statusType === 'HADIR_WFO' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              <Building className="w-3 h-3 text-slate-500" />
                              WFO Kampus
                            </span>
                          ) : log.statusType === 'HADIR_WFA' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                              <MapPin className="w-3 h-3 text-sky-600" />
                              WFA (Jumat)
                            </span>
                          ) : log.statusType === 'DINAS_LUAR' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              <Briefcase className="w-3 h-3 text-indigo-600" />
                              Dinas Luar Kota
                            </span>
                          ) : log.statusType === 'IZIN_CUTI' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                              <FileText className="w-3 h-3 text-purple-600" />
                              {log.statusLabel}
                            </span>
                          ) : log.statusType === 'ALFA' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <UserX className="w-3 h-3 text-rose-600" />
                              Alfa (Mangkir)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-400">
                              <Calendar className="w-3 h-3" />
                              Masa Mendatang
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {log.clockInTime ? (
                            <div className="space-y-0.5">
                              <span className="font-mono font-bold text-slate-900 block tabular-nums">
                                {log.clockInTime}
                              </span>
                              {log.clockInStatus === 'TEPAT_WAKTU' && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/70">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Tepat Waktu
                                </span>
                              )}
                              {log.clockInStatus === 'TERLAMBAT' && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/70">
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                  {log.clockInStatusLabel}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {log.clockOutTime ? (
                            <div className="space-y-0.5">
                              <span className="font-mono font-bold text-slate-900 block tabular-nums">
                                {log.clockOutTime}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                {log.clockOutStatusLabel}
                              </span>
                            </div>
                          ) : log.clockInTime && log.isPastOrToday && !isToday ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/70">
                              Tidak Absen Pulang
                            </span>
                          ) : log.clockInTime && isToday ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-sky-700 font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/70">
                              Sedang Bekerja
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono font-semibold text-slate-800 tabular-nums">
                          {log.durationDisplay}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <div className="space-y-0.5 max-w-[200px]">
                            <p className="truncate text-slate-800 font-medium">
                              {log.locationDisplay}
                            </p>
                            {log.note && (
                              <p className="text-[10.5px] text-slate-500 italic truncate" title={log.note}>
                                Catatan: &quot;{log.note}&quot;
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tampilan Mobile: Timeline Cards Harian (Satu Tangan di Ponsel) */}
            <div className="block md:hidden space-y-2.5 print:hidden">
              <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between px-1">
                <span>Catatan Presensi Harian ({currentIndividual.dailyLogs.length} Hari Kerja)</span>
                <span className="text-slate-400 font-mono text-[10px]">WITA (Makassar)</span>
              </div>

              {currentIndividual.dailyLogs.map((log) => {
                const isToday = log.isToday;
                return (
                  <div
                    key={`mob-day-${log.no}`}
                    className={`p-3 rounded-2xl border transition shadow-2xs space-y-2 ${
                      isToday
                        ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-500/20'
                        : log.statusType === 'ALFA'
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-white border-slate-200/90'
                    }`}
                  >
                    {/* Header Card Harian: No + Tanggal + Badge Hari Ini + Badge Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {log.no}
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {log.dateDisplay}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.2 rounded text-[8.5px] bg-sky-200 text-sky-900 font-black uppercase tracking-wider shrink-0">
                              Hari Ini
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {log.statusType === 'HADIR_WFO' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Building className="w-2.5 h-2.5 text-emerald-600" />
                            WFO
                          </span>
                        ) : log.statusType === 'HADIR_WFA' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                            <MapPin className="w-2.5 h-2.5 text-sky-600" />
                            WFA
                          </span>
                        ) : log.statusType === 'DINAS_LUAR' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                            <Briefcase className="w-2.5 h-2.5 text-indigo-600" />
                            Dinas Luar
                          </span>
                        ) : log.statusType === 'IZIN_CUTI' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                            <FileText className="w-2.5 h-2.5 text-purple-600" />
                            {log.statusLabel}
                          </span>
                        ) : log.statusType === 'ALFA' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                            <UserX className="w-2.5 h-2.5 text-rose-600" />
                            Alfa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-400">
                            <Calendar className="w-2.5 h-2.5" />
                            Mendatang
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Body: Grid Jam Masuk & Pulang */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Presensi Masuk */}
                      <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                          Masuk
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900 text-xs tabular-nums">
                            {log.clockInTime || '-'}
                          </span>
                          {log.clockInStatus === 'TEPAT_WAKTU' && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">
                              Tepat
                            </span>
                          )}
                          {log.clockInStatus === 'TERLAMBAT' && (
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1 py-0.2 rounded border border-amber-200/60">
                              {log.clockInStatusLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Presensi Pulang */}
                      <div className="p-2 rounded-xl bg-slate-50/70 border border-slate-100 space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                          Pulang
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900 text-xs tabular-nums">
                            {log.clockOutTime || '-'}
                          </span>
                          {log.clockOutTime ? (
                            <span className="text-[9px] font-medium text-slate-600 bg-slate-100 px-1 py-0.2 rounded">
                              {log.clockOutStatusLabel}
                            </span>
                          ) : log.clockInTime && isToday ? (
                            <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-1 py-0.2 rounded">
                              Sedang Kerja
                            </span>
                          ) : log.clockInTime ? (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded">
                              Tdk Pulang
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Footer Card Harian: Durasi & Lokasi / Catatan */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10.5px] text-slate-500">
                      <span className="flex items-center gap-1 font-mono font-semibold text-slate-700">
                        <Clock className="w-3 h-3 text-sky-600" />
                        <span>Durasi: {log.durationDisplay}</span>
                      </span>
                      <span className="truncate max-w-[170px] text-slate-600 font-medium" title={log.locationDisplay}>
                        📍 {log.locationDisplay}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tanda Tangan Pengesahan Individual (Siap Cetak / Desktop) */}
            <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 hidden sm:flex print:flex justify-between text-xs text-slate-800 break-inside-avoid">
              <div className="text-center w-64">
                <p>Pegawai Yang Bersangkutan,</p>
                <div className="h-20" />
                <p className="font-bold underline">( {currentIndividual.name} )</p>
                <p className="text-[11px] text-slate-500">NIP. {currentIndividual.nip}</p>
              </div>

              <div className="text-center w-64">
                <p>Makassar, {new Date().toLocaleDateString('id-ID')}</p>
                <p className="font-bold">Kepala Bagian SDM & Kepegawaian</p>
                <div className="h-20" />
                <p className="font-bold underline">( Administrator Kepegawaian STIMI )</p>
                <p className="text-[11px] text-slate-500">No. ID: ADMIN001</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
