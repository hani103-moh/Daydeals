export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  rating: number;
  reviewsCount: number;
  sold_count: number;
  activeOrders?: number;
  tags: string[];
  isFeatured?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id?: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    area: string;
  };
  paymentMethod: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  wishlist: string[]; // Product IDs
  shippingAddress?: string;
  shippingPhone?: string;
  shippingCity?: string;
  createdAt: number;
}

export interface Analytics {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  recentSales: { date: string; amount: number }[];
}
