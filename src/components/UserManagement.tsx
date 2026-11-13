import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  KeyRound, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Shield, 
  Users, 
  Lock, 
  User, 
  RefreshCw, 
  Edit3, 
  Save, 
  Check, 
  Mail 
} from 'lucide-react';

import { DEFAULT_USERS } from '../data/defaultUsers';

interface UserData {
  uid: string;
  username: string;
  email: string;
  name?: string;
  role: 'superadmin' | 'operator' | 'guest';
  createdAt?: string;
}

interface UserManagementProps {
  onClose: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onClose }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'superadmin' | 'operator' | 'guest'>('operator');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit state
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    username: string;
    name: string;
    email: string;
    password: string;
    role: 'superadmin' | 'operator' | 'guest';
  }>({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'operator',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Gagal mengambil daftar pengguna.');
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err: any) {
      console.error(err);
      // Fallback ke DEFAULT_USERS bila koneksi terganggu
      setUsers(DEFAULT_USERS.map(({ password: _, ...rest }) => rest));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setFeedback({ type: 'error', message: 'Username dan Password wajib diisi.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.trim(),
          name: name.trim() || username.trim(),
          password: password.trim(),
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal membuat akun baru.');
      }

      // Simpan ke cache lokal agar langsung dapat login tanpa jeda
      try {
        const cachedRaw = localStorage.getItem('kesdam_users_cache_v1');
        const cachedList = cachedRaw ? JSON.parse(cachedRaw) : [];
        const newCached = [
          ...(Array.isArray(cachedList) ? cachedList.filter((u: any) => u.username?.toLowerCase() !== username.trim().toLowerCase()) : []),
          {
            ...data.user,
            password: password.trim(),
          },
        ];
        localStorage.setItem('kesdam_users_cache_v1', JSON.stringify(newCached));
      } catch {}

      setFeedback({ type: 'success', message: `Akun "${username}" (${name.trim() || username.trim()}) dengan peran ${role.toUpperCase()} berhasil dibuat dan siap login!` });
      setUsername('');
      setName('');
      setPassword('');
      setRole('operator');
      fetchUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (uid: string, targetUsername: string, newRole: string) => {
    try {
      const res = await fetch('/api/users/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ uid, role: newRole }),
      });

      if (!res.ok) {
        throw new Error('Gagal memperbarui hak akses.');
      }

      setUsers(prev => prev.map(u => (u.uid === uid ? { ...u, role: newRole as any } : u)));
      setFeedback({ type: 'success', message: `Hak akses akun "${targetUsername}" diubah menjadi ${newRole.toUpperCase()}.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memperbarui peran.' });
    }
  };

  const handleStartEdit = (user: UserData) => {
    setEditingUid(user.uid);
    setEditForm({
      username: user.username,
      name: user.name || user.username,
      email: user.email || '',
      password: '',
      role: user.role,
    });
    setFeedback(null);
  };

  const handleCancelEdit = () => {
    setEditingUid(null);
  };

  const handleSaveEdit = async (uid: string) => {
    if (!editForm.username.trim()) {
      setFeedback({ type: 'error', message: 'Username tidak boleh kosong.' });
      return;
    }

    setIsSavingEdit(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid,
          username: editForm.username.trim(),
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          password: editForm.password.trim() || undefined,
          role: editForm.role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan perubahan akun.');
      }

      setUsers(prev => prev.map(u => (u.uid === uid ? { ...u, ...data.user } : u)));
      
      // If current logged-in user is updated, sync local storage
      try {
        const saved = localStorage.getItem('kesdam_user_auth');
        if (saved) {
          const current = JSON.parse(saved);
          if (current.uid === uid || current.username === editForm.username) {
            localStorage.setItem('kesdam_user_auth', JSON.stringify({ ...current, ...data.user }));
          }
        }
      } catch {}

      setFeedback({ type: 'success', message: `Data akun "${editForm.username}" berhasil diperbarui!` });
      setEditingUid(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Terjadi kesalahan saat menyimpan.' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteUser = async (uid: string, targetUsername: string) => {
    if (targetUsername === 'hendra' || uid === 'admin-hendra') {
      setFeedback({ type: 'error', message: 'Akun Super Admin utama hendra tidak boleh dihapus.' });
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus akun pengguna "${targetUsername}"?`)) {
      return;
    }

    try {
      const res = await fetch('/api/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ uid }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghapus pengguna.');
      }

      setUsers(prev => prev.filter(u => u.uid !== uid));
      if (editingUid === uid) {
        setEditingUid(null);
      }
      setFeedback({ type: 'success', message: `Akun "${targetUsername}" berhasil dihapus.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menghapus pengguna.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn no-print">
      <div className="box-3d-glass !rounded-2xl border-emerald-500/40 bg-gradient-to-b from-[#102315] via-[#09150d] to-[#040805] text-white w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-emerald-950/80 via-[#0e2214]/90 to-amber-950/30 border-b border-emerald-500/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-yellow-400 uppercase font-mono tracking-wide">
                Pengaturan Tambah Akun &amp; Hak Akses
              </h2>
              <p className="text-xs text-emerald-300/80 font-mono">
                Kelola akun operator spreadsheet, pengajuan surat evakuasi, dan hak lihat data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className={`mx-4 sm:mx-6 mt-4 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' 
              : 'bg-red-950/60 border-red-500/50 text-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="p-1 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body with Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Form Tambah Akun Baru */}
          <div className="p-4 sm:p-5 rounded-xl bg-black/40 border border-emerald-500/25">
            <h3 className="text-sm font-bold text-emerald-300 uppercase font-mono flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-yellow-400" />
              Tambah Akun Pengguna Baru
            </h3>
            
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Username Akun <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: operator_kesdam"
                    className="w-full bg-black/60 border border-emerald-500/30 focus:border-yellow-400 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Nama Lengkap / Jabatan
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Peltu Budi (Staf Evakuasi)"
                    className="w-full bg-black/60 border border-emerald-500/30 focus:border-yellow-400 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password akun"
                    className="w-full bg-black/60 border border-emerald-500/30 focus:border-yellow-400 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Hak Akses (Peran) <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-black/60 border border-emerald-500/30 focus:border-yellow-400 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono cursor-pointer"
                  >
                    <option value="operator" className="bg-[#09150d] text-white">Operator (Bisa Edit Data & Buat Surat)</option>
                    <option value="guest" className="bg-[#09150d] text-white">Tamu / Guest (Hanya Lihat / View-Only)</option>
                    <option value="superadmin" className="bg-[#09150d] text-white">Super Admin (Akses Penuh Kelola Akun)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="box-3d-card !from-emerald-600 !via-emerald-700 !to-emerald-900 border-emerald-400/50 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-xs uppercase tracking-wider transition cursor-pointer shadow-md hover:scale-[1.01] disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4 text-yellow-300" />
                  <span>{isSubmitting ? 'Menyimpan Akun...' : 'Simpan & Beri Hak Akses'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Daftar Akun Terdaftar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Daftar Akun Pengguna Terdaftar ({users.length})
              </h3>
              <button
                onClick={fetchUsers}
                disabled={isLoading}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition cursor-pointer"
                title="Muat ulang daftar"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-yellow-400' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            <div className="space-y-3">
              {users.map((u) => {
                const isSuperHendra = u.username === 'hendra';
                const isEditing = editingUid === u.uid;

                if (isEditing) {
                  return (
                    <div
                      key={u.uid}
                      className="p-4 rounded-xl bg-gradient-to-br from-[#14281a] to-[#0a180e] border-2 border-yellow-500/60 shadow-lg animate-fadeIn space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-yellow-500/20">
                        <div className="flex items-center gap-2 text-yellow-400 font-mono font-bold text-xs uppercase">
                          <Edit3 className="w-4 h-4" />
                          <span>Edit Akun: {u.username}</span>
                          {isSuperHendra && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                              Akun Utama
                            </span>
                          )}
                        </div>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                          title="Batal Edit"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-300 font-mono mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            disabled={isSuperHendra}
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            className="w-full bg-black/60 border border-emerald-500/30 focus:border-yellow-400 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-mono mb-1">
                            Nama Lengkap / Jabatan
                          </label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full bg-black/60 border border-emerald-500/30 focus:border-yellow-400 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
                            placeholder="Nama Lengkap atau Satuan"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-mono mb-1">
                            Email (Opsional)
                          </label>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="w-full bg-black/60 border border-emerald-500/30 focus:border-yellow-400 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
                            placeholder="nama@kesdam.local"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-mono mb-1">
                            Password Baru (Kosongkan jika tidak diubah)
                          </label>
                          <input
                            type="password"
                            value={editForm.password}
                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                            className="w-full bg-black/60 border border-emerald-500/30 focus:border-yellow-400 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
                            placeholder="Masukkan password baru"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-slate-300 font-mono mb-1">
                            Hak Akses (Peran)
                          </label>
                          <select
                            disabled={isSuperHendra}
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                            className="w-full bg-black/60 border border-emerald-500/30 focus:border-yellow-400 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="superadmin" className="bg-[#09150d] text-white">Super Admin (Akses Penuh Kelola Akun &amp; Edit)</option>
                            <option value="operator" className="bg-[#09150d] text-white">Operator (Bisa Edit Data &amp; Buat Surat)</option>
                            <option value="guest" className="bg-[#09150d] text-white">Tamu / Guest (Hanya Lihat / View-Only)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono transition cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={isSavingEdit}
                          onClick={() => handleSaveEdit(u.uid)}
                          className="box-3d-card !from-amber-500 !via-amber-600 !to-amber-800 border-amber-400/50 text-white font-bold px-4 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={u.uid}
                    className="p-3.5 rounded-xl bg-black/50 border border-emerald-500/20 hover:border-emerald-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border ${
                        u.role === 'superadmin'
                          ? 'bg-amber-500/20 border-amber-400/40 text-amber-400'
                          : u.role === 'operator'
                          ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400'
                          : 'bg-slate-700/40 border-slate-500/40 text-slate-300'
                      }`}>
                        {u.role === 'superadmin' ? (
                          <ShieldCheck className="w-5 h-5" />
                        ) : u.role === 'operator' ? (
                          <Shield className="w-5 h-5" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-white text-sm">
                            {u.username}
                          </span>
                          {isSuperHendra && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono">
                              AKUN UTAMA
                            </span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                            u.role === 'superadmin' 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' 
                              : u.role === 'operator' 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                              : 'bg-slate-600/30 text-slate-300 border border-slate-500/30'
                          }`}>
                            {u.role === 'superadmin' ? 'Super Admin' : u.role === 'operator' ? 'Operator' : 'Guest'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                          <span>{u.name || u.username}</span>
                          <span>•</span>
                          <span className="text-slate-500 text-[11px]">{u.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                      <select
                        value={u.role}
                        disabled={isSuperHendra}
                        onChange={(e) => handleUpdateRole(u.uid, u.username, e.target.value)}
                        className={`bg-black/60 border rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none cursor-pointer ${
                          u.role === 'superadmin'
                            ? 'text-amber-300 border-amber-500/40'
                            : u.role === 'operator'
                            ? 'text-emerald-300 border-emerald-500/40'
                            : 'text-slate-300 border-slate-500/40'
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                        title="Ubah Hak Akses Cepat"
                      >
                        <option value="superadmin" className="bg-[#09150d] text-white">Super Admin</option>
                        <option value="operator" className="bg-[#09150d] text-white">Operator</option>
                        <option value="guest" className="bg-[#09150d] text-white">Tamu (View-Only)</option>
                      </select>

                      {/* Tombol Edit Akun */}
                      <button
                        onClick={() => handleStartEdit(u)}
                        className="box-3d-card !from-amber-600/90 !via-amber-700/90 !to-amber-900/90 border-amber-400/40 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 text-xs font-mono transition cursor-pointer hover:scale-105"
                        title="Edit data akun (username, nama, password, peran)"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Edit</span>
                      </button>

                      {!isSuperHendra && (
                        <button
                          onClick={() => handleDeleteUser(u.uid, u.username)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          title="Hapus akun pengguna ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 sm:p-4 bg-black/60 border-t border-emerald-500/20 text-center text-[11px] text-slate-400 font-mono shrink-0">
          Super Admin dapat menambah dan mengedit akun tak terbatas untuk operator rumah sakit dan poskes jajaran Kodam XVII/Cenderawasih.
        </div>
      </div>
    </div>
  );
};
