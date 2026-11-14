# BUKU PEDOMAN PENGGUNAAN SISTEM PRESENSI ELEKTRONIK (PRESENSISTIMI)
### Sekolah Tinggi Ilmu Manajemen Indonesia (STIMI) Makassar
**Edisi Resmi: Versi 1.4.3 (Tahun 2026)**  
*Dokumen Resmi Panduan Operasional Dosen, Tenaga Kependidikan, Pejabat Penilai, dan Administrator SDM*

---

## DAFTAR ISI

- [KATA PENGANTAR](#kata-pengantar)
- [BAB I: PENDAHULUAN & KETENTUAN UMUM](#bab-i-pendahuluan--ketentuan-umum)
  - [1.1 Gambaran Umum Sistem](#11-gambaran-umum-sistem)
  - [1.2 Ketentuan Jam & Pola Kerja Institusi](#12-ketentuan-jam--pola-kerja-institusi)
  - [1.3 Persyaratan Perangkat & Peramban (Browser)](#13-persyaratan-perangkat--peramban-browser)
  - [1.4 Panduan Pemasangan Aplikasi di Layar Utama Ponsel (Install PWA)](#14-panduan-pemasangan-aplikasi-di-layar-utama-ponsel-install-pwa)
- [BAB II: PANDUAN DOSEN & TENAGA KEPENDIDIKAN (PEGAWAI)](#bab-ii-panduan-dosen--tenaga-kependidikan-pegawai)
  - [2.1 Masuk ke Dalam Sistem (Login Akun)](#21-masuk-ke-dalam-sistem-login-akun)
  - [2.2 Presensi Harian Mandiri (Selfie Real-Time & GPS Geofence)](#22-presensi-harian-mandiri-selfie-real-time--gps-geofence)
  - [2.3 Fitur Khusus: Presensi Cepat Tanpa Login (Kiosk & Lobi Kampus)](#23-fitur-khusus-presensi-cepat-tanpa-login-kiosk--lobi-kampus)
  - [2.4 Memahami Kategori Status Presensi](#24-memahami-kategori-status-presensi)
  - [2.5 Melihat Riwayat Kehadiran Pribadi](#25-melihat-riwayat-kehadiran-pribadi)
  - [2.6 Tata Cara Pengajuan Cuti, Izin, dan Sakit](#26-tata-cara-pengajuan-cuti-izin-dan-sakit)
  - [2.7 Tata Cara Pengajuan & Presensi Tugas Dinas Luar](#27-tata-cara-pengajuan--presensi-tugas-dinas-luar)
- [BAB III: PANDUAN ATASAN LANGSUNG (PEJABAT PENILAI)](#bab-iii-panduan-atasan-langsung-pejabat-penilai)
  - [3.1 Hak Akses & Peran Pejabat Penilai](#31-hak-akses--peran-pejabat-penilai)
  - [3.2 Meninjau & Menyetujui Permohonan Cuti / Izin / Sakit](#32-meninjau--menyetujui-permohonan-cuti--izin--sakit)
  - [3.3 Verifikasi Surat Tugas & Persetujuan Dinas Luar Kota](#33-verifikasi-surat-tugas--persetujuan-dinas-luar-kota)
  - [3.4 Pemantauan Kehadiran Anggota Tim Kerja](#34-pemantauan-kehadiran-anggota-tim-kerja)
- [BAB IV: PANDUAN PENGELOLA SDM / ADMINISTRATOR](#bab-iv-panduan-pengelola-sdm--administrator)
  - [4.1 Dashboard Eksekutif & Pemantauan Live Harian](#41-dashboard-eksekutif--pemantauan-live-harian)
  - [4.2 Pengelolaan Master Data Pegawai](#42-pengelolaan-master-data-pegawai)
  - [4.3 Import Data Pegawai Massal via Excel](#43-import-data-pegawai-massal-via-excel)
  - [4.4 Reset Kata Sandi & Pengaturan Status Akun](#44-reset-kata-sandi--pengaturan-status-akun)
  - [4.5 Konfigurasi Multi-Gedung & Geofencing GPS Kampus](#45-konfigurasi-multi-gedung--geofencing-gps-kampus)
  - [4.6 Pengaturan Jam Kerja & Batas Toleransi](#46-pengaturan-jam-kerja--batas-toleransi)
  - [4.7 Rekapitulasi Laporan Bulanan (Excel Multi-Sheet & Cetak PDF Resmi)](#47-rekapitulasi-laporan-bulanan-excel-multi-sheet--cetak-pdf-resmi)
- [BAB V: PANDUAN PEMECAHAN MASALAH (TROUBLESHOOTING & FAQ)](#bab-v-panduan-pemecahan-masalah-troubleshooting--faq)
  - [5.1 Solusi Masalah Izin Lokasi (GPS Tidak Terbaca / Di Luar Radius)](#51-solusi-masalah-izin-lokasi-gps-tidak-terbaca--di-luar-radius)
  - [5.2 Solusi Masalah Izin Kamera Peramban (Kamera Hitam / Ditolak)](#52-solusi-masalah-izin-kamera-peramban-kamera-hitam--ditolak)
  - [5.3 Lupa Kata Sandi atau Kendala Masuk Akun](#53-lupa-kata-sandi-atau-kendala-masuk-akun)
  - [5.4 Presensi Hari Jumat (Mode WFA)](#54-presensi-hari-jumat-mode-wfa)
- [LEMBAR PENGESAHAN & KONTAK BANTUAN](#lembar-pengesahan--kontak-bantuan)

---

## KATA PENGANTAR

Puji syukur kita panjatkan ke hadirat Tuhan Yang Maha Esa atas terwujudnya sistem presensi elektronik terpadu **PRESENSISTIMI** di lingkungan Sekolah Tinggi Ilmu Manajemen Indonesia (STIMI) Makassar.

Buku Pedoman Penggunaan ini disusun sebagai acuan operasional resmi bagi seluruh civitas akademika—baik Dosen Tetap, Dosen Luar Biasa, Tenaga Kependidikan (Tendik), Pejabat Penilai/Struktural, maupun Bagian Kepegawaian (SDM/HRD). Sistem ini dihadirkan guna meningkatkan akuntabilitas, transparansi, efisiensi administrasi, serta kemudahan pencatatan kehadiran yang akurat dan berintegritas tinggi.

Diharapkan seluruh pihak dapat membaca, memahami, dan memedomani buku petunjuk ini demi kelancaran tata kelola administrasi kepegawaian institusi STIMI Makassar yang modern, efektif, dan berbasis teknologi digital.

Makassar, November 2026  
**Tim Pengembang & Bagian Kepegawaian (SDM) STIMI Makassar**

---

## BAB I: PENDAHULUAN & KETENTUAN UMUM

### 1.1 Gambaran Umum Sistem

**PRESENSISTIMI** adalah platform pencatatan presensi kepegawaian modern berbasis Web dan *Progressive Web App* (PWA). Sistem mengkombinasikan teknologi:
1. **Validasi Geofencing GPS Real-Time (Formula Haversine)**: Menghitung jarak fisik perangkat pegawai terhadap radius batas resmi gedung kampus STIMI Makassar di sisi server (*server-side calculation*), mencegah penggunaan pemalsuan lokasi (*fake GPS*).
2. **Kamera Selfie Langsung (Anti-Galeri)**: Membuka sensor kamera perangkat secara *live stream* via WebRTC tanpa opsi unggah berkas galeri, memastikan yang melakukan presensi adalah pegawai bersangkutan secara fisik.
3. **Pola Kerja Fleksibel Terprogram**: Mendukung presensi dalam kampus (*Work From Office* / WFO), presensi kerja fleksibel (*Work From Anywhere* / WFA), dan penugasan dinas luar kota.
4. **Hierarki Persetujuan Bertingkat (Approval Workflow)**: Memungkinkan atasan langsung memverifikasi permohonan izin, cuti, sakit, dan surat tugas dinas secara digital tanpa lembaran kertas fisik.

---

### 1.2 Ketentuan Jam & Pola Kerja Institusi

Berdasarkan peraturan ketenagakerjaan dan kebijakan kepegawaian institusi STIMI Makassar, ditetapkan pola 5 (lima) hari kerja per minggu sebagai berikut:

| Hari | Mode Kerja | Jam Masuk Standar | Jam Pulang Standar | Toleransi Keterlambatan | Lokasi Presensi |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Senin - Kamis** | **WFO** (Di Kampus) | **08:00 WITA** | **16:30 WITA** | Maks. 15 Menit (s/d 08:15) | Radius Resmi Gedung Kampus STIMI |
| **Jumat** | **WFA** (Kerja Fleksibel) | **08:00 WITA** | **16:30 WITA** | Maks. 15 Menit (s/d 08:15) | Bebas / Di Mana Saja |
| **Sabtu - Minggu** | **LIBUR** | - | - | - | Hari Libur Rutin |

> [!NOTE]
> Pada hari **Jumat (WFA)**, sistem secara otomatis melonggarkan batasan radius GPS kampus, sehingga pegawai tetap dapat melakukan presensi selfie dari lokasi tugas masing-masing tanpa terkena penolakan geofence.

---

### 1.3 Persyaratan Perangkat & Peramban (Browser)

Aplikasi dapat diakses melalui berbagai perangkat tanpa perlu mengunduh aplikasi berbayar dari toko aplikasi:
* **Smartphone Android**: Disarankan menggunakan peramban **Google Chrome** versi terbaru.
* **iPhone / iPad (iOS)**: Disarankan menggunakan peramban **Safari** versi iOS 15 ke atas.
* **Komputer / Laptop**: Peramban Google Chrome, Microsoft Edge, atau Mozilla Firefox yang dilengkapi kamera web (*webcam*) aktif.
* **Koneksi Internet**: Jaringan seluler (4G/5G) atau Wi-Fi yang stabil.
* **Fitur Perangkat Wajib Aktif**:
  1. GPS / Layanan Lokasi (*Location Services*).
  2. Izin Kamera (*Camera Permission*).

---

### 1.4 Panduan Pemasangan Aplikasi di Layar Utama Ponsel (Install PWA)

Agar aplikasi dapat dibuka dengan cepat layaknya aplikasi mandiri dari layar utama (*Home Screen*) HP:

#### A. Pada Android (Google Chrome)
1. Buka peramban Google Chrome, lalu akses tautan sistem presensi STIMI.
2. Saat muncul banner pop-up di bawah layar bertuliskan **"Tambahkan PRESENSISTIMI ke Layar Utama"**, klik tombol **"Instal"**.
3. Jika banner tidak muncul, ketuk ikon **titik tiga (⋮)** di pojok kanan atas peramban.
4. Pilih menu **"Tambahkan ke Layar Utama"** atau **"Instal Aplikasi"**.
5. Ikon **PRESENSISTIMI** akan otomatis muncul di layar ponsel Anda.

#### B. Pada iPhone / iOS (Safari)
1. Buka tautan sistem presensi STIMI menggunakan peramban **Safari** (wajib Safari).
2. Ketuk ikon **Bagikan (Share)** berupa kotak bertanda panah ke atas di bilah menu bawah layar.
3. Gulir ke bawah lalu pilih menu **"Add to Home Screen"** (Tambahkan ke Layar Utama).
4. Beri nama aplikasi (default: *PRESENSISTIMI*), lalu ketuk **"Add"** di pojok kanan atas.
5. Ikon aplikasi kini siap dibuka langsung tanpa menampilkan bilah alamat browser.

---

## BAB II: PANDUAN DOSEN & TENAGA KEPENDIDIKAN (PEGAWAI)

### 2.1 Masuk ke Dalam Sistem (Login Akun)

```
[Buka Aplikasi] ──► [Ketik NIP] ──► [Ketik Kata Sandi] ──► [Tekan "Masuk Akun"]
```

1. Buka halaman utama aplikasi presensi STIMI (`/login`).
2. Masukkan **NIP** (Nomor Induk Pegawai) resmi Anda (contoh: `DSN01` atau nomor NIP lengkap).
3. Masukkan **Kata Sandi** (Password) akun Anda.
   *(Bagi pegawai baru, gunakan kata sandi awal yang diberikan oleh Admin SDM, lalu segera ubah setelah berhasil masuk).*
4. Tekan tombol **"Masuk Akun"**.
5. Sistem akan mengarahkan Anda ke Dashboard Pegawai sesuai hak akses.

---

### 2.2 Presensi Harian Mandiri (Selfie Real-Time & GPS Geofence)

Presensi harian dilakukan 2 (dua) kali sehari: **Presensi Masuk (Clock-In)** di pagi hari dan **Presensi Pulang (Clock-Out)** di sore hari.

```
                   ALUR PRESENSI MANDIRI (SMARTPHONE)
 ┌────────────────┐      ┌─────────────────┐      ┌─────────────────┐
 │ Buka Menu      │ ───► │ Izinkan Akses   │ ───► │ Kamera & GPS    │
 │ "Presensi"     │      │ Kamera & Lokasi │      │ Terdeteksi Live │
 └────────────────┘      └─────────────────┘      └────────┬────────┘
                                                           │
                                                           ▼
 ┌────────────────┐      ┌─────────────────┐      ┌─────────────────┐
 │ Presensi       │ ◄─── │ Klik "Ambil     │ ◄─── │ Arahkan Wajah   │
 │ Berhasil!      │      │ Foto & Masuk"   │      │ ke Bingkai      │
 └────────────────┘      └─────────────────┘      └─────────────────┘
```

#### Langkah Demi Langkah:
1. Pastikan Anda telah berada di lingkungan gedung kampus STIMI (untuk hari Senin-Kamis) dan GPS ponsel dalam status **Aktif**.
2. Masuk ke menu **"Presensi"** (`/pegawai/presensi`).
3. Sistem akan meminta izin peramban:
   * Klik **"Izinkan" / "Allow"** untuk akses lokasi (*Location*).
   * Klik **"Izinkan" / "Allow"** untuk akses kamera (*Camera*).
4. Layar akan menampilkan:
   * **Radar Lokasi**: Menampilkan nama gedung kampus terdekat, indikator status *"Di Dalam Radius Kampus"*, dan jarak fisik (misal: *18 meter dari Gedung Pusat STIMI*).
   * **Jendela Kamera**: Pratinjau video wajah Anda secara langsung.
   * **Jam Digital WITA**: Menunjukkan jam, menit, dan detik server secara akurat.
5. Posisikan wajah Anda tegak lurus menghadap kamera di tempat dengan pencahayaan yang cukup.
6. Tekan tombol **"Ambil Foto & Presensi Masuk"** (di pagi hari) atau **"Presensi Pulang"** (di sore hari).
7. Tunggu 1-2 detik hingga muncul konfirmasi centang hijau bertuliskan **"Presensi Berhasil Dicatat"**.

> [!IMPORTANT]
> **Peringatan Anti-Titip Absen**: Sistem mendeteksi koordinat lintang/bujur dan mengambil foto wajah secara langsung. Penggunaan aplikasi pemalsu GPS (*Fake GPS / Mock Location*) atau upaya mengunggah foto dari galeri akan ditolak otomatis oleh server.

---

### 2.3 Fitur Khusus: Presensi Cepat Tanpa Login (Kiosk & Lobi Kampus)

Bagi dosen dan staf yang terburu-buru masuk kelas atau kantor lobi dan tidak sempat login ke akun pribadi, institusi menyediakan fitur **Presensi Cepat** (`/absen-cepat` atau `/kiosk`):

```
[Buka /absen-cepat] ──► [Ketik NIP] ──► [Wajah Otomatis Aktif] ──► [Klik Tombol Presensi]
```

#### Keunggulan Presensi Cepat:
* **Zero-Scroll / Single Screen**: Desain layar pas 100% pada satu tampilan smartphone tanpa perlu digulir ke bawah.
* **Cukup Ketik NIP**: Masukkan NIP Anda (misal: `DSN01`), sistem seketika memunculkan nama, unit kerja, dan mendeteksi apakah Anda perlu absen masuk atau absen pulang.
* **Kamera & Shutter Terpadu**: Kamera terbuka otomatis, satu kali tekan tombol langsung menjepret foto dan mengirim presensi ke server.
* **Reset Otomatis 4 Detik**: Setelah presensi sukses dicatat, layar akan menampilkan pesan terima kasih dan hitung mundur 4 detik lalu mereset formulir kembali bersih untuk antrean pegawai berikutnya.

> [!TIP]
> Fitur ini sangat cocok dibuka pada tablet/iPad kios yang terpasang di meja resepsionis lobi kampus atau langsung dibuka lewat browser ponsel masing-masing saat berada di koridor kampus.

---

### 2.4 Memahami Kategori Status Presensi

Setiap data kehadiran yang masuk akan diklasifikasikan secara otomatis oleh algoritma sistem:

* **TEPAT WAKTU**: Presensi masuk dicatat sebelum atau tepat pada batas waktu toleransi (sebelum pukul 08:15 WITA).
* **TERLAMBAT**: Presensi masuk dicatat melewati pukul 08:15 WITA (sistem mencatat selisih menit keterlambatan secara otomatis).
* **PULANG CEPAT**: Pegawai melakukan presensi pulang sebelum jam operasional kantor berakhir (sebelum pukul 16:30 WITA).
* **HADIR WFA**: Presensi hari Jumat yang dilakukan di luar gedung kampus dalam mode *Work From Anywhere*.
* **DINAS LUAR**: Presensi yang dilakukan di luar kota/kampus dengan izin surat tugas kedinasan yang telah disetujui atasan.
* **IZIN / SAKIT / CUTI**: Status resmi pengganti kehadiran berdasarkan permohonan yang disetujui oleh atasan.
* **ALFA / MANGKIR**: Tidak terdapat catatan presensi masuk sama sekali pada hari kerja efektif tanpa adanya pengajuan izin/cuti yang disetujui.

---

### 2.5 Melihat Riwayat Kehadiran Pribadi

Pegawai dapat meninjau rekaman kehadirannya kapan saja melalui menu **"Riwayat"** (`/pegawai/riwayat`):

* **Tampilan Desktop (Laptop/PC)**: Tabel komprehensif menampilkan tanggal, hari, jam masuk, jam pulang, status kedisiplinan, jarak GPS meter, tautan foto selfie, dan catatan dinas.
* **Tampilan Ponsel (Mobile-First Card)**: Di layar smartphone, data tersusun dalam bentuk kartu vertikal yang rapi tanpa perlu menggeser layar ke kanan-kiri (*horizontal scroll*). Terdapat tombol mata kecil untuk melihat foto selfie yang tersimpan.

---

### 2.6 Tata Cara Pengajuan Cuti, Izin, dan Sakit

Jika Anda berhalangan hadir ke kampus karena keperluan tertentu:

1. Buka menu **"Pengajuan"** (`/pegawai/pengajuan`).
2. Pilih tab **"Permohonan Cuti / Izin / Sakit"**.
3. Pilih **Jenis Pengajuan**:
   * **Cuti Tahunan**
   * **Cuti Melahirkan / Alasan Penting**
   * **Izin Keperluan Pribadi**
   * **Sakit** *(Wajib melampirkan foto Surat Keterangan Dokter)*
4. Tentukan **Tanggal Mulai** dan **Tanggal Selesai**. Sistem akan menghitung estimasi jumlah hari kerja.
5. Ketikkan **Alasan Pengajuan** secara jelas dan santun.
6. Unggah dokumen/surat bukti pendukung (format PDF, JPG, atau PNG) jika disyaratkan.
7. Tekan tombol **"Kirim Pengajuan"**.
8. Pengajuan Anda akan masuk ke daftar verifikasi Atasan Langsung Anda dengan status `PENDING`. Anda dapat memantau status persetujuan (`APPROVED` / `REJECTED`) di halaman ini.

---

### 2.7 Tata Cara Pengajuan & Presensi Tugas Dinas Luar

Bagi staf atau dosen yang ditugaskan menghadiri seminar, penelitian, studi banding, atau urusan kedinasan di luar kampus:

1. Buka menu **"Pengajuan"** ➔ pilih tab **"Tugas Dinas Luar"**.
2. Masukkan nomor Surat Tugas, kota/lokasi tujuan, tanggal pelaksanaan, dan unggah foto/berkas Surat Tugas resmi.
3. Kirim pengajuan ke Atasan Langsung untuk mendapatkan status `APPROVED`.
4. **Melakukan Presensi di Lokasi Dinas**:
   * Pada hari penugasan dinas, buka menu presensi seperti biasa.
   * Sistem akan mendeteksi status dinas aktif Anda dan mengabaikan radius geofence kampus.
   * Lakukan foto selfie di lokasi dinas; titik koordinat lokasi dinas Anda akan tercatat resmi sebagai kehadiran dinas luar.

---

## BAB III: PANDUAN ATASAN LANGSUNG (PEJABAT PENILAI)

### 3.1 Hak Akses & Peran Pejabat Penilai

Pejabat Penilai (Ketua Bagian, Kepala Unit, Koordinator Program Studi, Pembantu Ketua) memiliki wewenang struktural untuk:
1. Memverifikasi seluruh permohonan ketidakhadiran dari staf yang berada di bawah unit kerjanya.
2. Memberikan persetujuan (*Approve*) atau penolakan (*Reject*) disertai catatan pembinaan resmi.
3. Memantau kedisiplinan dan rekapitulasi staf binaan secara berkala.

---

### 3.2 Meninjau & Menyetujui Permohonan Cuti / Izin / Sakit

```
[Buka Menu Persetujuan] ──► [Periksa Data & Berkas] ──► [Klik Setujui / Tolak]
```

1. Masuk ke menu **"Persetujuan"** (`/atasan/persetujuan`).
2. Tab **"Daftar Pengajuan Masuk"** menampilkan daftar staf bawahan yang mengajukan cuti, izin, atau sakit dengan lencana kuning `PENDING`.
3. Klik tombol **"Rincian"** untuk memeriksa:
   * Nama & NIP pegawai.
   * Jenis permohonan dan rentang tanggal yang diajukan.
   * Alasan pengajuan.
   * Pratinjau lampiran surat keterangan dokter atau berkas pendukung.
4. Tentukan keputusan:
   * **Setujui (Approve)**: Klik tombol hijau **"Setujui"**. Status pengajuan berubah menjadi hijau `APPROVED`, dan hari kerja bersangkutan otomatis tercatat resmi sebagai izin/cuti sah (bukan Alfa).
   * **Tolak (Reject)**: Klik tombol merah **"Tolak"**. Masukkan **Alasan Penolakan** (wajib diisi agar staf memahami pertimbangan pimpinan), lalu konfirmasi penolakan.

---

### 3.3 Verifikasi Surat Tugas & Persetujuan Dinas Luar Kota

1. Pada menu Persetujuan, pilih tab **"Tugas Dinas Luar"**.
2. Periksa keabsahan berkas Surat Tugas yang diunggah staf.
3. Jika penugasan telah sesuai agenda institusi, klik **"Setujui Dinas"**.
4. Begitu disetujui, staf bersangkutan memiliki hak presensi di luar radius kampus selama rentang tanggal tugas berlaku.

---

### 3.4 Pemantauan Kehadiran Anggota Tim Kerja

Pejabat Penilai dapat melihat ringkasan kedisiplinan harian staf di unitnya melalui menu **"Monitoring Tim"** guna memastikan operasional pelayanan perkuliahan dan administrasi tetap berjalan optimal.

---

## BAB IV: PANDUAN PENGELOLA SDM / ADMINISTRATOR

### 4.1 Dashboard Eksekutif & Pemantauan Live Harian

Administrator Kepegawaian (HRD/SDM) memiliki kendali menyeluruh atas sistem melalui panel `/admin`:

* **4 Kartu Metrik KPI Utama**:
  1. **Total Pegawai Terdaftar**: Jumlah dosen dan tendik aktif.
  2. **Sudah Hadir Hari Ini**: Jumlah pegawai yang sudah melakukan presensi masuk.
  3. **Tepat Waktu vs Terlambat**: Perbandingan kepatuhan jam kerja pagi.
  4. **Sedang Izin / Cuti / Dinas**: Pegawai yang berhalangan hadir dengan status sah.
* **Monitoring Kehadiran Real-Time** (`/admin/monitoring`):
  * Memantau daftar presensi detik demi detik secara *live*.
  * Dilengkapi filter cerdas: Filter per status (Semua, Tepat Waktu, Terlambat, WFA, Dinas Luar, Belum Presensi) dan pencarian instan nama/NIP.
  * Dilengkapi foto selfie langsung dan lokasi gedung kampus tempat presensi dilakukan.

---

### 4.2 Pengelolaan Master Data Pegawai

Pada menu **"Data Pegawai"** (`/admin/pegawai`), Administrator dapat:
1. **Menambah Pegawai Baru**:
   * Klik tombol **"+ Tambah Pegawai"**.
   * Isi NIP, Nama Lengkap, Email, Unit Kerja / Program Studi, Jabatan, Peran Akun (`PEGAWAI`, `ATASAN`, atau `ADMIN`), dan pilih Atasan Langsung dari daftar yang tersedia.
   * Tentukan Kata Sandi awal (default: kombinasi NIP atau sandi acak).
2. **Mengubah Data Pegawai**:
   * Klik tombol ikon pensil pada baris pegawai untuk memperbarui data unit kerja, nomor telepon, atau mutasi atasan penilai.
3. **Mengaktifkan / Menonaktifkan Akun**:
   * Pegawai yang telah pensiun atau berhenti dapat dinonaktifkan tanpa menghapus riwayat kehadiran historisnya di database.

---

### 4.3 Import Data Pegawai Massal via Excel

Untuk memasukkan puluhan atau ratusan pegawai sekaligus tanpa perlu menginput satu per satu:

```
[Unduh Template Excel] ──► [Isi Data Pegawai] ──► [Unggah File .xlsx] ──► [Selesai dalam 3 Detik]
```

1. Buka menu **"Data Pegawai"** (`/admin/pegawai`).
2. Klik tombol **"Unduh Template Excel"** untuk mengunduh berkas resmi berformat `Template_Data_Pegawai_STIMI.xlsx`.
3. Buka file di Microsoft Excel, lalu isi data sesuai format kolom:
   * Kolom A: `NIP` (Wajib, unik)
   * Kolom B: `Nama Lengkap` (Beserta gelar)
   * Kolom C: `Email`
   * Kolom D: `Unit Kerja / Prodi` (Contoh: Manajemen, Akuntansi, BAAK, BAUK, IT)
   * Kolom E: `Jabatan`
   * Kolom F: `Peran` (`PEGAWAI`, `ATASAN`, atau `ADMIN`)
   * Kolom G: `NIP Atasan` (Masukkan NIP atasan langsung untuk pengaitan otomatis)
   * Kolom H: `Password Awal`
4. Simpan file Excel tersebut.
5. Klik tombol **"Import Excel"** pada aplikasi, pilih file Excel yang telah diisi, lalu klik **"Proses Import"**.
6. Sistem akan memvalidasi data dan menautkan hierarki atasan secara otomatis dalam hitungan detik.

---

### 4.4 Reset Kata Sandi & Pengaturan Status Akun

Jika terdapat pegawai yang lupa kata sandi:
1. Cari nama atau NIP pegawai pada tabel Data Pegawai.
2. Klik tombol **"Reset Password"** (ikon kunci).
3. Masukkan kata sandi baru (minimal 6 karakter) atau pilih opsi *Gunakan Sandi Default*.
4. Konfirmasi perubahan. Berikan kata sandi baru tersebut secara aman kepada pegawai bersangkutan.

---

### 4.5 Konfigurasi Multi-Gedung & Geofencing GPS Kampus

Sistem PRESENSISTIMI versi 1.4.3 mendukung operasional **Multi-Gedung Kampus** (misal: Gedung Rektorat/Pusat, Gedung Perkuliahan A, Kampus Cabang, Lab Terpadu).

Pada menu **"Pengaturan Kampus"** (`/admin/pengaturan`):
1. **Daftar Gedung Kampus**: Admin dapat mendaftarkan beberapa titik gedung sekaligus.
2. **Menentukan Titik Koordinat**:
   * Masukkan nilai **Latitude** (Garis Lintang, misal: `-5.147665`).
   * Masukkan nilai **Longitude** (Garis Bujur, misal: `119.432731`).
   * Atau klik tombol praktis **"Gunakan GPS Saya Saat Ini"** saat Admin berdiri di titik tengah gedung kampus.
3. **Radius Toleransi (Meter)**:
   * Tentukan radius toleransi presensi (standar yang disarankan: **100 meter**).
   * Nilai ini memberi toleransi akurasi GPS smartphone di dalam ruangan gedung tanpa melenceng ke luar area kampus.
4. Klik **"Simpan Pengaturan Gedung"**.

---

### 4.6 Pengaturan Jam Kerja & Batas Toleransi

Admin dapat menyesuaikan jam kerja institusi sewaktu-waktu (misal: penyesuaian jam kerja saat Bulan Suci Ramadhan):
* **Jam Masuk Standar**: Default `08:00 WITA`.
* **Jam Pulang Standar**: Default `16:30 WITA`.
* **Toleransi Keterlambatan (Grace Period)**: Default `15 menit` (kehadiran sebelum 08:15 tetap dihitung Tepat Waktu).
* **Saklar Mode Hari Jumat**: Pengaktifan otomatis kebijakan WFA tanpa geofence pada hari Jumat.

---

### 4.7 Rekapitulasi Laporan Bulanan (Excel Multi-Sheet & Cetak PDF Resmi)

Menu **"Laporan"** (`/admin/laporan`) menyajikan rekapitulasi kehadiran komprehensif yang telah disesuaikan 100% dengan pola kerja resmi STIMI Makassar:

#### A. Fitur Perhitungan Otomatis:
* **Pencegahan Alfa Palsu (*Smart Cutoff*)**: Pada bulan berjalan, tanggal yang belum tiba tidak akan dihitung sebagai Alfa.
* **Integrasi Data Cuti & Sakit**: Pegawai yang cuti/sakit resmi tidak dihitung mangkir.
* **Metrik Komplit**: Menghitung Hari Kerja Efektif, Total Hadir, Hadir WFO, Hadir WFA, Tepat Waktu, Terlambat, Pulang Cepat, Izin, Cuti, Sakit, Alfa, dan Tingkat Kehadiran (%).

#### B. Ekspor Excel Multi-Sheet (.xlsx) Dua Dimensi:
Klik tombol **"Ekspor Excel (.xlsx)"** untuk menghasilkan file terformat rapi dengan 2 lembar kerja:
1. **Sheet 1 (`Rekap Bulanan Pegawai`)**: Rangkuman persentase kehadiran seluruh pegawai dalam 1 bulan, lengkap dengan baris total dan rata-rata institusi.
2. **Sheet 2 (`Log Presensi Harian`)**: Audit mendalam baris demi baris tanggal kehadiran (No, Tanggal, Hari, Mode Kerja, Jam Masuk, Status Masuk, Jam Pulang, Status Pulang, Durasi Kerja, dan Lokasi Kampus).

#### C. Cetak Dokumen PDF Resmi Landscape (A4):
Klik tombol **"Cetak / Simpan PDF"** untuk mencetak dokumen fisik atau menyimpan berkas PDF berstandar arsip resmi:
* Diformat khusus `@page { size: landscape; margin: 8mm; }` agar seluruh kolom laporan tampil penuh tanpa terpotong.
* Dilengkapi **Kop Surat Resmi STIMI Makassar** bergaris ganda.
* Memuat **Kartu Ringkasan KPI Institusi**.
* Memuat **Kolom Tanda Tangan Pengesahan Dua Pihak**: Mengetahui Ketua STIMI Makassar dan Kepala Bagian SDM/Kepegawaian.

---

## BAB V: PANDUAN PEMECAHAN MASALAH (TROUBLESHOOTING & FAQ)

### 5.1 Solusi Masalah Izin Lokasi (GPS Tidak Terbaca / Di Luar Radius)

| Gejala Kendala | Kemungkinan Penyebab | Langkah Solusi Perbaikan |
| :--- | :--- | :--- |
| **"Gagal mendeteksi lokasi"** | GPS HP belum dinyalakan atau izin lokasi peramban diblokir | 1. Buka pengaturan cepat HP, aktifkan ikon **Lokasi/GPS**.<br>2. Pada browser Chrome, ketuk ikon gembok/setelan di sebelah kiri alamat web ➔ pilih **Izin Situs** ➔ setel **Lokasi** menjadi **"Izinkan" (Allow)**.<br>3. Muat ulang (*refresh*) halaman. |
| **"Anda berada di luar radius kampus (misal: 250m)"** | Pegawai berada di luar area kampus atau akurasi GPS sedang melompat | 1. Pastikan Anda sudah berada di dalam lingkungan kampus STIMI.<br>2. Buka aplikasi Google Maps sebentar agar sinyal satelit GPS HP terkunci akurat.<br>3. Kembali ke aplikasi presensi dan tekan tombol refresh lokasi. |
| **Presensi di dalam ruangan bertingkat tidak terbaca** | Sinyal satelit GPS terhalang beton tebal gedung | 1. Dekatkan diri ke jendela atau area yang memiliki ventilasi terbuka sejenak.<br>2. Hubungkan HP ke jaringan Wi-Fi resmi kampus STIMI untuk mempercepat penentuan koordinat asistensi (*A-GPS*). |

---

### 5.2 Solusi Masalah Izin Kamera Peramban (Kamera Hitam / Ditolak)

| Gejala Kendala | Kemungkinan Penyebab | Langkah Solusi Perbaikan |
| :--- | :--- | :--- |
| **Layar kamera hitam atau muncul teks "Izin kamera ditolak"** | Pengguna pernah menekan tombol "Blokir" (*Block*) saat pertama kali membuka web | **Untuk Google Chrome Android**:<br>1. Ketuk ikon titik tiga (⋮) di Chrome ➔ **Setelan** ➔ **Setelan Situs** ➔ **Kamera**.<br>2. Pastikan web presensi STIMI berada di daftar **Diizinkan**.<br><br>**Untuk Safari iPhone (iOS)**:<br>1. Buka aplikasi **Settings** di iPhone ➔ gulir ke **Safari** ➔ pilih **Camera** ➔ ubah menjadi **Allow**.<br>2. Buka kembali Safari dan muat ulang halaman. |
| **Kamera terbuka tetapi menghadap ke belakang (bukan kamera depan)** | Pengaturan peramban default ke kamera utama | Sistem secara otomatis memanggil `facingMode: 'user'`. Jika terjadi kendala pada tipe ponsel tertentu, ketuk ikon ganti kamera yang tersedia di sudut preview video. |

---

### 5.3 Lupa Kata Sandi atau Kendala Masuk Akun

1. Hubungi Petugas Administrator SDM / Kepegawaian STIMI Makassar.
2. Sebutkan NIP dan Nama Lengkap Anda untuk dilakukan verifikasi data.
3. Administrator akan melakukan reset kata sandi melalui menu Admin dalam waktu kurang dari 1 menit.
4. Segera login dengan kata sandi baru tersebut dan ubah demi keamanan pribadi Anda.

---

### 5.4 Presensi Hari Jumat (Mode WFA)

* **Pertanyaan**: *"Apakah di hari Jumat saya harus datang ke kampus untuk presensi?"*
* **Jawaban**: **Tidak perlu.** Hari Jumat ditetapkan sebagai pola *Work From Anywhere* (WFA). Pegawai dapat melakukan presensi selfie dari rumah atau lokasi tugas masing-masing. Sistem akan mencatat kehadiran sebagai `HADIR WFA` secara sah tanpa menolak lokasi GPS Anda.

---

## LEMBAR PENGESAHAN & KONTAK BANTUAN

Buku Pedoman Penggunaan Sistem Presensi Elektronik (**PRESENSISTIMI**) Versi 1.4.3 ini telah diperiksa dan disahkan untuk diberlakukan secara resmi di lingkungan Sekolah Tinggi Ilmu Manajemen Indonesia (STIMI) Makassar.

Disahkan di : **Makassar**  
Pada tanggal : **14 November 2026**

<br>

| Mengetahui, <br> **Ketua STIMI Makassar** | Pengelola Sistem, <br> **Kepala Bagian SDM & TI** |
| :---: | :---: |
| <br><br><br><br> **( .................................................... )** <br> NIP/NIDN. | <br><br><br><br> **( .................................................... )** <br> NIP. |

---

### Layanan Bantuan & Dukungan Teknis (Helpdesk IT):
* **Bagian Kepegawaian (SDM)**: Gedung Rektorat STIMI Makassar, Lantai 1
* **Helpdesk IT & Sistem**: Layanan Administrasi Digital STIMI
* **Email Bantuan**: `sdm@stimi-makassar.ac.id` / `it@stimi-makassar.ac.id`
* **Jam Layanan**: Senin – Jumat, Pukul 08.00 – 16.30 WITA
