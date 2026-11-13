import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, X, AlertCircle } from 'lucide-react';
import { DEFAULT_USERS, encodeSessionToken, AppUserAccount } from '../data/defaultUsers';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
  onClose?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tryLocalFallbackAuth = (rawUser: string, rawPass: string) => {
    const cleanUser = rawUser.trim().toLowerCase();
    const cleanPass = rawPass.trim();

    let combinedUsers: AppUserAccount[] = [...DEFAULT_USERS];
    try {
      const cached = localStorage.getItem('kesdam_users_cache_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          for (const u of parsed) {
            if (u && u.username && !combinedUsers.some((d) => d.username.toLowerCase() === String(u.username).toLowerCase())) {
              combinedUsers.push(u);
            }
          }
        }
      }
    } catch {}

    const found = combinedUsers.find(
      (u) =>
        (u.username.toLowerCase() === cleanUser ||
          (u.email && u.email.toLowerCase() === cleanUser) ||
          (u.name && u.name.toLowerCase() === cleanUser)) &&
        u.password &&
        (u.password.trim() === cleanPass || u.password.trim().toLowerCase() === cleanPass.toLowerCase())
    );

    if (!found) return null;

    const safeUser = {
      uid: found.uid,
      username: found.username,
      name: found.name || found.username,
      email: found.email,
      role: found.role,
    };
    const token = encodeSessionToken(safeUser);
    return { user: safeUser, token };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Mohon masukkan username dan password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        try {
          localStorage.setItem('kesdam_active_user_v1', JSON.stringify(data.user));
        } catch {}
        onLoginSuccess(data.user, data.token);
        return;
      }

      // Fallback ke daftar akun permanen / cache lokal jika instance belum tersinkron
      const fallback = tryLocalFallbackAuth(username, password);
      if (fallback) {
        try {
          localStorage.setItem('kesdam_active_user_v1', JSON.stringify(fallback.user));
        } catch {}
        onLoginSuccess(fallback.user, fallback.token);
        return;
      }

      throw new Error(data.error || 'Login gagal. Periksa username dan password.');
    } catch (err: any) {
      const fallback = tryLocalFallbackAuth(username, password);
      if (fallback) {
        try {
          localStorage.setItem('kesdam_active_user_v1', JSON.stringify(fallback.user));
        } catch {}
        onLoginSuccess(fallback.user, fallback.token);
        return;
      }
      setError(err.message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn no-print">
      <div className="box-3d-glass !rounded-2xl border-yellow-500/40 bg-gradient-to-b from-[#112416] via-[#09150d] to-[#040805] text-white p-6 sm:p-8 w-full max-w-md shadow-[0_0_50px_rgba(16,185,129,0.2)] relative">
        
        {/* Tombol Tutup */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
            title="Tutup dialog masuk"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Dialog */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-36 h-22 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-emerald-500/20 border border-yellow-400/30 mb-3 p-1.5 shadow-inner overflow-hidden">
            <img src="/brevet.png" alt="Brevet Kesehatan Militer TNI AD" className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(250,204,21,0.5)]" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-yellow-400 uppercase font-mono tracking-wider drop-shadow">
            Masuk Sistem SIYANKES
          </h2>
          <p className="text-xs text-emerald-300/80 font-mono mt-1">
            KESDAM XVII / CENDERAWASIH
          </p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-yellow-400" />
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username (contoh: vevi, sugi, icha, andriani)"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                className="w-full bg-black/50 border border-emerald-500/30 focus:border-yellow-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition font-mono"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-yellow-400" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="current-password"
                className="w-full bg-black/50 border border-emerald-500/30 focus:border-yellow-400 rounded-xl px-4 py-2.5 pr-11 text-sm text-white placeholder-slate-500 outline-none transition font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}


          <button
            type="submit"
            disabled={isLoading}
            className="w-full box-3d-card !from-amber-500 !via-amber-600 !to-amber-800 border-amber-400/50 text-white font-black py-2.5 rounded-xl uppercase tracking-wider text-sm transition cursor-pointer shadow-lg hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Memproses Masuk...' : 'Masuk Sekarang'}
          </button>
        </form>

        <div className="mt-5 pt-3.5 border-t border-emerald-500/20 text-center">
          <div className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-950/85 border border-emerald-400/60 shadow-inner w-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="text-xs sm:text-[12px] text-emerald-200 font-mono font-bold tracking-wide leading-relaxed">
              Tamu tanpa login tetap dapat melihat data evakuasi pasien (View-Only).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
