'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, User, Lock, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await signIn('credentials', {
        nip: nip.trim(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
      } else if (res?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage('Terjadi kesalahan koneksi. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  const fillQuickAccount = (quickNip: string, quickPass: string) => {
    setNip(quickNip);
    setPassword(quickPass);
    setErrorMessage('');
  };

  return (
    <div className="w-full max-w-md">
      {/* Header Institusi */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-3">
          <Image
            src="/logo-dark.png"
            alt="Logo STIMI Makassar"
            width={84}
            height={84}
            priority
            className="w-20 h-20 sm:w-22 sm:h-22 object-contain drop-shadow-md"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          PRESENSI<span className="text-indigo-400">STIMI</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Sistem Kehadiran Dosen & Tenaga Kependidikan
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Tombol Pintas Presensi Cepat Tanpa Login */}
        <div className="mb-6 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              Presensi Cepat di Kantor
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-semibold">
              Cukup NIP & Selfie
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            Sedang di kampus? Anda dapat langsung absen masuk atau pulang tanpa perlu login akun.
          </p>
          <Link
            href="/absen-cepat"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 transition group cursor-pointer"
          >
            <Zap className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>⚡ Buka Presensi Cepat (NIP & Selfie)</span>
          </Link>
        </div>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-transparent px-3 text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0">
            atau Masuk Akun Pegawai / Admin
          </span>
          <div className="border-t border-white/10 w-full" />
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Masuk ke Akun</h2>
          <p className="text-slate-300 text-xs mt-1">
            Gunakan NIP dan kata sandi resmi STIMI Anda
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-200 text-xs leading-relaxed animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Nomor Induk Pegawai (NIP)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="Contoh: DOSEN001"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition duration-150 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Masuk Sistem</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <p className="text-[11px] font-medium text-slate-400 mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Pilih Akun Demo Cepat (Klik untuk Isi Otomatis):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillQuickAccount('ADMIN001', 'adminstimi123')}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-400/40 rounded-lg text-[11px] font-medium text-slate-200 transition text-center"
            >
              👑 HRD Admin
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('ATASAN001', 'atasan123')}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-400/40 rounded-lg text-[11px] font-medium text-slate-200 transition text-center"
            >
              👔 Atasan / Kaprodi
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('DOSEN001', 'dosen123')}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-400/40 rounded-lg text-[11px] font-medium text-slate-200 transition text-center"
            >
              🎓 Dosen / Staf
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-500 mt-6">
        &copy; {new Date().getFullYear()} Sekolah Tinggi Ilmu Manajemen Indonesia (STIMI). Seluruh Hak Cipta Dilindungi.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 sm:p-6">
      <Suspense fallback={<div className="text-white text-xs">Memuat formulir masuk...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
