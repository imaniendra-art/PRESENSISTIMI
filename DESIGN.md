# PRESENSISTIMI — Dokumen Desain & Orkestrasi Skill

Dokumen ini merupakan cetak biru arsitektur teknis dan panduan orkestrasi multi-skill untuk pengembangan sistem presensi kepegawaian institusi STIMI.

---

## 1. Ringkasan Pemahaman
* **Tujuan**: Membangun sistem presensi Web/PWA mandiri yang mengutamakan kecepatan akses, pencegahan manipulasi lokasi (*anti-fake GPS*), dan transparansi kehadiran dosen serta staf STIMI.
* **Audiens Utama**: Dosen Tetap/LB, Staf/Tenaga Kependidikan, Atasan/Pejabat Penilai, dan Admin HRD SDM STIMI.
* **Alur Inti**: Autentikasi NIP $\rightarrow$ Verifikasi Geolocation Kampus $\rightarrow$ Jepretan Kamera Selfie Real-Time $\rightarrow$ Server Action Persetujuan $\rightarrow$ Rekapitulasi Otomatis.
* **Non-Goals (v1.0)**: Tidak mengelola absensi perkuliahan mahasiswa atau perhitungan slip gaji otomatis.

---

## 2. Arsitektur Teknis & Delegasi Skill Ekosistem

```
                  [ PWA Client (Next.js 15 App Router) ]
                                    │
               ┌────────────────────┼────────────────────┐
               ▼                    ▼                    ▼
        [ Auth.js RBAC ]   [ Camera & Geo API ]   [ Server Actions ]
               │                    │                    │
               └────────────────────┼────────────────────┘
                                    ▼
                         [ Haversine Geo Engine ]
                                    │
                                    ▼
                      [ Prisma ORM (MongoDB Atlas) ]
```

### Pemetaan Delegasi Skill
* **Frontend & Rendering (`senior-frontend`, `tailwind-expert`)**: Next.js 15 App Router dengan Server Components secara default, dan Client Components hanya pada bagian interaktif seperti `<CameraCapture />` dan `<GeolocationTracker />`.
* **Database & Data Layer (`database-orm-expert`)**: Skema Prisma deklaratif dengan konektor MongoDB, model relasi hirarkis Atasan-Bawahan, dan index komposit `[userId, date]`.
* **Keamanan & Otorisasi (`authentication-identity-expert`)**: NextAuth / Auth.js dengan strategi kredensial NIP, password hash bcrypt, dan perlindungan rute menggunakan Next.js Middleware.
* **Pelaporan & Ekspor (`pdf-document-generation-expert`)**: Pustaka ekspor file tabular (ExcelJS / SheetJS) dan template cetak rekap kehadiran resmi format PDF.
* **Penegakan Kode Bersih & Hardening (`anti-slop`, `production-ready-hardener`)**: Eliminasi kode dummy/placeholder, verifikasi TypeScript ketat, dan penanganan error komprehensif.

---

## 3. Arsitektur Komponen & Batasan Klien/Server

| Komponen | Tipe | Tanggung Jawab |
| :--- | :---: | :--- |
| `layout.tsx` | Server (RSC) | Pemuatan sesi pengguna, render navigasi & cangkang layout PWA. |
| `PresensiCard.tsx` | Client | Mengontrol status clock-in hari ini, trigger aktivasi kamera dan GPS. |
| `CameraCapture.tsx` | Client | Akses `navigator.mediaDevices.getUserMedia`, stream video dan frame snapshot. |
| `GeolocationStatus.tsx` | Client | Menampilkan koordinat live dan indikator status dalam/luar radius kampus. |
| `AdminCampusSettingForm.tsx`| Client | Form interaktif update titik koordinat dan radius geofence. |
| `rekapActions.ts` | Server Action| Mengambil data kehadiran teragregasi dan menghasilkan file download. |
| `presenceActions.ts` | Server Action| Validasi jarak Haversine di sisi server, kompresi foto, dan penulisan ke DB. |

---

## 4. Log Keputusan Arsitektur (*Decision Log*)

| # | Keputusan | Alternatif Dipertimbangkan | Alasan Pemilihan & Prinsip Modern | Skill Orkestrasi |
|---|---|---|---|---|
| **1** | Next.js 15 App Router (Monolitik Fullstack) | Backend Express + Frontend Vite SPA terpisah | Efisiensi deployment, keamanan Server Actions, serta kemudahan integrasi PWA dalam 1 repositori. | `senior-frontend`, `js-backend-expert` |
| **2** | MongoDB + Prisma ORM | PostgreSQL Relasional murni | Permintaan spesifik institusi, performa tinggi untuk penulisan *event logs* kehadiran harian, dan fleksibilitas metadata. | `database-orm-expert` |
| **3** | Validasi Kamera Real-Time (WebRTC stream) | Input File `<input type="file">` | Mencegah kecurangan pegawai mengunggah foto lama dari galeri ponsel (*anti-spoofing*). | `senior-frontend` |
| **4** | Validasi Geofence Sisi Server | Validasi GPS hanya di browser klien | Menghalangi manipulasi koordinat oleh aplikasi *Fake GPS* atau modifikasi request di sisi klien. | `production-ready-hardener` |
| **5** | Jam Kerja Tetap & Dinamis di Dashboard | *Hardcoded* di dalam kode program | Memberikan fleksibilitas bagi HRD untuk memperbarui jam kerja dan koordinat kampus tanpa deploy ulang. | `prd-architect` |

---

## 5. Analisis Risiko & Mitigasi

* **Risiko 1: Akurasi GPS Lemah di Dalam Ruangan (*GPS Drift*)**  
  *Mitigasi*: Menetapkan toleransi radius default sebesar 100 meter dan menambahkan pemeriksaan akurasi perangkat (`coords.accuracy < 100m`) sebelum menolak presensi.
* **Risiko 2: Ukuran Foto Selfie Membengkak**  
  *Mitigasi*: Kompresi gambar di sisi klien sebelum transmisi dan konversi ke WebP di server (target $\le 150$ KB per foto).
* **Risiko 3: Manipulasi Jam di Ponsel Pegawai**  
  *Mitigasi*: Waktu kehadiran selalu ditentukan secara mutlak oleh jam server (*server timestamp*), bukan jam perangkat lokal pegawai.
