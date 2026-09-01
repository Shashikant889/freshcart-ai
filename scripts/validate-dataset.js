/**
 * FreshCart AI — Large-Scale Dataset Relational Integrity & Quality Validator
 * Audits counts, foreign keys, orphan records, value constraints, and performance indexes.
 */

const { initDb, getDb, closeDb } = require('../db/database');

async function validateDataset() {
  console.log('\n====================================================================');
  console.log('  🔍 FRESHCART AI: DATASET VALIDATION & INTEGRITY AUDITOR');
  console.log('====================================================================\n');

  await initDb();
  const db = getDb();

  let checksPassed = 0;
  let checksFailed = 0;

  function assertRule(name, condition, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      checksPassed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${details ? '— ' + details : ''}`);
      checksFailed++;
    }
  }

  // 1. Table Counts
  console.log('📌 1. Checking Scaled Record Counts:');
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  const orderCount = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const orderItemCount = db.prepare('SELECT COUNT(*) as c FROM order_items').get().c;
  const interactionCount = db.prepare('SELECT COUNT(*) as c FROM user_interactions').get().c;
  const salesCount = db.prepare('SELECT COUNT(*) as c FROM sales_history').get().c;
  const categoryCount = db.prepare('SELECT COUNT(DISTINCT category) as c FROM products').get().c;

  assertRule(`Categories count (~100 target): ${categoryCount}`, categoryCount >= 95, `Found ${categoryCount}`);
  assertRule(`Products count (~10,000 target): ${productCount}`, productCount >= 9900 && productCount <= 11000, `Found ${productCount}`);
  assertRule(`Users count (~150,000 target): ${userCount}`, userCount >= 149000 && userCount <= 151000, `Found ${userCount}`);
  assertRule(`Historical Orders count: ${orderCount}`, orderCount >= 50000, `Found ${orderCount}`);
  assertRule(`Order Items count: ${orderItemCount}`, orderItemCount >= 100000, `Found ${orderItemCount}`);
  assertRule(`User Interactions count: ${interactionCount}`, interactionCount >= 150000, `Found ${interactionCount}`);
  assertRule(`Time-Series Sales Records count: ${salesCount}`, salesCount >= 20000, `Found ${salesCount}`);

  // 2. Baseline Preservation
  console.log('\n📌 2. Checking Baseline Preservation:');
  const adminUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@freshcart.com');
  assertRule('Admin user (admin@freshcart.com) exists with role=admin', adminUser && adminUser.role === 'admin');

  const customerUser = db.prepare('SELECT * FROM users WHERE email = ?').get('customer@freshcart.com');
  assertRule('Customer user (customer@freshcart.com) exists with role=customer', customerUser && customerUser.role === 'customer');

  const originalProductF1 = db.prepare('SELECT * FROM products WHERE id = "f1"').get();
  assertRule('Baseline product "f1" (Organic Apples) preserved', originalProductF1 && originalProductF1.name.includes('Apple'));

  const originalProductD1 = db.prepare('SELECT * FROM products WHERE id = "d1"').get();
  assertRule('Baseline product "d1" (Whole Milk) preserved', originalProductD1 && originalProductD1.name.includes('Milk'));

  // 3. Referential & Foreign Key Integrity
  console.log('\n📌 3. Checking Referential Integrity & Zero Orphan Records:');
  const orphanOrderUsers = db.prepare(`
    SELECT COUNT(*) as c FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE u.id IS NULL
  `).get().c;
  assertRule('Zero orphaned user IDs in orders table', orphanOrderUsers === 0, `Found ${orphanOrderUsers} orphans`);

  const orphanOrderItems = db.prepare(`
    SELECT COUNT(*) as c FROM order_items oi
    LEFT JOIN orders o ON oi.order_id = o.id
    WHERE o.id IS NULL
  `).get().c;
  assertRule('Zero orphaned order IDs in order_items table', orphanOrderItems === 0, `Found ${orphanOrderItems} orphans`);

  const orphanOrderItemProducts = db.prepare(`
    SELECT COUNT(*) as c FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE p.id IS NULL
  `).get().c;
  assertRule('Zero orphaned product IDs in order_items table', orphanOrderItemProducts === 0, `Found ${orphanOrderItemProducts} orphans`);

  const orphanInteractions = db.prepare(`
    SELECT COUNT(*) as c FROM user_interactions ui
    LEFT JOIN products p ON ui.product_id = p.id
    WHERE p.id IS NULL
  `).get().c;
  assertRule('Zero orphaned product IDs in user_interactions table', orphanInteractions === 0, `Found ${orphanInteractions} orphans`);

  const orphanSalesHistory = db.prepare(`
    SELECT COUNT(*) as c FROM sales_history sh
    LEFT JOIN products p ON sh.product_id = p.id
    WHERE p.id IS NULL
  `).get().c;
  assertRule('Zero orphaned product IDs in sales_history table', orphanSalesHistory === 0, `Found ${orphanSalesHistory} orphans`);

  // 4. Mathematical & Value Consistency
  console.log('\n📌 4. Checking Value Constraints & Schema Correctness:');
  const invalidPrices = db.prepare('SELECT COUNT(*) as c FROM products WHERE price <= 0 OR price IS NULL').get().c;
  assertRule('All products have positive prices (> 0)', invalidPrices === 0, `Found ${invalidPrices} invalid prices`);

  const negativeStock = db.prepare('SELECT COUNT(*) as c FROM products WHERE stock < 0').get().c;
  assertRule('All product stock quantities are non-negative', negativeStock === 0, `Found ${negativeStock} negative stock rows`);

  const invalidRatings = db.prepare('SELECT COUNT(*) as c FROM products WHERE rating < 1.0 OR rating > 5.0').get().c;
  assertRule('All ratings are within [1.0, 5.0] range', invalidRatings === 0, `Found ${invalidRatings} out-of-range ratings`);

  const emptyTags = db.prepare('SELECT COUNT(*) as c FROM products WHERE tags IS NULL OR tags = ""').get().c;
  assertRule('All products have valid JSON tags', emptyTags === 0, `Found ${emptyTags} missing tags`);

  // 5. Database Indexes
  console.log('\n📌 5. Checking High-Performance SQLite Indexes:');
  const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all().map(i => i.name);
  const requiredIndexes = ['idx_products_category', 'idx_products_rating', 'idx_orders_user', 'idx_order_items_product', 'idx_interactions_user'];
  for (const idx of requiredIndexes) {
    assertRule(`Index '${idx}' exists on SQLite master`, indexes.includes(idx));
  }

  console.log('\n====================================================================');
  console.log(`  🎯 VALIDATION SUMMARY: ${checksPassed} PASSED, ${checksFailed} FAILED`);
  console.log('====================================================================\n');

  closeDb({ save: false });

  if (checksFailed > 0) {
    process.exit(1);
  }
  return { checksPassed, checksFailed };
}

if (require.main === module) {
  validateDataset().catch(err => {
    console.error('Validation crashed:', err);
    process.exit(1);
  });
}

module.exports = { validateDataset };
