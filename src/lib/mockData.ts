import { Product, Category } from '../types';

export const mockCategories: any[] = [
  { id: '1', name: 'Traditional Garments', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80', description: 'Exquisite Habesha Kemis, Kuta, and modern Ethiopian fusion fashion', createdAt: Date.now() },
  { id: '2', name: 'Spices & Ingredients', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80', description: 'Authentic Berbere, Mitmita, Shiro, and rich local blends', createdAt: Date.now() },
  { id: '3', name: 'Organic Coffee', image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&q=80', description: 'Premium, raw, and roasted Ethiopian specialty coffee beans', createdAt: Date.now() },
  { id: '4', name: 'Cultural Crafts', image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&q=80', description: 'Handmade woven baskets, traditional clay Jebena pots, and cultural art', createdAt: Date.now() }
];

export const mockProducts: any[] = [
  {
    id: 'p1',
    name: 'Premium Handwoven Habesha Kemis',
    description: 'An exquisite traditional white dress with beautifully handwoven Tilat pattern borders. Perfect for holidays, weddings, and special occasions.',
    price: 180.00,
    category: 'Traditional Garments',
    images: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80'],
    stock: 50,
    rating: 4.9,
    createdAt: Date.now()
  },
  {
    id: 'p2',
    name: 'Authentic Addis Berbere Spice (500g)',
    description: 'Sourced directly from the bustling spice stalls of Merkato, this organic Berbere spice blend is made from dried red chilies, fenugreek, garlic, and ginger. Ideal for authentic Doro Wat.',
    price: 18.50,
    category: 'Spices & Ingredients',
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80'],
    stock: 150,
    rating: 4.8,
    createdAt: Date.now()
  },
  {
    id: 'p3',
    name: 'Yirgacheffe Specialty Roasted Coffee (1kg)',
    description: 'Medium-roasted highland Arabica beans from the historic Yirgacheffe region. Features dynamic floral notes, citrus undertones, and a remarkably clean body.',
    price: 26.90,
    category: 'Organic Coffee',
    images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&q=80'],
    stock: 200,
    rating: 5.0,
    createdAt: Date.now()
  },
  {
    id: 'p4',
    name: 'Handcrafted Clay Jebena Coffee Pot',
    description: 'Authentic traditional clay Ethiopian Jebena pot. Beautifully handcrafted by expert artisans, complete with premium straw ring stand (Mat). Perfect for authentic brewing.',
    price: 34.00,
    category: 'Cultural Crafts',
    images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80'],
    stock: 75,
    rating: 4.7,
    createdAt: Date.now()
  }
];

export const MOCK_PRODUCTS = mockProducts;
export const CATEGORIES = mockCategories;
