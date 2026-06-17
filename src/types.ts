export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string;
  image: string;
  hoverImage?: string;
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
  status: 'Processing' | 'Shipped' | 'Hold' | 'Delivered' | 'Cancelled';
  tracking?: string;
  userId?: string;
  createdAt?: any;
  imageUrl?: string;
  productName?: string;
  shippingAddress?: string;
  lat?: number;
  lng?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor?: string;
  selectedImage?: string;
}

