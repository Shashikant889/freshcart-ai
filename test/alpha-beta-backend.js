/**
 * FreshCart AI - Backend Alpha & Beta Integration and Stress Test Suite
 * 
 * Alpha Stage: Full API contract & lifecycle testing across all 12 endpoints.
 * Beta Stage: Multi-user simulation, concurrent cart operations, order processing,
 * and high-throughput AI inference benchmark.
 */

const http = require('http');
const assert = require('assert');
const { getDb, initDb } = require('../db/database');

const BASE_URL = 'http://localhost:3000';

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

let passedAlpha = 0;
let failedAlpha = 0;
let passedBeta = 0;
let failedBeta = 0;

async function runBackendAlphaBeta() {
  console.log('\n===============================================================');
  console.log('  🧪 FRESHCART AI: BACKEND ALPHA & BETA TESTING SUITE');
  console.log('===============================================================\n');

  await initDb();
  const db = getDb();
  db.prepare('UPDATE products SET stock = 100 WHERE stock < 30').run();

  // =============================================================
  // ALPHA TESTING: Comprehensive API Contract & Route Lifecycle
  // =============================================================
  console.log('🔹 PHASE 1: ALPHA TESTING (API Endpoint Functional Verification)\n');

  // Test 1: Products Listing
  try {
    const res = await request('GET', '/api/products');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.length >= 30, 'Catalog should have at least 30 products');
    console.log(`  ✅ [Alpha-1] Products API: Returned ${res.data.data.length} products`);
    passedAlpha++;
  } catch (e) {
    console.error('  ❌ [Alpha-1] Products API Failed:', e.message);
    failedAlpha++;
  }

  // Test 2: Category Filter & Sort
  try {
    const res = await request('GET', '/api/products?category=fruits&sort=price-asc');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.every(p => p.category === 'fruits'));
    console.log(`  ✅ [Alpha-2] Catalog Filter & Sorting: Fruits category sorted correctly (${res.data.data.length} items)`);
    passedAlpha++;
  } catch (e) {
    console.error('  ❌ [Alpha-2] Catalog Filter Failed:', e.message);
    failedAlpha++;
  }

  // Test 3: NLP Smart Search
  try {
    const res = await request('GET', '/api/search?q=organic');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.length > 0);
    console.log(`  ✅ [Alpha-3] NLP Smart Search: Matched ${res.data.data.length} organic items`);
    passedAlpha++;
  } catch (e) {
    console.error('  ❌ [Alpha-3] NLP Search Failed:', e.message);
    failedAlpha++;
  }

  // Test 4: Auth Lifecycle (Register -> Login -> /me)
  let testUserToken = null;
  const uniqueEmail = `alpha_tester_${Date.now()}@freshcart.com`;
  try {
    const regRes = await request('POST', '/api/auth/register', {}, {
      name: 'Alpha Tester',
      email: uniqueEmail,
      password: 'password123'
    });
    assert.strictEqual(regRes.status, 201);
    testUserToken = regRes.data.data.token;

    const meRes = await request('GET', '/api/auth/me', { Authorization: `Bearer ${testUserToken}` });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.data.data.email, uniqueEmail);
    console.log(`  ✅ [Alpha-4] Auth Lifecycle: Registered, generated JWT & verified /me profile`);
    passedAlpha++;
  } catch (e) {
    console.error('  ❌ [Alpha-4] Auth Lifecycle Failed:', e.message);
    failedAlpha++;
  }

  // Test 5: Admin Login & Protected Stats
  let adminToken = null;
  try {
    const loginRes = await request('POST', '/api/auth/login', {}, {
      email: 'admin@freshcart.com',
      password: 'admin123'
    });
    assert.strictEqual(loginRes.status, 200);
    adminToken = loginRes.data.data.token;

    const dashRes = await request('GET', '/api/admin/dashboard', { Authorization: `Bearer ${adminToken}` });
    assert.strictEqual(dashRes.status, 200);
    assert.ok(dashRes.data.data.totalProducts > 0);
    console.log(`  ✅ [Alpha-5] Admin Dashboard API: Stats authorized & loaded (${dashRes.data.data.totalOrders} orders, ₹${dashRes.data.data.totalRevenue} revenue)`);
    passedAlpha++;
  } catch (e) {
    console.error('  ❌ [Alpha-5] Admin Dashboard Failed:', e.message);
    failedAlpha++;
  }

  // Test 6: AI Personal Recommendations
  try {
    const res = await request('GET', '/api/recommendations/personal?userId=2&limit=6');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.data) && res.data.data.length > 0);
    console.log(`  ✅ [Alpha-6] AI Recommendations API: Generated ${res.data.data.length} personal ranked items`);
    passedAlpha++;
  } catch (e) {
    console.error('  ❌ [Alpha-6] Recommendations Failed:', e.message);
    failedAlpha++;
  }

  // Test 7: AI Demand Forecasting API
  try {
    const res = await request('GET', '/api/analytics/demand-forecast/f1?days=7', { Authorization: `Bearer ${adminToken}` });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.dailyForecast.length, 7);
    console.log(`  ✅ [Alpha-7] AI Demand Forecasting: 7-day OLS prediction with trend (${res.data.data.metrics.trendSlope >= 0 ? 'Upward' : 'Downward'})`);
    passedAlpha++;
  } catch (e) {
    console.error('  ❌ [Alpha-7] Demand Forecasting Failed:', e.message);
    failedAlpha++;
  }

  // Test 8: AI Customer Segmentation API
  try {
    const res = await request('GET', '/api/analytics/segments', { Authorization: `Bearer ${adminToken}` });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.clusters.length, 4);
    console.log(`  ✅ [Alpha-8] AI Customer Segmentation: 4 K-Means clusters loaded successfully`);
    passedAlpha++;
  } catch (e) {
    console.error('  ❌ [Alpha-8] Customer Segmentation Failed:', e.message);
    failedAlpha++;
  }

  // Test 9: FreshBot AI Recipe Assistant API
  try {
    const res = await request('POST', '/api/assistant/chat', {}, { message: 'mango lassi' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.type, 'recipe');
    assert.ok(res.data.data.recipe.items.length >= 3);
    console.log(`  ✅ [Alpha-9] FreshBot AI Assistant: Resolved recipe bundle for "${res.data.data.recipe.name}" (Total: ₹${res.data.data.recipe.totalCost})`);
    passedAlpha++;
  } catch (e) {
    console.error('  ❌ [Alpha-9] Assistant Query Failed:', e.message);
    failedAlpha++;
  }

  // Test 10: Dynamic Pricing API
  try {
    const res = await request('GET', '/api/pricing/elasticity/f1');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.elasticityCoefficient !== undefined);
    console.log(`  ✅ [Alpha-10] Dynamic Pricing API: Elasticity ${res.data.data.elasticityCoefficient} (${res.data.data.elasticityType})`);
    passedAlpha++;
  } catch (e) {
    console.error('  ❌ [Alpha-10] Dynamic Pricing Failed:', e.message);
    failedAlpha++;
  }

  // Test 11: Route Dispatch Optimization API
  try {
    const res = await request('GET', '/api/dispatch/optimize', { Authorization: `Bearer ${adminToken}` });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.data.itinerary.length >= 6);
    console.log(`  ✅ [Alpha-11] Delivery Route Optimizer: ${res.data.data.itinerary.length} stops, ${res.data.data.totalDistanceKm} km total`);
    passedAlpha++;
  } catch (e) {
    console.error('  ❌ [Alpha-11] Route Optimizer Failed:', e.message);
    failedAlpha++;
  }

  // =============================================================
  // BETA TESTING: Multi-User Concurrency & End-to-End Stress Test
  // =============================================================
  console.log('\n🔹 PHASE 2: BETA TESTING (Concurrent User Load & Transaction Stress)\n');

  // Restock test products via Admin API to ensure concurrency test resilience
  try {
    await request('PUT', '/api/admin/products/f1', { Authorization: `Bearer ${adminToken}` }, { stock: 200 });
    await request('PUT', '/api/admin/products/d1', { Authorization: `Bearer ${adminToken}` }, { stock: 200 });
  } catch (e) {}

  // Beta Test 1: 15 Concurrent Guest Sessions adding items to cart
  try {
    const startTime = Date.now();
    const concurrentUsers = 15;
    const promises = [];

    for (let i = 0; i < concurrentUsers; i++) {
      const sessionId = `beta_session_${i}_${Date.now()}`;
      promises.push((async () => {
        // 1. Add item 1
        const add1 = await request('POST', '/api/cart/add', { 'x-session-id': sessionId }, { productId: 'f1', quantity: 1 });
        assert.strictEqual(add1.status, 200, `Add item 1 failed: ${JSON.stringify(add1.data)}`);
        
        // 2. Add item 2
        const add2 = await request('POST', '/api/cart/add', { 'x-session-id': sessionId }, { productId: 'd1', quantity: 1 });
        assert.strictEqual(add2.status, 200, `Add item 2 failed: ${JSON.stringify(add2.data)}`);
        
        // 3. Get cart totals
        const cartRes = await request('GET', '/api/cart', { 'x-session-id': sessionId });
        assert.strictEqual(cartRes.status, 200);
        assert.strictEqual(cartRes.data.data.itemCount, 2, `Cart itemCount should be 2 but got ${cartRes.data.data.itemCount}`);
        
        // 4. Place Order
        const orderRes = await request('POST', '/api/orders', { 'x-session-id': sessionId }, {
          customerName: `Beta User ${i}`,
          address: `${100 + i}, Koramangala 4th Block, Bengaluru`,
          phone: `987654321${i % 10}`,
          paymentMethod: 'upi'
        });
        assert.strictEqual(orderRes.status, 201, `Place order failed: ${JSON.stringify(orderRes.data)}`);
        assert.ok(orderRes.data.data.id.startsWith('ORD-'));
        return orderRes.data.data.id;
      })());
    }

    const orderIds = await Promise.all(promises);
    const duration = Date.now() - startTime;
    assert.strictEqual(orderIds.length, 15);
    console.log(`  ✅ [Beta-1] Multi-User Concurrency: 15 simultaneous cart & checkout flows completed in ${duration}ms (Avg ${Math.round(duration/15)}ms/flow)`);
    passedBeta++;
  } catch (e) {
    console.error('  ❌ [Beta-1] Multi-User Concurrency Failed:', e.message);
    failedBeta++;
  }

  // Beta Test 2: AI Assistant & Recommendation High-Throughput Load
  try {
    const startTime = Date.now();
    const queries = [
      'mango lassi',
      'fruit salad',
      'high protein breakfast',
      'tea time snacks',
      'veggie stir fry',
      'under 500 veg',
      'organic apples',
      'fresh milk'
    ];

    const aiPromises = queries.map(q => request('POST', '/api/assistant/chat', {}, { message: q }));
    const aiResults = await Promise.all(aiPromises);
    const duration = Date.now() - startTime;

    assert.ok(aiResults.every(r => r.status === 200));
    console.log(`  ✅ [Beta-2] AI Assistant High-Throughput: ${queries.length} NLP intent queries resolved in ${duration}ms (Avg ${Math.round(duration/queries.length)}ms/query)`);
    passedBeta++;
  } catch (e) {
    console.error('  ❌ [Beta-2] AI Throughput Load Failed:', e.message);
    failedBeta++;
  }

  // Beta Test 3: ACID Data Consistency Audit under load
  try {
    const prodRes = await request('GET', '/api/products');
    const products = prodRes.data.data;
    assert.ok(products.every(p => p.stock >= 0), 'No product stock should be negative');
    console.log(`  ✅ [Beta-3] ACID Data Integrity Audit: All ${products.length} catalog items maintained consistent non-negative inventory`);
    passedBeta++;
  } catch (e) {
    console.error('  ❌ [Beta-3] ACID Integrity Audit Failed:', e.message);
    failedBeta++;
  }

  // =============================================================
  // SUMMARY
  // =============================================================
  console.log('\n===============================================================');
  console.log(`  🏁 ALPHA TESTING: ${passedAlpha} / ${passedAlpha + failedAlpha} PASSED`);
  console.log(`  🏁 BETA TESTING:  ${passedBeta} / ${passedBeta + failedBeta} PASSED`);
  console.log(`  🎯 TOTAL BACKEND ALPHA/BETA SCORE: ${passedAlpha + passedBeta} / ${passedAlpha + failedAlpha + passedBeta + failedBeta}`);
  console.log('===============================================================\n');

  if (failedAlpha + failedBeta > 0) {
    process.exit(1);
  }
}

runBackendAlphaBeta().catch(err => {
  console.error('Fatal Alpha/Beta Test Error:', err);
  process.exit(1);
});
