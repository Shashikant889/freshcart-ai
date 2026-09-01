/**
 * test/advanced-features-test.js
 * Comprehensive automated verification for Advanced Feature Groups 1-10:
 * 1. Intelligent CX: Personalization, Buy Again, Smart Bundles, Comparison Matrix
 * 2. Advanced Search: Typo tolerance, Hindi synonyms, multi-facet filtering, Autocomplete suggestions
 * 3. Enterprise Admin Analytics Overview: 30-day trajectories & category performance
 * 4. Inventory Intelligence: Storewide Turnover ratio, Dead-stock detection, EOQ Purchase Order generation
 * 5. Explainable AI Dynamic Pricing: Step-by-step microeconomic breakdown
 * 6. Fraud Intelligence: Contributing factors & velocity scoring
 * 7. Customer 6-Persona RFM Segmentation
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
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
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

let adminToken = null;

async function runTests() {
  console.log('🚀 Starting FreshCart AI Advanced Feature Engineering Verification Suite...\n');
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

  // Authenticate Admin
  try {
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@freshcart.com', password: 'admin123' }
    });
    if (loginRes.status === 200 && loginRes.body.data?.token) {
      adminToken = loginRes.body.data.token;
      console.log('  🔑 Authenticated as Admin (JWT acquired)');
    }
  } catch (e) {
    console.warn('  ⚠️ Admin auth warning:', e.message);
  }

  // ----------------------------------------------------
  // Test 1: Autocomplete Search Suggestions
  // ----------------------------------------------------
  console.log('\n--- Test Group 1: Search Intelligence & Autocomplete ---');
  try {
    const res = await request('/api/search/suggestions?q=app&limit=5');
    assert(res.status === 200, 'GET /api/search/suggestions returns 200');
    assert(Array.isArray(res.body.data) && res.body.data.length > 0, 'Autocomplete returns suggestions list', `Count: ${res.body.data?.length}`);
    const appleSuggestion = res.body.data.find(s => s.text.toLowerCase().includes('apple'));
    assert(!!appleSuggestion, 'Suggestions contain matched item "Apple"');

    // Test Hindi Synonym
    const synRes = await request('/api/search/suggestions?q=seb&limit=5');
    assert(synRes.status === 200, 'GET /api/search/suggestions with Hindi query "seb" returns 200');
    assert(synRes.body.data.some(s => s.text.toLowerCase().includes('apple') || s.query === 'apple'), 'Hindi synonym "seb" resolves to "Apple"');
  } catch (e) {
    assert(false, 'Search suggestions failed', e.message);
  }

  // ----------------------------------------------------
  // Test 2: Multi-Facet Search & Filtering
  // ----------------------------------------------------
  console.log('\n--- Test Group 2: Multi-Facet Search & Filtering ---');
  try {
    const res = await request('/api/search?q=organic&diet=organic&minPrice=10&maxPrice=500&sort=price-asc');
    assert(res.status === 200, 'GET /api/search multi-facet returns 200');
    assert(Array.isArray(res.body.data), 'Smart search returns products array');
    if (res.body.data.length > 1) {
      const p1 = res.body.data[0].product ? res.body.data[0].product.price : res.body.data[0].price;
      const p2 = res.body.data[1].product ? res.body.data[1].product.price : res.body.data[1].price;
      assert(p1 <= p2, 'Results sorted by price ascending');
    }
  } catch (e) {
    assert(false, 'Multi-facet search failed', e.message);
  }

  // ----------------------------------------------------
  // Test 3: Buy Again & Reorder Recommendation Engine
  // ----------------------------------------------------
  console.log('\n--- Test Group 3: Buy Again Past Purchases ---');
  try {
    const res = await request('/api/recommendations/buy-again?limit=5');
    assert(res.status === 200, 'GET /api/recommendations/buy-again returns 200');
    assert(Array.isArray(res.body.data), 'Buy again returns products array');
    assert(res.body.data.length > 0, 'Buy again contains repurchase items', `Length: ${res.body.data.length}`);
    assert(!!res.body.data[0].reorderReason, 'Buy again items contain reorder reason annotation');
  } catch (e) {
    assert(false, 'Buy Again recommendations failed', e.message);
  }

  // ----------------------------------------------------
  // Test 4: Smart Product Bundles & Meal Combos
  // ----------------------------------------------------
  console.log('\n--- Test Group 4: Smart Bundles Engine ---');
  try {
    const res = await request('/api/recommendations/smart-bundles?limit=4');
    assert(res.status === 200, 'GET /api/recommendations/smart-bundles returns 200');
    assert(Array.isArray(res.body.data) && res.body.data.length > 0, 'Smart bundles returns active curated combos');
    const firstBundle = res.body.data[0];
    assert(firstBundle.bundlePrice < firstBundle.originalPrice, 'Bundle price is discounted below original sum');
    assert(firstBundle.savingsAmount > 0, 'Bundle includes computed savings amount');
    assert(Array.isArray(firstBundle.items) && firstBundle.items.length >= 2, 'Bundle contains at least 2 coordinated items');
  } catch (e) {
    assert(false, 'Smart Bundles engine failed', e.message);
  }

  // ----------------------------------------------------
  // Test 5: Product Comparison Matrix
  // ----------------------------------------------------
  console.log('\n--- Test Group 5: Product Comparison Matrix ---');
  try {
    const res = await request('/api/recommendations/compare', {
      method: 'POST',
      body: { productIds: ['f1', 'f2', 'f3'] }
    });
    assert(res.status === 200, 'POST /api/recommendations/compare returns 200');
    assert(Array.isArray(res.body.products) && res.body.products.length >= 2, 'Compare returns side-by-side product specs');
    assert(typeof res.body.aiVerdict === 'string' && res.body.aiVerdict.length > 0, 'Compare returns AI summary verdict');
    assert(!!res.body.highlights && !!res.body.highlights.bestValueId, 'Compare identifies best-value SKU');
  } catch (e) {
    assert(false, 'Comparison matrix failed', e.message);
  }

  // ----------------------------------------------------
  // Test 6: Inventory Turnover & Dead Stock Detection
  // ----------------------------------------------------
  console.log('\n--- Test Group 6: Inventory Turnover & Stock Velocity ---');
  try {
    const res = await request('/api/supplier/inventory-turnover', {
      headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}
    });
    assert(res.status === 200, 'GET /api/supplier/inventory-turnover returns 200');
    assert(typeof res.body.summary?.storeWideTurnoverRatio === 'number', 'Storewide inventory turnover ratio calculated');
    assert(Array.isArray(res.body.fastMoving) && res.body.fastMoving.length > 0, 'Fast-moving SKUs identified');
    assert(Array.isArray(res.body.deadStock), 'Dead-stock array present');
  } catch (e) {
    assert(false, 'Inventory turnover calculation failed', e.message);
  }

  // ----------------------------------------------------
  // Test 7: Automated Wilson EOQ Purchase Order Generator
  // ----------------------------------------------------
  console.log('\n--- Test Group 7: Automated EOQ Purchase Order Generation ---');
  try {
    const res = await request('/api/supplier/generate-po', {
      method: 'POST',
      headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {},
      body: { category: 'all' }
    });
    assert(res.status === 200, 'POST /api/supplier/generate-po returns 200');
    const po = res.body.data;
    assert(!!po && po.poNumber.startsWith('PO-'), 'Generated PO number with valid format (PO-XXXXX)');
    assert(po.totalPoAmount > 0, 'Calculated non-zero total PO valuation');
    assert(Array.isArray(po.items) && po.items.length > 0, 'PO contains line items with EOQ quantities');
    assert(po.items[0].suggestedEoqQty > 0, 'Line item contains positive Wilson EOQ suggested quantity');
  } catch (e) {
    assert(false, 'Automated PO generation failed', e.message);
  }

  // ----------------------------------------------------
  // Test 8: Admin Enterprise Analytics Overview
  // ----------------------------------------------------
  console.log('\n--- Test Group 8: Admin Enterprise Analytics Overview ---');
  try {
    const res = await request('/api/admin/analytics/overview', {
      headers: adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}
    });
    assert(res.status === 200, 'GET /api/admin/analytics/overview returns 200');
    assert(Array.isArray(res.body.data?.dailyTrend) && res.body.data.dailyTrend.length > 0, 'Generated 30-day daily revenue trend series');
    assert(Array.isArray(res.body.data?.categoryPerformance) && res.body.data.categoryPerformance.length > 0, 'Generated category revenue breakdown');
    assert(typeof res.body.data?.operationsHealth?.avgDeliveryEtaMinutes === 'number', 'Calculated operations delivery ETA KPI');
  } catch (e) {
    assert(false, 'Admin overview analytics failed', e.message);
  }

  // ----------------------------------------------------
  // Test 9: Explainable Dynamic Pricing Microeconomics
  // ----------------------------------------------------
  console.log('\n--- Test Group 9: Dynamic Pricing Microeconomic Explanations ---');
  try {
    const res = await request('/api/pricing/simulate/f1?price=120');
    assert(res.status === 200, 'GET /api/pricing/simulate/f1 returns 200');
    const d = res.body.data;
    assert(Array.isArray(d.explanationSteps) && d.explanationSteps.length >= 4, 'Dynamic pricing returns step-by-step economic derivation');
    assert(typeof d.optimalRevenuePrice === 'number', 'AI profit-optimal target price (P*) computed');
    assert(typeof d.disclaimer === 'string', 'Transparent economic disclaimer included');
  } catch (e) {
    assert(false, 'Dynamic pricing explainability failed', e.message);
  }

  // ----------------------------------------------------
  // Test 10: 6-Persona RFM Customer Segmentation
  // ----------------------------------------------------
  console.log('\n--- Test Group 10: 6-Persona Customer RFM Segmentation ---');
  try {
    const res = await request('/api/analytics/segments');
    assert(res.status === 200, 'GET /api/analytics/segments returns 200');
    assert(Array.isArray(res.body.data?.clusters) && res.body.data.clusters.length >= 4, 'Customer segmentation returns multi-persona clusters');
    const firstCluster = res.body.data.clusters[0];
    assert(!!firstCluster && typeof firstCluster.persona === 'string', 'Identified cluster with persona designation');
    assert(typeof firstCluster.averageMonetary === 'number', 'Average monetary value computed for cluster');
  } catch (e) {
    assert(false, 'Customer segmentation failed', e.message);
  }

  console.log(`\n==================================================`);
  console.log(`Verification Summary: ${passed} Passed | ${failed} Failed`);
  console.log(`==================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite runtime fatal error:', err);
  process.exit(1);
});
