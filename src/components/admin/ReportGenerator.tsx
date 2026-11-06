'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
} from 'lucide-react';
import { CampusSetting } from '@prisma/client';

interface ReportRow {
  nip: string;
  name: string;
  jabatan: string;
  unitKerja: string;
  lokasiPenugasan?: string;
  totalHadir: number;
  tepatWaktu: number;
  terlambat: number;
  dinasLuar: number;
}

interface ReportGeneratorProps {
  campusSetting: CampusSetting;
  reportData: ReportRow[];
  selectedMonth: number;
  selectedYear: number;
}

export function ReportGenerator({
  campusSetting,
  reportData,
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

  const handleExportExcel = () => {
    const dataForSheet = reportData.map((row, idx) => ({
      No: idx + 1,
      NIP: row.nip,
      'Nama Pegawai': row.name,
      Jabatan: row.jabatan,
      'Unit Kerja': row.unitKerja,
      'Lokasi Penugasan': row.lokasiPenugasan || 'Semua Gedung (Fleksibel)',
      'Total Kehadiran': row.totalHadir,
      'Tepat Waktu': row.tepatWaktu,
      Terlambat: row.terlambat,
      'Dinas Luar': row.dinasLuar,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Kehadiran');

    const fileName = `Rekap_Presensi_STIMI_${monthNames[filterMonth - 1]}_${filterYear}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Panel Kontrol & Filter Interaktif (Disembunyikan saat mode cetak) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4 print:hidden">
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
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekapitulasi kehadiran dosen dan staf STIMI Makassar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-sky-600/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
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
            {/* Quick Switcher Buttons */}
            <button
              type="button"
              onClick={() => handlePeriodChange(10, 2026)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterMonth === 10 && filterYear === 2026
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Oktober 2026 (Bulan Kemarin)
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

      {/* Dokumen Formal Rekapitulasi (Siap Cetak / Print Ready) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 print:p-0 print:border-none print:shadow-none">
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
            <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide text-slate-900">
              {campusSetting.campusName}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">{campusSetting.address}</p>
            <div className="mt-2 pt-2 border-t border-slate-300">
              <h3 className="text-sm font-bold uppercase text-slate-800">
                Laporan Rekapitulasi Kehadiran Pegawai & Dosen
              </h3>
              <p className="text-xs text-slate-600">
                Periode Bulan: {monthNames[filterMonth - 1]} {filterYear}
              </p>
            </div>
          </div>
        </div>

        {/* Tabel Rekapitulasi */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-y border-slate-300">
                <th className="py-2.5 px-3 font-bold text-center w-10">No</th>
                <th className="py-2.5 px-3 font-bold">NIP</th>
                <th className="py-2.5 px-3 font-bold">Nama Pegawai</th>
                <th className="py-2.5 px-3 font-bold">Jabatan</th>
                <th className="py-2.5 px-3 font-bold">Unit Kerja</th>
                <th className="py-2.5 px-3 font-bold">Lokasi Penugasan</th>
                <th className="py-2.5 px-3 font-bold text-center">Total Hadir</th>
                <th className="py-2.5 px-3 font-bold text-center">Tepat Waktu</th>
                <th className="py-2.5 px-3 font-bold text-center">Terlambat</th>
                <th className="py-2.5 px-3 font-bold text-center">Dinas Luar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {reportData.map((row, idx) => (
                <tr key={row.nip} className="hover:bg-slate-50 print:hover:bg-transparent">
                  <td className="py-2.5 px-3 text-center font-medium">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-mono font-medium">{row.nip}</td>
                  <td className="py-2.5 px-3 font-bold">{row.name}</td>
                  <td className="py-2.5 px-3">{row.jabatan}</td>
                  <td className="py-2.5 px-3">{row.unitKerja}</td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <span className="font-medium text-slate-800">{row.lokasiPenugasan}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                    {row.totalHadir}
                  </td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-semibold">
                    {row.tepatWaktu}
                  </td>
                  <td className="py-2.5 px-3 text-center text-rose-700 font-semibold">
                    {row.terlambat}
                  </td>
                  <td className="py-2.5 px-3 text-center text-amber-700 font-semibold">
                    {row.dinasLuar}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan Pengesahan (Muncul saat cetak / di bawah dokumen) */}
        <div className="mt-12 pt-6 flex justify-between text-xs text-slate-800 break-inside-avoid">
          <div className="text-center w-60">
            <p>Mengetahui,</p>
            <p className="font-bold">Ketua STIMI Makassar</p>
            <div className="h-20" />
            <p className="font-bold underline">( .................................................... )</p>
            <p className="text-[11px] text-slate-500">NIDN. ........................................</p>
          </div>

          <div className="text-center w-60">
            <p>Makassar, {new Date().toLocaleDateString('id-ID')}</p>
            <p className="font-bold">Kepala Bagian SDM & Kepegawaian</p>
            <div className="h-20" />
            <p className="font-bold underline">( Administrator Kepegawaian STIMI )</p>
            <p className="text-[11px] text-slate-500">NIP. ADMIN001</p>
          </div>
        </div>
      </div>
    </div>
  );
}
