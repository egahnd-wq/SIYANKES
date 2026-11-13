import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initialEvacuationData, isRecordSembuh, determineCategory, determineStatus } from './src/data/evacuationData.ts';
import type { EvacuationRecord } from './src/types/evacuation.ts';
import { parseEvacuationCsv, normalizeGoogleSheetCsvUrl, normalizeDate } from './src/utils/csvSync.ts';
import { correctNomorSurat } from './src/utils/textCorrector.ts';
import { DEFAULT_USERS, decodeSessionToken } from './src/data/defaultUsers.ts';
import { findConflictingRecord } from './src/utils/duplicateCheck.ts';

let db: any = null;
try {
  let firebaseProjectId: string | undefined;
  let firestoreDbId = 'ai-studio-siyankes-cd9dff77-3713-46c1-bed5-f79ec708c43f';
  const fbConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(fbConfigPath)) {
    const fbCfg = JSON.parse(fs.readFileSync(fbConfigPath, 'utf-8'));
    if (fbCfg?.projectId) firebaseProjectId = fbCfg.projectId;
    if (fbCfg?.firestoreDatabaseId) firestoreDbId = fbCfg.firestoreDatabaseId;
  }
  const adminApp = getApps().length
    ? getApp()
    : initializeApp(firebaseProjectId ? { projectId: firebaseProjectId } : undefined);
  db = getFirestore(adminApp, firestoreDbId);
} catch (err) {
  console.warn('[SERVER] Firebase Admin tidak aktif saat startup, menggunakan penyimpanan lokal disk:', (err as any)?.message || err);
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const RECORDS_FILE = path.resolve(DATA_DIR, 'records.json');
const META_FILE = path.resolve(DATA_DIR, 'meta.json');
const WALLPAPER_FILE = path.resolve(DATA_DIR, 'wallpaper.json');
const SYNC_CONFIG_FILE = path.resolve(DATA_DIR, 'sync-config.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_WALLPAPER_CONFIG = {
  preset: 'custom-url',
  customUrl: '/assets/wallpaper/natural_f30129.jpg',
  camoOpacity: 80,
  dimmerOpacity: 75,
  blurAmount: 10,
  glassTransparency: 25,
};

let adminWallpaperConfig: any = DEFAULT_WALLPAPER_CONFIG;

function loadWallpaperFromDisk() {
  try {
    if (fs.existsSync(WALLPAPER_FILE)) {
      const data = fs.readFileSync(WALLPAPER_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_WALLPAPER_CONFIG, ...parsed };
      }
    }
  } catch (e) {
    console.error('[SERVER] Gagal membaca wallpaper.json:', e);
  }
  return DEFAULT_WALLPAPER_CONFIG;
}

function saveWallpaperToDisk(config: any): boolean {
  try {
    adminWallpaperConfig = config;
    fs.writeFileSync(WALLPAPER_FILE, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('[SERVER] Gagal menulis wallpaper.json:', e);
    return false;
  }
}

adminWallpaperConfig = loadWallpaperFromDisk();

const DEFAULT_SYNC_CONFIG = {
  sourceType: 'google_sheet',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1IT7kt76lGkvXMUlI18W3uF6xcQtfdv5Dxvn3cvyqA7o/edit?usp=sharing',
  autoSyncEnabled: true,
  intervalSeconds: 30,
  lastSyncTime: null,
  lastSyncStatus: 'success',
  recordsCount: 106,
};

let adminSyncConfig: any = DEFAULT_SYNC_CONFIG;

function loadSyncConfigFromDisk() {
  try {
    if (fs.existsSync(SYNC_CONFIG_FILE)) {
      const data = fs.readFileSync(SYNC_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_SYNC_CONFIG, ...parsed };
      }
    }
  } catch (e) {
    console.error('[SERVER] Gagal membaca sync-config.json:', e);
  }
  return DEFAULT_SYNC_CONFIG;
}

