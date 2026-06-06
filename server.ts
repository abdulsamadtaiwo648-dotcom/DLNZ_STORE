import express from 'express';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { products as localProducts, orders as localOrders } from './src/data';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure Cloudinary if credentials are supplied (env) or fallback to user credentials
  const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dlav10tgx';
  const cloudinaryApiKey = (process.env.CLOUDINARY_API_KEY || '481221419175877').trim();
  const cloudinaryApiSecret = (process.env.CLOUDINARY_API_SECRET || '0y8eOOY46SGBmvs70HMvNs3dWSM').trim();

  let isCloudinaryConfigured = false;
  if (cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret) {
    cloudinary.config({
      cloud_name: cloudinaryCloudName,
      api_key: cloudinaryApiKey,
      api_secret: cloudinaryApiSecret,
    });
    isCloudinaryConfigured = true;
    console.log('Cloudinary successfully configured with cloud:', cloudinaryCloudName);
  } else {
    console.warn('Cloudinary credentials missing from environment and fallbacks. Cloudinary uploads will use base64 fallback or client direct.');
  }

  // Initialize Firebase using server credentials loaded from file
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Initialize Client SDK
  const firebaseApp = initializeApp(firebaseConfig);
  const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || '(default)');

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Database Access Helpers (Always authenticated as server bypass via systemSecret)
  async function dbGetDocs(collectionName: string, sortField?: string, sortDesc = false) {
    let q = query(collection(db, collectionName));
    if (sortField) {
      q = query(collection(db, collectionName), orderBy(sortField, sortDesc ? 'desc' : 'asc'));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      if (data && 'systemSecret' in data) {
        delete (data as any).systemSecret; // Strip systemSecret before serving to clients
      }
      return {
        id: doc.id,
        ...data
      };
    });
  }

  async function dbSetDoc(collectionName: string, docId: string, data: any, merge = false) {
    const docRef = doc(db, collectionName, docId);
    const enrichedData = {
      ...data,
      systemSecret: 'dlnz_secure_bypass_2026_qwert'
    };
    await setDoc(docRef, enrichedData, { merge });
  }

  async function dbUpdateDoc(collectionName: string, docId: string, data: any) {
    const docRef = doc(db, collectionName, docId);
    const enrichedData = {
      ...data,
      systemSecret: 'dlnz_secure_bypass_2026_qwert'
    };
    await updateDoc(docRef, enrichedData);
  }

  async function dbDeleteDoc(collectionName: string, docId: string) {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  }

  function generateAutoId(collectionName: string): string {
    return doc(collection(db, collectionName)).id;
  }

  // API Admin Routes
  app.post('/api/admin/upload', async (req, res) => {
    try {
      const { image, publicId } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Missing image field' });
      }

      if (!isCloudinaryConfigured) {
        return res.status(503).json({ 
          error: 'Cloudinary is not configured on the server. Please supply CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment variables.' 
        });
      }

      const options: any = {
        folder: 'driven_lives_new_zone',
      };
      if (publicId) {
        options.public_id = publicId;
      }

      console.log('Uploading base64 image payload to Cloudinary...');
      const result = await cloudinary.uploader.upload(image, options);
      console.log('Cloudinary upload successful! URL:', result.secure_url);
      res.json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (err: any) {
      console.error('Error uploading to Cloudinary:', err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.get('/api/admin/products', async (req, res) => {
    try {
      let dbProducts = await dbGetDocs('products', 'name');
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
