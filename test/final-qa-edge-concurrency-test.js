/**
 * test/final-qa-edge-concurrency-test.js
 * Comprehensive Final Localhost QA Test Suite:
 * 1. Security (SQLi, Auth, RBAC, JWT, Password Masking)
 * 2. Edge Cases (Zero results, non-existent IDs, empty carts, malformed inputs)
 * 3. Concurrency (Simultaneous searches, recommendations, cart operations, analytics)
 * 4. Large Data & Payload Validation (Pagination bounds, payload sizes < 50KB)
 * 5. Latency & Performance Benchmarks
 */

const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      timeout: 10000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed, rawLength: body.length, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body, rawLength: body.length, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runQASuite() {
  console.log('🚀 Starting Final Localhost QA & Edge/Concurrency Audit...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} — ${details}`);
      failed++;
    }
  }

  let adminToken = null;
  let customerToken = null;

  // ----------------------------------------------------
  // SECTION 1: AUTHENTICATION, RBAC & SECURITY
  // ----------------------------------------------------
  console.log('--- 1. Security, Authentication & RBAC ---');
  try {
    // 1.1 Admin login
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@freshcart.com', password: 'admin123' }
    });
    assert(adminLogin.status === 200, 'Admin login succeeds with 200');
    assert(adminLogin.body.data?.user?.role === 'admin', 'Admin user has role "admin"');
    adminToken = adminLogin.body.data?.token;

    // 1.2 Customer login
    const custLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'customer@freshcart.com', password: 'customer123' }
    });
    assert(custLogin.status === 200, 'Customer login succeeds with 200');
    assert(custLogin.body.data?.user?.role === 'customer', 'Customer user has role "customer"');
    customerToken = custLogin.body.data?.token;

    // 1.3 Unauthorized admin route access (No Token)
    const noAuthAdmin = await request('/api/admin/dashboard');
    assert(noAuthAdmin.status === 401 || noAuthAdmin.status === 403, 'Unauthenticated request to /api/admin/dashboard is blocked (401/403)');

    // 1.4 Customer token attempting to access Admin route (RBAC enforcement)
    const custOnAdmin = await request('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert(custOnAdmin.status === 403, 'Customer token accessing Admin dashboard is rejected with 403 Forbidden');

    // 1.5 Forged JWT token access
    const forged = await request('/api/admin/dashboard', {
      headers: { 'Authorization': 'Bearer forged.eyJhbGciOiJIUzI1NiJ9.invalid' }
    });
    assert(forged.status === 401 || forged.status === 403, 'Forged JWT signature is rejected (401/403)');

    // 1.6 SQL Injection resistance on search
    const sqliSearch = await request('/api/search?q=%27%20OR%201=1%20--');
    assert(sqliSearch.status === 200, 'SQL injection query in search does not crash server (status 200)');
    assert(Array.isArray(sqliSearch.body.data), 'SQL injection query returns safe results array');

    // 1.7 SQL Injection in product detail parameter
    const sqliProduct = await request('/api/products/%27%20UNION%20SELECT%201,2,3,4,5,6,7,8,9,10--');
    assert(sqliProduct.status === 404 || sqliProduct.status === 400 || (sqliProduct.status === 200 && sqliProduct.body.data === null), 'SQL injection in product ID handled safely');

    // 1.8 Sensitive data exposure: Verify password hashes not exposed in admin users endpoint
    const adminUsers = await request('/api/admin/users?limit=5', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(adminUsers.status === 200, 'Admin users list retrieved with 200');
    if (adminUsers.body.data?.length > 0) {
      const hasHash = adminUsers.body.data.some(u => u.password_hash !== undefined);
      assert(!hasHash, 'Admin users payload NEVER exposes password_hash');
    }
  } catch (e) {
    assert(false, 'Security & Auth test error', e.message);
  }

  // ----------------------------------------------------
  // SECTION 2: EDGE CASES & RESILIENCE
  // ----------------------------------------------------
  console.log('\n--- 2. Edge Cases & Graceful Degradation ---');
  try {
    // 2.1 Empty search query
    const emptySearch = await request('/api/search?q=');
    assert(emptySearch.status === 200 && emptySearch.body.data?.length === 0, 'Empty search query returns empty array gracefully');

    // 2.2 Unknown product ID
    const unknownProduct = await request('/api/products/non_existent_sku_99999');
    assert(unknownProduct.status === 404 || unknownProduct.body.data === null, 'Unknown product ID returns 404/null cleanly');

    // 2.3 Invalid category filter
    const unknownCat = await request('/api/products?category=quantum_computing_vegetables');
    assert(unknownCat.status === 200 && unknownCat.body.data?.length === 0, 'Unknown category returns empty products list');

    // 2.4 Product comparison with unknown SKUs
    const unknownCompare = await request('/api/recommendations/compare', {
      method: 'POST',
      body: { productIds: ['fake_sku_1', 'fake_sku_2'] }
    });
    assert(unknownCompare.status === 200, 'Comparison with fake SKUs returns 200 without throwing');

    // 2.5 Dynamic pricing simulation with negative or zero price
    const invalidPrice = await request('/api/pricing/simulate/f1?price=-50');
    assert(invalidPrice.status === 400 || invalidPrice.body.success === false, 'Negative proposed price in simulator rejected');

    // 2.6 Dynamic pricing simulation for non-existent product
    const fakePrice = await request('/api/pricing/simulate/non_existent_product_123?price=100');
    assert(fakePrice.status === 404 || fakePrice.body.success === false, 'Pricing simulation on fake product returns 404');

    // 2.7 Checkout with empty cart
    const emptyCheckout = await request('/api/orders', {
      method: 'POST',
      body: { customerName: 'Test', address: '123 Test St', items: [] }
    });
    assert(emptyCheckout.status === 400 || emptyCheckout.body.success === false, 'Empty cart checkout is rejected with 400');

    // 2.8 Customer segmentation with extreme k
    const extremeK = await request('/api/analytics/segments?k=4');
    assert(extremeK.status === 200, 'Customer segmentation handles k=4 clustering robustly');

    // 2.9 Malformed JSON in request
    const malformed = await request('/api/recommendations/compare', {
      method: 'POST',
      body: '{ invalid_json_syntax: true,'
    });
    assert(malformed.status === 400 || malformed.status === 500, 'Malformed JSON rejected safely');
  } catch (e) {
    assert(false, 'Edge case test error', e.message);
  }

  // ----------------------------------------------------
  // SECTION 3: LARGE DATA & PAYLOAD VALIDATION
  // ----------------------------------------------------
  console.log('\n--- 3. Large Data & Payload Bounds ---');
  try {
    // 3.1 Verify /api/products?page=1&limit=24 payload size
    const prodPage = await request('/api/products?page=1&limit=24');
    assert(prodPage.status === 200, 'Products catalog page 1 retrieved');
    assert(prodPage.rawLength < 35000, `Products page 1 payload is compact (${Math.round(prodPage.rawLength / 1024)} KB < 35 KB)`);
    assert(prodPage.body.total === 10000, 'Total database count reported accurately as 10,000');
    assert(prodPage.body.totalPages === 417, 'Total pages calculated accurately as 417');

    // 3.2 Verify /api/categories compact payload
    const catRes = await request('/api/categories');
    assert(catRes.status === 200, 'Categories retrieved');
    assert(catRes.rawLength < 25000, `Categories payload is lightweight (${catRes.rawLength} bytes < 25 KB)`);

    // 3.3 Verify /api/admin/orders pagination limits
    const adminOrders = await request('/api/admin/orders?page=1&limit=25', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(adminOrders.status === 200, 'Admin orders retrieved');
    assert(adminOrders.body.data?.length <= 25, 'Admin orders strictly respects limit=25');
    assert(adminOrders.rawLength < 35000, `Admin orders payload size is bounded (${Math.round(adminOrders.rawLength / 1024)} KB)`);
  } catch (e) {
    assert(false, 'Payload size test error', e.message);
  }

  // ----------------------------------------------------
  // SECTION 4: CONCURRENCY & SIMULTANEOUS LOAD
  // ----------------------------------------------------
  console.log('\n--- 4. Concurrency & High Load Verification ---');
  try {
    const startTime = Date.now();
    const concurrentRequests = [];

    // Dispatch 25 concurrent mixed operations
    for (let i = 0; i < 5; i++) {
      concurrentRequests.push(request('/api/search?q=milk'));
      concurrentRequests.push(request('/api/products?page=1&limit=12'));
      concurrentRequests.push(request('/api/recommendations/personal?limit=6'));
      concurrentRequests.push(request('/api/recommendations/smart-bundles?limit=3'));
      concurrentRequests.push(request('/api/pricing/simulate/f1?price=120'));
    }

    const results = await Promise.all(concurrentRequests);
    const elapsed = Date.now() - startTime;
    const allSuccessful = results.every(r => r.status === 200);

    assert(allSuccessful, '25 concurrent mixed API requests all succeeded (status 200)');
    assert(elapsed < 2000, `25 concurrent requests completed in ${elapsed}ms (< 2000ms)`);
  } catch (e) {
    assert(false, 'Concurrency test error', e.message);
  }

  // ----------------------------------------------------
  // SECTION 5: LATENCY BENCHMARKS (PER-ENDPOINT)
  // ----------------------------------------------------
  console.log('\n--- 5. End-to-End Latency Benchmarks ---');
  const benchmarks = [
    { name: 'Health Check', url: '/api/health' },
    { name: 'Catalog Browse (p=1)', url: '/api/products?page=1&limit=24' },
    { name: 'NLP Smart Search ("organic")', url: '/api/search?q=organic' },
    { name: 'Search Suggestions Autocomplete', url: '/api/search/suggestions?q=app&limit=5' },
    { name: 'Personal Recommendations', url: '/api/recommendations/personal?limit=6' },
    { name: 'Smart Bundles Solver', url: '/api/recommendations/smart-bundles?limit=3' },
    { name: 'AI Dynamic Pricing Simulation', url: '/api/pricing/simulate/f1?price=125' },
    { name: 'Inventory Turnover Analysis', url: '/api/supplier/inventory-turnover', auth: true }
  ];

  for (const b of benchmarks) {
    try {
      const t0 = Date.now();
      const res = await request(b.url, {
        headers: b.auth && adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}
      });
      const duration = Date.now() - t0;
      const maxThreshold = b.name === 'Inventory Turnover Analysis' ? 600 : 100;
      assert(res.status === 200 && duration < maxThreshold, `${b.name} responds in ${duration}ms (< ${maxThreshold}ms threshold)`);
    } catch (e) {
      assert(false, `${b.name} benchmark error`, e.message);
    }
  }

  console.log(`\n==================================================`);
  console.log(`QA Audit Summary: ${passed} Passed | ${failed} Failed`);
  console.log(`==================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runQASuite().catch(err => {
  console.error('QA Suite Fatal Error:', err);
  process.exit(1);
});
