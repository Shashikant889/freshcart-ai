/**
 * FreshCart AI — Master Large-Scale Synthetic Retail Data Generation Pipeline
 * Orchestrates reproducible, high-throughput generation for:
 * 1. 100+ Categories
 * 2. ~10,000 Realistic Grocery Products
 * 3. ~150,000 Synthetic Customers
 * 4. 1 Full Year of Historical Sales, Orders & Interactions
 * 
 * Run: node scripts/generate-all-data.js
 */

const fs = require('fs');
const path = require('path');
const { initDb, getDb, saveDb, closeDb, DB_PATH } = require('../db/database');
const { generateCategories, CATEGORIES_DATA } = require('./generate-categories');
const { generateDeterministicProducts } = require('./generate-products');
const { generateDeterministicUsers } = require('./generate-users');
const { generateSalesHistory, generateOrdersAndInteractions } = require('./generate-retail-history');

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

async function runGenerationPipeline(options = {}) {
  const startTime = Date.now();
  console.log('\n====================================================================');
  console.log('  🌿 FRESHCART AI: LARGE-SCALE SYNTHETIC RETAIL DATA GENERATOR');
  console.log('====================================================================');
  console.log('  Target: 100+ Categories | ~10,000 Products | ~150,000 Users | 1-Yr History');
  console.log('  Deterministic Seed: 42');
  console.log('====================================================================\n');

  const PRODUCT_TARGET = options.productCount || 10000;
  const USER_TARGET = options.userCount || 150000;
  const ORDER_TARGET = options.orderCount || 65000;

  // Initialize clean database schema
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  await initDb();
  const db = getDb();

  const rng = seededRandom(42);

  // -------------------------------------------------------------
  // 1. Categories Generation & Storage
  // -------------------------------------------------------------
  console.log('📂 1. Generating 100+ Category Taxonomy...');
  const categories = generateCategories();
  const catJsonPath = path.join(__dirname, '..', 'data', 'categories.json');
  fs.mkdirSync(path.dirname(catJsonPath), { recursive: true });
  fs.writeFileSync(catJsonPath, JSON.stringify(categories, null, 2));
  console.log(`   ✅ ${categories.length} structured categories saved to data/categories.json\n`);

  // -------------------------------------------------------------
  // 2. 10,000 Products Bulk Generation & Insertion
  // -------------------------------------------------------------
  console.log(`📦 2. Generating ${PRODUCT_TARGET} Realistic Products...`);
  const products = generateDeterministicProducts(PRODUCT_TARGET);

  console.log(`   Bulk inserting ${products.length} products into SQLite...`);
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, emoji, category, price, unit, description, stock, rating, tags, image_key, image_url, image_alt, brand, mrp, discount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const productBatchSize = 2000;
  for (let i = 0; i < products.length; i += productBatchSize) {
    const chunk = products.slice(i, i + productBatchSize);
    db.transaction(() => {
      for (const p of chunk) {
        insertProduct.run(
          p.id,
          p.name,
          p.emoji || '🛒',
          p.category,
          p.price,
          p.unit || '1 pc',
          p.description || '',
          p.stock || 0,
          p.rating || 4.5,
          typeof p.tags === 'string' ? p.tags : JSON.stringify(p.tags || []),
          p.image_key || 'grocery-default',
          p.image_url || '/images/products/grocery-default.svg',
          p.image_alt || p.name,
          p.brand || 'FreshCart',
          p.mrp || Math.round(p.price * 1.2),
          p.discount || 0
        );
      }
    })();
    process.stdout.write(`   ↳ Inserted ${Math.min(i + productBatchSize, products.length)} / ${products.length} products\r`);
  }
  console.log(`\n   ✅ ${products.length} products seeded successfully.\n`);

  // -------------------------------------------------------------
  // 3. 150,000 Synthetic Users Bulk Generation & Insertion
  // -------------------------------------------------------------
  console.log(`👥 3. Generating ${USER_TARGET} Synthetic Users across Indian Metro Hubs...`);
  const users = generateDeterministicUsers(USER_TARGET);

  console.log(`   Bulk inserting ${users.length} users into SQLite in transaction chunks...`);
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const userBatchSize = 10000;
  for (let i = 0; i < users.length; i += userBatchSize) {
    const chunk = users.slice(i, i + userBatchSize);
    db.transaction(() => {
      for (const u of chunk) {
        insertUser.run(u.id, u.name, u.email, u.password_hash, u.role, u.created_at);
      }
    })();
    process.stdout.write(`   ↳ Inserted ${Math.min(i + userBatchSize, users.length)} / ${users.length} users\r`);
  }
  console.log(`\n   ✅ ${users.length} users seeded successfully.\n`);

  // -------------------------------------------------------------
  // 4. Sales History Generation (365 Days)
  // -------------------------------------------------------------
  console.log('📊 4. Generating 12 Months of Time-Series Sales History for Demand Forecasting...');
  const salesData = generateSalesHistory(products, '2025-01-01', 365, rng);

  console.log(`   Bulk inserting ${salesData.length} daily sales records...`);
  const insertSale = db.prepare(`
    INSERT INTO sales_history (product_id, date, quantity_sold, revenue)
    VALUES (?, ?, ?, ?)
  `);

  const salesBatchSize = 10000;
  for (let i = 0; i < salesData.length; i += salesBatchSize) {
    const chunk = salesData.slice(i, i + salesBatchSize);
    db.transaction(() => {
      for (const s of chunk) {
        insertSale.run(s.product_id, s.date, s.quantity_sold, s.revenue);
      }
    })();
  }
  console.log(`   ✅ ${salesData.length} daily sales data points seeded.\n`);

  // -------------------------------------------------------------
  // 5. Orders, Order Items & Behavioral User Interactions
  // -------------------------------------------------------------
  console.log('🛒 5. Generating Orders, Order Items & Funnel Interactions (View, Cart, Purchase, Rate)...');
  const { orders, orderItems, interactions } = generateOrdersAndInteractions(users, products, ORDER_TARGET, rng);

  // Insert Interactions
  console.log(`   Bulk inserting ${interactions.length} customer interactions...`);
  const insertInteraction = db.prepare(`
    INSERT INTO user_interactions (user_id, product_id, action, rating, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const interactionBatchSize = 10000;
  for (let i = 0; i < interactions.length; i += interactionBatchSize) {
    const chunk = interactions.slice(i, i + interactionBatchSize);
    db.transaction(() => {
      for (const inter of chunk) {
        insertInteraction.run(inter.user_id, inter.product_id, inter.action, inter.rating, inter.created_at);
      }
    })();
  }
  console.log(`   ✅ ${interactions.length} interactions seeded.`);

  // Insert Orders
  console.log(`   Bulk inserting ${orders.length} historical customer orders...`);
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, user_id, subtotal, delivery_fee, tax, total, status, customer_name, address, phone, payment_method, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const orderBatchSize = 5000;
  for (let i = 0; i < orders.length; i += orderBatchSize) {
    const chunk = orders.slice(i, i + orderBatchSize);
    db.transaction(() => {
      for (const o of chunk) {
        insertOrder.run(o.id, o.user_id, o.subtotal, o.delivery_fee, o.tax, o.total, o.status, o.customer_name, o.address, o.phone, o.payment_method, o.created_at);
      }
    })();
  }
  console.log(`   ✅ ${orders.length} orders seeded.`);

  // Insert Order Items
  console.log(`   Bulk inserting ${orderItems.length} order items...`);
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
    VALUES (?, ?, ?, ?)
  `);

  const itemBatchSize = 10000;
  for (let i = 0; i < orderItems.length; i += itemBatchSize) {
    const chunk = orderItems.slice(i, i + itemBatchSize);
    db.transaction(() => {
      for (const oi of chunk) {
        insertOrderItem.run(oi.order_id, oi.product_id, oi.quantity, oi.price_at_purchase);
      }
    })();
  }
  console.log(`   ✅ ${orderItems.length} order items seeded.\n`);

  // Persist to disk
  console.log('💾 Saving and flushing SQLite database to disk...');
  saveDb();

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  const dbStat = fs.statSync(DB_PATH);
  const dbSizeMb = (dbStat.size / (1024 * 1024)).toFixed(2);

  // -------------------------------------------------------------
  // Summary Verification
  // -------------------------------------------------------------
  const summary = {
    categories: categories.length,
    products: db.prepare('SELECT COUNT(*) as c FROM products').get().c,
    users: db.prepare('SELECT COUNT(*) as c FROM users').get().c,
    orders: db.prepare('SELECT COUNT(*) as c FROM orders').get().c,
    orderItems: db.prepare('SELECT COUNT(*) as c FROM order_items').get().c,
    interactions: db.prepare('SELECT COUNT(*) as c FROM user_interactions').get().c,
    salesRecords: db.prepare('SELECT COUNT(*) as c FROM sales_history').get().c,
    dbSizeMb,
    generationDurationSeconds: durationSec
  };

  console.log('════════════════════════════════════════════════════════════════════');
  console.log('  🎉 LARGE-SCALE RETAIL DATA GENERATION & SEEDING COMPLETE!');
  console.log('════════════════════════════════════════════════════════════════════');
  console.log(`  📂 Grocery Categories:     ${summary.categories}`);
  console.log(`  📦 Catalog Products:       ${summary.products.toLocaleString()}`);
  console.log(`  👥 Synthetic Users:        ${summary.users.toLocaleString()}`);
  console.log(`  🛒 Historical Orders:      ${summary.orders.toLocaleString()}`);
  console.log(`  🛍️  Order Line Items:       ${summary.orderItems.toLocaleString()}`);
  console.log(`  ⚡ User Interactions:      ${summary.interactions.toLocaleString()}`);
  console.log(`  📈 Time-Series Sales Rows: ${summary.salesRecords.toLocaleString()}`);
  console.log(`  💾 SQLite Database Size:   ${summary.dbSizeMb} MB`);
  console.log(`  ⏱️  Total Pipeline Time:    ${summary.generationDurationSeconds}s`);
  console.log('════════════════════════════════════════════════════════════════════\n');

  closeDb();
  return summary;
}

if (require.main === module) {
  runGenerationPipeline().catch(err => {
    console.error('Pipeline failed:', err);
    process.exit(1);
  });
}

module.exports = { runGenerationPipeline };
