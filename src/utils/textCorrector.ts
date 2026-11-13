// src/utils/textCorrector.ts
// Engine Koreksi Otomatis Penulisan Administrasi Medis Militer KODAM XVII / Cenderawasih

// Daftar Singkatan Pangkat Resmi TNI AD & Korps
const RANK_MAPPINGS: Record<string, string> = {
  prada: 'Prada',
  pratu: 'Pratu',
  praka: 'Praka',
  kopda: 'Kopda',
  koptu: 'Koptu',
  kopka: 'Kopka',
  serda: 'Serda',
  sertu: 'Sertu',
  serka: 'Serka',
  serma: 'Serma',
  pelda: 'Pelda',
  peltu: 'Peltu',
  letda: 'Letda',
  lettu: 'Lettu',
  kapten: 'Kapten',
  kpt: 'Kapten',
  mayor: 'Mayor',
  myr: 'Mayor',
  letkol: 'Letkol',
  kolonel: 'Kolonel',
  kol: 'Kolonel',
  brigjen: 'Brigjen',
  mayjen: 'Mayjen',
  letjen: 'Letjen',
  jenderal: 'Jenderal',
  pns: 'PNS',
  asn: 'PNS',
  pppk: 'PPPK',
};

const CORPS_MAPPINGS: Record<string, string> = {
  inf: 'Inf',
  kav: 'Kav',
  arm: 'Arm',
  armed: 'Arm',
  arh: 'Arh',
  arhanud: 'Arh',
  czi: 'Czi',
  chb: 'Chb',
  cba: 'Cba',
  cpl: 'Cpl',
  ckm: 'Ckm',
  cpm: 'Cpm',
  caj: 'Caj',
  ctp: 'Ctp',
  cku: 'Cku',
  chk: 'Chk',
  cke: 'Cke',
};

// Rumah Sakit Rujukan Standar
const HOSPITAL_MAPPINGS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b(rspad|gatot\s*soebroto)\b/i, replacement: 'RSPAD Gatot Soebroto Jakarta' },
  { pattern: /\b(pelamonia|rs\s*pelamonia|makasar|makassar)\b/i, replacement: 'RS TK II Pelamonia Makassar' },
  { pattern: /\b(marthen\s*indey|marten\s*indey|rsmi|rs\s*tk\s*ii\s*jayapura)\b/i, replacement: 'RS TK II 17.05.01 Marthen Indey' },
  { pattern: /\b(ramelan|rspal\s*dr\.?\s*ramelan|rspal)\b/i, replacement: 'RSPAL dr. Ramelan Surabaya' },
  { pattern: /\b(soepraoen|supraoen|dr\.?\s*soepraoen|malang)\b/i, replacement: 'RS TK II dr. Soepraoen Malang' },
  { pattern: /\b(esnawan|antariksa|rsau)\b/i, replacement: 'RSAU dr. Esnawan Antariksa Jakarta' },
  { pattern: /\b(wolter\s*mongosidi|monginsidi|manado)\b/i, replacement: 'RS TK II Wolter Mongosidi Manado' },
  { pattern: /\b(rumkitban\s*merauke|polkes\s*merauke)\b/i, replacement: 'Rumkitban 17.08.01 Merauke' },
  { pattern: /\b(rumkitban\s*timika|polkes\s*timika)\b/i, replacement: 'Rumkitban 17.08.01 Timika' },
  { pattern: /\b(rumkitban\s*biak|polkes\s*biak)\b/i, replacement: 'Rumkitban 17.08.03 Biak' },
];

