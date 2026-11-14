'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { updateProfile, changePassword } from '@/actions/profileActions';
import {
  User,
  Mail,
  Phone,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Camera,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Building2,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface UserProfileData {
  id: string;
  nip: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  jabatan: string;
  unitKerja: string;
  avatarUrl: string | null;
  assignedLocationName?: string | null;
  assignedLocationAddress?: string | null;
  atasanName?: string | null;
  createdAt: string;
}

interface ProfileEditorProps {
  initialUser: UserProfileData;
}

export function ProfileEditor({ initialUser }: ProfileEditorProps) {
  const router = useRouter();

  // State untuk Data Kontak & Avatar
  const [email, setEmail] = useState(initialUser.email || '');
  const [phone, setPhone] = useState(initialUser.phone || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialUser.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Status Form Profil
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State untuk Ganti Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status Form Password
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Pilih File Avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileMessage({ type: 'error', text: 'File yang dipilih harus berupa gambar (JPG, PNG, atau WebP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'Ukuran foto maksimal 5 MB.' });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Update Profil & Kontak
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('phone', phone);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const res = await updateProfile(formData);
    setIsSavingProfile(false);

    if (res.success) {
      setProfileMessage({ type: 'success', text: res.message });
      if (res.avatarUrl) {
        setAvatarPreview(res.avatarUrl);
      }
      setAvatarFile(null);
      router.refresh();
    } else {
      setProfileMessage({ type: 'error', text: res.message });
    }
  };

  // Submit Ganti Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPassword(true);
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setIsSavingPassword(false);
      setPasswordMessage({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsSavingPassword(false);
      setPasswordMessage({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }

    const formData = new FormData();
    formData.append('currentPassword', currentPassword);
    formData.append('newPassword', newPassword);
    formData.append('confirmPassword', confirmPassword);

    const res = await changePassword(formData);
    setIsSavingPassword(false);

    if (res.success) {
      setPasswordMessage({ type: 'success', text: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      router.refresh();
    } else {
      setPasswordMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Kartu Header Profil & Avatar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar & Tombol Upload */}
          <div className="relative group shrink-0">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-slate-100 border-2 border-slate-200 shadow-md">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt={initialUser.name}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-extrabold text-3xl uppercase tracking-wider">
                  {initialUser.name.slice(0, 2)}
                </div>
              )}
            </div>

            {/* Tombol Kamera / Ganti Foto */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white shadow-lg shadow-sky-600/30 transition cursor-pointer border-2 border-white"
              title="Unggah / Ganti Foto Profil"
            >
              <Camera className="w-4 h-4" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Info Pegawai Singkat */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {initialUser.name}
              </h1>
              <span
                className={`self-center sm:self-auto text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  initialUser.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : initialUser.role === 'ATASAN'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                }`}
              >
                {initialUser.role}
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-700 font-mono">
              No. ID: <span className="text-sky-700">{initialUser.nip}</span>
            </p>

            <p className="text-xs text-slate-600 mt-1 font-medium">
              {initialUser.jabatan} • {initialUser.unitKerja}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {initialUser.assignedLocationName || 'Fleksibel (Semua Gedung)'}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <Calendar className="w-4 h-4 text-slate-400" />
                Terdaftar: {initialUser.createdAt}
              </span>
            </div>
          </div>
        </div>

        {avatarFile && (
          <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between text-xs text-sky-800">
            <span>Foto baru telah dipilih ({avatarFile.name}). Klik <b>&quot;Simpan Perubahan Kontak & Foto&quot;</b> di bawah untuk menyimpan.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form Informasi Kontak & Data Kepegawaian (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Form Edit Kontak */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-7">
            <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Informasi Kontak & Foto</h2>
                <p className="text-[11px] text-slate-500">Perbarui email dan nomor WhatsApp Anda untuk notifikasi</p>
              </div>
            </div>

            {profileMessage && (
              <div
                className={`mb-5 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alamat Email Pribadi / Kampus
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@stimi.ac.id atau email@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl text-xs font-medium text-slate-800 transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Digunakan untuk pemberitahuan persetujuan cuti dan konfirmasi kehadiran.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor HP / WhatsApp Aktif
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl text-xs font-medium text-slate-800 transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Kontak darurat yang dapat dihubungi oleh atasan atau bagian SDM.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full sm:w-auto px-5 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Profil...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan Kontak & Foto</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Kartu Informasi Resmi Kepegawaian (Read-Only) */}
          <div className="bg-slate-50/80 rounded-3xl border border-slate-200/80 p-6 sm:p-7">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Data Resmi Penugasan STIMI YAPMI</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">No. ID Pegawai</span>
                <span className="font-bold text-slate-800 font-mono text-sm">{initialUser.nip}</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Unit Kerja / Prodi</span>
                <span className="font-bold text-slate-800 truncate block">{initialUser.unitKerja}</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Jabatan Struktural/Fungsional</span>
                <span className="font-bold text-slate-800 truncate block">{initialUser.jabatan}</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Atasan / Pejabat Penilai</span>
                <span className="font-bold text-slate-800 truncate block">
                  {initialUser.atasanName || 'Pimpinan Utama / Langsung'}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-4 italic">
              * Jika ada kekeliruan pada nama, gelar, jabatan, atau penugasan gedung resmi, harap mengajukan permohonan koreksi ke Bagian Kepegawaian / SDM STIMI.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Form Ganti Kata Sandi (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-7">
            <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Ubah Kata Sandi (Password)</h2>
                <p className="text-[11px] text-slate-500">Ganti password default untuk menjaga privasi akun Anda</p>
              </div>
            </div>

            {passwordMessage && (
              <div
                className={`mb-5 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Password Lama */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi Saat Ini (Lama)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Masukkan password saat ini"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs font-medium text-slate-800 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi Baru (Min. 6 Karakter)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Buat password baru yang kuat"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs font-medium text-slate-800 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password Baru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Ketik ulang kata sandi baru"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-xs font-medium text-slate-800 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memperbarui Sandi...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Perbarui Kata Sandi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
