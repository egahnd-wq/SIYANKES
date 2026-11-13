import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { initialEvacuationData, getMonthIndex, getRecordYear, determineCategory, determineStatus, isRecordSembuh } from './data/evacuationData';
import { EvacuationRecord, PatientCategory, SyncConfig } from './types/evacuation';
import { Header } from './components/Header';
import { SubNavbar } from './components/SubNavbar';
import { KpiCards } from './components/KpiCards';
import { ChartsSection } from './components/ChartsSection';
import { DataTable } from './components/DataTable';
import { DetailModal } from './components/DetailModal';
import { NewLetterModal } from './components/NewLetterModal';
import { EditStatusModal } from './components/EditStatusModal';
import { SyncModal } from './components/SyncModal';
import { VersionModal } from './components/VersionModal';
import { TniCamoBackground } from './components/TniCamoBackground';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { LeftSidebar } from './components/LeftSidebar';
import { WallpaperModal, WallpaperConfig, DEFAULT_WALLPAPER_CONFIG } from './components/WallpaperModal';
import { auth } from './firebase';
import { autoCorrectRecordData, correctNomorSurat } from './utils/textCorrector';
import { APP_VERSION, APP_BUILD_DATE, APP_EDITION } from './utils/version';
import {
  fetchSpreadsheetData,
  LOCAL_ASSET_PATH,
  parseEvacuationCsv,
  mergeWithLocalEdits,
  normalizeDate,
} from './utils/csvSync';
import {
  fetchServerRecords,
  pollServerUpdates,
  saveRecordToServer,
  syncBatchToServer,
  triggerServerSheetSync,
  toggleSembuhOnServer,
  fetchAdminWallpaper,
  saveAdminWallpaper,
  fetchAdminSyncConfig,
  saveAdminSyncConfig,
} from './utils/apiSync';
import { decodeSessionToken } from './data/defaultUsers';
import { findConflictingRecord, findDuplicateSuratGroups } from './utils/duplicateCheck';
import { Sparkles, X, AlertTriangle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(() => {
    try {
      const savedUser = localStorage.getItem('kesdam_user_auth');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem('kesdam_user_auth');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed.role || 'guest';
      }
      return 'guest';
    } catch {
      return 'guest';
    }
  });

  // Auto-fit desktop stage (1280px) cleanly on mobile screens without horizontal clipping
  const DESIGN_WIDTH = 1280;
  const [viewportMetrics, setViewportMetrics] = useState<{ scale: number; stageVh: string }>(() => {
    if (typeof window === 'undefined') return { scale: 1, stageVh: '100vh' };
    const vw = document.documentElement.clientWidth || window.innerWidth;
    if (vw > 0 && vw < DESIGN_WIDTH) {
      const scale = Math.floor((vw / DESIGN_WIDTH) * 10000) / 10000;
      return {
        scale,
        stageVh: `${Math.ceil(window.innerHeight / scale)}px`,
      };
    }
    return { scale: 1, stageVh: '100vh' };
  });

  useEffect(() => {
    const updateMetrics = () => {
      const vw = document.documentElement.clientWidth || window.innerWidth;
      if (vw > 0 && vw < DESIGN_WIDTH) {
        const scale = Math.floor((vw / DESIGN_WIDTH) * 10000) / 10000;
        setViewportMetrics({
          scale,
          stageVh: `${Math.ceil(window.innerHeight / scale)}px`,
        });
      } else {
        setViewportMetrics({ scale: 1, stageVh: '100vh' });
      }
    };
    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    window.addEventListener('orientationchange', updateMetrics);
    return () => {
      window.removeEventListener('resize', updateMetrics);
      window.removeEventListener('orientationchange', updateMetrics);
    };
  }, []);

  // Verifikasi sesi pengguna dengan backend & token stateless lintas perangkat/browser
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedV2 = decodeSessionToken(token);
      if (decodedV2) {
        setUser(decodedV2);
        setRole(decodedV2.role || 'operator');
        localStorage.setItem('kesdam_user_auth', JSON.stringify(decodedV2));
      }

      fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('Token check failed');
          return res.json();
        })
        .then((data) => {
          if (data && data.uid && data.uid !== 'guest') {
            setUser(data);
            setRole(data.role || 'guest');
            localStorage.setItem('kesdam_user_auth', JSON.stringify(data));
          } else if (!decodedV2) {
            localStorage.removeItem('token');
            localStorage.removeItem('kesdam_user_auth');
            setUser(null);
            setRole('guest');
          }
        })
        .catch(() => {
          // Jika offline atau error jaringan, pertahankan sesi lokal jika ada
        });
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const existingLocalToken = localStorage.getItem('token');
        if (existingLocalToken && existingLocalToken.startsWith('session_v2.')) {
          return;
        }
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('token', token);
        try {
          const res = await fetch('/api/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
            setRole(data.role || 'operator');
            localStorage.setItem('kesdam_user_auth', JSON.stringify(data));
          }
        } catch {
          // fallback
        }
      }
    });

    return unsubscribe;
  }, []);

  const handleLoginSuccess = (userData: any, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('kesdam_user_auth', JSON.stringify(userData));
    setUser(userData);
    setRole(userData.role || 'guest');
    setIsLoginOpen(false);
    setToastMessage(`Selamat datang, ${userData.name || userData.username} (${userData.role === 'superadmin' ? 'Super Admin' : userData.role === 'operator' ? 'Operator' : 'Tamu'})`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('kesdam_user_auth');
    setUser(null);
    setRole('guest');
    try {
      auth.signOut();
    } catch {}
    setToastMessage('Anda telah keluar dari sistem.');
  };


  const normalizeCanonicalRecord = useCallback((item: EvacuationRecord, idx: number): EvacuationRecord => {
    const cleanAsal = item.asal && item.asal.trim() !== '-' && item.asal.trim() !== '' ? item.asal : 'RS TK II 17.05.01 Marthen Indey';
    const cleanModa = item.moda && item.moda.trim() !== '-' && item.moda.trim() !== '' ? item.moda : 'Pesawat';
    const cleanTgl = normalizeDate(item.tgl || '') || item.tgl;
    const cleanSrt = correctNomorSurat(item.srt || '', cleanTgl) || item.srt;
    const cleanTglSembuh = item.tanggalSembuh ? normalizeDate(item.tanggalSembuh) : undefined;
    const computedKategori = determineCategory(item.nama, `${item.identitas} ${item.jabatan || ''}`, item.patientStatus);
    const computedStatus = determineStatus(item.ket, cleanSrt);
    const computedSembuh = item.isSembuh !== undefined ? item.isSembuh : isRecordSembuh(item);
    return {
      ...item,
      id: item.id || `rec-${item.no || idx + 1}-${cleanSrt || idx}-${idx}`,
      srt: cleanSrt,
      tgl: cleanTgl,
      tanggalSembuh: cleanTglSembuh,
      asal: cleanAsal,
      moda: cleanModa,
      kategori: computedKategori,
      status: computedStatus,
      isSembuh: computedSembuh,
    };
  }, []);

  // Load data with LocalStorage persistence support & guaranteed identical state across all browsers
  const [records, setRecords] = useState<EvacuationRecord[]>(() => {
    try {
      const installedVersion = localStorage.getItem('kesdam_installed_version');
      const saved = localStorage.getItem('kesdam_evacuation_data_v2');
      if (saved && installedVersion === APP_VERSION) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length >= initialEvacuationData.length &&
          parsed[0]?.nama === initialEvacuationData[0]?.nama
        ) {
          return parsed.map((item: EvacuationRecord, idx: number) => {
            const normTgl = normalizeDate(item.tgl || '') || item.tgl;
            const normSrt = correctNomorSurat(item.srt || '', normTgl) || item.srt;
            return {
              ...item,
              id: item.id || `rec-${item.no || idx + 1}-${normSrt || idx}-${idx}`,
              srt: normSrt,
              tgl: normTgl,
              tanggalSembuh: item.tanggalSembuh ? normalizeDate(item.tanggalSembuh) : undefined,
              kategori: determineCategory(item.nama, `${item.identitas} ${item.jabatan || ''}`, item.patientStatus),
              status: determineStatus(item.ket, normSrt),
              asal: item.asal && item.asal.trim() !== '-' && item.asal.trim() !== '' ? item.asal : 'RS TK II 17.05.01 Marthen Indey',
              moda: item.moda && item.moda.trim() !== '-' && item.moda.trim() !== '' ? item.moda : 'Pesawat',
              isSembuh: item.isSembuh !== undefined ? item.isSembuh : isRecordSembuh(item),
            };
          });
        }
      }
    } catch {
      // ignore
    }
    const canonical = initialEvacuationData.map((item, idx) => {
      const cleanTgl = normalizeDate(item.tgl || '') || item.tgl;
      const cleanSrt = correctNomorSurat(item.srt || '', cleanTgl) || item.srt;
      return {
        ...item,
        id: item.id || `rec-${item.no}-${idx}`,
        srt: cleanSrt,
        tgl: cleanTgl,
        kategori: determineCategory(item.nama, `${item.identitas} ${item.jabatan || ''}`, item.patientStatus),
        status: determineStatus(item.ket, cleanSrt),
        isSembuh: isRecordSembuh(item),
      };
    });
    try {
      localStorage.setItem('kesdam_installed_version', APP_VERSION);
      localStorage.setItem('kesdam_evacuation_data_v2', JSON.stringify(canonical));
    } catch {}
    return canonical;
  });

  // Real-time Spreadsheet Synchronization configuration
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => {
    const defaultConf: SyncConfig = {
      sourceType: 'google_sheet',
      sheetUrl: 'https://docs.google.com/spreadsheets/d/1IT7kt76lGkvXMUlI18W3uF6xcQtfdv5Dxvn3cvyqA7o/edit?usp=sharing',
      autoSyncEnabled: true,
      intervalSeconds: 30,
      lastSyncTime: null,
      lastSyncStatus: 'idle',
      recordsCount: initialEvacuationData.length,
    };
    try {
      const saved = localStorage.getItem('kesdam_sync_config_v1');
      if (saved) {
        return { ...defaultConf, ...JSON.parse(saved) };
      }
      localStorage.setItem('kesdam_sync_config_v1', JSON.stringify(defaultConf));
    } catch {}
    return defaultConf;
  });

  const [preserveLocalEdits, setPreserveLocalEdits] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kesdam_preserve_local_edits');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  // Mode Patriot TNI AD (Loreng Malvinas Military background & enhanced typography - Standar Aktif)
  const isPatriotMode = true;

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PatientCategory | 'ALL'>('ALL');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [filterBatalRalat, setFilterBatalRalat] = useState(false);
  const [filterOnlySembuh, setFilterOnlySembuh] = useState(false);
  const [filterMeninggal, setFilterMeninggal] = useState(false);

  // Modal & Sidebar States
  const [detailRecord, setDetailRecord] = useState<EvacuationRecord | null>(null);
  const [editRecord, setEditRecord] = useState<EvacuationRecord | null>(null);
  const [isNewLetterOpen, setIsNewLetterOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLeftMenuOpenMobile, setIsLeftMenuOpenMobile] = useState(false);
  const [isLeftMenuCollapsedDesktop, setIsLeftMenuCollapsedDesktop] = useState(false);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'charts' | 'table'>('dashboard');
  const [isRegisterOnlyView, setIsRegisterOnlyView] = useState(false);
  const [brightness, setBrightness] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem('kesdam_screen_brightness'));
      if (!Number.isNaN(saved) && saved >= 60 && saved <= 160) {
        return saved;
      }
    } catch {}
    return 100;
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
  const [adminWallpaperConfig, setAdminWallpaperConfig] = useState<WallpaperConfig>(DEFAULT_WALLPAPER_CONFIG);
  const [personalWallpaperConfig, setPersonalWallpaperConfig] = useState<WallpaperConfig | null>(null);

  const getOperatorKey = useCallback((u: any) => {
    const nameKey = u?.username || u?.email || 'default';
    return `kesdam_wallpaper_config_operator_${nameKey}`;
  }, []);

  // Fetch admin global wallpaper from server on mount and poll every 3 seconds for Guest live sync
  useEffect(() => {
    let mounted = true;
    const loadAdminWp = () => {
      fetchAdminWallpaper().then((conf) => {
        if (conf && mounted) {
          setAdminWallpaperConfig(conf);
        }
      });
    };
    loadAdminWp();
    const interval = setInterval(loadAdminWp, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch admin global sync config from server on mount and poll every 3 seconds so Guests and Operators strictly follow Admin
  useEffect(() => {
    let mounted = true;
    const loadAdminSync = () => {
      fetchAdminSyncConfig().then((conf) => {
        if (conf && mounted) {
          setSyncConfig((prev) => ({
            ...prev,
            ...conf,
          }));
        }
      });
    };
    loadAdminSync();
    const interval = setInterval(loadAdminSync, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Sync personal wallpaper override based on logged in role
  useEffect(() => {
    if (role === 'operator') {
      try {
        const savedOp = localStorage.getItem(getOperatorKey(user));
        if (savedOp) {
          setPersonalWallpaperConfig(JSON.parse(savedOp));
          return;
        }
      } catch {}
      setPersonalWallpaperConfig(null);
    } else if (role === 'superadmin') {
      try {
        const savedAdmin = localStorage.getItem('kesdam_wallpaper_config_superadmin');
        if (savedAdmin) {
          setPersonalWallpaperConfig(JSON.parse(savedAdmin));
          return;
        }
      } catch {}
      setPersonalWallpaperConfig(null);
    } else {
      // Guest role has no personal override, strictly follows Admin wallpaper
      setPersonalWallpaperConfig(null);
    }
  }, [role, user, getOperatorKey]);

  // Compute active wallpaper config:
  // Guests ALWAYS use adminWallpaperConfig.
  // Operators and Superadmins use personalWallpaperConfig if set, otherwise fallback to adminWallpaperConfig.
  const activeWallpaperConfig = useMemo(() => {
    return role === 'guest' || !role
      ? adminWallpaperConfig
      : personalWallpaperConfig || adminWallpaperConfig;
  }, [role, personalWallpaperConfig, adminWallpaperConfig]);

  // Apply glass transparency & blur to root CSS variables
  useEffect(() => {
    const rawTransparency = activeWallpaperConfig.glassTransparency ?? 25;
    const alpha = Math.min(0.92, Math.max(0.22, (100 - rawTransparency) / 100));
    const cardAlpha = Math.min(0.95, alpha + 0.06);
    document.documentElement.style.setProperty('--box-glass-bg', `rgba(9, 21, 12, ${alpha})`);
    document.documentElement.style.setProperty('--box-glass-card-bg', `rgba(13, 30, 17, ${cardAlpha})`);
    document.documentElement.style.setProperty('--box-glass-border', `rgba(16, 185, 129, 0.28)`);
    document.documentElement.style.setProperty('--box-glass-blur', `${activeWallpaperConfig.blurAmount}px`);
  }, [activeWallpaperConfig]);

  // Apply and persist screen brightness across all roles (Admin, Operator, Guest)
  useEffect(() => {
    const clamped = Math.min(160, Math.max(60, brightness));
    document.documentElement.style.filter = clamped === 100 ? '' : `brightness(${clamped / 100})`;
    try {
      localStorage.setItem('kesdam_screen_brightness', String(clamped));
    } catch {}
  }, [brightness]);

  const handleUpdateWallpaper = (newConfig: WallpaperConfig) => {
    if (role === 'superadmin') {
      // Admin updates global Admin wallpaper (broadcasted to Guests) AND own setting
      setPersonalWallpaperConfig(newConfig);
      setAdminWallpaperConfig(newConfig);
      try {
        localStorage.setItem('kesdam_wallpaper_config_superadmin', JSON.stringify(newConfig));
      } catch {}
      saveAdminWallpaper(newConfig).catch(() => {});
      setToastMessage('🎨 Wallpaper Admin berhasil diperbarui & ditayangkan untuk Akun Tamu.');
    } else if (role === 'operator') {
      // Operator updates personal wallpaper ONLY (does not touch Admin or Guest or other Operators)
      setPersonalWallpaperConfig(newConfig);
      try {
        localStorage.setItem(getOperatorKey(user), JSON.stringify(newConfig));
      } catch {}
      setToastMessage('🎨 Wallpaper Operator berhasil diperbarui untuk tampilan pribadi Anda.');
    }
  };

  const handleResetWallpaper = () => {
    if (role === 'superadmin') {
      setPersonalWallpaperConfig(DEFAULT_WALLPAPER_CONFIG);
      setAdminWallpaperConfig(DEFAULT_WALLPAPER_CONFIG);
      try {
        localStorage.removeItem('kesdam_wallpaper_config_superadmin');
      } catch {}
      saveAdminWallpaper(DEFAULT_WALLPAPER_CONFIG).catch(() => {});
      setToastMessage('🎨 Wallpaper Admin berhasil direset ke standar TNI AD.');
    } else if (role === 'operator') {
      setPersonalWallpaperConfig(null);
      try {
        localStorage.removeItem(getOperatorKey(user));
      } catch {}
      setToastMessage('🎨 Wallpaper Operator direset ke tampilan Wallpaper Admin.');
    }
  };

  const handleToggleLeftMenu = () => {
    setIsLeftMenuCollapsedDesktop((prev) => !prev);
  };

  const handleSelectSection = (section: 'dashboard' | 'charts' | 'table') => {
    setActiveSection(section);
    if (section === 'dashboard') {
      setIsRegisterOnlyView(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (section === 'table') {
      setIsRegisterOnlyView(true);
    } else {
      setIsRegisterOnlyView(false);
    }
    const targetId = section === 'charts' ? 'charts-section' : 'data-table-section';
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        const yOffset = -100;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 80);
  };

  // Multi-Device Real-Time Sync Reference
  const lastKnownServerTimestamp = useRef<number>(0);
  const [isMultiDeviceConnected, setIsMultiDeviceConnected] = useState<boolean>(true);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Save records to LocalStorage as cache & offline fallback
  useEffect(() => {
    try {
      localStorage.setItem('kesdam_evacuation_data_v2', JSON.stringify(records));
    } catch {
      // ignore
    }
  }, [records]);

  // Initial fetch from central server (ensures PC, tablet, and smartphone all load latest shared database)
  useEffect(() => {
    let isCancelled = false;
    const initServer = async () => {
      const serverRes = await fetchServerRecords();
      if (serverRes) {
        if (Array.isArray(serverRes.records) && serverRes.records.length > 0) {
          if (!isCancelled) {
            const normalized = serverRes.records.map((r, i) => normalizeCanonicalRecord(r, i));
            setIsMultiDeviceConnected(true);
            lastKnownServerTimestamp.current = serverRes.lastUpdated;
            setRecords(normalized);
            try {
              localStorage.setItem('kesdam_evacuation_data_v2', JSON.stringify(normalized));
              localStorage.setItem('kesdam_installed_version', APP_VERSION);
            } catch {}
          }
        }
      } else {
        // If server was fresh/empty, seed server with master records
        syncBatchToServer(records, 'initial_client_sync').catch(() => {});
      }
    };
    initServer();
    return () => {
      isCancelled = true;
    };
  }, [normalizeCanonicalRecord]);

  // Real-time polling across all devices (Smartphone, Web, Tablet, Komputer) & Auto-Reload on Republish
  useEffect(() => {
    let isCancelled = false;

    const checkServerForUpdates = async () => {
      if (document.hidden) return;
      try {
        const poll = await pollServerUpdates(lastKnownServerTimestamp.current);
        if (poll && !isCancelled) {
          setIsMultiDeviceConnected(true);

          // Jika server baru saja di-Republish dengan versi baru, bersihkan cache lokal dan muat ulang otomatis satu kali
          if (poll.version && poll.version !== APP_VERSION) {
            const alreadyReloaded = sessionStorage.getItem('kesdam_reloaded_version');
            if (alreadyReloaded !== poll.version) {
              try {
                sessionStorage.setItem('kesdam_reloaded_version', poll.version);
                localStorage.removeItem('kesdam_evacuation_data_v2');
                localStorage.removeItem('kesdam_evacuation_data_v1');
                localStorage.removeItem('kesdam_sync_config_v1');
                localStorage.setItem('kesdam_installed_version', poll.version);
                if ('caches' in window) {
                  const names = await caches.keys();
                  await Promise.all(names.map((n) => caches.delete(n)));
                }
              } catch {}
              window.location.reload();
              return;
            }
          }

          if (poll.hasUpdates || poll.count !== records.length) {
            const full = await fetchServerRecords();
            if (full && Array.isArray(full.records) && !isCancelled) {
              const normalized = full.records.map((r, i) => normalizeCanonicalRecord(r, i));
              lastKnownServerTimestamp.current = full.lastUpdated;
              setRecords((prev) => {
                if (normalized.length === prev.length) {
                  const isIdentical = normalized.every(
                    (r, i) =>
                      r.no === prev[i]?.no &&
                      r.srt === prev[i]?.srt &&
                      r.nama === prev[i]?.nama &&
                      r.kategori === prev[i]?.kategori &&
                      r.isSembuh === prev[i]?.isSembuh &&
                      r.status === prev[i]?.status &&
                      r.ket === prev[i]?.ket &&
                      r.tgl === prev[i]?.tgl
                  );
                  if (isIdentical) return prev;
                }
                try {
                  localStorage.setItem('kesdam_evacuation_data_v2', JSON.stringify(normalized));
                } catch {}
                setToastMessage(`⚡ Data spreadsheet diperbarui otomatis (Real-Time: ${normalized.length} berkas).`);
                return normalized;
              });
            }
          }
        }
      } catch {
        // silent fallback
      }
    };

    // Polling real-time otomatis setiap 3 detik (ringan, instan saat spreadsheet berubah atau aplikasi di-republish)
    const interval = setInterval(checkServerForUpdates, 3000);

    const onVisibilityOrFocus = () => {
      if (!document.hidden) {
        checkServerForUpdates();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);
    window.addEventListener('pageshow', onVisibilityOrFocus);
    window.addEventListener('online', onVisibilityOrFocus);

    return () => {
      isCancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
      window.removeEventListener('pageshow', onVisibilityOrFocus);
      window.removeEventListener('online', onVisibilityOrFocus);
    };
  }, [normalizeCanonicalRecord, records.length]);

  // Core Sync Handler
  const handlePerformSync = useCallback(
    async (targetUrl?: string, silent: boolean = false) => {
      const url = targetUrl || syncConfig.sheetUrl || LOCAL_ASSET_PATH;
      setIsSyncing(true);

      try {
        // Jika sumbernya Google Sheet / URL HTTP, utamakan sinkronisasi langsung via server (bebas CORS & terpusat lintas perangkat)
        if (url.startsWith('http')) {
          const serverRes = await triggerServerSheetSync(url);
          if (serverRes && serverRes.success && Array.isArray(serverRes.records) && serverRes.records.length > 0) {
            const normalized = serverRes.records.map((r, i) => normalizeCanonicalRecord(r, i));
            lastKnownServerTimestamp.current = serverRes.lastUpdated || Date.now();
            setIsMultiDeviceConnected(true);
            setRecords((prev) => {
              if (
                normalized.length === prev.length &&
                normalized.every(
                  (r, i) =>
                    r.no === prev[i]?.no &&
                    r.srt === prev[i]?.srt &&
                    r.tgl === prev[i]?.tgl &&
                    r.nama === prev[i]?.nama &&
                    r.identitas === prev[i]?.identitas &&
                    r.kesatuan === prev[i]?.kesatuan &&
                    r.diag === prev[i]?.diag &&
                    r.asal === prev[i]?.asal &&
                    r.tujuan === prev[i]?.tujuan &&
                    r.moda === prev[i]?.moda &&
                    r.pendamping === prev[i]?.pendamping &&
                    r.ket === prev[i]?.ket &&
                    r.kategori === prev[i]?.kategori &&
                    r.isSembuh === prev[i]?.isSembuh &&
                    r.status === prev[i]?.status
                )
              ) {
                return prev;
              }
              try {
                localStorage.setItem('kesdam_evacuation_data_v2', JSON.stringify(normalized));
              } catch {}
              return normalized;
            });

            const timeStr =
              serverRes.syncConfig?.lastSyncTime ||
              `${new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })} WIB`;

            setSyncConfig((prev) => {
              const updated: SyncConfig = {
                ...prev,
                ...(serverRes.syncConfig || {}),
                lastSyncTime: timeStr,
                lastSyncStatus: 'success',
                recordsCount: normalized.length,
                errorMessage: undefined,
              };
              try {
                localStorage.setItem('kesdam_sync_config_v1', JSON.stringify(updated));
              } catch {}
              return updated;
            });

            if (!silent) {
              setToastMessage(`🟢 Sinkronisasi Google Sheet berhasil! ${normalized.length} data real-time termutakhir.`);
            }
            return;
          }
        }

        const fetched = await fetchSpreadsheetData(url, {
          fallbackToLocal: silent,
          silent,
        });

        let totalMergedCount = initialEvacuationData.length;
        setRecords((prevLocal) => {
          const merged = mergeWithLocalEdits(fetched, prevLocal, preserveLocalEdits);
          totalMergedCount = merged.length;
          if (
            merged.length === prevLocal.length &&
            merged.every(
              (r, i) =>
                r.no === prevLocal[i]?.no &&
                r.srt === prevLocal[i]?.srt &&
                r.nama === prevLocal[i]?.nama &&
                r.kategori === prevLocal[i]?.kategori &&
                r.isSembuh === prevLocal[i]?.isSembuh &&
                r.status === prevLocal[i]?.status &&
                r.ket === prevLocal[i]?.ket &&
                r.tgl === prevLocal[i]?.tgl
            )
          ) {
            return prevLocal;
          }
          // Only push to server if user added new records or there is an actual difference
          if (merged.length !== prevLocal.length) {
            syncBatchToServer(merged, 'spreadsheet_sync').catch(() => {});
          }
          return merged;
        });

        const timeStr = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        setSyncConfig((prev) => {
          const updated: SyncConfig = {
            ...prev,
            lastSyncTime: `${timeStr} WIB`,
            lastSyncStatus: 'success',
            recordsCount: totalMergedCount,
            errorMessage: undefined,
          };
          try {
            localStorage.setItem('kesdam_sync_config_v1', JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });

        if (!silent) {
          setToastMessage(`🟢 Sinkronisasi spreadsheet berhasil! ${totalMergedCount} data termutakhir.`);
        }
      } catch (err: any) {
        console.warn('Catatan sinkronisasi spreadsheet:', err?.message || err);
        const errMsg = err?.message || 'Gagal sinkronisasi data';
        setSyncConfig((prev) => ({
          ...prev,
          lastSyncStatus: 'error',
          errorMessage: errMsg,
        }));
        if (!silent) {
          setToastMessage(`⚠️ Gagal sinkronisasi: ${errMsg}`);
          throw err;
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [syncConfig.sheetUrl, preserveLocalEdits, normalizeCanonicalRecord]
  );

  // 1b. Jaminan kelengkapan data master: jika records kurang dari data master (88 berkas), pulihkan
  useEffect(() => {
    if (records.length < initialEvacuationData.length) {
      setRecords((prev) => {
        const full = mergeWithLocalEdits(initialEvacuationData, prev, preserveLocalEdits);
        try {
          localStorage.setItem('kesdam_evacuation_data_v2', JSON.stringify(full));
          localStorage.setItem('kesdam_installed_version', APP_VERSION);
        } catch {
          // ignore
        }
        return full;
      });
    }
  }, [records.length, preserveLocalEdits]);

  // 2. Background polling interval: hanya jika pengguna menyambungkan link Google Sheet eksternal langsung (https://...)
  useEffect(() => {
    if (!syncConfig.autoSyncEnabled || syncConfig.intervalSeconds <= 0) return;
    // Hindari polling berulang pada berkas aset statis lokal
    if (syncConfig.sourceType === 'local_asset' || !syncConfig.sheetUrl?.startsWith('http')) return;

    // Jalankan satu kali segera setelah mount agar total langsung real-time
    const initialTimer = setTimeout(() => {
      handlePerformSync(undefined, true).catch(() => {});
    }, 1200);

    const intervalMs = Math.max(10, syncConfig.intervalSeconds) * 1000;
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        handlePerformSync(undefined, true).catch(() => {});
      }
    }, intervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, [syncConfig.autoSyncEnabled, syncConfig.intervalSeconds, syncConfig.sourceType, syncConfig.sheetUrl, handlePerformSync]);

  const handleUpdateConfig = (newConf: Partial<SyncConfig>) => {
    setSyncConfig((prev) => {
      const updated = { ...prev, ...newConf };
      try {
        localStorage.setItem('kesdam_sync_config_v1', JSON.stringify(updated));
      } catch {
        // ignore
      }
      if (role === 'superadmin') {
        saveAdminSyncConfig(updated).catch(() => {});
      }
      return updated;
    });
  };

  const handleTogglePreserveLocalEdits = (preserve: boolean) => {
    setPreserveLocalEdits(preserve);
    try {
      localStorage.setItem('kesdam_preserve_local_edits', String(preserve));
    } catch {
      // ignore
    }
  };

  const handleImportCsvText = (csvText: string, sourceName: string) => {
    const parsed = parseEvacuationCsv(csvText);
    if (parsed.length === 0) {
      throw new Error('Tidak ada data pasien yang valid di dalam file CSV.');
    }
    const merged = mergeWithLocalEdits(parsed, records, preserveLocalEdits);
    setRecords(merged);
    syncBatchToServer(merged, 'csv_import').catch(() => {});

    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setSyncConfig((prev) => ({
      ...prev,
      lastSyncTime: `${timeStr} WIB`,
      lastSyncStatus: 'success',
      recordsCount: merged.length,
    }));
    setToastMessage(`📂 Berkas "${sourceName}" berhasil diimpor: ${merged.length} data pasien.`);
  };

  const handleResetToDefaultAsset = async () => {
    const updatedConfig: Partial<SyncConfig> = {
      sourceType: 'local_asset',
      sheetUrl: LOCAL_ASSET_PATH,
    };
    handleUpdateConfig(updatedConfig);
    await handlePerformSync(LOCAL_ASSET_PATH, false);
  };

  const scrollToTable = () => {
    setTimeout(() => {
      const el = document.getElementById('data-table-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Dynamic Year Statistics (automatically includes 2024, 2025, 2026 and any new year added)
  const yearStats = useMemo(() => {
    const counts = new Map<string, number>([
      ['2024', 0],
      ['2025', 0],
      ['2026', 0],
    ]);

    records.forEach((r) => {
      const y = getRecordYear(r.tgl, r.srt);
      if (y) {
        counts.set(y, (counts.get(y) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, count]) => ({ year, count }));
  }, [records]);

  // Reset Filters to show all records
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedHospital('');
    setSelectedOrigin('');
    setSelectedMonth(null);
    setSelectedYear(null);
    setFilterBatalRalat(false);
    setFilterOnlySembuh(false);
    setFilterMeninggal(false);
    setIsRegisterOnlyView(false);
    setActiveSection('dashboard');
  };

  // 1-Click Meninggal Dunia filter
  const handleFilterMeninggal = () => {
    setFilterMeninggal((prev) => {
      const next = !prev;
      if (next) {
        setSelectedCategory('ALL');
        setFilterBatalRalat(false);
        setFilterOnlySembuh(false);
        setSelectedHospital('');
        setSelectedOrigin('');
        setSelectedMonth(null);
        setSelectedYear(null);
        setSearchQuery('');
        setIsRegisterOnlyView(true);
        scrollToTable();
        setToastMessage(`Menampilkan HANYA pasien Meninggal Dunia / MD (${stats.meninggal} pasien).`);
      } else {
        setToastMessage('Filter Meninggal Dunia dinonaktifkan.');
      }
      return next;
    });
  };

  // 1-Click Year Period filter
  const handleFilterYear = (year: string) => {
    if (selectedYear === year) {
      setSelectedYear(null);
      setToastMessage('Filter Periode Tahun dinonaktifkan, menampilkan semua tahun.');
    } else {
      setSelectedYear(year);
      setIsRegisterOnlyView(true);
      scrollToTable();
      const found = yearStats.find((y) => y.year === year);
      setToastMessage(`Menampilkan data evakuasi PERIODE TAHUN ${year}: ${found ? found.count : 0} PASIEN.`);
    }
  };

  // 1-Click Total Box filter
  const handleFilterTotal = () => {
    handleResetFilters();
    setIsRegisterOnlyView(true);
    setActiveSection('table');
    scrollToTable();
    setToastMessage(`Menampilkan seluruh data register (${records.length} berkas pasien).`);
  };

  // 1-Click Hospital Tujuan filter
  const handleFilterTujuan = (hospital: string) => {
    if (selectedHospital === hospital || !hospital) {
      setSelectedHospital('');
    } else {
      setSelectedHospital(hospital);
      setIsRegisterOnlyView(true);
      scrollToTable();
    }
  };

  // 1-Click Militer, Persit, Anak, PNS filter
  const handleFilterCategory = (cat: PatientCategory | 'ALL') => {
    if (cat === 'ALL') {
      setSelectedCategory('ALL');
      setToastMessage('Menampilkan semua kategori pasien.');
      return;
    }
    if (selectedCategory === cat) {
      setSelectedCategory('ALL');
      setToastMessage('Filter dinonaktifkan, menampilkan semua pasien.');
    } else {
      setSelectedCategory(cat);
      setFilterBatalRalat(false);
      setFilterOnlySembuh(false);
      setFilterMeninggal(false);
      setSelectedHospital('');
      setSelectedOrigin('');
      setSelectedMonth(null);
      setSearchQuery('');
      setIsRegisterOnlyView(true);
      scrollToTable();
      const label =
        cat === 'MILITER'
          ? 'Prajurit Militer'
          : cat === 'PERSIT'
          ? 'Istri / Persit'
          : cat === 'ANAK'
          ? 'Anak Prajurit'
          : 'ASN / PPPK';
      const count =
        cat === 'MILITER'
          ? stats.militer
          : cat === 'PERSIT'
          ? stats.persit
          : cat === 'ANAK'
          ? stats.anak
          : stats.pns;
      setToastMessage(`Menampilkan HANYA pasien ${label} (${count} pasien).`);
    }
  };

  // 1-Click Batal/Ralat filter
  const handleFilterBatalRalat = () => {
    setFilterBatalRalat((prev) => {
      const next = !prev;
      if (next) {
        setSelectedCategory('ALL');
        setFilterOnlySembuh(false);
        setFilterMeninggal(false);
        setSelectedHospital('');
        setSelectedOrigin('');
        setSelectedMonth(null);
        setSearchQuery('');
        setIsRegisterOnlyView(true);
        scrollToTable();
        setToastMessage(`Menampilkan HANYA berkas Batal / Ralat (${stats.batalRalat} berkas).`);
      } else {
        setToastMessage('Filter Batal / Ralat dinonaktifkan.');
      }
      return next;
    });
  };

  // 1-Click Sembuh / Kembali ke Kesatuan filter
  const handleFilterSembuh = () => {
    setFilterOnlySembuh((prev) => {
      const next = !prev;
      if (next) {
        setSelectedCategory('ALL');
        setFilterBatalRalat(false);
        setFilterMeninggal(false);
        setSelectedHospital('');
        setSelectedOrigin('');
        setSelectedMonth(null);
        setSearchQuery('');
        setIsRegisterOnlyView(true);
        scrollToTable();
        setToastMessage(`Menampilkan HANYA pasien Sudah Sembuh / Kembali ke Kesatuan (${stats.sembuh} pasien).`);
      } else {
        setToastMessage('Filter Status Sembuh dinonaktifkan.');
      }
      return next;
    });
  };

  const isFiltered = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      selectedCategory !== 'ALL' ||
      selectedHospital !== '' ||
      selectedOrigin !== '' ||
      selectedMonth !== null ||
      selectedYear !== null ||
      filterBatalRalat ||
      filterOnlySembuh ||
      filterMeninggal
    );
  }, [searchQuery, selectedCategory, selectedHospital, selectedOrigin, selectedMonth, selectedYear, filterBatalRalat, filterOnlySembuh, filterMeninggal]);

  const showOnlyRegister = isFiltered || isRegisterOnlyView || activeSection === 'table';

  // Overall Statistics from complete dataset
  const stats = useMemo(() => {
    let militer = 0;
    let persit = 0;
    let anak = 0;
    let pns = 0;
    let rspad = 0;
    let batalRalat = 0;
    let sembuh = 0;
    let meninggal = 0;

    const breakdown = {
      MILITER: { total: 0, sembuh: 0, meninggal: 0, berobat: 0 },
      PERSIT: { total: 0, sembuh: 0, meninggal: 0, berobat: 0 },
      ANAK: { total: 0, sembuh: 0, meninggal: 0, berobat: 0 },
      PNS: { total: 0, sembuh: 0, meninggal: 0, berobat: 0 },
    };

    const hospitalBreakdown: Record<string, { name: string; total: number; sembuh: number; meninggal: number; berobat: number }> = {};

    records.forEach((r) => {
      const note = `${r.ket || ''} ${r.srt || ''}`.toLowerCase();
      const isMeninggal =
        r.status === 'MENINGGAL' ||
        note.includes('meninggal') ||
        note.includes('gugur') ||
        /\bmd\b/.test(note);

      const isSembuh = !isMeninggal && isRecordSembuh(r);

      if (isMeninggal) {
        meninggal++;
      } else if (isSembuh) {
        sembuh++;
      }

      const cat = (r.kategori as 'MILITER' | 'PERSIT' | 'ANAK' | 'PNS') || 'MILITER';
      if (breakdown[cat]) {
        breakdown[cat].total++;
        if (isMeninggal) {
          breakdown[cat].meninggal++;
        } else if (isSembuh) {
          breakdown[cat].sembuh++;
        } else {
          breakdown[cat].berobat++;
        }
      }

      // RS Tujuan breakdown
      const t = (r.tujuan || 'Tidak Diketahui').trim();
      let hKey = t;
      const tLower = t.toLowerCase();
      if (tLower.includes('rspad') || tLower.includes('gatot soebroto')) hKey = 'RSPAD Gatot Soebroto Jakarta';
      else if (tLower.includes('marthen')) hKey = 'RS TK II 17.05.01 Marthen Indey';
      else if (tLower.includes('pelamonia')) hKey = 'RS TK II Pelamonia Makassar';
      else if (tLower.includes('wolter')) hKey = 'RS TK II Wolter Mongosidi Manado';
      else if (tLower.includes('soepraoen')) hKey = 'RS TK II dr. Soepraoen Malang';
      else if (tLower.includes('ramelan')) hKey = 'RSPAL dr. Ramelan Surabaya';
      else if (tLower.includes('esnawan')) hKey = 'RSAU dr. Esnawan Jakarta';
      else if (tLower.includes('hasanuddin')) hKey = 'RS Universitas Hasanuddin Makassar';

      if (!hospitalBreakdown[hKey]) {
        hospitalBreakdown[hKey] = { name: hKey, total: 0, sembuh: 0, meninggal: 0, berobat: 0 };
      }
      hospitalBreakdown[hKey].total++;
      if (isMeninggal) {
        hospitalBreakdown[hKey].meninggal++;
      } else if (isSembuh) {
        hospitalBreakdown[hKey].sembuh++;
      } else {
        hospitalBreakdown[hKey].berobat++;
      }

      if (r.kategori === 'MILITER') militer++;
      else if (r.kategori === 'PERSIT') persit++;
      else if (r.kategori === 'ANAK') anak++;
      else if (r.kategori === 'PNS') pns++;

      if (r.tujuan.toLowerCase().includes('gatot soebroto') || r.tujuan.toLowerCase().includes('rspad')) {
        rspad++;
      }

      if (note.includes('batal') || note.includes('ralat') || note.includes('dibatalkan') || note.includes('diralat')) {
        batalRalat++;
      }
    });

    const berobat = Math.max(0, records.length - sembuh - meninggal);

    return {
      total: records.length,
      militer,
      persit,
      anak,
      pns,
      rspad,
      batalRalat,
      sembuh,
      meninggal,
      berobat,
      breakdown,
      hospitalBreakdown,
    };
  }, [records]);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return records.filter((item) => {
      // 0. Year Period Filter
      if (selectedYear && getRecordYear(item.tgl, item.srt) !== selectedYear) {
        return false;
      }

      // 1. Search Query
      if (q) {
        const matchNama = item.nama.toLowerCase().includes(q);
        const matchSrt = item.srt.toLowerCase().includes(q);
        const matchIdentitas = item.identitas.toLowerCase().includes(q);
        const matchKesatuan = item.kesatuan.toLowerCase().includes(q);
        const matchDiag = item.diag.toLowerCase().includes(q);
        const matchTujuan = item.tujuan.toLowerCase().includes(q);
        const matchAsal = item.asal.toLowerCase().includes(q);
        const matchJabatan = item.jabatan?.toLowerCase().includes(q) || false;
        const matchKet = item.ket.toLowerCase().includes(q);
        if (
          !matchNama &&
          !matchSrt &&
          !matchIdentitas &&
          !matchKesatuan &&
          !matchDiag &&
          !matchTujuan &&
          !matchAsal &&
          !matchJabatan &&
          !matchKet
        ) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'ALL' && item.kategori !== selectedCategory) {
        return false;
      }

      // 3. Hospital (Tujuan) Filter
      if (selectedHospital && !item.tujuan.toLowerCase().includes(selectedHospital.toLowerCase())) {
        return false;
      }

      // 3b. Origin (Asal) Filter
      if (selectedOrigin && !item.asal.toLowerCase().includes(selectedOrigin.toLowerCase())) {
        return false;
      }

      // 4. Month Filter
      if (selectedMonth !== null) {
        const itemMonth = getMonthIndex(item.tgl);
        if (itemMonth !== selectedMonth) {
          return false;
        }
      }

      // 5. Batal / Ralat Filter
      if (filterBatalRalat) {
        const isBatalOrRalat =
          item.ket.toLowerCase().includes('batal') || item.ket.toLowerCase().includes('ralat');
        if (!isBatalOrRalat) return false;
      }

      // 6. Sembuh / Kembali ke Kesatuan Filter
      if (filterOnlySembuh) {
        if (!isRecordSembuh(item)) return false;
      }

      // 7. Meninggal Dunia Filter
      if (filterMeninggal) {
        const note = `${item.ket || ''} ${item.srt || ''}`.toLowerCase();
        const isMeninggal =
          item.status === 'MENINGGAL' ||
          note.includes('meninggal') ||
          note.includes('gugur') ||
          /\bmd\b/.test(note);
        if (!isMeninggal) return false;
      }

      return true;
    });
  }, [records, searchQuery, selectedCategory, selectedHospital, selectedOrigin, selectedMonth, selectedYear, filterBatalRalat, filterOnlySembuh, filterMeninggal]);

  const duplicateInfo = useMemo(() => findDuplicateSuratGroups(records), [records]);

  // Add new Record
  const handleAddRecord = (newRec: EvacuationRecord) => {
    const conflict = findConflictingRecord(newRec.srt, records);
    if (conflict) {
      setToastMessage(
        `⚠️ GAGAL KIRIM DATA: No. Surat ${newRec.srt} ganda/double (sudah dipakai ${conflict.nama}). Tidak bisa kirim data, unduh, atau cetak!`
      );
      return;
    }

    const recordWithId: EvacuationRecord = {
      ...newRec,
      id: newRec.id || `rec-${newRec.no}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setRecords((prev) => [recordWithId, ...prev]);
    saveRecordToServer(recordWithId, false).catch(() => {});
    setToastMessage(`Surat baru untuk ${newRec.nama} (${newRec.srt}) berhasil ditambahkan.`);
  };

  // Update existing Record
  const handleUpdateRecord = (updatedRec: EvacuationRecord) => {
    const conflict = findConflictingRecord(updatedRec.srt, records, updatedRec.no);
    if (conflict) {
      setToastMessage(
        `⚠️ GAGAL SIMPAN DATA: No. Surat ${updatedRec.srt} ganda/double dengan ${conflict.nama} (No. ${conflict.no})!`
      );
      return;
    }

    setRecords((prev) =>
      prev.map((item) =>
        (item.id && updatedRec.id && item.id === updatedRec.id) || item.no === updatedRec.no
          ? updatedRec
          : item
      )
    );
    saveRecordToServer(updatedRec, true).catch(() => {});
    setToastMessage(`Data pasien ${updatedRec.nama} (${updatedRec.srt}) berhasil diperbarui.`);
  };

  // Quick toggle checkbox for Sembuh / Kembali ke Kesatuan
  const handleToggleSembuh = (rec: EvacuationRecord) => {
    const isCurrentlySembuh = isRecordSembuh(rec);
    const newSembuh = !isCurrentlySembuh;
    const now = new Date();
    const todayStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const wasMeninggal = rec.status === 'MENINGGAL' || /\b(md|meninggal|gugur|wafat)\b/i.test(rec.ket || '');

    const updated: EvacuationRecord = {
      ...rec,
      isSembuh: newSembuh,
      tanggalSembuh: newSembuh ? (rec.tanggalSembuh || todayStr) : undefined,
      status: newSembuh && wasMeninggal ? 'SELESAI' : rec.status,
      ket: newSembuh ? (wasMeninggal ? 'SEMBUH/KEMBALI' : rec.ket) : (wasMeninggal ? 'BEROBAT' : rec.ket),
      lastEditedAt: new Date().toISOString(),
    };

    handleUpdateRecord(updated);
    toggleSembuhOnServer(rec.id, rec.no, newSembuh, todayStr).catch(() => {});
    setToastMessage(
      newSembuh
        ? `✅ Pasien ${rec.nama} berhasil ditandai SUDAH SEMBUH / KEMBALI KE KESATUAN.`
        : `ℹ️ Status kesembuhan pasien ${rec.nama} diubah kembali ke AKTIF PERAWATAN.`
    );
  };

  // Quick toggle checkbox for Meninggal Dunia (MD)
  const handleToggleMeninggal = (rec: EvacuationRecord) => {
    const isCurrentlyMeninggal =
      rec.status === 'MENINGGAL' || /\b(md|meninggal|gugur|wafat)\b/i.test(rec.ket || '');
    const newMeninggal = !isCurrentlyMeninggal;

    const updated: EvacuationRecord = {
      ...rec,
      status: newMeninggal ? 'MENINGGAL' : 'SELESAI',
      ket: newMeninggal ? 'MD' : 'BEROBAT',
      isSembuh: false,
      tanggalSembuh: undefined,
      lastEditedAt: new Date().toISOString(),
    };

    handleUpdateRecord(updated);
    setToastMessage(
      newMeninggal
        ? `🔴 Status kondisi pasien ${rec.nama} ditandai MENINGGAL DUNIA (MD).`
        : `ℹ️ Status kondisi pasien ${rec.nama} dikembalikan ke DALAM PERAWATAN.`
    );
  };

  // Batch auto-correct all existing records
  const handleAutoCorrectAll = () => {
    let changedCount = 0;
    const updated = records.map((rec) => {
      const res = autoCorrectRecordData(rec);
      if (res.hasChanges) {
        changedCount++;
        return {
          ...rec,
          ...res.values,
          kategori: determineCategory(
            res.values.nama, 
            res.values.identitas, 
            (res.values as unknown as EvacuationRecord).patientStatus
          ),
          status: determineStatus(res.values.ket, res.values.srt || ''),
          lastEditedAt: new Date().toISOString(),
        };
      }
      return rec;
    });

    if (changedCount > 0) {
      setRecords(updated);
      syncBatchToServer(updated, 'auto_correct').catch(() => {});
      setToastMessage(`✨ Berhasil merapikan penulisan ${changedCount} data pasien secara otomatis!`);
    } else {
      setToastMessage(`✨ Seluruh data (${records.length} pasien) sudah sesuai standar penulisan militer & medis.`);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (duplicateInfo.hasDuplicates) {
      setToastMessage(`⚠️ TIDAK DAPAT UNDUH: ${duplicateInfo.message}`);
      return;
    }

    const headers = [
      'No',
      'No Surat',
      'Tanggal',
      'Nama Pasien',
      'Kategori',
      'Pangkat/NRP/Identitas',
      'Kesatuan',
      'Diagnosa',
      'RS Asal',
      'RS Tujuan',
      'Moda',
      'Pendamping',
      'Keterangan',
    ];

    const rows = filteredRecords.map((r) => [
      r.no,
      `"${r.srt}"`,
      `"${r.tgl}"`,
      `"${r.nama}"`,
      `"${r.kategori}"`,
      `"${r.identitas}"`,
      `"${r.kesatuan}"`,
      `"${r.diag.replace(/"/g, '""')}"`,
      `"${r.asal}"`,
      `"${r.tujuan}"`,
      `"${r.moda}"`,
      `"${r.pendamping}"`,
      `"${r.ket.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_surat_evakuasi_kesdam_xvii_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (duplicateInfo.hasDuplicates) {
      setToastMessage(`⚠️ TIDAK DAPAT CETAK: ${duplicateInfo.message}`);
      return;
    }
    window.print();
  };

  const isScaledMobile = viewportMetrics.scale < 1;

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-transparent text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* BACKGROUND LORENG TNI AD (MALVINAS / WOODLAND - MODE PATRIOT) */}
      <TniCamoBackground isPatriotMode={isPatriotMode} config={activeWallpaperConfig} />

      <div
        id="siyankes-desktop-stage"
        className="relative z-10 flex flex-col min-h-screen w-full"
        style={
          isScaledMobile
            ? {
                width: `${DESIGN_WIDTH}px`,
                minWidth: `${DESIGN_WIDTH}px`,
                maxWidth: `${DESIGN_WIDTH}px`,
                zoom: viewportMetrics.scale,
                ['--stage-vh' as any]: viewportMetrics.stageVh,
              }
            : {
                ['--stage-vh' as any]: '100vh',
              }
        }
      >
        <Header isPatriotMode={isPatriotMode} />
        
        <SubNavbar
          totalCount={records.length}
          filteredCount={filteredRecords.length}
          onNewLetter={() => setIsNewLetterOpen(true)}
          onPrint={handlePrint}
          onDownload={handleExportCsv}
          onResetFilters={handleResetFilters}
          onAutoCorrectAll={role === 'superadmin' ? handleAutoCorrectAll : undefined}
          isFiltered={isFiltered}
          syncConfig={syncConfig}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onQuickSync={() => handlePerformSync(undefined, false)}
          isSyncing={isSyncing}
          onOpenVersionModal={() => setIsVersionModalOpen(true)}
          onOpenWallpaperModal={role === 'superadmin' || role === 'operator' ? () => setIsWallpaperModalOpen(true) : undefined}
          brightness={brightness}
          onChangeBrightness={(val) => setBrightness(Math.min(160, Math.max(60, val)))}
          isMultiDeviceConnected={isMultiDeviceConnected}
          user={user}
          role={role}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={handleLogout}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          onToggleLeftMenu={handleToggleLeftMenu}
        />

        <div className="flex flex-1 items-start w-full max-w-full gap-2 pl-0 sm:pl-0 ml-0 pr-2 sm:pr-3 pb-6">
          <LeftSidebar
            isOpenMobile={isLeftMenuOpenMobile}
            onCloseMobile={() => setIsLeftMenuOpenMobile(false)}
            isCollapsed={isLeftMenuCollapsedDesktop}
            onToggleCollapse={() => setIsLeftMenuCollapsedDesktop((prev) => !prev)}
            user={user}
            role={role}
            totalCount={records.length}
            filteredCount={filteredRecords.length}
            isFiltered={isFiltered}
            isSyncing={isSyncing}
            syncConfig={syncConfig}
            hasDuplicateSrt={duplicateInfo.hasDuplicates}
            activeSection={activeSection}
            onSelectSection={handleSelectSection}
            onResetFilters={handleResetFilters}
            onNewLetterModal={() => setIsNewLetterOpen(true)}
            onDownloadCsv={handleExportCsv}
            onPrint={handlePrint}
            onQuickSync={() => handlePerformSync(undefined, false)}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onAutoCorrectAll={role === 'superadmin' ? handleAutoCorrectAll : undefined}
            onOpenUserManagement={() => setIsUserManagementOpen(true)}
            onOpenLogin={() => setIsLoginOpen(true)}
            onLogout={handleLogout}
            onOpenVersionModal={() => setIsVersionModalOpen(true)}
            onOpenWallpaperModal={role === 'superadmin' || role === 'operator' ? () => setIsWallpaperModalOpen(true) : undefined}
            selectedCategory={selectedCategory}
            onFilterCategory={handleFilterCategory}
            filterOnlySembuh={filterOnlySembuh}
            onFilterSembuh={handleFilterSembuh}
            filterBatalRalat={filterBatalRalat}
            onFilterBatalRalat={handleFilterBatalRalat}
            filterMeninggal={filterMeninggal}
            onFilterMeninggal={handleFilterMeninggal}
            yearStats={yearStats}
            selectedYear={selectedYear}
            onSelectYear={handleFilterYear}
            stats={stats}
          />

          <main id="top-dashboard" className="flex-1 min-w-0 p-6 md:p-8 space-y-8 w-full box-3d-dimmed rounded-[2.5rem] border border-emerald-500/25 shadow-2xl transition-all duration-300">
            {!showOnlyRegister && (
              <>
                {/* PANEL HEADER: RINGKASAN OPERASIONAL */}
                <div className="mx-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0e2415]/90 via-[#0a1a0f]/95 to-[#06120a]/90 border border-emerald-500/30 shadow-lg mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                      <h1 className="text-sm font-black font-mono tracking-[0.2em] text-yellow-300 uppercase">
                        PANEL KONTROL OPERASIONAL SIYANKES
                      </h1>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-emerald-300/80 font-semibold">
                      <span>SISTEM: AKTIF</span>
                      <span className="w-[1px] h-3 bg-emerald-500/30"></span>
                      <span>LOKASI: KESDAM XVII/CENDERAWASIH</span>
                    </div>
                  </div>
                </div>
                {duplicateInfo.hasDuplicates && (
                  <div className="p-4 rounded-xl bg-red-950/90 border-2 border-red-500/60 text-red-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg no-print">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
                      <div>
                        <strong className="text-red-300 font-mono uppercase block">
                          PERINGATAN: NOMOR SURAT GANDA / DOUBLE TERDETEKSI!
                        </strong>
                        <span>{duplicateInfo.message}</span>
                      </div>
                    </div>
                  </div>
                )}
                <section className="space-y-4">
                  <KpiCards
                    total={stats.total}
                    militerCount={stats.militer}
                    persitCount={stats.persit}
                    anakCount={stats.anak}
                    pnsCount={stats.pns}
                    rspadCount={stats.rspad}
                    batalRalatCount={stats.batalRalat}
                    sembuhCount={stats.sembuh}
                    meninggalCount={stats.meninggal}
                    activeFilterCategory={selectedCategory}
                    activeFilterTujuan={selectedHospital}
                    activeFilterKet={filterBatalRalat}
                    activeFilterSembuh={filterOnlySembuh}
                    activeFilterMeninggal={filterMeninggal}
                    totalBerobat={stats.berobat}
                    categoryBreakdown={stats.breakdown}
                    hospitalBreakdown={stats.hospitalBreakdown}
                    onFilterTotal={handleFilterTotal}
                    onFilterCategory={handleFilterCategory}
                    onFilterTujuan={handleFilterTujuan}
                    onFilterBatalRalat={handleFilterBatalRalat}
                    onFilterSembuh={handleFilterSembuh}
                    onFilterMeninggal={handleFilterMeninggal}
                  />
                </section>

                <div id="charts-section">
                  <ChartsSection
                    data={filteredRecords}
                    selectedMonth={selectedMonth}
                    onSelectMonth={(m) => setSelectedMonth(m)}
                    selectedHospital={selectedHospital}
                    onSelectHospital={setSelectedHospital}
                    selectedOrigin={selectedOrigin}
                    onSelectOrigin={setSelectedOrigin}
                  />
                </div>
              </>
            )}

            <section id="data-table-section" className={showOnlyRegister ? '' : 'pt-4 border-t border-emerald-500/20'}>
              <DataTable
                data={filteredRecords}
                allRecords={records}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={handleFilterCategory}
                selectedHospital={selectedHospital}
                onHospitalChange={setSelectedHospital}
                selectedOrigin={selectedOrigin}
                onOriginChange={setSelectedOrigin}
                selectedYear={selectedYear}
                filterOnlySembuh={filterOnlySembuh}
                onToggleFilterOnlySembuh={handleFilterSembuh}
                filterBatalRalat={filterBatalRalat}
                filterMeninggal={filterMeninggal}
                forceOpenTable={showOnlyRegister}
                onResetFilters={handleResetFilters}
                onViewRecord={(rec) => setDetailRecord(rec)}
                onEditStatus={(rec) => user ? setEditRecord(rec) : setIsLoginOpen(true)}
                onToggleSembuh={(rec) => user ? handleToggleSembuh(rec) : setIsLoginOpen(true)}
                onToggleMeninggal={(rec) => user ? handleToggleMeninggal(rec) : setIsLoginOpen(true)}
              />
            </section>
          </main>
        </div>

        <footer className="mx-2 sm:mx-3 mb-2 rounded-2xl box-3d-dimmed border border-emerald-500/35 border-t-2 border-t-yellow-500/40 border-r-[3px] border-r-black/65 border-b-[4px] border-b-black/85 bg-gradient-to-r from-[#0a1b0f]/90 via-[#061109]/95 to-[#040b06]/90 backdrop-blur-xl py-3.5 text-xs text-slate-300 shadow-[0_14px_32px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.16)] no-print">
          <div className="max-w-[1600px] mx-auto px-4 flex flex-row flex-nowrap justify-between items-center gap-4 overflow-x-auto scrollbar-none whitespace-nowrap">
            {/* LEFT: BOX HENDRA */}
            <div className="flex items-center shrink-0">
              <span className="box-3d-card border-emerald-500/30 bg-[#0b1f11]/85 text-emerald-300 font-mono font-bold text-[10px] px-3.5 py-1.5 rounded-lg shadow-md flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="tracking-tight uppercase">&copy; 2026</span>
                <span className="w-[1px] h-3 bg-emerald-500/40 mx-0.5"></span>
                <span className="text-white uppercase font-black">Hendra.ND</span>
              </span>
            </div>

            {/* CENTER: BOX SIYANKES */}
            <div className="flex-1 flex justify-center shrink-0">
              <span className="box-3d-card border-emerald-500/40 bg-gradient-to-r from-[#0e2615]/90 via-[#13331c]/95 to-[#0e2615]/90 text-yellow-300 font-mono font-black text-[10px] px-4 py-1.5 rounded-lg shadow-md inline-flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]"></span>
                <span className="tracking-[0.1em] uppercase">SIYANKES KESDAM XVII/CENDERAWASIH</span>
              </span>
            </div>

            {/* RIGHT: AUTO UPDATE */}
            <div className="flex items-center shrink-0">
              <button
                onClick={() => setIsVersionModalOpen(true)}
                className="box-3d-card border-amber-500/40 bg-amber-950/75 text-amber-300 px-3.5 py-1.5 rounded-lg shadow-md font-mono font-black text-[10px] flex items-center gap-2 transition-all cursor-pointer hover:bg-amber-900/80 active:translate-y-0.5 group"
                title="Klik untuk membuka detail versi & catatan rilis"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="tracking-widest">V{APP_VERSION}</span>
                <span className="text-[9px] text-yellow-300/90 font-bold uppercase tracking-tighter">{APP_EDITION}</span>
              </button>
            </div>
          </div>
        </footer>
      </div>

      {toastMessage && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 sm:max-w-md bg-[#09180e]/95 border border-emerald-500/50 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between gap-3 text-xs animate-fadeIn backdrop-blur-md no-print">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-yellow-400 shrink-0 animate-pulse" />
            <span className="font-semibold text-slate-100">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MODALS */}
      {isWallpaperModalOpen && (
        <WallpaperModal
          isOpen={isWallpaperModalOpen}
          onClose={() => setIsWallpaperModalOpen(false)}
          config={activeWallpaperConfig}
          role={role}
          onUpdateConfig={handleUpdateWallpaper}
          onReset={handleResetWallpaper}
        />
      )}
      {detailRecord && <DetailModal record={detailRecord} allRecords={records} onClose={() => setDetailRecord(null)} />}
      {editRecord && <EditStatusModal record={editRecord} allRecords={records} onClose={() => setEditRecord(null)} onUpdateRecord={handleUpdateRecord} />}
      {isNewLetterOpen && <NewLetterModal isOpen={isNewLetterOpen} onClose={() => setIsNewLetterOpen(false)} nextNumber={records.length + 1} allRecords={records} onAddRecord={handleAddRecord} />}
      {isSyncModalOpen && <SyncModal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} syncConfig={syncConfig} onUpdateConfig={handleUpdateConfig} onManualSync={(url) => handlePerformSync(url, false)} onImportCsvText={handleImportCsvText} onResetToDefaultAsset={handleResetToDefaultAsset} preserveLocalEdits={preserveLocalEdits} onTogglePreserveLocalEdits={handleTogglePreserveLocalEdits} />}
      {isUserManagementOpen && <UserManagement onClose={() => setIsUserManagementOpen(false)} />}
      {isLoginOpen && (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setIsLoginOpen(false)}
        />
      )}
    </div>
  );
}

