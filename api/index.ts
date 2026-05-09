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
      max: 5,
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
  console.log("Initializing database schema...");
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query(`
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
    
    // Migrations
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user'`);
    await client.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon VARCHAR(100)`);
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0`);
    await client.query(`UPDATE users SET role = 'admin' WHERE email = 'hanichomoh@gmail.com'`);

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

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    vercel: !!process.env.VERCEL,
    timestamp: new Date().toISOString() 
  });
});

app.get("/api/init-db", async (req, res) => {
  try {
    await initializeDatabase();
    res.json({ status: "success" });
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
    res.json({ token, user: { uid: user.id, email: user.email, displayName: user.display_name, role: user.role } });
  } catch (err: any) {
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
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { uid: user.id, email: user.email, displayName: user.display_name, role: user.role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Products Routes
app.get("/api/products", async (req, res) => {
  try {
    const result = await getPool().query("SELECT * FROM products ORDER BY created_at DESC");
    res.json(result.rows);
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
               COALESCE(
                 (SELECT json_agg(item_details)
                  FROM (
                    SELECT oi.*, p.name, p.images
                    FROM order_items oi
                    JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id = o.id
                  ) AS item_details),
                 '[]'::json
               ) as items
        FROM orders o
        ORDER BY o.created_at DESC
      `);
    } else {
      result = await getPool().query(`
        SELECT o.*,
               COALESCE(
                 (SELECT json_agg(item_details)
                  FROM (
                    SELECT oi.*, p.name, p.images
                    FROM order_items oi
                    JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id = o.id
                  ) AS item_details),
                 '[]'::json
               ) as items
        FROM orders o
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC
      `, [user.id]);
    }
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/orders", authenticateToken, async (req: any, res: any) => {
  const client = await getPool().connect();
  try {
    const userId = req.user.id;
    const { items, total, shippingAddress } = req.body;
    await client.query('BEGIN');
    const orderRes = await client.query(
      'INSERT INTO orders (user_id, total, shipping_address) VALUES ($1, $2, $3) RETURNING id',
      [userId, total, JSON.stringify(shippingAddress)]
    );
    const orderId = orderRes.rows[0].id;
    for (const item of items) {
      await client.query('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)', [orderId, item.id, item.quantity, item.price]);
    }
    await client.query('COMMIT');
    res.json({ id: orderId });
  } catch (err: any) {
    await client.query('ROLLBACK');
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
    });
  });
}

export default app;