// Istilah Medis & Diagnosa Standar
const MEDICAL_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b(susp|suspek|suspect)\.?\b/i, replacement: 'Susp.' },
  { pattern: /\bpost\s*op(erasi)?\b/i, replacement: 'Post Op' },
  { pattern: /\b(ca|cancer|kanker)\.?\b/i, replacement: 'Ca.' },
  { pattern: /\b(tbc|tb\s*paru|tuberculosis)\b/i, replacement: 'TB Paru' },
  { pattern: /\b(dm\s*type\s*2|dm\s*tipe\s*2|diabetes\s*tipe\s*2)\b/i, replacement: 'DM Type 2' },
  { pattern: /\b(dm|diabetes\s*melitus)\b/i, replacement: 'Diabetes Melitus' },
  { pattern: /\b(fractur|fraktur)\b/i, replacement: 'Fractur' },
  { pattern: /\b(dextra|dekstra|\(d\)|dxt)\b/i, replacement: 'Dextra' },
  { pattern: /\b(sinistra|\(s\)|sin)\b/i, replacement: 'Sinistra' },
  { pattern: /\b(appendicitis|apendisitis|appendisitis)\b/i, replacement: 'Appendicitis' },
  { pattern: /\b(kll|kecelakaan\s*lalu\s*lintas)\b/i, replacement: 'KLL' },
  { pattern: /\b(cva|stroke)\b/i, replacement: 'CVA' },
  { pattern: /\bacl\b/i, replacement: 'ACL' },
  { pattern: /\bhnp\b/i, replacement: 'HNP' },
  { pattern: /\bami\b/i, replacement: 'AMI (Acute Myocardial Infarction)' },
  { pattern: /\badhd\b/i, replacement: 'ADHD' },
  { pattern: /\basd\b/i, replacement: 'ASD' },
  { pattern: /\bscc\b/i, replacement: 'SCC' },
  { pattern: /\bcad\b/i, replacement: 'CAD' },
  { pattern: /\bcto\b/i, replacement: 'CTO' },
  { pattern: /\brca\b/i, replacement: 'RCA' },
  { pattern: /\bods\b/i, replacement: 'ODS' },
  { pattern: /\bod\b/i, replacement: 'OD' },
  { pattern: /\bos\b/i, replacement: 'OS' },
  { pattern: /\bbpi\b/i, replacement: 'BPI' },
];

/**
 * Format string ke Title Case dengan penanganan gelar dan singkatan
 */
function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/(?:^|\s|-|\/|\.)\S/g, (match) => match.toUpperCase());
}

/**
 * Koreksi Nama Pasien
 * Menangani Ny., An., Tn., Sdr., gelar akademik (S.Kom, S.Sos, M.H, dsb.)
 */
export function correctNama(nama: string): string {
  if (!nama || !nama.trim()) return '';
  let cleaned = nama.trim().replace(/\s+/g, ' ');

  // Perbaiki prefix keluarga/panggilan
  cleaned = cleaned.replace(/^ny\.?\s*/i, 'Ny. ');
  cleaned = cleaned.replace(/^an\.?\s*/i, 'An. ');
  cleaned = cleaned.replace(/^tn\.?\s*/i, 'Tn. ');
  cleaned = cleaned.replace(/^sdr\.?\s*/i, 'Sdr. ');

  // Standardize Title Case untuk kata-kata utama
  const words = cleaned.split(' ');
  const correctedWords = words.map((w, idx) => {
    // Biarkan singkatan khusus
    const lower = w.toLowerCase().replace(/[,.]/g, '');
    if (['ny', 'an', 'tn', 'sdr'].includes(lower) && idx === 0) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }
    // Gelar akademik
    if (lower === 'skom' || lower === 's.kom') return 'S.Kom.';
    if (lower === 'ssos' || lower === 's.sos') return 'S.Sos.';
    if (lower === 'sh' || lower === 's.h') return 'S.H.';
    if (lower === 'mh' || lower === 'm.h') return 'M.H.';
    if (lower === 'se' || lower === 's.e') return 'S.E.';
    if (lower === 'strhan' || lower === 's.tr.(han)' || lower === 's.tr.han') return 'S.Tr. (Han)';
    if (lower === 'dr' || lower === 'dr.') return 'dr.';
    if (lower === 'drg' || lower === 'drg.') return 'drg.';

    // Huruf kapital awal untuk kata biasa
    return w.charAt(0).toUpperCase() + w.slice(1);
  });

  return correctedWords.join(' ');
}

/**
 * Koreksi Pangkat, Korps, NRP, atau Hubungan Keluarga (Identitas)
 * Contoh: "serda/12345" -> "Serda/12345", "i/d pratu asis" -> "I/d Pratu Asis", "kapten ckm (k)/2199..." -> "Kapten Ckm (K)/2199..."
 */
