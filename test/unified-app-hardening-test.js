/**
 * FreshCart AI — Unified Application & Local Hardening Test Suite
 * (test/unified-app-hardening-test.js)
 * 
 * Verifies:
 * 1. Single Application Entry Point (http://localhost:3000/ serves Store, Orders & Admin views)
 * 2. System Health & Observability (/api/health)
 * 3. Intelligent Product Substitutions (/api/recommendations/substitutes/:id)
 * 4. Supplier ABC/XYZ Pareto Inventory Analysis (/api/supplier/abc-analysis)
 * 5. Dark Store Batch Picker Route 2-Opt TSP (/api/supplier/batch-picker-route)
 * 6. Delivery Itinerary Arrival Clock Time calculations (/api/dispatch/routes)
 * 7. Edge Cases & Resilience (Negative qty, empty cart, invalid tokens, stock bounds)
 */

const { startTestServer } = require('./test-helper');
const { generateToken } = require('../middleware/auth');

let totalTests = 0;
let passedTests = 0;
let testServer = null;

function assert(condition, name) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${name}`);
  } else {
    console.error(`  ❌ FAIL: ${name}`);
  }
}

async function request(method, path, body = null, headers = {}) {
  const res = await testServer.request(method, path, headers, body);
  const isObj = res.data && typeof res.data === 'object';
  return {
    status: res.status,
    headers: res.headers,
    body: isObj ? res.data : null,
    raw: typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
  };
}

async function runHardeningTests() {
  console.log('\n================================================================');
  console.log('🧪 FRESHCART AI — UNIFIED APPLICATION & HARDENING TEST SUITE');
  console.log('================================================================\n');

  testServer = await startTestServer();
  const adminToken = generateToken({ id: 1, email: 'admin@freshcart.com', role: 'admin' });

  // --- Suite 1: Single Entry Point Root Application ---
  console.log('📦 Suite 1: Single Entry Point Unified SPA (http://localhost:3000/)');
  const rootRes = await request('GET', '/');
  assert(rootRes.status === 200, 'GET / returns HTTP 200 OK');
  assert(rootRes.raw.includes('id="view-storefront"'), 'Root HTML contains Customer Storefront pane (#view-storefront)');
  assert(rootRes.raw.includes('id="view-orders-page"'), 'Root HTML contains Orders & Delivery Tracker pane (#view-orders-page)');
  assert(rootRes.raw.includes('id="view-admin-page"'), 'Root HTML contains Embedded Admin & AI Suite pane (#view-admin-page)');
  assert(rootRes.raw.includes('id="app-views-nav"'), 'Root HTML contains Unified Top Mode Switcher (#app-views-nav)');
  assert(rootRes.raw.includes('js/admin.js') && rootRes.raw.includes('js/app.js'), 'Root HTML loads both admin.js and app.js scripts');

  // --- Suite 2: System Health & Observability Endpoint ---
  console.log('\n🩺 Suite 2: Live System Diagnostics & Observability (/api/health)');
  const healthRes = await request('GET', '/api/health');
  assert(healthRes.status === 200, 'GET /api/health returns HTTP 200 OK');
  assert(healthRes.body && healthRes.body.status === 'healthy', 'Health status is "healthy"');
  assert(healthRes.body.process && typeof healthRes.body.process.heapUsedMB === 'number', 'Memory telemetry contains heapUsedMB');
  assert(healthRes.body.database && healthRes.body.database.tables && healthRes.body.database.tables.products >= 24, 'Database telemetry reports at least 24 products');
  assert(healthRes.body.database && healthRes.body.database.tables && healthRes.body.database.tables.orders >= 4000, 'Database telemetry reports 4,000+ orders');
  assert(healthRes.body.aiGateway && typeof healthRes.body.aiGateway.online === 'boolean', 'Microservice status boolean is reported');

  // --- Suite 3: Intelligent Product Substitutions ---
  console.log('\n🍎 Suite 3: Intelligent Out-of-Stock Substitutions Engine');
  const subRes = await request('GET', '/api/recommendations/substitutes/f1');
  assert(subRes.status === 200, 'GET /api/recommendations/substitutes/f1 returns HTTP 200');
  assert(Array.isArray(subRes.body.data) && subRes.body.data.length > 0, 'Returns non-empty array of substitutes for f1');
  const topSub = subRes.body.data[0];
  assert(typeof (topSub.substitutionScore || topSub.substituteScore) === 'number' && (topSub.substitutionScore || topSub.substituteScore) > 0, 'Substitute has normalized score > 0');
  assert(typeof (topSub.substitutionReason || topSub.explanation) === 'string', 'Substitute includes human-interpretable explanation');
  assert(topSub.price !== undefined, 'Substitute includes pricing details');

  // --- Suite 4: Supplier ABC / XYZ Pareto Inventory Analytics ---
  console.log('\n📊 Suite 4: Supplier ABC/XYZ Pareto Inventory Analysis (/api/supplier/abc-analysis)');
  const abcRes = await request('GET', '/api/supplier/abc-analysis', null, { 'Authorization': `Bearer ${adminToken}` });
  assert(abcRes.status === 200, 'GET /api/supplier/abc-analysis returns HTTP 200');
  assert(abcRes.body && abcRes.body.summary, 'ABC analysis contains summary totals');
  assert(Array.isArray(abcRes.body.data) && abcRes.body.data.length >= 24, 'All 24 products classified into ABC/XYZ tiers');
  const sampleProduct = abcRes.body.data[0];
  assert(['A', 'B', 'C'].includes(sampleProduct.abcClass), 'Product assigned valid Pareto ABC Class');
  assert(['X', 'Y', 'Z'].includes(sampleProduct.xyzClass), 'Product assigned valid Demand Variability XYZ Class');
  assert(sampleProduct.cumulativeRevenuePct <= 100, 'Cumulative revenue percentage is bounded <= 100%');

  // --- Suite 5: Dark Store Batch Picking Route Optimizer ---
  console.log('\n🏭 Suite 5: Multi-Order Batch Picker Route Optimizer (/api/supplier/batch-picker-route)');
  const batchRouteRes = await request('POST', '/api/supplier/batch-picker-route', {
    orderIds: ['ord_001', 'ord_002', 'ord_003']
  }, { 'Authorization': `Bearer ${adminToken}` });
  assert(batchRouteRes.status === 200, 'POST /api/supplier/batch-picker-route returns HTTP 200');
  assert(batchRouteRes.body.data && batchRouteRes.body.data.totalWalkingMeters > 0, 'Batch route contains 2D TSP distance metrics');
  assert(Array.isArray(batchRouteRes.body.data.pickSequence) && batchRouteRes.body.data.pickSequence.length >= 2, 'Pick sequence contains stops for batch items');
  assert(batchRouteRes.body.data.pickSequence[0].aisle !== undefined, 'Pick sequence contains aisle coordinate locations');

  // --- Suite 6: Delivery Itinerary Arrival Clock Times ---
  console.log('\n🚚 Suite 6: Delivery Dispatch Route Itinerary with Arrival Clock Times');
  const dispatchRes = await request('GET', '/api/dispatch/routes');
  assert(dispatchRes.status === 200, 'GET /api/dispatch/routes returns HTTP 200');
  assert(Array.isArray(dispatchRes.body.data.itinerary) && dispatchRes.body.data.itinerary.length > 0, 'Dispatch route contains step-by-step itinerary');
  const firstStop = dispatchRes.body.data.itinerary[0];
  assert(typeof firstStop.estimatedArrivalMinutes === 'number', 'Stop includes estimatedArrivalMinutes');
  assert(typeof firstStop.estimatedArrivalClock === 'string', 'Stop includes formatted estimatedArrivalClock timestamp');

  // --- Suite 7: Edge Cases, Security & Input Sanitization ---
  console.log('\n🛡️ Suite 7: Edge Cases & Robustness Verification');

  // Negative quantity in cart add
  const negQtyRes = await request('POST', '/api/cart/add', { productId: 'f1', quantity: -5 }, { 'x-session-id': 'sess_hardening_test' });
  assert(negQtyRes.status === 400 || (negQtyRes.body && !negQtyRes.body.success), 'Negative quantity cart add is safely rejected or bounded');

  // Non-existent product ID
  const invalidProdRes = await request('POST', '/api/cart/add', { productId: 'p_nonexistent_999', quantity: 1 }, { 'x-session-id': 'sess_hardening_test' });
  assert(invalidProdRes.status === 404 || (invalidProdRes.body && !invalidProdRes.body.success), 'Non-existent product ID rejected with 404');

  // Empty cart checkout
  const emptyCheckoutRes = await request('POST', '/api/orders', {
    customerName: 'Test Customer',
    address: 'Test Address',
    phone: '9876543210',
    paymentMethod: 'cod'
  }, { 'x-session-id': 'sess_empty_cart_test' });
  assert(emptyCheckoutRes.status === 400 || (emptyCheckoutRes.body && !emptyCheckoutRes.body.success), 'Empty cart checkout is rejected with 400');

  // Invalid Auth Bearer Token on Protected Endpoint
  const badAuthRes = await request('GET', '/api/auth/me', null, { 'Authorization': 'Bearer INVALID_MALFORMED_TOKEN' });
  assert(badAuthRes.status === 401, 'Malformed JWT token rejected with HTTP 401 Unauthorized');

  // Teardown
  if (testServer) await testServer.close();

  // --- Summary ---
  console.log('\n================================================================');
  console.log(`📊 Hardening Test Results: ${passedTests} / ${totalTests} assertions passed (${Math.round(passedTests/totalTests*100)}%)`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL HARDENING & UNIFIED ARCHITECTURE TESTS PASSED!\n');
    return true;
  } else {
    console.error('❌ SOME TESTS FAILED.\n');
    return false;
  }
}

// Auto-run if executed directly
if (require.main === module) {
  runHardeningTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runHardeningTests };
