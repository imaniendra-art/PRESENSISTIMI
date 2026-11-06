'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, Share2, PlusSquare, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Daftarkan Service Worker hanya di domain produksi (bukan localhost)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.');

      if (!isLocalhost && process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('✅ Service Worker PRESENSISTIMI aktif:', reg.scope);
          })
          .catch((err) => {
            console.warn('Service Worker registration skipped:', err);
          });
      } else {
        // Hapus Service Worker di lingkungan localhost agar tidak menimbulkan ERR_FAILED
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
      }
    }

    // 2. Cek apakah sudah dalam mode standalone (sudah terinstal)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return; // Sudah terpasang, tidak perlu tampilkan prompt
    }

    // 3. Cek apakah user pernah menolak dalam 3 hari terakhir
    const dismissedTime = localStorage.getItem('presensi_pwa_dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 3 * 24 * 60 * 60 * 1000) {
      return;
    }

    // 4. Deteksi iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice) {
      setIsIos(true);
      // Tampilkan banner setelah jeda sejenak (2 detik) agar tidak mengagetkan
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }

    // 5. Tangkap event beforeinstallprompt untuk Android / Chromium / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('presensi_pwa_dismissed', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Prompt Pemasangan Aplikasi"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-up"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl border border-indigo-500/30 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="relative w-12 h-12 shrink-0 bg-white/10 rounded-2xl p-1 flex items-center justify-center border border-white/15">
            <Image
              src="/logo-dark.png"
              alt="Logo STIMI Makassar"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 leading-snug">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              Pasang PRESENSISTIMI di HP
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Buka aplikasi lebih cepat langsung dari layar utama handphone Anda layaknya aplikasi native.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            title="Tutup banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Panduan Khusus iOS Safari */}
        {showIosGuide && (
          <div className="p-3 bg-white/10 rounded-2xl text-[11px] text-slate-200 space-y-1.5 border border-white/10">
            <p className="font-bold text-indigo-300">Cara pasang di iPhone / iPad:</p>
            <p className="flex items-center gap-1.5">
              1. Ketuk tombol <Share2 className="w-3.5 h-3.5 text-indigo-400 inline" /> <strong>Share</strong> di bilah bawah Safari.
            </p>
            <p className="flex items-center gap-1.5">
              2. Gulir ke bawah lalu pilih <PlusSquare className="w-3.5 h-3.5 text-indigo-400 inline" /> <strong>Add to Home Screen</strong>.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-medium transition"
          >
            Nanti Saja
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isIos ? 'Petunjuk Pasang' : 'Pasang Aplikasi'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
