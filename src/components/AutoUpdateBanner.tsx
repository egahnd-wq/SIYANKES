import React from 'react';
import { RefreshCw, Zap, Clock, ShieldCheck, X } from 'lucide-react';
import { ServerVersionInfo } from '../utils/useAutoUpdater';

interface AutoUpdateBannerProps {
  hasUpdate: boolean;
  serverVersion: ServerVersionInfo | null;
  countdown: number | null;
  isDismissed: boolean;
  onApplyUpdate: () => void;
  onDismiss: () => void;
}

export const AutoUpdateBanner: React.FC<AutoUpdateBannerProps> = ({
  hasUpdate,
  serverVersion,
  countdown,
  isDismissed,
  onApplyUpdate,
  onDismiss,
}) => {
  if (!hasUpdate) return null;

  return (
    <aside 
      aria-label="Pemberitahuan Pembaruan Sistem"
      className="relative z-50 bg-gradient-to-r from-[#17381b] via-[#244f2b] to-[#143319] border-b-2 border-yellow-400 text-white shadow-xl px-4 py-2.5 sm:px-6 transition-all animate-in slide-in-from-top-4 duration-300 no-print"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left Section: Icon & Info */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex items-center justify-center p-2 rounded-lg bg-yellow-400/20 border border-yellow-400/50 text-yellow-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-yellow-300 text-xs sm:text-sm tracking-wide uppercase">
                Pembaruan Sistem Siap Diterapkan
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-yellow-400 text-black shadow-sm">
                RILIS v{serverVersion?.version || 'TERBARU'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-200 font-sans leading-tight mt-0.5">
              Republish baru terdeteksi di server. Sistem akan menyinkronkan berkas &amp; tampilan terbaru secara bersih.
            </p>
          </div>
        </div>

        {/* Right Section: Countdown & Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 w-full md:w-auto flex-wrap">
          {countdown !== null && countdown > 0 && !isDismissed && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-yellow-400/30 text-yellow-200 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 animate-pulse text-yellow-400" />
              <span>Memperbarui dalam <strong className="text-white text-sm">{countdown}s</strong></span>
            </div>
          )}

          <button
            onClick={onApplyUpdate}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-mono font-black text-xs transition-all shadow-lg shadow-yellow-400/20 hover:scale-105 cursor-pointer"
            title="Muat ulang halaman untuk memuat versi rilis terbaru tanpa cache"
          >
            <Zap className="w-4 h-4 fill-black" />
            <span>Perbarui Sekarang</span>
          </button>

          {!isDismissed && countdown !== null && (
            <button
              onClick={onDismiss}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white text-xs font-medium border border-white/15 transition cursor-pointer"
              title="Tunda pembaruan otomatis jika sedang menginput berkas"
            >
              <span>Tunda</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
