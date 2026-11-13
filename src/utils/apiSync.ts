import { EvacuationRecord } from '../types/evacuation';
import { auth } from '../firebase';

export interface ServerSyncResponse {
  records: EvacuationRecord[];
  count: number;
  lastUpdated: number;
  version: string;
}

export interface PollResponse {
  lastUpdated: number;
  count: number;
  hasUpdates: boolean;
  version: string;
}

/**
 * Robust fetch wrapper with timeout & retry to stabilize synchronization across unstable network conditions
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2, timeoutMs = 5000): Promise<Response> {
  let lastError: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const localToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const bearerToken = localToken || (auth.currentUser ? await auth.currentUser.getIdToken() : null);

      const res = await fetch(url, {
        ...options,
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
          ...(options.headers || {}),
        },
      });
      clearTimeout(timer);
      if (res.ok) return res;
      lastError = new Error(`HTTP Error ${res.status}`);
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
    }
  }
  throw lastError;
}

/**
 * Fetch all canonical records from backend server with retry mechanism
 */
export async function fetchServerRecords(): Promise<ServerSyncResponse | null> {
  try {
    const res = await fetchWithRetry(`/api/records?_t=${Date.now()}`, {}, 2, 4000);
    const text = await res.text();
    return JSON.parse(text) as ServerSyncResponse;
  } catch (err) {
    console.warn('[API SYNC] Menggunakan fallback lokal/cache karena gangguan koneksi:', err);
    return null;
  }
}

/**
 * Poll server for any changes made by other devices with retry mechanism
 */
export async function pollServerUpdates(lastKnownTimestamp: number): Promise<PollResponse | null> {
  try {
    const res = await fetchWithRetry(`/api/records/poll?lastUpdated=${encodeURIComponent(lastKnownTimestamp)}&_t=${Date.now()}`, {}, 1, 3000);
    const text = await res.text();
    return JSON.parse(text) as PollResponse;
  } catch {
    return null;
  }
}

/**
 * Send an updated or new record to the server with retry mechanism
 */
export async function saveRecordToServer(record: EvacuationRecord, isUpdate = false): Promise<boolean> {
  try {
    const res = await fetchWithRetry(
      '/api/records',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record, isUpdate }),
      },
      2,
      5000
    );
    return res.ok;
  } catch (err) {
    console.warn('[API SYNC] Gagal sinkronisasi record ke server (disimpan di antrean lokal):', err);
    return false;
  }
}

/**
 * Toggle Sembuh / Kembali ke Kesatuan directly on the server with retry mechanism
 */
export async function toggleSembuhOnServer(
  id: string | undefined,
  no: number,
  isSembuh: boolean,
  tanggalSembuh?: string
): Promise<boolean> {
  try {
    const res = await fetchWithRetry(
      '/api/records/toggle-sembuh',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, no, isSembuh, tanggalSembuh }),
      },
      2,
      5000
    );
    return res.ok;
  } catch (err) {
    console.warn('[API SYNC] Gagal update status sembuh di server:', err);
    return false;
  }
}

/**
 * Send batch records to server with retry mechanism
 */
export async function syncBatchToServer(records: EvacuationRecord[], source: string = 'batch'): Promise<boolean> {
  try {
    const res = await fetchWithRetry(
      '/api/records/batch',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records, source }),
      },
      2,
      6000
    );
    return res.ok;
  } catch (err) {
    console.warn('[API SYNC] Gagal kirim batch ke server:', err);
    return false;
  }
}

export interface SheetSyncResult {
  success: boolean;
  records: EvacuationRecord[];
  count: number;
  lastUpdated: number;
  syncConfig?: any;
  updated?: boolean;
  error?: string;
}

/**
 * Trigger real-time Google Sheet synchronization directly on the server (CORS-free & shared across all devices)
 */
export async function triggerServerSheetSync(sheetUrl?: string): Promise<SheetSyncResult | null> {
  try {
    const res = await fetchWithRetry(
      '/api/records/sync-sheet',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl }),
      },
      1,
      10000
    );
    const text = await res.text();
    return JSON.parse(text) as SheetSyncResult;
  } catch (err) {
    console.warn('[API SYNC] Gagal sinkronisasi sheet via server:', err);
    return null;
  }
}

/**
 * Fetch global admin wallpaper from server (for Guest accounts and defaults)
 */
export async function fetchAdminWallpaper(): Promise<any | null> {
  try {
    const res = await fetchWithRetry(`/api/wallpaper?_t=${Date.now()}`, {}, 2, 4000);
    const text = await res.text();
    const data = JSON.parse(text);
    return data?.wallpaper || null;
  } catch {
    return null;
  }
}

/**
 * Save global admin wallpaper to server (Superadmin only)
 */
export async function saveAdminWallpaper(wallpaper: any): Promise<boolean> {
  try {
    const res = await fetchWithRetry(
      '/api/wallpaper',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallpaper }),
      },
      2,
      5000
    );
    return res.ok;
  } catch (err) {
    console.warn('[API SYNC] Gagal simpan wallpaper admin ke server:', err);
    return false;
  }
}

/**
 * Fetch global admin sync config from server
 */
export async function fetchAdminSyncConfig(): Promise<any | null> {
  try {
    const res = await fetchWithRetry(`/api/sync-config?_t=${Date.now()}`, {}, 2, 4000);
    const text = await res.text();
    const data = JSON.parse(text);
    return data?.syncConfig || null;
  } catch {
    return null;
  }
}

/**
 * Save global admin sync config to server (Superadmin only)
 */
export async function saveAdminSyncConfig(syncConfig: any): Promise<boolean> {
  try {
    const res = await fetchWithRetry(
      '/api/sync-config',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncConfig }),
      },
      2,
      5000
    );
    return res.ok;
  } catch (err) {
    console.warn('[API SYNC] Gagal simpan syncConfig admin ke server:', err);
    return false;
  }
}

/**
 * Upload wallpaper image file to server (accessible across all devices & users)
 */
export async function uploadWallpaperToServer(file: File): Promise<string | null> {
  try {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const dataBase64 = await base64Promise;

    const res = await fetchWithRetry(
      '/api/wallpapers/upload',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, dataBase64 }),
      },
      2,
      10000
    );
    if (res.ok) {
      const data = await res.json();
      return data?.url || null;
    }
    return null;
  } catch (err) {
    console.warn('[API SYNC] Gagal upload wallpaper ke server:', err);
    return null;
  }
}

/**
 * Fetch all available server wallpapers
 */
export async function fetchServerWallpapers(): Promise<string[]> {
  try {
    const res = await fetchWithRetry(`/api/wallpapers?_t=${Date.now()}`, {}, 2, 4000);
    const text = await res.text();
    const data = JSON.parse(text);
    return data?.wallpapers || [];
  } catch {
    return [];
  }
}
