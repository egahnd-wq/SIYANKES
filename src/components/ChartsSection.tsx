import React, { useState, useMemo } from 'react';
import { Hospital, TrendingUp, MapPin, Building2, CheckCircle2 } from 'lucide-react';
import { EvacuationRecord } from '../types/evacuation';
import { getMonthIndex, isRecordSembuh } from '../data/evacuationData';

interface ChartsSectionProps {
  data: EvacuationRecord[];
  selectedMonth: number | null;
  onSelectMonth: (monthIdx: number | null) => void;
  selectedHospital: string;
  onSelectHospital: (hospital: string) => void;
  selectedOrigin?: string;
  onSelectOrigin?: (origin: string) => void;
}

const PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#f97316', // orange
  '#eab308', // yellow
  '#14b8a6', // teal
  '#6366f1', // indigo
];

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  data,
  selectedHospital,
  onSelectHospital,
  selectedOrigin = '',
  onSelectOrigin = () => {},
}) => {
  const [chartView, setChartView] = useState<'TUJUAN' | 'ASAL'>('TUJUAN');

  // 1. Dynamic Calculation of Grouped Destination Hospitals
  const tujuanDistribution = useMemo(() => {
    const countsMap = new Map<string, { total: number; berobat: number; sembuh: number; meninggal: number }>();
    data.forEach((item) => {
      let t = (item.tujuan || 'Tidak Diketahui').trim().toLowerCase();
      let group = 'Lainnya';
      if (t.includes('rspad') || t.includes('gatot soebroto')) group = 'RSPAD Gatot Soebroto Jakarta';
      else if (t.includes('marthen')) group = 'RS TK II 17.05.01 Marthen Indey';
      else if (t.includes('pelamonia')) group = 'RS TK II Pelamonia Makassar';
      else if (t.includes('wolter')) group = 'RS TK II Wolter Mongosidi Manado';
      else if (t.includes('soepraoen')) group = 'RS TK II dr. Soepraoen Malang';
      else if (t.includes('ramelan')) group = 'RSPAL dr. Ramelan Surabaya';
      else if (t.includes('esnawan')) group = 'RSAU dr. Esnawan Jakarta';
      else if (t.includes('hasanuddin')) group = 'RS Universitas Hasanuddin Makassar';
      else if (t.includes('cipto')) group = 'RS Cipto Mangunkusumo Jakarta';
      
      const note = `${item.ket || ''} ${item.srt || ''}`.toLowerCase();
      const isMeninggal =
        item.status === 'MENINGGAL' ||
        note.includes('meninggal') ||
        note.includes('gugur') ||
        /\bmd\b/.test(note);
      const isSembuh = !isMeninggal && isRecordSembuh(item);

      const curr = countsMap.get(group) || { total: 0, berobat: 0, sembuh: 0, meninggal: 0 };
      curr.total++;
      if (isMeninggal) curr.meninggal++;
      else if (isSembuh) curr.sembuh++;
      else curr.berobat++;

      countsMap.set(group, curr);
    });

    return Array.from(countsMap.entries())
      .sort((a, b) => b[1].berobat - a[1].berobat || b[1].total - a[1].total)
      .map(([name, stats], idx) => ({
        label: name,
        key: name,
        count: stats.total,
        total: stats.total,
        berobat: stats.berobat,
        sembuh: stats.sembuh,
        meninggal: stats.meninggal,
        color: PALETTE[idx % PALETTE.length],
      }));
  }, [data]);

  // 2. Dynamic Calculation of Grouped Origin Facilities
  const asalDistribution = useMemo(() => {
    const countsMap = new Map<string, number>();
    data.forEach((item) => {
      let a = (item.asal || 'Tidak Diketahui').trim().toLowerCase();
      let group = 'Lainnya';
      if (a.includes('marthen')) group = 'RS TK II 17.05.01 Marthen Indey';
      else if (a.includes('ono')) group = 'RS TK IV ONO DORO ENAKOE';
      else if (a.includes('timika')) group = 'Rumkitban 17.08.01 Timika';
      else if (a.includes('nabire')) group = 'Polkes 17.09.03 Nabire';
      else if (a.includes('serui')) group = 'Polkes 17.09.05 Serui';
      else if (a.includes('biak')) group = 'Polkes 17.09.03 Biak';
      else if (a.includes('dustira')) group = 'RS TK II Dustira Bandung';
      
      countsMap.set(group, (countsMap.get(group) || 0) + 1);
    });

    return Array.from(countsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        label: name,
        key: name,
        count,
        color: PALETTE[(idx + 2) % PALETTE.length],
      }));
  }, [data]);

  const activeGroup = chartView === 'TUJUAN' ? tujuanDistribution : asalDistribution;
  const totalActiveRecords = data.length || 1;

  const donutSlices = activeGroup.map((item, i) => {
    return {
      ...item,
      percentage: ((item.count / totalActiveRecords) * 100).toFixed(1),
      index: i,
    };
  });

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header & Group Logic */}
      {(() => {
        const groups: Record<string, EvacuationRecord[]> = {
          '1-3': [],
          '4-6': [],
          '6-9': [],
          '9-12+': [],
          'sembuh': [],
        };
        const today = new Date('2026-11-01');

        data.forEach((item) => {
          const note = `${item.ket || ''} ${item.srt || ''}`.toLowerCase();
          const isMeninggal =
            item.status === 'MENINGGAL' ||
            note.includes('meninggal') ||
            note.includes('gugur') ||
            /\bmd\b/.test(note);
          if (isMeninggal) {
            return;
          }
          if (isRecordSembuh(item)) {
            groups['sembuh'].push(item);
            return;
          }

          const parts = item.tgl.split('/');
          if (parts.length === 3) {
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const y = parseInt(parts[2], 10);
            if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
              const date = new Date(y, m - 1, d);
              const diffTime = Math.abs(today.getTime() - date.getTime());
              const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

              if (diffMonths <= 3) groups['1-3'].push(item);
              else if (diffMonths <= 6) groups['4-6'].push(item);
              else if (diffMonths <= 9) groups['6-9'].push(item);
              else groups['9-12+'].push(item);
            }
          }
        });

        const totalActiveCount = groups['1-3'].length + groups['4-6'].length + groups['6-9'].length + groups['9-12+'].length;
        const totalSembuhCount = groups['sembuh'].length;

        const groupConfigs = [
          { key: '1-3', label: '1 - 3 Bln', sublabel: 'Fase Awal', border: 'card-duration-1-3 box-3d-card border-blue-500/35', badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-500/40', hoverTheme: 'hover:bg-blue-950/60 hover:border-blue-400/50', accentColor: 'text-blue-400', isSembuh: false },
          { key: '4-6', label: '4 - 6 Bln', sublabel: 'Lanjutan', border: 'card-duration-4-6 box-3d-card border-emerald-500/35', badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40', hoverTheme: 'hover:bg-emerald-950/60 hover:border-emerald-400/50', accentColor: 'text-emerald-400', isSembuh: false },
          { key: '6-9', label: '6 - 9 Bln', sublabel: 'Observasi', border: 'card-duration-6-9 box-3d-card border-amber-500/35', badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-500/40', hoverTheme: 'hover:bg-amber-950/60 hover:border-amber-400/50', accentColor: 'text-amber-400', isSembuh: false },
          { key: '9-12+', label: '9 - 12+ Bln', sublabel: 'Kronis', border: 'card-duration-9-12 box-3d-card border-rose-500/35', badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-500/40', hoverTheme: 'hover:bg-rose-950/60 hover:border-rose-400/50', accentColor: 'text-rose-400', isSembuh: false },
          { key: 'sembuh', label: 'Sembuh', sublabel: 'Kembali Satuan', border: 'box-3d-card border-emerald-400/45 bg-emerald-950/45 shadow-lg', badgeColor: 'bg-emerald-600/80 text-white border-emerald-400/50', hoverTheme: 'hover:bg-emerald-900/60 hover:border-emerald-400/60', accentColor: 'text-emerald-400', isSembuh: true },
        ];

        return (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 px-1.5">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h2 className="text-[13px] font-black font-mono text-yellow-300 tracking-[0.2em] uppercase">
                  STATUS OPERASIONAL PASIEN
                </h2>
              </div>
              <div className="flex items-center gap-2.5 text-[10px] font-mono">
                <span className="px-3 py-1 rounded-lg bg-black/50 text-slate-300 border border-emerald-500/25 shadow-inner font-semibold">
                  TOTAL AKTIF: <strong className="text-amber-300 font-black ml-1">{totalActiveCount}</strong>
                </span>
                <span className="px-3 py-1 rounded-lg bg-emerald-950/75 text-emerald-300 border border-emerald-500/40 font-bold shadow-inner">
                  TOTAL SEMBUH: <strong className="text-emerald-300 font-black ml-1">{totalSembuhCount}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {/* 5 Card Durasi */}
              {groupConfigs.map(({ key, label, sublabel, border, badgeColor, hoverTheme, accentColor, isSembuh }) => {
                const patients = groups[key] || [];
                return (
                  <div
                    key={key}
                    className={`p-3.5 rounded-2xl flex flex-col gap-3 border shadow-lg transition-all duration-300 hover:scale-[1.01] ${border}`}
                  >
                    <div className="border-b border-white/10 pb-2.5 flex justify-between items-start">
                      <div>
                        <div className={`font-black text-[11px] flex items-center gap-2 ${isSembuh ? 'text-emerald-300' : 'text-white'}`}>
                          {isSembuh ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <div className={`w-2 h-2 rounded-full ${accentColor.replace('text-', 'bg-')}`}></div>}
                          <span className="tracking-tight uppercase">{label}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5 block uppercase tracking-[0.1em] font-semibold">{sublabel}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-black ${badgeColor}`}>
                        {patients.length}
                      </span>
                    </div>

                    <div className="h-48 overflow-y-auto space-y-2 scrollbar-thin pr-1">
                      {patients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[9px] text-slate-500 font-bold tracking-widest">
                          TIDAK ADA DATA
                        </div>
                      ) : (
                        patients.map((p, pIdx) => (
                          <div
                            key={`${p.no}-${pIdx}`}
                            className={`text-[10px] flex flex-col gap-1 p-2.5 rounded-xl border transition-all cursor-default group ${
                              isSembuh
                                ? `bg-emerald-950/50 border-emerald-500/30 text-emerald-100 ${hoverTheme}`
                                : `bg-black/40 border-white/10 text-slate-200 ${hoverTheme}`
                            }`}
                          >
                            <div className="flex justify-between items-center text-slate-400 font-mono text-[8px] font-bold">
                              <span>#{p.no.toString().padStart(3, '0')}</span>
                              <span>{isSembuh && p.tanggalSembuh ? p.tanggalSembuh : p.tgl}</span>
                            </div>
                            <div className="font-bold truncate text-[11px] tracking-tight text-white group-hover:text-yellow-300 transition-colors">{p.nama}</div>
                            <div className="text-[9px] text-slate-300 truncate uppercase tracking-tighter font-medium">
                              {p.identitas?.split('/')[0]} / {p.kesatuan}
                            </div>
                            <div className={`text-[8px] truncate font-bold px-1.5 py-0.5 rounded border inline-block w-fit tracking-tight ${isSembuh ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' : 'bg-blue-950/70 text-blue-300 border-blue-500/30'}`}>
                              {p.tujuan}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 6. Donut Chart Box (Sebelah Sembuh) */}
              <div className="box-3d-card p-3.5 rounded-2xl flex flex-col border border-emerald-500/30 shadow-lg transition-all duration-300 hover:border-emerald-400/50">
                <div className="flex items-center justify-between mb-2.5 border-b border-emerald-500/20 pb-2">
                  <h2 className="text-[11px] font-black text-white flex items-center gap-2 uppercase tracking-tighter">
                    {chartView === 'TUJUAN' ? <Hospital className="w-3.5 h-3.5 text-emerald-400" /> : <MapPin className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>Distribusi {chartView === 'TUJUAN' ? 'Tujuan' : 'Asal'}</span>
                  </h2>
                  <div className="flex gap-1">
                    <button onClick={() => setChartView('TUJUAN')} className={`p-1 rounded transition-all cursor-pointer ${chartView === 'TUJUAN' ? 'bg-emerald-600 text-white border border-emerald-400/60' : 'bg-black/40 text-slate-400 hover:text-white border border-emerald-500/20'}`} title="Lihat RS Tujuan"><Hospital className="w-3 h-3" /></button>
                    <button onClick={() => setChartView('ASAL')} className={`p-1 rounded transition-all cursor-pointer ${chartView === 'ASAL' ? 'bg-emerald-600 text-white border border-emerald-400/60' : 'bg-black/40 text-slate-400 hover:text-white border border-emerald-500/20'}`} title="Lihat Faskes Asal"><MapPin className="w-3 h-3" /></button>
                  </div>
                </div>

                <div className="h-44 overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
                  {donutSlices.map((slice, sIdx) => {
                    const isSelected = chartView === 'TUJUAN' ? selectedHospital === slice.key || (selectedHospital && slice.key.toLowerCase().includes(selectedHospital.toLowerCase())) : selectedOrigin === slice.key;
                    return (
                      <div
                        key={`legend-${slice.key}-${sIdx}`}
                        onClick={() => chartView === 'TUJUAN' ? onSelectHospital(isSelected ? '' : slice.key) : onSelectOrigin(isSelected ? '' : slice.key)}
                        className={`flex flex-col gap-0.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-emerald-950/75 border-emerald-400/60 shadow-md' : 'bg-black/35 border-emerald-500/15 hover:bg-emerald-950/50 hover:border-emerald-400/40'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                            <span className={`truncate text-[10px] ${isSelected ? 'text-yellow-300 font-bold' : 'text-slate-200 font-semibold'}`}>{slice.label}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono px-3.5">
                          {chartView === 'TUJUAN' && (slice as any).berobat !== undefined ? (
                            <>
                              <span className="text-amber-300 font-bold">{(slice as any).berobat} Berobat</span>
                              <span className="text-slate-400 font-medium">
                                {(slice as any).sembuh > 0 && <span className="text-emerald-400 font-bold mr-1.5">{(slice as any).sembuh} S</span>}
                                {(slice as any).meninggal > 0 && <span className="text-red-400 font-bold mr-1.5">{(slice as any).meninggal} MD</span>}
                                Tot: {slice.count} ({slice.percentage}%)
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-amber-300 font-bold">{slice.count}</span>
                              <span className="text-slate-400 font-semibold">{slice.percentage}%</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
};
