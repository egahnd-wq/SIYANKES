import React, { useState, useEffect } from 'react';
import {
  X,
  Image,
  Sliders,
  Check,
  Eye,
  Sparkles,
  Layers,
  Palette,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { uploadWallpaperToServer, fetchServerWallpapers } from '../utils/apiSync';

export type WallpaperPreset = 
  | 'camo-malvinas'
  | 'camo-nkri'
  | 'dark-tactical'
  | 'deep-emerald'
  | 'midnight-navy'
  | 'custom-url';

export interface WallpaperConfig {
  preset: WallpaperPreset;
  customUrl?: string;
  camoOpacity: number; // 10 to 100 (%)
  dimmerOpacity: number; // 0 to 90 (%)
  blurAmount: number; // 0 to 20 (px)
  glassTransparency: number; // 10 to 90 (%) - affects box backgrounds
}

export const DEFAULT_WALLPAPER_CONFIG: WallpaperConfig = {
  preset: 'custom-url',
  customUrl: '/assets/wallpaper/natural_f30129.jpg',
  camoOpacity: 80,
  dimmerOpacity: 75,
  blurAmount: 10,
  glassTransparency: 25,
};

interface WallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WallpaperConfig;
  onUpdateConfig: (config: WallpaperConfig) => void;
  onReset: () => void;
  role?: string;
}

