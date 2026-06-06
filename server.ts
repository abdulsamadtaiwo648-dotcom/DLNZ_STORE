import express from 'express';
import path from 'path';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { products as localProducts, orders as localOrders } from './src/data';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase using server credentials loaded from file
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || '(default)');

  app.use(express.json());

  // API Admin Routes
  app.get('/api/admin/products', async (req, res) => {
    try {
      const q = query(collection(db, 'products'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      let dbProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      if (dbProducts.length === 0) {
        dbProducts = localProducts as any[];
      }
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
      const id = product.id || doc(collection(db, 'products')).id;
      const docRef = doc(db, 'products', id);
      const data = {
        ...product,
        id,
        updatedAt: new Date().toISOString()
      };
      await setDoc(docRef, data);
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
      const docRef = doc(db, 'products', id);
      await setDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      res.json({ status: 'success', id });
    } catch (err: any) {
      console.error('Error in PUT /api/admin/products:', err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.delete('/api/admin/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deleteDoc(doc(db, 'products', id));
      res.json({ status: 'success', id });
    } catch (err: any) {
      console.error('Error in DELETE /api/admin/products:', err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.get('/api/admin/orders', async (req, res) => {
    try {
      const q = query(collection(db, 'orders'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      let dbOrders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
      const docRef = doc(db, 'orders', id);
      await updateDoc(docRef, {
        status,
        updatedAt: new Date().toISOString()
      });
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
        const docRef = doc(db, 'products', id);
        await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
      }
      for (const order of localOrders) {
        const { id, ...data } = order;
        await setDoc(doc(db, 'orders', id), {
          ...data,
          userId: 'seeded-system-user',
          createdAt: new Date().toISOString()
        });
      }
      await setDoc(doc(db, 'admins', 'system-admin'), {
        email: 'abdulsamadtaiwo648@gmail.com'
      });
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
