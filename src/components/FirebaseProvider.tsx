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

  useEffect(() => {
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
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
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
