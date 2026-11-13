import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Wand2, Printer, AlertCircle } from 'lucide-react';
import { EvacuationRecord } from '../types/evacuation';
import { determineCategory, determineStatus } from '../data/evacuationData';
import { FASKES_AWAL, FASKES_TUJUAN } from '../data/faskesData';
import { autoCorrectRecordData, correctTanggal, correctNomorSurat } from '../utils/textCorrector';
import { LetterPrintTemplate } from './LetterPrintTemplate';
import { findConflictingRecord } from '../utils/duplicateCheck';

interface NewLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextNumber: number;
  allRecords?: EvacuationRecord[];
  onAddRecord: (record: EvacuationRecord) => void;
}

export const NewLetterModal: React.FC<NewLetterModalProps> = ({
  isOpen,
  onClose,
  nextNumber,
  allRecords = [],
  onAddRecord,
}) => {
  const defaultSrt = `B/${nextNumber < 10 ? '0' + nextNumber : nextNumber}/EV/XI/2026`;
  const [srt, setSrt] = useState(defaultSrt);
  const [nama, setNama] = useState('');
  const [umur, setUmur] = useState('');
  const [patientStatus, setPatientStatus] = useState('');
  const [identitas, setIdentitas] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [kesatuan, setKesatuan] = useState('');
  const [diag, setDiag] = useState('');
  const [asal, setAsal] = useState('RS TK II 17.05.01 Marthen Indey');
  const [tujuan, setTujuan] = useState('RSPAD Gatot Soebroto Jakarta');
  const [moda, setModa] = useState('Pesawat');
  
  const [pengantar_nama, setPengantarNama] = useState('');
  const [pengantar_umur, setPengantarUmur] = useState('');
  const [pengantar_identitas, setPengantarIdentitas] = useState('');
  const [pengantar_jabatan, setPengantarJabatan] = useState('');
  const [pengantar_kesatuan, setPengantarKesatuan] = useState('');
  
  const [pendamping, setPendamping] = useState('-');
  const [ket, setKet] = useState('-');
  const [tgl, setTgl] = useState('30/10/2026');

  const [correctionNotice, setCorrectionNotice] = useState<string | null>(null);
  const [previewRecord, setPreviewRecord] = useState<EvacuationRecord | null>(null);

  useEffect(() => {
    setSrt(`B/${nextNumber < 10 ? '0' + nextNumber : nextNumber}/EV/XI/2026`);
  }, [nextNumber]);

  if (!isOpen) return null;

  const suratNumberFormatted = srt.trim() || defaultSrt;
  const duplicateConflict = findConflictingRecord(suratNumberFormatted, allRecords);

  const handleAutoCorrect = () => {
    const res = autoCorrectRecordData({
      nama, identitas, kesatuan, diag, asal, tujuan, moda, pendamping, ket, tgl,
    });
    setNama(res.values.nama);
    setIdentitas(res.values.identitas);
    setKesatuan(res.values.kesatuan);
    setDiag(res.values.diag);
    setAsal(res.values.asal);
    setTujuan(res.values.tujuan);
    if (res.values.tgl) setTgl(res.values.tgl);

    if (res.hasChanges) {
      setCorrectionNotice(`✨ ${res.changeCount} penyesuaian format berhasil diterapkan!`);
    } else {
      setCorrectionNotice('✨ Format penulisan sudah rapi.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateConflict) {
      return;
    }
    if (!nama.trim() || !identitas.trim()) {
      alert('Mohon isi nama pasien dan pangkat/NRP/identitas.');
      return;
    }

    const normalizedTgl = correctTanggal(tgl.trim()) || '30/10/2026';
    const normalizedSrt = correctNomorSurat(suratNumberFormatted, normalizedTgl) || suratNumberFormatted;

    const newRecord: EvacuationRecord = {
      no: nextNumber,
      srt: normalizedSrt,
      tgl: normalizedTgl,
      nama: nama.trim(),
      umur: umur.trim(),
      patientStatus: patientStatus.trim(),
      identitas: identitas.trim(),
      jabatan: jabatan.trim(),
      kesatuan: kesatuan.trim() || 'Kodam XVII/Cenderawasih',
      diag: diag.trim() || 'Evaluasi Medis Spesialistik',
      asal: asal.trim(),
      tujuan: tujuan.trim(),
      moda: moda.trim(),
      pengantar_nama: pengantar_nama.trim(),
      pengantar_umur: pengantar_umur.trim(),
      pengantar_identitas: pengantar_identitas.trim(),
      pengantar_jabatan: pengantar_jabatan.trim(),
      pengantar_kesatuan: pengantar_kesatuan.trim(),
      pendamping: pendamping.trim() || '-',
      ket: ket.trim() || '-',
      kategori: determineCategory(nama, identitas),
      status: determineStatus(ket, suratNumberFormatted),
      lastEditedAt: new Date().toISOString(),
    };

    setPreviewRecord(newRecord);
  };

  const handleFinish = () => {
    if (previewRecord) {
      onAddRecord(previewRecord);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto modal-wrapper">
      <div className="relative w-full max-w-2xl box-3d-dimmed border border-emerald-500/35 rounded-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-white">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0e2215]/65 to-[#07130a]/75 border-b border-emerald-500/25 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                {previewRecord ? 'Pratinjau Surat Evakuasi' : 'Registrasi Surat Permohonan Evakuasi Medis Baru'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {previewRecord ? (
          <div className="p-6 overflow-y-auto bg-slate-100 text-black">
            {duplicateConflict && (
              <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-400 text-red-900 text-xs font-semibold flex items-center gap-2 no-print">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  PERINGATAN: Nomor Surat ({suratNumberFormatted}) ganda/double dengan pasien {duplicateConflict.nama}! Tidak dapat Kirim Data, Unduh, atau Cetak.
                </span>
              </div>
            )}
            <LetterPrintTemplate record={previewRecord} />
            <div className="mt-6 flex justify-end gap-2 no-print">
              <button
                type="button"
                disabled={!!duplicateConflict}
                onClick={() => {
                  if (duplicateConflict) return;
                  window.print();
                }}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Surat</span>
              </button>
              <button
                disabled={!!duplicateConflict}
                onClick={() => {
                  if (duplicateConflict) return;
                  if (previewRecord) {
                    onAddRecord({ ...previewRecord, status: 'DALAM_PROSES', ket: previewRecord.ket === '-' ? 'DRAFT' : previewRecord.ket });
                  }
                  onClose();
                }}
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold transition cursor-pointer"
              >
                Simpan sebagai Draf
              </button>
              <button
                disabled={!!duplicateConflict}
                onClick={() => {
                  if (duplicateConflict) return;
                  handleFinish();
                }}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold transition cursor-pointer"
              >
                Kirim &amp; Selesai
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Toolbar Koreksi Otomatis */}
            <div className="bg-[#0a180e]/50 border-b border-emerald-500/20 px-6 py-2.5 flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAutoCorrect}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-semibold text-xs border border-emerald-400/40 cursor-pointer transition"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                <span>✨ Koreksi Otomatis Penulisan</span>
              </button>
              {correctionNotice && (
                <span className="text-[11px] text-emerald-300 font-mono animate-fadeIn">
                  {correctionNotice}
                </span>
              )}
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs bg-[#09150c]/55">
              {/* Form fields stay the same */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nomor Surat & Tanggal */}
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Nomor Surat: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={srt}
                    onChange={(e) => setSrt(e.target.value)}
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none ${
                      duplicateConflict
                        ? 'border-red-500 bg-red-950/30 focus:border-red-400'
                        : 'border-slate-700 focus:border-emerald-500'
                    }`}
                    required
                  />
                  {duplicateConflict && (
                    <p className="mt-1 text-[11px] text-red-400 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        No. Surat ganda! Sudah terdaftar a.n. {duplicateConflict.nama} (No. {duplicateConflict.no}). Tidak bisa Kirim Data, Unduh, atau Cetak.
                      </span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Tanggal Terbit (dd/mm/yyyy):
                  </label>
                  <input
                    type="text"
                    value={tgl}
                    onChange={(e) => setTgl(e.target.value)}
                    placeholder="Contoh: 30/10/2026"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                {/* Nama Pasien */}
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Nama Pasien: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Ny. Yanti Setiawati"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Umur:
                  </label>
                  <input
                    type="text"
                    value={umur}
                    onChange={(e) => setUmur(e.target.value)}
                    placeholder="Contoh: 50 Tahun"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Status:
                  </label>
                  <input
                    type="text"
                    value={patientStatus}
                    onChange={(e) => setPatientStatus(e.target.value)}
                    placeholder="Contoh: Istri dari Tn. Sukamdi"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Pangkat / NRP / Identitas: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={identitas}
                    onChange={(e) => setIdentitas(e.target.value)}
                    placeholder="Contoh: Brigjen TNI / 1910..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Jabatan:
                  </label>
                  <input
                    type="text"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="Contoh: Kapoksahli Pangdam..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">
                    Satuan:
                  </label>
                  <input
                    type="text"
                    value={kesatuan}
                    onChange={(e) => setKesatuan(e.target.value)}
                    placeholder="Contoh: Kodam XVII/Cenderawasih"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="sm:col-span-2 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-emerald-400 font-semibold mb-2">Data Pengantar:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" value={pengantar_nama} onChange={(e) => setPengantarNama(e.target.value)} placeholder="Nama Pengantar" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />
                    <input type="text" value={pengantar_umur} onChange={(e) => setPengantarUmur(e.target.value)} placeholder="Umur Pengantar" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />
                    <input type="text" value={pengantar_identitas} onChange={(e) => setPengantarIdentitas(e.target.value)} placeholder="Pangkat/NRP Pengantar" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />
                    <input type="text" value={pengantar_jabatan} onChange={(e) => setPengantarJabatan(e.target.value)} placeholder="Jabatan Pengantar" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />
                    <input type="text" value={pengantar_kesatuan} onChange={(e) => setPengantarKesatuan(e.target.value)} placeholder="Satuan Pengantar" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 sm:col-span-2" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">
                    Diagnosa Klinis &amp; Indikasi Medis: <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={diag}
                    onChange={(e) => setDiag(e.target.value)}
                    rows={2}
                    placeholder="Contoh: TIA"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                    required
                  />
                </div>
                
                {/* Simplified selects to fit in replacement */}
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Faskes Asal:</label>
                  <select value={asal} onChange={(e) => setAsal(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
                    {FASKES_AWAL.map((f) => <option key={f} value={f} className="bg-slate-950">{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Faskes Tujuan:</label>
                  <select value={tujuan} onChange={(e) => setTujuan(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
                    {FASKES_TUJUAN.map((f) => <option key={f} value={f} className="bg-slate-950">{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Alat Angkut / Moda:</label>
                  <select value={moda} onChange={(e) => setModa(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200">
                    <option value="Pesawat" className="bg-slate-950">Pesawat Udara</option>
                    <option value="Helikopter Medevac" className="bg-slate-950">Helikopter Medevac</option>
                    <option value="Kapal Laut" className="bg-slate-950">Kapal Laut</option>
                    <option value="Ambulans Darat" className="bg-slate-950">Ambulans Darat</option>
                    <option value="Kereta Api" className="bg-slate-950">Kereta Api</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Pendamping:</label>
                  <input type="text" value={pendamping} onChange={(e) => setPendamping(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">Keterangan:</label>
                  <input type="text" value={ket} onChange={(e) => setKet(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 cursor-pointer">Batal</button>
                <button
                  type="submit"
                  disabled={!!duplicateConflict}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-red-900/40 disabled:text-red-300 disabled:border disabled:border-red-500/40 disabled:cursor-not-allowed text-white font-semibold cursor-pointer"
                >
                  {duplicateConflict ? 'No. Surat Ganda (Terkunci)' : 'Simpan & Terbitkan Surat'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
