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
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';
import { OperationType, handleFirestoreError } from '../components/FirebaseProvider';
import { orders as localOrders } from '../data';

const COLLECTION_NAME = 'orders';

export const orderService = {
  async getAllOrders(): Promise<Order[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      let dbOrders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      if (dbOrders.length === 0) {
        dbOrders = localOrders;
      }

      localStorage.setItem('dlnz-orders', JSON.stringify(dbOrders));
      return dbOrders;
    } catch (error) {
      console.warn('Firestore fetch failed, using local cache:', error);
      const customLocal = localStorage.getItem('dlnz-orders');
      if (customLocal) return JSON.parse(customLocal);
      return localOrders;
    }
  },

  subscribeToOrders(onUpdate: (orders: Order[]) => void, onError?: (error: unknown) => void): () => void {
    const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      let dbOrders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];

      if (dbOrders.length === 0) {
        dbOrders = localOrders;
      }

      localStorage.setItem('dlnz-orders', JSON.stringify(dbOrders));
      onUpdate(dbOrders);
    }, (error) => {
      console.warn('Firestore orders subscription failed, falling back to local cache/defaults:', error);
      const customLocal = localStorage.getItem('dlnz-orders');
      if (customLocal) {
        onUpdate(JSON.parse(customLocal));
      } else {
        onUpdate(localOrders);
      }
      if (onError) {
        onError(error);
      }
    });
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME), 
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      const all = await this.getAllOrders();
      return all.filter(o => o.userId === userId);
    }
  },

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
      }
      const all = await this.getAllOrders();
      return all.find(o => o.id === id) || null;
    } catch (error) {
      const all = await this.getAllOrders();
      return all.find(o => o.id === id) || null;
    }
  },

  async createOrder(order: Omit<Order, 'id'>): Promise<string> {
    const id = `DLNZ-${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const data = {
        ...order,
        createdAt: serverTimestamp(),
        date: formattedDate
      };
      await setDoc(docRef, data);
      
      // Update cache
      const all = await this.getAllOrders().catch(() => []);
      const newOrder = { id, ...order, date: formattedDate, createdAt: new Date().toISOString() };
      localStorage.setItem('dlnz-orders', JSON.stringify([newOrder, ...all.filter(o => o.id !== id)]));
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
      throw error;
    }
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { 
        status,
        updatedAt: serverTimestamp()
      });
      
      // Update cache
      const all = await this.getAllOrders().catch(() => []);
      const nextOrders = all.map(o => o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o);
      localStorage.setItem('dlnz-orders', JSON.stringify(nextOrders));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  }
};
