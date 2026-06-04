import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { products, orders } from '../data';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function seedDatabase() {
  console.log('Starting database seeding...');
  
  // Seed Products
  for (const product of products) {
    const { id, ...data } = product;
    await productService.createProduct(data, id);
    console.log(`Seeded product: ${product.name}`);
  }

  // Seed Orders
  for (const order of orders) {
    const { id, ...data } = order;
    // We add a dummy userId for seeded orders to satisfy rules if needed
    // but seeded orders usually come from "anonymous" or admin
    await setDoc(doc(db, 'orders', id), {
      ...data,
      userId: 'seeded-system-user',
      createdAt: new Date().toISOString()
    });
    console.log(`Seeded order: ${id}`);
  }

  // Set initial admin
  await setDoc(doc(db, 'admins', 'system-admin'), {
    email: 'abdulsamadtaiwo648@gmail.com'
  });

  console.log('Seeding completed successfully!');
}
