import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  FileSpreadsheet,
  Link2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  CalendarCheck2,
  AlertTriangle,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { SyncConfig } from '../types/evacuation';
import { LOCAL_ASSET_PATH, normalizeGoogleSheetCsvUrl } from '../utils/csvSync';
import { auth, signInGoogleSheets, getSheetsAccessToken, clearSheetsAccessToken } from '../firebase';
import {
  scanGoogleSheetDates,
  applyGoogleSheetDateRepairs,
  SheetDateRepairPlan,
} from '../utils/googleSheetsDateFixer';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: SyncConfig;
  onUpdateConfig: (config: Partial<SyncConfig>) => void;
  onManualSync: (customUrl?: string) => Promise<void>;
  onImportCsvText: (csvText: string, sourceName: string) => void;
  onResetToDefaultAsset: () => Promise<void>;
  preserveLocalEdits: boolean;
  onTogglePreserveLocalEdits: (preserve: boolean) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  onUpdateConfig,
  onManualSync,
  onImportCsvText,
  onResetToDefaultAsset,
  preserveLocalEdits,
  onTogglePreserveLocalEdits,
}) => {
  const [inputUrl, setInputUrl] = useState(
    syncConfig.sourceType === 'google_sheet' ? syncConfig.sheetUrl : ''
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Google Sheets direct write auth (in-memory only) & date repair confirmation plan
  const [sheetsToken, setSheetsToken] = useState<string | null>(() => getSheetsAccessToken());
  const [googleAccountEmail, setGoogleAccountEmail] = useState<string | null>(() => auth.currentUser?.email || null);
  const [isScanningSheet, setIsScanningSheet] = useState(false);
  const [isApplyingRepair, setIsApplyingRepair] = useState(false);
  const [repairPlan, setRepairPlan] = useState<SheetDateRepairPlan | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        clearSheetsAccessToken();
        setSheetsToken(null);
        setGoogleAccountEmail(null);
        setRepairPlan(null);
      } else {
        setGoogleAccountEmail(fbUser.email || null);
        setSheetsToken(getSheetsAccessToken());
      }
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const activeSheetUrl = inputUrl.trim() || syncConfig.sheetUrl || '';

  const handleScanSheetDates = async (tokenOverride?: string) => {
    const token = tokenOverride || sheetsToken || getSheetsAccessToken();
    if (!token) {
      setErrorMessage('Silakan masuk dengan Google terlebih dahulu untuk memeriksa Google Sheets.');
      return;
    }
    if (!activeSheetUrl.startsWith('http')) {
      setErrorMessage('Masukkan tautan Google Sheets yang valid terlebih dahulu.');
      return;
    }

    setIsScanningSheet(true);
    setErrorMessage(null);
    setSuccessNotice(null);
    try {
      const plan = await scanGoogleSheetDates(activeSheetUrl, token);
      setRepairPlan(plan);
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('berakhir') || msg.includes('belum dicentang') || msg.includes('belum diberikan')) {
        clearSheetsAccessToken();
        setSheetsToken(null);
      }
      setErrorMessage(msg || 'Gagal memeriksa format tanggal di Google Sheets.');
    } finally {
      setIsScanningSheet(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);
    try {
      const res = await signInGoogleSheets();
      setSheetsToken(res.accessToken);
      setGoogleAccountEmail(res.email);
      await handleScanSheetDates(res.accessToken);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal masuk dengan Google untuk akses Google Sheets.');
    }
  };

  const handleConfirmApplyRepair = async () => {
    if (!repairPlan) return;
    const token = sheetsToken || getSheetsAccessToken();
    if (!token) {
      setErrorMessage('Sesi Google tidak aktif. Silakan Sign in with Google kembali.');
      return;
    }

    setIsApplyingRepair(true);
    setErrorMessage(null);
    setSuccessNotice(null);
    try {
      const targetTab = repairPlan.sheetTitle;
      const { updatedCells, columnFormatted, localeUpdated } = await applyGoogleSheetDateRepairs(repairPlan, token);
      setRepairPlan(null);
      try {
        await onManualSync(activeSheetUrl);
      } catch {
        // Ignore background CSV refresh failure if direct Sheets write already succeeded
      }
      const extras = [
        columnFormatted ? 'format kolom dd/mm/yyyy' : null,
        localeUpdated ? 'wilayah Indonesia' : null,
      ]
        .filter(Boolean)
        .join(' & ');
      setSuccessNotice(
        `Berhasil! ${updatedCells} sel (Nomor Surat & Tanggal) di Google Sheets tab "${targetTab}" telah diperbarui permanen${extras ? ` (${extras})` : ''}.`
      );
    } catch (err: any) {
      const msg = String(err?.message || 'Gagal memperbarui format di Google Sheets.');
      if (msg.includes('berakhir') || msg.includes('belum dicentang') || msg.includes('belum diberikan')) {
        clearSheetsAccessToken();
        setSheetsToken(null);
      }
      setErrorMessage(msg);
    } finally {
      setIsApplyingRepair(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    setSuccessNotice(null);
    try {
      await onManualSync();
      setSuccessNotice('Sinkronisasi spreadsheet berhasil diperbarui!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal melakukan sinkronisasi spreadsheet.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectGoogleSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setErrorMessage('Silakan masukkan tautan Google Sheets terlebih dahulu.');
      return;
    }

    setIsSyncing(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const normalized = normalizeGoogleSheetCsvUrl(inputUrl.trim());
      await onManualSync(normalized);
      onUpdateConfig({
        sourceType: 'google_sheet',
        sheetUrl: inputUrl.trim(),
      });
      setSuccessNotice('Berhasil terhubung ke Google Sheets dan data telah tersinkronisasi!');
    } catch (err: any) {
      setErrorMessage(
        `Koneksi gagal: ${err.message}. Pastikan spreadsheet telah diatur ke "Siapa saja yang memiliki link dapat melihat" atau dipublikasikan ke web sebagai CSV.`
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          onImportCsvText(content, file.name);
          setSuccessNotice(`File "${file.name}" berhasil diimpor dan disinkronkan!`);
          setErrorMessage(null);
        } catch (err: any) {
          setErrorMessage(err.message || 'Format file CSV tidak valid.');
        }
      }
    };
    reader.onerror = () => {
      setErrorMessage('Gagal membaca file dari perangkat Anda.');
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleResetDefault = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    setSuccessNotice(null);
    try {
      await onResetToDefaultAsset();
      setInputUrl('');
      setSuccessNotice('Spreadsheet telah dikembalikan ke dataset resmi Kodam XVII (SURAT EVAK 2026)!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat spreadsheet bawaan.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="box-3d-dimmed border border-emerald-500/35 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col text-white shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0e2215]/65 to-[#07130a]/75 border-b border-emerald-500/25 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30 shadow-inner">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Sinkronisasi Spreadsheet Real-Time
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                  Live
                </span>
              </h2>
              <p className="text-xs text-emerald-300/80">
                Pembaruan otomatis dari berkas SURAT EVAK 2026 / Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm bg-[#09150c]/55">
          
          {/* STATUS BOX */}
          <div className="box-3d-recessed rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    syncConfig.autoSyncEnabled ? 'bg-emerald-400' : 'bg-slate-500'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    syncConfig.autoSyncEnabled ? 'bg-emerald-500' : 'bg-slate-500'
                  }`} />
                </span>
                <span className="font-semibold text-white">
                  {syncConfig.autoSyncEnabled ? 'Sinkronisasi Real-Time Aktif' : 'Sinkronisasi Manual'}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Terakhir: <span className="text-slate-200 font-bold">{syncConfig.lastSyncTime || 'Belum pernah'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Sumber Data Aktif:</span>
                <span className="font-bold text-emerald-300 truncate block" title={syncConfig.sheetUrl || LOCAL_ASSET_PATH}>
                  {syncConfig.sourceType === 'google_sheet'
                    ? 'Google Sheets (Tautan Langsung)'
                    : 'Spreadsheet Resmi: SURAT EVAK 2026'}
                </span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block mb-0.5">Total Data Tersinkron:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {syncConfig.recordsCount} Pasien
                </span>
              </div>
            </div>

            {/* REAL-TIME AUTO SYNC NOTICE */}
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-bold font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Sinkronisasi Real-Time Berjalan Otomatis</span>
              </div>
              <span className="text-[11px] text-emerald-400/80 font-mono">
                Setiap perubahan spreadsheet otomatis diperbarui
              </span>
            </div>
          </div>

          {/* NOTICES */}
          {successNotice && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PERBAIKI FORMAT NOMOR SURAT & TANGGAL LANGSUNG DI GOOGLE SHEETS */}
          <div className="bg-slate-950/65 border border-yellow-500/40 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <CalendarCheck2 className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-yellow-300 block text-xs">
                    Perbaiki Format Nomor Surat &amp; Tanggal Langsung di Google Sheets
                  </span>
                  <span className="text-[11px] text-slate-300 block mt-0.5">
                    Menyeragamkan <code className="text-emerald-300">B/&lt;NN&gt;/EV/&lt;ROMAWI&gt;/&lt;YYYY&gt;</code> &amp; tanggal <code className="text-emerald-300">DD/MM/YYYY</code> langsung di file Google Sheets Anda.
                  </span>
                </div>
              </div>
            </div>

            {errorMessage && !repairPlan && (
              <div className="p-2.5 bg-red-950/60 border border-red-500/50 rounded-lg text-red-200 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!sheetsToken ? (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-slate-400">
                  Masuk dengan akun Google pemilik/editor spreadsheet untuk menerapkan perbaikan ke Google Sheets:
                </span>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="inline-flex items-center gap-2.5 bg-white hover:bg-slate-100 text-[#1f1f1f] border border-[#747775] rounded-full px-4 py-1.5 text-xs font-medium shadow-sm transition cursor-pointer"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-emerald-300">
                      Terhubung: <strong>{googleAccountEmail || 'Akun Google'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isScanningSheet || isApplyingRepair}
                      className="text-[10px] underline text-slate-300 hover:text-white cursor-pointer disabled:opacity-50"
                    >
                      Ganti Akun
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleScanSheetDates()}
                    disabled={isScanningSheet || isApplyingRepair}
                    className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanningSheet ? 'animate-spin' : ''}`} />
                    <span>{isScanningSheet ? 'Memeriksa...' : 'Periksa Surat & Tanggal di Google Sheets'}</span>
                  </button>
                </div>

                {/* KONFIRMASI EKSPLISIT SEBELUM MENGUBAH DATA GOOGLE SHEETS */}
                {repairPlan && (
                  <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3 space-y-2.5 text-xs">
                    <div className="flex items-start gap-2 text-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">
                          Konfirmasi Perubahan pada &quot;{repairPlan.spreadsheetTitle}&quot; (Tab: {repairPlan.sheetTitle})
                        </div>
                        <div className="text-[11px] text-amber-100/90 mt-0.5">
                          {repairPlan.itemsToFix.length > 0
                            ? `Ditemukan ${repairPlan.itemsToFix.length} sel pada kolom ${repairPlan.srtColLetter} (No Surat) & ${repairPlan.dateColLetter} (Tanggal) dari ${repairPlan.totalScannedRows} baris pasien yang akan diseragamkan, serta menerapkan format kolom tanggal "dd/mm/yyyy"${repairPlan.needsLocaleUpdate ? ' & setelan wilayah Indonesia (DD/MM/YYYY)' : ''}.`
                            : `Semua ${repairPlan.totalScannedRows} baris pasien sudah sesuai standar Nomor Surat & DD/MM/YYYY. Anda dapat menerapkan format kolom "dd/mm/yyyy"${repairPlan.needsLocaleUpdate ? ' & setelan wilayah Indonesia' : ''} agar baris baru tidak terbalik.`}
                        </div>
                      </div>
                    </div>

                    {repairPlan.itemsToFix.length > 0 && (
                      <div className="max-h-40 overflow-y-auto bg-black/40 border border-slate-800 rounded-lg p-2 space-y-1 font-mono text-[11px]">
                        {repairPlan.itemsToFix.map((item) => (
                          <div key={item.a1Cell} className="flex items-center justify-between gap-2 text-slate-200">
                            <span className="truncate">
                              <span className="text-yellow-300 font-bold">{item.a1Cell}</span>{' '}
                              <span className="text-[10px] text-slate-400">[{item.kind === 'SURAT' ? 'Surat' : 'Tgl'}]</span>{' '}
                              (No. {item.no} • {item.nama})
                            </span>
                            <span className="shrink-0">
                              <span className="text-red-300 line-through">{item.before}</span> →{' '}
                              <span className="text-emerald-300 font-bold">{item.after}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {errorMessage && (
                      <div className="p-2.5 bg-red-950/60 border border-red-500/50 rounded-lg text-red-200 text-[11px] flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setRepairPlan(null)}
                        disabled={isApplyingRepair}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmApplyRepair}
                        disabled={isApplyingRepair}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {isApplyingRepair
                            ? 'Memperbarui Google Sheets...'
                            : repairPlan.itemsToFix.length > 0
                            ? `Konfirmasi & Perbaiki (${repairPlan.itemsToFix.length} Sel)`
                            : 'Konfirmasi Format Kolom dd/mm/yyyy'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 1. AUTO-SYNC TIMER CONFIG */}
          <div className="space-y-3">
            <h3 className="font-bold text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Pengaturan Interval Sinkronisasi Otomatis
            </h3>

            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-white block text-xs">
                    Aktifkan Penarikan Otomatis Latar Belakang
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Aplikasi akan memeriksa pembaruan spreadsheet secara berkala tanpa reload
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={syncConfig.autoSyncEnabled}
                    onChange={(e) => onUpdateConfig({ autoSyncEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {syncConfig.autoSyncEnabled && (
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">Interval Sinkron:</span>
                  <div className="flex gap-1.5">
                    {[15, 30, 60, 300].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => onUpdateConfig({ intervalSeconds: sec })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                          syncConfig.intervalSeconds === sec
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {sec < 60 ? `${sec} dtk` : `${sec / 60} mnt`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. LOCAL EDITS PRESERVATION */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-white block text-xs">
                  Pertahankan Perubahan Manual di Aplikasi
                </span>
                <span className="text-[11px] text-slate-400">
                  Data pasien yang telah Anda edit secara manual di web tidak akan tertimpa saat sinkronisasi baru
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={preserveLocalEdits}
                onChange={(e) => onTogglePreserveLocalEdits(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* 3. GOOGLE SHEETS LIVE INTEGRATION */}
          <div className="space-y-3">
            <h3 className="font-bold text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              Hubungkan ke Google Sheets Online
            </h3>

            <form onSubmit={handleConnectGoogleSheet} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
                >
                  Hubungkan
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Mendukung URL berbagi Google Sheets biasa atau URL &quot;Publikasikan ke Web&quot; (CSV).
              </p>
            </form>
          </div>

          {/* 4. MANUAL CSV UPLOAD */}
          <div className="space-y-2">
            <h3 className="font-bold text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Unggah Berkas Spreadsheet Baru (.CSV)
            </h3>
            <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition bg-slate-900/30 hover:bg-emerald-950/20">
              <Upload className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">
                Pilih atau seret berkas CSV spreadsheet dari komputer
              </span>
              <span className="text-[10px] text-slate-400">
                Sistem akan memproses 81+ kolom data dan langsung menampilkan di tabel
              </span>
              <input
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
