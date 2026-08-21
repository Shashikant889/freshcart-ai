-- FreshCart AI Grocery — Database Schema

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  unit TEXT,
  description TEXT,
  stock INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  tags TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  subtotal REAL,
  delivery_fee REAL,
  tax REAL,
  total REAL,
  status TEXT DEFAULT 'confirmed',
  customer_name TEXT,
  address TEXT,
  phone TEXT,
  payment_method TEXT DEFAULT 'cash',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT REFERENCES orders(id),
  product_id TEXT REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_at_purchase REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  product_id TEXT REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS user_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  product_id TEXT REFERENCES products(id),
  action TEXT NOT NULL CHECK(action IN ('view', 'cart', 'purchase', 'rate')),
  rating REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sales_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT REFERENCES products(id),
  date TEXT NOT NULL,
  quantity_sold INTEGER NOT NULL,
  revenue REAL NOT NULL
);

-- Indexes for ML query performance
CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_product ON user_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_interactions_action ON user_interactions(action);
CREATE INDEX IF NOT EXISTS idx_sales_product_date ON sales_history(product_id, date);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
