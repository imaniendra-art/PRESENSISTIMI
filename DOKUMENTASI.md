# Dokumentasi Teknis — PRESENSISTIMI

Selamat datang di dokumentasi resmi sistem presensi kepegawaian **PRESENSISTIMI**. Dokumen ini merangkum arsitektur, alur data, formula geofencing, sistem keamanan, dan panduan konfigurasi.

---

## 1. Arsitektur Sistem

Aplikasi ini dibangun menggunakan arsitektur monolitik modern berbasis **Next.js 15 App Router** dengan **React 19 Server Components (RSC)** dan **Server Actions**.

```
                        ┌───────────────────────────────┐
                        │     PWA Client (Browser)      │
                        │  - Geolocation API (GPS)      │
                        │  - MediaDevices (Live Camera) │
                        └───────────────┬───────────────┘
                                        │ HTTPS / Server Action
                                        ▼
                        ┌───────────────────────────────┐
                        │     Next.js 15 Application    │
                        │  - Middleware Route Guard     │
                        │  - Haversine Geofence Engine  │
                        │  - Image Compressor Pipeline  │
                        │  - Auth.js Session Handler    │
                        └───────────────┬───────────────┘
                                        │ Prisma ORM
                                        ▼
                        ┌───────────────────────────────┐
                        │       MongoDB Database        │
                        │  - Users, Attendances         │
                        │  - Leaves, DutyTrips          │
                        │  - CampusSettings             │
                        └───────────────────────────────┘
```

---

## 2. Mekanisme Geofencing (Formula Haversine)

Untuk memvalidasi apakah pegawai berada di dalam radius toleransi kampus STIMI, server melakukan perhitungan trigonometri lingkaran lengkung bumi (Haversine) menggunakan koordinat garis lintang (*latitude*) dan garis bujur (*longitude*):

$$\Delta\text{lat} = \text{lat}_2 - \text{lat}_1$$
$$\Delta\text{lng} = \text{lng}_2 - \text{lng}_1$$
$$a = \sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1) \cdot \cos(\text{lat}_2) \cdot \sin^2\left(\frac{\Delta\text{lng}}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$d = R \cdot c$$

Di mana:
* $R = 6.371.000$ meter (Radius rata-rata bumi).
* $d$ = Jarak fisik antara posisi perangkat dan titik pusat kampus STIMI dalam satuan meter.
* Jika $d \le \text{radiusMeters}$ (misal: 100 meter), transaksi presensi dinyatakan sah di dalam kampus.

---

## 3. Alur Presensi Kamera Real-Time (Anti-Galeri)

1. Antarmuka menggunakan elemen `<video>` yang dihubungkan langsung ke `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })`.
2. Tombol unggah galeri `<input type="file">` ditiadakan untuk mencegah pegawai menggunakan foto lama atau foto orang lain.
3. Saat tombol **"Ambil Foto & Presensi"** ditekan, frame aktif video digambar ke elemen `<canvas>`, dikonversi menjadi data gambar base64 atau Blob WebP, dan langsung dikirim ke Server Action.
4. Server menyimpan file gambar ke direktori publik terproteksi `/uploads/selfie/` dengan nama unik terenkripsi (UUID + Timestamp).

---

## 4. Matriks Akses Peran (RBAC)

| Modul & Fitur | Pegawai / Dosen | Atasan / Pejabat Penilai | Admin / HRD SDM |
| :--- | :---: | :---: | :---: |
| Presensi Masuk & Pulang (Selfie + GPS) | Ya | Ya | Ya |
| Riwayat Presensi Pribadi | Ya | Ya | Ya |
| Pengajuan Cuti / Izin / Sakit | Ya | Ya | Ya |
| Pengajuan Dinas Luar Kota | Ya | Ya | Ya |
| Review & Approval Cuti Staf Binaan | Tidak | **Ya** | Ya (Opsional) |
| Review & Approval Dinas Luar Staf | Tidak | **Ya** | Ya (Opsional) |
| Manajemen Data Master Pegawai | Tidak | Tidak | **Ya** |
| Pengaturan Koordinat & Geofence Kampus | Tidak | Tidak | **Ya** |
| Rekapitulasi & Ekspor Laporan Excel/PDF | Tidak | Pantau Tim Sendiri | **Ya (Semua Pegawai)** |

---

## 5. Variabel Lingkungan (*Environment Variables*)

File `.env` standar proyek:

```env
# Koneksi Database MongoDB
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/presensistimi?retryWrites=true&w=majority"

# NextAuth / Auth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret-random-key-ganti-di-produksi-minimal-32-karakter"

# Pengaturan Default Awal Kampus (Akan disimpan ke MongoDB)
NEXT_PUBLIC_CAMPUS_NAME="STIMI"
DEFAULT_CAMPUS_LAT="-3.3186"
DEFAULT_CAMPUS_LNG="114.5944"
DEFAULT_CAMPUS_RADIUS="100"
```

---

## 6. Prosedur Instalasi & Menjalankan Aplikasi

1. **Instalasi Dependensi**:
   ```bash
   npm install
   ```
2. **Sinkronisasi Skema Prisma ke MongoDB**:
   ```bash
   npx prisma db push
   ```
3. **Menjalankan Server Pengembangan**:
   ```bash
   npm run dev
   ```
4. Buka peramban pada `http://localhost:3000`.
