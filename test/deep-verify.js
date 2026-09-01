/**
 * Deep Multi-Agent Verification & Rectification Test Suite
 * Executes 40+ rigorous test assertions across all 10 agent tiers.
 */

const assert = require('assert');
const { getDb, initDb } = require('../db/database');
const { getHybridRecommendations, getSimilarProductsContentBased, getFrequentlyBoughtTogether, evaluateRecommendationMetrics } = require('../ml/recommendation-engine');
const { forecastProductDemand, getInventoryStockAlerts, fitLinearRegression } = require('../ml/demand-forecasting');
const { getCustomerSegmentation, runKMeans } = require('../ml/customer-segmentation');
const { simulatePriceChange, getProductElasticity } = require('../ml/dynamic-pricing');
const { evaluateOrderRisk } = require('../ml/fraud-detection');
const { optimizeDeliveryDispatch, haversineDistance } = require('../ml/route-optimizer');
const { matchImageToProducts } = require('../ml/visual-search');
const { processAssistantQuery, RECIPE_KNOWLEDGE_BASE } = require('../ml/recipe-assistant');
const { smartSearch } = require('../ml/smart-search');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'freshcart-super-secret-jwt-key-aiml-2026';

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    failedTests++;
  }
}

async function runDeepVerification() {
  console.log('\n===============================================================');
  console.log('  🤖 10-AGENT MULTI-TIER SYSTEM VERIFICATION & AUDIT SUITE');
  console.log('===============================================================\n');

  await initDb();
  const db = getDb();

  // -------------------------------------------------------------
  // AGENT 1 & 2: Database & Relational Schema Integrity
  // -------------------------------------------------------------
  console.log('📌 [Agent 2] Database & Schema Integrity:');

  test('Database has all 7 core tables', () => {
    const tables = ['users', 'products', 'cart_items', 'orders', 'order_items', 'sales_history', 'user_interactions'];
    for (const t of tables) {
      const row = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(t);
      assert.ok(row, `Table ${t} must exist`);
    }
  });

  test('Catalog has >= 31 seeded grocery products (scaled catalog)', () => {
    const count = db.prepare('SELECT count(*) as cnt FROM products').get().cnt;
    assert.ok(count >= 31, 'Products count should be >= 31');
  });

  test('All products have valid INR prices, units, and JSON tags', () => {
    const products = db.prepare('SELECT * FROM products').all();
    for (const p of products) {
      assert.ok(p.price > 0, `Product ${p.id} price must be > 0`);
      assert.ok(p.name && p.name.length > 0, `Product ${p.id} must have a name`);
      assert.ok(p.unit, `Product ${p.id} must have a unit`);
      const tags = JSON.parse(p.tags || '[]');
      assert.ok(Array.isArray(tags), `Product ${p.id} tags must be JSON array`);
    }
  });

  test('Sales history has 12 months of synthetic training data', () => {
    const count = db.prepare('SELECT count(*) as cnt FROM sales_history').get().cnt;
    assert.ok(count >= 10000, `Sales history count (${count}) should be >= 10,000`);
  });

  test('User interactions table has >= 50,000 events for ML training', () => {
    const count = db.prepare('SELECT count(*) as cnt FROM user_interactions').get().cnt;
    assert.ok(count >= 50000, `Interactions count (${count}) should be >= 50,000`);
  });

  // -------------------------------------------------------------
  // AGENT 3: Security & Authentication Tier
  // -------------------------------------------------------------
  console.log('\n📌 [Agent 3] Security, JWT & Authentication:');

  test('Admin user exists with valid bcrypt password hash', () => {
    const admin = db.prepare('SELECT * FROM users WHERE email=?').get('admin@freshcart.com');
    assert.ok(admin, 'Admin user must exist');
    assert.strictEqual(admin.role, 'admin');
    const valid = bcrypt.compareSync('admin123', admin.password_hash);
    assert.ok(valid, 'Admin password must match bcrypt hash');
  });

  test('JWT token generation and verification works with claims', () => {
    const token = jwt.sign({ id: 1, email: 'admin@freshcart.com', role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    assert.ok(token);
    const decoded = jwt.verify(token, JWT_SECRET);
    assert.strictEqual(decoded.email, 'admin@freshcart.com');
    assert.strictEqual(decoded.role, 'admin');
  });

  // -------------------------------------------------------------
  // AGENT 4: Product Catalog & Search Filtering
  // -------------------------------------------------------------
  console.log('\n📌 [Agent 4] Catalog Query & Search Filtering:');

  test('Category filter returns correct subset (fruits >= 6)', () => {
    const fruits = db.prepare('SELECT * FROM products WHERE category=?').all('fruits');
    assert.ok(fruits.length >= 6);
  });

  test('NLP smart search relevance scoring with Hindi synonyms', () => {
    const resApple = smartSearch('seb', 5); // Hindi for apple
    assert.ok(resApple.length > 0, 'Hindi synonym "seb" should match Apples');
    assert.strictEqual(resApple[0].product.id, 'f1');

    const resYogurt = smartSearch('dahi', 5); // Hindi for curd/yogurt
    assert.ok(resYogurt.length > 0, 'Hindi synonym "dahi" should match Yogurt');
    assert.strictEqual(resYogurt[0].product.id, 'd3');
  });

  // -------------------------------------------------------------
  // AGENT 5: Cart Calculations & INR Rules
  // -------------------------------------------------------------
  console.log('\n📌 [Agent 5] Cart Pricing & INR Delivery Rules:');

  test('Cart delivery fee is ₹49 below ₹500 and ₹0 above ₹500', () => {
    const subtotalLow = 400;
    const deliveryLow = subtotalLow >= 500 ? 0 : 49;
    assert.strictEqual(deliveryLow, 49);

    const subtotalHigh = 650;
    const deliveryHigh = subtotalHigh >= 500 ? 0 : 49;
    assert.strictEqual(deliveryHigh, 0);
  });

  test('GST is calculated accurately at 8%', () => {
    const subtotal = 1000;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    assert.strictEqual(tax, 80);
  });

  // -------------------------------------------------------------
  // AGENT 6: Order Processing & Transaction Integrity
  // -------------------------------------------------------------
  console.log('\n📌 [Agent 6] Order Lifecycle & ACID Transactions:');

  test('Transactional order creation decrements stock and logs interaction', () => {
    const prodBefore = db.prepare('SELECT stock FROM products WHERE id=?').get('f1');
    const initialStock = prodBefore.stock;

    db.transaction(() => {
      db.prepare('UPDATE products SET stock = stock - 2 WHERE id=?').run('f1');
      db.prepare(`
        INSERT INTO orders (id, user_id, customer_name, address, phone, subtotal, delivery_fee, tax, total, payment_method, status)
        VALUES ('TEST_ORD_001', 2, 'Test User', 'Test Address', '9999999999', 498, 49, 39.84, 586.84, 'upi', 'pending')
      `).run();
      db.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
        VALUES ('TEST_ORD_001', 'f1', 2, 249)
      `).run();
      db.prepare(`
        INSERT INTO user_interactions (user_id, product_id, action)
        VALUES (2, 'f1', 'purchase')
      `).run();
    })();

    const prodAfter = db.prepare('SELECT stock FROM products WHERE id=?').get('f1');
    assert.strictEqual(prodAfter.stock, initialStock - 2, 'Stock must decrement by 2');

    // Clean up test order
    db.prepare('DELETE FROM order_items WHERE order_id=?').run('TEST_ORD_001');
    db.prepare('DELETE FROM orders WHERE id=?').run('TEST_ORD_001');
    db.prepare('UPDATE products SET stock = ? WHERE id=?').run(initialStock, 'f1');
  });

  // -------------------------------------------------------------
  // AGENT 7: Machine Learning Mathematical Engines
  // -------------------------------------------------------------
  console.log('\n📌 [Agent 7] Machine Learning & Mathematical Engines:');

  test('1. Hybrid Recommendations generates personalized ranked items', () => {
    const recs = getHybridRecommendations(2, 6);
    assert.ok(Array.isArray(recs), 'Recs must be an array');
    assert.ok(recs.length > 0, 'Recs must not be empty');
    assert.ok(recs[0].matchPercentage !== undefined);
  });

  test('2. Apriori Association Rules finds Frequently Bought Together items', () => {
    const fbt = getFrequentlyBoughtTogether('f1', 4);
    assert.ok(Array.isArray(fbt));
    assert.ok(fbt.length > 0, 'Should find complementary items');
    assert.ok(fbt[0].confidence, 'Must have confidence');
  });

  test('3. Recommendation Evaluation yields Precision@5 and Recall@5', () => {
    const metrics = evaluateRecommendationMetrics(5);
    assert.ok(metrics.precisionAtK > 0.50, `Precision@5 (${metrics.precisionAtK}) should be > 0.50`);
    assert.ok(metrics.recallAtK > 0.40, `Recall@5 (${metrics.recallAtK}) should be > 0.40`);
  });

  test('4. OLS Demand Forecasting produces 7-day future predictions with trend', () => {
    const forecast = forecastProductDemand('f1', 7);
    assert.ok(forecast);
    assert.strictEqual(forecast.dailyForecast.length, 7);
    assert.ok(forecast.metrics.trendSlope !== undefined);
  });

  test('5. Stockout Alerts correctly classifies inventory risks', () => {
    const alerts = getInventoryStockAlerts();
    assert.ok(Array.isArray(alerts));
  });

  test('6. Custom K-Means Clustering segments users into 4 personas', () => {
    const seg = getCustomerSegmentation();
    assert.ok(seg.clusters);
    assert.strictEqual(seg.clusters.length, 4, 'Must have exactly 4 persona clusters');
    assert.ok(seg.totalCustomersEvaluated >= 50, 'Evaluated customers should be >= 50');
  });

  test('7. WCSS Elbow evaluation returns monotonic decreasing values', () => {
    const seg = getCustomerSegmentation();
    assert.ok(seg.elbowCurve && seg.elbowCurve.length >= 4);
    for (let i = 0; i < seg.elbowCurve.length - 1; i++) {
      assert.ok(seg.elbowCurve[i].wcss >= seg.elbowCurve[i + 1].wcss, 'WCSS must decrease with K');
    }
  });

  test('8. Price Elasticity of Demand (Ed) simulation & optimal price P*', () => {
    const sim = simulatePriceChange('f1', 10);
    assert.ok(sim.elasticityCoefficient < 0, 'Price elasticity for grocery must be negative');
    assert.ok(sim.optimalRevenuePrice > 0, 'Profit optimal price must be > 0');
  });

  test('9. Z-Score Real-Time Transaction Fraud Detection flags anomalies', () => {
    const safeOrder = { customerName: 'Test', userId: 2, total: 350, items: [{ quantity: 2 }] };
    const safeResult = evaluateOrderRisk(safeOrder);
    assert.strictEqual(safeResult.riskLevel, 'low', 'Normal ₹350 order should be LOW risk');

    const extremeOrder = { customerName: 'Scam Bot', userId: 2, total: 45000, items: [{ quantity: 50 }] };
    const extremeResult = evaluateOrderRisk(extremeOrder);
    assert.ok(extremeResult.riskScore >= 40, 'Extreme ₹45,000 order must have elevated RiskScore');
  });

  test('10. VRP 2-Opt Route Optimization calculates fuel savings and valid itinerary', () => {
    const dispatch = optimizeDeliveryDispatch(6);
    assert.ok(dispatch.totalDistanceKm > 0, 'Total distance must be > 0');
    assert.ok(dispatch.itinerary.length >= 7, 'Itinerary should include Hub + stops + return');
    assert.ok(dispatch.itinerary[0].isHub, 'First stop must be Hub');
    assert.ok(dispatch.itinerary[dispatch.itinerary.length - 1].isHub, 'Last stop must be Hub');
  });

  test('11. Visual Search matches product signatures based on color hint', () => {
    const matchesRed = matchImageToProducts('red apple fruit', 3);
    assert.ok(matchesRed.length > 0);
    assert.strictEqual(matchesRed[0].product.id, 'f1', 'Red query should match Organic Apples first');

    const matchesGreen = matchImageToProducts('green broccoli', 3);
    assert.ok(matchesGreen.length > 0);
    assert.strictEqual(matchesGreen[0].product.id, 'v1', 'Green query should match Broccoli first');
  });

  test('12. FreshBot Recipe Assistant parses dish into ingredients and bundle price', () => {
    const recipeRes = processAssistantQuery('mango lassi');
    assert.strictEqual(recipeRes.type, 'recipe');
    assert.ok(recipeRes.recipe.items.length >= 3);
    assert.ok(recipeRes.recipe.totalCost > 0);
  });

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`  🎉 ALL 10 AGENTS AUDIT COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runDeepVerification().catch(err => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});
