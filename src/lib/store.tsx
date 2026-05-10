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
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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

  const fetchWithTimeout = async (url: string, options: any = {}, timeout = 15000) => {
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

  const fetchAuth = async () => {
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
        setCategories(data);
      } else if (res.status === 503 && retryCount < 10) {
        console.warn(`Database is still initializing (503) for categories. Retrying in 1s... (Attempt ${retryCount + 1}/10)`);
        setTimeout(() => fetchCategories(retryCount + 1), 1000);
      } else {
        const text = await res.text();
        console.error('Fetch categories failed:', text);
        if (retryCount < 2 && res.status >= 500) {
          console.log(`Retrying fetch categories (${retryCount + 1})...`);
          setTimeout(() => fetchCategories(retryCount + 1), 2000);
        }
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
      if (retryCount < 2) {
        console.log(`Retrying fetch categories after error (${retryCount + 1})...`);
        setTimeout(() => fetchCategories(retryCount + 1), 2000);
      }
    }
  };

  const fetchProducts = async (full: boolean = false, retryCount = 0) => {
    try {
      console.log('Fetching products...', full ? '(full)' : '');
      const res = await fetchWithTimeout(`/api/products${full ? '?full=true' : ''}`, {}, 25000); // 25s timeout
      if (res.ok) {
        const data = await res.json();
        console.log('Products fetched:', data.length);
        setProducts(data);
        setDbLoading(false);
      } else if (res.status === 503 && retryCount < 10) {
        // DB is likely still initializing
        console.warn(`Database is still initializing (503). Retrying in 1s... (Attempt ${retryCount + 1}/10)`);
        setTimeout(() => fetchProducts(full, retryCount + 1), 1000);
      } else {
        const text = await res.text();
        console.error('Fetch products failed:', text);
        if (retryCount < 2 && res.status >= 500) {
          console.log(`Retrying fetch products (${retryCount + 1})...`);
          setTimeout(() => fetchProducts(full, retryCount + 1), 2000);
        } else {
          setDbLoading(false);
        }
      }
    } catch (err) {
      console.error('Fetch products error:', err);
      if (retryCount < 2) {
        console.log(`Retrying fetch products after error (${retryCount + 1})...`);
        setTimeout(() => fetchProducts(full, retryCount + 1), 2000);
      } else {
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

  const addToCart = (product: Product) => {
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
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
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

