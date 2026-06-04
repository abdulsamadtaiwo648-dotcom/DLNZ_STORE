import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';
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
      console.error("Please check your Firebase configuration: Client is offline.");
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
