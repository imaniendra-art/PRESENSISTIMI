'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onRetake: () => void;
  capturedImage: string | null;
  disabled?: boolean;
}

export function CameraCapture({
  onCapture,
  onRetake,
  capturedImage,
  disabled,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const stopActiveStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = useCallback(async () => {
    stopActiveStream();
    setIsInitializing(true);
    setCameraError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      console.error('Kamera error:', err);
      const error = err as { name?: string };
      if (error.name === 'NotAllowedError') {
        setCameraError('Izin akses kamera ditolak. Silakan izinkan kamera di browser Anda.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('Kamera tidak ditemukan pada perangkat Anda.');
      } else {
        setCameraError('Gagal mengakses kamera langsung.');
      }
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!capturedImage) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        .then((mediaStream) => {
          if (!isMounted) {
            mediaStream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err: unknown) => {
          if (!isMounted) return;
          console.error('Kamera error:', err);
          const error = err as { name?: string };
          if (error.name === 'NotAllowedError') {
            setCameraError('Izin akses kamera ditolak.');
          } else {
            setCameraError('Gagal mengakses kamera langsung.');
          }
        });
    }

    return () => {
      isMounted = false;
      stopActiveStream();
    };
  }, [capturedImage]);

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.82);
    onCapture(base64);

    stopActiveStream();
  };

  const handleResetSnapshot = () => {
    onRetake();
    startCamera();
  };

  if (capturedImage) {
    return (
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-inner bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={capturedImage}
          alt="Foto Selfie Presensi"
          className="w-full h-64 sm:h-72 object-cover"
        />
        <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Foto Selfie Siap</span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={handleResetSnapshot}
            className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-medium px-3 py-2 rounded-xl backdrop-blur-md flex items-center gap-1.5 border border-white/20 transition shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Foto Ulang</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex flex-col items-center justify-center min-h-[256px]">
      {cameraError ? (
        <div className="p-6 text-center text-rose-300">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-rose-400" />
          <p className="text-xs font-semibold">{cameraError}</p>
          <button
            type="button"
            onClick={startCamera}
            className="mt-3 text-xs bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-white px-3 py-1.5 rounded-lg transition"
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
            className={`w-full h-64 sm:h-72 object-cover transform -scale-x-100 ${
              isInitializing ? 'opacity-0' : 'opacity-100'
            } transition-opacity duration-300`}
          />

          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Mengaktifkan kamera...</span>
            </div>
          )}

          {!isInitializing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-40 h-52 sm:w-44 sm:h-56 border-2 border-dashed border-white/40 rounded-full" />
            </div>
          )}

          {!isInitializing && !disabled && (
            <div className="absolute bottom-3 inset-x-0 flex justify-center">
              <button
                type="button"
                onClick={handleTakeSnapshot}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/50 border border-indigo-400/30 transition transform active:scale-95"
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
