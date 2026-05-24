import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, CartItem, Product, Order, Category } from '../types';
import { toast } from 'sonner';

interface StoreContextType {
  user: UserProfile | null;
  loading: boolean;
  authLoading: boolean;
  dbLoading: boolean;
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  wishlist: string[];
  orders: Order[];
  ordersCount: number;
  addToCart: (product: Product, selectedVariant?: any) => void;
  removeFromCart: (productId: string, selectedVariantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedVariantId?: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  login: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchProducts: (full?: boolean) => Promise<void>;
  fetchSingleProduct: (id: string) => Promise<Product | null>;
  fetchCategories: () => Promise<void>;
  fetchOrders: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Premium Handwoven Habesha Kemis',
    description: 'An exquisite traditional white dress with beautifully handwoven Tilat pattern borders. Perfect for holidays, weddings, and special cultural occasions.',
    price: 180.00,
    category: 'Traditional Garments',
    images: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80'],
    stock: 50,
    rating: 4.9,
    reviewsCount: 124,
    sold_count: 35,
    tags: ['clothing', 'traditional', 'dress', 'premium'],
    isFeatured: true,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5
  },
  {
    id: 'p2',
    name: 'Authentic Addis Berbere Spice (500g)',
    description: 'Sourced directly from the bustling spice stalls of Merkato, this organic Berbere spice blend is made from dried red chilies, fenugreek, garlic, and ginger. Ideal for authentic Doro Wat.',
    price: 18.50,
    category: 'Spices & Ingredients',
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'],
    stock: 150,
    rating: 4.8,
    reviewsCount: 89,
    sold_count: 112,
    tags: ['spices', 'cooking', 'organic', 'authentic'],
    isFeatured: false,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10
  },
  {
    id: 'p3',
    name: 'Yirgacheffe Specialty Roasted Coffee (1kg)',
    description: 'Medium-roasted highland Arabica beans from the historic Yirgacheffe region. Features dynamic floral notes, citrus undertones, and a remarkably clean body.',
    price: 26.90,
    category: 'Organic Coffee',
    images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80'],
    stock: 200,
    rating: 5.0,
    reviewsCount: 56,
    sold_count: 84,
    tags: ['coffee', 'beverage', 'roasted', 'yirgacheffe'],
    isFeatured: true,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3
  },
  {
    id: 'p4',
    name: 'Handcrafted Clay Jebena Coffee Pot',
    description: 'Authentic traditional clay Ethiopian Jebena pot. Beautifully handcrafted by expert artisans, complete with premium straw ring stand (Mat). Perfect for authentic brewing.',
    price: 34.00,
    category: 'Cultural Crafts',
    images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80'],
    stock: 75,
    rating: 4.7,
    reviewsCount: 210,
    sold_count: 42,
    tags: ['craft', 'coffee', 'home', 'artisan'],
    isFeatured: false,
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 15
  }
];

