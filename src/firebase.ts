import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
];

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

export const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

// Strictly in-memory OAuth access token cache (never stored in localStorage or sessionStorage)
let cachedSheetsAccessToken: string | null = null;

onAuthStateChanged(auth, (firebaseUser) => {
  if (!firebaseUser) {
    cachedSheetsAccessToken = null;
  }
});

export const signInGoogleSheets = async (): Promise<{
  email: string | null;
  displayName: string | null;
  accessToken: string;
}> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Token akses Google Sheets tidak tersedia. Silakan coba masuk kembali dan izinkan akses Google Sheets.');
    }
    cachedSheetsAccessToken = credential.accessToken;
    return {
      email: result.user.email,
      displayName: result.user.displayName,
      accessToken: credential.accessToken,
    };
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/popup-blocked') {
      throw new Error('Pop-up login Google diblokir oleh browser. Izinkan pop-up pada browser lalu coba kembali.');
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new Error('Login Google dibatalkan sebelum selesai.');
    }
    throw err;
  }
};

export const getSheetsAccessToken = (): string | null => cachedSheetsAccessToken;

export const clearSheetsAccessToken = (): void => {
  cachedSheetsAccessToken = null;
};

export const login = () => signInWithPopup(auth, provider);
export const logout = async () => {
  cachedSheetsAccessToken = null;
  await signOut(auth);
};
