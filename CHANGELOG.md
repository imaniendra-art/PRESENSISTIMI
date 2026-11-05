# Changelog — PRESENSISTIMI

Semua perubahan dan tonggak implementasi pada aplikasi ini dicatat dalam dokumen ini.

Format pencatatan mengacu pada [Keep a Changelog](https://keepachangelog.com/id-ID/1.0.0/).

---

## [1.0.0] - 2026-11-05

### Ditambahkan (Added)
- **Fondasi Proyek & Scaffolding**: Setup Next.js 16 (App Router, React 19) dengan TypeScript dan Tailwind CSS v4.
- **Database & Model ORM**: Skema Prisma deklaratif terhubung langsung ke cluster MongoDB Atlas (`users`, `attendances`, `leave_requests`, `duty_trips`, `campus_settings`).
- **Autentikasi & Otorisasi (RBAC 3-Tingkat)**: NextAuth credentials berbasis NIP dan enkripsi bcrypt dengan proteksi rute middleware Next.js (`/pegawai`, `/atasan`, `/admin`).
- **Geofencing & Anti-Fake GPS**: Perhitungan jarak Haversine di sisi server untuk memvalidasi posisi pegawai terhadap radius toleransi kampus STIMI.
- **Kamera Selfie Real-Time (WebRTC)**: Komponen kamera interaktif langsung untuk jepretan verifikasi wajah tanpa akses galeri foto.
- **Modul Pengajuan Cuti & Izin**: Formulir permohonan cuti tahunan, izin sakit, dan lampiran berkas pendukung.
- **Modul Dinas Luar Kota**: Mekanisme clock-in khusus tugas kedinasan di luar radius kampus STIMI.
- **Alur Persetujuan Atasan (Approval Inbox)**: Antarmuka pimpinan unit/atasan untuk meninjau dan menyetujui/menolak permohonan staf binaannya.
- **Dashboard Admin & Pengaturan Kampus Dinamis**: Menu manajemen data pegawai dan pengaturan koordinat GPS kampus dengan tombol satu-klik "Gunakan GPS Saat Ini".
- **Pelaporan & Ekspor**: Ekspor rekapitulasi kehadiran bulanan ke berkas Excel (.xlsx) dan format cetak resmi PDF ber-kop surat STIMI.
- **Seeder Database**: Akun awal demo (Admin, Atasan, Dosen/Pegawai) dan pengaturan default kampus STIMI Makassar.
