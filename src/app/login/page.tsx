'use client';

import { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, User, Lock, AlertCircle, Zap } from 'lucide-react';

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

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header Institusi - Biru Langit (#87CEEB) */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center mb-3">
          <Image
            src="/logo.png"
            alt="Logo STIMI Makassar"
            width={72}
            height={72}
            priority
            className="w-16 h-16 sm:w-18 sm:h-18 object-contain drop-shadow-xs"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          PRESENSI<span className="text-sky-600">STIMI</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-[11px] font-bold tracking-wider uppercase mt-1">
          PORTAL KEHADIRAN STIMI YAPMI MAKASSAR
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Tombol Pintas Absen Cepat Tanpa Login */}
        <Link
          href="/absen-cepat"
          className="w-full mb-6 py-3.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-950/20 transition group cursor-pointer"
        >
          <Zap className="w-4 h-4 text-sky-200 group-hover:scale-110 transition-transform" />
          <span>Absen Cepat</span>
        </Link>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0">
            atau Masuk Akun Pegawai / Admin
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Masuk ke Akun</h2>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs leading-relaxed animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nomor ID (No. ID)
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
                placeholder="Masukkan No. ID (contoh: DSN01, TNK01)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition duration-150 shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 mt-2 cursor-pointer"
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
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 mt-6">
        &copy; {new Date().getFullYear()} Sekolah Tinggi Ilmu Manajemen Indonesia (STIMI) YAPMI Makassar. Seluruh Hak Cipta Dilindungi.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <Suspense fallback={<div className="text-slate-600 text-xs">Memuat formulir masuk...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
