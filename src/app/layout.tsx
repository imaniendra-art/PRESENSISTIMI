import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PRESENSISTIMI — Sistem Kehadiran Dosen & Tendik',
  description:
    'Sistem presensi kepegawaian modern berbasis geofencing GPS dan kamera selfie real-time untuk sivitas akademika STIMI.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans pb-16 md:pb-0">
        <SessionProvider>
          {children}
          <PwaInstallPrompt />
          <MobileBottomNav />
        </SessionProvider>
      </body>
    </html>
  );
}
