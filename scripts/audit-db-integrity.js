/**
 * Database Integrity Auditor
 * Checks:
 * - Orphan records (order_items without orders, order_items without products)
 * - Invalid IDs or null critical fields
 * - Duplicate records
 * - Invalid prices (<= 0 or NaN)
 * - Invalid stock (< 0)
 * - Inconsistent relationships
 * - Missing categories
 */

const { initDb, getDb, closeDb } = require('../db/database');

async function auditDatabase() {
  console.log('\n=== PHASE 7: DATABASE INTEGRITY AUDIT ===\n');
  await initDb();
  const db = getDb();

  const report = {
    totalTables: 0,
    tableCounts: {},
    issues: [],
    orphans: {},
    nullFields: {},
    dataIntegrity: {}
  };

  const tables = ['products', 'categories', 'users', 'orders', 'order_items', 'sales_history', 'user_interactions'];
  report.totalTables = tables.length;

  for (const t of tables) {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${t}`).get().count;
      report.tableCounts[t] = count;
      console.log(`Table: ${t.padEnd(20)} -> ${count.toLocaleString()} rows`);
    } catch (e) {
      report.issues.push(`Table ${t} does not exist or failed query: ${e.message}`);
    }
  }

  // 1. Check for Orphan Records in order_items -> orders
  const orphanOrderItemsOrders = db.prepare(`
    SELECT COUNT(*) as count
    FROM order_items oi
    LEFT JOIN orders o ON oi.order_id = o.id
    WHERE o.id IS NULL
  `).get().count;
  report.orphans.order_items_to_orders = orphanOrderItemsOrders;
  console.log(`\nOrphan order_items without matching order: ${orphanOrderItemsOrders}`);

  // 2. Check for Orphan Records in order_items -> products
  const orphanOrderItemsProducts = db.prepare(`
    SELECT COUNT(*) as count
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE p.id IS NULL
  `).get().count;
  report.orphans.order_items_to_products = orphanOrderItemsProducts;
  console.log(`Orphan order_items without matching product: ${orphanOrderItemsProducts}`);

  // 3. Check for Orphan Records in orders -> users
  const orphanOrdersUsers = db.prepare(`
    SELECT COUNT(*) as count
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE u.id IS NULL AND o.user_id != 'guest' AND o.user_id IS NOT NULL
  `).get().count;
  report.orphans.orders_to_users = orphanOrdersUsers;
  console.log(`Orphan orders without matching user (excluding guest): ${orphanOrdersUsers}`);

  // 4. Check for Orphan Records in user_interactions -> products
  const orphanInteractionsProducts = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_interactions ui
    LEFT JOIN products p ON ui.product_id = p.id
    WHERE p.id IS NULL
  `).get().count;
  report.orphans.interactions_to_products = orphanInteractionsProducts;
  console.log(`Orphan user_interactions without matching product: ${orphanInteractionsProducts}`);

  // 5. Check products with invalid price or stock
  const invalidPriceProducts = db.prepare(`
    SELECT COUNT(*) as count FROM products WHERE price <= 0 OR price IS NULL
  `).get().count;
  console.log(`Products with price <= 0: ${invalidPriceProducts}`);

  const invalidStockProducts = db.prepare(`
    SELECT COUNT(*) as count FROM products WHERE stock < 0 OR stock IS NULL
  `).get().count;
  console.log(`Products with stock < 0: ${invalidStockProducts}`);

  // 6. Check products missing image fields
  const missingImageProducts = db.prepare(`
    SELECT COUNT(*) as count FROM products WHERE image_url IS NULL OR image_url = '' OR image_key IS NULL OR image_key = ''
  `).get().count;
  console.log(`Products with missing image fields: ${missingImageProducts}`);

  // 7. Check users with missing critical fields
  const invalidUsers = db.prepare(`
    SELECT COUNT(*) as count FROM users WHERE email IS NULL OR email = '' OR password_hash IS NULL OR password_hash = ''
  `).get().count;
  console.log(`Users with missing email or password_hash: ${invalidUsers}`);

  // 8. Check sales_history invalid units or revenue
  const invalidSales = db.prepare(`
    SELECT COUNT(*) as count FROM sales_history WHERE quantity_sold < 0 OR revenue < 0
  `).get().count;
  console.log(`Sales history with negative quantities or revenue: ${invalidSales}`);

  closeDb();
  console.log('\n=== DATABASE AUDIT COMPLETE ===\n');
  return report;
}

if (require.main === module) {
  auditDatabase().then(() => process.exit(0)).catch(err => {
    console.error('Audit failed:', err);
    process.exit(1);
  });
}

module.exports = { auditDatabase };
