import type { EvacuationRecord } from '../types/evacuation.ts';
import { determineCategory, determineStatus, initialEvacuationData, isRecordSembuh } from '../data/evacuationData.ts';
import { APP_VERSION } from './version.ts';
import { correctTanggal, correctNomorSurat } from './textCorrector.ts';

export const LOCAL_ASSET_PATH = '/assets/aistudio/CEN_c332d297';

/**
 * RFC 4180-compliant CSV Parser supporting:
 * - Double-quoted values containing commas, tabs, and newlines
 * - Escaped double-quotes ("")
 * - Windows (\r\n) and Unix (\n) line breaks
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;
  let i = 0;

  // Strip potential BOM
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i += 2;
        continue;
      } else {
        insideQuotes = !insideQuotes;
        i++;
        continue;
      }
    }

    if (!insideQuotes && char === ',') {
      currentRow.push(currentCell.trim());
      currentCell = '';
      i++;
      continue;
    }

    if (!insideQuotes && (char === '\r' || char === '\n')) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      i++;
      continue;
    }

    currentCell += char;
    i++;
  }

  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes any spreadsheet date format (ISO YYYY-MM-DD, D/M/YY, MM/DD/YYYY, month names, Excel serials, etc.)
 * into canonical DD/MM/YYYY format automatically.
 */
export function normalizeDate(raw: string): string {
  return correctTanggal(raw);
}

const ROMAN_MONTH_MAP: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
  VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12,
};

export function extractRomanMonthFromSurat(srt: string): number | null {
  if (!srt) return null;
  const parts = srt.toUpperCase().split(/[\/\s-]+/).filter(Boolean);
  for (const p of parts) {
    if (ROMAN_MONTH_MAP[p]) return ROMAN_MONTH_MAP[p];
  }
  return null;
}

export function swapDayMonthDmy(dmy: string): string | null {
  const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  if (d >= 1 && d <= 12 && mo >= 1 && mo <= 12 && d !== mo) {
    return `${String(mo).padStart(2, '0')}/${String(d).padStart(2, '0')}/${m[3]}`;
  }
  return null;
}

