const path = require('path');
const fs = require('fs');
const { initDb, getDb, closeDb } = require('../db/database');

async function audit() {
  console.log('--- AUDITING CURRENT DATABASE & CATALOG ---');
  await initDb();
  const db = getDb();

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('Tables in database:');
  const tableCounts = {};
  for (const t of tables) {
    if (t.name.startsWith('sqlite_')) continue;
    const res = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get();
    tableCounts[t.name] = res.c;
    console.log(`  - ${t.name}: ${res.c} rows`);
  }

  console.log('\n--- PRODUCT CATALOG DETAILS ---');
  const prodSample = db.prepare("SELECT * FROM products LIMIT 5").all();
  console.log('Sample products:', JSON.stringify(prodSample, null, 2));

  const catCounts = db.prepare("SELECT category, COUNT(*) as count, MIN(price) as min_price, MAX(price) as max_price, AVG(price) as avg_price FROM products GROUP BY category ORDER BY count DESC").all();
  console.log('\nCategory breakdown:');
  console.table(catCounts);

  const idStats = db.prepare("SELECT MIN(id) as min_id, MAX(id) as max_id, COUNT(DISTINCT id) as distinct_ids, COUNT(*) as total_rows FROM products").get();
  console.log('\nProduct ID stats:', idStats);

  // Check image keys / image URLs
  const imgStats = db.prepare("SELECT COUNT(image_key) as has_key, COUNT(image_url) as has_url FROM products").get();
  console.log('Image stats:', imgStats);

  // Check foreign key dependencies
  console.log('\n--- FOREIGN KEY DEPENDENCIES ON PRODUCTS ---');
  const orderItemsCount = db.prepare("SELECT COUNT(*) as c FROM order_items").get().c;
  const orderItemsUniqueProds = db.prepare("SELECT COUNT(DISTINCT product_id) as c FROM order_items").get().c;
  const cartItemsCount = db.prepare("SELECT COUNT(*) as c FROM cart_items").get().c;
  const interactionsCount = db.prepare("SELECT COUNT(*) as c FROM user_interactions").get().c;
  const interactionsUniqueProds = db.prepare("SELECT COUNT(DISTINCT product_id) as c FROM user_interactions").get().c;
  const salesHistoryCount = db.prepare("SELECT COUNT(*) as c FROM sales_history").get().c;
  const salesHistoryUniqueProds = db.prepare("SELECT COUNT(DISTINCT product_id) as c FROM sales_history").get().c;

  console.log(`order_items: ${orderItemsCount} rows (${orderItemsUniqueProds} unique product_ids)`);
  console.log(`cart_items: ${cartItemsCount} rows`);
  console.log(`user_interactions: ${interactionsCount} rows (${interactionsUniqueProds} unique product_ids)`);
  console.log(`sales_history: ${salesHistoryCount} rows (${salesHistoryUniqueProds} unique product_ids)`);

  // Check ID patterns
  const prefixes = db.prepare("SELECT SUBSTR(id, 1, 1) as prefix, COUNT(*) as count FROM products GROUP BY prefix").all();
  console.log('ID Prefixes:', prefixes);

  // Check category taxonomy
  const distinctCategories = db.prepare("SELECT DISTINCT category FROM products").all().map(r => r.category);
  console.log(`Total distinct categories: ${distinctCategories.length}`);

  // Inspect existing routes/services referencing specific product IDs
  // e.g. f1, p1, etc.
  closeDb({ save: false });
}

audit().catch(console.error);
