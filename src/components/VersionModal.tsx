import React from 'react';
import { X, CheckCircle2, ShieldCheck, Tag, Sparkles, RefreshCw, Zap, Radio, Globe } from 'lucide-react';
import { APP_VERSION, APP_BUILD_DATE, APP_EDITION, VERSION_HISTORY } from '../utils/version';
import { KodamCenderawasihLogo, HestiWiraSaktiLogo } from './MilitaryLogos';

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckForUpdates?: () => void;
  isCheckingUpdate?: boolean;
  checkStatusMessage?: string | null;
  hasUpdate?: boolean;
  onApplyUpdate?: () => void;
  lastCheckTime?: Date;
}

export const VersionModal: React.FC<VersionModalProps> = ({
  isOpen,
  onClose,
  onCheckForUpdates,
  isCheckingUpdate = false,
  checkStatusMessage = null,
  hasUpdate = false,
  onApplyUpdate,
  lastCheckTime,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl max-h-[90vh] flex flex-col bg-[#08150c]/95 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-[#0d2315] via-[#09180e] to-[#040b07] border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <KodamCenderawasihLogo containerClassName="w-9 h-9 aspect-square" />
              <HestiWiraSaktiLogo containerClassName="w-9 h-9 aspect-square" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-yellow-400 font-mono uppercase tracking-wider">
                  Informasi Sistem &amp; Versi
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  v{APP_VERSION} AKTIF
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                SIYANKES KESDAM XVII/CENDERAWASIH • {APP_EDITION}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-200">
          
          {/* Current Version Highlight Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#132c1b]/80 to-[#0a180e]/90 border border-emerald-500/30 shadow-inner">
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold text-white font-mono">
                  SIYANKES Versi {APP_VERSION}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-400 text-black font-extrabold px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3" /> VERSI TERBARU
                </span>
              </div>
              <span className="text-[11px] text-emerald-300 font-mono font-semibold">
                {APP_BUILD_DATE}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed mb-3">
              Pembaruan rilis sistem informasi pelayanan kesehatan dan evakuasi medis terpadu Kesdam XVII/Cenderawasih dengan standar antarmuka taktis militer &amp; deteksi auto-update republish.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[11px] font-mono">
              <div className="bg-black/40 p-2 rounded border border-white/10">
                <span className="text-slate-400 block text-[9px]">ENGINE / FRAMEWORK</span>
                <span className="text-emerald-300 font-bold">React 19 + Vite 8</span>
              </div>
              <div className="bg-black/40 p-2 rounded border border-white/10">
                <span className="text-slate-400 block text-[9px]">TEMA TAKTIS</span>
                <span className="text-yellow-300 font-bold">Loreng Malvinas TNI</span>
              </div>
              <div className="bg-black/40 p-2 rounded border border-white/10 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[9px]">STATUS SISTEM</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  OPERASIONAL
                </span>
              </div>
            </div>
          </div>

          {/* Auto-Update & Republish Synchronizer Section */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#102416]/80 to-[#07130b]/90 border border-yellow-500/30">
            <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-yellow-400 animate-pulse" />
                <h4 className="font-bold text-yellow-300 font-mono text-xs uppercase">
                  Deteksi Otomatis Republish &amp; Pembaruan
                </h4>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Otomatis Real-Time</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
              Saat Anda menekan tombol <strong>Republish</strong> di AI Studio, link yang sudah dibagikan (<span className="text-emerald-300 font-mono">ais-pre-...</span>) akan mendeteksi rilis baru secara otomatis tanpa perlu hard-refresh browser.
            </p>

            {checkStatusMessage && (
              <div className="p-2 mb-2 rounded bg-black/40 border border-yellow-500/30 text-yellow-200 text-[11px] font-mono flex items-center gap-2 animate-in fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping"></span>
                <span>{checkStatusMessage}</span>
              </div>
            )}

            {hasUpdate && onApplyUpdate && (
              <div className="p-3 my-2 rounded-lg bg-yellow-400/15 border border-yellow-400/50 flex items-center justify-between gap-3">
                <span className="text-yellow-300 font-mono text-xs font-bold">
                  Versi baru telah tersedia di server!
                </span>
                <button
                  onClick={onApplyUpdate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-yellow-400 hover:bg-yellow-300 text-black font-mono font-black text-xs shadow-lg transition cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>Muat Ulang Versi Baru</span>
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono pt-2 border-t border-white/10">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-400" />
                Anti-Cache Header: AKTIF
              </span>
              <span>
                Pemeriksaan: {lastCheckTime ? lastCheckTime.toLocaleTimeString('id-ID') : 'Baru saja'}
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('kesdam_evacuation_data_v2');
                    localStorage.removeItem('kesdam_installed_version');
                  } catch {
                    // ignore
                  }
                  window.location.reload();
                }}
                className="w-full py-1.5 px-3 rounded-lg bg-black/40 hover:bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-400/60 text-emerald-300 font-mono text-[10px] flex items-center justify-center gap-2 transition cursor-pointer"
                title="Pulihkan seluruh 84 data pasien dan status kesembuhan master jika tampilan di smartphone sempat tersimpan cache lama"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Segarkan Penuh Data &amp; Pulihkan Status Sembuh Master</span>
              </button>
            </div>
          </div>

          {/* Version History / Release Notes */}
          <div>
            <h4 className="text-xs font-bold text-yellow-400 uppercase font-mono tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Catatan Pembaruan Rilis
            </h4>
            <div className="space-y-3">
              {VERSION_HISTORY.map((item, idx) => (
                <div
                  key={item.version}
                  className={`p-3.5 rounded-lg border transition-all ${
                    idx === 0
                      ? 'bg-[#0c2113]/90 border-emerald-500/40'
                      : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      v{item.version} - {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.date}
                    </span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pl-1">
                    {item.highlights.map((h, hIdx) => (
                      <li key={hIdx} className="leading-relaxed">
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#050e08] border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Hak Cipta &copy; 2026 Kesdam XVII/Cenderawasih</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
