export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  images?: string[];
  stock: number;
  featured?: boolean;
  limited?: boolean;
  material?: string;
  colors?: string[];
  details?: string[];
  updatedAt?: any;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  amount: number;
  status: 'Processing' | 'Shipped' | 'Hold' | 'Delivered';
  tracking?: string;
  userId?: string;
  createdAt?: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
}

