# Development Roadmap & Progress Tracking — PRESENSISTIMI

Dokumen pelacak progres pengerjaan sistem presensi **PRESENSISTIMI** terikat dengan alur 8-Fase `zero-to-prod-orchestrator`.

---

## Ringkasan Status Proyek
* **Tahap Saat Ini**: Fase 8 Selesai (Semua Fase 1 s/d 8 Telah Berhasil Diimplementasikan & Diuji Build)
* **Status Keseluruhan**: **Production-Ready (Siap Digunakan)**

---

## Rincian 8-Fase Implementasi

### Fase 1: Foundation & Project Scaffolding
- [x] Inisialisasi proyek Next.js 15/16 (App Router, TypeScript, ESLint, Tailwind CSS v4).
- [x] Konfigurasi struktur folder modular (`src/app`, `src/components`, `src/lib`, `src/actions`).
- [x] Pengaturan konfigurasi PWA (`manifest.json` & Service Worker shell dasar).

### Fase 2: Database Layer & Prisma MongoDB Setup
- [x] Inisialisasi Prisma ORM dengan penyedia MongoDB (`provider = "mongodb"`).
- [x] Penerapan skema lengkap (`User`, `Attendance`, `LeaveRequest`, `DutyTrip`, `CampusSetting`).
- [x] Pembuatan script *seed* awal untuk akun Superadmin HRD, Atasan, Pegawai, dan data kampus default STIMI Makassar (`npx prisma db seed`).
- [x] Sinkronisasi koleksi dan indeks unik ke cluster MongoDB Atlas (`npx prisma db push`).

### Fase 3: Authentication & Role-Based Access Control (RBAC)
- [x] Konfigurasi NextAuth / Auth.js dengan strategi kredensial NIP & Password (bcrypt hash).
- [x] Implementasi Next.js Middleware untuk proteksi halaman `/pegawai`, `/atasan`, dan `/admin`.
- [x] Halaman login terpadu mobile-first dengan tombol uji akun demo cepat (`/login`).

### Fase 4: Geofencing Engine & Kamera Selfie Real-Time
- [x] Komponen kamera WebRTC real-time (anti-galeri) dengan preview langsung (`<CameraCapture />`).
- [x] Integrasi Geolocation API dengan pembacaan akurasi koordinat dan perhitungan jarak Haversine.
- [x] Server Action presensi masuk (`submitClockIn`) & pulang (`submitClockOut`) dengan validasi radius kampus di sisi server.
- [x] Penentuan otomatis status `TEPAT_WAKTU` atau `TERLAMBAT` berdasarkan jam standar STIMI.

### Fase 5: Modul Cuti & Dinas Luar Kota (Approval Workflow)
- [x] Formulir pengajuan cuti, izin, sakit dengan unggah berkas pendukung (`<RequestTabs />`).
- [x] Formulir pengajuan dinas luar kota dengan unggah surat tugas.
- [x] Dashboard Pejabat Penilai / Atasan untuk verifikasi status pengajuan (`APPROVED` / `REJECTED`) disertai catatan review (`<ApprovalList />`).
- [x] Integrasi presensi dinas luar (clock-in tanpa batasan radius kampus bila sedang penugasan).

### Fase 6: Dashboard Admin HRD & Pengaturan Kampus Dinamis
- [x] Halaman manajemen data pegawai (Tambah pegawai baru, penataan atasan langsung, dan saklar aktif/non-aktif akun).
- [x] Antarmuka pengaturan titik koordinat latitude, longitude, radius meter, dan jam kerja kampus STIMI (lengkap dengan tombol satu-klik "Gunakan GPS Saat Ini").
- [x] Monitoring kehadiran harian real-time (pantau langsung siapa yang sudah masuk, terlambat, izin, dan pratinjau foto selfie).

### Fase 7: Pelaporan & Ekspor Data
- [x] Agregasi data kehadiran bulanan per pegawai.
- [x] Ekspor rekapitulasi data kehadiran ke format Excel (.xlsx) menggunakan SheetJS/XLSX.
- [x] Format dokumen cetak resmi PDF dengan kop surat institusi STIMI dan kolom tanda tangan pengesahan pimpinan.

### Fase 8: Production Hardening & Anti-Slop Audit
- [x] Verifikasi build produksi Turbopack Next.js (`npm run build` lulus tanpa error / exit code 0).
- [x] Penegakan zero-slop tanpa kode dummy atau placeholder.
- [x] Desain responsif mobile-first untuk akses praktis lewat ponsel Android & iOS.
