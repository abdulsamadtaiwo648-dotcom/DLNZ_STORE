import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { OperationType, handleFirestoreError } from '../components/FirebaseProvider';
import { products as localProducts } from '../data';

const COLLECTION_NAME = 'products';

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      let dbProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      if (dbProducts.length === 0) {
        dbProducts = localProducts;
      }

      // Sort alphabetically by name
      const productsToUse = [...dbProducts].sort((a, b) => a.name.localeCompare(b.name));

      localStorage.setItem('dlnz-products', JSON.stringify(productsToUse));
      return productsToUse;
    } catch (error) {
      console.warn('Firestore fetch failed, using local cache:', error);
      const customLocal = localStorage.getItem('dlnz-products');
      if (customLocal) return JSON.parse(customLocal);
      return localProducts;
    }
  },

  subscribeToProducts(onUpdate: (products: Product[]) => void, onError?: (error: unknown) => void): () => void {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
    
    return onSnapshot(q, (querySnapshot) => {
      let dbProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      if (dbProducts.length === 0) {
        dbProducts = localProducts;
      }

      const productsToUse = [...dbProducts].sort((a, b) => a.name.localeCompare(b.name));
      
      localStorage.setItem('dlnz-products', JSON.stringify(productsToUse));
      onUpdate(productsToUse);
    }, (error) => {
      console.warn('Firestore subscription failed, falling back to local cache/defaults:', error);
      const customLocal = localStorage.getItem('dlnz-products');
      if (customLocal) {
        onUpdate(JSON.parse(customLocal));
      } else {
        onUpdate(localProducts);
      }
      if (onError) {
        onError(error);
      }
    });
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
      }
      const all = await this.getAllProducts();
      return all.find(p => p.id === id) || null;
    } catch (error) {
      const all = await this.getAllProducts();
      return all.find(p => p.id === id) || null;
    }
  },

  async createProduct(product: Omit<Product, 'id'>, customId?: string): Promise<string> {
    const id = customId || doc(collection(db, COLLECTION_NAME)).id;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const data = {
        ...product,
        updatedAt: serverTimestamp()
      };
      await setDoc(docRef, data);
      
      // Seed cache
      const all = await this.getAllProducts().catch(() => []);
      const newProduct = { id, ...product, updatedAt: new Date().toISOString() };
      localStorage.setItem('dlnz-products', JSON.stringify([...all.filter(p => p.id !== id), newProduct]));
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
      throw error;
    }
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      // Use setDoc with merge: true so that if a default product has not yet been seeded to Firestore
      // (or if it is missing), updating it will automatically create it in the database safely!
      await setDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Seed cache
      const all = await this.getAllProducts().catch(() => []);
      const nextProducts = all.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
      localStorage.setItem('dlnz-products', JSON.stringify(nextProducts));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      
      // Update cache
      const all = await this.getAllProducts().catch(() => []);
      const nextProducts = all.filter(p => p.id !== id);
      localStorage.setItem('dlnz-products', JSON.stringify(nextProducts));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  }
};
