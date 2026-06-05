import { Product, Order } from './types';

export const products: Product[] = [];

export const orders: Order[] = [
  {
    id: 'DLNZ-9921',
    customerName: 'Alexander V.',
    customerEmail: 'alex.v@example.com',
    date: 'Oct 12, 2023',
    amount: 2440.00,
    status: 'Processing'
  },
  {
    id: 'DLNZ-9920',
    customerName: 'M. Nakajima',
    customerEmail: 'nakajima@tokyo.jp',
    date: 'Oct 11, 2023',
    amount: 890.00,
    status: 'Shipped',
    tracking: 'UPS: 1Z992A...'
  },
  {
    id: 'DLNZ-9919',
    customerName: 'Julian Thorne',
    customerEmail: 'j.thorne@style.com',
    date: 'Oct 11, 2023',
    amount: 1250.00,
    status: 'Hold'
  }
];
