import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  FileCheck,
  Ban,
  PenTool,
  Calendar,
  Building,
  User,
  ChevronLeft,
  ChevronRight,
  Plane,
  Ship,
  Ambulance,
  Train,
  Sparkles,
  Check,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { EvacuationRecord, PatientCategory, SortField, SortDirection } from '../types/evacuation';
import { isRecordSembuh } from '../data/evacuationData';

interface DataTableProps {
  data: EvacuationRecord[];
  allRecords?: EvacuationRecord[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: PatientCategory | 'ALL';
  onCategoryChange: (cat: PatientCategory | 'ALL') => void;
  selectedHospital: string;
  onHospitalChange: (hospital: string) => void;
  selectedOrigin?: string;
  onOriginChange?: (origin: string) => void;
  selectedYear?: string | null;
  filterOnlySembuh?: boolean;
  onToggleFilterOnlySembuh?: (val: boolean) => void;
  filterBatalRalat?: boolean;
  filterMeninggal?: boolean;
  forceOpenTable?: boolean;
  onResetFilters?: () => void;
  onViewRecord: (record: EvacuationRecord) => void;
  onEditStatus: (record: EvacuationRecord) => void;
  onToggleSembuh?: (record: EvacuationRecord) => void;
  onToggleMeninggal?: (record: EvacuationRecord) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  allRecords,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedHospital,
  onHospitalChange,
  selectedOrigin = '',
  onOriginChange = () => {},
  selectedYear = null,
  filterOnlySembuh = false,
  onToggleFilterOnlySembuh,
  filterBatalRalat = false,
  filterMeninggal = false,
  forceOpenTable = false,
  onResetFilters,
  onViewRecord,
  onEditStatus,
  onToggleSembuh,
  onToggleMeninggal,
}) => {
  const [isTableOpen, setIsTableOpen] = useState<boolean>(false);
  const [sortField, setSortField] = useState<SortField>('no');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterSembuh, setFilterSembuh] = useState<'ALL' | 'SEMBUH' | 'AKTIF'>(
    filterOnlySembuh ? 'SEMBUH' : 'ALL'
  );

  // Sync internal filterSembuh when parent filterOnlySembuh changes
  useEffect(() => {
    if (filterOnlySembuh) {
      setFilterSembuh('SEMBUH');
    } else if (filterSembuh === 'SEMBUH') {
      setFilterSembuh('ALL');
    }
  }, [filterOnlySembuh]);

  // Reset page when category or filters change
  useEffect(() => {
    setCurrentPage(1);
    
    const isDashboardState = 
      !forceOpenTable &&
      selectedCategory === 'ALL' && 
      selectedHospital === '' && 
      selectedOrigin === '' && 
      !selectedYear &&
      !filterOnlySembuh && 
      !filterBatalRalat &&
      !filterMeninggal;

    // Otomatis buka tabel jika ada filter yang ditekan (Militer, Persit, Tahun, dll)
    if (!isDashboardState) {
      setIsTableOpen(true);
    } else {
      // Jika kembali ke Dashboard (filter kosong), sembunyikan tabel kembali
      setIsTableOpen(false);
    }
  }, [forceOpenTable, selectedCategory, selectedHospital, selectedOrigin, selectedYear, filterOnlySembuh, filterBatalRalat, filterMeninggal]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter by Recovery Status if selected
  const filteredByStatus = useMemo(() => {
    return data.filter((item) => {
      const isSembuh = isRecordSembuh(item);
      if (filterSembuh === 'SEMBUH' && !isSembuh) return false;
      if (filterSembuh === 'AKTIF' && isSembuh) return false;
      return true;
    });
  }, [data, filterSembuh]);

  // Sorting
  const sortedData = useMemo(() => {
    return [...filteredByStatus].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'no') {
        aVal = a.no;
        bVal = b.no;
      } else if (sortField === 'tgl') {
        const [d1, m1, y1] = a.tgl.split('/').map(Number);
        const [d2, m2, y2] = b.tgl.split('/').map(Number);
        aVal = new Date(y1, (m1 || 1) - 1, d1 || 1).getTime();
        bVal = new Date(y2, (m2 || 1) - 1, d2 || 1).getTime();
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredByStatus, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const paginatedData = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, validPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-emerald-200 inline ml-1 opacity-60 group-hover:opacity-100 transition" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-yellow-200 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-yellow-200 inline ml-1" />
    );
  };

  const isAnyFilterActive =
    selectedCategory !== 'ALL' ||
    !!selectedYear ||
    filterOnlySembuh ||
    filterBatalRalat ||
    filterMeninggal ||
    selectedHospital !== '' ||
    selectedOrigin !== '' ||
    filterSembuh !== 'ALL' ||
    searchQuery.trim() !== '';

  const renderModaBadge = (rawModa?: string) => {
    const m = (rawModa || 'Pesawat').trim();
    const lower = m.toLowerCase();

    if (lower.includes('kapal') || lower.includes('laut') || lower.includes('kri')) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 font-mono font-semibold shrink-0">
          <Ship className="w-2.5 h-2.5 text-cyan-400" />
          {m}
        </span>
      );
    }

    if (lower.includes('ambulans') || lower.includes('ambulance') || lower.includes('darat') || lower.includes('mobil')) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-mono font-semibold shrink-0">
          <Ambulance className="w-2.5 h-2.5 text-emerald-400" />
          {m}
        </span>
      );
    }

    if (lower.includes('heli') || lower.includes('helikopter')) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-950/70 text-amber-300 border border-amber-500/40 font-mono font-semibold shrink-0">
          <Plane className="w-2.5 h-2.5 text-amber-400" />
          {m}
        </span>
      );
    }

    if (lower.includes('kereta') || lower.includes('train') || lower.includes('ka')) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-950/70 text-purple-300 border border-purple-500/40 font-mono font-semibold shrink-0">
          <Train className="w-2.5 h-2.5 text-purple-400" />
          {m}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-blue-950/70 text-blue-300 border border-blue-500/40 font-mono font-semibold shrink-0">
        <Plane className="w-2.5 h-2.5 text-blue-400" />
        {m || 'Pesawat'}
      </span>
    );
  };

  return (
    <div id="data-table-section" className="box-3d-dimmed border border-emerald-500/30 shadow-2xl rounded-2xl overflow-hidden scroll-mt-6">
      
      {/* TOOLBAR CONTROLS */}
      <div className="px-3 py-2.5 border-b border-emerald-500/25 bg-[#0a190e]/75 flex flex-row flex-nowrap gap-2 justify-between items-center">
        
        <div className="flex items-center justify-between min-w-0 shrink gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[11px] xl:text-xs font-bold text-white tracking-tight whitespace-nowrap truncate">
                Buku Register Pasien Evakuasi KESDAM XVII/Cenderawasih
              </h2>
              <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  Menampilkan {sortedData.length} permohonan surat evakuasi terdaftar {allRecords && sortedData.length < allRecords.length ? `(dari total ${allRecords.length})` : ''}
                </p>
                {selectedYear && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shrink-0">
                    THN {selectedYear}
                  </span>
                )}
                {selectedCategory === 'MILITER' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shrink-0">
                    MILITER
                  </span>
                )}
                {selectedCategory === 'PERSIT' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold shrink-0">
                    PERSIT
                  </span>
                )}
                {selectedCategory === 'ANAK' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shrink-0">
                    ANAK
                  </span>
                )}
                {selectedCategory === 'PNS' && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold shrink-0">
                    ASN/PPPK
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsTableOpen((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-md shrink-0 whitespace-nowrap"
            title={isTableOpen ? 'Sembunyikan Tabel Register' : 'Tampilkan Tabel Register'}
          >
            <span>{isTableOpen ? 'Sembunyikan Tabel' : 'Tampilkan Tabel'}</span>
            {isTableOpen ? <ChevronUp className="w-3.5 h-3.5 text-yellow-300" /> : <ChevronDown className="w-3.5 h-3.5 text-yellow-300" />}
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-nowrap items-center gap-1.5 shrink-0">
          
          {/* Search Input */}
          <div className="relative w-[128px] xl:w-[165px]">
            <Search className="w-3 h-3 absolute left-2.5 top-2 text-emerald-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama, NRP, faskes..."
              className="w-full bg-slate-950/85 border border-slate-700 text-[11px] rounded-lg pl-7 pr-2 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 shadow-inner"
            />
          </div>

          {/* Faskes Filter */}
          <select
            value={selectedHospital}
            onChange={(e) => {
              onHospitalChange(e.target.value);
              setCurrentPage(1);
            }}
            className="w-[104px] xl:w-[128px] bg-slate-950/85 border border-slate-700 text-[11px] rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 cursor-pointer shadow-inner truncate"
          >
            <option value="" className="bg-slate-950 text-slate-100">Semua Faskes</option>
            <option value="RSPAD" className="bg-slate-950 text-slate-100">RSPAD Gatot Soebroto Jakarta</option>
            <option value="Pelamonia" className="bg-slate-950 text-slate-100">RS TK II Pelamonia Makassar</option>
            <option value="Marthen Indey" className="bg-slate-950 text-slate-100">RS TK II Marthen Indey Jayapura</option>
            <option value="RSPAL" className="bg-slate-950 text-slate-100">RSPAL dr. Ramelan Surabaya</option>
            <option value="Soepraoen" className="bg-slate-950 text-slate-100">RS TK II dr. Soepraoen Malang</option>
            <option value="Esnawan" className="bg-slate-950 text-slate-100">RSAU dr. Esnawan Antariksa Jakarta</option>
            <option value="Wolter Mongosidi" className="bg-slate-950 text-slate-100">RS TK II Wolter Mongosidi Manado</option>
          </select>

          {/* Kategori Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              onCategoryChange(e.target.value as PatientCategory | 'ALL');
              setCurrentPage(1);
            }}
            className={`w-[96px] xl:w-[114px] bg-slate-950/85 border border-slate-700 text-[11px] rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 cursor-pointer shadow-inner truncate ${
              selectedCategory !== 'ALL' ? 'ring-1 ring-emerald-400 font-bold text-emerald-300 bg-emerald-950/80' : ''
            }`}
          >
            <option value="ALL" className="bg-slate-950 text-slate-100">Semua Kategori</option>
            <option value="MILITER" className="bg-slate-950 text-slate-100">🛡️ Prajurit Militer</option>
            <option value="PERSIT" className="bg-slate-950 text-slate-100">❤️ Istri / Persit</option>
            <option value="ANAK" className="bg-slate-950 text-slate-100">👶 Anak Prajurit</option>
            <option value="PNS" className="bg-slate-950 text-slate-100">🏢 ASN / PPPK</option>
          </select>

          {/* Filter Status Kesembuhan */}
          <select
            value={filterSembuh}
            onChange={(e) => {
              const val = e.target.value as 'ALL' | 'SEMBUH' | 'AKTIF';
              setFilterSembuh(val);
              if (onToggleFilterOnlySembuh) {
                onToggleFilterOnlySembuh(val === 'SEMBUH');
              }
              setCurrentPage(1);
            }}
            className={`w-[98px] xl:w-[118px] bg-slate-950/85 border border-slate-700 text-[11px] rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 cursor-pointer font-medium shadow-inner truncate ${
              filterSembuh === 'SEMBUH' ? 'ring-1 ring-emerald-400 font-bold text-emerald-300 bg-emerald-950/80' : ''
            }`}
          >
            <option value="ALL" className="bg-slate-950 text-slate-100">Semua Status</option>
            <option value="AKTIF" className="bg-slate-950 text-slate-100">⚕️ Sedang Rawat (Belum Sembuh)</option>
            <option value="SEMBUH" className="bg-slate-950 text-slate-100">✅ Sudah Sembuh / Kembali Satuan</option>
          </select>

        </div>
      </div>

      {/* ACTIVE FILTER BANNER */}
      {isAnyFilterActive && (
        <div className="px-4 py-2.5 bg-emerald-950/60 border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-emerald-300 font-bold uppercase tracking-wider text-[11px]">
              <Filter className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              Filter Aktif:
            </span>
            {selectedCategory === 'MILITER' && (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                🛡️ HANYA PASIEN MILITER
              </span>
            )}
            {selectedCategory === 'PERSIT' && (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                ❤️ HANYA PASIEN ISTRI / PERSIT
              </span>
            )}
            {selectedCategory === 'ANAK' && (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                👶 HANYA PASIEN ANAK PRAJURIT
              </span>
            )}
            {selectedCategory === 'PNS' && (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                🏢 HANYA PASIEN ASN / PPPK
              </span>
            )}
            {filterOnlySembuh && (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ✅ HANYA SUDAH SEMBUH / KEMBALI KE KESATUAN
              </span>
            )}
            {filterBatalRalat && (
              <span className="px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                ⚠️ HANYA BERKAS BATAL / RALAT
              </span>
            )}
            {selectedHospital && (
              <span className="px-2 py-0.5 rounded-full font-semibold bg-black/50 text-emerald-300 border border-emerald-500/35 text-[11px]">
                🏥 RS: {selectedHospital}
              </span>
            )}
            {searchQuery && (
              <span className="px-2 py-0.5 rounded-full font-semibold bg-black/50 text-emerald-300 border border-emerald-500/35 text-[11px]">
                🔍 &ldquo;{searchQuery}&rdquo;
              </span>
            )}
            <span className="text-slate-300 font-mono font-semibold text-[11px]">
              &bull; Menampilkan {sortedData.length} pasien
            </span>
          </div>

          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="px-3 py-1 rounded-lg bg-red-600/85 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hapus Filter (Tampilkan Semua)</span>
            </button>
          )}
        </div>
      )}

      {isTableOpen && (
        <>
          <div className="overflow-x-hidden overflow-y-auto max-h-[560px] relative scrollbar-thin animate-fadeIn bg-[#061009]/80">
          <table className="w-full table-fixed text-left text-[11px] text-slate-200 border-separate border-spacing-0">
          <colgroup>
            <col className="w-[4%]" />
            <col className="w-[15%]" />
            <col className="w-[22%]" />
            <col className="w-[16%]" />
            <col className="w-[18%]" />
            <col className="w-[11%]" />
            <col className="w-[7%]" />
            <col className="w-[7%]" />
          </colgroup>
          <thead className="sticky top-0 z-20 select-none">
            <tr>
              <th
                onClick={() => handleSort('no')}
                className="sticky top-0 z-20 bg-[#0c2313] border-b-2 border-emerald-500/40 px-1 py-2.5 text-center text-[10.5px] leading-tight text-emerald-200 font-bold cursor-pointer group shadow-md"
              >
                No {renderSortIndicator('no')}
              </th>
              <th
                onClick={() => handleSort('srt')}
                className="sticky top-0 z-20 bg-[#0c2313] border-b-2 border-emerald-500/40 px-1.5 py-2.5 text-center text-[10.5px] leading-tight text-emerald-200 font-bold cursor-pointer group shadow-md"
              >
                No. Surat &amp; Tgl {renderSortIndicator('srt')}
              </th>
              <th
                onClick={() => handleSort('nama')}
                className="sticky top-0 z-20 bg-[#0c2313] border-b-2 border-emerald-500/40 px-1.5 py-2.5 text-left text-[10.5px] leading-tight text-emerald-200 font-bold cursor-pointer group shadow-md"
              >
                Nama / Pangkat / NRP (Pendamping) / Kesatuan {renderSortIndicator('nama')}
              </th>
              <th
                onClick={() => handleSort('diag')}
                className="sticky top-0 z-20 bg-[#0c2313] border-b-2 border-emerald-500/40 px-1.5 py-2.5 text-center text-[10.5px] leading-tight text-emerald-200 font-bold cursor-pointer group shadow-md"
              >
                Diagnosa {renderSortIndicator('diag')}
              </th>
              <th
                onClick={() => handleSort('tujuan')}
                className="sticky top-0 z-20 bg-[#0c2313] border-b-2 border-emerald-500/40 px-1.5 py-2.5 text-center text-[10.5px] leading-tight text-emerald-200 font-bold cursor-pointer group shadow-md"
              >
                Rute &amp; Alat Angkut {renderSortIndicator('tujuan')}
              </th>
              <th className="sticky top-0 z-20 bg-[#0c2313] border-b-2 border-emerald-500/40 px-1 py-2.5 text-center text-[10.5px] leading-tight text-emerald-200 font-bold shadow-md">
                Kondisi
              </th>
              <th className="sticky top-0 z-20 bg-[#0c2313] border-b-2 border-emerald-500/40 px-1 py-2.5 text-center text-[10.5px] leading-tight text-emerald-200 font-bold shadow-md">
                Status / Ket
              </th>
              <th className="sticky top-0 z-20 bg-[#0c2313] border-b-2 border-emerald-500/40 px-1 py-2.5 text-center text-[10.5px] leading-tight text-emerald-200 font-bold shadow-md">
                Aksi
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-emerald-500/15 bg-transparent">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileCheck className="w-8 h-8 text-emerald-500/50" />
                    <p className="text-sm font-semibold text-slate-200">Tidak ada data surat evakuasi yang cocok.</p>
                    <p className="text-xs text-slate-400">Silakan ubah filter pencarian atau kata kunci Anda.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const note = (item.ket || '').toLowerCase();
                const isBatal = item.status === 'BATAL' || note.includes('batal');
                const isRalat = item.status === 'RALAT' || note.includes('ralat');
                const isMeninggal = item.status === 'MENINGGAL' || note.includes('meninggal') || note.includes('gugur') || /\bmd\b/.test(note);
                const isSembuh = isRecordSembuh(item);

                const rowKey = item.id ? `row-id-${item.id}` : `row-${item.no}-${item.srt}-${index}`;

                return (
                  <tr
                    key={rowKey}
                    className={`transition-colors duration-150 group ${
                      index % 2 === 1 ? 'bg-[#0b1b0f]/80' : 'bg-[#071209]/70'
                    } hover:bg-emerald-950/60`}
                  >
                    {/* No */}
                    <td className="px-1 py-2 text-center font-mono text-[11px] text-slate-300 font-bold tabular-nums border-b border-emerald-500/10 align-top">
                      {item.no}
                    </td>

                    {/* No. Surat & Tgl */}
                    <td className="px-1.5 py-2 border-b border-emerald-500/10 align-top break-words">
                      <span className="font-mono text-[10.5px] font-bold text-white block tracking-tight leading-snug break-all">
                        {item.srt}
                      </span>
                      <span className="text-[10px] text-emerald-300/80 font-mono flex items-center gap-1 mt-0.5 font-medium">
                        <Calendar className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        {item.tgl}
                      </span>
                    </td>

                    {/* Nama / Pangkat / NRP (Pendamping) / Kesatuan */}
                    <td className="px-1.5 py-2 border-b border-emerald-500/10 align-top break-words">
                      {/* Baris 1: Nama Pasien + Badge Kategori */}
                      <div className="font-bold text-white flex items-center gap-1 flex-wrap leading-tight">
                        <span className="text-[11.5px] font-bold tracking-tight text-white break-words">
                          {(() => {
                            let name = item.nama;
                            if (item.kategori === 'PERSIT' && !name.toLowerCase().startsWith('ny.') && !name.toLowerCase().startsWith('ny ')) {
                              name = `Ny. ${name}`;
                            } else if (item.kategori === 'ANAK' && !name.toLowerCase().startsWith('an.') && !name.toLowerCase().startsWith('an ')) {
                              name = `An. ${name}`;
                            }
                            return name;
                          })()}
                        </span>
                        {item.kategori === 'MILITER' && (
                          <span className="px-1 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold shrink-0">
                            Militer
                          </span>
                        )}
                        {item.kategori === 'PERSIT' && (
                          <span className="px-1 py-0.5 rounded text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono font-bold shrink-0">
                            Persit
                          </span>
                        )}
                        {item.kategori === 'ANAK' && (
                          <span className="px-1 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold shrink-0">
                            Anak
                          </span>
                        )}
                        {item.kategori === 'PNS' && (
                          <span className="px-1 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold shrink-0">
                            ASN/PPPK
                          </span>
                        )}
                      </div>

                      {/* Baris 2: Pangkat / NRP (pendamping) */}
                      <div className="text-[10px] text-slate-300 font-mono font-semibold tracking-tight mt-0.5 leading-snug break-words">
                        {(() => {
                          const hasPendamping = item.pendamping && item.pendamping !== '-' && item.pendamping !== '_';
                          const idText = item.identitas || '-';

                          if (item.kategori === 'PERSIT') {
                            if (idText.startsWith('I/d') || idText.startsWith('I/s')) {
                              if (hasPendamping && !idText.toLowerCase().includes(item.pendamping.toLowerCase())) {
                                return `${idText} (${item.pendamping})`;
                              }
                              return idText;
                            }
                            if (hasPendamping) {
                              if (item.pendamping.toLowerCase().includes('suami')) {
                                return idText !== '-' ? `I/d ${item.pendamping} / ${idText}` : `I/d ${item.pendamping}`;
                              }
                              return `I/d ${item.pendamping} (${idText})`;
                            }
                            return idText !== '-' ? `I/d ${idText}` : '-';
                          }

                          if (item.kategori === 'ANAK') {
                            if (hasPendamping && !idText.toLowerCase().includes(item.pendamping.toLowerCase())) {
                              return `${idText} (Pendamping: ${item.pendamping})`;
                            }
                            return idText;
                          }

                          if (hasPendamping && !idText.toLowerCase().includes(item.pendamping.toLowerCase())) {
                            return `${idText} (${item.pendamping})`;
                          }
                          return idText;
                        })()}
                      </div>

                      {/* Baris 3: Kesatuan */}
                      <div className="text-[10px] text-slate-400 mt-0.5 font-medium leading-tight break-words" title={item.kesatuan}>
                        {item.kesatuan}
                      </div>
                    </td>

                    {/* Diagnosa */}
                    <td className="px-1.5 py-2 text-slate-200 text-[10.5px] leading-snug border-b border-emerald-500/10 align-top break-words" title={item.diag}>
                      <span className="font-semibold text-slate-100">
                        {item.diag || '-'}
                      </span>
                    </td>

                    {/* Faskes Asal, Tujuan & Alat Angkut */}
                    <td className="px-1.5 py-2 border-b border-emerald-500/10 align-top break-words">
                      <div className="text-[10px] text-slate-300 leading-tight break-words">
                        <span className="text-slate-400 font-mono text-[9.5px] mr-1 font-semibold">Asal:</span>
                        <span className="text-slate-200 font-semibold">{item.asal || 'RS Tk.II 07.05.01 Marthen Indey'}</span>
                      </div>
                      <div className="text-[10px] text-blue-300 leading-tight mt-1 break-words">
                        <span className="text-slate-400 font-mono text-[9.5px] mr-1 font-semibold">Tujuan:</span>
                        <span className="text-blue-300 font-bold">{item.tujuan || 'RSPAD Gatot Soebroto Jakarta'}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 flex-wrap">
                        <span className="text-[9.5px] text-slate-400 font-mono font-semibold">Angkut:</span>
                        {renderModaBadge(item.moda)}
                      </div>
                    </td>

                    {/* Checkbox Kondisi: Sembuh / Kembali & Meninggal Dunia */}
                    <td className="px-1 py-2 text-center border-b border-emerald-500/10 align-top">
                      <div className="flex flex-col items-stretch justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onToggleSembuh && onToggleSembuh(item)}
                          className={`inline-flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[10px] font-semibold transition cursor-pointer border w-full ${
                            isSembuh
                              ? 'bg-emerald-950/60 text-emerald-200 border-emerald-500/50 shadow-md hover:bg-emerald-900/70'
                              : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-emerald-500/50 hover:text-emerald-200'
                          }`}
                          title={isSembuh ? 'Klik untuk membatalkan status sembuh (Kembali ke status dalam perawatan)' : 'Centang untuk menyatakan PASIEN SUDAH SEMBUH / KEMBALI KE KESATUAN'}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-all shrink-0 ${
                              isSembuh
                                ? 'bg-emerald-600 text-white shadow-inner border border-emerald-400'
                                : 'bg-slate-950 border border-slate-600 hover:border-emerald-500'
                            }`}
                          >
                            {isSembuh && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <div className="flex flex-col text-left leading-tight min-w-0">
                            <span className={`text-[9.5px] font-bold leading-tight ${isSembuh ? 'text-emerald-300' : 'text-slate-200'}`}>
                              {isSembuh ? 'Sembuh' : 'Rawat'}
                            </span>
                            {isSembuh && (
                              <span className="text-[8.5px] text-emerald-400 font-mono font-semibold truncate">
                                {item.tanggalSembuh || 'Tuntas'}
                              </span>
                            )}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleMeninggal && onToggleMeninggal(item)}
                          className={`inline-flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[10px] font-semibold transition cursor-pointer border w-full ${
                            isMeninggal
                              ? 'bg-red-950/70 text-red-200 border-red-500/50 shadow-md hover:bg-red-900/70'
                              : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-red-500/50 hover:text-red-200'
                          }`}
                          title={isMeninggal ? 'Klik untuk membatalkan status Meninggal Dunia (Kembali ke status dalam perawatan)' : 'Centang untuk menyatakan PASIEN MENINGGAL DUNIA (MD)'}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-all shrink-0 ${
                              isMeninggal
                                ? 'bg-red-600 text-white shadow-inner border border-red-400'
                                : 'bg-slate-950 border border-slate-600 hover:border-red-500'
                            }`}
                          >
                            {isMeninggal && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <div className="flex flex-col text-left leading-tight min-w-0">
                            <span className={`text-[9.5px] font-bold leading-tight ${isMeninggal ? 'text-red-300' : 'text-slate-200'}`}>
                              MD
                            </span>
                          </div>
                        </button>
                      </div>
                    </td>

                    {/* Keterangan */}
                    <td className="px-1 py-2 text-center border-b border-emerald-500/10 align-top">
                      {isMeninggal ? (
                        <span className="inline-flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-300 border border-red-500/40 font-bold font-mono leading-tight text-center">
                          <AlertTriangle className="w-2.5 h-2.5 text-red-400 shrink-0" />
                          <span>MD</span>
                        </span>
                      ) : isBatal ? (
                        <span className="inline-flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-slate-700/60 text-slate-200 border border-slate-500/40 font-bold font-mono leading-tight">
                          <Ban className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                          <span>Batal</span>
                        </span>
                      ) : isRalat ? (
                        <span className="inline-flex items-center justify-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold font-mono leading-tight">
                          <PenTool className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span>Ralat</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-1 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold leading-tight">
                          Sah
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="px-1 py-2 text-center border-b border-emerald-500/10 align-top">
                      <div className="flex flex-col items-stretch justify-center gap-1">
                        <button
                          onClick={() => onViewRecord(item)}
                          className="p-1 px-1.5 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1 text-[10px] font-semibold"
                          title="Lihat Format Cetak Rekap Evakuasi Resmi"
                        >
                          <Eye className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Lihat</span>
                        </button>
                        <button
                          onClick={() => onEditStatus(item)}
                          className="p-1 px-1.5 rounded-md bg-emerald-950/90 hover:bg-emerald-700 text-emerald-200 hover:text-white border border-emerald-500/40 transition cursor-pointer flex items-center justify-center gap-1 text-[10px] font-bold shadow-md"
                          title="Edit Lengkap Data Pasien & Koreksi Penulisan Otomatis"
                        >
                          <PenTool className="w-3 h-3 shrink-0" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION FOOTER */}
      <div className="p-3.5 border-t border-emerald-500/25 bg-[#07130a]/90 flex flex-wrap justify-between items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-medium">Baris per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950/90 border border-slate-700 text-xs rounded px-2.5 py-1 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
            >
              <option value={15} className="bg-slate-950 text-slate-100">15</option>
              <option value={20} className="bg-slate-950 text-slate-100">20</option>
              <option value={35} className="bg-slate-950 text-slate-100">35</option>
              <option value={Math.max(sortedData.length, 100)} className="bg-slate-950 text-slate-100">
                Semua ({sortedData.length})
              </option>
            </select>
            <span className="ml-2 font-mono tabular-nums text-emerald-300 font-semibold">
              Menampilkan {sortedData.length === 0 ? 0 : (validPage - 1) * pageSize + 1} -{' '}
              {Math.min(validPage * pageSize, sortedData.length)} dari {sortedData.length} berkas
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={validPage <= 1}
              className="px-3 py-1 rounded-lg bg-slate-900/90 hover:bg-emerald-950 border border-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 font-bold transition cursor-pointer shadow-md"
            >
              <ChevronLeft className="w-3.5 h-3.5 inline mr-1" />
              Prev
            </button>
            <span className="px-3 py-1 text-slate-200 font-bold">
              Halaman {validPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={validPage >= totalPages}
              className="px-3 py-1 rounded-lg bg-slate-900/90 hover:bg-emerald-950 border border-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 font-bold transition cursor-pointer shadow-md"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
            </button>
          </div>
        </div>
        </>
      )}

    </div>
  );
};