export function dmyToTimestamp(dmy: string): number | null {
  const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return Date.UTC(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
}

const masterByNoMap = new Map<number, EvacuationRecord>(
  initialEvacuationData.map((r) => [r.no, r])
);

export function resolveSpreadsheetDate(
  rawDate: string,
  no: number,
  nama: string,
  srt: string,
  prevTimestamp?: number | null,
  nextTimestamp?: number | null
): string {
  const normalized = normalizeDate(rawDate);
  const swapped = swapDayMonthDmy(normalized);
  if (!swapped) return normalized;

  // 1. Canonical master verification (prevents US-locale MM/DD flips on rows 1..106)
  const master = masterByNoMap.get(no);
  if (
    master &&
    master.nama.toLowerCase().replace(/\s+/g, '') === nama.toLowerCase().replace(/\s+/g, '') &&
    swapped === master.tgl
  ) {
    return master.tgl;
  }

  // 2. Roman month verification from letter number (e.g. EV/XI/2026)
  const romanMonth = extractRomanMonthFromSurat(srt);
  if (romanMonth !== null) {
    const normMonth = parseInt(normalized.slice(3, 5), 10);
    const swapMonth = parseInt(swapped.slice(3, 5), 10);
    if (normMonth !== romanMonth && swapMonth === romanMonth) {
      return swapped;
    }
  }

  // 3. Chronological sequence check against neighboring rows
  const tNorm = dmyToTimestamp(normalized);
  const tSwap = dmyToTimestamp(swapped);
  if (tNorm !== null && tSwap !== null) {
    const normViolatesPrev = prevTimestamp != null && tNorm < prevTimestamp;
    const normViolatesNext = nextTimestamp != null && tNorm > nextTimestamp;
    const swapFitsPrev = prevTimestamp == null || tSwap >= prevTimestamp;
    const swapFitsNext = nextTimestamp == null || tSwap <= nextTimestamp;
    if ((normViolatesPrev || normViolatesNext) && swapFitsPrev && swapFitsNext) {
      return swapped;
    }
  }

  return normalized;
}

/**
 * Parses raw 2D array of CSV rows into typed EvacuationRecords
 */
export function parseEvacuationCsv(csvText: string): EvacuationRecord[] {
  const allRows = parseCSV(csvText);
  if (allRows.length === 0) return [];

  // Find the header row (contains "NO" and "SURAT" or "PASIEN")
  let headerIndex = -1;
  for (let idx = 0; idx < Math.min(10, allRows.length); idx++) {
    const rowJoined = allRows[idx].join(' ').toUpperCase();
    if (rowJoined.includes('NO SURAT') || (rowJoined.includes('NAMA') && rowJoined.includes('PASIEN'))) {
      headerIndex = idx;
      break;
    }
  }

  const dataRows = headerIndex >= 0 ? allRows.slice(headerIndex + 1) : allRows;
  const records: EvacuationRecord[] = [];

  for (const row of dataRows) {
    if (!row || row.length < 4) continue;

    const noStr = (row[0] || '').trim();
    const parsedNo = parseInt(noStr, 10);
    const nama = (row[3] || '').trim();
    
    // Skip invalid rows, headers, and trailing empty spreadsheet rows
    if (isNaN(parsedNo) || !nama) continue;

    // Handle note in NO SURAT (e.g. B/33/EV/V/2026\nBATAL EVAK or B/33/EV/V/2026 BATAL)
    let rawSrt = (row[1] || '').trim();
    let noteFromSrt = '';
    const lowerRawSrt = rawSrt.toLowerCase();
    const keywordIdx = Math.max(lowerRawSrt.indexOf('batal'), lowerRawSrt.indexOf('ralat'), lowerRawSrt.indexOf('dibatalkan'), lowerRawSrt.indexOf('diralat'));

    if (rawSrt.includes('\n')) {
      const splitSrt = rawSrt.split('\n').map((s) => s.trim()).filter(Boolean);
      rawSrt = splitSrt[0] || '';
      noteFromSrt = splitSrt.slice(1).join(' - ');
    } else if (keywordIdx > 0) {
      // Note found in the same line
      noteFromSrt = rawSrt.substring(keywordIdx);
      rawSrt = rawSrt.substring(0, keywordIdx).trim();
    }

    const finalNo = parsedNo > 0 ? parsedNo : records.length + 1;
    let finalSrt = rawSrt;
    if (!finalSrt) {
      finalSrt = finalNo === 86 ? 'B/85/EV/XI/2026' : `B/${finalNo}/EV/2026`;
    }

    const rawTgl = resolveSpreadsheetDate(row[2] || '', finalNo, nama, finalSrt);
    finalSrt = correctNomorSurat(finalSrt, rawTgl) || finalSrt;
    const pangkatNrp = (row[4] || '').trim();
    const jabatan = (row[5] || '').trim();
    const kesatuan = (row[6] || '').trim();
    const jk = (row[7] || '').trim();
    const umur = (row[8] || '').trim();
    const diag = (row[9] || '').trim();
    const asal = (row[10] || '').trim();
    const tujuan = (row[11] || '').trim();
    const moda = (row[12] || '').trim() || 'Pesawat';
    const pendamping = (row[13] || '').trim() || '-';
    
    let ket = (row[14] || '').trim() || 'BEROBAT';
    if (noteFromSrt) {
      if (ket === '-' || !ket) {
        ket = noteFromSrt;
      } else if (!ket.includes(noteFromSrt)) {
        ket = `${ket} (${noteFromSrt})`;
      }
    }

    const identitas = pangkatNrp || (jabatan ? `${jabatan}` : '-');
    const kategori = determineCategory(nama, `${pangkatNrp} ${jabatan}`);
    const status = determineStatus(ket, rawSrt);

    const isSembuh = isRecordSembuh({ ket, srt: finalSrt });

    records.push({
      id: `evak-${finalNo}-${finalSrt}-${records.length}`,
      no: finalNo,
      srt: finalSrt,
      tgl: rawTgl,
      nama,
      identitas,
      kesatuan: kesatuan || 'Kodam XVII/Cenderawasih',
      diag: diag || 'Evaluasi Medis Spesialistik',
      asal: asal || 'RS TK II 17.05.01 Marthen Indey',
      tujuan: tujuan || 'RSPAD Gatot Soebroto Jakarta',
      moda,
      pendamping: pendamping === '_' ? '-' : pendamping,
      ket,
      kategori,
      status,
      isSembuh,
      tanggalSembuh: isSembuh ? rawTgl : undefined,
      jabatan: jabatan || undefined,
      umur: umur || undefined,
      jk: jk || undefined,
    });
  }

  // Order by 'no' and run chronological neighbor swap pass for any unindexed new rows
  const sorted = records.sort((a, b) => a.no - b.no);
  for (let idx = 0; idx < sorted.length; idx++) {
    const rec = sorted[idx];
    const prevTs = idx > 0 ? dmyToTimestamp(sorted[idx - 1].tgl) : null;
    const nextTs = idx + 1 < sorted.length ? dmyToTimestamp(sorted[idx + 1].tgl) : null;
    const repaired = resolveSpreadsheetDate(rec.tgl, rec.no, rec.nama, rec.srt, prevTs, nextTs);
    if (repaired !== rec.tgl) {
      rec.tgl = repaired;
      if (rec.isSembuh) rec.tanggalSembuh = repaired;
    }
    rec.srt = correctNomorSurat(rec.srt, rec.tgl) || rec.srt;
  }
  return sorted;
}

/**
 * Normalizes any Google Sheets URL into a direct CSV export endpoint.
 * Uses Google Visualization API (/gviz/tq?tqx=out:csv) which avoids 302 redirects
 * and works better with cross-origin browser requests.
 */
export function normalizeGoogleSheetCsvUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  // If already a published CSV export link or direct CSV endpoint, return as is
  if (trimmed.includes('pub?output=csv') || trimmed.includes('/gviz/tq?tqx=out:csv')) {
    return trimmed;
  }

  // Check if standard Google Sheets edit or preview URL:
  // e.g. https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    // Check if gid is present
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gidParam}`;
  }

  return trimmed;
}

/**
 * Helper to fetch with an abort timeout
 */
async function fetchWithTimeout(url: string, timeoutMs: number = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/csv, text/plain, */*',
      },
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export interface FetchSpreadsheetOptions {
  fallbackToLocal?: boolean;
  silent?: boolean;
}

/**
 * Fetches spreadsheet CSV from local asset or Google Sheets.
 * Robust against network errors, CORS restrictions, and offline states.
 */
export async function fetchSpreadsheetData(
  url: string = LOCAL_ASSET_PATH,
  options: FetchSpreadsheetOptions = {}
): Promise<EvacuationRecord[]> {
  const { fallbackToLocal = true, silent = false } = options;
  const isLocalAsset = !url || url === LOCAL_ASSET_PATH || url.startsWith('/');

  // --- 1. LOCAL ASSET FETCH ---
  if (isLocalAsset) {
    const targetPath = url || LOCAL_ASSET_PATH;
      try {
      const sep = targetPath.includes('?') ? '&' : '?';
      const fetchUrl = `${targetPath}${sep}_t=${Date.now()}&v=${APP_VERSION}`;
      const response = await fetchWithTimeout(fetchUrl, 5000);

      if (response.ok) {
        const csvText = await response.text();
        const records = parseEvacuationCsv(csvText);
        if (records.length > 0) {
          return records;
        }
      }
    } catch (localErr) {
      if (!silent) {
        console.warn('Gagal memuat berkas lokal via fetch, beralih ke dataset bawaan:', localErr);
      }
    }

    // Always fall back safely to bundled initialEvacuationData (81 records)
    return initialEvacuationData;
  }

  // --- 2. REMOTE / GOOGLE SHEETS FETCH ---
  const normalizedUrl = url.includes('docs.google.com') ? normalizeGoogleSheetCsvUrl(url) : url;

  // Build list of candidate URLs to attempt
  const candidateUrls: string[] = [];

  // Candidate 0: Server-side proxy (bypasses browser CORS & stale Google CDN cache when running in browser)
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    candidateUrls.push(`/api/proxy-sheet?url=${encodeURIComponent(url)}&_t=${Date.now()}`);
  }

  // Candidate 1: Normalized URL (e.g. gviz/tq?tqx=out:csv or pub?output=csv)
  const sep = normalizedUrl.includes('?') ? '&' : '?';
  candidateUrls.push(`${normalizedUrl}${sep}_t=${Date.now()}`);

  // Candidate 2: Alternative Google Sheet endpoint
  if (normalizedUrl.includes('/gviz/tq?tqx=out:csv')) {
    const altExport = normalizedUrl.replace('/gviz/tq?tqx=out:csv', '/export?format=csv');
    candidateUrls.push(`${altExport}&_t=${Date.now()}`);
  } else if (normalizedUrl.includes('/export?format=csv')) {
    const altGviz = normalizedUrl.replace('/export?format=csv', '/gviz/tq?tqx=out:csv');
    candidateUrls.push(`${altGviz}&_t=${Date.now()}`);
  }

  // Candidate 3: CORS proxy fallback
  candidateUrls.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(normalizedUrl)}`);

  let lastError: any = null;

  for (const candidate of candidateUrls) {
    try {
      const response = await fetchWithTimeout(candidate, 6500);
      if (response.ok) {
        const text = await response.text();
        // Check if response is HTML login page instead of CSV
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          throw new Error('Google Sheet belum dipublikasikan atau memerlukan login');
        }
        const records = parseEvacuationCsv(text);
        if (records.length > 0) {
          return records;
        }
      }
    } catch (err: any) {
      lastError = err;
      // Continue to next candidate endpoint
    }
  }

  // If remote fetch failed and fallback is allowed (e.g. background sync)
  if (fallbackToLocal) {
    if (!silent) {
      console.warn('Sinkronisasi Google Sheet offline atau dibatasi CORS. Mempertahankan data lokal.');
    }
    // Attempt local asset, or fallback to initialEvacuationData
    try {
      const localResp = await fetchWithTimeout(LOCAL_ASSET_PATH, 4000);
      if (localResp.ok) {
        const text = await localResp.text();
        const records = parseEvacuationCsv(text);
        if (records.length > 0) return records;
      }
    } catch {
      // ignore
    }
    return initialEvacuationData;
  }

  // If manual sync where user needs direct feedback
  const reason = lastError?.message || 'Koneksi dibatasi CORS atau offline';
  throw new Error(
    `Tidak dapat mengakses Google Sheets: ${reason}. Pastikan akses diatur "Siapa saja yang memiliki link dapat melihat" atau gunakan opsi Unggah Berkas CSV.`
  );
}