function saveSyncConfigToDisk(config: any): boolean {
  try {
    adminSyncConfig = config;
    fs.writeFileSync(SYNC_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('[SERVER] Gagal menulis sync-config.json:', e);
    return false;
  }
}

adminSyncConfig = loadSyncConfigFromDisk();

let sharedRecords: EvacuationRecord[] = [];
let lastUpdated = Date.now();
let serverVersion = '2.8.2';

function normalizeServerRecord(r: EvacuationRecord, idx: number): EvacuationRecord {
  const normalizedTgl = normalizeDate(r.tgl || '') || r.tgl;
  const normalizedSrt = correctNomorSurat(r.srt || '', normalizedTgl) || r.srt;
  const normalizedTglSembuh = r.tanggalSembuh ? normalizeDate(r.tanggalSembuh) : undefined;
  return {
    ...r,
    id: r.id || `rec-${r.no || idx + 1}-${normalizedSrt || idx}`,
    srt: normalizedSrt,
    tgl: normalizedTgl,
    tanggalSembuh: normalizedTglSembuh,
    kategori: determineCategory(r.nama, `${r.identitas} ${r.jabatan || ''}`, r.patientStatus),
    status: determineStatus(r.ket, normalizedSrt),
    isSembuh: r.isSembuh !== undefined ? r.isSembuh : isRecordSembuh(r),
  };
}

function saveRecordsToDisk(records: EvacuationRecord[]): boolean {
  try {
    const normalized = records.map((r, i) => normalizeServerRecord(r, i));
    sharedRecords = normalized;
    lastUpdated = Date.now();
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(normalized, null, 2), 'utf-8');
    fs.writeFileSync(
      META_FILE,
      JSON.stringify(
        {
          lastUpdated,
          version: serverVersion,
          totalRecords: normalized.length,
          savedAt: new Date().toISOString(),
        },
        null,
        2
      ),
      'utf-8'
    );
    return true;
  } catch (e) {
    console.error('[SERVER] Gagal menyimpan records ke disk:', e);
    return false;
  }
}

