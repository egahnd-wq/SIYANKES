import type { EvacuationRecord } from '../types/evacuation.ts';

/**
 * Menormalkan Nomor Surat agar perbandingan tidak terpengaruh spasi, huruf besar/kecil,
 * angka nol di depan (misal 01 vs 1), atau format singkat (56/VIII/2026 vs B/56/EV/VIII/2026).
 */
export function normalizeSuratNumber(srt: string): string {
  if (!srt) return '';
  const raw = String(srt).trim().toUpperCase().replace(/\s+/g, '');
  if (!raw || raw === '-') return '';

  // Format B/<no>/EV/<romawi>/<tahun>
  const fullMatch = raw.match(/^B\/0*(\d+[A-Z]*)\/EV\/([IVXLCDM]+)\/(\d{4})$/);
  if (fullMatch) {
    return `B/${fullMatch[1]}/EV/${fullMatch[2]}/${fullMatch[3]}`;
  }

  // Format singkat <no>/<romawi>/<tahun> (dari form Buat Surat Baru)
  const shortMatch = raw.match(/^0*(\d+[A-Z]*)\/([IVXLCDM]+)\/(\d{4})$/);
  if (shortMatch) {
    return `B/${shortMatch[1]}/EV/${shortMatch[2]}/${shortMatch[3]}`;
  }

  // Format umum: hilangkan leading zero pada segmen angka pertama setelah B/
  return raw.replace(/^B\/0+(\d+)/, 'B/$1');
}

function isOfficialSharedSuratPair(a: EvacuationRecord, b: EvacuationRecord): boolean {
  const normA = normalizeSuratNumber(a.srt);
  const normB = normalizeSuratNumber(b.srt);
  if (normA !== 'B/56/EV/VIII/2026' || normB !== 'B/56/EV/VIII/2026') return false;
  const names = `${a.nama} ${b.nama}`.toLowerCase();
  return names.includes('fidelia') && names.includes('aidam');
}

/**
 * Memeriksa apakah Nomor Surat ganda terhadap daftar record yang ada.
 * Mengembalikan record yang bentrok jika ditemukan duplikat.
 */
export function findConflictingRecord(
  srt: string,
  records: EvacuationRecord[],
  excludeNo?: number
): EvacuationRecord | null {
  const target = normalizeSuratNumber(srt);
  if (!target) return null;

  const selfRecord = excludeNo !== undefined ? records.find((r) => Number(r.no) === Number(excludeNo)) : undefined;

  for (const r of records) {
    if (excludeNo !== undefined && Number(r.no) === Number(excludeNo)) {
      continue;
    }
    const current = normalizeSuratNumber(r.srt);
    if (current && current === target) {
      if (selfRecord && isOfficialSharedSuratPair(selfRecord, r)) {
        continue;
      }
      return r;
    }
  }
  return null;
}

/**
 * Mencari seluruh berkas yang memiliki Nomor Surat ganda di dalam daftar records.
 */
export function findDuplicateSuratGroups(records: EvacuationRecord[]): {
  hasDuplicates: boolean;
  duplicateSrts: string[];
  duplicateRecordNos: Set<number>;
  message: string;
} {
  const map = new Map<string, EvacuationRecord[]>();

  for (const r of records) {
    const norm = normalizeSuratNumber(r.srt);
    if (!norm) continue;
    const list = map.get(norm) || [];
    list.push(r);
    map.set(norm, list);
  }

  const duplicateSrts: string[] = [];
  const duplicateRecordNos = new Set<number>();

  for (const [norm, list] of map.entries()) {
    if (list.length > 1) {
      if (list.length === 2 && isOfficialSharedSuratPair(list[0], list[1])) {
        continue;
      }
      duplicateSrts.push(list[0].srt || norm);
      for (const item of list) {
        duplicateRecordNos.add(Number(item.no));
      }
    }
  }

  const hasDuplicates = duplicateSrts.length > 0;
  const message = hasDuplicates
    ? `Ditemukan Nomor Surat ganda (${duplicateSrts.join(', ')}). Harap perbaiki terlebih dahulu sebelum Kirim Data, Unduh, atau Cetak.`
    : '';

  return {
    hasDuplicates,
    duplicateSrts,
    duplicateRecordNos,
    message,
  };
}
