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
  variants?: { id: string; size?: string; color?: string; price?: number; stock: number }[];
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  position?: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: { id: string; size?: string; color?: string; price?: number; stock: number };
}

export interface Order {
  id?: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentStatus?: 'unpaid' | 'paid' | 'failed' | 'refunded';
  paymentTxRef?: string;
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
  area?: string;
  createdAt: number;
}

export interface Analytics {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  recentSales: { date: string; amount: number }[];
}
