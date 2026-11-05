import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Akses Dibatasi</h1>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Anda tidak memiliki izin atau hak akses untuk membuka halaman ini. Silakan kembali ke dashboard utama akun Anda.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition duration-150 shadow-md shadow-indigo-200"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
