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
      const response = await fetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json() as Product[];
        localStorage.setItem('dlnz-products', JSON.stringify(data));
        return data;
      }
      throw new Error(`REST API returned status ${response.status}`);
    } catch (error) {
      console.warn('REST API fetch failed, falling back to Firestore client:", error');
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

        const productsToUse = [...dbProducts].sort((a, b) => a.name.localeCompare(b.name));
        localStorage.setItem('dlnz-products', JSON.stringify(productsToUse));
        return productsToUse;
      } catch (fsError) {
        console.warn('Firestore fallback fetch failed, using local cache:', fsError);
        const customLocal = localStorage.getItem('dlnz-products');
        if (customLocal) return JSON.parse(customLocal);
        return localProducts;
      }
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
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...product, id: customId })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Update cache
      const all = await this.getAllProducts().catch(() => []);
      const newProduct = { id: data.id, ...product, updatedAt: new Date().toISOString() };
      localStorage.setItem('dlnz-products', JSON.stringify([...all.filter(p => p.id !== data.id), newProduct]));
      return data.id;
    } catch (error) {
      console.error('Backend createProduct failed:', error);
      throw error;
    }
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Update cache
      const all = await this.getAllProducts().catch(() => []);
      const nextProducts = all.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
      localStorage.setItem('dlnz-products', JSON.stringify(nextProducts));
    } catch (error) {
      console.error('Backend updateProduct failed:', error);
      throw error;
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Update cache
      const all = await this.getAllProducts().catch(() => []);
      const nextProducts = all.filter(p => p.id !== id);
      localStorage.setItem('dlnz-products', JSON.stringify(nextProducts));
    } catch (error) {
      console.error('Backend deleteProduct failed:', error);
      throw error;
    }
  }
};
