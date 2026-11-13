import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Wand2,
  CheckCircle,
  AlertCircle,
  Building2,
  User,
  Stethoscope,
  Plane,
  Ship,
  Ambulance,
  Train,
  FileText,
  Calendar,
  Sparkles,
  RefreshCw,
  Ban,
  PenTool,
  Check,
  ShieldCheck
} from 'lucide-react';
import { EvacuationRecord, PatientCategory, EvacuationStatus } from '../types/evacuation';
import { determineCategory, determineStatus, isRecordSembuh } from '../data/evacuationData';
import {
  autoCorrectRecordData,
  correctNama,
  correctIdentitas,
  correctKesatuan,
  correctDiagnosa,
  correctHospital,
  correctTanggal,
  correctNomorSurat
} from '../utils/textCorrector';

import { findConflictingRecord } from '../utils/duplicateCheck';

interface EditStatusModalProps {
  record: EvacuationRecord | null;
  allRecords?: EvacuationRecord[];
  onClose: () => void;
  onUpdateRecord: (updated: EvacuationRecord) => void;
}

export const EditStatusModal: React.FC<EditStatusModalProps> = ({
  record,
  allRecords = [],
  onClose,
  onUpdateRecord,
}) => {
  if (!record) return null;

  // Form States
  const [srt, setSrt] = useState(record.srt);
  const [tgl, setTgl] = useState(record.tgl);
  const [nama, setNama] = useState(record.nama);
  const [identitas, setIdentitas] = useState(record.identitas);
  const [kategori, setKategori] = useState<PatientCategory>(
    record.kategori || determineCategory(record.nama, record.identitas)
  );
  const [kesatuan, setKesatuan] = useState(record.kesatuan);
  const [diag, setDiag] = useState(record.diag);
  const [asal, setAsal] = useState(record.asal);
  const [tujuan, setTujuan] = useState(record.tujuan);
  const [moda, setModa] = useState(record.moda);
  const [pendamping, setPendamping] = useState(record.pendamping || '-');
  const [ket, setKet] = useState(record.ket || '-');

  // Status Sembuh & Kembali ke Kesatuan
  const isInitiallySembuh = isRecordSembuh(record);
  const [isSembuh, setIsSembuh] = useState<boolean>(isInitiallySembuh);
  const [tanggalSembuh, setTanggalSembuh] = useState<string>(record.tanggalSembuh || '');
  const [catatanSembuh, setCatatanSembuh] = useState<string>(record.catatanSembuh || '');

  // Quick Status
  const [quickStatus, setQuickStatus] = useState<string>(
    record.ket.toLowerCase().includes('meninggal') || record.ket.toLowerCase().includes('gugur') || /\bmd\b/.test(record.ket.toLowerCase())
      ? 'MENINGGAL'
      : record.ket.toLowerCase().includes('batal')
      ? 'BATAL'
      : record.ket.toLowerCase().includes('ralat')
      ? 'RALAT'
      : 'NORMAL'
  );

  // Auto-correct Notification State
  const [correctionReport, setCorrectionReport] = useState<string[] | null>(null);
  const [liveAutoCorrect, setLiveAutoCorrect] = useState(false);
  const [activeTab, setActiveTab] = useState<'DATA' | 'STATUS'>('DATA');

  // Sync state if record changes
  useEffect(() => {
    if (record) {
      setSrt(record.srt);
      setTgl(record.tgl);
      setNama(record.nama);
      setIdentitas(record.identitas);
      setKategori(record.kategori || determineCategory(record.nama, record.identitas));
      setKesatuan(record.kesatuan);
      setDiag(record.diag);
      setAsal(record.asal);
      setTujuan(record.tujuan);
      setModa(record.moda);
      setPendamping(record.pendamping || '-');
      setKet(record.ket || '-');
      setIsSembuh(isRecordSembuh(record));
      setTanggalSembuh(record.tanggalSembuh || '');
      setCatatanSembuh(record.catatanSembuh || '');
      setCorrectionReport(null);
    }
  }, [record]);

  // Handle Quick Status
  const handleQuickStatusChange = (status: string) => {
    setQuickStatus(status);
    if (status === 'MENINGGAL') {
      setKet('MENINGGAL DUNIA');
    } else if (status === 'BATAL') {
      setKet('BATAL EVAKUASI (Ps sdh sembuh / rujukan mandiri)');
    } else if (status === 'RALAT') {
      setKet('RALAT SURAT (Koreksi Satuan / Identitas Pasien)');
    } else if (status === 'NORMAL') {
      setKet('-');
    }
  };

  // Run full Auto-Correction
  const handleAutoCorrect = () => {
    const result = autoCorrectRecordData({
      nama,
      identitas,
      kesatuan,
      diag,
      asal,
      tujuan,
      moda,
      pendamping,
      ket,
      srt,
      tgl,
    });

    setNama(result.values.nama);
    setIdentitas(result.values.identitas);
    setKesatuan(result.values.kesatuan);
    setDiag(result.values.diag);
    setAsal(result.values.asal);
    setTujuan(result.values.tujuan);
    if (result.values.srt) setSrt(result.values.srt);
    if (result.values.tgl) setTgl(result.values.tgl);

    // Auto-update kategori if identity changed
    setKategori(determineCategory(result.values.nama, result.values.identitas));

    if (result.hasChanges) {
      setCorrectionReport(result.changesSummary);
    } else {
      setCorrectionReport(['Format penulisan sudah standar dan rapi (tidak ada perbaikan yang diperlukan).']);
    }
  };

  // Blur Auto-correction if live enabled
  const handleBlurField = (field: 'nama' | 'identitas' | 'kesatuan' | 'diag' | 'asal' | 'tujuan') => {
    if (!liveAutoCorrect) return;
    if (field === 'nama') setNama((prev) => correctNama(prev));
    if (field === 'identitas') {
      const c = correctIdentitas(identitas);
      setIdentitas(c);
      setKategori(determineCategory(nama, c));
    }
    if (field === 'kesatuan') setKesatuan((prev) => correctKesatuan(prev));
    if (field === 'diag') setDiag((prev) => correctDiagnosa(prev));
    if (field === 'asal') setAsal((prev) => correctHospital(prev));
    if (field === 'tujuan') setTujuan((prev) => correctHospital(prev));
  };

  const duplicateConflict = findConflictingRecord(srt, allRecords, record.no);

  // Save changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim() || !identitas.trim()) {
      alert('Nama dan Pangkat/NRP/Identitas pasien tidak boleh kosong.');
      return;
    }

    if (duplicateConflict) {
      return;
    }

    const todayFormatted = (() => {
      const d = new Date();
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    })();

    const normalizedTgl = correctTanggal(tgl.trim()) || tgl.trim();
    const normalizedSrt = correctNomorSurat(srt.trim(), normalizedTgl) || srt.trim();

    const updatedRecord: EvacuationRecord = {
      ...record,
      srt: normalizedSrt,
      tgl: normalizedTgl,
      nama: nama.trim(),
      identitas: identitas.trim(),
      kategori,
      kesatuan: kesatuan.trim() || 'Kodam XVII/Cenderawasih',
      diag: diag.trim() || '-',
      asal: asal.trim(),
      tujuan: tujuan.trim(),
      moda: moda.trim(),
      pendamping: pendamping.trim() || '-',
      ket: ket.trim() || '-',
      status: determineStatus(ket, srt),
      isSembuh,
      tanggalSembuh: isSembuh ? (correctTanggal(tanggalSembuh.trim()) || todayFormatted) : undefined,
      catatanSembuh: catatanSembuh.trim() || undefined,
      lastEditedAt: new Date().toISOString(),
    };

    onUpdateRecord(updatedRecord);
    onClose();
  };

  // Pre-configured Quick Selection Chips
  const hospitalOptions = [
    'RSPAD Gatot Soebroto Jakarta',
    'RS TK II Pelamonia Makassar',
    'RS TK II 17.05.01 Marthen Indey',
    'RSPAL dr. Ramelan Surabaya',
    'RS TK II dr. Soepraoen Malang',
    'RSAU dr. Esnawan Antariksa Jakarta',
    'RS TK II Wolter Mongosidi Manado',
  ];

  const diagQuickSuggestions = [
    'Fractur Femur Dextra Post KLL',
    'Post Op URS Dextra',
    'TB Paru dengan Hemaptoe',
    'Cholelithiasis',
    'Avascular Necrosis Hip Joint (D)',
    'Trauma ACL & Meniscus Injury Knee (D)',
    'Acute Myocardial Infarction (AMI)',
    'Susp. Appendicitis Akut',
    'Multiple Sclerosis (MS)',
    'Calculus Of Kidney and Ureter',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl box-3d-dimmed border border-emerald-500/35 rounded-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col text-white">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-[#0e2215]/65 to-[#07130a]/75 border-b border-emerald-500/25 px-5 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2 flex-wrap">
                Edit &amp; Perbarui Data Pasien
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  {srt}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Pembaruan informasi registrasi pasien dan administrasi evakuasi medis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TOOLBAR KOREKSI OTOMATIS & TAB SWITCHER */}
        <div className="bg-[#0a180e]/50 border-b border-emerald-500/20 px-5 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Koreksi Otomatis Button & Live Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAutoCorrect}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold transition shadow-lg shadow-emerald-900/30 border border-emerald-400/40 cursor-pointer text-xs"
              title="Perbaiki otomatis singkatan pangkat (Serda, Kapten), korps (Ckm, Cpm), rumah sakit resmi, dan istilah medis"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>✨ Koreksi Otomatis Penulisan</span>
            </button>

            <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer select-none pl-1">
              <input
                type="checkbox"
                checked={liveAutoCorrect}
                onChange={(e) => setLiveAutoCorrect(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px] text-slate-300">Auto-format saat ketik</span>
            </label>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('DATA')}
              className={`px-3 py-1 rounded font-semibold transition cursor-pointer ${
                activeTab === 'DATA'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Data Pasien &amp; Medis
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('STATUS')}
              className={`px-3 py-1 rounded font-semibold transition cursor-pointer ${
                activeTab === 'STATUS'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Status &amp; Keterangan
            </button>
          </div>
        </div>

        {/* NOTIFIKASI HASIL KOREKSI */}
        {correctionReport && (
          <div className="bg-emerald-950/40 border-b border-emerald-500/30 px-5 sm:px-6 py-2.5 text-xs text-emerald-200 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Hasil Pemeriksaan &amp; Koreksi Otomatis:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-100/90 pl-1">
                {correctionReport.slice(0, 4).map((report, idx) => (
                  <li key={idx} className="font-mono">{report}</li>
                ))}
                {correctionReport.length > 4 && (
                  <li className="text-[10px] text-emerald-400 italic">
                    +{correctionReport.length - 4} penyesuaian lainnya diterapkan
                  </li>
                )}
              </ul>
            </div>
            <button
              onClick={() => setCorrectionReport(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MODAL FORM BODY */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1 bg-[#09150c]/55">
          {activeTab === 'DATA' ? (
            <div className="space-y-4">
              
              {/* NOMOR SURAT & TANGGAL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-black/40 border border-slate-800">
                <div>
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    Nomor Surat Register:
                  </label>
                  <input
                    type="text"
                    value={srt}
                    onChange={(e) => setSrt(e.target.value)}
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none ${
                      duplicateConflict
                        ? 'border-red-500 focus:border-red-400 bg-red-950/30'
                        : 'border-slate-700 focus:border-emerald-500'
                    }`}
                    placeholder="B/01/EV/I/2026"
                    required
                  />
                  {duplicateConflict && (
                    <p className="mt-1.5 text-[11px] text-red-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        No. Surat ganda! Sudah terdaftar a.n. {duplicateConflict.nama} (No. {duplicateConflict.no}). Tidak dapat kirim/simpan data!
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Tanggal Terbit Surat:
                  </label>
                  <input
                    type="text"
                    value={tgl}
                    onChange={(e) => setTgl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    placeholder="dd/mm/yyyy"
                    required
                  />
                </div>
              </div>

              {/* IDENTITAS & NAMA PASIEN */}
              <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3.5">
                <div className="font-bold text-emerald-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <User className="w-4 h-4" />
                  Identitas &amp; Data Personel Pasien
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Nama Lengkap Pasien:
                    </label>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      onBlur={() => handleBlurField('nama')}
                      placeholder="Contoh: Randi Wijaya / Ny. Harmawati / An. M. Alfarizan"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Gunakan prefix &quot;Ny.&quot; untuk Persit, &quot;An.&quot; untuk Anak
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Pangkat / NRP / NIP / Hubungan:
                    </label>
                    <input
                      type="text"
                      value={identitas}
                      onChange={(e) => {
                        setIdentitas(e.target.value);
                        setKategori(determineCategory(nama, e.target.value));
                      }}
                      onBlur={() => handleBlurField('identitas')}
                      placeholder="Contoh: Serda/31050819900485 atau I/d Serda Asis"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Otomatis dirapikan format Pangkat &amp; Korps militer
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Kategori Pasien:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['MILITER', 'PERSIT', 'ANAK', 'PNS'] as PatientCategory[]).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setKategori(cat)}
                          className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] border transition cursor-pointer ${
                            kategori === cat
                              ? 'bg-emerald-600 border-emerald-400 text-white shadow'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Kesatuan / Satuan Kerja:
                    </label>
                    <input
                      type="text"
                      value={kesatuan}
                      onChange={(e) => setKesatuan(e.target.value)}
                      onBlur={() => handleBlurField('kesatuan')}
                      placeholder="Contoh: Pomdam XVII/Cenderawasih"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* DIAGNOSA MEDIS */}
              <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3">
                <div className="font-bold text-emerald-300 flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    Diagnosa Klinis Pasien
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Pilih saran cepat atau ketik manual
                  </span>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={diag}
                    onChange={(e) => setDiag(e.target.value)}
                    onBlur={() => handleBlurField('diag')}
                    placeholder="Contoh: Fractur Femur Dextra, Post Op URS, Susp. Appendicitis..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed font-medium"
                    required
                  />
                </div>

                {/* Quick Diagnosa Chips */}
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-medium">Saran Diagnosa Populer:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {diagQuickSuggestions.slice(0, 6).map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDiag(item)}
                        className="text-[10px] bg-slate-900 hover:bg-emerald-950 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 px-2 py-0.5 rounded text-slate-300 transition cursor-pointer"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RUTE & FASKES RUJUKAN */}
              <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3.5">
                <div className="font-bold text-emerald-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Building2 className="w-4 h-4" />
                  Rute &amp; Faskes Evakuasi
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Faskes Asal Pengirim:
                    </label>
                    <input
                      type="text"
                      value={asal}
                      onChange={(e) => setAsal(e.target.value)}
                      onBlur={() => handleBlurField('asal')}
                      placeholder="RS TK II 17.05.01 Marthen Indey"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Faskes Rujukan / Tujuan:
                    </label>
                    <input
                      type="text"
                      value={tujuan}
                      onChange={(e) => setTujuan(e.target.value)}
                      onBlur={() => handleBlurField('tujuan')}
                      placeholder="RSPAD Gatot Soebroto Jakarta"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Quick Hospital Selectors */}
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 font-medium">Pilih Cepat RS Rujukan:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {hospitalOptions.map((hosp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTujuan(hosp)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                          tujuan === hosp
                            ? 'bg-blue-600/30 border-blue-500/60 text-blue-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {hosp.replace(' Jakarta', '').replace(' Makassar', '').replace(' Surabaya', '')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Alat Angkut / Moda Transportasi:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
                      <button
                        type="button"
                        onClick={() => setModa('Pesawat')}
                        className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer ${
                          moda === 'Pesawat'
                            ? 'bg-blue-950 border-blue-500/60 text-blue-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <Plane className="w-3.5 h-3.5" />
                        Pesawat Udara
                      </button>
                      <button
                        type="button"
                        onClick={() => setModa('Helikopter Medevac')}
                        className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer ${
                          moda === 'Helikopter Medevac'
                            ? 'bg-amber-950 border-amber-500/60 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <Plane className="w-3.5 h-3.5" />
                        Heli Medevac
                      </button>
                      <button
                        type="button"
                        onClick={() => setModa('Kapal Laut')}
                        className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer ${
                          moda === 'Kapal Laut'
                            ? 'bg-cyan-950 border-cyan-500/60 text-cyan-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <Ship className="w-3.5 h-3.5" />
                        Kapal Laut
                      </button>
                      <button
                        type="button"
                        onClick={() => setModa('Ambulans Darat')}
                        className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer ${
                          moda === 'Ambulans Darat'
                            ? 'bg-emerald-950 border-emerald-500/60 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <Ambulance className="w-3.5 h-3.5" />
                        Ambulans
                      </button>
                      <button
                        type="button"
                        onClick={() => setModa('Kereta Api')}
                        className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer col-span-2 sm:col-span-1 ${
                          moda === 'Kereta Api'
                            ? 'bg-purple-950 border-purple-500/60 text-purple-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <Train className="w-3.5 h-3.5" />
                        Kereta Api
                      </button>
                    </div>
                    <input
                      type="text"
                      value={moda}
                      onChange={(e) => setModa(e.target.value)}
                      placeholder="Atau ketik alat angkut manual..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Pendamping Pasien:
                    </label>
                    <input
                      type="text"
                      value={pendamping}
                      onChange={(e) => setPendamping(e.target.value)}
                      placeholder="Contoh: Ny. Sulis (Istri) / Dokter Pengawal"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* CHECKBOX STATUS SEMBUH / KEMBALI KE SATUAN */}
                <div className="p-3.5 rounded-xl border border-emerald-500/50 bg-emerald-950/40 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSembuh}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsSembuh(checked);
                        if (checked && !tanggalSembuh) {
                          const d = new Date();
                          setTanggalSembuh(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`);
                        }
                      }}
                      className="w-5 h-5 rounded border-emerald-500 bg-slate-950 text-emerald-500 focus:ring-emerald-500 mt-0.5 cursor-pointer accent-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Pasien Sudah Sembuh / Kembali ke Kesatuan
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        Tandai jika perawatan pasien telah selesai dan telah kembali bertugas di kesatuan asal. Data akan langsung terupdate di Status Berobat Pasien.
                      </div>
                    </div>
                  </label>

                  {isSembuh && (
                    <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-emerald-500/20 mt-1">
                      <div>
                        <label className="text-[11px] text-emerald-200 font-semibold block mb-1">
                          Tanggal Sembuh / Kembali ke Satuan:
                        </label>
                        <input
                          type="text"
                          value={tanggalSembuh}
                          onChange={(e) => setTanggalSembuh(e.target.value)}
                          placeholder="DD/MM/YYYY (Contoh: 15/10/2026)"
                          className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-emerald-200 font-semibold block mb-1">
                          Catatan Pemulihan / Penugasan:
                        </label>
                        <input
                          type="text"
                          value={catatanSembuh}
                          onChange={(e) => setCatatanSembuh(e.target.value)}
                          placeholder="Contoh: Sembuh total, bertugas kembali"
                          className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* TAB STATUS & KETERANGAN */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-4">
                <div className="font-bold text-amber-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <PenTool className="w-4 h-4" />
                  Status Validasi &amp; Catatan Khusus Surat
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-2">
                    Pilihan Status Cepat:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange('NORMAL')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        quickStatus === 'NORMAL'
                          ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <CheckCircle className="w-4 h-4" />
                        Terverifikasi Normal
                      </div>
                      <div className="text-[11px] opacity-80 mt-1">
                        Surat aktif, evakuasi berjalan sesuai prosedur.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange('RALAT')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        quickStatus === 'RALAT'
                          ? 'bg-amber-950/90 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <PenTool className="w-4 h-4" />
                        Ralat Satuan / Nama
                      </div>
                      <div className="text-[11px] opacity-80 mt-1">
                        Surat mengalami ralat penulisan satuan / identitas.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange('BATAL')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        quickStatus === 'BATAL'
                          ? 'bg-rose-950/90 border-rose-500 text-rose-300 ring-1 ring-rose-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <Ban className="w-4 h-4" />
                        Batal Evakuasi
                      </div>
                      <div className="text-[11px] opacity-80 mt-1">
                        Pasien sembuh / rujukan batal diberangkatkan.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange('MENINGGAL')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        quickStatus === 'MENINGGAL'
                          ? 'bg-purple-950/90 border-purple-500 text-purple-300 ring-1 ring-purple-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 text-xs">
                        <AlertCircle className="w-4 h-4" />
                        Meninggal Dunia
                      </div>
                      <div className="text-[11px] opacity-80 mt-1">
                        Status khusus keterangan pasien meninggal dunia.
                      </div>
                    </button>
                  </div>
                </div>

                {/* CHECKBOX PASIEN SUDAH SEMBUH / KEMBALI KE KESATUAN */}
                <div className="p-3.5 rounded-xl border border-emerald-500/50 bg-emerald-950/40 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSembuh}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsSembuh(checked);
                        if (checked && !tanggalSembuh) {
                          const d = new Date();
                          setTanggalSembuh(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`);
                        }
                      }}
                      className="w-5 h-5 rounded border-emerald-500 bg-slate-950 text-emerald-500 focus:ring-emerald-500 mt-0.5 cursor-pointer accent-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Pasien Sudah Sembuh / Kembali ke Kesatuan
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        Centang checkbox ini untuk menyatakan pasien telah selesai berobat / dinyatakan sembuh dan telah kembali ke kesatuan. Pasien akan otomatis terupdate ke kategori <strong>&quot;Sembuh / Kembali ke Kesatuan&quot;</strong> pada Status Berobat Pasien.
                      </div>
                    </div>
                  </label>

                  {isSembuh && (
                    <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-emerald-500/20 mt-1">
                      <div>
                        <label className="text-[11px] text-emerald-200 font-semibold block mb-1">
                          Tanggal Sembuh / Kembali ke Satuan:
                        </label>
                        <input
                          type="text"
                          value={tanggalSembuh}
                          onChange={(e) => setTanggalSembuh(e.target.value)}
                          placeholder="DD/MM/YYYY (Contoh: 15/10/2026)"
                          className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-emerald-200 font-semibold block mb-1">
                          Catatan Pemulihan / Penugasan:
                        </label>
                        <input
                          type="text"
                          value={catatanSembuh}
                          onChange={(e) => setCatatanSembuh(e.target.value)}
                          placeholder="Contoh: Sembuh total, aktif bertugas di batalyon"
                          className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Catatan Keterangan Resmi (Ket):
                  </label>
                  <textarea
                    rows={3}
                    value={ket}
                    onChange={(e) => setKet(e.target.value)}
                    placeholder="Contoh: BATAL EVAKUASI (Ps sdh sembuh) atau RALAT SURAT (Koreksi Satuan)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Isi &quot;-&quot; jika tidak ada catatan khusus. Kata &quot;BATAL&quot; atau &quot;RALAT&quot; akan otomatis mengubah penanda status di tabel.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW KARTU HASIL EDIT */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30">
            <div className="text-[11px] text-slate-400 font-medium mb-2 flex items-center gap-1.5">
              <span>Preview Data Terkini:</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                {kategori}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-bold text-white text-sm">{nama || 'Nama Pasien'}</span>
                <span className="text-slate-400 ml-2 font-mono text-[11px]">({identitas || 'Identitas'})</span>
              </div>
              <div className="text-slate-300 text-[11px]">
                Kesatuan: <strong className="text-white">{kesatuan}</strong>
              </div>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 truncate">
              Diagnosa: <span className="text-amber-300">{diag}</span> &bull; Tujuan: <span className="text-blue-300">{tujuan}</span>
            </div>
          </div>

          {/* MODAL ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!!duplicateConflict}
              className="px-5 py-2 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/70 disabled:bg-red-900/40 disabled:text-red-300 disabled:border-red-500/40 disabled:cursor-not-allowed text-white font-bold flex items-center gap-2 border border-emerald-500/50 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{duplicateConflict ? 'No. Surat Ganda (Terkunci)' : 'Simpan Perubahan Data'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