export const WallpaperModal: React.FC<WallpaperModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onReset,
  role,
}) => {
  const [availableWallpapers, setAvailableWallpapers] = useState<string[]>([
    'Hesti_wira_sakti_87fb20c2.png',
    'amry_a4f812.jpg',
    'balap_biru_2ce43a9a.jpeg',
    'batman_9a299cf6.jpg',
    'BATMAN1_b3628992.jpg',
    'cen2_b91012.jpg',
    'Cendrawasih1_c81201.jpg',
    'ferrari_d91202.jpg',
    'golf_e12010.jpg',
    'logo_spiderman_3c0d47e5.jpg',
    'MICKEY_MOUSE_e43ff9b0.jpg',
    'MM1_1afdafd7.jpg',
    'MM2_ccca753a.jpg',
    'MM3_95aa8bc8.jpg',
    'motor_GP_d1a8bb34.jpg',
    'natural_f30129.jpg',
    'spiderman_3e104fe3.jpg',
    'tentara_g49102.jpg',
  ]);

  useEffect(() => {
    if (isOpen) {
      fetchServerWallpapers().then((serverList) => {
        if (serverList && serverList.length > 0) {
          const defaultList = [
            'Hesti_wira_sakti_87fb20c2.png',
            'amry_a4f812.jpg',
            'balap_biru_2ce43a9a.jpeg',
            'batman_9a299cf6.jpg',
            'BATMAN1_b3628992.jpg',
            'cen2_b91012.jpg',
            'Cendrawasih1_c81201.jpg',
            'ferrari_d91202.jpg',
            'golf_e12010.jpg',
            'logo_spiderman_3c0d47e5.jpg',
            'MICKEY_MOUSE_e43ff9b0.jpg',
            'MM1_1afdafd7.jpg',
            'MM2_ccca753a.jpg',
            'MM3_95aa8bc8.jpg',
            'motor_GP_d1a8bb34.jpg',
            'natural_f30129.jpg',
            'spiderman_3e104fe3.jpg',
            'tentara_g49102.jpg',
          ];
          const combined = Array.from(new Set([...defaultList, ...serverList]));
          setAvailableWallpapers(combined);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const presets: { id: WallpaperPreset; name: string; desc: string; badge: string; color: string }[] = [
    {
      id: 'camo-malvinas',
      name: 'Loreng Malvinas TNI AD',
      desc: 'Corak loreng organik hijau, coklat & olive klasik resmi TNI AD',
      badge: 'Resmi TNI AD',
      color: 'from-[#162519] via-[#3b2b1d] to-[#3b4728]',
    },
    {
      id: 'camo-nkri',
      name: 'Loreng NKRI / Raider',
      desc: 'Nuansa hijau rimba & khaki tegas khas satuan tempur',
      badge: 'Taktis Raider',
      color: 'from-[#1e3523] via-[#4a3d27] to-[#2d4732]',
    },
    {
      id: 'dark-tactical',
      name: 'Dark Tactical Carbon',
      desc: 'Nuansa hitam & abu-abu arang untuk fokus visual maksimal',
      badge: 'Minimalis',
      color: 'from-[#080c09] via-[#141a16] to-[#1f2822]',
    },
    {
      id: 'deep-emerald',
      name: 'Hesti Wira Sakti Emerald',
      desc: 'Gradasi hijau zamrud gelap korps Kesehatan Militer',
      badge: 'Korps Kesehatan',
      color: 'from-[#04140d] via-[#0a2b1c] to-[#11422c]',
    },
    {
      id: 'midnight-navy',
      name: 'Midnight Navy Command',
      desc: 'Biru malam komando strategis dengan kontras dingin',
      badge: 'Posko Malam',
      color: 'from-[#050b16] via-[#0d182b] to-[#172844]',
    },
    {
      id: 'custom-url',
      name: 'Kustom Gambar / Foto',
      desc: 'Gunakan file gambar wallpaper dari perangkat Anda atau foto kesatuan',
      badge: 'Kustom Bebas',
      color: 'from-emerald-950 via-amber-950 to-slate-900',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn no-print">
      <div 
        className="w-full max-w-2xl box-3d-dimmed border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="px-5 py-4 border-b border-emerald-500/25 bg-gradient-to-r from-[#0e2215]/80 to-[#07130a]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <Palette className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black font-mono tracking-wider text-yellow-400 uppercase">
                PENGATURAN WALLPAPER &amp; KEJERNIHAN BOX
              </h2>
              <p className="text-[11px] text-emerald-300/90 font-medium">
                {role === 'superadmin'
                  ? '👑 Wallpaper Admin (Mengatur tampilan global & otomatis ditayangkan ke Akun Tamu)'
                  : '👤 Wallpaper Operator (Tampilan pribadi Anda, tidak mempengaruhi Akun Tamu atau Pengguna lain)'}
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

        {/* BODY CONTENT */}
        <div className="p-5 overflow-y-auto space-y-6 scrollbar-thin text-xs text-slate-200 bg-[#08150c]/85">
          
          {/* BAGIAN 1: KEJERNIHAN & OPASITAS BOX */}
          <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/25 space-y-6">
            
            {/* Transparansi Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white uppercase text-[12px] tracking-wide">
                    Transparansi Latar Box Kaca
                  </span>
                </div>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 font-bold">
                  {config.glassTransparency}% Transparan
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                value={config.glassTransparency}
                onChange={(e) => onUpdateConfig({ ...config, glassTransparency: Number(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>Pekat Gelap (10%)</span>
                <span>Bening Transparan (90%)</span>
              </div>
            </div>

            {/* Kejernihan (Blur) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-yellow-400" />
                  <span className="font-bold text-white uppercase text-[12px] tracking-wide">
                    Kejernihan Box (Blur)
                  </span>
                </div>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-amber-950/90 text-yellow-300 border border-yellow-500/40 font-bold">
                  {config.blurAmount}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={config.blurAmount}
                onChange={(e) => onUpdateConfig({ ...config, blurAmount: Number(e.target.value) })}
                className="w-full accent-yellow-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>Tajam (0px)</span>
                <span>Halus (20px)</span>
              </div>
            </div>
          </div>

          {/* BAGIAN 2: PILIHAN CORAK WALLPAPER */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-white uppercase text-[12px] tracking-wide">
                Pilih Tema Latar Belakang / Wallpaper
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presets.map((p) => {
                const isSelected = config.preset === p.id && config.preset !== 'custom-url';
                return (
                  <div
                    key={p.id}
                    onClick={() => onUpdateConfig({ ...config, preset: p.id })}
                    className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between gap-2 overflow-hidden ${
                      isSelected
                        ? 'border-yellow-400 ring-2 ring-yellow-400/30 bg-emerald-950/60 shadow-lg scale-[1.01]'
                        : 'border-white/10 hover:border-emerald-500/40 bg-black/40 hover:bg-black/60'
                    }`}
                  >
                    <div className={`h-8 rounded-lg bg-gradient-to-r ${p.color} border border-white/15 flex items-center justify-between px-2.5`}>
                      <span className="text-[10px] font-mono font-bold text-yellow-300 drop-shadow">
                        {p.badge}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center font-black">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-xs flex items-center gap-1.5">{p.name}</h3>
                      <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BAGIAN 3: WALLPAPER UNGGASAN */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white uppercase text-[12px] tracking-wide">
                    Wallpaper Unggahan Tersedia (Admin &amp; Operator)
                  </span>
                </div>
                <span className="text-[10px] text-emerald-300 font-mono">Tersimpan di Server</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                {availableWallpapers.map((img) => {
                  const imgPath = img.startsWith('/') ? img : `/assets/wallpaper/${img}`;
                  return (
                   <button
                      key={img}
                      onClick={() => onUpdateConfig({ ...config, preset: 'custom-url', customUrl: imgPath })}
                      className={`rounded-lg overflow-hidden border-2 transition cursor-pointer ${config.customUrl === imgPath ? 'border-yellow-400 ring-2 ring-yellow-400/40' : 'border-white/10 hover:border-emerald-500/50'}`}
                   >
                     <img src={imgPath} alt="Wallpaper" className="w-full h-16 object-cover" />
                   </button>
                  );
                })}
              </div>
            </div>

            {/* Custom File Upload Input */}
            {config.preset === 'custom-url' && (
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-yellow-500/35 space-y-2 animate-fadeIn">
                <label className="text-[11px] font-bold text-yellow-300 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-yellow-400" />
                  Unggah File Gambar Wallpaper (Otomatis Tersimpan untuk Admin, Operator &amp; Tamu)
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const serverUrl = await uploadWallpaperToServer(file);
                        if (serverUrl) {
                          onUpdateConfig({ ...config, preset: 'custom-url', customUrl: serverUrl });
                          fetchServerWallpapers().then((serverList) => {
                            if (serverList && serverList.length > 0) {
                              const defaultList = [
                                'Hesti_wira_sakti_87fb20c2.png',
                                'amry_a4f812.jpg',
                                'balap_biru_2ce43a9a.jpeg',
                                'batman_9a299cf6.jpg',
                                'BATMAN1_b3628992.jpg',
                                'cen2_b91012.jpg',
                                'Cendrawasih1_c81201.jpg',
                                'ferrari_d91202.jpg',
                                'golf_e12010.jpg',
                                'logo_spiderman_3c0d47e5.jpg',
                                'MICKEY_MOUSE_e43ff9b0.jpg',
                                'MM1_1afdafd7.jpg',
                                'MM2_ccca753a.jpg',
                                'MM3_95aa8bc8.jpg',
                                'motor_GP_d1a8bb34.jpg',
                                'natural_f30129.jpg',
                                'spiderman_3e104fe3.jpg',
                                'tentara_g49102.jpg',
                              ];
                              setAvailableWallpapers(Array.from(new Set([...defaultList, ...serverList])));
                            }
                          });
                        }
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-emerald-700 file:text-white hover:file:bg-emerald-600 file:cursor-pointer cursor-pointer"
                  />
                  {config.customUrl && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-emerald-300 font-mono">Gambar Terpasang:</span>
                      <img src={config.customUrl} alt="Preview Wallpaper" className="w-12 h-8 object-cover rounded border border-emerald-500/40" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* BAGIAN 3: SLIDER DETAIL WALLPAPER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-black/40 border border-emerald-500/25">
            {/* Kepekatan Corak / Loreng */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 text-[11px]">Kepekatan Corak Latar:</span>
                <span className="font-mono text-[11px] text-emerald-300 font-bold">{config.camoOpacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={config.camoOpacity}
                onChange={(e) => onUpdateConfig({ ...config, camoOpacity: Number(e.target.value) })}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>Halus (10%)</span>
                <span>Jelas (100%)</span>
              </div>
            </div>

            {/* Peredup Latar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 text-[11px]">Redup Latar Belakang:</span>
                <span className="font-mono text-[11px] text-yellow-300 font-bold">{config.dimmerOpacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={config.dimmerOpacity}
                onChange={(e) => onUpdateConfig({ ...config, dimmerOpacity: Number(e.target.value) })}
                className="w-full accent-yellow-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>Terang (0%)</span>
                <span>Gelap (90%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#050e08] flex items-center justify-between">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-black/40 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-mono font-semibold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standar TNI AD</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/40 text-white font-bold text-xs shadow-lg transition cursor-pointer"
          >
            Selesai &amp; Simpan
          </button>
        </div>
      </div>
    </div>
  );
};
