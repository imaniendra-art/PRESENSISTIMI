'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { Clock } from 'lucide-react';

interface LiveClockProps {
  className?: string;
  timezone?: string;
}

const emptySubscribe = () => () => {};

export function LiveClock({
  className = '',
  timezone = 'Asia/Makassar',
}: LiveClockProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [time, setTime] = useState<string>('');

  useEffect(() => {
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
      className={`inline-flex items-center gap-1.5 px-2 py-1 bg-white/95 border border-sky-100 rounded-xl shadow-2xs ${className}`}
    >
      <div className="w-5 h-5 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100/60">
        <Clock className="w-3 h-3" />
      </div>
      <span className="text-[11px] sm:text-xs font-bold font-mono text-slate-800 tabular-nums leading-none whitespace-nowrap">
        {isMounted && time ? time : '--:--:--'}
      </span>
    </div>
  );
}
