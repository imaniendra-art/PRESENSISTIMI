'use client';

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
} from 'lucide-react';
import { CampusSetting } from '@prisma/client';

export interface ReportSummaryRow {
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
  kpiStats: KpiStats;
  selectedMonth: number;
  selectedYear: number;
}

export function ReportGenerator({
  campusSetting,
  reportData,
  dailyLogs,
  kpiStats,
  selectedMonth,
  selectedYear,
}: ReportGeneratorProps) {
  const router = useRouter();
  const filterMonth = selectedMonth;
  const filterYear = selectedYear;

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

  // Ekspor Excel Multi-Sheet Komprehensif
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    // SHEET 1: REKAPITULASI BULANAN SEMUA PEGAWAI
    const summaryRows = reportData.map((row, idx) => ({
      No: idx + 1,
      'No. ID': row.nip,
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
      { wch: 5 },  // No
      { wch: 12 }, // NIP
      { wch: 30 }, // Nama
      { wch: 25 }, // Jabatan
      { wch: 25 }, // Unit Kerja
      { wch: 25 }, // Lokasi
      { wch: 18 }, // Hari Kerja
      { wch: 12 }, // Total Hadir
      { wch: 24 }, // Hadir WFO
      { wch: 18 }, // Hadir WFA
      { wch: 14 }, // Tepat Waktu
      { wch: 12 }, // Terlambat
      { wch: 14 }, // Pulang Cepat
      { wch: 12 }, // Dinas Luar
      { wch: 20 }, // Izin/Cuti/Sakit
      { wch: 22 }, // Alfa
      { wch: 22 }, // % Kehadiran
    ];

    XLSX.utils.book_append_sheet(workbook, worksheetSummary, 'Rekap Bulanan Pegawai');

    // SHEET 2: LOG RINCIAN PRESENSI HARIAN
    const dailyRows = dailyLogs.map((log) => ({
      No: log.no,
      Tanggal: log.tanggal,
      Hari: log.hari,
      'Mode Kerja': log.modeKerja,
      'No. ID': log.nip,
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
      { wch: 5 },  // No
      { wch: 14 }, // Tanggal
      { wch: 10 }, // Hari
      { wch: 22 }, // Mode Kerja
      { wch: 12 }, // NIP
      { wch: 30 }, // Nama
      { wch: 25 }, // Unit Kerja
      { wch: 18 }, // Jam Masuk
      { wch: 15 }, // Status Masuk
      { wch: 18 }, // Jam Pulang
      { wch: 15 }, // Status Pulang
      { wch: 20 }, // Durasi Kerja
      { wch: 28 }, // Lokasi
    ];

    XLSX.utils.book_append_sheet(workbook, worksheetDaily, 'Log Presensi Harian');

    const fileName = `Rekap_Presensi_Lengkap_STIMI_${monthNames[filterMonth - 1]}_${filterYear}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* CSS Khusus Mode Cetak A4 Landscape & Print Optimization */}
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

      {/* Panel Kontrol & Filter Interaktif (Disembunyikan saat cetak) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4 print-hidden print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Laporan Periode: {monthNames[filterMonth - 1]} {filterYear}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold font-mono border border-sky-200">
                  {reportData.length} Pegawai
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                  {kpiStats.effectiveWorkingDays} Hari Kerja Efektif
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Format lengkap multi-sheet (Rekap Bulanan + Log Harian) sesuai pola 5 Hari Kerja (Senin-Kamis WFO, Jumat WFA)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx Multi-Sheet)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-sky-600/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF Landscape</span>
            </button>
          </div>
        </div>

        {/* Pemilih Periode Bulan & Tahun Interaktif */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Pilih Periode Laporan:</span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handlePeriodChange(10, 2026)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterMonth === 10 && filterYear === 2026
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Oktober 2026
            </button>

            <button
              type="button"
              onClick={() => handlePeriodChange(11, 2026)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterMonth === 11 && filterYear === 2026
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              November 2026 (Bulan Ini)
            </button>

            {/* Dropdown Bulan */}
            <select
              value={filterMonth}
              onChange={(e) => handlePeriodChange(parseInt(e.target.value), filterYear)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
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
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ringkasan Kartu Metrik KPI Institusi (Tampil di Layar Monitor Saja, Sembunyi Saat Cetak) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 print-hidden print:hidden">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold">
            <Users className="w-3.5 h-3.5 text-sky-600" />
            <span>Total Pegawai</span>
          </div>
          <p className="font-mono text-xl font-extrabold text-slate-900 mt-1">
            {kpiStats.totalPegawai} <span className="text-xs font-normal text-slate-500">Orang</span>
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rata-rata Kehadiran</span>
          </div>
          <p className="font-mono text-xl font-extrabold text-emerald-600 mt-1">
            {kpiStats.avgKehadiran}%
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold">
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span>Hadir WFO / WFA</span>
          </div>
          <p className="font-mono text-xl font-extrabold text-slate-900 mt-1">
            {kpiStats.totalHadirWfo}{' '}
            <span className="text-xs font-bold text-sky-600">/ {kpiStats.totalHadirWfa}</span>
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Terlambat / Plg Cpt</span>
          </div>
          <p className="font-mono text-xl font-extrabold text-amber-700 mt-1">
            {kpiStats.totalTerlambat}{' '}
            <span className="text-xs font-normal text-slate-400">/ {kpiStats.totalPulangCepat}</span>
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Izin / Cuti / Sakit</span>
          </div>
          <p className="font-mono text-xl font-extrabold text-indigo-700 mt-1">
            {kpiStats.totalIzinCuti} <span className="text-xs font-normal text-slate-400">Hari</span>
          </p>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold">
            <UserX className="w-3.5 h-3.5 text-rose-600" />
            <span>Alfa (Mangkir)</span>
          </div>
          <p className="font-mono text-xl font-extrabold text-rose-600 mt-1">
            {kpiStats.totalAlfa} <span className="text-xs font-normal text-slate-400">Hari</span>
          </p>
        </div>
      </div>

      {/* Dokumen Formal Rekapitulasi (Siap Cetak / Print Ready Landscape) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 print-landscape-container print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
        {/* Kop Surat Resmi Institusi STIMI */}
        <div className="flex items-center justify-center gap-5 pb-5 border-b-2 border-slate-900 mb-6">
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
                Laporan Rekapitulasi Kehadiran Dosen & Tenaga Kependidikan
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Periode: Bulan <strong>{monthNames[filterMonth - 1]} {filterYear}</strong> • Pola 5 Hari Kerja (Senin–Kamis WFO, Jumat WFA)
                {kpiStats.isCurrentMonth && (
                  <span className="italic text-slate-500"> (Dihitung berjalan s/d hari ini: {kpiStats.effectiveWorkingDays} hari kerja)</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tabel Rekapitulasi Komprehensif */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-y-2 border-slate-300">
                <th className="py-2.5 px-2.5 font-bold text-center w-8">No</th>
                <th className="py-2.5 px-2.5 font-bold">No. ID</th>
                <th className="py-2.5 px-2.5 font-bold">Nama Pegawai</th>
                <th className="py-2.5 px-2.5 font-bold">Jabatan</th>
                <th className="py-2.5 px-2.5 font-bold">Unit Kerja</th>
                <th className="py-2.5 px-2 font-bold text-center bg-slate-200/70" title="Hari Kerja Efektif">
                  Hari Kerja
                </th>
                <th className="py-2.5 px-2 font-bold text-center text-sky-800" title="Total Hadir Fisik & WFA">
                  Total Hadir
                </th>
                <th className="py-2.5 px-2 font-bold text-center" title="Hadir WFO di Kampus (Senin-Kamis)">
                  WFO
                </th>
                <th className="py-2.5 px-2 font-bold text-center" title="Hadir WFA (Jumat)">
                  WFA
                </th>
                <th className="py-2.5 px-2 font-bold text-center text-emerald-700">Tepat Waktu</th>
                <th className="py-2.5 px-2 font-bold text-center text-amber-700">Terlambat</th>
                <th className="py-2.5 px-2 font-bold text-center text-amber-800">Plg Cepat</th>
                <th className="py-2.5 px-2 font-bold text-center text-indigo-700">Dinas Luar</th>
                <th className="py-2.5 px-2 font-bold text-center text-purple-700" title="Izin, Cuti Tahunan, dan Sakit">
                  Izin/Cuti
                </th>
                <th className="py-2.5 px-2 font-bold text-center text-rose-700" title="Alfa / Tanpa Keterangan">
                  Alfa
                </th>
                <th className="py-2.5 px-2.5 font-bold text-center bg-sky-100/70 text-sky-900">
                  % Hadir
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {reportData.map((row, idx) => (
                <tr key={row.nip} className="hover:bg-slate-50 print:hover:bg-transparent">
                  <td className="py-2 px-2 text-center font-medium">{idx + 1}</td>
                  <td className="py-2 px-2 font-mono font-medium">{row.nip}</td>
                  <td className="py-2 px-2 font-bold text-slate-900">{row.name}</td>
                  <td className="py-2 px-2 text-slate-600 truncate max-w-[150px]">{row.jabatan}</td>
                  <td className="py-2 px-2 text-slate-600 truncate max-w-[150px]">{row.unitKerja}</td>
                  <td className="py-2 px-2 text-center font-mono font-semibold bg-slate-50">
                    {row.hariKerjaEfektif}
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-bold text-sky-800">
                    {row.totalHadir}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-slate-700">
                    {row.hadirWfo}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-slate-700">
                    {row.hadirWfa}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-emerald-700 font-medium">
                    {row.tepatWaktu}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-amber-700 font-medium">
                    {row.terlambat > 0 ? (
                      <span className="text-amber-800 font-bold">{row.terlambat}</span>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-amber-800 font-medium">
                    {row.pulangCepat > 0 ? row.pulangCepat : '0'}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-indigo-700 font-medium">
                    {row.dinasLuar > 0 ? row.dinasLuar : '0'}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-purple-700 font-medium">
                    {row.izinCutiSakit > 0 ? row.izinCutiSakit : '0'}
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-bold">
                    {row.alfa > 0 ? (
                      <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        {row.alfa}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-2 px-2.5 text-center font-mono font-black bg-sky-50 text-sky-950 tabular-nums">
                    {row.persentaseKehadiran}%
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Baris Total & Rata-rata Institusi */}
            <tfoot>
              <tr className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300">
                <td colSpan={5} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                  Rata-rata / Total Keseluruhan:
                </td>
                <td className="py-2.5 px-2 text-center font-mono">{kpiStats.effectiveWorkingDays}</td>
                <td className="py-2.5 px-2 text-center font-mono text-sky-900">
                  {kpiStats.totalHadirWfo + kpiStats.totalHadirWfa}
                </td>
                <td className="py-2.5 px-2 text-center font-mono">{kpiStats.totalHadirWfo}</td>
                <td className="py-2.5 px-2 text-center font-mono">{kpiStats.totalHadirWfa}</td>
                <td className="py-2.5 px-2 text-center font-mono text-emerald-800">
                  {reportData.reduce((acc, r) => acc + r.tepatWaktu, 0)}
                </td>
                <td className="py-2.5 px-2 text-center font-mono text-amber-800">
                  {kpiStats.totalTerlambat}
                </td>
                <td className="py-2.5 px-2 text-center font-mono text-amber-800">
                  {kpiStats.totalPulangCepat}
                </td>
                <td className="py-2.5 px-2 text-center font-mono text-indigo-800">
                  {reportData.reduce((acc, r) => acc + r.dinasLuar, 0)}
                </td>
                <td className="py-2.5 px-2 text-center font-mono text-purple-800">
                  {kpiStats.totalIzinCuti}
                </td>
                <td className="py-2.5 px-2 text-center font-mono text-rose-800">
                  {kpiStats.totalAlfa}
                </td>
                <td className="py-2.5 px-2.5 text-center font-mono text-sky-950 bg-sky-200/60 font-black">
                  {kpiStats.avgKehadiran}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Tanda Tangan Pengesahan (Siap Cetak) */}
        <div className="mt-12 pt-6 flex justify-between text-xs text-slate-800 break-inside-avoid">
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
    </div>
  );
}