/**
 * Intelligently merges newly fetched records with locally modified ones
 */
export function mergeWithLocalEdits(
  fetchedRecords: EvacuationRecord[],
  localRecords: EvacuationRecord[],
  preserveLocalEdits: boolean = true
): EvacuationRecord[] {
  // Build map of master records (guaranteed baseline of 88 records)
  const masterMap = new Map<number, EvacuationRecord>();
  initialEvacuationData.forEach((r) => {
    if (r.no) masterMap.set(r.no, r);
  });

  // Build map of local records by No
  const localMap = new Map<number, EvacuationRecord>();
  if (Array.isArray(localRecords)) {
    localRecords.forEach((r) => {
      if (r.no) localMap.set(r.no, r);
    });
  }

  // Build map of fetched records by No
  const fetchedMap = new Map<number, EvacuationRecord>();
  if (Array.isArray(fetchedRecords)) {
    fetchedRecords.forEach((r) => {
      if (r.no) fetchedMap.set(r.no, r);
    });
  }

  // Combine all record numbers (must include master 1..88, local, and fetched)
  const allNos = new Set<number>();
  initialEvacuationData.forEach((r) => allNos.add(r.no));
  if (Array.isArray(localRecords)) localRecords.forEach((r) => allNos.add(r.no));
  if (Array.isArray(fetchedRecords)) fetchedRecords.forEach((r) => allNos.add(r.no));

  const merged: EvacuationRecord[] = [];

  allNos.forEach((no) => {
    const master = masterMap.get(no);
    const local = localMap.get(no);
    const fetched = fetchedMap.get(no);

    // Baseline candidate: master record, or fetched, or local
    const base = master || fetched || local;
    if (!base) return;

    let finalRecord: EvacuationRecord = { ...base };

    // Apply fetched updates if present
    if (fetched) {
      finalRecord = {
        ...finalRecord,
        ...fetched,
      };
    }

    // Preserve local user edits if user manually toggled/edited the same patient
    if (local && preserveLocalEdits && local.nama === finalRecord.nama) {
      finalRecord = {
        ...finalRecord,
        isSembuh: local.isSembuh !== undefined ? local.isSembuh : finalRecord.isSembuh,
        tanggalSembuh: local.tanggalSembuh || finalRecord.tanggalSembuh,
        ...(local.lastEditedAt ? local : {}),
      };
    }

    // Normalize dates & letter number format consistently
    if (finalRecord.tgl) {
      finalRecord.tgl = normalizeDate(finalRecord.tgl);
    }
    if (finalRecord.srt) {
      finalRecord.srt = correctNomorSurat(finalRecord.srt, finalRecord.tgl) || finalRecord.srt;
    }
    if (finalRecord.tanggalSembuh) {
      finalRecord.tanggalSembuh = normalizeDate(finalRecord.tanggalSembuh);
    }

    // Ensure isSembuh is strictly boolean
    finalRecord.isSembuh =
      finalRecord.isSembuh !== undefined
        ? finalRecord.isSembuh
        : isRecordSembuh(finalRecord);

    merged.push(finalRecord);
  });

  return merged.sort((a, b) => a.no - b.no);
}
