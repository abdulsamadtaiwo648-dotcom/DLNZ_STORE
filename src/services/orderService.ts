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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';
import { orders as localOrders } from '../data';
import { OperationType, handleFirestoreError } from '../components/FirebaseProvider';

const COLLECTION_NAME = 'orders';

export const orderService = {
  async getAllOrders(): Promise<Order[]> {
    const isBypass = typeof window !== 'undefined' && localStorage.getItem('dlnz-dev-auth-bypass') !== null;
    if (isBypass) {
      const customLocal = localStorage.getItem('dlnz-orders');
      if (customLocal) return JSON.parse(customLocal);
      localStorage.setItem('dlnz-orders', JSON.stringify(localOrders));
      return localOrders as Order[];
    }
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        const customLocal = localStorage.getItem('dlnz-orders');
        if (customLocal) return JSON.parse(customLocal);
        return localOrders;
      }
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      localStorage.setItem('dlnz-orders', JSON.stringify(data));
      return data;
    } catch (error) {
      console.warn('Firestore fetch failed, using local cache:', error);
      const customLocal = localStorage.getItem('dlnz-orders');
      if (customLocal) return JSON.parse(customLocal);
      return localOrders;
    }
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    const isBypass = typeof window !== 'undefined' && localStorage.getItem('dlnz-dev-auth-bypass') !== null;
    if (isBypass) {
      const all = await this.getAllOrders();
      return all.filter(o => o.userId === userId);
    }
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
    const isBypass = typeof window !== 'undefined' && localStorage.getItem('dlnz-dev-auth-bypass') !== null;
    if (isBypass) {
      const all = await this.getAllOrders();
      return all.find(o => o.id === id) || null;
    }
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
    const isBypass = typeof window !== 'undefined' && localStorage.getItem('dlnz-dev-auth-bypass') !== null;
    const id = `DLNZ-${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (isBypass) {
      const all = await this.getAllOrders();
      const newOrder = { id, ...order, date: formattedDate, createdAt: new Date().toISOString() };
      const nextOrders = [newOrder, ...all];
      localStorage.setItem('dlnz-orders', JSON.stringify(nextOrders));
      return id;
    }
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const data = {
        ...order,
        createdAt: serverTimestamp(),
        date: formattedDate
      };
      await setDoc(docRef, data);
      return id;
    } catch (error) {
      console.warn('Firestore create order failed, using local storage fallback:', error);
      const all = await this.getAllOrders();
      const newOrder = { id, ...order, date: formattedDate, createdAt: new Date().toISOString() };
      const nextOrders = [newOrder, ...all];
      localStorage.setItem('dlnz-orders', JSON.stringify(nextOrders));
      return id;
    }
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    const isBypass = typeof window !== 'undefined' && localStorage.getItem('dlnz-dev-auth-bypass') !== null;
    if (isBypass) {
      const all = await this.getAllOrders();
      const nextOrders = all.map(o => o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o);
      localStorage.setItem('dlnz-orders', JSON.stringify(nextOrders));
      return;
    }
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { 
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.warn('Firestore update order failed, falling back to local storage:', error);
      const all = await this.getAllOrders();
      const nextOrders = all.map(o => o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o);
      localStorage.setItem('dlnz-orders', JSON.stringify(nextOrders));
    }
  }
};
