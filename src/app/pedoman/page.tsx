'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Printer,
  Download,
  BookOpen,
  Smartphone,
  Camera,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Users,
  Settings,
  FileSpreadsheet,
  FileText,
  Building,
  Key,
} from 'lucide-react';

export default function PedomanPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'bab1' | 'bab2' | 'bab3' | 'bab4' | 'bab5'>('all');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased print:bg-white print:text-black">
      {/* Top Action Bar (Tersembunyi saat Cetak/Print) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/profil"
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold transition cursor-pointer"
              title="Kembali ke Halaman Profil"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-none">
                Buku Pedoman Penggunaan
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">
                PRESENSISTIMI • Edisi Resmi Versi 1.4.3
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/pedoman/download"
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer"
              title="Unduh berkas dokumen pedoman format Markdown (.md)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Unduh Berkas (.md)</span>
            </a>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition cursor-pointer"
              title="Cetak langsung atau simpan sebagai dokumen PDF A4"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Tab Bab (Khusus di Layar) */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 flex items-center gap-1 overflow-x-auto py-2 text-xs font-semibold scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua Bab
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bab1')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'bab1'
                ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bab I: Ketentuan & PWA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bab2')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'bab2'
                ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bab II: Panduan Pegawai & Dosen
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bab3')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'bab3'
                ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bab III: Panduan Atasan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bab4')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'bab4'
                ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bab IV: Panduan Admin SDM
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bab5')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              activeTab === 'bab5'
                ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bab V: FAQ & Solusi Kendala
          </button>
        </div>
      </header>

      {/* Main Container Dokumen */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0 print:max-w-none">
        {/* Kop Dokumen Resmi STIMI */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm text-center print:border-none print:shadow-none print:p-0">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 relative shrink-0">
              <Image
                src="/logo.png"
                alt="Logo STIMI Makassar"
                width={64}
                height={64}
                priority
                className="object-contain"
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                YAYASAN PENDIDIKAN MANAJEMEN INDONESIA
              </p>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                SEKOLAH TINGGI ILMU MANAJEMEN INDONESIA (STIMI) MAKASSAR
              </h2>
              <p className="text-[11px] text-slate-500">
                Jl. Perintis Kemerdekaan KM. 9, Tamalanrea, Makassar, Sulawesi Selatan
              </p>
            </div>
          </div>
          <div className="border-b-2 border-slate-900 my-4" />
          <div className="border-b border-slate-400 -mt-3.5 mb-6" />

          <div className="inline-block px-4 py-1.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2 print:border-slate-400">
            DOKUMEN RESMI PANDUAN OPERASIONAL KEPEGAWAIAN
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            BUKU PEDOMAN PENGGUNAAN SISTEM PRESENSI ELEKTRONIK (PRESENSISTIMI)
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Berlaku untuk Dosen, Tenaga Kependidikan, Pejabat Penilai, dan Administrator SDM
          </p>
        </div>

        {/* ======================================================== */}
        {/* BAB I: PENDAHULUAN & KETENTUAN UMUM                      */}
        {/* ======================================================== */}
        {(activeTab === 'all' || activeTab === 'bab1') && (
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-5 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">BAB I</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Pendahuluan & Ketentuan Jam Kerja Institusi
                </h3>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
              <p>
                <strong>PRESENSISTIMI</strong> adalah platform kehadiran elektronik terpadu yang memadukan verifikasi 
                <strong> Geofencing GPS Real-Time (Formula Haversine)</strong> dan <strong>Kamera Selfie Langsung (Anti-Galeri)</strong> 
                guna menjamin integritas data kehadiran civitas akademika STIMI Makassar secara transparan.
              </p>

              {/* Tabel Pola Kerja */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200">
                  Tabel Pola Kerja Resmi STIMI Makassar
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                        <th className="py-2.5 px-3 font-semibold">Hari Kerja</th>
                        <th className="py-2.5 px-3 font-semibold">Mode Kerja</th>
                        <th className="py-2.5 px-3 font-semibold">Jam Masuk</th>
                        <th className="py-2.5 px-3 font-semibold">Jam Pulang</th>
                        <th className="py-2.5 px-3 font-semibold">Toleransi</th>
                        <th className="py-2.5 px-3 font-semibold">Lokasi Presensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-slate-900">Senin - Kamis</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">WFO</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">08:00 WITA</td>
                        <td className="py-2.5 px-3 font-mono">16:30 WITA</td>
                        <td className="py-2.5 px-3 text-slate-500">Maks. 15 Menit (s/d 08:15)</td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">Radius Gedung Kampus STIMI</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-slate-900">Jumat</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">WFA</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono">08:00 WITA</td>
                        <td className="py-2.5 px-3 font-mono">16:30 WITA</td>
                        <td className="py-2.5 px-3 text-slate-500">Maks. 15 Menit (s/d 08:15)</td>
                        <td className="py-2.5 px-3 font-medium text-emerald-700">Fleksibel (Di Mana Saja)</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-500">Sabtu - Minggu</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-bold text-[10px]">LIBUR</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">-</td>
                        <td className="py-2.5 px-3 text-slate-400">-</td>
                        <td className="py-2.5 px-3 text-slate-400">-</td>
                        <td className="py-2.5 px-3 text-slate-400">Hari Libur Rutin</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Panduan PWA */}
              <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 text-sky-800 font-bold text-xs sm:text-sm mb-2">
                  <Smartphone className="w-4 h-4 text-sky-600" />
                  <span>Panduan Pasang Aplikasi di Layar Utama HP (Install PWA)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="bg-white p-3.5 rounded-xl border border-sky-100">
                    <p className="font-bold text-slate-900 mb-1">Android (Google Chrome):</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600">
                      <li>Buka web presensi di Chrome.</li>
                      <li>Ketuk ikon titik tiga (⋮) di pojok kanan atas.</li>
                      <li>Pilih menu <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                      <li>Ikon PRESENSISTIMI akan terpasang di HP Anda.</li>
                    </ol>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-sky-100">
                    <p className="font-bold text-slate-900 mb-1">iPhone / iOS (Safari):</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600">
                      <li>Buka web presensi di browser Safari (wajib Safari).</li>
                      <li>Ketuk tombol <strong>Bagikan (Share)</strong> di bagian bawah.</li>
                      <li>Pilih menu <strong>"Add to Home Screen"</strong>.</li>
                      <li>Ketuk <strong>"Add"</strong> di pojok kanan atas.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* BAB II: PANDUAN PEGAWAI & DOSEN                          */}
        {/* ======================================================== */}
        {(activeTab === 'all' || activeTab === 'bab2') && (
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-5 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">BAB II</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Panduan Dosen & Tenaga Kependidikan (Pegawai)
                </h3>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
              {/* Langkah Presensi Mandiri */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-sky-600" />
                  <span>2.1 Tata Cara Presensi Masuk & Pulang Mandiri</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  <li>Pastikan Anda telah berada di area kampus STIMI (Senin-Kamis) dan GPS ponsel telah <strong>AKTIF</strong>.</li>
                  <li>Buka aplikasi presensi dan masuk ke menu <strong>"Presensi"</strong>.</li>
                  <li>Saat peramban meminta izin, pilih <strong>"Izinkan" (Allow)</strong> untuk akses Lokasi dan Kamera.</li>
                  <li>Arahkan wajah tegak lurus menghadap kamera di area terang.</li>
                  <li>Periksa radar: Pastikan muncul status hijau bertuliskan <em>"Di Dalam Radius Kampus"</em>.</li>
                  <li>Klik tombol <strong>"Ambil Foto & Presensi Masuk"</strong> (di pagi hari) atau <strong>"Presensi Pulang"</strong> (di sore hari).</li>
                  <li>Sistem mencatat kehadiran dan menampilkan pesan sukses dalam 1-2 detik.</li>
                </ol>
              </div>

              {/* Fitur Absen Cepat */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <h4 className="font-bold text-amber-900 text-xs sm:text-sm mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>2.2 Fitur Praktis: Absen Cepat Tanpa Login (/absen-cepat)</span>
                </h4>
                <p className="text-amber-800 text-xs leading-relaxed">
                  Bagi pegawai yang terburu-buru, gunakan menu <strong>"Absen Cepat"</strong> di halaman login atau akses <code>/absen-cepat</code>.
                  Cukup ketik NIP Anda, kamera akan aktif otomatis, lalu tekan tombol presensi. Layar pas dalam 1 tampilan HP dan mereset otomatis dalam 4 detik.
                </p>
              </div>

              {/* Pengajuan Cuti & Sakit */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>2.3 Prosedur Pengajuan Cuti, Izin, Sakit & Dinas Luar</span>
                </h4>
                <ul className="list-disc list-inside space-y-1.5 pl-1">
                  <li>Buka menu <strong>"Cuti & Dinas Luar"</strong> (<code>/pegawai/pengajuan</code>).</li>
                  <li>Pilih jenis permohonan: <em>Cuti Tahunan, Izin, Sakit, atau Dinas Luar</em>.</li>
                  <li>Tentukan rentang tanggal mulai dan tanggal berakhir.</li>
                  <li>Tuliskan alasan pengajuan dan unggah foto/dokumen bukti (Surat Dokter atau Surat Tugas Dinas).</li>
                  <li>Kirim pengajuan. Atasan langsung Anda akan menerima notifikasi untuk memberikan persetujuan.</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* BAB III: PANDUAN ATASAN LANGSUNG                         */}
        {/* ======================================================== */}
        {(activeTab === 'all' || activeTab === 'bab3') && (
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-5 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">BAB III</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Panduan Pejabat Penilai / Atasan Langsung
                </h3>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
              <p>
                Pejabat Penilai (Ketua Bagian, Kepala Unit, Kaprodi, Pembantu Ketua) bertanggung jawab memverifikasi permohonan staf binaannya:
              </p>
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li>
                  Masuk ke menu <strong>"Persetujuan Tim"</strong> (<code>/atasan/approval</code>).
                </li>
                <li>
                  Daftar pengajuan berstatus <code>PENDING</code> akan ditampilkan lengkap dengan nama staf, jenis pengajuan, tanggal, alasan, dan berkas lampiran.
                </li>
                <li>
                  Klik tombol <strong>"Setujui"</strong> jika permohonan sah. Hari kerja tersebut otomatis dihitung sebagai izin/cuti resmi (bukan Alfa).
                </li>
                <li>
                  Klik tombol <strong>"Tolak"</strong> dan masukkan catatan alasan penolakan jika permohonan tidak memenuhi ketentuan.
                </li>
              </ol>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* BAB IV: PANDUAN PENGELOLA SDM / ADMIN                    */}
        {/* ======================================================== */}
        {(activeTab === 'all' || activeTab === 'bab4') && (
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-5 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">BAB IV</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Panduan Administrator Kepegawaian (HRD/SDM)
                </h3>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Import Data Pegawai Massal via Excel</span>
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Buka menu <code>/admin/pegawai</code>, klik <strong>"Unduh Template Excel"</strong>, isi NIP, Nama, Unit Kerja, dan NIP Atasan, lalu klik <strong>"Import Excel"</strong> untuk memasukkan ratusan data dalam 1 klik.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1.5 flex items-center gap-2">
                    <Building className="w-4 h-4 text-sky-600" />
                    <span>Geofencing Multi-Gedung Kampus</span>
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    Buka menu <code>/admin/pengaturan</code> untuk mengelola titik koordinat GPS beberapa gedung kampus STIMI dan mengatur radius toleransi meter.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Rekapitulasi Laporan Excel Multi-Sheet & Cetak PDF Landscape</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  Pada menu <code>/admin/laporan</code>, sistem menyediakan perhitungan otomatis cerdas (pencegahan Alfa palsu untuk tanggal yang belum tiba) serta dua opsi ekspor:
                </p>
                <ul className="list-disc list-inside text-xs space-y-1 pl-1 text-slate-600">
                  <li><strong>Ekspor Excel (.xlsx)</strong>: Menghasilkan 2 sheet (Sheet 1: Rekap Bulanan Pegawai, Sheet 2: Log Presensi Harian).</li>
                  <li><strong>Cetak PDF Landscape</strong>: Dokumen resmi A4 dengan kop surat STIMI Makassar dan tanda tangan Ketua STIMI & Kepala SDM.</li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* BAB V: FAQ & PANDUAN PEMECAHAN MASALAH                   */}
        {/* ======================================================== */}
        {(activeTab === 'all' || activeTab === 'bab5') && (
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-5 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">BAB V</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Panduan Pemecahan Masalah (Troubleshooting & FAQ)
                </h3>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Masalah GPS */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <p className="font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>1. Lokasi GPS tidak terdeteksi atau muncul peringatan "Di Luar Radius Kampus"?</span>
                </p>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-2">
                  <li>Pastikan tombol GPS / Layanan Lokasi di HP telah dinyalakan.</li>
                  <li>Buka aplikasi Google Maps sebentar agar sensor GPS HP mengunci satelit secara akurat.</li>
                  <li>Jika berada di dalam gedung bertingkat dengan sinyal lemah, sambungkan ponsel ke jaringan Wi-Fi resmi kampus STIMI.</li>
                  <li>Pastikan izin lokasi di peramban Chrome/Safari disetel ke <strong>"Izinkan" (Allow)</strong>.</li>
                </ul>
              </div>

              {/* Masalah Kamera */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <p className="font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span>2. Layar kamera hitam atau muncul teks "Izin kamera ditolak"?</span>
                </p>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pl-2">
                  <li><strong>Chrome Android</strong>: Ketuk ikon titik tiga (⋮) ➔ Setelan ➔ Setelan Situs ➔ Kamera ➔ Pastikan web STIMI diizinkan.</li>
                  <li><strong>Safari iOS (iPhone)</strong>: Buka menu Pengaturan (Settings) HP ➔ Safari ➔ Kamera ➔ ubah menjadi <em>Allow (Izinkan)</em>.</li>
                  <li>Muat ulang (refresh) halaman setelah izin diperbarui.</li>
                </ul>
              </div>

              {/* Masalah Sandi */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <p className="font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-sky-600" />
                  <span>3. Lupa kata sandi akun presensi?</span>
                </p>
                <p className="text-xs text-slate-600 pl-2">
                  Hubungi Admin SDM / Kepegawaian STIMI Makassar dengan menyebutkan NIP dan Nama Lengkap Anda. Administrator dapat melakukan reset kata sandi dalam waktu kurang dari 1 menit.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Kolom Pengesahan Dokumen Resmi */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 text-center space-y-6 print:border-none print:shadow-none print:p-0">
          <p className="text-xs text-slate-500 font-medium">
            Dokumen pedoman ini berlaku sah sebagai standar operasional kehadiran kepegawaian STIMI Makassar.
          </p>

          <div className="grid grid-cols-2 gap-8 text-xs text-slate-700 pt-4">
            <div>
              <p className="font-semibold text-slate-500">Mengetahui,</p>
              <p className="font-bold text-slate-900 mt-0.5">Ketua STIMI Makassar</p>
              <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                (Tanda Tangan & Cap Resmi)
              </div>
              <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[180px]">
                Ketua STIMI Makassar
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-500">Pengelola Sistem,</p>
              <p className="font-bold text-slate-900 mt-0.5">Kepala Bagian SDM & TI</p>
              <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                (Tanda Tangan & Cap Resmi)
              </div>
              <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[180px]">
                Kepala Bagian SDM STIMI
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
