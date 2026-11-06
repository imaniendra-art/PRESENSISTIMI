#!/bin/bash
# ========================================================
# Script Deployment Otomatis PRESENSISTIMI (Linux Server)
# ========================================================

echo "===================================================="
echo "🚀 Memulai Deployment PRESENSISTIMI..."
echo "===================================================="

# 1. Pastikan file .env ada
if [ ! -f .env ]; then
  echo "⚠️  File .env belum ditemukan, membuat dari template .env.example..."
  cp .env.example .env
fi

# 2. Ambil update terbaru dari git
echo "📥 Menarik kode terbaru dari GitHub..."
git pull origin main

# 3. Install dependensi
echo "📦 Memasang dependensi npm..."
npm install

# 4. Generate Prisma Client
echo "🔄 Sinkronisasi Prisma ORM..."
npx prisma generate

# 5. Build aplikasi Next.js produksi
echo "🏗️  Membangun aplikasi Next.js..."
npm run build

# 6. Jalankan atau restart service PM2
if command -v pm2 &> /dev/null; then
  echo "♻️  Me-restart aplikasi melalui PM2..."
  pm2 restart presensi-stimi || pm2 start npm --name "presensi-stimi" -- start
  pm2 save
  echo "✅ Server Next.js aktif berjalan di latar belakang (PM2)!"
else
  echo "⚠️  PM2 belum terpasang. Menjalankan via npm start..."
  echo "💡 Disarankan install PM2: npm install -g pm2"
  npm start
fi

echo "===================================================="
echo "🎉 DEPLOYMENT SELESAI!"
echo "Aplikasi siap diakses di port 3000 atau via Cloudflare"
echo "URL: https://presensi.stimiapps.my.id"
echo "===================================================="
