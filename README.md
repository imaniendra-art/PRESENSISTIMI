# PRESENSISTIMI — Sistem Presensi Elektronik STIMI Makassar

Platform presensi dan manajemen kehadiran kepegawaian modern berbasis Web dan PWA (*Progressive Web App*) untuk Dosen dan Tenaga Kependidikan di lingkungan **Sekolah Tinggi Ilmu Manajemen Indonesia (STIMI) Makassar**.

---

## 📚 Dokumentasi & Buku Pedoman Resmi

1. **[Buku Pedoman Penggunaan (User Manual)](./PANDUAN_PENGGUNA.md)**: Panduan operasional lengkap untuk Dosen/Staf, Pejabat Penilai, dan Admin SDM (Termasuk troubleshooting izin GPS/Kamera).
2. **[Dokumentasi Arsitektur Teknis](./DOKUMENTASI.md)**: Arsitektur sistem Next.js 15, formula Haversine geofence, pipeline WebP, dan RBAC.
3. **[Product Requirements Document (PRD)](./PRD.md)**: Spesifikasi kebutuhan fungsional dan sasaran proyek.
4. **[Development Roadmap](./ROADMAP.md)**: Pelacak tahapan dan progres fase pengerjaan sistem.
5. **[Changelog](./CHANGELOG.md)**: Riwayat perubahan versi dan rilis pembaruan.
6. **[Panduan Deployment Server](./SERVER_DEPLOY_GUIDE.md)**: Langkah instalasi dan penyiapan server VPS / PM2 / NGINX di lingkungan produksi.

---

## ⚡ Fitur Utama

- **Presensi GPS Geofencing (Formula Haversine)**: Validasi posisi fisik perangkat terhadap radius toleransi resmi kampus secara *server-side*.
- **Kamera Selfie Real-Time (Anti-Galeri)**: Pengambilan foto wajah langsung via WebRTC untuk mencegah pemalsuan foto.
- **Absen Cepat & Kiosk Lobi (`/absen-cepat` / `/kiosk`)**: Presensi kilat satu layar (*single-screen / zero-scroll*) tanpa perlu login akun pribadi, cukup ketik NIP dan jepret wajah dengan auto-reset 4 detik.
- **Pola Kerja Institusi Terpadu**: Mode WFO (Senin–Kamis), Mode WFA (Jumat fleksibel), dan Penugasan Dinas Luar.
- **Modul Pengajuan & Approval Digital**: Alur persetujuan cuti tahunan, izin sakit, dan surat tugas dinas luar kota tanpa kertas.
- **Rekapitulasi Laporan Multi-Sheet Excel & Cetak PDF Resmi**: Format cetak landscape A4 dengan kop surat STIMI Makassar dan tanda tangan pengesahan pimpinan.
- **Multi-Gedung & Hybrid Cloud Storage**: Dukungan titik koordinat banyak kampus serta kompresi cerdas WebP via Sharp ke Supabase Storage.

---

## 🛠️ Menjalankan Proyek di Lingkungan Lokal

```bash
# 1. Pasang dependensi
npm install

# 2. Sinkronkan skema Prisma ke database MongoDB
npx prisma db push

# 3. Jalankan server pengembangan
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) pada peramban web Anda.

---

## 📄 Lisensi & Hak Cipta
Hak Cipta © 2026 STIMI Makassar. Seluruh hak cipta dilindungi undang-undang.
