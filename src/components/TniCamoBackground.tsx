import React from 'react';
import { WallpaperConfig } from './WallpaperModal';

interface TniCamoBackgroundProps {
  isPatriotMode?: boolean;
  config?: WallpaperConfig;
}

export const TniCamoBackground: React.FC<TniCamoBackgroundProps> = ({ 
  config = {
    preset: 'custom-url',
    customUrl: '/assets/wallpaper/natural_f30129.jpg',
    camoOpacity: 80,
    dimmerOpacity: 75,
    blurAmount: 10,
    glassTransparency: 25,
  }
}) => {
  const camoOpacityDecimal = (config.camoOpacity ?? 80) / 100;
  const dimmerOpacityDecimal = Math.min(0.95, Math.max(0, (config.dimmerOpacity ?? 75) / 100));

  // Custom Image Wallpaper with Tactical Dark Dimmer & Vignette
  if (config.preset === 'custom-url' && config.customUrl) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden no-print bg-black" aria-hidden="true">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
          style={{
            backgroundImage: `url(${config.customUrl})`,
            opacity: camoOpacityDecimal,
          }}
        />
        {dimmerOpacityDecimal > 0 && (
          <div 
            className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
            style={{ opacity: dimmerOpacityDecimal }}
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.6) 100%)',
          }}
        />
      </div>
    );
  }

  // Pre-configured Dark Military Presets
  let baseBgColor = '#09150c';
  let patternTone1 = '#162519';
  let patternTone2 = '#3b2b1d';
  let patternTone3 = '#3b4728';
  let patternTone4 = '#0d170f';

  if (config.preset === 'camo-nkri') {
    baseBgColor = '#0b180e';
    patternTone1 = '#1e3523';
    patternTone2 = '#4a3d27';
    patternTone3 = '#2d4732';
    patternTone4 = '#101d13';
  } else if (config.preset === 'dark-tactical') {
    baseBgColor = '#080c09';
    patternTone1 = '#141a16';
    patternTone2 = '#1f2822';
    patternTone3 = '#2a342d';
    patternTone4 = '#0a0f0c';
  } else if (config.preset === 'deep-emerald') {
    baseBgColor = '#04140d';
    patternTone1 = '#0a2b1c';
    patternTone2 = '#11422c';
    patternTone3 = '#083622';
    patternTone4 = '#03120b';
  } else if (config.preset === 'midnight-navy') {
    baseBgColor = '#050b16';
    patternTone1 = '#0d182b';
    patternTone2 = '#172844';
    patternTone3 = '#122038';
    patternTone4 = '#040912';
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden no-print bg-[#0b120c]" aria-hidden="true">
      {/* 1. Dark Base Background */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{ backgroundColor: baseBgColor }}
      />

      {/* 2. Authentic TNI AD Loreng Camouflage Pattern */}
      <svg
        className="absolute inset-0 w-full h-full transition-opacity duration-500"
        style={{ opacity: camoOpacityDecimal }}
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="tni-malvinas-camo-dynamic"
            width="500"
            height="500"
            patternUnits="userSpaceOnUse"
          >
            {/* Tone 1: Base Camo Tone */}
            <rect width="500" height="500" fill={patternTone1} />

            {/* Tone 2: Earth / Contrast Organic Patches */}
            <g fill={patternTone2}>
              <path d="M-20,40 C30,10 90,80 150,30 C200,-10 260,40 310,15 C370,-15 420,50 480,20 C520,0 520,90 480,110 C420,140 370,80 300,120 C230,160 170,100 100,140 C30,180 -10,120 -20,70 Z" />
              <path d="M110,230 C160,190 220,250 290,200 C350,160 410,230 470,180 C510,150 520,270 480,310 C420,350 370,280 290,320 C220,360 160,290 80,340 C20,370 -10,310 -20,270 C-30,220 50,260 110,230 Z" />
              <path d="M-20,440 C50,410 110,480 170,430 C230,390 280,450 350,420 C420,390 470,470 520,440 L520,520 L-20,520 Z" />
              <path d="M380,80 C410,60 435,90 445,130 C430,145 400,135 385,115 Z" />
              <path d="M70,390 C95,370 125,395 130,425 C115,445 80,435 65,410 Z" />
              <path d="M260,370 C290,350 320,375 330,410 C310,430 270,420 255,395 Z" />
            </g>

            {/* Tone 3: Olive / Secondary Patches */}
            <g fill={patternTone3}>
              <path d="M180,-20 C220,30 280,10 320,50 C360,90 410,60 460,95 C490,120 480,160 430,170 C380,180 340,140 290,165 C240,190 200,150 150,180 C110,200 80,150 90,110 C100,60 140,80 180,-20 Z" />
              <path d="M340,240 C390,210 440,260 480,230 C515,210 525,320 490,340 C450,360 420,310 370,335 C320,360 280,310 240,340 C210,360 180,330 190,290 C200,240 290,260 340,240 Z" />
              <path d="M-20,300 C30,270 70,320 110,290 C150,260 180,305 170,350 C160,390 110,380 70,410 C30,440 -10,400 -20,360 Z" />
              <path d="M220,70 C240,55 260,75 265,100 C245,115 225,105 215,85 Z" />
              <path d="M430,390 C450,375 470,395 475,420 C455,435 435,425 425,405 Z" />
            </g>

            {/* Tone 4: Disruptive Patches */}
            <g fill={patternTone4}>
              <path d="M30,100 C70,75 110,120 150,90 C185,60 215,105 250,85 C280,70 310,105 340,85 C360,115 340,150 310,140 C270,125 250,165 200,145 C150,125 120,165 70,135 C35,115 15,135 30,100 Z" />
              <path d="M220,190 C265,160 305,200 350,175 C380,155 410,195 445,175 C460,205 440,240 410,230 C370,220 345,260 300,240 C250,220 230,255 190,230 C160,210 190,170 220,190 Z" />
              <path d="M-15,190 C25,165 55,205 85,185 C115,165 120,205 100,225 C75,245 40,225 10,245 C-10,255 -20,220 -15,190 Z" />
              <path d="M350,320 C390,295 430,335 470,310 C495,290 515,330 500,360 C470,380 440,350 400,370 C360,390 330,350 350,320 Z" />
              <path d="M90,320 C135,290 175,340 220,310 C250,285 280,330 260,365 C230,390 190,360 150,380 C110,400 80,360 90,320 Z" />
              <path d="M-20,-10 C20,15 45,-15 70,10 C55,35 25,30 10,50 C-10,40 -20,15 -20,-10 Z" />
              <path d="M460,-15 C485,15 505,-5 520,20 L520,70 C490,50 470,25 460,-15 Z" />
              <path d="M-20,480 C10,460 35,490 60,470 C45,510 15,505 -20,520 Z" />
              <path d="M440,460 C475,435 505,475 520,455 L520,520 L450,520 C430,500 425,480 440,460 Z" />
            </g>

            {/* Tactical Grid Weave */}
            <rect
              width="500"
              height="500"
              fill="none"
              stroke="#10b981"
              strokeWidth="0.5"
              strokeDasharray="4 6"
              opacity="0.12"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#tni-malvinas-camo-dynamic)" />
      </svg>

      {/* 3. Tactical Dark Dimmer & Vignette */}
      {dimmerOpacityDecimal > 0 && (
        <div 
          className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-500"
          style={{ opacity: dimmerOpacityDecimal }}
        />
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.55) 100%)',
        }}
      />
    </div>
  );
};