function loadRecordsFromDisk(): EvacuationRecord[] {
  try {
    if (fs.existsSync(RECORDS_FILE) && fs.existsSync(META_FILE)) {
      const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
      const data = fs.readFileSync(RECORDS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (
        Array.isArray(parsed) &&
        parsed.length >= initialEvacuationData.length &&
        parsed[0]?.nama === initialEvacuationData[0]?.nama
      ) {
        const normalized = parsed.map((r: EvacuationRecord, i: number) => normalizeServerRecord(r, i));
        const hasNormalizedChanges = normalized.some(
          (r, i) =>
            r.srt !== parsed[i]?.srt ||
            r.tgl !== parsed[i]?.tgl ||
            r.tanggalSembuh !== parsed[i]?.tanggalSembuh ||
            r.status !== parsed[i]?.status ||
            r.kategori !== parsed[i]?.kategori
        );
        if (meta.version !== serverVersion || hasNormalizedChanges) {
          saveRecordsToDisk(normalized);
          return normalized;
        }
        if (meta.lastUpdated) lastUpdated = Number(meta.lastUpdated);
        return normalized;
      }
    }
  } catch (e) {
    console.error('[SERVER] Gagal membaca records.json:', e);
  }

  // Fallback to complete master dataset
  const canonical = initialEvacuationData.map((r, i) => normalizeServerRecord(r, i));
  saveRecordsToDisk(canonical);
  return canonical;
}

sharedRecords = loadRecordsFromDisk();

// Real-Time Auto-Sync: Pantau perubahan berkas spreadsheet lokal secara otomatis
const SPREADSHEET_FILE = path.resolve(process.cwd(), 'public/assets/aistudio/CEN_c332d297');
let lastSpreadsheetMtime = 0;
try {
  if (fs.existsSync(SPREADSHEET_FILE)) {
    lastSpreadsheetMtime = fs.statSync(SPREADSHEET_FILE).mtimeMs;
  }
} catch {}

function checkAndSyncSpreadsheetFile() {
  try {
    if (!fs.existsSync(SPREADSHEET_FILE)) return;
    const currentMtime = fs.statSync(SPREADSHEET_FILE).mtimeMs;
    if (currentMtime > lastSpreadsheetMtime) {
      lastSpreadsheetMtime = currentMtime;
      console.log('[SERVER] Terdeteksi perubahan berkas spreadsheet! Sinkronisasi otomatis...');
      const csvText = fs.readFileSync(SPREADSHEET_FILE, 'utf-8');
      const parsed = parseEvacuationCsv(csvText);
      if (parsed.length > 0) {
        const hasDifferences =
          parsed.length !== sharedRecords.length ||
          parsed.some(
            (r, i) =>
              r.no !== sharedRecords[i]?.no ||
              r.srt !== sharedRecords[i]?.srt ||
              r.nama !== sharedRecords[i]?.nama ||
              r.kategori !== sharedRecords[i]?.kategori ||
              r.isSembuh !== sharedRecords[i]?.isSembuh ||
              r.status !== sharedRecords[i]?.status ||
              r.ket !== sharedRecords[i]?.ket ||
              r.tgl !== sharedRecords[i]?.tgl
          );
        if (hasDifferences) {
          saveRecordsToDisk(parsed);
          console.log(`[SERVER] Sinkronisasi real-time otomatis selesai: ${parsed.length} berkas termutakhir.`);
        }
      }
    }
  } catch (err) {
    console.error('[SERVER] Gagal memeriksa perubahan spreadsheet:', err);
  }
}

// Pantau perubahan berkas spreadsheet lokal secara otomatis setiap 2 detik
setInterval(checkAndSyncSpreadsheetFile, 2000);

// Real-Time Google Sheets Auto-Sync on Server (CORS-free, shared across all devices)
let isSyncingGoogleSheet = false;

function formatWibTime(date: Date = new Date()): string {
  try {
    const formatted = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
    return `${formatted} WIB`;
  } catch {
    return `${date.toLocaleTimeString('id-ID')} WIB`;
  }
}

function buildGoogleSheetCandidateUrls(rawUrl: string): string[] {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return [];
  const urls: string[] = [];
  const cacheBust = `_t=${Date.now()}`;

  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    // /export?format=csv is freshest for live sheet edits; /gviz/tq is reliable fallback
    urls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}&${cacheBust}`);
    const gviz = normalizeGoogleSheetCsvUrl(trimmed);
    const sep = gviz.includes('?') ? '&' : '?';
    urls.push(`${gviz}${sep}${cacheBust}`);
  } else {
    const sep = trimmed.includes('?') ? '&' : '?';
    urls.push(`${trimmed}${sep}${cacheBust}`);
  }
  return urls;
}

async function fetchLiveCsvText(rawUrl: string): Promise<string> {
  const candidates = buildGoogleSheetCandidateUrls(rawUrl);
  let lastErr: any = null;

  for (const candidate of candidates) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const resp = await fetch(candidate, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Accept: 'text/csv, text/plain, */*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (resp.ok) {
        const text = await resp.text();
        if (text && !text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
          return text;
        }
        lastErr = new Error('Google Sheet memerlukan akses publik');
      } else {
        lastErr = new Error(`HTTP ${resp.status}`);
      }
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
    }
  }
  throw lastErr || new Error('Gagal mengambil CSV dari Google Sheets');
}

async function syncFromGoogleSheet(
  overrideUrl?: string,
  silent: boolean = true
): Promise<{ success: boolean; updated: boolean; count: number; error?: string }> {
  const targetUrl = (overrideUrl || adminSyncConfig?.sheetUrl || '').trim();
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return { success: false, updated: false, count: sharedRecords.length, error: 'URL Google Sheet tidak valid' };
  }
  if (isSyncingGoogleSheet) {
    return { success: true, updated: false, count: sharedRecords.length };
  }

  isSyncingGoogleSheet = true;
  try {
    const csvText = await fetchLiveCsvText(targetUrl);
    const parsed = parseEvacuationCsv(csvText);
    if (!parsed || parsed.length === 0) {
      throw new Error('Data CSV dari Google Sheet kosong atau tidak terbaca');
    }

    const existingByNo = new Map<number, EvacuationRecord>();
    sharedRecords.forEach((r) => {
      if (r.no) existingByNo.set(r.no, r);
    });

    const sheetNos = new Set<number>();
    const merged: EvacuationRecord[] = parsed.map((sheetRec, idx) => {
      if (sheetRec.no) sheetNos.add(sheetRec.no);
      const existing = sheetRec.no ? existingByNo.get(sheetRec.no) : undefined;
      if (existing && existing.lastEditedAt && existing.nama === sheetRec.nama) {
        return normalizeServerRecord(
          {
            ...sheetRec,
            id: existing.id || sheetRec.id,
            isSembuh:
              existing.isSembuh !== undefined
                ? existing.isSembuh
                : isRecordSembuh(sheetRec),
            tanggalSembuh: existing.tanggalSembuh || sheetRec.tanggalSembuh,
            catatanSembuh: existing.catatanSembuh || sheetRec.catatanSembuh,
            lastEditedAt: existing.lastEditedAt,
            createdBy: existing.createdBy,
          },
          idx
        );
      }
      return normalizeServerRecord(sheetRec, idx);
    });

    // Preserve locally-created records not yet in Google Sheets
    sharedRecords.forEach((r) => {
      if (r.no && !sheetNos.has(r.no) && r.createdBy) {
        merged.push(normalizeServerRecord(r, merged.length));
      }
    });

    merged.sort((a, b) => (a.no || 0) - (b.no || 0));

    const hasChanges =
      merged.length !== sharedRecords.length ||
      merged.some((r, i) => {
        const cur = sharedRecords[i];
        if (!cur) return true;
        return (
          r.no !== cur.no ||
          r.srt !== cur.srt ||
          r.tgl !== cur.tgl ||
          r.nama !== cur.nama ||
          r.identitas !== cur.identitas ||
          r.kesatuan !== cur.kesatuan ||
          r.diag !== cur.diag ||
          r.asal !== cur.asal ||
          r.tujuan !== cur.tujuan ||
          r.moda !== cur.moda ||
          r.pendamping !== cur.pendamping ||
          r.ket !== cur.ket ||
          r.kategori !== cur.kategori ||
          r.status !== cur.status ||
          r.isSembuh !== cur.isSembuh
        );
      });

    if (hasChanges) {
      saveRecordsToDisk(merged);
      console.log(`[SERVER] Google Sheet real-time sync: ${sharedRecords.length} berkas diperbarui.`);
    }

    const updatedSyncConf = {
      ...adminSyncConfig,
      lastSyncTime: formatWibTime(),
      lastSyncStatus: 'success',
      recordsCount: sharedRecords.length,
      errorMessage: undefined,
    };
    saveSyncConfigToDisk(updatedSyncConf);

    return { success: true, updated: hasChanges, count: sharedRecords.length };
  } catch (err: any) {
    const errMsg = err?.message || 'Gagal sinkronisasi Google Sheet';
    if (!silent) {
      console.warn('[SERVER] Sinkronisasi Google Sheet gagal:', errMsg);
    }
    return { success: false, updated: false, count: sharedRecords.length, error: errMsg };
  } finally {
    isSyncingGoogleSheet = false;
  }
}

// Jalankan sinkronisasi Google Sheet otomatis setiap 10 detik saat autoSyncEnabled aktif
setInterval(() => {
  if (
    adminSyncConfig?.autoSyncEnabled !== false &&
    adminSyncConfig?.sourceType !== 'local_asset' &&
    adminSyncConfig?.sheetUrl?.startsWith('http')
  ) {
    syncFromGoogleSheet(undefined, true).catch(() => {});
  }
}, 10000);

const USERS_FILE = path.resolve(DATA_DIR, 'users.json');

interface AppUser {
  uid: string;
  username: string;
  email: string;
  name: string;
  password?: string;
  role: 'superadmin' | 'operator' | 'guest';
  createdAt: string;
}

function loadUsersFromDisk(): AppUser[] {
  let loaded: AppUser[] = [];
  let needsSave = false;
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        loaded = parsed;
      }
    }
  } catch (e) {
    console.error('[SERVER] Gagal membaca users.json:', e);
  }

  // Pastikan seluruh akun bawaan (hendra, vevi, sugi, icha, andriani) selalu tersedia
  for (const defUser of DEFAULT_USERS) {
    const existing = loaded.find(
      (u) =>
        u.username.toLowerCase() === defUser.username.toLowerCase() ||
        u.uid === defUser.uid
    );
    if (!existing) {
      loaded.push({ ...defUser });
      needsSave = true;
    } else if (!existing.password && defUser.password) {
      existing.password = defUser.password;
      needsSave = true;
    }
  }

  if (needsSave || loaded.length === 0) {
    saveUsersToDisk(loaded);
  }
  return loaded;
}

function saveUsersToDisk(users: AppUser[]): boolean {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('[SERVER] Gagal menulis users.json:', e);
    return false;
  }
}

function createServerSessionToken(user: Omit<AppUser, 'password' | 'createdAt'>): string {
  const payload = {
    uid: user.uid,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    ts: Date.now(),
  };
  const b64 = Buffer.from(JSON.stringify(payload), 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `session_v2.${b64}`;
}

let appUsers: AppUser[] = loadUsersFromDisk();

// Middleware
app.use(express.json({ limit: '15mb' }));

// CORS headers for all devices (Smartphone, Tablet, PC)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware to enforce JSON content-type
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

function extractUidFromToken(token: string): string | null {
  if (!token) return null;

  // New format: session:<uid>:<timestamp>
  if (token.startsWith('session:')) {
    const parts = token.split(':');
    return parts[1] || null;
  }

  // Legacy format: session-<uid>-<timestamp>
  if (token.startsWith('session-')) {
    const rest = token.slice('session-'.length);
    const lastDash = rest.lastIndexOf('-');
    if (lastDash > 0) {
      return rest.substring(0, lastDash);
    }
    return rest;
  }

  return null;
}

// Auth Middleware: Support stateless session_v2 tokens, custom session tokens, and Firebase tokens
async function authMiddleware(req: any, _res: any, next: any) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    req.user = { uid: 'guest', role: 'guest', username: 'guest', name: 'Tamu' };
    return next();
  }

  // 1. Check stateless session_v2 token (works across all browsers, devices, and Cloud Run instances)
  const decodedV2 = decodeSessionToken(token);
  if (decodedV2) {
    const currentUsers = loadUsersFromDisk();
    const found = currentUsers.find(
      (u) =>
        u.uid.toLowerCase() === decodedV2.uid.toLowerCase() ||
        u.username.toLowerCase() === decodedV2.username.toLowerCase()
    );
    if (found) {
      req.user = {
        uid: found.uid,
        username: found.username,
        email: found.email,
        name: found.name,
        role: found.role,
      };
    } else {
      req.user = {
        uid: decodedV2.uid,
        username: decodedV2.username,
        email: decodedV2.email,
        name: decodedV2.name,
        role: decodedV2.role,
      };
    }
    return next();
  }

  // 2. Check custom session token (both session: and legacy session-)
  const sessionUid = extractUidFromToken(token);
  if (sessionUid) {
    const currentUsers = loadUsersFromDisk();
    const cleanSessionUid = sessionUid.toLowerCase();
    const found = currentUsers.find(
      (u) =>
        u.uid.toLowerCase() === cleanSessionUid ||
        u.username.toLowerCase() === cleanSessionUid
    );
    if (found) {
      req.user = {
        uid: found.uid,
        username: found.username,
        email: found.email,
        name: found.name,
        role: found.role,
      };
      return next();
    }
    if (cleanSessionUid === 'hendra' || cleanSessionUid === 'admin-hendra') {
      req.user = {
        uid: 'admin-hendra',
        username: 'hendra',
        email: 'egahnd@gmail.com',
        name: 'Hendra (Admin)',
        role: 'superadmin',
      };
      return next();
    }
  }

  // 3. Check Firebase ID Token fallback
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    let roleFromDb: string | undefined;
    if (db) {
      let userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (!userDoc.exists && decodedToken.email === 'egahnd@gmail.com') {
        await db.collection('users').doc(decodedToken.uid).set({
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: 'superadmin',
          name: 'Hendra (Admin)',
        });
        userDoc = await db.collection('users').doc(decodedToken.uid).get();
      }
      roleFromDb = userDoc.data()?.role;
    }

    req.user.role = roleFromDb || (decodedToken.email === 'egahnd@gmail.com' ? 'superadmin' : 'operator');
    return next();
  } catch {
    // If invalid token, default to guest
    req.user = { uid: 'guest', role: 'guest', username: 'guest', name: 'Tamu' };
    next();
  }
}

app.use('/api', authMiddleware);

// Role Middleware
const checkRole = (allowedRoles: string[]) => (req: any, res: any, next: any) => {
  if (!allowedRoles.includes(req.user?.role || 'guest')) {
    return res.status(403).json({ error: 'Hak akses tidak mencukupi untuk melakukan tindakan ini.' });
  }
  next();
};

// API Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password harus diisi.' });
  }

  const cleanUser = String(username).trim().toLowerCase();
  const cleanPass = String(password).trim();

  // Reload current users from disk to ensure latest registered accounts are checked
  const currentUsers = loadUsersFromDisk();

  // 1. Direct Hendra Super Admin check
  if ((cleanUser === 'hendra' || cleanUser === 'egahnd@gmail.com') && cleanPass === '101110') {
    const adminUser = {
      uid: 'admin-hendra',
      username: 'hendra',
      name: 'Hendra (Admin)',
      email: 'egahnd@gmail.com',
      role: 'superadmin' as const,
    };
    const token = createServerSessionToken(adminUser);
    return res.json({
      success: true,
      token,
      user: adminUser,
    });
  }

  // 2. Check registered users list (username, email, or name; exact or case-insensitive password for mobile keyboards)
  const found = currentUsers.find(
    (u) =>
      (u.username.toLowerCase() === cleanUser ||
        (u.email && u.email.toLowerCase() === cleanUser) ||
        (u.name && u.name.toLowerCase() === cleanUser)) &&
      (u.password
        ? String(u.password).trim() === cleanPass ||
          String(u.password).trim().toLowerCase() === cleanPass.toLowerCase()
        : false)
  );

  if (found) {
    const safeUser = {
      uid: found.uid,
      username: found.username,
      email: found.email,
      name: found.name || found.username,
      role: found.role,
    };
    const token = createServerSessionToken(safeUser);
    return res.json({
      success: true,
      token,
      user: safeUser,
    });
  }

  return res.status(401).json({ error: 'Username atau password salah. Silakan coba kembali.' });
});

app.get('/api/me', (req: any, res: any) => {
  res.json({
    uid: req.user.uid,
    username: req.user.username || req.user.email,
    name: req.user.name || req.user.username || req.user.email,
    email: req.user.email,
    role: req.user.role,
  });
});

app.get('/api/wallpaper', checkRole(['superadmin', 'operator', 'guest']), (_req, res) => {
  res.json({
    wallpaper: adminWallpaperConfig,
    lastUpdated,
  });
});

app.post('/api/wallpaper', checkRole(['superadmin']), (req, res) => {
  const { wallpaper } = req.body;
  if (!wallpaper) {
    return res.status(400).json({ error: 'Data wallpaper tidak valid.' });
  }
  saveWallpaperToDisk(wallpaper);
  res.json({
    success: true,
    wallpaper: adminWallpaperConfig,
  });
});

app.get('/api/sync-config', checkRole(['superadmin', 'operator', 'guest']), (_req, res) => {
  res.json({
    syncConfig: adminSyncConfig,
    lastUpdated,
  });
});

app.post('/api/sync-config', checkRole(['superadmin']), (req, res) => {
  const { syncConfig } = req.body;
  if (!syncConfig) {
    return res.status(400).json({ error: 'Data syncConfig tidak valid.' });
  }
  saveSyncConfigToDisk(syncConfig);
  if (syncConfig?.sheetUrl?.startsWith('http') && syncConfig?.sourceType !== 'local_asset') {
    syncFromGoogleSheet(syncConfig.sheetUrl, true).catch(() => {});
  }
  res.json({
    success: true,
    syncConfig: adminSyncConfig,
  });
});

app.get('/api/proxy-sheet', checkRole(['superadmin', 'operator', 'guest']), async (req, res) => {
  const url = String(req.query.url || adminSyncConfig?.sheetUrl || '').trim();
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Parameter URL Google Sheet tidak valid.' });
  }
  try {
    const csvText = await fetchLiveCsvText(url);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.send(csvText);
  } catch (err: any) {
    res.status(502).json({ error: err?.message || 'Gagal mengambil data Google Sheet' });
  }
});

app.post('/api/records/sync-sheet', checkRole(['superadmin', 'operator', 'guest']), async (req, res) => {
  const customUrl = typeof req.body?.sheetUrl === 'string' ? req.body.sheetUrl.trim() : undefined;
  const result = await syncFromGoogleSheet(customUrl || undefined, false);
  if (!result.success && result.error) {
    return res.status(502).json({
      success: false,
      error: result.error,
      records: sharedRecords,
      count: sharedRecords.length,
      lastUpdated,
      syncConfig: adminSyncConfig,
    });
  }
  res.json({
    success: true,
    updated: result.updated,
    records: sharedRecords,
    count: sharedRecords.length,
    lastUpdated,
    syncConfig: adminSyncConfig,
  });
});

const WALLPAPER_DIR = path.resolve(process.cwd(), 'public/assets/wallpaper');
if (!fs.existsSync(WALLPAPER_DIR)) {
  fs.mkdirSync(WALLPAPER_DIR, { recursive: true });
}

app.get('/api/wallpapers', checkRole(['superadmin', 'operator', 'guest']), (_req, res) => {
  try {
    if (!fs.existsSync(WALLPAPER_DIR)) {
      return res.json({ wallpapers: [] });
    }
    const files = fs.readdirSync(WALLPAPER_DIR).filter(f => !f.startsWith('.'));
    res.json({ wallpapers: files });
  } catch (e) {
    res.json({ wallpapers: [] });
  }
});

app.post('/api/wallpapers/upload', checkRole(['superadmin', 'operator']), (req, res) => {
  const { filename, dataBase64 } = req.body;
  if (!filename || !dataBase64) {
    return res.status(400).json({ error: 'Nama file atau data gambar tidak valid.' });
  }

  try {
    const cleanName = filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const uniqueName = `upload_${Date.now()}_${cleanName}`;
    const filePath = path.resolve(WALLPAPER_DIR, uniqueName);

    const base64Data = dataBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    fs.writeFileSync(filePath, buffer);

    const assetUrl = `/assets/wallpaper/${uniqueName}`;
    res.json({
      success: true,
      url: assetUrl,
      filename: uniqueName,
    });
  } catch (err: any) {
    console.error('[SERVER] Gagal upload wallpaper:', err);
    res.status(500).json({ error: err.message || 'Gagal menyimpan file gambar.' });
  }
});

app.get('/api/health', checkRole(['superadmin', 'operator', 'guest']), (_req, res) => {
  res.json({
    status: 'ok',
    version: serverVersion,
    timestamp: Date.now(),
    totalRecords: sharedRecords.length,
  });
});

app.get('/api/records', checkRole(['superadmin', 'operator', 'guest']), (_req, res) => {
  res.json({
    records: sharedRecords,
    count: sharedRecords.length,
    lastUpdated,
    version: serverVersion,
  });
});

app.get('/api/records/poll', checkRole(['superadmin', 'operator', 'guest']), (req, res) => {
  const clientLastUpdated = Number(req.query.lastUpdated) || 0;
  res.json({
    lastUpdated,
    count: sharedRecords.length,
    hasUpdates: lastUpdated > clientLastUpdated,
    version: serverVersion,
  });
});

app.post('/api/records', checkRole(['superadmin', 'operator']), (req, res) => {
  const { record, isUpdate } = req.body;
  if (!record || !record.nama) {
    return res.status(400).json({ error: 'Data record tidak lengkap' });
  }

  const normalizedRecord = normalizeServerRecord(record, sharedRecords.length);

  // Cek apakah Nomor Surat ganda/double
  const conflict = findConflictingRecord(
    normalizedRecord.srt,
    sharedRecords,
    isUpdate ? normalizedRecord.no : undefined
  );
  if (conflict) {
    return res.status(400).json({
      error: `Nomor Surat ganda/double (${normalizedRecord.srt})! Nomor surat tersebut sudah terdaftar atas nama ${conflict.nama} (No. Urut ${conflict.no}). Tidak dapat mengirim/menyimpan data.`,
      duplicate: true,
      conflictRecord: conflict,
    });
  }

  const rec: EvacuationRecord = {
    ...normalizedRecord,
    id: normalizedRecord.id || `rec-${normalizedRecord.no || Date.now()}-${Date.now()}`,
    isSembuh: normalizedRecord.isSembuh !== undefined ? normalizedRecord.isSembuh : isRecordSembuh(normalizedRecord),
    lastEditedAt: new Date().toISOString(),
    createdBy: (req as any).user.uid,
  };

  const existingIdx = sharedRecords.findIndex(
    (item) => (item.id && rec.id && item.id === rec.id) || (rec.no && item.no === rec.no)
  );

  let updatedList: EvacuationRecord[];
  if (existingIdx >= 0) {
    updatedList = [...sharedRecords];
    updatedList[existingIdx] = rec;
  } else {
    updatedList = [rec, ...sharedRecords];
  }

  saveRecordsToDisk(updatedList);

  res.json({
    success: true,
    record: rec,
    lastUpdated,
    count: sharedRecords.length,
  });
});

app.post('/api/records/toggle-sembuh', checkRole(['superadmin', 'operator']), (req, res) => {
  const { id, no, isSembuh, tanggalSembuh } = req.body;
  const targetIdx = sharedRecords.findIndex(
    (item) => (id && item.id === id) || (no && item.no === no)
  );

  if (targetIdx < 0) {
    return res.status(404).json({ error: 'Pasien tidak ditemukan' });
  }

  const rec = sharedRecords[targetIdx];
  const rawSembuhDate = tanggalSembuh || rec.tanggalSembuh || new Date().toLocaleDateString('id-ID');
  const updatedRec: EvacuationRecord = {
    ...rec,
    isSembuh: !!isSembuh,
    tanggalSembuh: isSembuh ? normalizeDate(rawSembuhDate) : undefined,
    lastEditedAt: new Date().toISOString(),
  };

  const updatedList = [...sharedRecords];
  updatedList[targetIdx] = updatedRec;
  saveRecordsToDisk(updatedList);

  res.json({
    success: true,
    record: updatedRec,
    lastUpdated,
    count: sharedRecords.length,
  });
});

app.get('/api/users', checkRole(['superadmin']), async (_req, res) => {
  const currentUsers = loadUsersFromDisk();
  const safeUsers = currentUsers.map(({ password: _, ...rest }) => rest);
  res.json(safeUsers);
});

app.post('/api/users/role', checkRole(['superadmin']), async (req, res) => {
  const { uid, role } = req.body;
  if (!uid || !['superadmin', 'operator', 'guest'].includes(role)) {
    return res.status(400).json({ error: 'Data tidak valid' });
  }
  const currentUsers = loadUsersFromDisk();
  const target = currentUsers.find(u => u.uid === uid || u.username === uid);
  if (target) {
    target.role = role;
    saveUsersToDisk(currentUsers);
  }
  try {
    if (db) await db.collection('users').doc(uid).update({ role });
  } catch {}
  res.json({ success: true });
});

app.post('/api/users/create', checkRole(['superadmin']), async (req, res) => {
  const { username, email, name, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Mohon lengkapi username, password, dan hak akses.' });
  }

  const cleanUser = String(username).trim().toLowerCase();
  const currentUsers = loadUsersFromDisk();

  if (currentUsers.some(u => u.username.toLowerCase() === cleanUser)) {
    return res.status(400).json({ error: 'Username sudah digunakan oleh akun lain.' });
  }

  const newUser: AppUser = {
    uid: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUser,
    email: email ? String(email).trim().toLowerCase() : `${cleanUser}@kesdam.local`,
    name: name ? String(name).trim() : cleanUser,
    password: String(password).trim(),
    role: role === 'superadmin' ? 'superadmin' : role === 'guest' ? 'guest' : 'operator',
    createdAt: new Date().toISOString(),
  };

  currentUsers.push(newUser);
  appUsers = currentUsers;
  saveUsersToDisk(currentUsers);

  try {
    if (db) {
      await db.collection('users').doc(newUser.uid).set({
        uid: newUser.uid,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        createdAt: newUser.createdAt,
      });
    }
  } catch (err) {
    // Disk is authoritative source
  }

  const { password: _, ...safeUser } = newUser;
  res.json({ success: true, user: safeUser });
});

app.post('/api/users/update', checkRole(['superadmin']), async (req, res) => {
  const { uid, username, name, email, password, role } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'UID pengguna tidak valid.' });
  }

  const currentUsers = loadUsersFromDisk();
  const target = currentUsers.find(u => u.uid === uid || u.username === uid);
  if (!target) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }

  // Check username collision if username changed
  if (username) {
    const cleanUser = String(username).trim().toLowerCase();
    const collision = currentUsers.find(
      u => u.username.toLowerCase() === cleanUser && u.uid !== target.uid
    );
    if (collision) {
      return res.status(400).json({ error: 'Username sudah digunakan oleh akun lain.' });
    }
    target.username = cleanUser;
  }

  if (name !== undefined) {
    target.name = String(name).trim() || target.username;
  }

  if (email !== undefined) {
    target.email = String(email).trim().toLowerCase() || `${target.username}@kesdam.local`;
  }

  if (password && String(password).trim().length > 0) {
    target.password = String(password).trim();
  }

  if (role && ['superadmin', 'operator', 'guest'].includes(role)) {
    if (target.uid === 'admin-hendra' || target.username === 'hendra') {
      target.role = 'superadmin';
    } else {
      target.role = role;
    }
  }

  appUsers = currentUsers;
  saveUsersToDisk(currentUsers);

  try {
    if (db) {
      const updatePayload: any = {
        username: target.username,
        name: target.name,
        email: target.email,
        role: target.role,
      };
      await db.collection('users').doc(target.uid).set(updatePayload, { merge: true });
    }
  } catch (err) {
    // Disk is authoritative source
  }

  const { password: _, ...safeUser } = target;
  res.json({ success: true, user: safeUser });
});

app.post('/api/users/delete', checkRole(['superadmin']), async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: 'UID tidak valid.' });
  if (uid === 'admin-hendra' || uid === 'hendra') {
    return res.status(400).json({ error: 'Akun Super Admin utama tidak dapat dihapus.' });
  }

  let currentUsers = loadUsersFromDisk();
  currentUsers = currentUsers.filter(u => u.uid !== uid && u.username !== uid);
  appUsers = currentUsers;
  saveUsersToDisk(currentUsers);

  try {
    if (db) await db.collection('users').doc(uid).delete();
  } catch {}

  res.json({ success: true });
});

app.post('/api/records/batch', checkRole(['superadmin']), (req: any, res: any) => {
  const { records, source } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'Array records kosong atau tidak valid' });
  }

  // Create lookup maps from existing shared records
  const existingByNo = new Map<number, EvacuationRecord>();
  const existingBySrt = new Map<string, EvacuationRecord>();
  sharedRecords.forEach((r) => {
    if (r.no) existingByNo.set(r.no, r);
    if (r.srt) existingBySrt.set(r.srt.trim().toLowerCase(), r);
  });

  const mergedList: EvacuationRecord[] = records.map((newRec: EvacuationRecord, idx: number) => {
    const existing =
      (newRec.no ? existingByNo.get(newRec.no) : undefined) ||
      (newRec.srt ? existingBySrt.get(newRec.srt.trim().toLowerCase()) : undefined);

    // If record already exists on server, preserve user edits (like isSembuh, tanggalSembuh, custom notes, etc.)
    return {
      ...newRec,
      id: existing?.id || newRec.id || `rec-${newRec.no || idx + 1}-${idx}`,
      isSembuh:
        existing?.isSembuh !== undefined
          ? existing.isSembuh
          : newRec.isSembuh !== undefined
          ? newRec.isSembuh
          : isRecordSembuh(newRec),
      tanggalSembuh: existing?.tanggalSembuh || newRec.tanggalSembuh,
      lastEditedAt: existing?.lastEditedAt || newRec.lastEditedAt || new Date().toISOString(),
    };
  });

  // Preserve any local record not in incoming batch (e.g., newly added letters)
  const mergedNos = new Set(mergedList.map((r) => r.no));
  sharedRecords.forEach((r) => {
    if (r.no && !mergedNos.has(r.no)) {
      mergedList.push(r);
    }
  });

  mergedList.sort((a, b) => (a.no || 0) - (b.no || 0));

  saveRecordsToDisk(mergedList);

  res.json({
    success: true,
    count: sharedRecords.length,
    lastUpdated,
    source: source || 'batch_sync',
  });
});

// 404 handler for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API Route Not Found' });
});

// Start Express + Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);

  if (isProduction) {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(
        express.static(distPath, {
          etag: false,
          lastModified: false,
          setHeaders: (res, filePath) => {
            if (filePath.endsWith('.html') || filePath.includes('CEN_') || filePath.endsWith('.json')) {
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
              res.setHeader('Pragma', 'no-cache');
              res.setHeader('Expires', '0');
            }
          },
        })
      );
      app.get('*', (_req, res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[KESDAM SERVER] Running at http://0.0.0.0:${PORT}`);
    console.log(`[KESDAM SERVER] Multi-device synchronization active for ${sharedRecords.length} records.`);
    if (
      adminSyncConfig?.autoSyncEnabled !== false &&
      adminSyncConfig?.sourceType !== 'local_asset' &&
      adminSyncConfig?.sheetUrl?.startsWith('http')
    ) {
      setTimeout(() => {
        syncFromGoogleSheet(undefined, true).catch(() => {});
      }, 800);
    }
  });
}

startServer().catch((err) => {
  console.error('[KESDAM SERVER] Error starting server:', err);
  process.exit(1);
});