export function correctIdentitas(identitas: string): string {
  if (!identitas || !identitas.trim()) return '';
  let str = identitas.trim().replace(/\s+/g, ' ');

  // Hubungan keluarga
  str = str.replace(/^(i\/d|istri\s*dari)\s*/i, 'I/d ');
  str = str.replace(/^(a\/d|anak\s*dari)\s*/i, 'A/d ');
  str = str.replace(/^(s\/d|suami\s*dari)\s*/i, 'S/d ');

  // Standardisasi pangkat di awal atau setelah relasi
  for (const [rankKey, rankValue] of Object.entries(RANK_MAPPINGS)) {
    const regRank = new RegExp(`\\b${rankKey}\\b`, 'gi');
    str = str.replace(regRank, rankValue);
  }

  // Standardisasi korps
  for (const [corpsKey, corpsValue] of Object.entries(CORPS_MAPPINGS)) {
    const regCorps = new RegExp(`\\b${corpsKey}\\b`, 'gi');
    str = str.replace(regCorps, corpsValue);
  }

  // Korps Wanita AD (K)
  str = str.replace(/\(\s*k\s*\)/gi, '(K)');

  // Format NRP atau NIP
  str = str.replace(/\bnr\s*p\b/gi, 'NRP');
  str = str.replace(/\bni\s*p\b/gi, 'NIP');

  // Bersihkan spasi di sekitar tanda slash: "Serda / 123" -> "Serda/123"
  str = str.replace(/\s*\/\s*/g, '/');

  // Khusus Golongan PNS/PPPK
  str = str.replace(/\bgol\s*([ivx]+)\/?([a-e])?/gi, (_, rom, sub) => {
    return `Gol ${rom.toUpperCase()}${sub ? '/' + sub.toLowerCase() : ''}`;
  });

  return str;
}

/**
 * Koreksi Penulisan Kesatuan Militer
 */
export function correctKesatuan(kesatuan: string): string {
  if (!kesatuan || !kesatuan.trim()) return '';
  let str = kesatuan.trim().replace(/\s+/g, ' ');

  // Format Kodam XVII / Cenderawasih
  str = str.replace(/\bkodam\s*(xvii|17)?(\s*[\/\-]\s*)?(cenderawasih)?\b/gi, 'Kodam XVII/Cenderawasih');
  str = str.replace(/\bkesdam\s*(xvii|17)?(\s*[\/\-]\s*)?(cenderawasih)?\b/gi, 'Kesdam XVII/Cenderawasih');
  str = str.replace(/\bpomdam\s*(xvii|17)?(\s*[\/\-]\s*)?(cenderawasih)?\b/gi, 'Pomdam XVII/Cenderawasih');
  str = str.replace(/\bhubdam\s*(xvii|17)?(\s*[\/\-]\s*)?(cenderawasih)?\b/gi, 'Hubdam XVII/Cenderawasih');
  str = str.replace(/\bkomlekdam\s*(xvii|17)?(\s*[\/\-]\s*)?(cenderawasih)?\b/gi, 'Komlekdam XVII/Cenderawasih');
  str = str.replace(/\bbekangdam\s*(xvii|17)?(\s*[\/\-]\s*)?(cenderawasih)?\b/gi, 'Bekangdam XVII/Cenderawasih');
  str = str.replace(/\bpaldam\s*(xvii|17)?(\s*[\/\-]\s*)?(cenderawasih)?\b/gi, 'Paldam XVII/Cenderawasih');
  str = str.replace(/\bjasdam\s*(xvii|17)?(\s*[\/\-]\s*)?(cenderawasih)?\b/gi, 'Jasdam XVII/Cenderawasih');
  str = str.replace(/\bitdam\s*(xvii|17)?(\s*[\/\-]\s*)?(cenderawasih)?\b/gi, 'Itdam XVII/Cenderawasih');
  str = str.replace(/\bsetumdam\s*(xvii|17)?(\s*[\/\-]\s*)?(cenderawasih)?\b/gi, 'Setumdam XVII/Cenderawasih');
  str = str.replace(/\bdenmadam\s*(xvii|17)?(\s*[\/\-]\s*)?(cenderawasih)?\b/gi, 'Denmadam XVII/Cenderawasih');

  // Yonif / Korem / Kodim
  str = str.replace(/\byonif\b/gi, 'Yonif');
  str = str.replace(/\bkorem\b/gi, 'Korem');
  str = str.replace(/\bkodim\b/gi, 'Kodim');
  str = str.replace(/\bdenkesyah\b/gi, 'Denkesyah');
  str = str.replace(/\bbrigif\b/gi, 'Brigif');
  str = str.replace(/\bdenkav\b/gi, 'Denkav');
  str = str.replace(/\bdenzipur\b/gi, 'Denzipur');
  str = str.replace(/\bsatgas\b/gi, 'Satgas');
  str = str.replace(/\brumkitban\b/gi, 'Rumkitban');

  return str;
}

/**
 * Koreksi Diagnosa Medis & Singkatan Klinis
 */
