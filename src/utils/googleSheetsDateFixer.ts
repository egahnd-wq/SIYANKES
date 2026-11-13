import { correctTanggal, correctNomorSurat } from './textCorrector';
import { resolveSpreadsheetDate, dmyToTimestamp } from './csvSync';

export interface DateCellRepairItem {
  kind: 'DATE' | 'SURAT';
  rowIndex0Based: number;
  rowNumber1Based: number;
  colIndex0Based: number;
  a1Cell: string;
  no: string;
  nama: string;
  before: string;
  after: string;
  serialNumber: number | null;
}

export interface SheetDateRepairPlan {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetLocale: string;
  needsLocaleUpdate: boolean;
  sheetId: number;
  sheetTitle: string;
  gridRowCount: number;
  dateColIndex: number;
  dateColLetter: string;
  srtColIndex: number;
  srtColLetter: string;
  startDataRowIndex: number;
  totalScannedRows: number;
  itemsToFix: DateCellRepairItem[];
}

export function extractSpreadsheetId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export function extractGid(url: string): number | null {
  if (!url) return null;
  const match = url.match(/[#&?]gid=([0-9]+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function columnIndexToA1(colIndex: number): string {
  let n = colIndex + 1;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

/**
 * Converts DD/MM/YYYY to unambiguous Google Sheets / Excel 1900 epoch serial number
 */
export function dmyToSheetsSerial(dmy: string): number | null {
  const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  const utcDate = Date.UTC(year, month - 1, day);
  const sheetsEpoch = Date.UTC(1899, 11, 30);
  const diffDays = Math.round((utcDate - sheetsEpoch) / 86400000);
  return isNaN(diffDays) ? null : diffDays;
}

/**
 * Fetches Google Sheet metadata dynamically (never hardcodes "Sheet1"),
 * scans all cells in TANGGAL SURAT (DD/MM/YYYY) and NO SURAT (B/<NN>/EV/<ROMAWI>/<YYYY>),
 * and returns a concrete repair plan.
 */
export async function scanGoogleSheetDates(
  sheetUrl: string,
  accessToken: string
): Promise<SheetDateRepairPlan> {
  const spreadsheetId = extractSpreadsheetId(sheetUrl);
  if (!spreadsheetId) {
    throw new Error('Tautan Google Sheets tidak valid (ID spreadsheet tidak ditemukan).');
  }

  // 1. Read spreadsheet metadata first to determine actual tab title, numeric sheetId, grid bounds & locale
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties(title,locale),sheets.properties(sheetId,title,gridProperties(rowCount,columnCount))`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!metaRes.ok) {
    const errBody = await metaRes.json().catch(() => ({}));
    const msg = errBody?.error?.message || `HTTP ${metaRes.status}`;
    if (metaRes.status === 401) {
      throw new Error('Sesi Google Sheets berakhir. Silakan Sign in with Google kembali.');
    }
    if (metaRes.status === 403) {
      if (String(msg).toLowerCase().includes('insufficient') || String(msg).toLowerCase().includes('scope')) {
        throw new Error('Izin edit Google Sheets belum dicentang saat Sign in with Google. Silakan masuk ulang dan centang izin Google Sheets.');
      }
      throw new Error(`Akun Google ini tidak memiliki izin akses pada Google Sheets tersebut (${msg}).`);
    }
    throw new Error(`Gagal membaca metadata Google Sheets: ${msg}`);
  }

  const meta = await metaRes.json();
  const sheetsList: Array<{
    properties: { sheetId: number; title: string; gridProperties?: { rowCount?: number; columnCount?: number } };
  }> = meta.sheets || [];
  if (sheetsList.length === 0) {
    throw new Error('Spreadsheet tidak memiliki tab sheet yang valid.');
  }

  const targetGid = extractGid(sheetUrl);
  const matchedSheet =
    targetGid !== null
      ? sheetsList.find((s) => s.properties.sheetId === targetGid) || sheetsList[0]
      : sheetsList[0];

  const sheetId = matchedSheet.properties.sheetId;
  const sheetTitle = matchedSheet.properties.title;
  const gridRowCount = matchedSheet.properties.gridProperties?.rowCount || 1000;
  const spreadsheetTitle = meta.properties?.title || 'Google Sheets';
  const spreadsheetLocale = meta.properties?.locale || '';
  const needsLocaleUpdate = !spreadsheetLocale.toLowerCase().startsWith('id');

  // 2. Read displayed formatted values starting explicitly at A1 so index 0 ALWAYS matches row 1
  const escapedTab = `'${sheetTitle.replace(/'/g, "''")}'`;
  const valuesRange = `${escapedTab}!A1:Z`;
  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(valuesRange)}?valueRenderOption=FORMATTED_VALUE`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!valuesRes.ok) {
    const errBody = await valuesRes.json().catch(() => ({}));
    throw new Error(
      `Gagal membaca data sheet "${sheetTitle}": ${errBody?.error?.message || valuesRes.status}`
    );
  }

  const valuesData = await valuesRes.json();
  const rows: string[][] = valuesData.values || [];

  // 3. Locate header row, NO SURAT column, and TANGGAL SURAT column dynamically
  let headerRowIdx = -1;
  let srtColIndex = 1; // Standard column B fallback
  let dateColIndex = 2; // Standard column C fallback

  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i] || [];
    const joined = row.join(' ').toUpperCase();
    if (joined.includes('NO SURAT') || (joined.includes('NAMA') && joined.includes('PASIEN'))) {
      headerRowIdx = i;
      const foundSrtCol = row.findIndex((cell) => {
        const up = String(cell || '').toUpperCase();
        return up.includes('NO SURAT') || up.includes('NOMOR SURAT');
      });
      if (foundSrtCol >= 0) {
        srtColIndex = foundSrtCol;
      }
      const foundDateCol = row.findIndex((cell) =>
        String(cell || '').toUpperCase().includes('TANGGAL')
      );
      if (foundDateCol >= 0) {
        dateColIndex = foundDateCol;
      }
      break;
    }
  }

  const startDataRowIndex = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
  const dateColLetter = columnIndexToA1(dateColIndex);
  const srtColLetter = columnIndexToA1(srtColIndex);

  interface ScannedRow {
    rowIndex0Based: number;
    noStr: string;
    parsedNo: number;
    srt: string;
    nama: string;
    rawDate: string;
    resolvedDate: string;
  }

  const scannedRows: ScannedRow[] = [];

  for (let r = startDataRowIndex; r < rows.length; r++) {
    const row = rows[r] || [];
    const noVal = String(row[0] || '').trim();
    const srtVal = String(row[srtColIndex] ?? '').trim();
    const namaVal = String(row[3] || '').trim();
    const parsedNo = parseInt(noVal, 10);

    if (isNaN(parsedNo) || !namaVal) continue;

    const rawDate = String(row[dateColIndex] ?? '').trim();
    const resolved = rawDate && rawDate !== '-'
      ? resolveSpreadsheetDate(rawDate, parsedNo, namaVal, srtVal)
      : rawDate;

    scannedRows.push({
      rowIndex0Based: r,
      noStr: noVal,
      parsedNo,
      srt: srtVal,
      nama: namaVal,
      rawDate,
      resolvedDate: resolved,
    });
  }

  // Second pass with chronological neighbor bounds to catch any newly added swapped dates
  for (let i = 0; i < scannedRows.length; i++) {
    const cur = scannedRows[i];
    if (!cur.rawDate || cur.rawDate === '-') continue;
    const prevTs = i > 0 ? dmyToTimestamp(scannedRows[i - 1].resolvedDate) : null;
    const nextTs = i + 1 < scannedRows.length ? dmyToTimestamp(scannedRows[i + 1].resolvedDate) : null;
    cur.resolvedDate = resolveSpreadsheetDate(
      cur.resolvedDate || cur.rawDate,
      cur.parsedNo,
      cur.nama,
      cur.srt,
      prevTs,
      nextTs
    );
  }

  const itemsToFix: DateCellRepairItem[] = [];
  for (const item of scannedRows) {
    const finalDateTarget = item.rawDate && item.rawDate !== '-' ? correctTanggal(item.resolvedDate) : '';

    // Check TANGGAL SURAT cell
    if (finalDateTarget && finalDateTarget !== item.rawDate) {
      itemsToFix.push({
        kind: 'DATE',
        rowIndex0Based: item.rowIndex0Based,
        rowNumber1Based: item.rowIndex0Based + 1,
        colIndex0Based: dateColIndex,
        a1Cell: `${dateColLetter}${item.rowIndex0Based + 1}`,
        no: item.noStr,
        nama: item.nama,
        before: item.rawDate,
        after: finalDateTarget,
        serialNumber: dmyToSheetsSerial(finalDateTarget),
      });
    }

    // Check NO SURAT cell (standardize to B/<NN>/EV/<ROMAWI>/<YYYY>)
    if (item.srt && item.srt !== '-') {
      const targetSrt = correctNomorSurat(item.srt, finalDateTarget || item.rawDate);
      if (targetSrt && targetSrt !== item.srt) {
        itemsToFix.push({
          kind: 'SURAT',
          rowIndex0Based: item.rowIndex0Based,
          rowNumber1Based: item.rowIndex0Based + 1,
          colIndex0Based: srtColIndex,
          a1Cell: `${srtColLetter}${item.rowIndex0Based + 1}`,
          no: item.noStr,
          nama: item.nama,
          before: item.srt,
          after: targetSrt,
          serialNumber: null,
        });
      }
    }
  }

  return {
    spreadsheetId,
    spreadsheetTitle,
    spreadsheetLocale,
    needsLocaleUpdate,
    sheetId,
    sheetTitle,
    gridRowCount,
    dateColIndex,
    dateColLetter,
    srtColIndex,
    srtColLetter,
    startDataRowIndex,
    totalScannedRows: scannedRows.length,
    itemsToFix,
  };
}

/**
 * Applies explicit batchUpdate in Google Sheets:
 * 1) Writes unambiguous serial values + dd/mm/yyyy cell format to every non-standard/swapped DATE cell
 *    and standardized B/<NN>/EV/<ROMAWI>/<YYYY> stringValue to every non-standard NO SURAT cell.
 *    (Executed first and isolated so grid bounds / locale settings can never roll back cell fixes!)
 * 2) Best-effort secondary batchUpdate to apply dd/mm/yyyy date format to existing/future column rows
 *    clamped strictly within actual gridRowCount, and sets locale to id_ID if permitted.
 */
export async function applyGoogleSheetDateRepairs(
  plan: SheetDateRepairPlan,
  accessToken: string
): Promise<{ updatedCells: number; columnFormatted: boolean; localeUpdated: boolean }> {
  // Phase 1: Primary cell updates (updateCells for every detected mismatch)
  if (plan.itemsToFix.length > 0) {
    const cellRequests = plan.itemsToFix.map((item) => {
      const isDateWithSerial = item.kind === 'DATE' && item.serialNumber !== null;
      return {
        updateCells: {
          range: {
            sheetId: plan.sheetId,
            startRowIndex: item.rowIndex0Based,
            endRowIndex: item.rowIndex0Based + 1,
            startColumnIndex: item.colIndex0Based,
            endColumnIndex: item.colIndex0Based + 1,
          },
          rows: [
            {
              values: [
                isDateWithSerial
                  ? {
                      userEnteredValue: { numberValue: item.serialNumber },
                      userEnteredFormat: {
                        numberFormat: {
                          type: 'DATE',
                          pattern: 'dd/mm/yyyy',
                        },
                      },
                    }
                  : {
                      userEnteredValue: { stringValue: item.after },
                    },
              ],
            },
          ],
          fields: isDateWithSerial
            ? 'userEnteredValue,userEnteredFormat.numberFormat'
            : 'userEnteredValue',
        },
      };
    });

    const cellRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${plan.spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: cellRequests }),
      }
    );

    if (!cellRes.ok) {
      const errBody = await cellRes.json().catch(() => ({}));
      const msg = errBody?.error?.message || `HTTP ${cellRes.status}`;
      if (cellRes.status === 401) {
        throw new Error('Sesi Google Sheets berakhir. Silakan Sign in with Google kembali.');
      }
      if (cellRes.status === 403) {
        if (String(msg).toLowerCase().includes('insufficient') || String(msg).toLowerCase().includes('scope')) {
          throw new Error('Izin edit Google Sheets belum diberikan. Klik Sign in with Google ulang dan pastikan izin edit Google Sheets dicentang.');
        }
        throw new Error(`Akun Google Anda tidak memiliki izin Editor pada Google Sheets ini (${msg}).`);
      }
      throw new Error(`Gagal memperbarui sel Google Sheets: ${msg}`);
    }
  }

  // Phase 2: Best-effort column date formatting (strictly clamped to plan.gridRowCount) + locale
  let columnFormatted = false;
  let localeUpdated = false;
  const safeEndRow = Math.max(
    plan.startDataRowIndex + 1,
    Math.min(plan.gridRowCount || 1000, plan.startDataRowIndex + plan.totalScannedRows + 200)
  );

  try {
    const fmtRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${plan.spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: plan.sheetId,
                  startRowIndex: plan.startDataRowIndex,
                  endRowIndex: safeEndRow,
                  startColumnIndex: plan.dateColIndex,
                  endColumnIndex: plan.dateColIndex + 1,
                },
                cell: {
                  userEnteredFormat: {
                    numberFormat: {
                      type: 'DATE',
                      pattern: 'dd/mm/yyyy',
                    },
                  },
                },
                fields: 'userEnteredFormat.numberFormat',
              },
            },
          ],
        }),
      }
    );
    columnFormatted = fmtRes.ok;
    if (!fmtRes.ok && plan.itemsToFix.length === 0) {
      const errBody = await fmtRes.json().catch(() => ({}));
      throw new Error(`Gagal menerapkan format kolom dd/mm/yyyy: ${errBody?.error?.message || fmtRes.status}`);
    }
  } catch (err) {
    if (plan.itemsToFix.length === 0) throw err;
  }

  if (plan.needsLocaleUpdate) {
    try {
      const locRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${plan.spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                updateSpreadsheetProperties: {
                  properties: { locale: 'id_ID' },
                  fields: 'locale',
                },
              },
            ],
          }),
        }
      );
      localeUpdated = locRes.ok;
    } catch {
      // ignore optional locale error
    }
  }

  return {
    updatedCells: plan.itemsToFix.length,
    columnFormatted,
    localeUpdated,
  };
}
