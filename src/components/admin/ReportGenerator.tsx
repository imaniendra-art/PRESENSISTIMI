'use client';

import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { CampusSetting } from '@prisma/client';

interface ReportRow {
  nip: string;
  name: string;
  jabatan: string;
  unitKerja: string;
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

  const handleExportExcel = () => {
    const dataForSheet = reportData.map((row, idx) => ({
      No: idx + 1,
      NIP: row.nip,
      'Nama Pegawai': row.name,
      Jabatan: row.jabatan,
      'Unit Kerja': row.unitKerja,
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
      {/* Panel Kontrol & Filter (Disembunyikan saat mode cetak print) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Laporan Periode: {monthNames[filterMonth - 1]} {filterYear}
            </h2>
            <p className="text-[11px] text-slate-500">
              Total {reportData.length} pegawai dan dosen terdata dalam rekapitulasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-200"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPDF}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-200"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Dokumen Formal Rekapitulasi (Siap Cetak / Print Ready) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 print:p-0 print:border-none print:shadow-none">
        {/* Kop Surat Resmi Institusi STIMI */}
        <div className="text-center pb-5 border-b-2 border-slate-900 mb-6">
          <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide text-slate-900">
            {campusSetting.campusName}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">{campusSetting.address}</p>
          <div className="mt-3 pt-2 border-t border-slate-300">
            <h3 className="text-sm font-bold uppercase text-slate-800">
              Laporan Rekapitulasi Kehadiran Pegawai & Dosen
            </h3>
            <p className="text-xs text-slate-600">
              Periode Bulan: {monthNames[filterMonth - 1]} {filterYear}
            </p>
          </div>
        </div>

        {/* Tabel Rekapitulasi */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-y border-slate-300">
                <th className="py-2.5 px-3 font-bold text-center w-12">No</th>
                <th className="py-2.5 px-3 font-bold">NIP</th>
                <th className="py-2.5 px-3 font-bold">Nama Pegawai</th>
                <th className="py-2.5 px-3 font-bold">Jabatan</th>
                <th className="py-2.5 px-3 font-bold">Unit Kerja</th>
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
