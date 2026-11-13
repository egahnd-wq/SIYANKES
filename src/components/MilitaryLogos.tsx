import React, { useState } from 'react';

export interface LogoProps {
  className?: string;
  containerClassName?: string;
  is3DGlass?: boolean;
}

export const KodamCenderawasihLogo: React.FC<LogoProps> = ({
  className = "w-full h-full object-contain",
  containerClassName = "w-14 h-14 min-[400px]:w-16 min-[400px]:h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 lg:w-24 lg:h-24 aspect-square",
  is3DGlass = true,
}) => {
  const [hasError, setHasError] = useState(false);

  const emblemSvg = (
    // High-Fidelity SVG Fallback of Kodam XVII / Cenderawasih Emblem with 3D Embossing
    <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shieldGradKodam" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="60%" stopColor="#15803d" />
          <stop offset="100%" stopColor="#052e16" />
        </linearGradient>
        <linearGradient id="goldGradKodam" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>
      {/* Shield Base */}
      <path d="M50 5 L88 20 V65 C88 90 50 115 50 115 C50 115 12 90 12 65 V20 Z" fill="url(#shieldGradKodam)" stroke="url(#goldGradKodam)" strokeWidth="4" />
      {/* Inner Shield Red-White */}
      <path d="M50 14 L80 26 V62 C80 82 50 105 50 105 C50 105 20 82 20 62 V26 Z" fill="#b91c1c" stroke="#facc15" strokeWidth="2" />
      <path d="M50 14 L80 26 V62 C80 82 50 105 50 105 V14 Z" fill="#ffffff" />
      {/* Stylized Bird of Paradise (Cenderawasih) in Gold */}
      <path d="M50 30 C58 35 68 45 66 60 C64 68 56 75 50 78 C44 75 36 68 34 60 C32 45 42 35 50 30 Z" fill="url(#goldGradKodam)" stroke="#ca8a04" strokeWidth="1.5" />
      <circle cx="50" cy="40" r="5" fill="#fef08a" />
      <path d="M50 48 L56 70 L50 85 L44 70 Z" fill="#ca8a04" />
      {/* Star on top */}
      <polygon points="50,18 52,24 58,24 53,28 55,34 50,30 45,34 47,28 42,24 48,24" fill="#facc15" />
    </svg>
  );

  const emblemImg = (
    <img
      src="/logo-kodam.png"
      alt="Logo Kodam XVII/Cenderawasih"
      referrerPolicy="no-referrer"
      onError={(e) => {
        if (!e.currentTarget.src.includes('wikimedia')) {
          e.currentTarget.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Lambang_Kodam_Cenderawasih.svg/500px-Lambang_Kodam_Cenderawasih.svg.png';
        } else {
          setHasError(true);
        }
      }}
      className={`${className} filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] transform-gpu transition-all duration-300`}
    />
  );

  const emblemContent = hasError ? emblemSvg : emblemImg;

  if (!is3DGlass) {
    return hasError ? (
      <div className={`flex items-center justify-center ${className} aspect-square`}>
        {emblemSvg}
      </div>
    ) : (
      emblemImg
    );
  }

  return (
    <div 
      className={`relative group inline-flex items-center justify-center p-1 sm:p-1.5 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br from-emerald-950/80 via-[#0e2215]/90 to-black/80 border border-emerald-500/35 border-t-emerald-300/30 border-b-2 border-b-black/80 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(16,185,129,0.28)] overflow-hidden cursor-pointer select-none shrink-0 ${containerClassName}`}
      title="Logo Kodam XVII / Cenderawasih"
    >
      {/* Specular glass reflection layer */}
      <div className="absolute inset-x-0 top-0 h-[48%] bg-gradient-to-b from-white/15 via-white/5 to-transparent rounded-t-[inherit] pointer-events-none" />
      
      {/* Dynamic emerald glass light sheen on hover */}
      <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-emerald-400/15 to-yellow-300/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Emblem Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center transform-gpu group-hover:scale-105 transition-transform duration-300">
        {emblemContent}
      </div>
    </div>
  );
};

export const HestiWiraSaktiLogo: React.FC<LogoProps> = ({
  className = "w-full h-full object-contain",
  containerClassName = "w-14 h-14 min-[400px]:w-16 min-[400px]:h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 lg:w-24 lg:h-24 aspect-square",
  is3DGlass = true,
}) => {
  const [hasError, setHasError] = useState(false);

  const emblemSvg = (
    // High-Fidelity SVG Fallback of Hesti Wira Sakti (Puskesad / Korps Kesehatan TNI AD)
    <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shieldGradHesti" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#166534" />
          <stop offset="60%" stopColor="#14532d" />
          <stop offset="100%" stopColor="#052e16" />
        </linearGradient>
        <linearGradient id="goldGradHesti" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>
      {/* Green Pentagon / Shield */}
      <polygon points="50,6 92,28 80,105 20,105 8,28" fill="url(#shieldGradHesti)" stroke="url(#goldGradHesti)" strokeWidth="3" />
      {/* Laurel Wreath */}
      <circle cx="50" cy="60" r="32" stroke="#eab308" strokeWidth="2.5" strokeDasharray="6 3" fill="none" />
      {/* Crossed Swords / Keris */}
      <line x1="30" y1="38" x2="70" y2="82" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" />
      <line x1="70" y1="38" x2="30" y2="82" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" />
      {/* Caduceus Staff & Serpent in Gold */}
      <line x1="50" y1="26" x2="50" y2="94" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
      <circle cx="50" cy="24" r="5" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
      <path d="M50 40 Q62 48 50 56 Q38 64 50 72 Q62 80 50 88" stroke="#ca8a04" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      {/* Red Cross / Star of Life motif in center */}
      <rect x="46" y="52" width="8" height="16" fill="#dc2626" rx="1" />
      <rect x="42" y="56" width="16" height="8" fill="#dc2626" rx="1" />
    </svg>
  );

  const emblemImg = (
    <img
      src="/hesti.png"
      alt="Logo Hesti Wira Sakti Kesehatan TNI AD"
      onError={(e) => {
        if (!e.currentTarget.src.includes('Hesti_wira_sakti')) {
          e.currentTarget.src = '/assets/aistudio/Hesti_wira_sakti_87fb20c2.png';
        }
      }}
      className={`${className} object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] transform-gpu transition-all duration-300`}
    />
  );

  const emblemContent = emblemImg;

  if (!is3DGlass) {
    return hasError ? (
      <div className={`flex items-center justify-center ${className} aspect-square`}>
        {emblemSvg}
      </div>
    ) : (
      emblemImg
    );
  }

  return (
    <div 
      className={`relative group inline-flex items-center justify-center p-1 sm:p-1.5 rounded-xl sm:rounded-2xl backdrop-blur-xl bg-gradient-to-br from-emerald-950/80 via-[#0e2215]/90 to-black/80 border border-emerald-500/35 border-t-emerald-300/30 border-b-2 border-b-black/80 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(16,185,129,0.28)] overflow-hidden cursor-pointer select-none shrink-0 ${containerClassName}`}
      title="Logo Kesdam Hesti Wira Sakti"
    >
      {/* Specular glass reflection layer */}
      <div className="absolute inset-x-0 top-0 h-[48%] bg-gradient-to-b from-white/15 via-white/5 to-transparent rounded-t-[inherit] pointer-events-none" />

      {/* Dynamic emerald glass light sheen on hover */}
      <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-emerald-400/15 to-yellow-300/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Emblem Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center transform-gpu group-hover:scale-105 transition-transform duration-300">
        {emblemContent}
      </div>
    </div>
  );
};
