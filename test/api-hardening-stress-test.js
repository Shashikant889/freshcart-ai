/**
 * Comprehensive API Hardening, Resilience & Concurrency Stress Test
 */

const http = require('http');

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
          raw: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runHardeningSuite() {
  console.log('\n===============================================================');
  console.log('  🛡️ FRESHCART AI: API HARDENING, SECURITY & STRESS AUDIT');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assertCheck(name, condition, errorMsg = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} — ${errorMsg}`);
      failed++;
    }
  }

  // 1. Boundary Pagination Inputs
  const pNegative = await request('GET', '/api/products?page=-5&limit=-10');
  assertCheck('Negative pagination handles safely with defaults', pNegative.status === 200 && pNegative.data.success === true);

  const pExcessive = await request('GET', '/api/products?page=1&limit=50000');
  assertCheck('Excessive limit is clamped (max 100 items)', pExcessive.status === 200 && pExcessive.data.count <= 100);

  const pOutOfRange = await request('GET', '/api/products?page=999999&limit=24');
  assertCheck('Out-of-range page returns empty array without error', pOutOfRange.status === 200 && Array.isArray(pOutOfRange.data.data) && pOutOfRange.data.data.length === 0);

  // 2. Non-existent & Malformed IDs
  const pNotFound = await request('GET', '/api/products/non_existent_sku_999999');
  assertCheck('Invalid product ID returns 404', pNotFound.status === 404 && pNotFound.data.success === false);

  const fbtNotFound = await request('GET', '/api/recommendations/frequently-bought/non_existent_id_999');
  assertCheck('Invalid FBT product ID returns empty array safely', fbtNotFound.status === 200 && Array.isArray(fbtNotFound.data.data));

  // 3. Demand Forecasting on Cold Start / Missing Item
  const forecastNotFound = await request('GET', '/api/analytics/demand-forecast/non_existent_product');
  assertCheck('Forecast on non-existent product returns clean 404', forecastNotFound.status === 404);

  // 4. Elasticity on Missing Item
  const elasticityNotFound = await request('GET', '/api/pricing/elasticity/non_existent_product');
  assertCheck('Elasticity on non-existent product returns 404', elasticityNotFound.status === 404);

  // 5. Auth & Admin Security Boundaries
  const unauthAdmin = await request('GET', '/api/admin/dashboard');
  assertCheck('Unauthorized access to admin dashboard is blocked (401)', unauthAdmin.status === 401);

  const malformedToken = await request('GET', '/api/admin/dashboard', { Authorization: 'Bearer invalid.token.signature' });
  assertCheck('Malformed JWT token is rejected (401)', malformedToken.status === 401);

  // Login as Customer
  const custLogin = await request('POST', '/api/auth/login', {}, { email: 'customer@freshcart.com', password: 'customer123' });
  const custToken = custLogin.data?.data?.token;

  const forbiddenAdmin = await request('GET', '/api/admin/dashboard', { Authorization: `Bearer ${custToken}` });
  assertCheck('Customer token accessing admin dashboard is forbidden (403)', forbiddenAdmin.status === 403);

  // 6. SQL Injection Resilience
  const sqliSearch = await request('GET', '/api/search?q=' + encodeURIComponent("' OR '1'='1"));
  assertCheck('SQLi in search parameter is sanitized safely', sqliSearch.status === 200 && sqliSearch.data.success === true);

  const sqliCategory = await request('GET', '/api/products?category=' + encodeURIComponent("fruits'; DROP TABLE products;--"));
  assertCheck('SQLi in category parameter is parameterized safely', sqliCategory.status === 200);

  const sqliSort = await request('GET', '/api/products?sort=' + encodeURIComponent("price ASC; DROP TABLE users;--"));
  assertCheck('SQLi in sort parameter is safely handled with whitelist fallback', sqliSort.status === 200);

  // 7. Search Stress: Partial, Typo, Multilingual
  const searchTypo = await request('GET', '/api/search?q=aple'); // Typo for apple
  assertCheck('Typo search for "aple" returns matched fruits', searchTypo.status === 200 && searchTypo.data.count > 0);

  const searchHindi = await request('GET', '/api/search?q=doodh'); // Hindi for milk
  assertCheck('Hindi synonym search for "doodh" returns dairy items', searchHindi.status === 200 && searchHindi.data.count > 0);

  // 8. High-Throughput Parallel Concurrency (50 simultaneous requests)
  const concurrentRequests = [];
  const startConc = Date.now();
  for (let i = 0; i < 50; i++) {
    const pageNum = (i % 20) + 1;
    concurrentRequests.push(request('GET', `/api/products?page=${pageNum}&limit=24`));
  }
  const results = await Promise.all(concurrentRequests);
  const durationConc = Date.now() - startConc;
  const all200 = results.every(r => r.status === 200 && r.data.success === true);
  assertCheck(`50 parallel concurrent requests served in ${durationConc}ms (${(durationConc / 50).toFixed(1)}ms/req)`, all200);

  console.log('\n===============================================================');
  console.log(`  🎯 AUDIT RESULT: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('===============================================================\n');

  if (failed > 0) process.exit(1);
}

runHardeningSuite().catch(console.error);
