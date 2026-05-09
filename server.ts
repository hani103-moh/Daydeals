import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const neonUrl = 'postgresql://neondb_owner:npg_v9xk7nlEJbjz@ep-weathered-dawn-apantfwu-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const envDbUrl = process.env.DATABASE_URL;
const connectionString = (envDbUrl && envDbUrl.startsWith('postgres')) ? envDbUrl : neonUrl;

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

async function initializeDatabase() {
  const client = await pool.connect();
  try {
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
      
      -- Ensure admin user
      UPDATE users SET role = 'admin' WHERE email = 'hanichomoh@gmail.com';
      
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon VARCHAR(100);
      
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
      
      -- Ensure sold_count exists and is initialized
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;
      UPDATE products SET sold_count = 0 WHERE sold_count IS NULL;

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
      
      -- Seed DB if empty
      INSERT INTO categories (id, name, icon, description)
      SELECT '1', 'Electronics', 'Smartphone', 'Tech gadgets and devices'
      WHERE NOT EXISTS (SELECT 1 FROM categories);
      
      INSERT INTO categories (id, name, icon, description)
      SELECT '2', 'Clothing', 'Shirt', 'Fashionable clothes'
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE id = '2');
      
      INSERT INTO products (id, name, description, price, category, images, stock, rating)
      SELECT 'p1', 'Wireless Headphones', 'Premium wireless headphones.', 299.99, 'Electronics', ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'], 15, 4.8
      WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
    `);
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Error initializing database:", err);
  } finally {
    client.release();
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log("Starting server in mode:", process.env.NODE_ENV);
  console.log("Current working directory:", process.cwd());

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // API routes
  app.get("/api/health", async (req, res) => {
    try {
      const dbCheck = await pool.query("SELECT 1");
      res.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
    } catch (err) {
      console.error("Health check DB error:", err);
      res.status(500).json({ status: "error", message: "Database connection failed", error: String(err) });
    }
  });

  // Auth Middleware
  const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      (req as any).user = user;
      next();
    });
  };

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, displayName } = req.body;
      if (!email || !password || !displayName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const lowerEmail = email.toLowerCase();
      console.log("Registering user:", lowerEmail);

      const hashedPassword = await bcrypt.hash(password, 10);
      const role = lowerEmail === 'hanichomoh@gmail.com' ? 'admin' : 'user';

      const result = await pool.query(
        'INSERT INTO users (email, password_hash, display_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name, role',
        [lowerEmail, hashedPassword, displayName, role]
      );
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      
      console.log("Registration successful for:", lowerEmail);
      res.json({ token, user: { uid: user.id, email: user.email, displayName: user.display_name, role: user.role } });
    } catch (err: any) {
      console.error("Register error:", err);
      if (err.code === '23505') { // unique violation
        res.status(400).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: 'Internal server error: ' + err.message });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const lowerEmail = (email || '').toLowerCase();
      console.log("Login attempt for:", lowerEmail);

      const result = await pool.query('SELECT * FROM users WHERE email = $1', [lowerEmail]);
      const user = result.rows[0];

      if (!user) {
        console.warn("User not found:", lowerEmail);
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      console.log("User found, comparing passwords...");
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        console.warn("Invalid password for:", lowerEmail);
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      console.log("Password valid, signing token...");
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      
      res.json({ token, user: { uid: user.id, email: user.email, displayName: user.display_name, role: user.role, photoURL: user.photo_url, wishlist: [] } });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: 'Internal server error: ' + err.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const result = await pool.query('SELECT id, email, display_name, role, photo_url, shipping_address, shipping_phone, shipping_city FROM users WHERE id = $1', [userId]);
      const user = result.rows[0];

      if (!user) return res.sendStatus(404);

      const wishlistResult = await pool.query('SELECT product_id FROM wishlist WHERE user_id = $1', [userId]);
      const wishlist = wishlistResult.rows.map(row => row.product_id);

      res.json({ user: { uid: user.id, email: user.email, displayName: user.display_name, role: user.role, photoURL: user.photo_url, shippingAddress: user.shipping_address, shippingPhone: user.shipping_phone, shippingCity: user.shipping_city, wishlist } });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin middleware
  const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    authenticateToken(req, res, () => {
      if ((req as any).user.role !== 'admin') return res.sendStatus(403);
      next();
    });
  };

  app.put("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { displayName, shippingAddress, shippingPhone, shippingCity } = req.body;
      await pool.query('UPDATE users SET display_name = $1, shipping_address = $2, shipping_phone = $3, shipping_city = $4 WHERE id = $5', [displayName, shippingAddress, shippingPhone, shippingCity, userId]);
      res.json({ message: 'Profile updated' });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Users
  app.get("/api/users", authenticateAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT id, email, display_name, role, photo_url, created_at FROM users ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const full = req.query.full === 'true';
      
      let query;
      if (full) {
        query = `
          SELECT 
            id, name, description, price::FLOAT as price, category, images, stock, 
            COALESCE(sold_count, 0) as sold_count, rating::FLOAT as rating,
            (EXTRACT(EPOCH FROM created_at) * 1000)::FLOAT as "createdAt",
            (EXTRACT(EPOCH FROM updated_at) * 1000)::FLOAT as "updatedAt"
          FROM products 
          ORDER BY created_at DESC
        `;
      } else {
        query = `
          SELECT 
            id, name, description, price::FLOAT as price, category, stock, rating::FLOAT as rating, 
            COALESCE(sold_count, 0) as sold_count,
            (EXTRACT(EPOCH FROM created_at) * 1000)::FLOAT as "createdAt",
            (CASE WHEN images IS NOT NULL AND array_length(images, 1) > 0 
                  THEN ARRAY[images[1]] 
                  ELSE ARRAY[]::TEXT[] 
             END) as images
          FROM products 
          ORDER BY created_at DESC
        `;
      }
      
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (err) {
      console.error("GET /api/products error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(`GET /api/products/${req.params.id} error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/products", authenticateAdmin, async (req, res) => {
    try {
      console.log("POST /api/products received");
      const { name, description, price, category, images, stock } = req.body;
      const id = 'p' + Date.now();
      console.log(`Creating product ${id}: ${name}`);
      await pool.query(
        'INSERT INTO products (id, name, description, price, category, images, stock, rating) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [id, name, description, price, category, images, stock, 0]
      );
      console.log(`Product ${id} created successfully`);
      res.json({ id });
    } catch (err) {
      console.error('POST /api/products error:', err);
      res.status(500).json({ error: 'Internal server error', details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.put("/api/products/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`PUT /api/products/${id} received`);
      const { name, description, price, category, images, stock } = req.body;
      await pool.query(
        'UPDATE products SET name = $1, description = $2, price = $3, category = $4, images = $5, stock = $6 WHERE id = $7',
        [name, description, price, category, images, stock, id]
      );
      console.log(`Product ${id} updated successfully`);
      res.json({ message: 'Product updated' });
    } catch (err) {
      console.error(`PUT /api/products/${req.params.id} error:`, err);
      res.status(500).json({ error: 'Internal server error', details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.delete("/api/products/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`DELETE /api/products/${id} received`);
      await pool.query('DELETE FROM wishlist WHERE product_id = $1', [id]);
      await pool.query('DELETE FROM order_items WHERE product_id = $1', [id]);
      await pool.query('DELETE FROM products WHERE id = $1', [id]);
      console.log(`Product ${id} deleted successfully`);
      res.json({ message: 'Product deleted' });
    } catch (err) {
      console.error(`DELETE /api/products/${req.params.id} error:`, err);
      res.status(500).json({ error: 'Internal server error', details: err instanceof Error ? err.message : String(err) });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM categories ORDER BY created_at ASC");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/categories", authenticateAdmin, async (req, res) => {
    try {
      const { name, description, icon } = req.body;
      const id = 'c' + Date.now();
      await pool.query(
        'INSERT INTO categories (id, name, description, icon) VALUES ($1, $2, $3, $4)',
        [id, name, description, icon]
      );
      res.json({ id });
    } catch (err) {
      console.error("POST /api/categories error:", err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put("/api/categories/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, icon } = req.body;
      await pool.query(
        'UPDATE categories SET name = $1, description = $2, icon = $3 WHERE id = $4',
        [name, description, icon, id]
      );
      res.json({ message: 'Category updated' });
    } catch (err) {
      console.error("PUT /api/categories error:", err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete("/api/categories/:id", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM categories WHERE id = $1', [id]);
      res.json({ message: 'Category deleted' });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Orders
  app.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      let result;
      if (user.role === 'admin') {
        result = await pool.query(`
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
        result = await pool.query(`
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
      
      const orders = result.rows.map(order => {
        let shippingAddress;
        try {
          shippingAddress = JSON.parse(order.shipping_address);
        } catch(e) {
          shippingAddress = {
            address: order.shipping_address,
            phone: order.shipping_phone,
            city: order.shipping_city,
            fullName: 'N/A',
            area: 'N/A'
          };
        }
        return {
          ...order,
          userId: order.user_id,
          totalAmount: parseFloat(order.total),
          createdAt: new Date(order.created_at).getTime(),
          updatedAt: order.updated_at ? new Date(order.updated_at).getTime() : new Date(order.created_at).getTime(),
          shippingAddress
        };
      });
      
      res.json(orders);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  });

  app.post("/api/orders", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
      console.log('Starting order creation for user:', (req as any).user.id);
      
      const userId = (req as any).user.id;
      const { items, total, shippingAddress } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must contain items' });
      }
      
      if (!shippingAddress || typeof shippingAddress !== 'object') {
        return res.status(400).json({ error: 'Valid shipping address is required' });
      }

      await client.query('BEGIN');
      
      const orderRes = await client.query(
        'INSERT INTO orders (user_id, total, shipping_address, shipping_phone, shipping_city) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userId, total, JSON.stringify(shippingAddress), shippingAddress.phone || 'N/A', shippingAddress.city || 'N/A']
      );
      const orderId = orderRes.rows[0].id;
      console.log('Order created with ID:', orderId);

      // Pre-calculate values for bundled insertion
      const itemsValues: any[] = [];
      const placeHolders: string[] = [];
      let paramIndex = 2; // Start from $2 because $1 is orderId

      for (const item of items) {
        placeHolders.push(`($1, $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
        itemsValues.push(item.id, item.quantity, item.price);
        paramIndex += 3;
      }

      // Perform stock updates and sold count increments sequentially
      // Note: PoolClient does not support concurrent queries on the same connection.
      for (const item of items) {
        await client.query(
          'UPDATE products SET stock = stock - $1, sold_count = COALESCE(sold_count, 0) + $1 WHERE id = $2', 
          [item.quantity, item.id]
        );
      }

      if (placeHolders.length > 0) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ${placeHolders.join(',')}`,
          [orderId, ...itemsValues]
        );
      }

      await client.query('COMMIT');
      console.log('Order transaction committed successfully');
      res.json({ id: orderId });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.log('Order transaction rolled back due to error:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    } finally {
      client.release();
    }
  });

  app.put("/api/orders/:id/status", authenticateAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
      res.json({ message: 'Order status updated' });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const orderRes = await pool.query('SELECT user_id, status FROM orders WHERE id = $1', [id]);
      if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
      
      const order = orderRes.rows[0];
      if (user.role !== 'admin' && order.user_id !== user.id) return res.status(403).json({ error: 'Unauthorized' });
      
      if (order.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be cancelled' });

      // Restore stock and decrement sold count
      const items = await pool.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [id]);
      for (const item of items.rows) {
        await pool.query('UPDATE products SET stock = stock + $1, sold_count = sold_count - $1 WHERE id = $2', [item.quantity, item.product_id]);
      }

      await pool.query('DELETE FROM order_items WHERE order_id = $1', [id]);
      await pool.query('DELETE FROM orders WHERE id = $1', [id]);
      res.json({ message: 'Order deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Wishlist
  app.post("/api/wishlist", authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { productIds } = req.body;
      
      // Update by deleting all and reinserting
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM wishlist WHERE user_id = $1', [userId]);
        for (const productId of productIds) {
          await client.query('INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)', [userId, productId]);
        }
        await client.query('COMMIT');
        res.json({ message: 'Wishlist updated' });
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    console.log("Production mode: Serving static files from:", distPath);
    app.use('/assets', express.static(path.join(distPath, 'assets'), {
      fallthrough: false, // Don't fall through to SPA fallback for /assets
      maxAge: '1d'
    }));
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      // If it looks like a file request but wasn't caught by express.static, it's missing
      if (req.url.includes('.') || req.url.startsWith('/assets/')) {
        console.error("File not found:", req.url);
        return res.status(404).send('Not found');
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start listening immediately
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Initialize DB after starting server
    initializeDatabase().catch(err => {
      console.error("Delayed database initialization failed:", err);
    });
  });
}

startServer();