const FALLBACK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Traditional Garments', icon: 'Shirt', description: 'Exquisite Habesha Kemis, Kuta, and modern Ethiopian fusion fashion', position: 1 },
  { id: 'c2', name: 'Spices & Ingredients', icon: 'Sparkles', description: 'Authentic Berbere, Mitmita, Shiro, and rich local blends', position: 2 },
  { id: 'c3', name: 'Organic Coffee', icon: 'Home', description: 'Premium, raw, and roasted Ethiopian specialty coffee beans', position: 3 },
  { id: 'c4', name: 'Cultural Crafts', icon: 'Scissors', description: 'Handmade woven baskets, traditional clay Jebena pots, and cultural art', position: 4 }
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState(true);
  const loading = authLoading || dbLoading;
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);

  useEffect(() => {
    const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
    setOrdersCount(activeOrders.length);
  }, [orders]);

  const fetchWithTimeout = async (url: string, options: any = {}, timeout = 120000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    console.log('Fetching orders...');
    if (!token) return;
    try {
      const res = await fetchWithTimeout('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Orders fetched:', data);
        setOrders(data);
      } else {
        console.error('Fetch orders failed', await res.text());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuth = async (retryCount = 0) => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetchWithTimeout('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setWishlist(data.user.wishlist || []);
          fetchOrders();
        } else if (res.status === 401 || res.status === 403) {
          console.warn('Auth token expired or invalid, logging out');
          localStorage.removeItem('token');
          setUser(null);
        } else if (res.status === 429 && retryCount < 3) {
          console.warn(`Auth check rate limited (429). Retrying in 2.5s... (Attempt ${retryCount + 1}/3)`);
          setTimeout(() => fetchAuth(retryCount + 1), 2500);
          return; // Skip setting loading to false while we retry
        } else {
          console.error(`Auth check failed with status ${res.status}`);
          // Don't remove token for 500/503 errors as the server might just be busy
        }
      } catch (err) {
        console.error(err);
      }
    }
    setAuthLoading(false);
  }

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const fetchCategories = async (retryCount = 0) => {
    try {
      console.log('Fetching categories...');
      const res = await fetchWithTimeout('/api/categories');
      if (res.ok) {
        const data = await res.json();
        console.log('Categories fetched:', data);
        if (data && data.length > 0) {
          setCategories(data);
        } else {
          console.warn('Backend returned empty categories. Using premium offline fallback.');
          setCategories(FALLBACK_CATEGORIES);
        }
      } else if (res.status === 503 && retryCount < 10) {
        console.warn(`Database is still initializing (503) for categories. Retrying in 1s... (Attempt ${retryCount + 1}/10)`);
        setTimeout(() => fetchCategories(retryCount + 1), 1000);
      } else if (res.status === 429 && retryCount < 5) {
        console.warn(`Categories fetch rate limited (429). Retrying in 2s... (Attempt ${retryCount + 1}/5)`);
        setTimeout(() => fetchCategories(retryCount + 1), 2000);
      } else {
        const text = await res.text();
        console.error('Fetch categories failed:', text);
        if (retryCount < 2 && res.status >= 500) {
          console.log(`Retrying fetch categories (${retryCount + 1})...`);
          setTimeout(() => fetchCategories(retryCount + 1), 2000);
        } else {
          console.log('Using fallback categories due to fetch failure');
          setCategories(FALLBACK_CATEGORIES);
        }
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
      if (retryCount < 2) {
        console.log(`Retrying fetch categories after error (${retryCount + 1})...`);
        setTimeout(() => fetchCategories(retryCount + 1), 2000);
      } else {
        console.log('Using fallback categories due to network error');
        setCategories(FALLBACK_CATEGORIES);
      }
    }
  };

  const fetchProducts = async (full: boolean = false, retryCount = 0) => {
    try {
      console.log('Fetching products...', full ? '(full)' : '');
      const res = await fetchWithTimeout(`/api/products${full ? '?full=true' : ''}`, {}, 60000); // 60s timeout
      if (res.ok) {
        const data = await res.json();
        console.log('Products fetched:', data.length);
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          console.warn('Backend returned empty products. Using premium offline fallback.');
          setProducts(FALLBACK_PRODUCTS);
        }
        setDbLoading(false);
      } else if (res.status === 503 && retryCount < 10) {
        // DB is likely still initializing
        console.warn(`Database is still initializing (503). Retrying in 1s... (Attempt ${retryCount + 1}/10)`);
        setTimeout(() => fetchProducts(full, retryCount + 1), 1000);
      } else if (res.status === 429 && retryCount < 5) {
        console.warn(`Products fetch rate limited (429). Retrying in 2s... (Attempt ${retryCount + 1}/5)`);
        setTimeout(() => fetchProducts(full, retryCount + 1), 2000);
      } else {
        const text = await res.text();
        console.error('Fetch products failed:', text);
        if (retryCount < 2 && res.status >= 500) {
          console.log(`Retrying fetch products (${retryCount + 1})...`);
          setTimeout(() => fetchProducts(full, retryCount + 1), 2000);
        } else {
          console.log('Using fallback products due to fetch failure');
          setProducts(FALLBACK_PRODUCTS);
          setDbLoading(false);
        }
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      if (retryCount < 2) {
        console.log(`Retrying fetch products after error (${retryCount + 1})...`);
        setTimeout(() => fetchProducts(full, retryCount + 1), 2000);
      } else {
        console.log('Using fallback products due to network error');
        setProducts(FALLBACK_PRODUCTS);
        setDbLoading(false);
      }
      
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Network timeout fetching products');
      } else if (err instanceof TypeError && err.message === 'Load failed') {
        console.warn('Network error: Is the server running on port 3000?');
      }
    }
  };

  const fetchSingleProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(prev => {
          const exists = prev.find(p => p.id === id);
          if (exists) {
            return prev.map(p => p.id === id ? data : p);
          }
          return [...prev, data];
        });
        return data;
      }
    } catch (err) {
      console.error('Fetch single product error:', err);
    }
    return null;
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchAuth();
  }, []);

  const login = async () => {
    toast.error('Google Sign-in is not supported on Neon pg mode. Please use email/password.');
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setUser(null);
    setWishlist([]);
    setOrdersCount(0);
    toast.success('Successfully signed out!');
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      console.log('Sending registration request...');
      const res = await fetchWithTimeout('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, displayName: name })
      });
      if (!res.ok) {
        let errStr = 'Registration failed';
        try {
          const err = await res.json();
          errStr = err.error || errStr;
        } catch(e) {}
        throw new Error(errStr);
      }
      const data = await res.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setWishlist([]);
      toast.success('Registration successful');
    } catch (err: any) {
      console.error('Registration error:', err);
      toast.error(err.message);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      console.log('Sending login request...');
      const res = await fetchWithTimeout('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      if (!res.ok) {
        let errStr = 'Login failed';
        try {
          const err = await res.json();
          errStr = err.error || errStr;
        } catch(e) {}
        throw new Error(errStr);
      }
      const data = await res.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setWishlist(data.user.wishlist || []);
      toast.success('Login successful');
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error(err.message);
      throw err;
    }
  };

  const addToCart = (product: Product, selectedVariant?: any) => {
    if (!user) {
      toast.error('Please sign in to add items to your cart', {
        action: {
          label: 'Sign In',
          onClick: () => window.location.href = '/auth'
        }
      });
      return;
    }
    setCart((prev) => {
      const existingItem = prev.find((item) => 
        item.id === product.id && 
        (!selectedVariant || item.selectedVariant?.id === selectedVariant.id)
      );
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id && 
          (!selectedVariant || item.selectedVariant?.id === selectedVariant.id)
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedVariant }];
    });
    const displayName = selectedVariant 
      ? `${product.name} (${selectedVariant.size || ''} ${selectedVariant.color || ''})`
      : product.name;
    toast.success(`${displayName} added to cart`);
  };

  const removeFromCart = (productId: string, selectedVariantId?: string) => {
    setCart((prev) => prev.filter((item) => 
      !(item.id === productId && (!selectedVariantId || item.selectedVariant?.id === selectedVariantId))
    ));
  };

  const updateQuantity = (productId: string, quantity: number, selectedVariantId?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedVariantId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => 
        item.id === productId && (!selectedVariantId || item.selectedVariant?.id === selectedVariantId)
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      toast.error('Please sign in to save items to your heart list', {
        action: {
          label: 'Sign In',
          onClick: () => window.location.href = '/auth'
        }
      });
      return;
    }

    const isRemoving = wishlist.includes(productId);
    const newWishlist = isRemoving
      ? wishlist.filter((id) => id !== productId)
      : [...wishlist, productId];

    // optimistic update
    setWishlist(newWishlist);
    toast.success(isRemoving ? 'Removed from wishlist' : 'Added to wishlist');
    
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productIds: newWishlist })
        });
      }
    } catch (err) {
      console.error('Wishlist sync error:', err);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        loading,
        authLoading,
        dbLoading,
        products,
        categories,
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        login,
        signUpWithEmail,
        signInWithEmail,
        logout,
        checkAuth: fetchAuth,
        fetchProducts,
        fetchSingleProduct,
        fetchCategories,
        orders,
        ordersCount,
        fetchOrders,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

