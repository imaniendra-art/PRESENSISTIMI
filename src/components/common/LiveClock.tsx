'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface LiveClockProps {
  className?: string;
  timezone?: string;
  tzLabel?: string;
}

export function LiveClock({
  className = '',
  timezone = 'Asia/Makassar',
  tzLabel = 'WITA',
}: LiveClockProps) {
  const [time, setTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      try {
        const str = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: timezone,
          hour12: false,
        });
        setTime(str);
      } catch {
        const str = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
        setTime(str);
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [timezone]);

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 bg-white/95 border border-sky-100 rounded-2xl shadow-2xs ${className}`}
    >
      <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100/60">
        <Clock className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1 leading-none">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
            Live {tzLabel}
          </span>
        </div>
        <span className="text-xs font-black font-mono text-slate-900 tabular-nums leading-tight mt-0.5 whitespace-nowrap">
          {mounted && time ? time : '--:--:--'}
        </span>
      </div>
    </div>
  );
}