export function correctDiagnosa(diagnosa: string): string {
  if (!diagnosa || !diagnosa.trim()) return '';
  let str = diagnosa.trim().replace(/\s+/g, ' ');

  // Ganti istilah dan singkatan umum
  for (const item of MEDICAL_REPLACEMENTS) {
    str = str.replace(item.pattern, item.replacement);
  }

  // Kapitalisasi huruf pertama
  if (str.length > 0) {
    str = str.charAt(0).toUpperCase() + str.slice(1);
  }

  return str;
}

/**
 * Koreksi Rumah Sakit / Faskes Rujukan
 */
export function correctHospital(hospital: string): string {
  if (!hospital || !hospital.trim()) return '';
  const trimmed = hospital.trim().replace(/\s+/g, ' ');

  for (const item of HOSPITAL_MAPPINGS) {
    if (item.pattern.test(trimmed)) {
      return item.replacement;
    }
  }

  return trimmed;
}

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/**
 * Koreksi & Standardisasi Nomor Surat Dinas Evakuasi -> B/<NN>/EV/<BULAN_ROMAWI>/<TAHUN>
 * Contoh:
 * - "b/1/ev/i/2026" -> "B/01/EV/I/2026"
 * - "B/74/EV/2026" (tgl 12/10/2026) -> "B/74/EV/X/2026"
 * - "88/XI/2026" -> "B/88/EV/XI/2026"
 */
export function correctNomorSurat(srt: string, tgl?: string): string {
  if (!srt || !srt.trim()) return '';
  const trimmed = srt.trim();
  if (trimmed === '-') return '-';

  // Pisahkan catatan opsional seperti BATAL / RALAT agar nomor suratnya saja yang diformat
  const lines = trimmed.split('\n').map((s) => s.trim()).filter(Boolean);
  let core = (lines[0] || '').toUpperCase().replace(/\s+/g, ' ');
  let extraNote = lines.slice(1).join('\n');

  const kwMatch = core.match(/\s+(BATAL.*|RALAT.*|DIBATALKAN.*|DIRALAT.*)$/i);
  if (kwMatch && kwMatch.index !== undefined && kwMatch.index > 0) {
    extraNote = extraNote ? `${kwMatch[1]} ${extraNote}` : kwMatch[1];
    core = core.substring(0, kwMatch.index).trim();
  }

  const compact = core.replace(/\s+/g, '');

  // Tentukan bulan Romawi dari tanggal (DD/MM/YYYY) jika tersedia
  let romanFromDate = '';
  if (tgl) {
    const normTgl = correctTanggal(tgl);
    const dMatch = normTgl.match(/^\d{2}\/(\d{2})\/\d{4}$/);
    if (dMatch) {
      const mIdx = parseInt(dMatch[1], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        romanFromDate = ROMAN_MONTHS[mIdx];
      }
    }
  }

  let formatted = core;

  // 1. Sudah lengkap: B/<num>/EV/<romawi>/<tahun>
  const fullMatch = compact.match(/^(?:B\/)?0*(\d+)([A-Z]*)\/EV\/([IVXLCDM]+)\/(\d{4})$/i);
  // 2. Tanpa /EV/: <num>/<romawi>/<tahun> atau B/<num>/<romawi>/<tahun> (misal 88/XI/2026)
  const shortRomanMatch = compact.match(/^(?:B\/)?0*(\d+)([A-Z]*)\/([IVXLCDM]+)\/(\d{4})$/i);
  // 3. Tanpa bulan Romawi: B/<num>/EV/<tahun> (misal B/74/EV/2026)
  const noRomanMatch = compact.match(/^(?:B\/)?0*(\d+)([A-Z]*)\/EV\/(\d{4})$/i);
  // 4. Minimal: B/<num>/<tahun> atau <num>/<tahun>
  const minimalMatch = compact.match(/^(?:B\/)?0*(\d+)([A-Z]*)\/(\d{4})$/i);

  if (fullMatch) {
    const num = fullMatch[1].padStart(2, '0');
    formatted = `B/${num}${fullMatch[2]}/EV/${fullMatch[3].toUpperCase()}/${fullMatch[4]}`;
  } else if (shortRomanMatch) {
    const num = shortRomanMatch[1].padStart(2, '0');
    formatted = `B/${num}${shortRomanMatch[2]}/EV/${shortRomanMatch[3].toUpperCase()}/${shortRomanMatch[4]}`;
  } else if (noRomanMatch) {
    const num = noRomanMatch[1].padStart(2, '0');
    formatted = romanFromDate
      ? `B/${num}${noRomanMatch[2]}/EV/${romanFromDate}/${noRomanMatch[3]}`
      : `B/${num}${noRomanMatch[2]}/EV/${noRomanMatch[3]}`;
  } else if (minimalMatch && romanFromDate) {
    const num = minimalMatch[1].padStart(2, '0');
    formatted = `B/${num}${minimalMatch[2]}/EV/${romanFromDate}/${minimalMatch[3]}`;
  } else {
    // Biarkan teks khusus seperti "Srt Evak RS.DUSTIRA" tetap utuh
    formatted = trimmed.split('\n')[0].trim();
  }

  if (extraNote) {
    return lines.length > 1 ? `${formatted}\n${extraNote}` : `${formatted} ${extraNote}`;
  }
  return formatted;
}

