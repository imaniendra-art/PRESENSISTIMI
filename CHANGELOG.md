# Changelog — PRESENSISTIMI

Semua perubahan dan tonggak implementasi pada aplikasi ini dicatat dalam dokumen ini.

Format pencatatan mengacu pada [Keep a Changelog](https://keepachangelog.com/id-ID/1.0.0/).

---

## [1.4.4] - 2026-11-14

### Ditambahkan (Added - Buku Pedoman Penggunaan & Pusat Bantuan Pengguna)
- **Buku Pedoman Penggunaan Resmi STIMI Makassar (`PANDUAN_PENGGUNA.md`)**:
  - Panduan komprehensif Bab I s/d Bab V berstandar institusional yang memuat ketentuan WFO/WFA, panduan instalasi PWA di Android & iOS, panduan presensi selfie GPS, fitur absen cepat/kiosk, persetujuan atasan, pengelolaan master pegawai & multi-gedung admin, serta troubleshooting kendala kamera & GPS.
- **Halaman Interaktif Buku Pedoman (`/pedoman`)**:
  - Rute baru interaktif dengan filter navigasi bab, desain modern ramah smartphone dan desktop, tombol **"Cetak / Simpan PDF"** yang diformat khusus `@media print` tanpa navbar/footer, dan tombol unduh berkas pedoman.
- **Kartu Pusat Bantuan & Buku Pedoman pada Halaman Profil (`/profil`)**:
  - Ditempatkan di halaman profil pengguna agar dosen, tendik, dan atasan dapat membuka pedoman interaktif atau langsung mengunduh berkasnya kapan saja.
- **Endpoint Pengunduhan Berkas Pedoman (`/api/pedoman/download`)**:
  - Handler API server untuk menyajikan dan mengunduh berkas markdown `Buku_Pedoman_PRESENSISTIMI_v1.4.3.md` secara instan.

---

## [1.4.3] - 2026-11-12

### Ditambahkan & Ditingkatkan (Added & Enhanced - Rekap Laporan Lengkap Multi-Sheet & PDF Landscape)
- **Rekapitulasi Kehadiran Bulanan Komprehensif Sesuai Pola Kerja STIMI Makassar**:
  - Menerapkan pola 5 hari kerja institusi resmi: **Senin s/d Kamis WFO (di kampus)** dan **Jumat WFA (Work From Anywhere)**.
  - Perhitungan hari kerja efektif otomatis dengan mekanisme *cutoff* berjalan cerdas untuk bulan berjalan (mencegah Alfa palsu untuk tanggal yang belum tiba).
  - Mengintegrasikan permohonan izin, cuti tahunan/melahirkan, dan sakit (`LeaveRequest` status `APPROVED`) ke dalam kolom perizinan resmi.
  - Perhitungan otomatis metrik: **Hari Kerja Efektif**, **Total Hadir**, **Hadir WFO**, **Hadir WFA**, **Tepat Waktu**, **Terlambat**, **Pulang Cepat**, **Dinas Luar**, **Izin/Cuti/Sakit**, **Alfa (Mangkir)**, dan **Tingkat Kehadiran (%)**.
- **Ekspor Excel Multi-Sheet (.xlsx) Dua Dimensi**:
  - **Sheet 1 (`Rekap Bulanan Pegawai`)**: Rangkuman seluruh pegawai dalam 1 bulan dengan lebar kolom terformat proporsional dan baris rata-rata / total di bagian bawah.
  - **Sheet 2 (`Log Presensi Harian`)**: Rincian audit presensi tanggal demi tanggal (No, Tanggal, Hari, Mode Kerja WFO/WFA/Dinas, Jam Masuk, Status Masuk, Jam Pulang, Status Pulang, Durasi Kerja, dan Lokasi Kampus).
- **Format Dokumen Resmi Cetak / PDF Landscape (A4)**:
  - Konfigurasi `@page { size: landscape; margin: 8mm; }` agar seluruh kolom laporan tampil penuh tanpa terpotong.
  - Menampilkan Kop Surat Resmi STIMI Makassar bergaris ganda, kartu ringkasan KPI institusi, dan kolom tanda tangan pengesahan resmi dua pihak (Ketua STIMI Makassar dan Kepala Bagian SDM).

---

## [1.4.2] - 2026-11-12

### Ditingkatkan (Enhanced - Absen Cepat Single-Screen / Zero-Scroll)
- **Desain Layar Tunggal Tanpa Gulir (*Single-Screen / Zero-Scroll*) pada `/absen-cepat`**:
  - Merefaktor tata letak antarmuka [`AbsenCepatPage`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/src/app/absen-cepat/page.tsx) dan [`QuickPresenceCard`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/src/components/presence/QuickPresenceCard.tsx) agar 100% pas dalam satu bidang layar smartphone (~480-520px) tanpa perlu *scrolling*.
  - **Pemberian Identitas Pegawai Kompak (*Inline Recognition Pill*)**: Menggantikan kartu profil besar dengan pill ringkas (`[Foto Inisial] Nama Lengkap (NIP) • Status Hari Ini [Ganti]`) yang menghemat ruang vertikal hingga ~100px.
  - **Penghapusan Input PIN Redundan**: Menghapus kolom input PIN/Sandi verifikasi opsional secara permanen untuk memangkas langkah pengisian dan memprioritaskan kecepatan presensi di lobi/pintu masuk.
  - **Kamera Selfie Kompak Terbuka Otomatis**: Memasang mode `compact={true}` pada [`CameraCapture`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/src/components/presence/CameraCapture.tsx) (`h-44 sm:h-48`) yang langsung tampil bersama tombol jepret tanpa terdorong ke bawah layar.
  - **Header & Jam Digital WITA Menonjol**: Judul dan logo ditempatkan rapat di atas kartu layaknya halaman login, dengan jam digital WITA font monospaced tabular berukuran besar dan jelas.
  - **Penyederhanaan Navigasi Masuk Akun**: Menghapus teks *"Bukan presensi cepat? Masuk ke Akun Pribadi / Admin →"* dan pembatas teks berlebih, digantikan langsung oleh tombol tegas bertuliskan **"Masuk Akun"**.
  - **Pembersihan Elemen Uji Coba Produksi**: Menghapus banner peringatan dan tombol *[Aktifkan Uji Coba]* sepenuhnya untuk merapikan antarmuka murni siap pakai di lingkungan kampus.
  - **Penyatuan Tombol Shutter Kamera dengan Tombol Aksi Bawah**: Menghilangkan tombol mengambang di dalam gambar video kamera agar viewfinder bersih bebas halangan; tombol solid utama di bawah kamera kini langsung difungsikan untuk mengambil foto wajah (*shutter*), kemudian bertransformasi seketika menjadi tombol eksekusi *"Presensi Masuk/Pulang Sekarang"*.
  - **Pencegahan Pemblokiran Layar oleh PWA Banner**: Menonaktifkan banner instalasi PWA pada rute `/absen-cepat` dan `/kiosk` agar tombol aksi tidak terhalang.

---

## [1.4.1] - 2026-11-11

### Ditingkatkan (Enhanced - Mobile UX Perfection)
- **Kartu Metrik KPI Responsif 2-Kolom Ponsel**:
  - Merefaktor tata letak 4 kartu KPI di [`AdminDashboardPage`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/src/app/admin/dashboard/page.tsx) dan [`AdminMonitoringPage`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/src/app/admin/monitoring/page.tsx) dari inline rigid 4 kolom menjadi `grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4`.
  - Pada layar smartphone (<640px), kartu tampil lega dalam 2 kolom x 2 baris tanpa pemotongan teks atau angka metrik.
- **Tampilan Khusus Mobile (*Card-List View*) untuk Riwayat Presensi Pegawai**:
  - Pada [`RiwayatPegawaiPage`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/src/app/pegawai/riwayat/page.tsx), menambahkan tampilan kartu vertikal terstruktur (`block sm:hidden`) khusus layar ponsel.
  - Setiap kartu menampilkan tanggal, badge status kedisiplinan, jam masuk & pulang (font mono), jarak GPS, catatan dinas, serta tombol tautan foto selfie verifikasi tanpa perlu *scrolling* horizontal.
  - Tampilan tabel desktop tetap dipertahankan penuh (`hidden sm:block overflow-x-auto`).
- **Tampilan Khusus Mobile (*Card-List View*) untuk Monitoring Admin**:
  - Pada [`AdminMonitoringPage`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/src/app/admin/monitoring/page.tsx), menambahkan kartu pemantauan per pegawai pada ponsel (`block md:hidden`) yang memuat identitas dosen/staf, gedung penugasan, jam presensi, status kedisiplinan, dan foto selfie masuk/pulang.
- **Migrasi Konvensi Next.js 16 (`middleware.ts` ➔ `proxy.ts`)**:
  - Memigrasikan berkas proteksi rute dari konvensi lawas `middleware.ts` ke [`src/proxy.ts`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/src/proxy.ts) sesuai standar Next.js 16 (Turbopack).
  - Menghilangkan pesan peringatan kuning deprecation sehingga terminal bersih 100%.

---

## [1.4.0] - 2026-11-06

### Ditambahkan & Ditingkatkan (Added & Enhanced)
- **Fitur Baru: Presensi Cepat Tanpa Login (Kiosk & Quick Mobile Check-In)**:
  - Rute baru publik [`/absen-cepat`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/src/app/absen-cepat/page.tsx) dan alias [`/kiosk`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/src/app/kiosk/page.tsx) untuk dosen dan staf melakukan presensi kilat tanpa perlu login akun pribadi.
  - **Pencarian NIP Instan**: Cukup mengetik NIP (misal: `DSN01`), sistem langsung menampilkan preview nama, jabatan, unit kerja, dan status masuk/pulang hari ini.
  - **Keamanan Geofence GPS Ketat (*Strict Geofence*)**: Server secara mutlak memvalidasi koordinat GPS pegawai harus berada di dalam batas radius gedung kampus STIMI Makassar (mencegah absen dari rumah tanpa login).
  - **Dukungan PIN 4-Digit Opsional**: Opsi verifikasi keamanan cepat (4 angka terakhir NIP atau kata sandi akun).
  - **Auto-Reset 4 Detik (Kiosk Ready)**: Setelah presensi berhasil dicatat, sistem menampilkan ucapan sukses dan hitung mundur 4 detik lalu otomatis mereset form untuk pegawai antrean berikutnya di lobi kampus.
  - Tombol pintas mencolok terpasang di halaman login [`/login`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/src/app/login/page.tsx): *"⚡ Presensi Cepat di Kantor (Cukup NIP & Selfie)"*.
- **Optimalisasi Mobile-First Presensi Smartphone (99% Pengguna HP)**:
  - **Kamera Selfie Portrait 3:4**: Rasio kamera dioptimalkan ke format vertikal ponsel dengan siluet panduan posisi wajah oval halus.
  - **Umpan Balik Getaran Fisik (*Haptic Vibration*)**: Smartphone otomatis bergetar lembut saat tombol jepret dan presensi berhasil dieksekusi (`navigator.vibrate`).
  - **Anti Zoom-Jump iOS/Android**: Input catatan dan NIP diproteksi ukuran 16px pada layar HP agar peramban Safari/Chrome tidak melompat memperbesar layar saat keyboard muncul.
  - Penghapusan jeda sentuh 300ms (*tap delay*) dengan `touch-action: manipulation`.

---

## [1.3.0] - 2026-11-06

### Ditambahkan & Ditingkatkan (Added & Enhanced)
- **Tema Segar Kampus (Fresh Campus Emerald Theme)**:
  - Palet visual baru bernuansa hijau emerald & slate perguruan tinggi yang bersih, energik, dan kontras tinggi (`from-emerald-950 via-slate-900 to-teal-950`).
  - Standar visual profesional Anti-Slop Pillar 7: border tegas 1px (`border-slate-200/90`), tipografi angka tabular (`tabular-nums font-mono`), dan transisi mikro interaktif.
- **Jam Digital Live Real-Time (Waktu Indonesia Tengah - WITA)**:
  - Tampilan jam digital presisi tinggi yang berdetak setiap detik pada kartu presensi pegawai.
  - Sinkronisasi waktu operasional institusi STIMI Makassar.
- **Radar Geofence Interaktif & Indikator Sinyal Satelit**:
  - Animasi radar berdenyut (*animated radar pulse*) hijau zamrud saat berada di dalam radius gedung kampus dan merah saat berada di luar jangkauan.
  - Informasi presisi satelit GPS (±meter) disertai peringatan cerdas apabila sinyal satelit terhalang kanopi beton tebal.
  - Komponen kamera terbungkus dalam `ErrorBoundary` tahan-gangguan.
- **Visualisasi & Analitik Admin Dashboard**:
  - Grafik batang SVG **Tren Kehadiran Mingguan (Senin s/d Jumat)** dengan indikator capaian target kedisiplinan.
  - Distribusi dan persentase kehadiran pegawai per unit kerja (**Program Studi S1 Manajemen, Pascasarjana S2, BAAK & IT, LPPM, LPM**).
  - Feed **Aktivitas Presensi Terkini** yang menampilkan 5 presensi masuk terakhir lengkap dengan foto thumbnail, NIP, jam presensi, dan status gedung.
- **Navigasi Riwayat Hari Sebelumnya pada Panel Monitoring**:
  - Filter tanggal interaktif (*Date Picker*) yang memungkinkan pimpinan dan admin memeriksa absensi tanggal mana pun di masa lampau.
  - Tata letak 4 kartu KPI dikunci rapi dalam 1 baris horizontal (`repeat(4, minmax(0, 1fr))`).
- **Penyempurnaan Manajemen Pegawai & Import Excel**:
  - Email dijadikan opsional secara menyeluruh, login murni menggunakan NIP & Password.
  - Tombol hapus pegawai (*delete*) lengkap dengan modal konfirmasi dan *cascade cleanup*.
  - Dukungan penamaan peran kampus (`PIMPINAN`, `KETUA LEMBAGA`, `TENDIK TETAP`, `DOSEN`) dan *two-pass linking* untuk NIP atasan pada import massal.
- **Kompatibilitas Kamera PC / Laptop Desktop**:
  - Prioritas hardware webcam fisik, pemilih perangkat kamera (*camera device switcher*), dan penanganan *autoplay* otomatis.

---

## [1.2.0] - 2026-11-06

### Ditambahkan (Added)
- **Hybrid Storage & Auto-Resize WebP Kompresi**:
  - Integrasi paket `@supabase/supabase-js` dan inisialisasi bucket publik `presensistimi`.
  - Kompresi server-side otomatis menggunakan `sharp`: foto selfie presensi di-resize ke dimensi ideal (480x640) dan dikonversi ke format WebP kualitas 75% (ukuran terpangkas hingga 79% menjadi hanya ~15-25 KB per foto).
  - Skema penyimpanan hybrid: otomatis menyimpan salinan cadangan lokal di [`public/uploads/selfie/`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/public/uploads/selfie) DAN mengunggah langsung ke Cloud Supabase Storage.
  - Fail-safe fallback otomatis: jika koneksi internet terganggu, sistem tetap berjalan lancar menggunakan penyimpanan lokal.
- **Geofencing Multi-Gedung & Multi-Lokasi Kampus**:
  - Model database `CampusLocation` dan penugasan lokasi kerja pegawai (`assignedLocationId`).
  - Aturan presensi cerdas: pegawai yang terikat pada gedung tertentu hanya dapat absen di gedung tersebut, sedangkan pegawai berstatus fleksibel dapat absen di gedung mana pun yang terdekat.
  - Antarmuka CRUD gedung kampus di `/admin/pengaturan` lengkap dengan tombol ambil GPS otomatis dan pengaturan radius toleransi per gedung.
  - Integrasi lokasi gedung presensi pada dashboard monitoring harian dan ekspor laporan Excel.

---

## [1.1.0] - 2026-11-06

### Ditambahkan (Added)
- **Identitas & Branding Kampus STIMI**:
  - Logo resmi STIMI Makassar varian teks hitam ([`public/logo.png`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/public/logo.png)) untuk Navbar & dokumen cetak PDF.
  - Logo STIMI varian teks putih ([`public/logo-dark.png`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/public/logo-dark.png)) untuk halaman Login berlatar gelap.
  - Favicon browser dinamis ([`src/app/icon.png`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/src/app/icon.png), [`src/app/apple-icon.png`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/src/app/apple-icon.png), [`public/favicon.ico`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/public/favicon.ico)).
  - Penyematan logo institusi pada Kop Surat Laporan Rekapitulasi Presensi Siap Cetak.
- **Import Massal Pegawai via Excel / CSV (Bulk Import)**:
  - Fitur unggah file Excel/CSV di panel Admin SDM untuk mendaftarkan puluhan/ratusan dosen dan staf sekaligus.
  - Tombol otomatis unduh file format resmi `Template_Data_Pegawai_STIMI.xlsx`.
  - Pemetaan kolom cerdas (NIP, Nama, Email, Peran, Jabatan, Unit Kerja, NIP Atasan, Password).
  - Ringkasan hasil import (jumlah baris berhasil dibuat, diperbarui, dan penanganan error).
- **Manajemen Profil & Keamanan Akun**:
  - Modal interaktif **Edit Data Pegawai** (pembaruan Nama, Email, Jabatan, Unit Kerja, Peran, dan Atasan Langsung).
  - Modal **Reset Kata Sandi Pegawai** oleh Admin jika staf lupa kata sandi.
  - Toolbar pencarian instan (NIP, Nama, Jabatan, Unit Kerja) dan filter peran (Admin, Atasan, Pegawai).
- **PWA Full Capabilities (Mobile-Ready)**:
  - Pendaftaran Service Worker aktif ([`public/sw.js`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/public/sw.js)) dengan caching offline shell dan aset statis.
  - Komponen Banner Prompt Pemasangan Aplikasi di HP ([`src/components/pwa/PwaInstallPrompt.tsx`](file:///c:/Users/imani/OneDrive/Dokumen/GitHub/PRESENSISTIMI/src/components/pwa/PwaInstallPrompt.tsx)) yang mendeteksi perangkat Android/Chrome dan panduan khusus Safari iOS ("Add to Home Screen").

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
