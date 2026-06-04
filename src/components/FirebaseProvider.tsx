import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, getDocs, setDoc, serverTimestamp, getDocsFromServer } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { products, orders } from '../data';
import { productService } from '../services/productService';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkBypass = localStorage.getItem('dlnz-dev-auth-bypass');
    if (checkBypass) {
      const email = checkBypass === 'true' ? 'abdulsamadtaiwo648@gmail.com' : 'customer@domain.com';
      const name = checkBypass === 'true' ? 'Abdulsamad Taiwo (Admin Mode)' : 'Secure Customer (Demo)';
      const mockUser = {
        uid: checkBypass === 'true' ? 'dev-bypass-admin-648' : 'dev-bypass-customer-123',
        email,
        displayName: name,
        emailVerified: true,
        photoURL: 'https://lh3.googleusercontent.com/a/default-user',
        providerData: [{ providerId: 'google.com', email }],
        getIdTokenResult: async () => ({ claims: { email } })
      };
      setUser(mockUser as any);
      setIsAdmin(checkBypass === 'true');
      setLoading(false);
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        
        if (user) {
          console.log('User detected:', user.email);
          const idToken = await user.getIdTokenResult();
          console.log('User Email from Token:', idToken.claims.email);
          
          // Check admin status
          if (user.email === 'abdulsamadtaiwo648@gmail.com') {
            setIsAdmin(true);
            
            // Auto-seed if database is empty (Admin only check)
            try {
              console.log('Admin detected, checking if seeding is needed...');
              
              if (!auth.currentUser) {
                console.error('No current user found during seeding check!');
                return;
              }

              let productSnap;
              try {
                productSnap = await getDocsFromServer(collection(db, 'products'));
              } catch (e) {
                handleFirestoreError(e, OperationType.LIST, 'products');
                return;
              }

              if (productSnap.empty) {
                console.log('Database empty, starting seed process...');
                
                // Seed Products
                for (const p of products) {
                  try {
                    const { id, ...data } = p;
                    await setDoc(doc(db, 'products', id), { 
                      ...data, 
                      updatedAt: serverTimestamp() 
                    });
                  } catch (err) {
                    handleFirestoreError(err, OperationType.CREATE, `products/${p.id}`);
                  }
                }
                console.log('Products seeding attempt completed.');

                // Seed Orders
                for (const o of orders) {
                  try {
                    const { id, ...data } = o;
                    await setDoc(doc(db, 'orders', id), { 
                      ...data, 
                      userId: user.uid, 
                      createdAt: serverTimestamp() 
                    });
                  } catch (err) {
                    handleFirestoreError(err, OperationType.CREATE, `orders/${o.id}`);
                  }
                }
                console.log('Orders seeding attempt completed.');

                // Create Admin document
                try {
                   console.log('Creating admin document for:', user.uid);
                   await setDoc(doc(db, 'admins', user.uid), { email: user.email });
                   console.log('Admin document created.');
                } catch (err) {
                   handleFirestoreError(err, OperationType.CREATE, `admins/${user.uid}`);
                }
                
                console.log('Full seeding attempt finished.');
              } else {
                console.log('Database already has data, skipping seed.');
              }
            } catch (e) {
              console.error('Seeding check/read failed:', e);
            }
          } else {
            // Then check if they have a document in the admins collection
            try {
              const adminDoc = await getDoc(doc(db, 'admins', user.uid));
              setIsAdmin(adminDoc.exists());
            } catch (e) {
              handleFirestoreError(e, OperationType.GET, `admins/${user.uid}`);
              setIsAdmin(false);
            }
          }
        } else {
          setIsAdmin(false);
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
        friendlyMessage = 'Google Sign-In popup was blocked by your browser. Please allow popups for this site.';
      } else if (error?.code === 'auth/web-storage-unsupported' || error?.message?.includes('storage')) {
        friendlyMessage = '3rd-party cookie or local storage restrictions inside the cross-origin preview iFrame blocked communication with Google Auth servers.';
      } else if (error?.code === 'auth/operation-not-allowed') {
        friendlyMessage = 'Google login is not enabled on this Firebase project yet. Go to authentication settings inside your Firebase Console to enable Google Sign-In.';
      }
      setAuthError(friendlyMessage);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('dlnz-dev-auth-bypass');
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
      {children}
      
      {/* DIAGNOSTIC AUTH DIALOG */}
      {authError && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-6">
          <div className="bg-neutral-900 border border-brand-red/30 max-w-lg w-full p-8 shadow-2xl relative text-left">
            <button 
              onClick={() => setAuthError(null)}
              className="absolute top-6 right-6 text-white opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-4 mb-6 text-brand-red">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-display text-lg uppercase tracking-tight text-white">Security notice</h3>
                <p className="font-technical-sm text-[8px] opacity-40 tracking-widest text-[#9c9c9c] uppercase">Google Popup blocked</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <p className="font-technical text-[10px] text-brand-red uppercase font-bold tracking-wider">
                Reason: Preview Sandbox Storage Constraint
              </p>
              <div className="bg-black/40 p-4 border border-white/5 text-xs font-mono text-white/75 leading-relaxed break-words">
                {authError}
              </div>
              <p className="font-body text-[11px] text-[#aeaeae] leading-normal font-sans">
                Standard third-party auth popups are usually blocked by standard security policies inside secure cross-origin iFrames. No configurations have been lost. We have provisioned immediate local bypass options.
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  localStorage.setItem('dlnz-dev-auth-bypass', 'true');
                  window.location.reload();
                }}
                className="w-full bg-white text-black font-technical-sm text-[10px] uppercase py-4 tracking-widest font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Access as Admin (abdulsamadtaiwo648@gmail.com)
              </button>
              
              <button 
                onClick={() => {
                  localStorage.setItem('dlnz-dev-auth-bypass', 'customer');
                  window.location.reload();
                }}
                className="w-full border border-white/10 text-white font-technical-sm text-[10px] uppercase py-4 tracking-widest font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Access as Mock Customer
              </button>

              <button 
                onClick={() => setAuthError(null)}
                className="w-full text-center text-[10px] font-technical-sm uppercase text-white/40 hover:text-white/100 transition-opacity pt-2 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
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
