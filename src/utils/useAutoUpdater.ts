import { useState, useEffect, useCallback, useRef } from 'react';
import { APP_VERSION, APP_BUILD_TIMESTAMP } from './version';

export interface ServerVersionInfo {
  version: string;
  buildTime: number;
  buildDate?: string;
  appName?: string;
  edition?: string;
}

export function useAutoUpdater() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [serverVersion, setServerVersion] = useState<ServerVersionInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [checkStatusMessage, setCheckStatusMessage] = useState<string | null>(null);

  const countdownTimerRef = useRef<number | null>(null);

  const compareVersions = (v1: string, v2: string) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  };

  // Perform version check against /version.json
  const checkForUpdates = useCallback(async (isManual = false): Promise<boolean> => {
    setIsChecking(true);
    if (isManual) {
      setCheckStatusMessage('Memeriksa rilis terbaru ke server...');
    }
    try {
      // Force non-cached request
      const cacheBuster = `_t=${Date.now()}&_r=${Math.random().toString(36).substring(7)}`;
      const res = await fetch(`/version.json?${cacheBuster}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });

      if (!res.ok) {
        if (isManual) {
          setCheckStatusMessage('Server siap. Tidak ada pembaruan baru.');
          setTimeout(() => setCheckStatusMessage(null), 3000);
        }
        setIsChecking(false);
        return false;
      }

      const text = await res.text();
      let data: ServerVersionInfo;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse version.json:', text.substring(0, 50));
        setIsChecking(false);
        return false;
      }
      setLastCheckTime(new Date());

      // Check if buildTime is newer or version is greater and not already applied
      const appliedBuildTime = Number(localStorage.getItem('kesdam_applied_build_time') || 0);
      const isBuildNewer = data.buildTime && data.buildTime > APP_BUILD_TIMESTAMP && data.buildTime > appliedBuildTime;
      const isVersionNewer = data.version && compareVersions(data.version, APP_VERSION) > 0;

      if (isBuildNewer || isVersionNewer) {
        setServerVersion(data);
        setHasUpdate(true);
        if (!isDismissed && countdown === null) {
          setCountdown(5); // Auto countdown 5s
        }
        if (isManual) {
          setCheckStatusMessage(`Versi baru ditemukan: v${data.version}!`);
        }
        setIsChecking(false);
        return true;
      } else {
        if (isManual) {
          setCheckStatusMessage(`Aplikasi sudah merupakan versi terbaru (v${APP_VERSION}).`);
          setTimeout(() => setCheckStatusMessage(null), 3500);
        }
        setIsChecking(false);
        return false;
      }
    } catch {
      if (isManual) {
        setCheckStatusMessage('Gagal memeriksa rilis (koneksi offline/gangguan).');
        setTimeout(() => setCheckStatusMessage(null), 3500);
      }
      setIsChecking(false);
      return false;
    }
  }, [countdown, isDismissed]);

  // Execute clean application reload
  const applyUpdate = useCallback(async () => {
    try {
      if (serverVersion?.buildTime) {
        localStorage.setItem('kesdam_applied_build_time', String(serverVersion.buildTime));
      }
      // 1. Clear Cache API
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (e) {
      console.warn('Cache purge warning:', e);
    }

    try {
      // 2. Unregister Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (e) {
      console.warn('Service worker purge warning:', e);
    }

    // 3. Mark last updated build in localStorage
    if (serverVersion?.buildTime) {
      localStorage.setItem('kesdam_last_updated_build', String(serverVersion.buildTime));
    }
    localStorage.setItem('kesdam_installed_version', serverVersion?.version || APP_VERSION);
    localStorage.setItem('kesdam_updated_at', new Date().toISOString());

    // 4. Force hard reload bypassing browser cache
    const targetUrl = `${window.location.origin}${window.location.pathname}?republish=${Date.now()}`;
    window.location.replace(targetUrl);
  }, [serverVersion]);

  // Handle countdown
  useEffect(() => {
    if (countdown === null || countdown <= 0 || isDismissed) {
      if (countdown === 0 && !isDismissed) {
        applyUpdate();
      }
      return;
    }

    countdownTimerRef.current = window.setTimeout(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [countdown, isDismissed, applyUpdate]);

  // Initial check on mount + Periodic check every 30s + Focus/Visibility checks
  useEffect(() => {
    // 1. Initial check shortly after mount (fast 400ms check)
    const initTimer = setTimeout(() => {
      checkForUpdates(false);
    }, 400);

    // 2. Periodic interval (every 20 seconds)
    const intervalTimer = setInterval(() => {
      checkForUpdates(false);
    }, 20000);

    // 3. Focus / Visibility check (trigger immediately when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates(false);
      }
    };

    const handleFocus = () => {
      checkForUpdates(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(initTimer);
      clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkForUpdates]);

  const dismissCountdown = () => {
    setIsDismissed(true);
    setCountdown(null);
  };

  return {
    hasUpdate,
    serverVersion,
    isChecking,
    lastCheckTime,
    countdown,
    isDismissed,
    checkStatusMessage,
    checkForUpdates,
    applyUpdate,
    dismissCountdown,
  };
}
