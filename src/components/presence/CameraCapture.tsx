'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertTriangle, SwitchCamera, Video } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onRetake: () => void;
  capturedImage: string | null;
  disabled?: boolean;
}

interface VideoDevice {
  deviceId: string;
  label: string;
}

export function CameraCapture({
  onCapture,
  onRetake,
  capturedImage,
  disabled,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [availableDevices, setAvailableDevices] = useState<VideoDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Menghentikan stream kamera aktif
  const stopActiveStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsVideoPlaying(false);
  }, []);

  // Deteksi seluruh perangkat kamera yang terpasang di komputer/HP
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator?.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Kamera ${index + 1}`,
        }));

      setAvailableDevices(videoInputs);

      // Prioritaskan kamera fisik (bukan virtual camera seperti OBS) jika belum ada yang dipilih
      if (!selectedDeviceId && videoInputs.length > 0) {
        const physicalCam = videoInputs.find(
          (d) => !d.label.toLowerCase().includes('obs') && !d.label.toLowerCase().includes('virtual')
        );
        setSelectedDeviceId(physicalCam ? physicalCam.deviceId : videoInputs[0].deviceId);
      }
    } catch (e) {
      console.warn('Gagal mendeteksi daftar perangkat kamera:', e);
    }
  }, [selectedDeviceId]);

  // Mengaktifkan stream kamera
  const startCamera = useCallback(async (targetDeviceId?: string) => {
    stopActiveStream();
    setIsInitializing(true);
    setCameraError(null);
    setIsVideoPlaying(false);

    const deviceIdToUse = targetDeviceId || selectedDeviceId;

    try {
      // 1. Coba dengan constraints spesifik device atau facingMode user
      let mediaStream: MediaStream | null = null;
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceIdToUse
          ? { deviceId: { exact: deviceIdToUse } }
          : {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
      };

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (errFirst) {
        console.warn('Percobaan pertama getUserMedia gagal, mencoba fallback standar:', errFirst);
        // Fallback jika PC/Laptop tidak mendukung facingMode: 'user'
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      }

      streamRef.current = mediaStream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        video.setAttribute('playsinline', 'true');
        video.muted = true;

        // Pasang event listener untuk memastikan rendering frame aktif
        video.onloadedmetadata = async () => {
          try {
            await video.play();
            setIsVideoPlaying(true);
          } catch (playErr) {
            console.warn('Video play() diblokir oleh browser autoplay policy:', playErr);
          }
        };

        video.onplaying = () => {
          setIsVideoPlaying(true);
        };
      }

      // Perbarui label perangkat kamera setelah izin diberikan
      refreshDevices();
    } catch (err: unknown) {
      console.error('Kamera gagal diakses:', err);
      const error = err as { name?: string; message?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError(
          'Izin akses kamera ditolak. Silakan klik ikon gembok/kamera di samping URL browser Anda, lalu izinkan akses kamera.'
        );
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError('Perangkat webcam/kamera tidak ditemukan pada komputer Anda.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setCameraError(
          'Kamera sedang digunakan oleh aplikasi lain (misal Zoom, Meet, atau aplikasi lain). Silakan tutup aplikasi tersebut lalu coba lagi.'
        );
      } else {
        setCameraError('Gagal mengakses kamera. Silakan klik tombol "Coba Akses Lagi".');
      }
    } finally {
      setIsInitializing(false);
    }
  }, [selectedDeviceId, stopActiveStream, refreshDevices]);

  // Efek inisialisasi awal saat komponen dimuat
  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }

    return () => {
      stopActiveStream();
    };
  }, [capturedImage, startCamera, stopActiveStream]);

  // Ganti perangkat kamera
  const handleDeviceChange = (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    startCamera(newDeviceId);
  };

  // Jepret foto selfie
  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Efek cermin horizontal (mirror)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.85);

    // Haptic vibration feedback pada smartphone
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(40);
      } catch {}
    }

    onCapture(base64);

    stopActiveStream();
  };

  // Foto ulang
  const handleResetSnapshot = () => {
    onRetake();
    startCamera();
  };

  // Paksa play jika browser menahan autoplay
  const handleManualPlay = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setIsVideoPlaying(true);
      } catch (e) {
        console.error('Manual play error:', e);
        startCamera();
      }
    } else {
      startCamera();
    }
  };

  // Tampilan jika foto sudah diambil
  if (capturedImage) {
    return (
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md bg-slate-900 w-full max-w-sm mx-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={capturedImage}
          alt="Foto Selfie Presensi"
          className="w-full h-72 sm:h-80 object-cover"
        />
        <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Foto Selfie Terverifikasi</span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleResetSnapshot}
            className="absolute bottom-3 right-3 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl backdrop-blur-md flex items-center gap-1.5 border border-white/20 transition shadow"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Foto Ulang</span>
          </button>
        )}
      </div>
    );
  }

  // Tampilan live kamera - Portrait 3:4 Mobile-Optimized
  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex flex-col items-center justify-center min-h-[300px] w-full max-w-sm mx-auto shadow-inner">
      {cameraError ? (
        <div className="p-6 text-center text-rose-300 max-w-xs">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-rose-400" />
          <p className="text-xs font-semibold leading-relaxed">{cameraError}</p>
          <button
            type="button"
            onClick={() => startCamera()}
            className="mt-3.5 text-xs bg-rose-600 hover:bg-rose-500 border border-rose-400/40 text-white px-4 py-2 rounded-xl transition font-medium shadow-sm"
          >
            Coba Akses Lagi
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-72 sm:h-80 object-cover transform -scale-x-100 ${
              isVideoPlaying ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-300`}
          />

          {/* Loader saat kamera sedang dinyalakan */}
          {(!isVideoPlaying || isInitializing) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-300 gap-3 p-4">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Menghubungkan ke kamera ponsel...</span>
              <button
                type="button"
                onClick={handleManualPlay}
                className="mt-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-emerald-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                Ketuk jika video belum muncul
              </button>
            </div>
          )}

          {/* Overlay Bingkai Wajah Oval + Panduan Posisi */}
          {isVideoPlaying && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-40 h-52 sm:w-44 sm:h-56 border-2 border-dashed border-emerald-400/70 rounded-full flex flex-col items-center justify-end pb-3">
                <span className="bg-black/60 backdrop-blur-xs text-white/90 text-[10px] px-2 py-0.5 rounded-full font-medium">
                  Posisikan Wajah
                </span>
              </div>
            </div>
          )}

          {/* Pilihan Perangkat / Flip Kamera */}
          {availableDevices.length > 1 && (
            <div className="absolute top-3 right-3 z-10">
              <div className="bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-xl px-2 py-1 flex items-center gap-1.5 shadow">
                <SwitchCamera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <select
                  value={selectedDeviceId}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className="bg-transparent text-white text-[11px] font-medium focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[180px] truncate"
                >
                  {availableDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId} className="bg-slate-900 text-white">
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Tombol Jepret Foto Wajah - Mobile Shutter Ring */}
          {isVideoPlaying && !disabled && (
            <div className="absolute bottom-3 inset-x-0 flex justify-center z-10">
              <button
                type="button"
                onClick={handleTakeSnapshot}
                className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 border border-emerald-400/40 transition transform active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Ambil Foto Wajah</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
