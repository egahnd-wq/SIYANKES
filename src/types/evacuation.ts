export type PatientCategory = 'MILITER' | 'PERSIT' | 'ANAK' | 'PNS';

export type EvacuationStatus = 'SELESAI' | 'DALAM_PROSES' | 'BATAL' | 'RALAT' | 'MENINGGAL';

export interface EvacuationRecord {
  id?: string;
  no: number;
  srt: string;
  tgl: string;
  nama: string;
  umur?: string;
  patientStatus?: string; // Status Pasien
  identitas: string;
  jabatan?: string;
  kesatuan: string;
  diag: string;
  asal: string;
  tujuan: string;
  moda: string;
  
  // Pengantar details
  pengantar_nama?: string;
  pengantar_umur?: string;
  pengantar_identitas?: string;
  pengantar_jabatan?: string;
  pengantar_kesatuan?: string;
  
  pendamping: string; // Keep for now
  ket: string;
  kategori?: PatientCategory;
  status?: EvacuationStatus;
  jk?: string;
  lastEditedAt?: string;

  // Status Pemulihan & Kembali ke Kesatuan
  isSembuh?: boolean;
  tanggalSembuh?: string;
  catatanSembuh?: string;
  createdBy?: string; // UID of the user who created this record
}

export interface EvacuationStats {
  total: number;
  militer: number;
  persit: number;
  anak: number;
  pns: number;
  rspad: number;
  batalRalat: number;
}

export type SortField = 'no' | 'srt' | 'tgl' | 'nama' | 'kesatuan' | 'diag' | 'tujuan';
export type SortDirection = 'asc' | 'desc';

export type SyncSourceType = 'local_asset' | 'google_sheet' | 'custom_url';

export interface SyncConfig {
  sourceType: SyncSourceType;
  sheetUrl: string;
  autoSyncEnabled: boolean;
  intervalSeconds: number; // e.g. 15, 30, 60
  lastSyncTime: string | null;
  lastSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
  recordsCount: number;
}
