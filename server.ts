import express from 'express';
import path from 'path';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import admin from 'firebase-admin';
import { products as localProducts, orders as localOrders } from './src/data';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase using server credentials loaded from file
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // 1. Initialize Client SDK for fallback
  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || '(default)');

  // 2. Initialize Admin SDK if credentials/ADC are available
  let adminDb: any = null;
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    adminDb = admin.firestore();
    if (firebaseConfig.firestoreDatabaseId) {
      (adminDb as any).settings({
        databaseId: firebaseConfig.firestoreDatabaseId
      });
    }
    console.log('Firebase Admin SDK initialized successfully');
  } catch (err) {
    console.warn('Could not launch Firebase Admin SDK (expected in some local dev environments). Falling back to Client SDK:', err);
  }

  app.use(express.json());

  // Database Access Helpers
  async function dbGetDocs(collectionName: string, sortField?: string, sortDesc = false) {
    if (adminDb) {
      let queryRef: any = adminDb.collection(collectionName);
      if (sortField) {
        queryRef = queryRef.orderBy(sortField, sortDesc ? 'desc' : 'asc');
      }
      const snapshot = await queryRef.get();
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
    } else {
      let q = query(collection(db, collectionName));
      if (sortField) {
        q = query(collection(db, collectionName), orderBy(sortField, sortDesc ? 'desc' : 'asc'));
      }
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
  }

  async function dbSetDoc(collectionName: string, docId: string, data: any, merge = false) {
    if (adminDb) {
      const docRef = adminDb.collection(collectionName).doc(docId);
      await docRef.set(data, { merge });
    } else {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data, { merge });
    }
  }

  async function dbUpdateDoc(collectionName: string, docId: string, data: any) {
    if (adminDb) {
      const docRef = adminDb.collection(collectionName).doc(docId);
      await docRef.update(data);
    } else {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, data);
    }
  }

  async function dbDeleteDoc(collectionName: string, docId: string) {
    if (adminDb) {
      const docRef = adminDb.collection(collectionName).doc(docId);
      await docRef.delete();
    } else {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    }
  }

  function generateAutoId(collectionName: string): string {
    if (adminDb) {
      return adminDb.collection(collectionName).doc().id;
    } else {
      return doc(collection(db, collectionName)).id;
    }
  }

  // API Admin Routes
  app.get('/api/admin/products', async (req, res) => {
    try {
      const dbProducts = await dbGetDocs('products', 'name');
      const productsToUse = [...dbProducts].sort((a: any, b: any) => a.name.localeCompare(b.name));
      res.json(productsToUse);
    } catch (err: any) {
      console.error('Error in GET /api/admin/products:', err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.post('/api/admin/products', async (req, res) => {
    try {
      const product = req.body;
      const id = product.id || generateAutoId('products');
      const data = {
        ...product,
        id,
        updatedAt: new Date().toISOString()
      };
      await dbSetDoc('products', id, data);
      res.status(201).json({ id, ...data });
    } catch (err: any) {
      console.error('Error in POST /api/admin/products:', err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.put('/api/admin/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const data = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await dbSetDoc('products', id, data, true);
      res.json({ status: 'success', id });
    } catch (err: any) {
      console.error('Error in PUT /api/admin/products:', err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.delete('/api/admin/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await dbDeleteDoc('products', id);
      res.json({ status: 'success', id });
    } catch (err: any) {
      console.error('Error in DELETE /api/admin/products:', err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.get('/api/admin/orders', async (req, res) => {
    try {
      let dbOrders = await dbGetDocs('orders', 'date', true);
      if (dbOrders.length === 0) {
        dbOrders = localOrders as any[];
      }
      res.json(dbOrders);
    } catch (err: any) {
      console.error('Error in GET /api/admin/orders:', err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.put('/api/admin/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const data = {
        status,
        updatedAt: new Date().toISOString()
      };
      await dbUpdateDoc('orders', id, data);
      res.json({ status: 'success', id });
    } catch (err: any) {
      console.error('Error in PUT /api/admin/orders:', err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.post('/api/admin/seed', async (req, res) => {
    try {
      console.log('Backend seeding started...');
      for (const product of localProducts) {
        const { id, ...data } = product;
        await dbSetDoc('products', id, { ...data, updatedAt: new Date().toISOString() }, true);
      }
      for (const order of localOrders) {
        const { id, ...data } = order;
        await dbSetDoc('orders', id, {
          ...data,
          userId: 'seeded-system-user',
          createdAt: new Date().toISOString()
        }, true);
      }
      await dbSetDoc('admins', 'system-admin', {
        email: 'abdulsamadtaiwo648@gmail.com'
      }, true);
      console.log('Backend seeding successful!');
      res.json({ status: 'success', message: 'Database seeded successfully on backend.' });
    } catch (err: any) {
      console.error('Error seeding database:', err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // Serve Vite or Static files AFTER API routes
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
