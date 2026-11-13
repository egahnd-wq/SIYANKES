import React from 'react';
import { X, Printer, Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { EvacuationRecord } from '../types/evacuation';
import { isRecordSembuh } from '../data/evacuationData';
import { KodamCenderawasihLogo, HestiWiraSaktiLogo } from './MilitaryLogos';
import { findConflictingRecord } from '../utils/duplicateCheck';

interface DetailModalProps {
  record: EvacuationRecord | null;
  allRecords?: EvacuationRecord[];
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ record, allRecords = [], onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!record) return null;

  const duplicateConflict = findConflictingRecord(record.srt, allRecords, record.no);

  const handleCopy = () => {
    if (duplicateConflict) return;
    const text = `SURAT EVAKUASI KESDAM XVII/CENDERAWASIH
No. Surat: ${record.srt}
Tanggal: ${record.tgl}
Nama: ${record.nama}
Identitas/NRP: ${record.identitas}
Kesatuan: ${record.kesatuan}
Diagnosa: ${record.diag}
Asal: ${record.asal}
Tujuan: ${record.tujuan}
Moda: ${record.moda}
Pendamping: ${record.pendamping}
Keterangan: ${record.ket}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintSingle = () => {
    if (duplicateConflict) return;
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl box-3d-dimmed border border-emerald-500/35 rounded-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Top Actions Bar */}
        <div className="bg-gradient-to-r from-[#0e2215]/65 to-[#07130a]/75 border-b border-emerald-500/25 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
              {record.srt}
            </span>
            <span className="text-xs text-slate-300">Pratinjau Berkas Dokumen Resmi</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!!duplicateConflict}
              className="px-2.5 py-1.5 rounded-lg box-3d-card hover:bg-emerald-950/60 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
            </button>

            <button
              onClick={handlePrintSingle}
              disabled={!!duplicateConflict}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-red-900/50 disabled:text-red-300 disabled:cursor-not-allowed text-white text-xs font-medium flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{duplicateConflict ? 'Cetak Terkunci (No. Surat Ganda)' : 'Cetak Surat'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg box-3d-card hover:bg-red-950/60 text-slate-300 hover:text-white transition ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {duplicateConflict && (
          <div className="bg-red-950/90 border-b border-red-500/50 px-5 py-2.5 text-xs text-red-200 flex items-center gap-2 shrink-0 no-print">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              <strong>PERINGATAN NOMOR SURAT GANDA:</strong> Nomor Surat <strong>{record.srt}</strong> juga digunakan oleh pasien <strong>{duplicateConflict.nama}</strong> (No. Urut {duplicateConflict.no}). Tidak dapat Kirim Data, Unduh, atau Cetak sebelum Nomor Surat diperbaiki!
            </span>
          </div>
        )}

        {/* Printable/Readable Document Sheet (White Military Letterhead Paper) */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-white text-slate-900 shadow-2xl flex-1 scrollbar-thin" id="print-letter-template">
          {/* KOP RESMI SURAT KESDAM DENGAN DUA LOGO ASLI */}
          <div className="border-b-2 border-slate-700/60 pb-4 text-center relative flex items-center justify-between">
            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
              <KodamCenderawasihLogo is3DGlass={false} className="h-14 w-14 object-contain" />
            </div>

            <div className="flex-1 px-4">
              <h2 className="text-xs sm:text-sm font-extrabold text-black print:text-black font-mono tracking-wider uppercase">
                KOMANDO DAERAH MILITER XVII / CENDERAWASIH
              </h2>
              <h3 className="text-[11px] sm:text-xs font-bold text-black print:text-black tracking-[0.25em] font-mono uppercase">
                KESEHATAN
              </h3>
            </div>

            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
              <HestiWiraSaktiLogo is3DGlass={false} className="h-14 w-14 object-contain" />
            </div>
          </div>

          {/* JUDUL SURAT & NOMOR */}
          <div className="text-right pt-4 text-xs font-serif text-slate-800">
            <p>Jayapura, {record.tgl || 'Oktober 2026'}</p>
          </div>
          
          <div className="space-y-1 text-xs text-slate-900 pt-2 font-serif">
            <p>Nomor : {record.srt}</p>
            <p>Klasifikasi : Biasa</p>
            <p>Lampiran : -</p>
            <p>Perihal : Permohonan Penerbitan Surat Perintah <br /> Pemberangkatan Evakuasi atas nama <br /> <strong>{record.nama}</strong></p>
          </div>

          <div className="space-y-1 text-xs pt-4 font-serif text-slate-900">
            <p>Kepada</p>
            <p className="font-bold">Yth. Panglima Komando Daerah <br /> Militer XVII/Cenderawasih <br /> di <br /> Jayapura</p>
          </div>

          <div className="space-y-1 text-xs pt-2 font-serif text-slate-900">
            <p className="font-bold">u.p. Aspers Kasdam</p>
          </div>

          {/* ISI SURAT / DATA PASIEN */}
          <div className="space-y-4 text-xs pt-4 font-serif text-slate-900">
            <div className="space-y-2">
              <p><strong>1. Dasar:</strong></p>
              <p className="pl-4">a. Surat Karumkit TK.II {record.asal} Nomor: ... Tanggal {record.tgl} tentang evakuasi penderita atas nama {record.nama} dan ;</p>
              <p className="pl-4">b. Pertimbangan Pimpinan dan Staf Kesdam XVII/Cenderawasih.</p>
            </div>

            <div className="space-y-2">
              <p><strong>2. Sehubungan dasar di atas dengan ini diajukan permohonan penerbitan surat perintah pemberangkatan evakuasi ke {record.tujuan} Kepada:</strong></p>
              <div className="pl-4 grid grid-cols-[150px_1fr] gap-1 bg-slate-50 p-3 rounded border border-slate-200">
                <p className="font-medium text-slate-700">Nama</p><p className="font-bold text-slate-900">: {record.nama}</p>
                <p className="font-medium text-slate-700">Umur</p><p>: {record.umur || '-'}</p>
                <p className="font-medium text-slate-700">Status</p><p>: {record.patientStatus || record.kategori || '-'}</p>
                <p className="font-medium text-slate-700">Pangkat/NRP</p><p className="font-mono font-bold text-slate-900">: {record.identitas}</p>
                <p className="font-medium text-slate-700">Jabatan</p><p>: {record.jabatan || '-'}</p>
                <p className="font-medium text-slate-700">Satuan</p><p>: {record.kesatuan}</p>
                <p className="font-medium text-slate-700">Diagnosa</p><p className="font-bold text-rose-700">: {record.diag}</p>
                <p className="font-medium text-slate-700">Faskes Asal</p><p className="font-semibold text-emerald-800">: {record.asal || 'RS Tk.II 07.05.01 Marthen Indey'}</p>
                <p className="font-medium text-slate-700">Faskes Tujuan</p><p className="font-bold text-blue-800">: {record.tujuan || 'RSPAD Gatot Soebroto Jakarta'}</p>
                <p className="font-medium text-slate-700">Alat Angkut</p><p className="font-bold text-slate-900">: {record.moda || 'Pesawat'}</p>
              </div>

              {/* Status Sembuh / Kembali ke Satuan */}
              {isRecordSembuh(record) && (
                <div className="mt-2 p-2.5 rounded border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-sans flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-xs tracking-wide uppercase block">
                        STATUS: TELAH SEMBUH / KEMBALI KE KESATUAN
                      </span>
                      <span className="text-[10px] text-emerald-800">
                        {record.catatanSembuh || `Perawatan medis tuntas, pasien kembali berdinas di ${record.kesatuan}`}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    {record.tanggalSembuh ? `Tgl: ${record.tanggalSembuh}` : 'Tuntas'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <p><strong>Pengantar / Pendamping:</strong></p>
              <div className="pl-4 grid grid-cols-[150px_1fr] gap-1 bg-slate-50 p-3 rounded border border-slate-200">
                <p className="font-medium text-slate-700">Nama Pendamping</p><p className="font-bold text-slate-900">: {record.pendamping || record.pengantar_nama || '-'}</p>
                <p className="font-medium text-slate-700">Umur</p><p>: {record.pengantar_umur || '-'}</p>
                <p className="font-medium text-slate-700">Pangkat/NRP</p><p>: {record.pengantar_identitas || '-'}</p>
                <p className="font-medium text-slate-700">Jabatan</p><p>: {record.pengantar_jabatan || '-'}</p>
                <p className="font-medium text-slate-700">Satuan</p><p>: {record.pengantar_kesatuan || '-'}</p>
              </div>
            </div>

            <p><strong>3. Demikian mohon dimaklumi.</strong></p>
          </div>

          {/* TANDA TANGAN & PENGESAHAN MILITER */}
          <div className="pt-8 flex justify-end text-xs font-serif">
            <div className="text-center w-64">
              <p className="font-bold text-black uppercase text-xs">
                Kepala Kesdam XVII/Cenderawasih
              </p>
              <div className="h-16 flex items-center justify-center text-slate-400 italic text-xs">
                [ Tanda Tangan & Cap Dinas ]
              </div>
              <p className="font-bold text-black underline tracking-wide">
                Dr. dr. Rudy Dwi Laksono, Sp.PD
              </p>
              <p className="font-mono text-[10px] text-black">Kolonel Ckm NRP 11970010250270</p>
            </div>
          </div>
          
          <div className="pt-6 text-xs text-slate-600 font-serif border-t border-slate-200 mt-6">
            <p className="font-bold">Tembusan:</p>
            <p>1. Ir Kodam XVII/Cenderawasih</p>
            <p>2. Kapoksahli Pangdam XVII/Cenderawasih</p>
          </div>
        </div>

      </div>
    </div>
  );
};
