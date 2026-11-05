# Product Requirements Document (PRD)

**Project Name**: PRESENSISTIMI  
**Version**: 1.0.0  
**Status**: Approved  
**Author**: Antigravity & Tim Pengembang STIMI  
**Created Date**: 2026-11-05  
**Last Updated**: 2026-11-05  

---

## 1. Executive Summary
**PRESENSISTIMI** adalah platform presensi dan manajemen kehadiran kepegawaian modern berbasis Web/PWA (*Progressive Web App*) yang dirancang khusus untuk Dosen dan Tenaga Kependidikan (Tendik/Staf) di lingkungan institusi Sekolah Tinggi Ilmu Manajemen Indonesia (STIMI). Sistem ini mengintegrasikan validasi ganda *GPS Geofencing* dan jepretan kamera *selfie real-time* guna memastikan akurasi data kehadiran, mengeliminasi kecurangan lokasi (*fake GPS* / titip presensi), serta menyediakan otomasi alur kerja pengajuan cuti, izin, dan dinas luar kota dengan hierarki persetujuan 3 tingkat yang transparan.

---

## 2. Problem Statement
* **Permasalahan Utama**: Proses presensi kepegawaian manual atau berbasis sidik jari fisik di lokasi sering kali menimbulkan antrean panjang, rentan kendala mesin, dan tidak mengakomodasi mobilitas dosen atau staf yang menjalankan tugas kedinasan di luar kampus.
* **Target Pengguna**: 
  1. Dosen Tetap & Luar Biasa STIMI.
  2. Tenaga Kependidikan (Staf Administrasi, Keuangan, Akademik, IT, Umum).
  3. Pejabat Penilai / Pimpinan Unit (Ketua Bagian / Kaprodi / Pembantu Ketua).
  4. Pengelola SDM / Bagian Kepegawaian (HRD/Admin).
* **Pain Points**:
  - Rekapitulasi bulanan memakan waktu berhari-hari karena pencatatan terfragmentasi.
  - Sulit memvalidasi apakah staf/dosen benar-benar berada di area kampus saat jam masuk.
  - Pengajuan cuti dan dinas luar masih menggunakan formulir kertas yang lambat disetujui.

---

## 3. Goals & Success Metrics

| Sasaran (Goal) | Metrik Keberhasilan | Target |
| :--- | :--- | :--- |
| **Kecepatan Presensi** | Waktu yang dibutuhkan pegawai untuk clock-in | < 5 detik per transaksi |
| **Integritas Lokasi** | Tingkat akurasi deteksi geofence radius kampus | Radius validasi 50 - 150 meter dari titik koordinat |
| **Efisiensi Rekap SDM** | Waktu generate rekapitulasi kehadiran bulanan | Real-time (< 3 detik ekspor Excel/PDF) |
| **Aksesibilitas Multi-Device** | Kompatibilitas browser seluler (Android Chrome & iOS Safari) | 100% responsif PWA tanpa instalasi rumit |

---

## 4. User Personas & Role Matrix

```
                      ┌─────────────────────────────────┐
                      │        ADMIN SDM / HRD          │
                      │ Master Data, Geofence, Rekap    │
                      └───────────────┬─────────────────┘
                                      │ Kelola & Pantau
                      ┌───────────────▼─────────────────┐
                      │    ATASAN / PEJABAT PENILAI     │
                      │ Review & Approval Cuti / Dinas  │
                      └───────────────┬─────────────────┘
                                      │ Verifikasi Tim
                      ┌───────────────▼─────────────────┐
                      │         PEGAWAI / DOSEN         │
                      │ Presensi Selfie + GPS, Form Izin│
                      └─────────────────────────────────┘
```

### Persona 1: Dosen / Staf (Pegawai)
* **Kebutuhan**: Melakukan clock-in dan clock-out harian dari ponsel dengan cepat tanpa antre di mesin fisik.
* **Perilaku**: Buka aplikasi PWA saat tiba di kampus, izinkan akses lokasi & kamera, ambil selfie, tekan "Presensi Masuk". Mengajukan cuti atau tugas luar jika diperlukan.

### Persona 2: Pejabat Penilai / Atasan
* **Kebutuhan**: Memantau kehadiran staf di unit kerjanya dan memproses pengajuan cuti/dinas luar secara instan tanpa tumpukan berkas fisik.
* **Perilaku**: Menerima daftar pengajuan cuti/dinas dari staf bawahannya, memeriksa alasan & berkas, lalu menekan "Setujui" atau "Tolak" disertai catatan.

### Persona 3: Admin / HRD Kepegawaian STIMI
* **Kebutuhan**: Mengelola master pegawai (NIP, jabatan, unit kerja), mengonfigurasi titik koordinat kampus & batas keterlambatan, serta mengekspor rekap gaji/kehadiran.

---

## 5. Feature Requirements

