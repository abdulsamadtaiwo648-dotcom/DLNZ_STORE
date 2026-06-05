import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, getDocs, setDoc, serverTimestamp, getDocsFromServer } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { products, orders } from '../data';
import { productService } from '../services/productService';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('dlnz-admin-authorized') === 'true';
      }
    } catch (_) {}
    return false;
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        
        if (user) {
          console.log('User detected:', user.email);
          
          // Determine Admin authorization:
          // ONLY the master admin email 'abdulsamadtaiwo648@gmail.com' is allowed.
          const isMasterAdmin = user.email === 'abdulsamadtaiwo648@gmail.com';
          setIsAdmin(isMasterAdmin);
          
          if (isMasterAdmin) {
            localStorage.setItem('dlnz-admin-authorized', 'true');
          } else {
            localStorage.removeItem('dlnz-admin-authorized');
          }
        } else {
          setIsAdmin(false);
          localStorage.removeItem('dlnz-admin-authorized');
        }
      } catch (error) {
        console.error('Auth logic error:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  const login = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Login failed:', error);
      let friendlyMessage = error?.message || String(error);
      if (error?.code === 'auth/popup-blocked') {
        friendlyMessage = 'Google Sign-In popup was blocked by your browser. Please allow popups or open the app in a new tab.';
      } else if (error?.code === 'auth/web-storage-unsupported' || error?.message?.includes('storage')) {
        friendlyMessage = 'Your browser blocks 3rd-party cookie storage inside standard cross-origin frames. Open in New Tab at the top right to log in.';
      } else if (error?.code === 'auth/operation-not-allowed') {
        friendlyMessage = 'Google sign-in is not enabled on this Firebase project yet.';
      }
      setAuthError(friendlyMessage);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setAuthError(null);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      console.error('Email login failed:', error);
      let friendlyMessage = error?.message || String(error);
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/user-not-found' || error?.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid credentials. Please check your email and password.';
      } else if (error?.code === 'auth/user-disabled') {
        friendlyMessage = 'This account has been disabled.';
      } else if (error?.code === 'auth/operation-not-allowed') {
        friendlyMessage = 'Email/Password authentication is disabled. Please enable it in the Firebase authentication console.';
      }
      setAuthError(friendlyMessage);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    try {
      setAuthError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        setUser({ ...userCredential.user, displayName: name } as User);
      }
    } catch (error: any) {
      console.error('Email registration failed:', error);
      let friendlyMessage = error?.message || String(error);
      if (error?.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email address is already registered on this project database.';
      } else if (error?.code === 'auth/weak-password') {
        friendlyMessage = 'The password is too weak. Ensure it is at least 6 characters.';
      } else if (error?.code === 'auth/operation-not-allowed') {
        friendlyMessage = 'Email/Password registration is disabled in your Firebase console authentication tab.';
      }
      setAuthError(friendlyMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin, 
      loading, 
      login, 
      loginWithEmail, 
      registerWithEmail, 
      logout, 
      authError, 
      setAuthError,
      isAuthModalOpen,
      setIsAuthModalOpen
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
};

// mandated error handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
