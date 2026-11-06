@echo off
:: ========================================================
:: Script Deployment Otomatis PRESENSISTIMI (Windows Server)
:: ========================================================

echo ====================================================
echo  Memulai Deployment PRESENSISTIMI (Windows)...
echo ====================================================

if not exist .env (
  echo  File .env belum ditemukan, membuat dari template .env.example...
  copy .env.example .env
)

echo  Menarik kode terbaru dari GitHub...
git pull origin main

echo  Memasang dependensi npm...
call npm install

echo  Sinkronisasi Prisma ORM...
call npx prisma generate

echo  Membangun aplikasi Next.js produksi...
call npm run build

where pm2 >nul 2>nul
if %errorlevel% equ 0 (
  echo  Me-restart aplikasi melalui PM2...
  call pm2 restart presensi-stimi || call pm2 start npm --name "presensi-stimi" -- start
  call pm2 save
  echo  Server Next.js aktif berjalan di latar belakang!
) else (
  echo  PM2 belum terpasang. Menjalankan via npm start...
  call npm start
)

echo ====================================================
echo  DEPLOYMENT SELESAI!
echo  URL: https://presensi.stimiapps.my.id
echo ====================================================
pause
