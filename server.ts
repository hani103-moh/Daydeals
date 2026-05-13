import "dotenv/config";
console.log("[RUNTIME] server.ts loading...");
import express from "express";
import path from "path";
import fs from "fs";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import crypto from "crypto";
import { fileURLToPath } from 'url';

// Safety nets
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL-ERROR] Uncaught:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL-ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Neon Connection String Handling
const neonUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://neondb_owner:npg_v9xk7nlEJbjz@ep-weathered-dawn-apantfwu-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require';

let _pool: Pool | null = null;
function getPool() {
  if (!_pool) {
    const connectionString = (neonUrl && neonUrl.startsWith('postgres')) ? neonUrl : neonUrl;
    console.log("[DB] Initializing Postgres Pool...");
    _pool = new Pool({
      connectionString,
      max: 10, 
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000, 
      ssl: { rejectUnauthorized: false }
    });
    _pool.on('error', (err) => {
      console.error('[DB] Unexpected error on idle client:', err);
    });
  }
  return _pool;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

async function initializeDatabase() {
  const pool = getPool();
  let client;
  
  try {
    client = await pool.connect();
    
    // 1. FAST CHECK: Faster than information_schema
    const tableCheck = await client.query("SELECT to_regclass('public.users')");
    if (tableCheck.rows[0].to_regclass) {
      console.log("Database tables verified via regclass.");
      isInitialized = true;
      return;
    }

    console.log("Performing full database initialization...");
    await client.query('BEGIN');
    
    // Create everything in one go
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        role VARCHAR(50) DEFAULT 'user',
        photo_url TEXT,
        shipping_address TEXT,
        shipping_phone TEXT,
        shipping_city TEXT,
        area TEXT,
        reset_token TEXT,
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        images TEXT[],
        stock INTEGER DEFAULT 0,
        sold_count INTEGER DEFAULT 0,
        rating DECIMAL(3, 1),
        reviews_count INTEGER DEFAULT 0,
        tags TEXT[] DEFAULT '{}',
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address TEXT,
        shipping_phone TEXT,
        shipping_city TEXT,
        area TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id),
        product_id VARCHAR(255) REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

      CREATE TABLE IF NOT EXISTS wishlist (
        user_id UUID REFERENCES users(id),
        product_id VARCHAR(255) REFERENCES products(id),
        PRIMARY KEY (user_id, product_id)
      );
    `);
    
    // SEEDING
    const seedCheck = await client.query('SELECT (SELECT COUNT(*) FROM categories) as cat_count, (SELECT COUNT(*) FROM products) as prod_count');
    const { cat_count, prod_count } = seedCheck.rows[0];

    if (parseInt(cat_count) === 0) {
      console.log("Seeding categories...");
      await client.query(`
        INSERT INTO categories (id, name, icon, description) VALUES
        ('c1', 'Electronics', 'Smartphone', 'Tech gadgets and devices'),
        ('c2', 'Clothing', 'Shirt', 'Modern fashion for everyone'),
        ('c3', 'Home', 'Home', 'Essential household items'),
        ('c4', 'Beauty', 'Sparkles', 'Cosmetics and skincare')
      `);
    }

    if (parseInt(prod_count) === 0) {
      console.log("Seeding products...");
      await client.query(`
        INSERT INTO products (id, name, description, price, category, images, stock, rating, reviews_count, tags, is_featured) VALUES
        ('p1', 'Premium Wireless Headphones', 'High-quality sound with noise cancellation.', 199.99, 'Electronics', ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'], 50, 4.8, 124, ARRAY['audio', 'wireless', 'premium'], true),
        ('p2', 'Minimalist Watch', 'Elegant design for every occasion.', 129.50, 'Clothing', ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'], 100, 4.5, 89, ARRAY['fashion', 'accessory'], false),
        ('p3', 'Smart Speaker', 'Voice-controlled assistant with clear audio.', 79.99, 'Electronics', ARRAY['https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800&q=80'], 30, 4.2, 56, ARRAY['smart-home', 'audio'], true),
        ('p4', 'Running Shoes', 'Lightweight and durable for all terrains.', 89.00, 'Clothing', ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'], 75, 4.7, 210, ARRAY['sport', 'running', 'fitness'], false)
      `);
    }

    await client.query(`UPDATE users SET role = 'admin' WHERE email = 'hanichomoh@gmail.com'`);
    await client.query('COMMIT');
    
    console.log("Database initialization completed.");
    isInitialized = true;
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error("Database initialization error:", err);
    throw err;
  } finally {
    if (client) client.release();
  }
}

// DB INIT MIDDLEWARE & FLAG
let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (isInitialized) return;
  if (!initPromise) {
    console.log("Initializing database connection...");
    initPromise = initializeDatabase().catch(err => {
      console.error("Database initialization failed:", err);
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Global performance and size monitoring
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const size = JSON.stringify(req.body).length;
    if (size > 1024 * 512) { // Monitor requests > 512KB
      console.warn(`[SIZE-WATCH] Large ${req.method} request to ${req.url}: ${(size / 1024).toFixed(1)} KB`);
    }
  }
  next();
});

// Middleware to ensure DB is initialized for API calls
app.use(async (req, res, next) => {
  const start = Date.now();
  
  // Track long running requests in progress
  const longRunningTimer = setTimeout(() => {
    console.warn(`[HANG-WATCH] Request ${req.method} ${req.url} has been running for 5s...`);
  }, 5000);

  if (req.url.startsWith('/api')) {
    if (req.url === '/api/health' || req.url === '/api/init-db') {
      clearTimeout(longRunningTimer);
      return next();
    }

    if (!isInitialized) {
      try {
        // Wait at most 8s for DB init before deciding what to do
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000));
        await Promise.race([ensureInitialized(), timeoutPromise]);
      } catch (err: any) {
        console.warn(`Request ${req.method} ${req.url} proceeding while DB is still initializing...`);
      }
    }
  }
  
  // Track response completion
  res.on('finish', () => {
    clearTimeout(longRunningTimer);
    if (req.url.startsWith('/api')) {
      const duration = Date.now() - start;
      if (duration > 3000) {
        console.warn(`[PERF] VERY SLOW: ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
      } else if (duration > 1000) {
        console.log(`[PERF] SLOW: ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
      }
    }
  });

  res.on('close', () => {
    clearTimeout(longRunningTimer);
  });
  
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    vercel: !!process.env.VERCEL,
    timestamp: new Date().toISOString(),
    dbInitialized: isInitialized
  });
});

app.get("/api/init-db", async (req, res) => {
  try {
    await initializeDatabase();
    isInitialized = true;
    res.json({ status: "success", message: "Database initialized" });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Auth Routes
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  console.log(`Admin check for user: ${req.user?.email}, role: ${req.user?.role}`);
  if (req.user && (req.user.role === 'admin' || req.user.email === 'hanichomoh@gmail.com')) {
    next();
  } else {
    console.warn(`Admin access denied for: ${req.user?.email}`);
    res.status(403).json({ error: 'Admin access required' });
  }
};

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    
    const lowerEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = lowerEmail === 'hanichomoh@gmail.com' ? 'admin' : 'user';
    
    const result = await getPool().query(
      'INSERT INTO users (email, password_hash, display_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name, role',
      [lowerEmail, hashedPassword, displayName, role]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ 
      token, 
      user: { 
        uid: user.id, 
        email: user.email, 
        displayName: user.display_name, 
        role: user.role,
        wishlist: [],
        createdAt: Date.now()
      } 
    });
  } catch (err: any) {
    console.error("Register error:", err);
    // Unique violation in Postgres is 23505
    if (err.code === '23505') {
      return res.status(400).json({ error: 'An account with this email already exists. Please try logging in instead.' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    
    const lowerEmail = email.toLowerCase().trim();
    console.log(`Login attempt for: ${lowerEmail}`);
    
    const result = await getPool().query('SELECT * FROM users WHERE email = $1', [lowerEmail]);
    const user = result.rows[0];
    
    if (!user) {
      console.log(`Login failed: No user found with email ${lowerEmail}`);
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for email ${lowerEmail}`);
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    const wishlistRes = await getPool().query('SELECT product_id FROM wishlist WHERE user_id = $1', [user.id]);
    const wishlist = wishlistRes.rows.map(r => r.product_id);

    // Ensure master user always has admin role even if DB update hasn't run yet
    let role = user.role;
    if (lowerEmail === 'hanichomoh@gmail.com' && role !== 'admin') {
      role = 'admin';
      // Silently update in background
      getPool().query('UPDATE users SET role = \'admin\' WHERE id = $1', [user.id]).catch(console.error);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        uid: user.id, 
        email: user.email, 
        displayName: user.display_name, 
        role: role,
        photoURL: user.photo_url,
        shippingAddress: user.shipping_address,
        shippingPhone: user.shipping_phone,
        shippingCity: user.shipping_city,
        area: user.area,
        wishlist: wishlist,
        createdAt: new Date(user.created_at).getTime()
      } 
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    const lowerEmail = email.toLowerCase().trim();
    const userResult = await getPool().query('SELECT id FROM users WHERE email = $1', [lowerEmail]);
    
    if (userResult.rows.length === 0) {
      // Don't reveal if user exists for security
      return res.json({ message: 'If an account with that email exists, we have sent a reset link.' });
    }

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await getPool().query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [token, expires, lowerEmail]
    );

    // MOCK EMAIL: In a real app, you'd use SendGrid/Resend/etc.
    console.log(`[PASS_RESET] Mock email sent to ${lowerEmail}. Token: ${token}`);
    
    // For demo purposes, we'll return the token so the UI can show the link
    res.json({ 
      message: 'If an account with that email exists, we have sent a reset link.',
      resetLink: `/reset-password?token=${token}` 
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });

    const userResult = await getPool().query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const userId = userResult.rows[0].id;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await getPool().query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({ message: 'Password has been reset successfully' });
  } catch (err: any) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/me", authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const result = await getPool().query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const wishlistRes = await getPool().query('SELECT product_id FROM wishlist WHERE user_id = $1', [user.id]);
    const wishlist = wishlistRes.rows.map(r => r.product_id);

    // Ensure master user always has admin role
    let role = user.role;
    if (user.email === 'hanichomoh@gmail.com' && role !== 'admin') {
      role = 'admin';
      getPool().query('UPDATE users SET role = \'admin\' WHERE id = $1', [user.id]).catch(console.error);
    }

    res.json({ 
      user: { 
        uid: user.id, 
        email: user.email, 
        displayName: user.display_name, 
        role: role,
        photoURL: user.photo_url,
        shippingAddress: user.shipping_address,
        shippingPhone: user.shipping_phone,
        shippingCity: user.shipping_city,
        area: user.area,
        wishlist: wishlist,
        createdAt: new Date(user.created_at).getTime()
      } 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/auth/profile", authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { displayName, shippingAddress, shippingPhone, shippingCity, area, photoURL } = req.body;
    
    console.log(`Updating profile for user ${userId}:`, { displayName, shippingAddress, shippingPhone, shippingCity, area });

    const result = await getPool().query(
      `UPDATE users 
       SET display_name = COALESCE($1, display_name), 
           shipping_address = COALESCE($2, shipping_address),
           shipping_phone = COALESCE($3, shipping_phone),
           shipping_city = COALESCE($4, shipping_city),
           area = COALESCE($5, area),
           photo_url = COALESCE($6, photo_url)
       WHERE id = $7
       RETURNING *`,
      [
        displayName || null, 
        shippingAddress || null, 
        shippingPhone || null, 
        shippingCity || null, 
        area || null,
        photoURL || null, 
        userId
      ]
    );

    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    console.log(`Profile updated successfully for user ${userId}`);

    res.json({ 
      message: 'Profile updated successfully',
      user: { 
        uid: user.id, 
        email: user.email, 
        displayName: user.display_name, 
        role: user.role,
        photoURL: user.photo_url,
        shippingAddress: user.shipping_address,
        shippingPhone: user.shipping_phone,
        shippingCity: user.shipping_city,
        area: user.area,
        createdAt: new Date(user.created_at).getTime()
      } 
    });
  } catch (err: any) {
    console.error("Update profile error details:", err);
    res.status(500).json({ error: err.message });
  }
});

// Products Routes
app.get("/api/products", async (req, res) => {
  const start = Date.now();
  const full = req.query.full === 'true';
  try {
    // Optimization: If NOT full, we only fetch the first image to keep payload small
    let query;
    if (full) {
      query = "SELECT * FROM products ORDER BY created_at DESC";
    } else {
      query = "SELECT id, name, price, category, images[1:1] as images, stock, sold_count, rating, reviews_count, is_featured, created_at, tags FROM products ORDER BY created_at DESC";
    }
    
    const result = await getPool().query(query);
    const duration = Date.now() - start;
    if (duration > 2000) {
      console.warn(`[PERF] SLOW DB QUERY: GET /api/products (${full ? 'full' : 'compact'}) took ${duration}ms`);
    }
    
    const products = result.rows.map(row => ({
      ...row,
      price: Number(row.price),
      rating: Number(row.rating),
      sold_count: Number(row.sold_count || 0),
      soldCount: Number(row.sold_count || 0),
      reviewsCount: Number(row.reviews_count || 0),
      isFeatured: !!row.is_featured,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.created_at).getTime(),
      tags: row.tags || []
    }));
    res.json(products);
  } catch (err: any) {
    console.error("Fetch products error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const result = await getPool().query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const row = result.rows[0];
    res.json({
      ...row,
      price: Number(row.price),
      rating: Number(row.rating),
      soldCount: Number(row.sold_count || 0),
      reviewsCount: Number(row.reviews_count || 0),
      isFeatured: !!row.is_featured,
      createdAt: new Date(row.created_at).getTime(),
      tags: row.tags || []
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", authenticateToken, isAdmin, async (req, res) => {
  const start = Date.now();
  try {
    const { name, description, price, category, images, stock } = req.body;
    console.log(`Creating product: ${name}, ${images?.length || 0} images, Payload size approx: ${JSON.stringify(req.body).length} bytes`);
    
    const id = 'p' + Math.random().toString(36).substr(2, 9);
    const result = await getPool().query(
      'INSERT INTO products (id, name, description, price, category, images, stock) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, name, description, price, category, images, stock]
    );
    console.log(`Product created successfully: ${id} in ${Date.now() - start}ms`);
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Product creation error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/products/:id", authenticateToken, isAdmin, async (req, res) => {
  const start = Date.now();
  const productId = req.params.id;
  try {
    const { name, description, price, category, images, stock } = req.body;
    console.log(`Updating product ${productId}: ${name}, ${images?.length || 0} images`);
    
    const result = await getPool().query(
      'UPDATE products SET name = $1, description = $2, price = $3, category = $4, images = $5, stock = $6 WHERE id = $7 RETURNING *',
      [name, description, price, category, images, stock, productId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    console.log(`Product updated successfully: ${productId} in ${Date.now() - start}ms`);
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error(`Update product error for ${productId}:`, err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/products/:id", authenticateToken, isAdmin, async (req, res) => {
  const productId = req.params.id;
  console.log(`Attempting to delete product ${productId}`);
  try {
    // Check if product is in any orders
    const orderCheck = await getPool().query('SELECT id FROM order_items WHERE product_id = $1 LIMIT 1', [productId]);
    if (orderCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete product that is associated with existing orders. Try updating its stock to 0 instead.' });
    }

    await getPool().query('DELETE FROM products WHERE id = $1', [productId]);
    res.json({ message: 'Product deleted' });
  } catch (err: any) {
    console.error(`Delete product error for ${productId}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Categories Routes
app.get("/api/categories", async (req, res) => {
  try {
    const result = await getPool().query("SELECT * FROM categories ORDER BY created_at ASC");
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/categories", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const id = 'c' + Math.random().toString(36).substr(2, 9);
    const result = await getPool().query(
      'INSERT INTO categories (id, name, icon, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, name, icon, description]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/categories/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const result = await getPool().query(
      'UPDATE categories SET name = $1, icon = $2, description = $3 WHERE id = $4 RETURNING *',
      [name, icon, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/categories/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    await getPool().query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Orders Routes
app.get("/api/users", authenticateToken, isAdmin, async (req: any, res: any) => {
  try {
    const result = await getPool().query('SELECT id, email, display_name, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/orders", authenticateToken, async (req: any, res: any) => {
  try {
    const user = req.user;
    let result;
    if (user.role === 'admin') {
      result = await getPool().query(`
        SELECT o.*,
               COALESCE(json_agg(item_details) FILTER (WHERE item_details.id IS NOT NULL), '[]'::json) as items
        FROM orders o
        LEFT JOIN (
          SELECT oi.*, p.name, p.images[1:1] as images
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
        ) AS item_details ON o.id = item_details.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `);
    } else {
      result = await getPool().query(`
        SELECT o.*,
               COALESCE(json_agg(item_details) FILTER (WHERE item_details.id IS NOT NULL), '[]'::json) as items
        FROM orders o
        LEFT JOIN (
          SELECT oi.*, p.name, p.images[1:1] as images
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
        ) AS item_details ON o.id = item_details.order_id
        WHERE o.user_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `, [user.id]);
    }
    const orders = result.rows.map(row => {
      let shippingAddr = row.shipping_address;
      if (typeof shippingAddr === 'string' && shippingAddr.startsWith('{')) {
        try {
          shippingAddr = JSON.parse(shippingAddr);
        } catch (e) {
          console.error('Failed to parse shipping address JSON:', e);
        }
      }
      
      return {
        ...row,
        userId: row.user_id,
        totalAmount: Number(row.total),
        shippingAddress: shippingAddr,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.created_at).getTime()
      };
    });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders", authenticateToken, async (req: any, res: any) => {
  const start = Date.now();
  console.log(`[ORDER] POST /api/orders started for user ${req.user.id}`);
  let client;
  try {
    const userId = req.user.id;
    const { items, total, shippingAddress } = req.body;
    
    if (!items || !items.length) {
      console.warn(`[ORDER] Empty items for user ${userId}`);
      return res.status(400).json({ error: 'Cart is empty' });
    }

    console.log(`[ORDER] Order data: ${items.length} items, total: ${total}`);
    
    client = await getPool().connect();
    console.log(`[ORDER] DB Client acquired in ${Date.now() - start}ms`);

    await client.query('BEGIN');
    const orderRes = await client.query(
      'INSERT INTO orders (user_id, total, shipping_address, shipping_phone, shipping_city, area) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [userId, total, JSON.stringify(shippingAddress), shippingAddress.phone || '', shippingAddress.city || '', shippingAddress.area || '']
    );
    const orderId = orderRes.rows[0].id;
    console.log(`[ORDER] Order record created: ${orderId}`);
    
    console.log(`[ORDER] Inserting ${items.length} items...`);
    const values: any[] = [];
    const placeholders = items.map((item: any, i: number) => {
      const offset = i * 4;
      values.push(orderId, item.id, item.quantity, item.price);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
    }).join(', ');
    
    await client.query(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ${placeholders}`, values);
    
    await client.query('COMMIT');
    const duration = Date.now() - start;
    console.log(`[ORDER] Order ${orderId} committed successfully in ${duration}ms`);
    
    res.json({ id: orderId });

    // Background notification
    (async () => {
      try {
        const productIds = items.map((i: any) => i.id);
        const prodRes = await getPool().query('SELECT id, name, images[1:1] as images FROM products WHERE id = ANY($1)', [productIds]);
        
        const productsMap = prodRes.rows.reduce((acc: any, p: any) => {
          acc[p.id] = p;
          return acc;
        }, {});

        const detailedItems = items.map((i: any) => ({
          ...i,
          name: productsMap[i.id]?.name || 'Unknown Product'
        }));

        const firstItemImage = prodRes.rows.find(p => p.id === items[0].id)?.images?.[0] || null;

        await sendTelegramNotification({
          orderId,
          total,
          shippingAddress,
          items: detailedItems,
          type: 'NEW',
          imageUrl: firstItemImage
        });
      } catch (err) {
        console.error("[ORDER] Background notify failed:", err);
      }
    })();
    
  } catch (err: any) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch (e) { console.error("[ORDER] Rollback failed:", e); }
    }
    console.error(`[ORDER] FAILED for user ${req.user.id}:`, err);
    res.status(500).json({ error: err.message || 'Failed to process order' });
  } finally {
    if (client) client.release();
  }
});

app.put("/api/orders/:id/status", authenticateToken, isAdmin, async (req: any, res: any) => {
  const orderId = req.params.id;
  const { status } = req.body;
  console.log(`Updating order ${orderId} status to ${status}`);
  try {
    const result = await getPool().query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, orderId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const updatedOrder = result.rows[0];
    if (status === 'cancelled') {
      sendTelegramNotification({
        orderId, 
        total: Number(updatedOrder.total), 
        shippingAddress: typeof updatedOrder.shipping_address === 'string' ? JSON.parse(updatedOrder.shipping_address) : updatedOrder.shipping_address,
        items: [], 
        type: 'CANCELLED'
      });
    }
    
    res.json(updatedOrder);
  } catch (err: any) {
    console.error(`Update status error for order ${orderId}:`, err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/orders/:id", authenticateToken, async (req: any, res: any) => {
  const orderId = req.params.id;
  const userId = req.user.id;
  const role = req.user.role;
  const isAdminUser = role === 'admin' || req.user.email === 'hanichomoh@gmail.com';

  console.log(`Attempting to cancel order ${orderId} by user ${userId} (isAdmin: ${isAdminUser})`);

  try {
    let result;
    if (isAdminUser) {
      result = await getPool().query('UPDATE orders SET status = \'cancelled\' WHERE id = $1 RETURNING *', [orderId]);
    } else {
      result = await getPool().query(
        'UPDATE orders SET status = \'cancelled\' WHERE id = $1 AND user_id = $2 AND status = \'pending\' RETURNING *',
        [orderId, userId]
      );
    }
    
    if (result.rows.length === 0) {
      console.warn(`Order ${orderId} cancel failed: Not found or not pending`);
      return res.status(400).json({ error: 'Order not found or cannot be cancelled' });
    }
    
    const cancelledOrder = result.rows[0];
    sendTelegramNotification({
      orderId, 
      total: Number(cancelledOrder.total), 
      shippingAddress: typeof cancelledOrder.shipping_address === 'string' ? JSON.parse(cancelledOrder.shipping_address) : cancelledOrder.shipping_address,
      items: [], 
      type: 'CANCELLED'
    });

    console.log(`Order ${orderId} cancelled successfully`);
    res.json({ message: 'Order cancelled' });
  } catch (err: any) {
    console.error(`Order ${orderId} cancel error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Wishlist
app.post("/api/wishlist", authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { productIds } = req.body;
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM wishlist WHERE user_id = $1', [userId]);
      for (const pid of productIds) {
        await client.query('INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)', [userId, pid]);
      }
      await client.query('COMMIT');
      res.json({ message: 'Success' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Server startup
const PORT = 3000;

async function startServer() {
  const resolvedDistPath = path.resolve(process.cwd(), 'dist');
  const distExists = fs.existsSync(resolvedDistPath) && fs.existsSync(path.join(resolvedDistPath, 'index.html'));
  
  // Detect production mode
  const isProduction = process.env.NODE_ENV === 'production' || distExists;

  console.log(`\n--- SERVER STARTUP SEQUENCE ---`);
  console.log(`[BOOT] Time: ${new Date().toISOString()}`);
  console.log(`[BOOT] Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`[BOOT] PORT: ${PORT}`);
  console.log(`[BOOT] Dist Exists: ${distExists}`);
  
  try {
    // 1. Database Init in background - do not block
    initializeDatabase().catch(err => {
      console.error("[DB] Background initialization failed. The server will still function but API calls requiring DB may fail.", err.message);
    });

    // 2. Integration logic (Prefer Vite middleware in non-production environments)
    if (!isProduction) {
      try {
        console.log("[BOOT] Starting Vite Middleware...");
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
        console.log("[BOOT] Vite Middleware ready.");
      } catch (e) {
        console.error("[BOOT] Vite initialization failed:", e);
        if (distExists) {
          console.log("[BOOT] Falling back to static assets...");
          setupStaticServing(resolvedDistPath);
        }
      }
    } else if (distExists) {
      console.log("[BOOT] Serving static files from /dist");
      setupStaticServing(resolvedDistPath);
    } else {
      console.warn("[BOOT] Warning: No build artifacts found and not in dev mode.");
    }

    // 3. Final SPA Fallback
    app.get('*', (req, res, next) => {
      // API 404
      if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
      }
      
      // Asset 404
      if (/\.(js|css|json|png|jpg|jpeg|gif|svg|ico|map|ts|tsx|woff|woff2|ttf)$/i.test(req.url)) {
        return res.status(404).send('Resource not found');
      }

      // Try dist/index.html
      const indexPath = path.join(resolvedDistPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        return res.sendFile(indexPath);
      }

      // Root index.html fallback
      const rootIndex = path.resolve(process.cwd(), 'index.html');
      if (fs.existsSync(rootIndex)) {
        return res.status(200).sendFile(rootIndex);
      }
      
      res.status(500).send(`Application not built. Mode: ${process.env.NODE_ENV}, Dist: ${distExists}`);
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n🚀 daydeals merkato SERVER ONLINE ON PORT ${PORT}`);
      console.log(`-----------------------------------\n`);
    });
  } catch (err) {
    console.error("[BOOT] CRITICAL FAILURE:", err);
    try { app.listen(PORT, "0.0.0.0"); } catch (e) {}
  }
}

function setupStaticServing(distPath: string) {
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
    index: false, // We'll handle the root via get('*') or express.static will handle /index.html
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'text/javascript');
      }
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
      // Security headers for mobile browsers
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  }));
}

// Always start the server in this container environment 
startServer();

// Telegram Helper
async function sendTelegramNotification(details: {
  orderId: string,
  total: number,
  shippingAddress: any,
  items: any[],
  type?: 'NEW' | 'CANCELLED' | 'COMPLETED',
  imageUrl?: string | null
}) {
  const { orderId, total, shippingAddress, items, type = 'NEW', imageUrl } = details;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!token || !chatId) {
    console.warn("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured, skipping notification.");
    return;
  }

  const isCancelled = type === 'CANCELLED';
  const isCompleted = type === 'COMPLETED';
  
  let emoji = '🛍️';
  let title = 'daydeals merkato — Order Received';
  
  if (isCancelled) {
    emoji = '❌';
    title = 'daydeals merkato — Order Cancelled';
  } else if (isCompleted) {
    emoji = '✅';
    title = 'daydeals merkato — Order Completed';
  }

  const customerName = shippingAddress?.fullName || 'N/A';
  const phone = shippingAddress?.phone || 'N/A';
  const address = shippingAddress?.address || 'N/A';
  const city = shippingAddress?.city || 'N/A';
  const area = shippingAddress?.area || 'N/A';

  let itemsListText = '';
  let subtotal = 0;
  
  if (items && items.length > 0) {
    itemsListText = '\n📦 *Items:*\n' + items.map(item => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      subtotal += itemTotal;
      return `• ${item.name || 'Product'} × ${item.quantity || 1} — ${itemTotal.toLocaleString()} ETB`;
    }).join('\n');
  }

  // Calculate delivery (dummy math if not provided, assuming total includes it)
  const delivery = total - subtotal;

  const message = `${emoji} *${title}*

👤 *Customer:* ${customerName}
📞 *Phone:* ${phone}

📍 *Shipping Address:*
${address}
${area}, ${city}
${itemsListText}

💰 *Subtotal:* ${subtotal.toLocaleString()} ETB
🚚 *Delivery:* ${delivery > 0 ? delivery.toLocaleString() : '0'} ETB
💵 *Total:* ${total.toLocaleString()} ETB
💳 *Payment:* Cash on Delivery

🆔 *Order ID:* ${orderId}`;

  try {
    const isBase64 = imageUrl && imageUrl.startsWith('data:');
    const endpoint = (imageUrl && !isBase64) ? 'sendPhoto' : 'sendMessage';
    const body: any = {
      chat_id: chatId,
      parse_mode: 'Markdown'
    };

    if (imageUrl && !isBase64) {
      body.photo = imageUrl;
      body.caption = message;
    } else {
      body.text = message;
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Telegram API Error:", err);
      if (imageUrl) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' })
        });
      }
    }
  } catch (e) {
    console.error("Failed to send Telegram notification:", e);
  }
}

// Final Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("!!! UNHANDLED EXPRESS ERROR !!!", err);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message,
    path: req.url
  });
});

export default app;
