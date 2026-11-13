export interface AppUserAccount {
  uid: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  role: 'superadmin' | 'operator' | 'guest';
  createdAt: string;
}

export const DEFAULT_USERS: AppUserAccount[] = [
  {
    uid: 'admin-hendra',
    username: 'hendra',
    password: '101110',
    name: 'Hendra (Admin)',
    email: 'egahnd@gmail.com',
    role: 'superadmin',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    uid: 'opr-vevi',
    username: 'vevi',
    password: 'vevi123',
    name: 'Opr 1',
    email: 'vevi@kesdam.local',
    role: 'operator',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    uid: 'opr-sugi',
    username: 'sugi',
    password: 'sugi123',
    name: 'Opr 2',
    email: 'sugi@kesdam.local',
    role: 'operator',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    uid: 'opr-icha',
    username: 'icha',
    password: 'icha123',
    name: 'Adm.Yankes',
    email: 'icha@kesdam.local',
    role: 'operator',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    uid: 'opr-andriani',
    username: 'andriani',
    password: 'wayang123',
    name: 'Paur Yankes',
    email: 'andriani@kesdam.local',
    role: 'operator',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export function encodeSessionToken(user: Omit<AppUserAccount, 'password' | 'createdAt'>): string {
  const payload = {
    uid: user.uid,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    ts: Date.now(),
  };
  const jsonStr = JSON.stringify(payload);
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    const b64 = window.btoa(unescape(encodeURIComponent(jsonStr)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return `session_v2.${b64}`;
  }
  return `session:${user.uid}:${Date.now()}`;
}

export function decodeSessionToken(token: string): Omit<AppUserAccount, 'password' | 'createdAt'> | null {
  try {
    if (!token || !token.startsWith('session_v2.')) return null;
    const b64Url = token.slice('session_v2.'.length);
    const b64 = b64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    let jsonStr = '';
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      jsonStr = decodeURIComponent(escape(window.atob(padded)));
    } else if (typeof Buffer !== 'undefined') {
      jsonStr = Buffer.from(padded, 'base64').toString('utf-8');
    }
    if (!jsonStr) return null;
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.uid && parsed.username && parsed.role) {
      return {
        uid: String(parsed.uid),
        username: String(parsed.username),
        name: String(parsed.name || parsed.username),
        email: String(parsed.email || `${parsed.username}@kesdam.local`),
        role: parsed.role,
      };
    }
    return null;
  } catch {
    return null;
  }
}
