declare const __BUILD_TIMESTAMP__: string | number | undefined;
declare const __APP_VERSION__: string | undefined;

export const APP_VERSION = '2.8.2';
export const APP_BUILD_DATE = 'November 2026';
export const APP_BUILD_TIMESTAMP = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? Number(__BUILD_TIMESTAMP__) : 1794400000000;
export const APP_EDITION = 'auto update';

export interface VersionChangeLog {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

export const VERSION_HISTORY: VersionChangeLog[] = [
  {
    version: '2.8.0',
    date: 'November 2026',
    title: 'Sinkronisasi Penuh Pasca-Republish di Semua Browser & Mode Perangkat (PC, Mobile, Tablet)',
    highlights: [
      'Pembaruan Otomatis Pasca-Republish: Deteksi versi server real-time dan pembersihan cache otomatis pada seluruh browser (Chrome, Safari, Edge, Firefox, Samsung Internet) di PC, Mobile, dan Tablet.',
      'Penambahan Box Periode Evakuasi di bawah Kolom Analisis pada Menu Utama (TAHUN 2024: 3 PASIEN, TAHUN 2025: 13 PASIEN, TAHUN 2026: 89 PASIEN) yang otomatis bertambah jika ada tahun baru.',
      'Optimalisasi keterbacaan teks Visi Kesehatan TNI AD di bawah Brevet dengan kontras tinggi dan tipografi tegas di semua ukuran layar.',
      'Penyelarasan penuh 105 berkas pasien evakuasi (79 Militer, 11 Persit, 9 Anak, 6 ASN/PPPK) secara identik di seluruh perangkat.',
    ],
  },
  {
    version: '2.6.7',
    date: 'November 2026',
    title: 'Peningkatan Sinkronisasi Real-Time & Stabilitas Backend Spreadsheet',
    highlights: [
      'Penyempurnaan mekanisme pengiriman data ke Spreadsheet tanpa NetworkError (menggunakan mode no-cors & URLSearchParams).',
      'Penambahan fitur "Hapus Data Lokal & Reload" untuk memastikan sinkronisasi yang bersih antara Dashboard dan Spreadsheet.',
      'Perbaikan integrasi formulir evakuasi lokal dengan sistem backend.',
    ],
  },
  {
    version: '2.6.2',
    date: 'November 2026',
    title: 'Sinkronisasi Real-Time Spreadsheet Master CEN & Pembaruan Pasien No. 84, 85, 86',
    highlights: [
      'Penyelarasan Master Dataset Real-Time: Seluruh 86 berkas pasien dari spreadsheet dinas KESDAM XVII/CEN (CEN_f261a44e) kini tersinkronisasi 100% di semua media (Smartphone, Tablet, PC).',
      'Pembaruan Pasien No. 84 & 85: Pendaftaran resmi Letkol Inf Nasser Khaled (Daninteldam) dan Letkol Inf Bayu Setya Yogasara, S.Hub.Int (Danyonif TP 814/JZA) berstatus BEROBAT di RSPAD Gatot Soebroto.',
      'Integrasi Pasien No. 86: Penambahan Serda Gilberth Sawaki (Siswa Pusdikjas / Jasdam) rujukan RS TK II DUSTIRA BANDUNG menuju RSPAD Gatot Soebroto dengan moda Kereta Api.',
      'Dukungan Moda Kereta Api & Faskes Dustira: Penambahan badge taktis Kereta Api (Train) dan faskes asal RS TK II DUSTIRA BANDUNG pada filter, tabel, dan formulir registrasi.',
      'Standarisasi Keterangan Medis (BEROBAT / SEMBUH/KEMBALI): 9 pasien dinyatakan Sembuh/Kembali ke Kesatuan dan 77 pasien berstatus Berobat Aktif secara presisi.',
    ],
  },
  {
    version: '2.6.0',
    date: 'Maret 2026',
    title: 'Sinkronisasi Data Real-Time Multi-Media (Smartphone, Tablet, PC) & Filter Cepat Box Militer/Kategori',
    highlights: [
      'Filter Cepat Sekali Sentuh: Menekan Box Militer, Persit, Anak, PNS/PPPK, Sembuh, atau Batal/Ralat langsung menyaring tabel secara eksklusif dan otomatis menggulir (auto-scroll) tepat ke daftar pasien terkait.',
      'Badge Status Filter Aktif: Penanda visual interaktif di atas tabel menampilkan kategori aktif beserta tombol satu-klik "Hapus Filter & Tampilkan Semua Pasien".',
      'Arsitektur Sinkronisasi Terpusat Real-Time: Perubahan data, penambahan surat evakuasi, checklist sembuh, maupun sinkronisasi spreadsheet di smartphone langsung terupdate secara instan di komputer/tablet, dan sebaliknya.',
      'Sinkronisasi Background Otomatis: Pemeriksaan berkala dan deteksi fokus layar (visibility change) menjamin pengguna selalu melihat data paling mutakhir di semua media tanpa perlu refresh manual.',
    ],
  },
  {
    version: '2.5.6',
    date: 'Maret 2026',
    title: 'Pembaruan Real-Time Status Sembuh/Kembali ke Kesatuan di Smartphone & Deteksi Multi-Format Medis',
    highlights: [
      'Sinkronisasi Jumlah Sembuh / Kembali ke Kesatuan pada Smartphone: Algoritma pendeteksian kesembuhan diperluas untuk mengenali seluruh frasa medis militer (Ps sdh sembuh, Batal Evak, Selesai Rawat, Kembali ke Satuan) secara universal.',
      'Tombol Aksi Cepat Sembuh Khusus Layar Smartphone: Pasien pada tampilan ponsel kini memiliki tombol centang status sembuh langsung di bawah nama/kesatuan tanpa harus menggeser tabel ke samping.',
      'Jaminan Pemulihan Data & Status Sembuh Lokal: Sinkronisasi data lokal smartphone secara cerdas mempertahankan status kesembuhan yang telah diverifikasi dan mencegah reset ke status rawat saat pembaruan rilis.',
      'Penyelarasan Nilai Indikator KPI & Kartu Status Berobat Pasien: Angka Sembuh/Kembali di kartu KPI atas dan kelompok status berobat sinkron 100% di semua perangkat desktop dan ponsel.',
    ],
  },
  {
    version: '2.5.5',
    date: 'Maret 2026',
    title: 'Optimalisasi Sinkronisasi Total Pasien (84 Berkas) & Pemulihan Cache Smartphone',
    highlights: [
      'Pembaruan otomatis data master pada smartphone: sistem secara instan mendeteksi jika data lokal di memori peramban ponsel kurang dari 84 berkas dan langsung memulihkan seluruh data pasien secara lengkap.',
      'Penyelarasan seluruh berkas aset CSV sistem ke 84 berkas (termasuk pendaftaran berkas pasien nomor 82, 83, dan 84 terkini).',
      'Pencegahan pemotongan data: penggabungan data lokal (mergeWithLocalEdits) menjamin dataset tidak pernah berkurang di bawah 84 berkas master.',
      'Penyegaran otomatis LocalStorage smartphone saat republish sehingga angka kartu Total, Militer, Persit, Anak, dan PNS selalu akurat dan terverifikasi.',
    ],
  },
  {
    version: '2.5.4',
    date: 'Maret 2026',
    title: 'Pembaruan Logo 3D Glass Kodam & Hesti serta Restrukturisasi Judul Status Berobat Pasien',
    highlights: [
      'Logo Kodam XVII/Cenderawasih dan Kesdam Hesti Wira Sakti tampil dengan gaya 3D Glass mewah: kapsul akrilik kristal transparan, lengkungan pantulan cahaya specular (glossy reflection arc), rim lighting, bevel batas 3D, dan bayangan relief multi-layer.',
      'Efek interaktif pada hover logo: pembesaran proporsional, elevasi 3D, serta pancaran bias cahaya zamrud dinamis.',
      'Penyelarasan judul: "Kelompok Lama Berobat & Status Pemulihan Pasien" resmi diganti menjadi "Status Berobat Pasien" yang lebih padat, lugas, dan taktis.',
      'Pembaruan teks panduan di Modal Status Pasien agar sinkron merujuk pada "Status Berobat Pasien".',
      'Tetap mempertahankan integritas cetak kop surat resmi (DetailModal & Cetak Rekap) dalam mode presisi dokumen fisik tanpa gangguan bayangan.',
    ],
  },
  {
    version: '2.5.3',
    date: 'Maret 2026',
    title: 'Pembaruan Otomatis Link Terpublikasi (Auto-Update on Republish) & Deteksi Rilis Real-Time',
    highlights: [
      'Deteksi otomatis rilis saat Republish: pengunjung pada link terpublikasi langsung mendapatkan versi paling mutakhir.',
      'Sistem anti-cache HTTP pada index.html dan penamaan aset chunk ter-hash untuk mencegah browser menyajikan file lawas.',
      'Auto-Updater Real-Time: memeriksa ketersediaan versi server saat tab dibuka, difokuskan, dan secara berkala setiap 30 detik.',
      'Banner Notifikasi Taktis Pembaruan Rilis: hitung mundur otomatis 5 detik dengan tombol interaktif "Perbarui Sekarang (Reload)".',
      'Pembersihan cache otomatis (Cache API & Service Worker) saat rilis baru diterapkan agar antarmuka ter-render segar 100%.',
      'Sinkronisasi cerdas LocalStorage: mempertahankan input berkas pasien baru tanpa tertinggal pembaruan kode sistem.',
      'Tombol manual "Periksa Pembaruan Sistem" pada SubNavbar dan Modal Versi untuk verifikasi instan kapan saja.',
    ],
  },
  {
    version: '2.5.2',
    date: 'Maret 2026',
    title: 'Penambahan Fitur Status Sembuh / Kembali ke Kesatuan & Pembaruan Kelompok Lama Berobat',
    highlights: [
      'Checkbox interaktif di setiap baris tabel register untuk menyatakan pasien sudah sembuh / kembali ke kesatuan secara instan.',
      'Form kontrol status pemulihan di Modal Edit Status Pasien lengkap dengan tanggal sembuh dan catatan tugas kembali.',
      'Pembaruan reaktif pada "Kelompok Lama Berobat": penambahan kategori "Sembuh / Kembali ke Kesatuan" di samping kelompok 1-3, 4-6, 6-9, dan 9-12+ Bulan.',
      'Pasien yang telah dinyatakan sembuh otomatis dipindahkan dari kelompok berobat aktif ke kelompok sembuh.',
      'Kartu KPI ringkasan dan filter cepat "Sembuh / Kembali" untuk melihat daftar pasien yang telah pulih.',
      'Sertifikat & cap status resmi "TELAH SEMBUH / KEMBALI KE KESATUAN" pada pratinjau lembar berkas surat (DetailModal).',
    ],
  },
  {
    version: '2.5.1',
    date: 'Maret 2026',
    title: 'Uji Kelayakan Sistem & Optimalisasi Stabilitas Komprehensif',
    highlights: [
      'Pemulihan dan pengaktifan tombol "Cetak Rekap" serta "Ekspor CSV" di Sub-Navbar.',
      'Pencegahan kehilangan data lokal: sinkronisasi spreadsheet kini mempertahankan pendaftaran pasien baru.',
      'Perbaikan modal pratinjau surat (DetailModal) dengan lembar kertas surat dinas putih ber-KOP resmi.',
      'Optimalisasi tampilan 1 kolom data pasien: penulisan Pangkat/NRP pendamping (suami/istri) dan kesatuan yang presisi.',
      'Dukungan pagination dinamis untuk seluruh jumlah berkas tanpa batasan kaku.',
      'Kalibrasi 12 bulan kalender dan penanganan tanggal lintas peramban pada grafik & lama berobat.',
      'Isolasi gaya cetak (@media print) agar latar belakang loreng tidak mencemari cetakan dokumen.',
    ],
  },
  {
    version: '2.5.0',
    date: 'Maret 2026',
    title: 'Pembaruan Tampilan Taktis & Format Pasien Komprehensif',
    highlights: [
      'Format data pasien menjadi 1 kolom vertikal rapi (Nama & Kategori, Pangkat/NRP Pendamping Suami/Istri, dan Kesatuan).',
      'Latar belakang autentik Loreng Malvinas Gelap khas TNI AD dengan efek ripstop mikro dan pencahayaan taktis.',
      'Penyelarasan judul simetris terpusat dengan logo Kodam XVII/Cenderawasih dan Kesdam Hesti Wira Sakti.',
      'Sistem sinkronisasi real-time spreadsheet dan filter cerdas.',
    ],
  },
  {
    version: '2.4.0',
    date: 'Februari 2026',
    title: 'Integrasi Data Real-Time & Manajemen Status Evakuasi',
    highlights: [
      'Sinkronisasi otomatis dengan Google Spreadsheet live link.',
      'Koreksi otomatis ejaan pangkat, kesatuan, dan diagnosa medis militer.',
      'Ekspor cetak surat perintah jalan / evakuasi resmi.',
    ],
  },
];
