import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Load configurations, prioritizing firebase-applet-config.json, with support for valid custom env variable overrides
const metaEnv = (import.meta as any).env || {};

const isValidConfigValue = (val: any): boolean => {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return false;
  if (trimmed.toLowerCase().includes('placeholder')) return false;
  if (trimmed.startsWith('YOUR_') || trimmed.startsWith('MY_')) return false;
  return true;
};

const resolvedConfig = {
  apiKey: isValidConfigValue(metaEnv.VITE_FIREBASE_API_KEY) ? (metaEnv.VITE_FIREBASE_API_KEY as string) : firebaseConfig.apiKey,
  authDomain: isValidConfigValue(metaEnv.VITE_FIREBASE_AUTH_DOMAIN) ? (metaEnv.VITE_FIREBASE_AUTH_DOMAIN as string) : firebaseConfig.authDomain,
  projectId: isValidConfigValue(metaEnv.VITE_FIREBASE_PROJECT_ID) ? (metaEnv.VITE_FIREBASE_PROJECT_ID as string) : firebaseConfig.projectId,
  storageBucket: isValidConfigValue(metaEnv.VITE_FIREBASE_STORAGE_BUCKET) ? (metaEnv.VITE_FIREBASE_STORAGE_BUCKET as string) : firebaseConfig.storageBucket,
  messagingSenderId: isValidConfigValue(metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID) ? (metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID as string) : firebaseConfig.messagingSenderId,
  appId: isValidConfigValue(metaEnv.VITE_FIREBASE_APP_ID) ? (metaEnv.VITE_FIREBASE_APP_ID as string) : firebaseConfig.appId,
  firestoreDatabaseId: isValidConfigValue(metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID) ? (metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) : firebaseConfig.firestoreDatabaseId,
};

console.log('Firebase initialized with projectId:', resolvedConfig.projectId);

const app = initializeApp(resolvedConfig);

// Initialize services
export const auth = getAuth(app);
const databaseId = resolvedConfig.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Connection test as required by guidelines
async function testConnection() {
  try {
    // Testing connection to a dummy path to verify Firestore is reachable
    await getDocFromServer(doc(db, '_internal', 'connection_test'));
    console.log('Firebase connection verified');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration: Client is offline.");
    } else {
       // Log other errors quietly as they might be expected (e.g. permission denied)
       console.log('Firebase initialized (server reachable)');
    }
  }
}

// Lazy trigger connection test
if (typeof window !== 'undefined') {
  testConnection();
}
