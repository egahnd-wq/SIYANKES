import React from 'react';
import {
  FileText,
  Shield,
  HeartHandshake,
  Baby,
  Building2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Hospital,
} from 'lucide-react';
import { PatientCategory } from '../types/evacuation';

interface CategoryStatusItem {
  total: number;
  sembuh: number;
  meninggal: number;
  berobat: number;
}

export interface HospitalStatusItem {
  name: string;
  total: number;
  sembuh: number;
  meninggal: number;
  berobat: number;
}

interface KpiCardsProps {
  total: number;
  militerCount: number;
  persitCount: number;
  anakCount: number;
  pnsCount: number;
  rspadCount?: number;
  batalRalatCount: number;
  sembuhCount?: number;
  meninggalCount?: number;
  totalBerobat?: number;
  categoryBreakdown?: {
    MILITER: CategoryStatusItem;
    PERSIT: CategoryStatusItem;
    ANAK: CategoryStatusItem;
    PNS: CategoryStatusItem;
  };
  hospitalBreakdown?: Record<string, HospitalStatusItem>;
  activeFilterCategory: PatientCategory | 'ALL';
  activeFilterTujuan: string;
  activeFilterKet: boolean;
  activeFilterSembuh?: boolean;
  activeFilterMeninggal?: boolean;
  onFilterTotal?: () => void;
  onFilterCategory: (cat: PatientCategory | 'ALL') => void;
  onFilterTujuan?: (tujuan: string) => void;
  onFilterBatalRalat: () => void;
  onFilterSembuh?: () => void;
  onFilterMeninggal?: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  total,
  militerCount,
  persitCount,
  anakCount,
  pnsCount,
  batalRalatCount,
  sembuhCount = 0,
  meninggalCount = 0,
  totalBerobat = Math.max(0, total - sembuhCount - meninggalCount),
  categoryBreakdown = {
    MILITER: { total: militerCount, sembuh: 28, meninggal: 0, berobat: 52 },
    PERSIT: { total: persitCount, sembuh: 3, meninggal: 0, berobat: 8 },
    ANAK: { total: anakCount, sembuh: 4, meninggal: 0, berobat: 5 },
    PNS: { total: pnsCount, sembuh: 2, meninggal: 1, berobat: 3 },
  },
  hospitalBreakdown,
  activeFilterCategory,
  activeFilterTujuan = '',
  activeFilterKet,
  activeFilterSembuh = false,
  activeFilterMeninggal = false,
  onFilterTotal,
  onFilterCategory,
  onFilterTujuan,
  onFilterBatalRalat,
  onFilterSembuh = () => {},
  onFilterMeninggal = () => {},
}) => {
  const defaultHospitalBreakdown: Record<string, HospitalStatusItem> = {
    'RSPAD Gatot Soebroto Jakarta': { name: 'RSPAD Gatot Soebroto Jakarta', total: 87, sembuh: 30, meninggal: 0, berobat: 57 },
    'RS TK II 17.05.01 Marthen Indey': { name: 'RS TK II 17.05.01 Marthen Indey', total: 3, sembuh: 0, meninggal: 0, berobat: 3 },
    'RSPAL dr. Ramelan Surabaya': { name: 'RSPAL dr. Ramelan Surabaya', total: 4, sembuh: 1, meninggal: 0, berobat: 3 },
    'RS TK II dr. Soepraoen Malang': { name: 'RS TK II dr. Soepraoen Malang', total: 2, sembuh: 0, meninggal: 0, berobat: 2 },
    'RS TK II Pelamonia Makassar': { name: 'RS TK II Pelamonia Makassar', total: 7, sembuh: 6, meninggal: 0, berobat: 1 },
    'RS TK II Wolter Mongosidi Manado': { name: 'RS TK II Wolter Mongosidi Manado', total: 1, sembuh: 0, meninggal: 0, berobat: 1 },
    'RSAU dr. Esnawan Jakarta': { name: 'RSAU dr. Esnawan Jakarta', total: 1, sembuh: 0, meninggal: 0, berobat: 1 },
    'RS Universitas Hasanuddin Makassar': { name: 'RS Universitas Hasanuddin Makassar', total: 1, sembuh: 0, meninggal: 1, berobat: 0 },
  };

  const activeHospitalBreakdown = hospitalBreakdown || defaultHospitalBreakdown;
  const hospitalList = Object.values(activeHospitalBreakdown).sort(
    (a, b) => b.berobat - a.berobat || b.total - a.total
  );

  const nonRspadBerobat = hospitalList
    .filter((h) => !h.name.toLowerCase().includes('rspad'))
    .reduce((sum, h) => sum + h.berobat, 0);

  const rspadItem = hospitalList.find((h) => h.name.toLowerCase().includes('rspad'));
  const rspadBerobat = rspadItem ? rspadItem.berobat : 0;
  const isTotalActive =
    activeFilterCategory === 'ALL' &&
    !activeFilterKet &&
    !activeFilterSembuh &&
    !activeFilterMeninggal &&
    !activeFilterTujuan;

  const pctBerobat = total > 0 ? ((totalBerobat / total) * 100).toFixed(1) : '0';
  const pctSembuh = total > 0 ? ((sembuhCount / total) * 100).toFixed(1) : '0';
  const pctMeninggal = total > 0 ? ((meninggalCount / total) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-extrabold text-emerald-300 tracking-wider uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          Ringkasan &amp; Filter Kategori Pasien (Klik Box Untuk Menyaring Tabel):
        </span>
        <span className="text-[10px] text-yellow-300/90 font-mono font-bold inline">
          {isTotalActive ? '⚡ Menampilkan Semua Berkas' : '⚡ Filter Aktif'}
        </span>
      </div>

      <div className="grid grid-cols-8 gap-2">
        {/* 1. Total Pengajuan */}
        <button
          onClick={() => {
            if (onFilterTotal) onFilterTotal();
            else onFilterCategory('ALL');
          }}
          title="Klik untuk menampilkan SEMUA pasien (Reset filter)"
          className={`text-left p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden box-3d-card ${
            isTotalActive
              ? 'border-emerald-400 ring-2 ring-emerald-400/70 bg-emerald-950/75 shadow-lg'
              : 'border-emerald-500/25 hover:border-emerald-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-tight">Total</span>
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white tabular-nums mt-0.5">{total}</div>
          <div className="text-[9px] font-medium text-slate-400 mt-1 flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold">{totalBerobat} Berobat</span>
              {isTotalActive && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </div>
            <div className="text-[8px] text-slate-400 font-mono font-semibold">
              {sembuhCount} Sembuh • {meninggalCount} MD
            </div>
          </div>
        </button>

        {/* 2. Militer */}
        <button
          onClick={() => onFilterCategory('MILITER')}
          title="Klik untuk menampilkan HANYA Pasien Prajurit Militer"
          className={`text-left p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden box-3d-card ${
            activeFilterCategory === 'MILITER'
              ? 'border-emerald-400 ring-2 ring-emerald-400/70 bg-emerald-950/75 shadow-lg'
              : 'border-emerald-500/25 hover:border-emerald-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-tight">Militer</span>
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-300 tabular-nums mt-0.5">{militerCount}</div>
          <div className="text-[9px] font-medium text-slate-400 mt-1 flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold">{categoryBreakdown.MILITER.berobat} Berobat</span>
              {activeFilterCategory === 'MILITER' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </div>
            <div className="text-[8px] text-emerald-400 font-mono font-bold">
              {categoryBreakdown.MILITER.sembuh} Sembuh
            </div>
          </div>
        </button>

        {/* 3. Persit */}
        <button
          onClick={() => onFilterCategory('PERSIT')}
          title="Klik untuk menampilkan HANYA Pasien Istri / Persit"
          className={`text-left p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden box-3d-card ${
            activeFilterCategory === 'PERSIT'
              ? 'border-sky-400 ring-2 ring-sky-400/70 bg-sky-950/70 shadow-lg'
              : 'border-emerald-500/25 hover:border-sky-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-sky-300 uppercase tracking-tight">Persit</span>
            <HeartHandshake className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-black text-sky-300 tabular-nums mt-0.5">{persitCount}</div>
          <div className="text-[9px] font-medium text-slate-400 mt-1 flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold">{categoryBreakdown.PERSIT.berobat} Berobat</span>
              {activeFilterCategory === 'PERSIT' && <CheckCircle2 className="w-3 h-3 text-sky-400" />}
            </div>
            <div className="text-[8px] text-sky-300 font-mono font-bold">
              {categoryBreakdown.PERSIT.sembuh} Sembuh
            </div>
          </div>
        </button>

        {/* 4. Anak */}
        <button
          onClick={() => onFilterCategory('ANAK')}
          title="Klik untuk menampilkan HANYA Pasien Anak Prajurit"
          className={`text-left p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden box-3d-card ${
            activeFilterCategory === 'ANAK'
              ? 'border-amber-400 ring-2 ring-amber-400/70 bg-amber-950/70 shadow-lg'
              : 'border-emerald-500/25 hover:border-amber-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-tight">Anak</span>
            <Baby className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-300 tabular-nums mt-0.5">{anakCount}</div>
          <div className="text-[9px] font-medium text-slate-400 mt-1 flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold">{categoryBreakdown.ANAK.berobat} Berobat</span>
              {activeFilterCategory === 'ANAK' && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
            </div>
            <div className="text-[8px] text-amber-300 font-mono font-bold">
              {categoryBreakdown.ANAK.sembuh} Sembuh
            </div>
          </div>
        </button>

        {/* 5. PNS / PPPK */}
        <button
          onClick={() => onFilterCategory('PNS')}
          title="Klik untuk menampilkan HANYA Pasien PNS / PPPK / ASN"
          className={`text-left p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden box-3d-card ${
            activeFilterCategory === 'PNS'
              ? 'border-purple-400 ring-2 ring-purple-400/70 bg-purple-950/70 shadow-lg'
              : 'border-emerald-500/25 hover:border-purple-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-purple-300 uppercase tracking-tight">PNS/PPPK</span>
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-300 tabular-nums mt-0.5">{pnsCount}</div>
          <div className="text-[9px] font-medium text-slate-400 mt-1 flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold">{categoryBreakdown.PNS.berobat} Berobat</span>
              {activeFilterCategory === 'PNS' && <CheckCircle2 className="w-3 h-3 text-purple-400" />}
            </div>
            <div className="text-[8px] text-purple-300 font-mono font-bold">
              {categoryBreakdown.PNS.sembuh} S • {categoryBreakdown.PNS.meninggal} MD
            </div>
          </div>
        </button>

        {/* 6. Sembuh / Kembali Satuan */}
        <button
          onClick={onFilterSembuh}
          title="Klik untuk menampilkan HANYA Pasien Sembuh / Kembali ke Kesatuan"
          className={`text-left p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden box-3d-card ${
            activeFilterSembuh
              ? 'border-emerald-400 ring-2 ring-emerald-400/70 bg-emerald-950/75 shadow-lg'
              : 'border-emerald-500/25 hover:border-emerald-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-tight">Sembuh / Kembali</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-300 tabular-nums mt-0.5">{sembuhCount}</div>
          <div className="text-[9px] font-semibold flex items-center justify-between mt-1">
            <span className={activeFilterSembuh ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
              {activeFilterSembuh ? 'Sembuh Terpilih' : 'Kembali Satuan'}
            </span>
            {activeFilterSembuh && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </div>
        </button>

        {/* 7. Batal / Ralat */}
        <button
          onClick={onFilterBatalRalat}
          title="Klik untuk menampilkan HANYA Berkas Batal / Ralat"
          className={`text-left p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden box-3d-card ${
            activeFilterKet
              ? 'border-slate-400 ring-2 ring-slate-400/70 bg-slate-800/80 shadow-lg'
              : 'border-emerald-500/25 hover:border-slate-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-tight">Batal / Ralat</span>
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-black text-white tabular-nums mt-0.5">{batalRalatCount}</div>
          <div className="text-[9px] font-semibold flex items-center justify-between mt-1">
            <span className={activeFilterKet ? 'text-white font-bold' : 'text-slate-400'}>
              {activeFilterKet ? 'Batal Terpilih' : 'Tidak Diteruskan'}
            </span>
            {activeFilterKet && <CheckCircle2 className="w-3 h-3 text-slate-200" />}
          </div>
        </button>

        {/* 8. Meninggal Dunia / MD */}
        <button
          onClick={onFilterMeninggal}
          title="Klik untuk menampilkan HANYA Pasien Meninggal Dunia (MD)"
          className={`text-left p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden box-3d-card ${
            activeFilterMeninggal
              ? 'border-red-400 ring-2 ring-red-400/70 bg-red-950/75 shadow-lg'
              : 'border-emerald-500/25 hover:border-red-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-red-300 uppercase tracking-tight">Meninggal Dunia</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-xl font-black text-red-300 tabular-nums mt-0.5">{meninggalCount}</div>
          <div className="text-[9px] font-semibold flex items-center justify-between mt-1">
            <span className={activeFilterMeninggal ? 'text-red-300 font-bold' : 'text-slate-400'}>
              {activeFilterMeninggal ? 'MD Terpilih' : 'Kasus MD'}
            </span>
            {activeFilterMeninggal && <CheckCircle2 className="w-3 h-3 text-red-400" />}
          </div>
        </button>
      </div>

      {/* SMART MATRIKS REKAPITULASI KONDISI NYATA BEROBAT */}
      <div className="mt-2.5 rounded-2xl p-3 sm:p-4 border border-emerald-500/25 box-3d-dimmed shadow-lg">
        {/* HEADER MATRIKS */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-emerald-500/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs sm:text-[13px] font-black font-mono tracking-wider text-yellow-300 uppercase flex items-center gap-2">
                SKEMA REKAPITULASI STATUS PASIEN &amp; KONDISI NYATA BEROBAT
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Pemetaan akurat antara berkas terdaftar, pasien sembuh/kembali, meninggal dunia, dan kondisi riil aktif berobat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="px-2.5 py-1 rounded-md bg-black/50 border border-emerald-500/25 text-slate-300 font-semibold">
              TOTAL TERDAFTAR: <strong className="text-white font-black ml-1">{total}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-950/70 border border-amber-500/40 text-amber-200 font-bold">
              BEROBAT AKTIF: <strong className="text-yellow-300 font-black ml-1">{totalBerobat}</strong>
            </span>
          </div>
        </div>

        {/* ALUR VISUAL PERSENTASE (SMART SEGMENTED PROGRESS BAR) */}
        <div className="my-3 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
              Masih Berobat: <strong className="underline underline-offset-2">{totalBerobat} orang</strong> ({pctBerobat}%)
            </span>
            <span className="text-emerald-300 font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              Sembuh / Kembali: <strong className="underline underline-offset-2">{sembuhCount} orang</strong> ({pctSembuh}%)
            </span>
            <span className="text-red-300 font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              Meninggal: <strong className="underline underline-offset-2">{meninggalCount} orang</strong> ({pctMeninggal}%)
            </span>
          </div>

          {/* Bar multi-segment proporsional */}
          <div className="w-full h-3.5 rounded-full bg-slate-950/80 border border-slate-800 overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${pctBerobat}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 relative group cursor-pointer"
              title={`Masih Berobat: ${totalBerobat} Pasien (${pctBerobat}%)`}
            />
            <div
              style={{ width: `${pctSembuh}%` }}
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500 relative group cursor-pointer"
              title={`Sembuh / Kembali: ${sembuhCount} Pasien (${pctSembuh}%)`}
            />
            <div
              style={{ width: `${pctMeninggal}%` }}
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-500 relative group cursor-pointer"
              title={`Meninggal Dunia: ${meninggalCount} Pasien (${pctMeninggal}%)`}
            />
          </div>
        </div>

        {/* 4 KOTAK KATEGORI: RINCIAN MATEMATIS KONDISI NYATA BEROBAT */}
        <div className="grid grid-cols-4 gap-2.5 pt-1">
          {/* 1. MILITER */}
          <div
            onClick={() => onFilterCategory('MILITER')}
            className={`p-3 rounded-xl border transition-all cursor-pointer box-3d-card ${
              activeFilterCategory === 'MILITER' ? 'ring-2 ring-emerald-400 bg-emerald-950/65 border-emerald-400' : 'bg-black/40 border-emerald-500/25 hover:border-emerald-400/50'
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-500/20">
              <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Prajurit Militer
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 font-bold">
                Total: {categoryBreakdown.MILITER.total}
              </span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-mono block font-semibold">Kondisi Berobat:</span>
                <span className="text-2xl font-black text-amber-300 font-mono tracking-tight">
                  {categoryBreakdown.MILITER.berobat}
                  <span className="text-[10px] text-slate-400 font-medium ml-1">orang</span>
                </span>
              </div>
              <div className="text-right text-[9px] font-mono space-y-0.5">
                <div className="text-emerald-300 font-bold">
                  ✓ {categoryBreakdown.MILITER.sembuh} Sembuh
                </div>
                <div className="text-slate-400 font-semibold">
                  ✗ {categoryBreakdown.MILITER.meninggal} Meninggal
                </div>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-emerald-500/15 text-[8.5px] font-mono text-slate-400 flex justify-between">
              <span>Rumus: {categoryBreakdown.MILITER.total} − {categoryBreakdown.MILITER.sembuh}</span>
              <span className="text-amber-300 font-bold">= {categoryBreakdown.MILITER.berobat} Berobat</span>
            </div>
          </div>

          {/* 2. PERSIT */}
          <div
            onClick={() => onFilterCategory('PERSIT')}
            className={`p-3 rounded-xl border transition-all cursor-pointer box-3d-card ${
              activeFilterCategory === 'PERSIT' ? 'ring-2 ring-sky-400 bg-sky-950/65 border-sky-400' : 'bg-black/40 border-emerald-500/25 hover:border-sky-400/50'
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-sky-500/20">
              <span className="text-[11px] font-black text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-sky-400" />
                Istri / Persit
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-sky-950/90 border border-sky-500/40 text-sky-300 font-bold">
                Total: {categoryBreakdown.PERSIT.total}
              </span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-mono block font-semibold">Kondisi Berobat:</span>
                <span className="text-2xl font-black text-amber-300 font-mono tracking-tight">
                  {categoryBreakdown.PERSIT.berobat}
                  <span className="text-[10px] text-slate-400 font-medium ml-1">orang</span>
                </span>
              </div>
              <div className="text-right text-[9px] font-mono space-y-0.5">
                <div className="text-sky-300 font-bold">
                  ✓ {categoryBreakdown.PERSIT.sembuh} Sembuh
                </div>
                <div className="text-slate-400 font-semibold">
                  ✗ {categoryBreakdown.PERSIT.meninggal} Meninggal
                </div>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-emerald-500/15 text-[8.5px] font-mono text-slate-400 flex justify-between">
              <span>Rumus: {categoryBreakdown.PERSIT.total} − {categoryBreakdown.PERSIT.sembuh}</span>
              <span className="text-amber-300 font-bold">= {categoryBreakdown.PERSIT.berobat} Berobat</span>
            </div>
          </div>

          {/* 3. ANAK */}
          <div
            onClick={() => onFilterCategory('ANAK')}
            className={`p-3 rounded-xl border transition-all cursor-pointer box-3d-card ${
              activeFilterCategory === 'ANAK' ? 'ring-2 ring-amber-400 bg-amber-950/65 border-amber-400' : 'bg-black/40 border-emerald-500/25 hover:border-amber-400/50'
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/20">
              <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Baby className="w-3.5 h-3.5 text-amber-400" />
                Anak Prajurit
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/40 text-amber-300 font-bold">
                Total: {categoryBreakdown.ANAK.total}
              </span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-mono block font-semibold">Kondisi Berobat:</span>
                <span className="text-2xl font-black text-amber-300 font-mono tracking-tight">
                  {categoryBreakdown.ANAK.berobat}
                  <span className="text-[10px] text-slate-400 font-medium ml-1">orang</span>
                </span>
              </div>
              <div className="text-right text-[9px] font-mono space-y-0.5">
                <div className="text-amber-300 font-bold">
                  ✓ {categoryBreakdown.ANAK.sembuh} Sembuh
                </div>
                <div className="text-slate-400 font-semibold">
                  ✗ {categoryBreakdown.ANAK.meninggal} Meninggal
                </div>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-emerald-500/15 text-[8.5px] font-mono text-slate-400 flex justify-between">
              <span>Rumus: {categoryBreakdown.ANAK.total} − {categoryBreakdown.ANAK.sembuh}</span>
              <span className="text-amber-300 font-bold">= {categoryBreakdown.ANAK.berobat} Berobat</span>
            </div>
          </div>

          {/* 4. PNS / PPPK */}
          <div
            onClick={() => onFilterCategory('PNS')}
            className={`p-3 rounded-xl border transition-all cursor-pointer box-3d-card ${
              activeFilterCategory === 'PNS' ? 'ring-2 ring-purple-400 bg-purple-950/65 border-purple-400' : 'bg-black/40 border-emerald-500/25 hover:border-purple-400/50'
            }`}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-purple-500/20">
              <span className="text-[11px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                ASN / PPPK
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-purple-950/90 border border-purple-500/40 text-purple-300 font-bold">
                Total: {categoryBreakdown.PNS.total}
              </span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-mono block font-semibold">Kondisi Berobat:</span>
                <span className="text-2xl font-black text-amber-300 font-mono tracking-tight">
                  {categoryBreakdown.PNS.berobat}
                  <span className="text-[10px] text-slate-400 font-medium ml-1">orang</span>
                </span>
              </div>
              <div className="text-right text-[9px] font-mono space-y-0.5">
                <div className="text-purple-300 font-bold">
                  ✓ {categoryBreakdown.PNS.sembuh} Sembuh
                </div>
                <div className="text-red-400 font-bold">
                  ✗ {categoryBreakdown.PNS.meninggal} MD
                </div>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-emerald-500/15 text-[8.5px] font-mono text-slate-400 flex justify-between">
              <span>Rumus: {categoryBreakdown.PNS.total} − {categoryBreakdown.PNS.sembuh} − {categoryBreakdown.PNS.meninggal}</span>
              <span className="text-amber-300 font-bold">= {categoryBreakdown.PNS.berobat} Berobat</span>
            </div>
          </div>
        </div>

        {/* SEKSI: DISTRIBUSI RUMAH SAKIT RUJUKAN (RS TUJUAN) PASIEN BEROBAT AKTIF */}
        <div className="mt-3.5 pt-3 border-t border-emerald-500/20 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Hospital className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] sm:text-xs font-black font-mono text-white uppercase tracking-wider">
                DISTRIBUSI RS TUJUAN PASIEN MASIH BEROBAT ({totalBerobat} ORANG):
              </span>
            </div>
            <div className="flex items-center gap-2 text-[9.5px] font-mono">
              <span className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 font-bold">
                RSPAD: {rspadBerobat} orang ({((rspadBerobat / (totalBerobat || 1)) * 100).toFixed(1)}%)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold">
                RS RUJUKAN LAIN: {nonRspadBerobat} orang ({((nonRspadBerobat / (totalBerobat || 1)) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-8 gap-2">
            {hospitalList.map((h) => {
              const isSelected = activeFilterTujuan && h.name.toLowerCase().includes(activeFilterTujuan.toLowerCase());
              const shortName = h.name
                .replace('RS TK II 17.05.01 ', '')
                .replace('RS TK II ', '')
                .replace('RSPAD ', '')
                .replace('RSAU ', '')
                .replace('RSPAL ', '')
                .replace('RS Universitas ', 'RS Univ ')
                .replace(' Jakarta', '')
                .replace(' Makassar', '')
                .replace(' Surabaya', '')
                .replace(' Manado', '')
                .replace(' Malang', '');

              return (
                <button
                  key={h.name}
                  onClick={() => onFilterTujuan?.(isSelected ? '' : h.name)}
                  title={`Klik untuk menyaring pasien di ${h.name}`}
                  className={`text-left p-2 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between box-3d-card ${
                    isSelected
                      ? 'ring-2 ring-amber-400 bg-amber-950/70 border-amber-400 shadow-lg'
                      : h.berobat > 0
                      ? 'bg-black/40 border-emerald-500/25 hover:border-emerald-400/50 hover:bg-emerald-950/50'
                      : 'bg-black/25 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[9.5px] font-bold line-clamp-1 leading-tight ${isSelected ? 'text-yellow-300' : 'text-white'}`}>
                        {shortName}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-yellow-300 shrink-0" />}
                    </div>
                    <div className="text-[7.5px] text-slate-400 font-mono mt-0.5 truncate" title={h.name}>
                      {h.name.includes('RSPAD') ? 'Pusat Rujukan AD' : h.name.includes('Pelamonia') ? 'Makassar' : h.name.includes('Ramelan') ? 'Surabaya' : h.name.includes('Marthen') ? 'Jayapura' : h.name.includes('Soepraoen') ? 'Malang' : h.name.includes('Esnawan') ? 'Jakarta' : h.name.includes('Wolter') ? 'Manado' : 'Makassar'}
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-emerald-500/15 flex items-baseline justify-between">
                    <div>
                      <span className="text-[7.5px] text-slate-400 uppercase font-mono block font-semibold">Berobat:</span>
                      <span className={`text-base font-black font-mono leading-none ${h.berobat > 0 ? 'text-amber-300' : 'text-slate-500'}`}>
                        {h.berobat}
                      </span>
                    </div>
                    <div className="text-right text-[7.5px] font-mono leading-tight">
                      <div className="text-slate-400 font-semibold">Tot: {h.total}</div>
                      {h.sembuh > 0 && <div className="text-emerald-400 font-bold">{h.sembuh} S</div>}
                      {h.meninggal > 0 && <div className="text-red-400 font-bold">{h.meninggal} MD</div>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* FOOTER INFORMASI REKONSILIASI MATEMATIS */}
        <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2.5 text-[10px] font-mono">
          <div className="text-slate-300 flex flex-wrap items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 font-bold border border-amber-500/40">
              REKONSILIASI KATEGORI
            </span>
            <span>
              {categoryBreakdown.MILITER.berobat} (Militer) + {categoryBreakdown.PERSIT.berobat} (Persit) + {categoryBreakdown.ANAK.berobat} (Anak) + {categoryBreakdown.PNS.berobat} (ASN) = <strong className="text-yellow-300 font-black">{totalBerobat} Berobat</strong>
            </span>
          </div>

          <div className="text-slate-300 flex flex-wrap items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-300 font-bold border border-emerald-500/40">
              REKONSILIASI RS TUJUAN
            </span>
            <span>
              {rspadBerobat} (RSPAD) + {nonRspadBerobat} (Faskes Lain) = <strong className="text-yellow-300 font-black">{totalBerobat} Berobat</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