const MONTH_NAME_MAP: Record<string, number> = {
  jan: 1,
  januari: 1,
  january: 1,
  feb: 2,
  februari: 2,
  february: 2,
  peb: 2,
  pebruari: 2,
  mar: 3,
  maret: 3,
  march: 3,
  apr: 4,
  april: 4,
  mei: 5,
  may: 5,
  jun: 6,
  juni: 6,
  june: 6,
  jul: 7,
  juli: 7,
  july: 7,
  agu: 8,
  agt: 8,
  agustus: 8,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  okt: 10,
  oktober: 10,
  oct: 10,
  october: 10,
  nov: 11,
  nop: 11,
  november: 11,
  des: 12,
  desember: 12,
  dec: 12,
  december: 12,
};

function formatDmy(day: number, month: number, year: number): string | null {
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const fullYear = year < 100 ? 2000 + year : year;
  if (fullYear < 1900 || fullYear > 2100) return null;
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${fullYear}`;
}

/**
 * Koreksi & Normalisasi Otomatis Format Tanggal Spreadsheet -> DD/MM/YYYY
 * Mendukung: DD/MM/YYYY, D/M/YY, YYYY-MM-DD, ISO timestamps, MM/DD/YYYY (US),
 * nama bulan Indonesia/Inggris (13 Nov 2026 / 13 Agustus 2026), tanda titik, dan serial Excel/Sheets.
 */
export function correctTanggal(tgl: string): string {
  if (!tgl) return '';
  let clean = String(tgl).trim().replace(/^'+/, '').replace(/\s+/g, ' ');
  if (!clean) return '';
  if (clean === '-') return '-';

  // Strip prefix nama hari (misal: "Jumat, 13 November 2026")
  clean = clean.replace(
    /^(senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*,?\s*/i,
    ''
  ).trim();

  // Tangani serial angka tanggal Google Sheets / Excel (misal: 46339)
  if (/^\d{5}(\.\d+)?$/.test(clean)) {
    const serial = parseFloat(clean);
    if (serial >= 30000 && serial <= 65000) {
      const utcMs = Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000;
      const dt = new Date(utcMs);
      const formatted = formatDmy(dt.getUTCDate(), dt.getUTCMonth() + 1, dt.getUTCFullYear());
      if (formatted) return formatted;
    }
  }

  // Hilangkan bagian jam/timestamp di belakang tanggal (ISO "T..." atau " HH:MM(:SS)")
  clean = clean
    .replace(/T\d{1,2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/i, '')
    .replace(/\s+\d{1,2}[:.]\d{2}([:.]\d{2})?(\s*(WIB|WITA|WIT|AM|PM))?$/i, '')
    .trim();

  // 1. Format ISO / Tahun di depan: YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
  const isoMatch = clean.match(/^(\d{4})[\/\-\.\s]+(\d{1,2})[\/\-\.\s]+(\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    let month = parseInt(isoMatch[2], 10);
    let day = parseInt(isoMatch[3], 10);
    if (month > 12 && day <= 12) {
      [day, month] = [month, day];
    }
    const formatted = formatDmy(day, month, year);
    if (formatted) return formatted;
  }

  // 2. Format nama bulan Indonesia/Inggris: "13 Nov 2026", "13-Agustus-2026", "13 Nov 26"
  const dmyTextMatch = clean.match(/^(\d{1,2})[\s\/\-\.,]+([a-zA-Z]{3,12})\.?[\s\/\-\.,]+(\d{2,4})$/);
  if (dmyTextMatch) {
    const day = parseInt(dmyTextMatch[1], 10);
    const month = MONTH_NAME_MAP[dmyTextMatch[2].toLowerCase()];
    const year = parseInt(dmyTextMatch[3], 10);
    if (month) {
      const formatted = formatDmy(day, month, year);
      if (formatted) return formatted;
    }
  }

  // 3. Format nama bulan di depan (US): "Nov 13, 2026"
  const mdyTextMatch = clean.match(/^([a-zA-Z]{3,12})\.?[\s\/\-\.,]+(\d{1,2})[\s\/\-\.,]+(\d{2,4})$/);
  if (mdyTextMatch) {
    const month = MONTH_NAME_MAP[mdyTextMatch[1].toLowerCase()];
    const day = parseInt(mdyTextMatch[2], 10);
    const year = parseInt(mdyTextMatch[3], 10);
    if (month) {
      const formatted = formatDmy(day, month, year);
      if (formatted) return formatted;
    }
  }

  // 4. Format angka 3 bagian: DD/MM/YYYY, D/M/YY, DD-MM-YYYY, DD.MM.YYYY, atau MM/DD/YYYY
  const numericMatch = clean.match(/^(\d{1,2})[\/\-\.\s]+(\d{1,2})[\/\-\.\s]+(\d{2,4})$/);
  if (numericMatch) {
    let day = parseInt(numericMatch[1], 10);
    let month = parseInt(numericMatch[2], 10);
    const year = parseInt(numericMatch[3], 10);

    // Jika bulan > 12 dan hari <= 12 (format US MM/DD/YYYY dari Google Sheets), tukar otomatis
    if (month > 12 && day >= 1 && day <= 12) {
      [day, month] = [month, day];
    }

    const formatted = formatDmy(day, month, year);
    if (formatted) return formatted;
  }

  return clean;
}

export interface CorrectionResult {
  hasChanges: boolean;
  changeCount: number;
  changesSummary: string[];
}

/**
 * Jalankan Pemeriksaan & Koreksi Lengkap pada 1 Data Pasien
 */
export function autoCorrectRecordData(data: {
  nama: string;
  identitas: string;
  kesatuan: string;
  diag: string;
  asal: string;
  tujuan: string;
  moda: string;
  pendamping: string;
  ket: string;
  srt?: string;
  tgl?: string;
}) {
  const correctedNama = correctNama(data.nama);
  const correctedIdentitas = correctIdentitas(data.identitas);
  const correctedKesatuan = correctKesatuan(data.kesatuan);
  const correctedDiag = correctDiagnosa(data.diag);
  const correctedAsal = correctHospital(data.asal);
  const correctedTujuan = correctHospital(data.tujuan);
  const correctedTgl = data.tgl ? correctTanggal(data.tgl) : undefined;
  const correctedSrt = data.srt ? correctNomorSurat(data.srt, correctedTgl || data.tgl) : undefined;

  const changes: string[] = [];

  if (correctedNama !== data.nama) changes.push(`Nama: "${data.nama}" → "${correctedNama}"`);
  if (correctedIdentitas !== data.identitas) changes.push(`Identitas: "${data.identitas}" → "${correctedIdentitas}"`);
  if (correctedKesatuan !== data.kesatuan) changes.push(`Kesatuan: "${data.kesatuan}" → "${correctedKesatuan}"`);
  if (correctedDiag !== data.diag) changes.push(`Diagnosa: "${data.diag}" → "${correctedDiag}"`);
  if (correctedAsal !== data.asal) changes.push(`Faskes Asal: "${data.asal}" → "${correctedAsal}"`);
  if (correctedTujuan !== data.tujuan) changes.push(`Faskes Tujuan: "${data.tujuan}" → "${correctedTujuan}"`);
  if (correctedSrt && correctedSrt !== data.srt) changes.push(`No Surat: "${data.srt}" → "${correctedSrt}"`);
  if (correctedTgl && correctedTgl !== data.tgl) changes.push(`Tanggal: "${data.tgl}" → "${correctedTgl}"`);

  return {
    values: {
      nama: correctedNama,
      identitas: correctedIdentitas,
      kesatuan: correctedKesatuan,
      diag: correctedDiag,
      asal: correctedAsal,
      tujuan: correctedTujuan,
      srt: correctedSrt !== undefined ? correctedSrt : (data.srt || ''),
      tgl: correctedTgl !== undefined ? correctedTgl : (data.tgl || ''),
      moda: data.moda,
      pendamping: data.pendamping,
      ket: data.ket,
    },
    hasChanges: changes.length > 0,
    changeCount: changes.length,
    changesSummary: changes,
  };
}
