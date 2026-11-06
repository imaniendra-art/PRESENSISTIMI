# 🚀 PANDUAN RAHASIA DEPLOYMENT SERVER (RUNBOOK) — PRESENSISTIMI
**Domain Resmi**: `https://presensi.stimiapps.my.id`  
**Versi**: v1.4.0 (Production Release)  
**Dokumen ini dibuat khusus untuk 1-kali baca saat melakukan Pull & Setup di Komputer Server.**

---

## ⚡ RINGKASAN CEPAT (1-Langkah Eksekusi)

Bagi Administrator Server, Anda cukup menjalankan skrip otomatis yang telah disediakan di folder root repositori:

### Untuk Server Linux / Ubuntu / Debian:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Untuk Server Windows:
```cmd
deploy.bat
```

---

## 📋 PANDUAN MANUAL STEP-BY-STEP (Jika Dijalankan Manual)

### 1. Masuk ke Direktori & Ambil Update Terbaru dari GitHub
```bash
git pull origin main
```

### 2. Konfigurasi File Environment `.env`
Pastikan file `.env` ada di folder root proyek dengan konfigurasi produksi berikut:

```env
# Database MongoDB Atlas
DATABASE_URL="mongodb+srv://iman:iman123@cluster0.aekr80r.mongodb.net/presensistimi?retryWrites=true&w=majority&appName=Cluster0"

# URL Produksi Resmi & Secret Token
NEXTAUTH_URL="https://presensi.stimiapps.my.id"
NEXTAUTH_SECRET="presensistimi-secret-key-32-chars-long-secure-token"

# Pengaturan Kampus STIMI Makassar
NEXT_PUBLIC_CAMPUS_NAME="STIMI Makassar"
DEFAULT_CAMPUS_LAT="-5.147665"
DEFAULT_CAMPUS_LNG="119.432732"
DEFAULT_CAMPUS_RADIUS="100"

# Cloud Hybrid Storage (Supabase)
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-url.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-secret-key"
SUPABASE_STORAGE_BUCKET="presensistimi"
```

### 3. Install Dependensi & Generate Prisma Client
```bash
npm install
npx prisma generate
```

### 4. Build Aplikasi Produksi
```bash
npm run build
```

### 5. Jalankan Service di Latar Belakang (PM2 Daemon)
Agar aplikasi tetap hidup 24 jam nonstop bahkan jika komputer server restart:

```bash
# Install PM2 jika belum ada
npm install -g pm2

# Jalankan server Next.js pada port 3000
pm2 start npm --name "presensi-stimi" -- start

# Simpan state PM2 agar auto-start saat reboot
pm2 save
pm2 startup
```

---

## 🌐 KONEKSIKAN KE CLOUDFLARE (`presensi.stimiapps.my.id`)

Gunakan **Cloudflare Tunnel (cloudflared)**. Cara ini **100% aman, gratis, tanpa perlu IP Publik Statis, tanpa buka port router (zero port forwarding), dan otomatis ber-sertifikat HTTPS/SSL resmi**.

### Opsi A: Menggunakan Dashboard Cloudflare Zero Trust (Sangat Direkomendasikan)
1. Buka [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/) > **Networks** > **Tunnels**.
2. Klik **Create a Tunnel** > beri nama (misal: `stimi-presence-tunnel`).
3. Pilih sistem operasi server Anda (Linux / Windows) dan salin perintah instalasi otomatis `cloudflared` yang diberikan Cloudflare.
4. Pada tab **Public Hostname**:
   - **Subdomain**: `presensi`
   - **Domain**: `stimiapps.my.id`
   - **Type**: `HTTP`
   - **URL**: `localhost:3000`
5. Klik **Save hostname**. Selesai! Web langsung bisa dibuka di `https://presensi.stimiapps.my.id`.

### Opsi B: Menggunakan Cloudflare CLI Langsung di Server
```bash
# Login cloudflare
cloudflared tunnel login

# Buat tunnel baru
cloudflared tunnel create stimi-tunnel

# Hubungkan domain ke port 3000
cloudflared tunnel route dns stimi-tunnel presensi.stimiapps.my.id

# Jalankan tunnel sebagai background service
cloudflared tunnel run stimi-tunnel
```

---

## 🔑 KREDENSIAL PENTING SISTEM

| Akun / Portal | Username / NIP | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Superadmin SDM** | `198001012005011001` | `admin123` | Akses penuh dashboard, monitoring, tambah/edit/hapus pegawai, dan rekap laporan. |
| **Dosen & Tenaga Kependidikan** | `DSN01` s/d `DSN25`, `TNK01` s/d `TNK08` | `password123` | NIP resmi STIMI Makassar hasil import bulk Excel. |
| **Presensi Cepat (Tanpa Login)** | *(Cukup Masukkan NIP)* | *Tanpa Password* | Buka langsung di `https://presensi.stimiapps.my.id/absen-cepat` |

---

## 📍 TAUTAN PENTING APLIKASI
- **Portal Presensi Cepat (Ponsel & Tablet Kiosk)**: `https://presensi.stimiapps.my.id/absen-cepat`
- **Halaman Login Utama**: `https://presensi.stimiapps.my.id/login`
- **Monitoring Kehadiran Real-Time**: `https://presensi.stimiapps.my.id/admin/monitoring`
- **Rekapitulasi & Ekspor Excel / PDF**: `https://presensi.stimiapps.my.id/admin/laporan`
- **Pengaturan Multi-Gedung & Geofence**: `https://presensi.stimiapps.my.id/admin/pengaturan`

---
*PRESENSISTIMI — Sistem Kehadiran Sivitas Akademika STIMI Makassar*
