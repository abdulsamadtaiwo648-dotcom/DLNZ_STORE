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
      if (querySnapshot.empty) return localProducts;
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
    } catch (error) {
      console.warn('Firestore fetch failed, using local data:', error);
      return localProducts;
    }
  },

  async getProductById(id: string): Promise<Product | null> {
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
      }
      return localProducts.find(p => p.id === id) || null;
    } catch (error) {
      return localProducts.find(p => p.id === id) || null;
    }
  },

  async createProduct(product: Omit<Product, 'id'>, customId?: string): Promise<string> {
    try {
      const id = customId || doc(collection(db, COLLECTION_NAME)).id;
      const docRef = doc(db, COLLECTION_NAME, id);
      const data = {
        ...product,
        updatedAt: serverTimestamp()
      };
      await setDoc(docRef, data);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      return '';
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
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
