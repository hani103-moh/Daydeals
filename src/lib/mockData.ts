import { Product, Category } from '../types';

export const mockCategories: any[] = [
  { id: '1', name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80', description: 'Tech gadgets and devices', createdAt: Date.now() },
  { id: '2', name: 'Fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&q=80', description: 'Clothing and accessories', createdAt: Date.now() },
  { id: '3', name: 'Home', image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=500&q=80', description: 'Home decor and furniture', createdAt: Date.now() }
];

export const mockProducts: any[] = [
  {
    id: 'p1',
    name: 'Wireless Noise-Canceling Headphones',
    description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
    price: 299.99,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'],
    stock: 15,
    rating: 4.8,
    createdAt: Date.now()
  },
  {
    id: 'p2',
    name: 'Minimalist Smartwatch',
    description: 'Sleek smartwatch with health tracking, notifications, and water resistance.',
    price: 199.50,
    category: 'Electronics',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'],
    stock: 8,
    rating: 4.5,
    createdAt: Date.now()
  },
  {
    id: 'p3',
    name: 'Classic Denim Jacket',
    description: 'Timeless denim jacket made from high-quality, sustainable cotton.',
    price: 89.99,
    category: 'Fashion',
    images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&q=80'],
    stock: 25,
    rating: 4.6,
    createdAt: Date.now()
  },
  {
    id: 'p4',
    name: 'Ceramic Table Lamp',
    description: 'Modern ceramic desk lamp perfect for warm ambient lighting in any space.',
    price: 45.00,
    category: 'Home',
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80'],
    stock: 12,
    rating: 4.9,
    createdAt: Date.now()
  }
];

export const MOCK_PRODUCTS = mockProducts;
export const CATEGORIES = mockCategories;
