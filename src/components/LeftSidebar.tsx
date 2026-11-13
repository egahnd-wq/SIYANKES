import React from 'react';
import {
  LayoutDashboard,
  Table2,
  BarChart3,
  Shield,
  HeartHandshake,
  Baby,
  Building2,
  CheckCircle2,
  FileX,
  CalendarDays,
  AlertCircle,
} from 'lucide-react';
import { SyncConfig, PatientCategory } from '../types/evacuation';

interface LeftSidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user: any;
  role: string;
  totalCount: number;
  filteredCount: number;
  isFiltered: boolean;
  isSyncing: boolean;
  syncConfig?: SyncConfig;
  hasDuplicateSrt: boolean;
  activeSection: 'dashboard' | 'charts' | 'table';
  onSelectSection: (section: 'dashboard' | 'charts' | 'table') => void;
  onResetFilters: () => void;
  onNewLetterModal: () => void;
  onDownloadCsv: () => void;
  onPrint: () => void;
  onQuickSync: () => void;
  onOpenSyncModal: () => void;
  onAutoCorrectAll?: () => void;
  onOpenUserManagement: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenVersionModal: () => void;
  onOpenWallpaperModal?: () => void;
  selectedCategory?: PatientCategory | 'ALL';
  onFilterCategory?: (cat: PatientCategory | 'ALL') => void;
  filterOnlySembuh?: boolean;
  onFilterSembuh?: () => void;
  filterBatalRalat?: boolean;
  onFilterBatalRalat?: () => void;
  filterMeninggal?: boolean;
  onFilterMeninggal?: () => void;
  yearStats?: { year: string; count: number }[];
  selectedYear?: string | null;
  onSelectYear?: (year: string) => void;
  stats?: {
    militer: number;
    persit: number;
    anak: number;
    pns: number;
    sembuh: number;
    batalRalat: number;
    meninggal: number;
    rspad: number;
    total: number;
  };
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  totalCount,
  isFiltered,
  activeSection,
  onSelectSection,
  onResetFilters,
  selectedCategory = 'ALL',
  onFilterCategory,
  filterOnlySembuh = false,
  onFilterSembuh,
  filterBatalRalat = false,
  onFilterBatalRalat,
  filterMeninggal = false,
  onFilterMeninggal,
  yearStats = [],
  selectedYear = null,
  onSelectYear,
  stats,
}) => {
  const runAction = (fn: () => void) => {
    fn();
    if (isOpenMobile) onCloseMobile();
  };

  const box3dBase =
    'border border-emerald-500/25 border-b-2 border-b-black/60 shadow-md hover:-translate-y-[1px] active:translate-y-[1px]';
  const box3dInactive =
    'bg-black/40 hover:bg-emerald-950/60 hover:border-emerald-400/40 text-slate-200';
  const badge3d =
    'border border-emerald-500/30 bg-black/50 shadow-inner';

  const renderPanelContent = (collapsed: boolean) => (
    <div className="flex flex-col flex-1 h-full text-[10px] select-none">
      {/* ISI PANEL MENU TAKTIS */}
      <div className="flex-1 flex flex-col p-1.5 ml-0 mr-0.5 rounded-2xl box-3d-dimmed border border-emerald-500/30 bg-[#08150b]/80 shadow-2xl space-y-1.5">

        {/* JUDUL PANEL: MENU UTAMA */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'Klik untuk Perluas Menu Utama' : 'Klik untuk Ciutkan Menu Utama'}
          className="w-full mx-0 px-1.5 py-1.5 rounded-xl bg-gradient-to-b from-[#112a17] to-[#08160c] hover:from-[#16381e] hover:to-[#0c2112] border border-emerald-500/35 shadow-md text-center mb-1.5 cursor-pointer transition-all duration-200"
        >
          <span className="font-mono font-black text-xs sm:text-[13px] tracking-[0.1em] text-yellow-400 uppercase block whitespace-nowrap">
            {collapsed ? 'M' : 'MENU UTAMA'}
          </span>
        </button>

        {/* KELOMPOK 1: NAVIGASI UTAMA */}
        <div className="space-y-1 pb-0.5">
          {!collapsed && (
            <div className="px-1 mb-0.5 text-[8.5px] font-mono font-bold uppercase tracking-wider text-emerald-300/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              Navigasi
            </div>
          )}

          <button
            onClick={() => runAction(() => { onResetFilters(); onSelectSection('dashboard'); })}
            className={`w-full rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${box3dBase} ${
              collapsed ? 'p-1.5 justify-center' : 'px-1.5 py-1'
            } ${
              activeSection === 'dashboard' && !isFiltered
                ? 'bg-emerald-700/80 border-emerald-400/60 text-white font-bold shadow-md'
                : `${box3dInactive} text-emerald-300`
            }`}
            title="Dashboard Utama (Tampilkan Semua Data)"
          >
            <LayoutDashboard className={`w-3 h-3 shrink-0 ${activeSection === 'dashboard' && !isFiltered ? 'text-yellow-300' : 'text-emerald-400'}`} />
            {!collapsed && <span className={`font-bold tracking-tight text-[9px] ${activeSection === 'dashboard' && !isFiltered ? 'text-white' : 'text-emerald-200'}`}>DASHBOARD</span>}
          </button>
        </div>

        {/* KELOMPOK 2: KATEGORI PASIEN */}
        <div className="space-y-1 pt-1.5 border-t border-emerald-500/20">
          {!collapsed && (
            <div className="px-1 mb-0.5 text-[8.5px] font-mono font-bold uppercase tracking-wider text-amber-300/85 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
              Kategori
            </div>
          )}

          {[
            { id: 'MILITER', label: 'Militer', icon: Shield, color: 'text-emerald-300', iconColor: 'text-emerald-400', activeBg: 'bg-emerald-700/80 border-emerald-400/70', count: stats?.militer },
            { id: 'PERSIT', label: 'Persit', icon: HeartHandshake, color: 'text-sky-300', iconColor: 'text-sky-400', activeBg: 'bg-sky-700/80 border-sky-400/70', count: stats?.persit },
            { id: 'ANAK', label: 'Anak', icon: Baby, color: 'text-amber-300', iconColor: 'text-amber-400', activeBg: 'bg-amber-700/80 border-amber-400/70', count: stats?.anak },
            { id: 'PNS', label: 'ASN / PPPK', icon: Building2, color: 'text-purple-300', iconColor: 'text-purple-400', activeBg: 'bg-purple-700/80 border-purple-400/70', count: stats?.pns },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => runAction(() => onFilterCategory?.(cat.id as PatientCategory))}
              className={`w-full rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${box3dBase} ${
                collapsed ? 'p-1.5 justify-center' : 'px-1.5 py-1'
              } ${
                selectedCategory === cat.id
                  ? `${cat.activeBg} text-white font-bold shadow-md`
                  : `${box3dInactive}`
              }`}
            >
              <cat.icon className={`w-3 h-3 shrink-0 ${selectedCategory === cat.id ? 'text-white' : cat.iconColor}`} />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0 gap-1">
                  <span className={`text-[9px] font-bold whitespace-nowrap ${selectedCategory === cat.id ? 'text-white' : cat.color}`}>{cat.label}</span>
                  <span className={`font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                    selectedCategory === cat.id ? 'bg-black/30 text-white border border-white/30' : `${badge3d} ${cat.color}`
                  }`}>
                    {cat.count || 0}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* KELOMPOK 3: STATUS KESEHATAN */}
        <div className="space-y-1 pt-1.5 border-t border-emerald-500/20">
          {!collapsed && (
            <div className="px-1 mb-0.5 text-[8.5px] font-mono font-bold uppercase tracking-wider text-emerald-300/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              Status
            </div>
          )}

          <button
            onClick={() => runAction(() => onFilterSembuh?.())}
            className={`w-full rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${box3dBase} ${
              collapsed ? 'p-1.5 justify-center' : 'px-1.5 py-1'
            } ${
              filterOnlySembuh
                ? 'bg-emerald-700/80 border-emerald-400/70 text-white font-bold shadow-md'
                : `${box3dInactive}`
            }`}
          >
            <CheckCircle2 className={`w-3 h-3 shrink-0 ${filterOnlySembuh ? 'text-white' : 'text-emerald-400'}`} />
            {!collapsed && (
              <div className="flex items-center justify-between flex-1 min-w-0 gap-1">
                <span className={`text-[9px] font-bold whitespace-nowrap ${filterOnlySembuh ? 'text-white' : 'text-emerald-300'}`}>Sembuh</span>
                <span className={`font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                  filterOnlySembuh ? 'bg-black/30 text-white border border-white/30' : `${badge3d} text-emerald-300`
                }`}>
                  {stats?.sembuh || 0}
                </span>
              </div>
            )}
          </button>

          <button
            onClick={() => runAction(() => onFilterBatalRalat?.())}
            className={`w-full rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${box3dBase} ${
              collapsed ? 'p-1.5 justify-center' : 'px-1.5 py-1'
            } ${
              filterBatalRalat
                ? 'bg-slate-700/90 border-slate-400/60 text-white font-bold shadow-md'
                : `${box3dInactive}`
            }`}
          >
            <FileX className={`w-3 h-3 shrink-0 ${filterBatalRalat ? 'text-white' : 'text-slate-300'}`} />
            {!collapsed && (
              <div className="flex items-center justify-between flex-1 min-w-0 gap-1">
                <span className={`text-[9px] font-bold whitespace-nowrap ${filterBatalRalat ? 'text-white' : 'text-slate-200'}`}>Batal / Ralat</span>
                <span className={`font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                  filterBatalRalat ? 'bg-black/30 text-white border border-white/30' : `${badge3d} text-slate-200`
                }`}>
                  {stats?.batalRalat || 0}
                </span>
              </div>
            )}
          </button>

          <button
            onClick={() => runAction(() => onFilterMeninggal?.())}
            className={`w-full rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${box3dBase} ${
              collapsed ? 'p-1.5 justify-center' : 'px-1.5 py-1'
            } ${
              filterMeninggal
                ? 'bg-red-700/80 border-red-400/70 text-white font-bold shadow-md'
                : `${box3dInactive}`
            }`}
          >
            <AlertCircle className={`w-3 h-3 shrink-0 ${filterMeninggal ? 'text-white' : 'text-red-400'}`} />
            {!collapsed && (
              <div className="flex items-center justify-between flex-1 min-w-0 gap-1">
                <span className={`text-[8.5px] font-bold whitespace-nowrap ${filterMeninggal ? 'text-white' : 'text-red-300'}`}>Meninggal Dunia</span>
                <span className={`font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                  filterMeninggal ? 'bg-black/30 text-white border border-white/30' : `${badge3d} text-red-300`
                }`}>
                  {stats?.meninggal || 0}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* KELOMPOK 4: ANALISIS DATA */}
        <div className="space-y-1 pt-1.5 border-t border-emerald-500/20">
          {!collapsed && (
            <div className="px-1 mb-0.5 text-[8.5px] font-mono font-bold uppercase tracking-wider text-cyan-300/85 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
              Analisis
            </div>
          )}

          <button
            onClick={() => runAction(() => onSelectSection('table'))}
            className={`w-full rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${box3dBase} ${
              collapsed ? 'p-1.5 justify-center' : 'px-1.5 py-1'
            } ${
              activeSection === 'table' && !isFiltered
                ? 'bg-emerald-700/80 border-emerald-400/70 text-white font-bold shadow-md'
                : `${box3dInactive}`
            }`}
            title="Tabel Register"
          >
            <Table2 className={`w-3 h-3 shrink-0 ${activeSection === 'table' && !isFiltered ? 'text-white' : 'text-cyan-400'}`} />
            {!collapsed && (
              <div className="flex items-center justify-between flex-1 min-w-0 gap-1">
                <span className={`text-[9px] font-bold whitespace-nowrap ${activeSection === 'table' && !isFiltered ? 'text-white' : 'text-slate-200'}`}>Register</span>
                <span className={`font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                  activeSection === 'table' && !isFiltered ? 'bg-black/30 text-white border border-white/30' : `${badge3d} text-cyan-300`
                }`}>
                  {totalCount}
                </span>
              </div>
            )}
          </button>

          <button
            onClick={() => runAction(() => onSelectSection('charts'))}
            className={`w-full rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${box3dBase} ${
              collapsed ? 'p-1.5 justify-center' : 'px-1.5 py-1'
            } ${
              activeSection === 'charts'
                ? 'bg-emerald-700/80 border-emerald-400/70 text-white font-bold shadow-md'
                : `${box3dInactive}`
            }`}
            title="Analitik"
          >
            <BarChart3 className={`w-3 h-3 shrink-0 ${activeSection === 'charts' ? 'text-white' : 'text-amber-400'}`} />
            {!collapsed && <span className={`text-[9px] font-bold whitespace-nowrap ${activeSection === 'charts' ? 'text-white' : 'text-slate-200'}`}>GRAFIK</span>}
          </button>
        </div>

        {/* KELOMPOK 5: PERIODE TAHUN (OTOMATIS BERTAMBAH JIKA ADA TAHUN BARU) */}
        <div className="space-y-1 pt-1.5 border-t border-emerald-500/20">
          {!collapsed && (
            <div className="px-1 mb-0.5 text-[8.5px] font-mono font-bold uppercase tracking-wider text-yellow-300/90 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                Periode Evakuasi
              </span>
              {selectedYear && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    runAction(() => onSelectYear?.(selectedYear));
                  }}
                  className="text-[8px] text-emerald-300 hover:text-yellow-300 underline cursor-pointer font-mono font-bold"
                >
                  Semua
                </button>
              )}
            </div>
          )}

          <div className="space-y-1">
            {yearStats.map((item) => {
              const isSelected = selectedYear === item.year;
              return (
                <button
                  key={item.year}
                  onClick={() => runAction(() => onSelectYear?.(item.year))}
                  title={`TAHUN ${item.year}: ${item.count} PASIEN`}
                  className={`w-full rounded-xl flex items-center gap-1 transition-all duration-200 cursor-pointer ${box3dBase} ${
                    collapsed ? 'p-1.5 justify-center' : 'px-1.5 py-1'
                  } ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-600/80 to-emerald-700/80 border-yellow-400/60 text-white font-bold shadow-md'
                      : `${box3dInactive}`
                  }`}
                >
                  <CalendarDays className={`w-3 h-3 shrink-0 ${isSelected ? 'text-yellow-300' : 'text-amber-400'}`} />
                  {collapsed ? (
                    <span className={`font-mono text-[8px] font-black ${isSelected ? 'text-yellow-300' : 'text-slate-200'}`}>
                      &apos;{item.year.slice(-2)}
                    </span>
                  ) : (
                    <div className="flex items-center justify-between flex-1 min-w-0 gap-1">
                      <span className={`font-mono text-[8.5px] font-extrabold tracking-tight whitespace-nowrap ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        TAHUN {item.year}:
                      </span>
                      <span
                        className={`font-mono text-[8px] font-black px-1 py-0.5 rounded tabular-nums whitespace-nowrap ${
                          isSelected
                            ? 'bg-black/30 text-yellow-300 border border-yellow-400/40'
                            : `${badge3d} text-emerald-300`
                        }`}
                      >
                        {item.count} PASIEN
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* UNIFIED IDENTITY BOX: BREVET & VISION */}
        <div className={`mt-auto px-0.5 pb-1 transition-all duration-300 ${collapsed ? 'items-center' : ''}`}>
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent mb-2"></div>
          
          <div className={`bg-gradient-to-b from-[#0d2213] via-[#07140b] to-black border border-yellow-500/30 rounded-xl p-1.5 flex flex-col items-center gap-1.5 shadow-lg ${collapsed ? 'px-1' : ''}`}>
            {/* Brevet Image */}
            <div className="relative group w-full flex justify-center py-1 rounded-lg bg-black/40 border border-emerald-500/25 shadow-inner">
              <div className={`${collapsed ? 'w-7 h-3.5' : 'w-22 h-9'} transition-all duration-500 flex items-center justify-center`}>
                <img 
                  src="/assets/aistudio/Brevet_Kesehatan_Militer_TNI_AD_60322315.png" 
                  alt="Brevet Kesehatan Militer"
                  className="w-full h-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
                />
              </div>
            </div>

            {/* Mission Statement Text */}
            {!collapsed && (
              <div className="border-t border-emerald-500/25 pt-1.5 w-full">
                <p className="text-[8.5px] sm:text-[9px] leading-[1.4] font-extrabold text-center text-slate-200 uppercase tracking-normal antialiased">
                  Kesehatan TNI AD yang <span className="text-yellow-300 font-black underline decoration-yellow-400/70 underline-offset-2">Profesional</span>, <span className="text-yellow-300 font-black underline decoration-yellow-400/70 underline-offset-2">Adaptif</span>, dan <span className="text-yellow-300 font-black underline decoration-yellow-400/70 underline-offset-2">Modern</span> melalui Dukungan Kesehatan Handal serta Pelayanan Kesehatan Prima untuk Mendukung Tugas Pokok TNI AD Menuju Indonesia Berdaulat, Adil, dan Makmur
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <aside
      className={`flex flex-col shrink-0 self-stretch bg-transparent ml-0 z-30 transition-all duration-300 no-print ${
        isCollapsed ? 'w-11' : 'w-42'
      }`}
    >
      {renderPanelContent(isCollapsed)}
    </aside>
  );
};