### MVP Features (Must Have — v1.0)
* **FR-01: Autentikasi NIP & RBAC**: Login aman berbasis NIP dan Password terenkripsi bcrypt, dengan proteksi rute berbasis peran (Admin, Atasan, Pegawai).
* **FR-02: Geofencing GPS Real-Time**: Kalkulasi jarak koordinat pegawai ke titik pusat kampus STIMI menggunakan formula Haversine di server-side. Jam masuk ditolak jika berada di luar batas radius meter yang ditentukan (kecuali dinas luar).
* **FR-03: Kamera Selfie & Anti-Spoofing**: Tangkapan kamera langsung (*live video stream* WebRTC) saat presensi; input file galeri dinonaktifkan untuk mencegah pemalsuan foto.
* **FR-04: Manajemen Jam Kerja Tetap**: Jam masuk standar (08:00) dan jam pulang standar (16:30) dengan *grace period* toleransi keterlambatan (15 menit) yang dapat dikonfigurasi dinamis oleh Admin.
* **FR-05: Modul Pengajuan Cuti & Izin**: Formulir cuti tahunan, izin sakit, dan keperluan penting dengan unggah bukti surat dokter/pendukung.
* **FR-06: Modul Dinas Luar Kota**: Fitur clock-in khusus di luar radius kampus STIMI dengan syarat mengunggah surat tugas/alasan dinas dan otomatis mencatat titik koordinat di luar kantor.
* **FR-07: Dashboard Atasan (Approval Workflow)**: Antarmuka pejabat penilai untuk menyetujui atau menolak permohonan cuti dan dinas staf binaannya.
* **FR-08: Dashboard HRD & Konfigurasi Kampus**: Manajemen pegawai, pengaturan dinamis latitude/longitude dan radius geofence kampus, serta rekapitulasi data.
* **FR-09: Ekspor Rekapitulasi Presensi**: Cetak rekap bulanan kehadiran per pegawai, per divisi, atau seluruh staf STIMI ke format Excel (XLSX) dan PDF.

---

## 6. Technical Architecture

| Layer | Teknologi | Alasan Pemilihan |
| :--- | :--- | :--- |
| **Framework & Fullstack** | Next.js 15 (App Router, React 19) | Server Actions, rendering cepat, PWA capabilities, dan arsitektur monolitik modern tanpa perlu backend terpisah. |
| **Language** | TypeScript 5.8+ | Menjamin *type-safety* ketat dari skema database hingga komponen antarmuka pengguna. |
| **Styling & Icons** | Tailwind CSS v4 + Lucide React | *Zero-runtime*, performa tinggi, desain antarmuka responsif ramah peramban seluler (*mobile-first*). |
| **Database** | MongoDB (Atlas / Self-Hosted) | Skalabilitas tinggi, struktur dokumen fleksibel, dan kemudahan penanganan *log* presensi berkala. |
| **ORM & Data Layer** | Prisma ORM (`provider = "mongodb"`) | Skema model deklaratif, migrasi konsisten, dan *type-safe queries*. |
| **Autentikasi** | Auth.js / NextAuth v5 | Penanganan sesi JWT terenkripsi yang aman untuk lingkungan web dan PWA. |
| **Geofencing Engine** | Haversine Formula (Server-side validation) | Menghitung jarak lingkaran lengkung bumi antara koordinat perangkat dan koordinat kampus dalam meter. |

---

## 7. Data Flow & User Journeys

### Alur Presensi Masuk (Clock-In)
1. Pegawai membuka aplikasi PRESENSISTIMI via peramban seluler / PWA.
2. Aplikasi meminta izin akses Geolocation & Kamera Web.
3. Koordinat GPS perangkat dibaca via `navigator.geolocation.getCurrentPosition`.
4. Pegawai mengarahkan kamera ke wajah dan menekan tombol **"Ambil Foto & Presensi"**.
5. Foto dikompresi di sisi klien dan dikirim bersama data koordinat via Server Action.
6. Server menghitung jarak lokasi terhadap titik kampus STIMI:
   - Jika jarak $\le$ radius kampus: Presensi diterima, status ditentukan (**Tepat Waktu** / **Terlambat** berdasarkan jam server).
   - Jika jarak $>$ radius kampus: Sistem menolak presensi, kecuali pegawai memilih mode **Dinas Luar** yang sudah disetujui sebelumnya.
7. Data tersimpan di database MongoDB, dan tampilan antarmuka memperbarui status presensi hari ini.

---

## 8. Non-Functional Requirements (NFR)

* **Performance**: Waktu muat awal (*First Contentful Paint*) < 1.2 detik, eksekusi Server Action presensi < 600 ms.
* **Security**:
  - Hashing password menggunakan `bcrypt` dengan cost factor 10+.
  - Proteksi manipulasi koordinat dengan pengecekan akurasi GPS (`accuracy < 100m`).
  - Proteksi middleware Next.js untuk mencegah akses unauthorized ke rute Admin dan Atasan.
* **Reliability**: PWA offline shell caching menggunakan Service Worker, sehingga halaman awal tetap dapat terbuka meski jaringan seluler tidak stabil.
* **Storage Optimization**: Kompresi foto selfie ke format WebP/JPEG dengan resolusi maksimal 800x600 px (ukuran berkas < 150 KB per transaksi).

---

## 9. Out of Scope (Non-Goals untuk v1.0)
* Presensi kehadiran perkuliahan untuk mahasiswa (difokuskan khusus staf & dosen institusi).
* Integrasi mesin *face recognition* berbasis AI biometrik kompleks (v1.0 menggunakan verifikasi foto selfie real-time yang diaudit visual oleh HRD).
* Integrasi penggajian langsung (*payroll calculation*) — data disiapkan dalam bentuk ekspor laporan presensi untuk diolah bagian keuangan.

---

## 10. Persetujuan & Dokumen Terkait
Dokumen ini menjadi rujukan tunggal untuk pembuatan skema entitas (`ERD.md`), panduan teknis (`DOKUMENTASI.md`), dan implementasi kode sumber `PRESENSISTIMI`.
