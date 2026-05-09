import "dotenv/config";
import express from "express";
import path from "path";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";

// Neon Connection String Handling
const neonUrl = 'postgresql://neondb_owner:npg_v9xk7nlEJbjz@ep-weathered-dawn-apantfwu-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require';

let _pool: Pool | null = null;
function getPool() {
  if (!_pool) {
    const envDbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    const connectionString = (envDbUrl && envDbUrl.startsWith('postgres')) ? envDbUrl : neonUrl;
    _pool = new Pool({
      connectionString,
      max: 20, // Increased for better concurrency
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false }
    });
    _pool.on('error', (err) => console.error('Unexpected error on idle client', err));
  }
  return _pool;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

async function initializeDatabase() {
  const pool = getPool();
  
  // 1. FAST CHECK: If users table exists, skip main init
  try {
    const tableCheck = await pool.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'users' LIMIT 1");
    if (tableCheck.rows.length > 0) {
      console.log("Database tables already exist. Running light migrations if needed...");
      
      // Still run migrations but don't re-create everything
      let client;
      try {
        client = await pool.connect();
      await client.query(`
          CREATE EXTENSION IF NOT EXISTS pgcrypto;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_phone TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_city TEXT;
          ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon VARCHAR(100);
          ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
          ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
          
          -- Fix orders table if it existed without new columns
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone TEXT;
          ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city TEXT;
          
          UPDATE users SET role = 'admin' WHERE email = 'hanichomoh@gmail.com';
          
          -- Performance Indexes
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
          CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
          CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
        `);

        // Check if seeding is needed even if tables existed
        const catCheck = await client.query('SELECT 1 FROM categories LIMIT 1');
        if (catCheck.rows.length === 0) {
          console.log("Seeding categories (empty table)...");
          await client.query(`
            INSERT INTO categories (id, name, icon, description) VALUES
            ('c1', 'Electronics', 'Smartphone', 'Tech gadgets and devices'),
            ('c2', 'Clothing', 'Shirt', 'Modern fashion for everyone'),
            ('c3', 'Home', 'Home', 'Essential household items'),
            ('c4', 'Beauty', 'Sparkles', 'Cosmetics and skincare')
          `);
        }

        const prodCheck = await client.query('SELECT 1 FROM products LIMIT 1');
        if (prodCheck.rows.length === 0) {
          console.log("Seeding products (empty table)...");
          await client.query(`
            INSERT INTO products (id, name, description, price, category, images, stock, rating, reviews_count, tags, is_featured) VALUES
            ('p1', 'Premium Wireless Headphones', 'High-quality sound with noise cancellation.', 199.99, 'Electronics', ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'], 50, 4.8, 124, ARRAY['audio', 'wireless', 'premium'], true),
            ('p2', 'Minimalist Watch', 'Elegant design for every occasion.', 129.50, 'Clothing', ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'], 100, 4.5, 89, ARRAY['fashion', 'accessory'], false),
            ('p3', 'Smart Speaker', 'Voice-controlled assistant with clear audio.', 79.99, 'Electronics', ARRAY['https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800&q=80'], 30, 4.2, 56, ARRAY['smart-home', 'audio'], true),
            ('p4', 'Running Shoes', 'Lightweight and durable for all terrains.', 89.00, 'Clothing', ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'], 75, 4.7, 210, ARRAY['sport', 'running', 'fitness'], false)
          `);
        }
      } catch (e) {
        console.warn("Migration warning (safe to ignore if columns exist):", e);
      } finally {
        if (client) client.release();
      }
      return;
    }
  } catch (e) {
    console.log("Users table check failed, proceeding with full init.");
  }

  console.log("Performing full database initialization...");
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
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
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address TEXT,
        shipping_phone TEXT,
        shipping_city TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id),
        product_id VARCHAR(255) REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL
      );
      CREATE TABLE IF NOT EXISTS wishlist (
        user_id UUID REFERENCES users(id),
        product_id VARCHAR(255) REFERENCES products(id),
        PRIMARY KEY (user_id, product_id)
      );
    `);
    
    await client.query(`UPDATE users SET role = 'admin' WHERE email = 'hanichomoh@gmail.com'`);

    // SEEDING
    const catCheck = await client.query('SELECT 1 FROM categories LIMIT 1');
    if (catCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO categories (id, name, icon, description) VALUES
        ('c1', 'Electronics', 'Smartphone', 'Tech gadgets and devices'),
        ('c2', 'Clothing', 'Shirt', 'Modern fashion for everyone'),
        ('c3', 'Home', 'Home', 'Essential household items'),
        ('c4', 'Beauty', 'Sparkles', 'Cosmetics and skincare')
      `);
    }

    const prodCheck = await client.query('SELECT 1 FROM products LIMIT 1');
    if (prodCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO products (id, name, description, price, category, images, stock, rating, reviews_count, tags, is_featured) VALUES
        ('p1', 'Premium Wireless Headphones', 'High-quality sound with noise cancellation.', 199.99, 'Electronics', ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'], 50, 4.8, 124, ARRAY['audio', 'wireless', 'premium'], true),
        ('p2', 'Minimalist Watch', 'Elegant design for every occasion.', 129.50, 'Clothing', ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'], 100, 4.5, 89, ARRAY['fashion', 'accessory'], false),
        ('p3', 'Smart Speaker', 'Voice-controlled assistant with clear audio.', 79.99, 'Electronics', ARRAY['https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800&q=80'], 30, 4.2, 56, ARRAY['smart-home', 'audio'], true),
        ('p4', 'Running Shoes', 'Lightweight and durable for all terrains.', 89.00, 'Clothing', ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'], 75, 4.7, 210, ARRAY['sport', 'running', 'fitness'], false)
      `);
    }

    await client.query('COMMIT');
    console.log("Database initialized successfully");
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error("Error initializing database:", err);
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
  const start = Date.now();
  if (!initPromise) {
    console.log("Database not initialized. Starting initialization sequence...");
    initPromise = initializeDatabase().then(() => {
      isInitialized = true;
      console.log(`Database initialization completed in ${Date.now() - start}ms`);
    }).catch(err => {
      initPromise = null;
      console.error(`Database initialization FAILED after ${Date.now() - start}ms:`, err);
      throw err;
    });
  }
  return initPromise;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Middleware to ensure DB is initialized for API calls
app.use(async (req, res, next) => {
  const start = Date.now();
  if (req.url.startsWith('/api') && req.url !== '/api/health' && req.url !== '/api/init-db') {
    try {
      await ensureInitialized();
    } catch (err: any) {
      console.error("Auto-init failed:", err);
      // If we are getting a 500 error on every API call because of DB, it helps to know why
      if (!isInitialized) {
        return res.status(503).json({ 
          error: "Database initializing or failed to initialize", 
          details: err.message,
          retryAfter: 5
        });
      }
    }
  }
  
  // Track response completion
  res.on('finish', () => {
    if (req.url.startsWith('/api')) {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    }
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

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    const lowerEmail = email.toLowerCase();
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
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await getPool().query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const wishlistRes = await getPool().query('SELECT product_id FROM wishlist WHERE user_id = $1', [user.id]);
    const wishlist = wishlistRes.rows.map(r => r.product_id);

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        uid: user.id, 
        email: user.email, 
        displayName: user.display_name, 
        role: user.role,
        photoURL: user.photo_url,
        shippingAddress: user.shipping_address,
        shippingPhone: user.shipping_phone,
        shippingCity: user.shipping_city,
        wishlist: wishlist,
        createdAt: new Date(user.created_at).getTime()
      } 
    });
  } catch (err: any) {
    console.error("Login error:", err);
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

    res.json({ 
      user: { 
        uid: user.id, 
        email: user.email, 
        displayName: user.display_name, 
        role: user.role,
        photoURL: user.photo_url,
        shippingAddress: user.shipping_address,
        shippingPhone: user.shipping_phone,
        shippingCity: user.shipping_city,
        wishlist: wishlist,
        createdAt: new Date(user.created_at).getTime()
      } 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Products Routes
app.get("/api/products", async (req, res) => {
  const start = Date.now();
  try {
    const result = await getPool().query("SELECT * FROM products ORDER BY created_at DESC");
    console.log(`Fetch products took ${Date.now() - start}ms - found ${result.rows.length} items`);
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
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const result = await getPool().query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    res.json(result.rows[0] || { error: 'Not found' });
  } catch (err: any) {
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

// Orders Routes
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
          SELECT oi.*, p.name, p.images
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
          SELECT oi.*, p.name, p.images
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
        ) AS item_details ON o.id = item_details.order_id
        WHERE o.user_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `, [user.id]);
    }
    const orders = result.rows.map(row => ({
      ...row,
      userId: row.user_id,
      totalAmount: Number(row.total),
      shippingAddress: typeof row.shipping_address === 'string' ? JSON.parse(row.shipping_address) : row.shipping_address,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.created_at).getTime()
    }));
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders", authenticateToken, async (req: any, res: any) => {
  const start = Date.now();
  const client = await getPool().connect();
  try {
    const userId = req.user.id;
    const { items, total, shippingAddress } = req.body;
    console.log(`Starting order creation for user ${userId} with ${items?.length} items...`);
    
    await client.query('BEGIN');
    const orderRes = await client.query(
      'INSERT INTO orders (user_id, total, shipping_address, shipping_phone, shipping_city) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [userId, total, JSON.stringify(shippingAddress), shippingAddress.phone || '', shippingAddress.city || '']
    );
    const orderId = orderRes.rows[0].id;
    console.log(`Order record created: ${orderId}. Inserting ${items.length} items...`);
    
    if (items.length > 0) {
      const values: any[] = [];
      const placeholders = items.map((item: any, i: number) => {
        const offset = i * 4;
        values.push(orderId, item.id, item.quantity, item.price);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
      }).join(', ');
      
      await client.query(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ${placeholders}`, values);
    }
    
    await client.query('COMMIT');
    console.log(`Order ${orderId} committed successfully in ${Date.now() - start}ms`);
    res.json({ id: orderId });
  } catch (err: any) {
    if (client) await client.query('ROLLBACK');
    console.error("Order creation error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
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

// Static files and SPA fallback
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  
  // Local development only - dynamic Vite import
  import("vite").then(async ({ createServer: createViteServer }) => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running locally on port ${PORT}`);
      initializeDatabase().catch(console.error);
    });
  }).catch(err => {
    // Falls back to static serving if Vite is not available (e.g. production build)
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running statically on port ${PORT}`);
      initializeDatabase().then(() => { isInitialized = true; }).catch(console.error);
    });
  });
}

export default app;
