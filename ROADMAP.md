# Development Roadmap & Progress Tracking — PRESENSISTIMI

Dokumen pelacak progres pengerjaan sistem presensi **PRESENSISTIMI** terikat dengan alur `zero-to-prod-orchestrator`.

---

## Ringkasan Status Proyek
* **Tahap Saat Ini**: Fase 10 Selesai (Fase 1 s/d 8 Fondasi Core MVP + Fase 9 Enterprise Enhancement + Fase 10 Multi-Gedung & Hybrid Storage)
* **Status Keseluruhan**: **Production-Ready, Multi-Building & Cloud-Hybrid Scaled**

---

## Rincian Fase Implementasi

### Fase 1: Foundation & Project Scaffolding
- [x] Inisialisasi proyek Next.js 16 (App Router, TypeScript, ESLint, Tailwind CSS v4).
- [x] Konfigurasi struktur folder modular (`src/app`, `src/components`, `src/lib`, `src/actions`).
- [x] Pengaturan konfigurasi PWA (`manifest.json` & Service Worker).

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

### Fase 9: Enterprise Enhancement & Operational Scale
- [x] **Branding Kampus Terpadu**: Integrasi logo resmi STIMI (varian terang & gelap), Favicon multi-resolusi, dan kop surat resmi cetak.
- [x] **Bulk Import Pegawai via Excel / CSV**: Fitur import massal puluhan/ratusan pegawai dalam 1 klik dengan auto-linking NIP atasan.
- [x] **Template Excel Generator**: Tombol satu-klik unduh file format `Template_Data_Pegawai_STIMI.xlsx` langsung dari browser.
- [x] **Edit & Reset Password Pegawai**: Modal pembaruan profil data diri pegawai dan fitur reset kata sandi oleh Admin SDM.
- [x] **Pencarian & Filter Cepat**: Filter pegawai berdasarkan peran (Admin, Atasan, Pegawai) dan pencarian instan NIP/Nama/Unit Kerja.
- [x] **PWA Service Worker & Install Banner**: Pendaftaran Service Worker aktif untuk caching offline shell dan prompt instalasi aplikasi di layar utama HP (Chrome Android & Safari iOS).

### Fase 10: Multi-Gedung & Hybrid Storage Optimization (Terbaru)
- [x] **Geofencing Multi-Gedung**: Penambahan model `CampusLocation`, penugasan spesifik per pegawai vs fleksibel semua gedung kampus.
- [x] **Aturan Lokasi Cerdas**: Validasi radius toleransi ke gedung yang ditugaskan atau pencarian otomatis gedung aktif terdekat.
- [x] **Auto-Resize & Kompresi WebP**: Optimasi server-side via `sharp` memangkas ukuran foto bukti presensi hingga 79% (menjadi ~15-25 KB).
- [x] **Hybrid Cloud Storage**: Integrasi cloud Supabase Storage (bucket `presensistimi`) dengan fail-safe cadangan lokal di `public/uploads/`.
