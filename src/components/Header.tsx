import React from 'react';
import { KodamCenderawasihLogo, HestiWiraSaktiLogo } from './MilitaryLogos';

interface HeaderProps {
  onPrint?: () => void;
  onNewLetter?: () => void;
  isPatriotMode?: boolean;
}

export const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="sticky top-1.5 z-50 mx-2 sm:mx-3 mt-1.5 px-6 lg:px-8 py-2.5 rounded-2xl box-3d-dimmed transition-all border border-emerald-500/35 border-t-emerald-300/30 border-r-[3px] border-r-black/65 border-b-[4px] border-b-amber-500/60 bg-gradient-to-r from-[#0d2213]/90 via-[#08150b]/92 to-[#050d07]/90 backdrop-blur-xl shadow-[0_14px_35px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.18)]">
      {/* WRAPPER RELATIF: LOGO DI KIRI & KANAN ABSOLUT, SELURUH TULISAN SIMETRIS TENGAH 100% */}
      <div className="relative w-full flex items-center justify-center min-h-[106px]">
        
        {/* SISI KIRI: LOGO KODAM XVII / CENDERAWASIH 3D GLASS */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-start z-10">
          <KodamCenderawasihLogo 
            is3DGlass={true} 
            containerClassName="w-24 h-24 aspect-square"
          />
        </div>

        {/* SISI TENGAH: SELURUH TEKS SIMETRIS TENGAH PRESISI (SEJAJAR SUMBU VERTIKAL TENGAH) */}
        <div className="w-full flex flex-col items-center justify-center text-center px-32 py-0.5">
          {/* Baris 1 (BESAR): KOMANDO DAERAH MILITER XVII / CENDERAWASIH */}
          <h1 className="w-full text-center text-[26px] font-black text-yellow-300 uppercase font-mono leading-tight tracking-normal whitespace-nowrap drop-shadow-[0_2px_8px_rgba(250,204,21,0.3)]">
            KOMANDO DAERAH MILITER XVII / CENDERAWASIH
          </h1>

          {/* Baris 2: KESEHATAN */}
          <h2 className="w-full text-center text-[21px] font-extrabold text-emerald-400 uppercase font-mono leading-tight mt-1 tracking-wide whitespace-nowrap">
            KESEHATAN
          </h2>

          {/* Baris 3 (SEDANG): SISTEM INFORMASI LAYANAN KESEHATAN EVAKUASI PASIEN */}
          <h3 className="w-full text-center text-[16px] font-black text-white uppercase font-mono leading-tight mt-1.5 tracking-normal whitespace-nowrap drop-shadow">
            SISTEM INFORMASI LAYANAN KESEHATAN EVAKUASI PASIEN
          </h3>

          {/* Baris 4 (KECIL): • Data Evakuasi Medis Prajurit, ASN, dan Keluarga • */}
          <p className="w-full text-center text-[12px] text-emerald-200/80 font-semibold mt-1 tracking-normal whitespace-nowrap">
            • Data Evakuasi Medis Prajurit, ASN, dan Keluarga •
          </p>
        </div>

        {/* SISI KANAN: LOGO HESTI WIRA SAKTI 3D GLASS (BERSIH TANPA TOMBOL LIAR) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-end z-10">
          <HestiWiraSaktiLogo 
            is3DGlass={true} 
            containerClassName="w-24 h-24 aspect-square"
          />
        </div>
      </div>
    </header>
  );
};
