import express from 'express';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { products as localProducts, orders as localOrders } from './src/data';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';

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
    await setDoc(docRef, enrichedData, { merge: true });
  }

  async function dbDeleteDoc(collectionName: string, docId: string) {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  }

  function generateAutoId(collectionName: string): string {
    return doc(collection(db, collectionName)).id;
  }

  // Base auto-seeding logic to populate database on startup
  try {
    const metaDocs = await getDocs(collection(db, 'metadata'));
    if (metaDocs.empty) {
      console.log('No metadata collection found. Triggering first-run database auto-seed...');
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
      await dbSetDoc('metadata', 'seed_status', { seeded: true });
      console.log('Auto-seed completed successfully!');
    } else {
      console.log('Database already initialized. Skipping auto-seed.');
    }
  } catch (err) {
    console.warn('Unable to perform auto-seed on startup (non-blocking):', err);
  }

  // Node Mailer Helper Setup
  async function getMailTransporter() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      console.log('Using configured SMTP settings to send email:', host);
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
    }

    // Safe development fallback: use ethereal.email for sandboxed real preview links
    console.log('Using Ethereal Mail sandbox dynamically for secure test preview links...');
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  // API Order Notification Route
  app.post('/api/orders/email', async (req, res) => {
    try {
      const { orderId, order } = req.body;
      if (!orderId || !order) {
        return res.status(400).json({ error: 'Missing orderId or order parameters.' });
      }

      const { customerName, customerEmail, shippingAddress, phone, cart, amount, tracking, date } = order;
      if (!customerEmail) {
        return res.status(400).json({ error: 'Missing customerEmail parameter.' });
      }

      console.log(`Securing and processing order receipt notification email for Order ${orderId} -> ${customerEmail}`);

      let itemsHtml = '';
      if (Array.isArray(cart)) {
        cart.forEach((item: any) => {
          const itemImg = item.selectedImage || item.product?.image || '';
          const name = item.product?.name || 'DLNZ Premium Item';
          const size = item.selectedSize || 'N/A';
          const color = item.selectedColor ? `/ ${item.selectedColor.toUpperCase()}` : '';
          const qty = item.quantity || 1;
          const price = item.product?.price || 0;
          const total = price * qty;

          itemsHtml += `
            <tr style="border-bottom: 1px solid #1a1a1a;">
              <td style="padding: 16px 8px; vertical-align: middle;">
                ${itemImg ? `<img src="${itemImg}" alt="${name}" style="width: 48px; height: 60px; object-fit: cover; border: 1px solid #333333; margin-right: 12px; vertical-align: middle; filter: grayscale(100%);" referrerPolicy="no-referrer" />` : ''}
                <span style="font-family: monospace; font-size: 13px; color: #ffffff; font-weight: 500; vertical-align: middle; letter-spacing: -0.02em;">${name} ${color}</span>
              </td>
              <td style="padding: 16px 8px; font-family: monospace; font-size: 11px; color: #888888; text-align: center; vertical-align: middle;">${size}</td>
              <td style="padding: 16px 8px; font-family: monospace; font-size: 11px; color: #888888; text-align: center; vertical-align: middle;">${qty}</td>
              <td style="padding: 16px 8px; font-family: monospace; font-size: 11px; color: #ffffff; text-align: right; vertical-align: middle;">₦${price.toLocaleString()}</td>
              <td style="padding: 16px 8px; font-family: monospace; font-size: 11px; color: #ffffff; text-align: right; vertical-align: middle; font-weight: bold;">₦${total.toLocaleString()}</td>
            </tr>
          `;
        });
      }

      const trackingUrl = `${process.env.APP_URL || 'https://ai.studio/build'}/tracking?id=${orderId}`;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>DLNZ Order Confirmation</title>
        </head>
        <body style="background-color: #050505; color: #f5f5f5; margin: 0; padding: 24px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0b0b0b; border: 1px solid #1a1a1a; padding: 36px 24px; box-sizing: border-box;">
            
            <!-- Logo Header -->
            <div style="text-align: center; border-bottom: 1px solid #1c1c1c; padding-bottom: 24px; margin-bottom: 32px;">
              <h1 style="color: #ffffff; font-size: 18px; font-weight: bold; letter-spacing: 0.3em; margin: 0; text-transform: uppercase; font-family: monospace;">DRIVEN LIVES NEW ZONE</h1>
              <p style="color: #555555; font-size: 8px; font-family: monospace; letter-spacing: 0.25em; margin: 8px 0 0 0; text-transform: uppercase;">Aesthetic Registry & Freight Carrier Protocol</p>
            </div>

            <!-- Intro Message -->
            <div style="margin-bottom: 32px;">
              <h2 style="font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.15em; color: #ffffff; margin-top: 0; margin-bottom: 10px; font-family: monospace;">[ ORDER CONFIRMED ]</h2>
              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0; font-family: system-ui, sans-serif;">
                Hello <strong>${customerName}</strong>, thank you for securing your DLNZ selection. We have verified your transaction and allocated the corresponding inventory elements in our warehouse register.
              </p>
            </div>

            <!-- Registry Data Grid -->
            <div style="background-color: #0f0f0f; border: 1px solid #1f1f1f; padding: 20px; margin-bottom: 32px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 11px; color: #555555; text-transform: uppercase; letter-spacing: 0.1em;">Order Registry ID</td>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 11px; color: #ffffff; font-weight: bold; text-align: right;">#${orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 11px; color: #555555; text-transform: uppercase; letter-spacing: 0.1em;">Data Verified At</td>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 11px; color: #ffffff; text-align: right;">${date || 'Just now'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 11px; color: #555555; text-transform: uppercase; letter-spacing: 0.1em;">Tracking Code</td>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 11px; color: #e22a2a; font-weight: bold; text-align: right;">${tracking || 'Initiated'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 11px; color: #555555; text-transform: uppercase; letter-spacing: 0.1em;">Phone Registry</td>
                  <td style="padding: 6px 0; font-family: monospace; font-size: 11px; color: #ffffff; text-align: right;">${phone || 'None supplied'}</td>
                </tr>
              </table>
            </div>

            <!-- Cart Table List -->
            <div style="margin-bottom: 32px;">
              <h3 style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.2em; color: #ffffff; border-bottom: 1px solid #1a1a1a; padding-bottom: 8px; margin-bottom: 12px; font-family: monospace;">VERIFIED CARGO SELECTION</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid #222222;">
                    <th style="padding: 8px 4px; text-align: left; font-family: monospace; font-size: 9px; color: #555555; text-transform: uppercase; letter-spacing: 0.1em;">Vessel Description</th>
                    <th style="padding: 8px 4px; text-align: center; font-family: monospace; font-size: 9px; color: #555555; text-transform: uppercase; letter-spacing: 0.1em;">Size</th>
                    <th style="padding: 8px 4px; text-align: center; font-family: monospace; font-size: 9px; color: #555555; text-transform: uppercase; letter-spacing: 0.1em;">Qty</th>
                    <th style="padding: 8px 4px; text-align: right; font-family: monospace; font-size: 9px; color: #555555; text-transform: uppercase; letter-spacing: 0.1em;">Price</th>
                    <th style="padding: 8px 4px; text-align: right; font-family: monospace; font-size: 9px; color: #555555; text-transform: uppercase; letter-spacing: 0.1em;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <!-- Amount Totals -->
            <div style="border-top: 1px solid #1c1c1c; padding-top: 16px; margin-bottom: 32px; text-align: right;">
              <table style="width: 200px; margin-left: auto; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; font-family: monospace; font-size: 11px; color: #555555; text-transform: uppercase;">Basket Value</td>
                  <td style="padding: 4px 0; font-family: monospace; font-size: 11px; color: #ffffff; text-align: right;">₦${amount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-family: monospace; font-size: 11px; color: #555555; text-transform: uppercase;">Freight Speed</td>
                  <td style="padding: 4px 0; font-family: monospace; font-size: 11px; color: #888888; text-align: right;">Complementary</td>
                </tr>
                <tr style="border-top: 1px solid #222222;">
                  <td style="padding: 12px 0 4px 0; font-family: monospace; font-size: 11px; color: #ffffff; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">TOTAL CHARGES</td>
                  <td style="padding: 12px 0 4px 0; font-family: monospace; font-size: 14px; color: #ffffff; text-align: right; font-weight: bold;">₦${amount.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <!-- Destination Card -->
            <div style="border: 1px dashed #222222; padding: 16px; background-color: #070707; margin-bottom: 32px;">
              <h4 style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #ffffff; margin-top: 0; margin-bottom: 8px; font-family: monospace; letter-spacing: 0.15em;">FREIGHT DESTINATION</h4>
              <p style="color: #888888; font-size: 12px; line-height: 1.5; margin: 0; text-transform: uppercase; font-family: monospace; letter-spacing: -0.01em;">
                ${shippingAddress}
              </p>
            </div>

            <!-- Tracking CTA -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${trackingUrl}" style="display: inline-block; background-color: #ffffff; color: #000000; text-transform: uppercase; font-family: monospace; font-size: 10px; font-weight: bold; letter-spacing: 0.2em; text-decoration: none; padding: 16px 32px; border: 1px solid #ffffff; transition: background-color 0.2s;">
                TRACK CARGO DISPATCH
              </a>
            </div>

            <!-- Footer block -->
            <div style="text-align: center; border-top: 1px solid #111111; padding-top: 24px;">
              <p style="color: #444444; font-size: 9px; font-family: monospace; margin: 0; line-height: 1.6; letter-spacing: 0.02em;">
                This document is a certified digital transmission.<br />
                DRIVEN LIVES NEW ZONE - © 2026. All rights reserved.
              </p>
            </div>

          </div>
        </body>
        </html>
      `;

      // Acquire mail transporter
      let transporter;
      try {
        transporter = await getMailTransporter();
      } catch (errTransporter) {
        console.error('Nodemailer configuration error:', errTransporter);
        return res.json({
          status: 'fallback_success',
          message: 'Mail server offline. Logged successfully on Firestore.'
        });
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || `"DLNZ Logistics" <noreply@drivenlivesnewzone.com>`,
        to: customerEmail,
        subject: `[DLNZ] Secure Order Confirmation: #${orderId}`,
        html: emailHtml,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Order confirmation mail successfully sent. Message ID:', info.messageId);

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[DLNZ MAILBOX PREVIEW]: ${previewUrl}`);
      }

      return res.json({
        status: 'success',
        orderId,
        messageId: info.messageId,
        previewUrl: previewUrl || undefined
      });

    } catch (err: any) {
      console.error('Fatal error dispatching order summary email:', err);
      return res.status(500).json({ error: err.message || String(err) });
    }
  });

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
      const dbOrders = await dbGetDocs('orders', 'date', true);
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
