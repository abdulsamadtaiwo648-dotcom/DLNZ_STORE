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
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return localOrders;
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
    } catch (error) {
      return localOrders;
    }
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
      return [];
    }
  },

  async getOrderById(id: string): Promise<Order | null> {
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
      }
      return localOrders.find(o => o.id === id) || null;
    } catch (error) {
      return localOrders.find(o => o.id === id) || null;
    }
  },

  async createOrder(order: Omit<Order, 'id'>): Promise<string> {
    try {
      const id = `DLNZ-${Math.floor(1000 + Math.random() * 9000)}`;
      const docRef = doc(db, COLLECTION_NAME, id);
      const data = {
        ...order,
        createdAt: serverTimestamp(),
        // Mapping string dates to timestamps if needed, but Order type uses string
        // We'll keep it consistent with the schema
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      await setDoc(docRef, data);
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
      return '';
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
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
};
