/**
 * Database Seed Script
 * Seeds products, users, and synthetic ML training data
 * Run: node db/seed.js
 */
const { initDb, getDb, saveDb, closeDb, DB_PATH } = require('./database');
const bcrypt = require('bcryptjs');
const products = require('../data/products');
const { generateUsers, generateSalesHistory, generateUserActivity, seededRandom } = require('./synthetic-data');
const fs = require('fs');

const RNG = seededRandom(42); // Deterministic for reproducibility

async function seed() {
  // Delete existing DB for clean reseed
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  await initDb();
  const db = getDb();
  console.log('🌱 Seeding FreshCart AI Database (SQLite WebAssembly)...\n');

  // --- 1. Seed Products ---
  console.log('📦 Seeding 32 products...');
  const { resolveProductImage } = require('../services/image-resolver');
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, emoji, category, price, unit, description, stock, rating, tags, image_key, image_url, image_alt, brand, mrp, discount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const productTags = {
    fruits: '["fresh","organic","natural","healthy"]',
    vegetables: '["fresh","organic","natural","healthy","green"]',
    dairy: '["protein","calcium","fresh","refrigerated"]',
    bakery: '["baked","carbs","breakfast","fresh"]',
    beverages: '["drinks","refreshing","hydration"]',
    snacks: '["crunchy","snacking","evening","party"]',
  };

  const insertProducts = db.transaction(() => {
    for (const p of products) {
      const resolved = resolveProductImage(p);
      const mrp = Math.round(p.price * 1.2 * 100) / 100;
      const discount = Math.round(((mrp - p.price) / mrp) * 100);
      insertProduct.run(
        p.id,
        p.name,
        p.emoji,
        p.category,
        p.price,
        p.unit,
        p.description,
        p.stock,
        p.rating,
        productTags[p.category] || '[]',
        resolved.image_key,
        resolved.image_url,
        p.name,
        'FreshCart',
        mrp,
        discount
      );
    }
  });
  insertProducts();
  console.log(`   ✅ ${products.length} products seeded\n`);

  // --- 2. Seed Users ---
  console.log('👥 Seeding users...');
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)
  `);

  // Admin user
  const adminHash = bcrypt.hashSync('admin123', 10);
  insertUser.run('Admin User', 'admin@freshcart.com', adminHash, 'admin');

  // Demo customer
  const custHash = bcrypt.hashSync('customer123', 10);
  insertUser.run('Demo Customer', 'customer@freshcart.com', custHash, 'customer');

  // Synthetic users
  const syntheticUsers = generateUsers(50, RNG);
  const defaultHash = bcrypt.hashSync('password123', 10);
  const insertSyntheticUsers = db.transaction(() => {
    for (const u of syntheticUsers) {
      const result = insertUser.run(u.name, u.email, defaultHash, 'customer');
      u.dbId = result.lastInsertRowid;
    }
  });
  insertSyntheticUsers();
  console.log(`   ✅ 52 users seeded (1 admin + 1 demo + 50 synthetic)\n`);

  // --- 3. Seed Sales History (12 months) ---
  console.log('📊 Generating 12 months of sales history for demand forecasting...');
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const salesData = generateSalesHistory(products, startDate.toISOString(), 365, RNG);

  const insertSale = db.prepare(`
    INSERT INTO sales_history (product_id, date, quantity_sold, revenue) VALUES (?, ?, ?, ?)
  `);
  const insertSales = db.transaction(() => {
    for (const s of salesData) {
      insertSale.run(s.product_id, s.date, s.quantity_sold, s.revenue);
    }
  });
  insertSales();
  console.log(`   ✅ ${salesData.length} daily sales records seeded\n`);

  // --- 4. Seed User Activity (interactions, orders, order items) ---
  console.log('🔄 Generating user activity data for collaborative filtering...');
  const { interactions, orders, orderItems } = generateUserActivity(syntheticUsers, products, 12, RNG);

  const insertInteraction = db.prepare(`
    INSERT INTO user_interactions (user_id, product_id, action, rating, created_at) VALUES (?, ?, ?, ?, ?)
  `);
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, user_id, subtotal, delivery_fee, tax, total, status, customer_name, address, phone, payment_method, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)
  `);

  const insertActivity = db.transaction(() => {
    for (const i of interactions) {
      insertInteraction.run(i.user_id, i.product_id, i.action, i.rating, i.created_at);
    }
    for (const o of orders) {
      insertOrder.run(o.id, o.user_id, o.subtotal, o.delivery_fee, o.tax, o.total, o.status, o.customer_name, o.address, o.phone, o.payment_method, o.created_at);
    }
    for (const oi of orderItems) {
      insertOrderItem.run(oi.order_id, oi.product_id, oi.quantity, oi.price_at_purchase);
    }
  });
  insertActivity();

  console.log(`   ✅ ${interactions.length} user interactions seeded`);
  console.log(`   ✅ ${orders.length} historical orders seeded`);
  console.log(`   ✅ ${orderItems.length} order items seeded\n`);

  // Save changes to disk
  saveDb();

  // --- Summary ---
  const stats = {
    products: db.prepare('SELECT COUNT(*) as c FROM products').get().c,
    users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    orders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    interactions: db.prepare('SELECT COUNT(*) as c FROM user_interactions').get().c,
    salesRecords: db.prepare('SELECT COUNT(*) as c FROM sales_history').get().c,
  };

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🎉 Database Seeding & Synthetic ML Data Generation Complete!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  📦 Products:           ${stats.products}`);
  console.log(`  👥 Registered Users:   ${stats.users}`);
  console.log(`  🛒 Total Orders:       ${stats.orders}`);
  console.log(`  ⚡ User Interactions:  ${stats.interactions}`);
  console.log(`  📈 Daily Sales Points: ${stats.salesRecords}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n  Demo Accounts:');
  console.log('  🔑 Admin:    admin@freshcart.com / admin123');
  console.log('  🔑 Customer: customer@freshcart.com / customer123\n');

  closeDb();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
