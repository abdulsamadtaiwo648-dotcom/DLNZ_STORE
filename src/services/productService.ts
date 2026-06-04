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
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { products as localProducts } from '../data';
import { OperationType, handleFirestoreError } from '../components/FirebaseProvider';

const COLLECTION_NAME = 'products';

export const productService = {
  async getAllProducts(): Promise<Product[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        const customLocal = localStorage.getItem('dlnz-products');
        if (customLocal) return JSON.parse(customLocal);
        return localProducts;
      }
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      localStorage.setItem('dlnz-products', JSON.stringify(data));
      return data;
    } catch (error) {
      console.warn('Firestore fetch failed, using local cache:', error);
      const customLocal = localStorage.getItem('dlnz-products');
      if (customLocal) return JSON.parse(customLocal);
      return localProducts;
    }
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
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
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
