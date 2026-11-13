import React, { useState, useRef, useEffect } from 'react';
import { Plus, RefreshCw, Wand2, FileSpreadsheet, LogIn, LogOut, UserCheck, UserPlus, Palette, Sun, RotateCcw } from 'lucide-react';
import { SyncConfig } from '../types/evacuation';
import { APP_VERSION } from '../utils/version';

interface SubNavbarProps {
  totalCount: number;
  filteredCount: number;
  onNewLetter: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onResetFilters: () => void;
  onAutoCorrectAll?: () => void;
  isFiltered: boolean;
  syncConfig?: SyncConfig;
  onOpenSyncModal?: () => void;
  onQuickSync?: () => void;
  isSyncing?: boolean;
  onOpenVersionModal?: () => void;
  onOpenWallpaperModal?: () => void;
  brightness?: number;
  onChangeBrightness?: (val: number) => void;
  isMultiDeviceConnected?: boolean;
  user: any;
  role: string;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenUserManagement: () => void;
  onToggleLeftMenu?: () => void;
}

export const SubNavbar: React.FC<SubNavbarProps> = ({
  totalCount,
  filteredCount,
  onNewLetter,
  onPrint,
  onDownload,
  onResetFilters,
  onAutoCorrectAll,
  isFiltered,
  syncConfig,
  onOpenSyncModal,
  onQuickSync,
  isSyncing = false,
  onOpenVersionModal,
  onOpenWallpaperModal,
  brightness = 100,
  onChangeBrightness,
  isMultiDeviceConnected = true,
  user,
  role,
  onOpenLogin,
  onLogout,
  onOpenUserManagement,
  onToggleLeftMenu,
}) => {
  const isLoggedIn = user && role !== 'guest';
  const [isBrightnessOpen, setIsBrightnessOpen] = useState(false);
  const brightnessRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isBrightnessOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (brightnessRef.current && !brightnessRef.current.contains(e.target as Node)) {
        setIsBrightnessOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBrightnessOpen]);

  return (
    <div className="relative z-40 bg-transparent px-2 sm:px-3 md:px-4 py-2.5 flex flex-wrap justify-between items-center gap-3 text-xs no-print">
      <div className="flex flex-wrap items-center gap-2.5">

        {/* REAL-TIME BADGE: BUKA PENGATURAN & PERBAIKAN GOOGLE SHEETS */}
        {onOpenSyncModal ? (
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg box-3d-card bg-[#0d2113]/85 hover:bg-emerald-950/90 text-emerald-300 hover:text-yellow-300 transition cursor-pointer group shadow-md border border-emerald-500/35 hover:border-yellow-400/50"
            title="Klik untuk membuka Sinkronisasi Real-Time & Perbaikan Google Sheets"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="font-mono font-bold">
              Real-Time Otomatis
            </span>
            {syncConfig?.lastSyncTime && (
              <span className="text-[10px] text-emerald-300/80 font-mono inline">
                ({syncConfig.lastSyncTime})
              </span>
            )}
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 group-hover:text-yellow-300 ml-0.5" />
          </button>
        ) : (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg box-3d-card bg-[#0d2113]/85 text-emerald-300 shadow-md border border-emerald-500/35 select-none cursor-default"
            title="Status: Sinkronisasi Real-Time Aktif Otomatis"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="font-mono font-bold">
              Real-Time Otomatis
            </span>
            {syncConfig?.lastSyncTime && (
              <span className="text-[10px] text-emerald-300/80 font-mono inline">
                ({syncConfig.lastSyncTime})
              </span>
            )}
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
          </div>
        )}

        {/* TOMBOL SINKRON: BISA DIKLIK OLEH OPERATOR, TAMU, DAN ADMIN */}
        {onQuickSync && (
          <button
            onClick={onQuickSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg box-3d-card bg-[#0d2113]/85 hover:bg-emerald-950/90 text-emerald-200 hover:text-yellow-300 transition cursor-pointer disabled:opacity-50 font-mono font-bold text-xs active:scale-95 shadow-md border border-emerald-500/35 hover:border-yellow-400/50"
            title="Klik untuk menyinkronkan data pasien secara instan"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkron'}</span>
          </button>
        )}

        {/* VERSION BADGE */}
        {onOpenVersionModal && (
          <button
            onClick={onOpenVersionModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg box-3d-card bg-amber-950/80 hover:bg-amber-900/90 transition cursor-pointer font-mono font-bold text-[11px] shadow-md text-yellow-300 border border-yellow-500/40 hover:border-yellow-400"
            title={`Lihat Catatan Pembaruan Sistem Versi ${APP_VERSION}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping"></span>
            <span>v{APP_VERSION}</span>
          </button>
        )}

        {/* PENGATURAN WALLPAPER & TRANSPARANSI BOX BUTTON */}
        {onOpenWallpaperModal && (
          <button
            onClick={onOpenWallpaperModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg box-3d-card bg-[#0d2113]/85 hover:bg-emerald-950/90 transition cursor-pointer font-mono font-bold text-[11px] shadow-md text-emerald-200 hover:text-yellow-300 border border-emerald-500/35 hover:border-yellow-400/50"
            title="Pengaturan Wallpaper & Kejernihan Box"
          >
            <Palette className="w-3.5 h-3.5 text-yellow-400" />
            <span className="inline">Wallpaper</span>
          </button>
        )}

        {/* TOMBOL PENGATURAN KECERAHAN (TAMPIL UNTUK ADMIN, OPERATOR, DAN TAMU) */}
        {onChangeBrightness && (
          <div ref={brightnessRef} className="relative">
            <button
              type="button"
              onClick={() => setIsBrightnessOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg box-3d-card transition cursor-pointer font-mono font-bold text-[11px] shadow-md border ${
                isBrightnessOpen || brightness !== 100
                  ? 'bg-amber-950/85 text-yellow-300 border-yellow-400/60'
                  : 'bg-[#0d2113]/85 hover:bg-emerald-950/90 text-emerald-200 hover:text-yellow-300 border-emerald-500/35 hover:border-yellow-400/50'
              }`}
              title="Atur Tingkat Kecerahan Tampilan"
            >
              <Sun className="w-3.5 h-3.5 text-yellow-400" />
              <span>Kecerahan</span>
              <span className="px-1.5 py-0.5 rounded bg-black/45 border border-yellow-500/30 text-[10px] text-yellow-300 tabular-nums">
                {brightness}%
              </span>
            </button>

            {isBrightnessOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 p-3 rounded-xl bg-[#08170c]/95 border border-emerald-500/45 shadow-[0_14px_32px_rgba(0,0,0,0.85)] backdrop-blur-xl z-50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono font-bold text-[11px] text-yellow-300">
                    <Sun className="w-3.5 h-3.5 text-yellow-400" />
                    Tingkat Kecerahan
                  </span>
                  <span className="font-mono font-black text-xs text-white px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/40 tabular-nums">
                    {brightness}%
                  </span>
                </div>

                <input
                  type="range"
                  min={60}
                  max={160}
                  step={5}
                  value={brightness}
                  onChange={(e) => onChangeBrightness(Number(e.target.value))}
                  aria-label="Atur tingkat kecerahan layar"
                  className="w-full accent-yellow-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />

                <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                  {[75, 100, 125, 150].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onChangeBrightness(preset)}
                      className={`flex-1 py-1 rounded-md border font-bold transition cursor-pointer ${
                        brightness === preset
                          ? 'bg-yellow-500/25 border-yellow-400 text-yellow-200'
                          : 'bg-black/45 border-emerald-500/30 text-slate-300 hover:bg-emerald-950/70 hover:text-white'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => onChangeBrightness(100)}
                    title="Kembalikan ke Kecerahan Normal (100%)"
                    className="px-2 py-1 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-600 text-slate-200 transition cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <span className="text-emerald-500/40 inline">|</span>
        <span className="text-slate-300 bg-black/40 px-2.5 py-1 rounded-md border border-emerald-500/25 shadow-inner">
          Periode: <strong className="text-white font-mono">Tahun 2024 – 2026</strong>
        </span>
        <span className="text-emerald-500/40 inline">|</span>
        <span className="text-slate-300 bg-black/40 px-2.5 py-1 rounded-md border border-emerald-500/25 shadow-inner">
          Total Terdata: <strong className="text-white font-mono tabular-nums">{totalCount}</strong> Berkas
          {isFiltered && (
            <span className="text-amber-300 ml-1.5 font-bold">
              (Filter: <strong className="font-mono tabular-nums">{filteredCount}</strong>)
            </span>
          )}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {role === 'superadmin' && onAutoCorrectAll && (
          <button
            onClick={onAutoCorrectAll}
            className="bg-gradient-to-r from-emerald-900/90 to-emerald-800/90 hover:from-emerald-800 hover:to-emerald-700 border border-emerald-400/50 text-emerald-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
            title="Format dan rapikan standar penulisan militer & medis otomatis"
          >
            <Wand2 className="w-3.5 h-3.5 text-yellow-400" />
            <span className="inline">Koreksi Otomatis Data</span>
          </button>
        )}

        {isLoggedIn && (
          <a
            href="/assets/aistudio/index_582cdddb.html"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border border-blue-400/50 text-white font-black px-4 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer shadow-lg no-underline hover:scale-[1.02] relative"
            title="Buat pengajuan surat evakuasi baru (Tugas Operator)"
          >
            <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-yellow-400 text-black font-black text-[9px] rounded-full animate-bounce shadow-sm">
              KERJAKAN
            </span>
            <Plus className="w-4 h-4 text-blue-100" />
            <span className="tracking-wide">Buat Surat Baru</span>
          </a>
        )}

        {/* TOMBOL MASUK SENDIRI ATAU STATUS PENGGUNA */}
        {!isLoggedIn ? (
          <button
            onClick={onOpenLogin}
            className="bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border border-blue-400/50 text-white font-black px-4 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer shadow-lg hover:scale-[1.02] active:scale-95"
            title="Masuk ke Akun Sistem SIYANKES"
          >
            <LogIn className="w-4 h-4 text-blue-100" />
            <span className="font-mono tracking-wide uppercase">Masuk</span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Tambah Akun & Hak Akses khusus Super Admin */}
            {role === 'superadmin' && (
              <button
                onClick={onOpenUserManagement}
                className="bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-yellow-400/40 text-white font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-md"
                title="Buka Pengaturan Tambah Akun & Hak Akses"
              >
                <UserPlus className="w-4 h-4 text-yellow-200" />
                <span className="font-mono font-bold">Tambah Akun &amp; Hak Akses</span>
              </button>
            )}

            {/* User Chip & Tombol Keluar */}
            <div className="flex items-center gap-1.5 bg-black/50 border border-emerald-500/35 rounded-lg p-1 pl-2.5 shadow-md">
              <div className="flex items-center gap-1.5 text-xs text-emerald-200">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono font-bold text-white max-w-[160px] sm:max-w-[220px] truncate" title={`${user.username || ''} - ${user.name || ''}`}>
                  {user.username && user.name && user.username.toLowerCase() !== user.name.toLowerCase()
                    ? `${user.username} (${user.name})`
                    : user.name || user.username || 'Hendra'}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                  role === 'superadmin' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {role === 'superadmin' ? 'Super Admin' : 'Operator'}
                </span>
              </div>
              
              <button
                onClick={onLogout}
                className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/60 rounded transition cursor-pointer"
                title="Keluar dari Akun (Logout)"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
