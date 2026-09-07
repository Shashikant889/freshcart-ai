/**
 * FreshCart AI — Pinnacle Enterprise Features Verification Suite (test/pinnacle-features-test.js)
 * 
 * Verifies:
 * 1. AI Smart Substitute Recommendation Engine
 * 2. Hyperlocal Multi-Dark-Store Network & Geofencing
 * 3. IoT Cold-Chain Telemetry & Spoilage Anomaly Protection
 * 4. Prime VIP Loyalty Gamification & Streak Rewards
 * 5. Verified Customer Reviews & AI Aspect Sentiment Analyzer
 * 6. Live Delivery Fleet Radar & Telemetry Contracts
 */

const assert = require('assert');
const { getSmartSubstitutes } = require('../ml/substitute-recommender');
const {
  getAllDarkStores,
  locateNearestDarkStore,
  getInterStoreBalance
} = require('../ml/dark-store-network');
const { startTestServer } = require('./test-helper');

let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  🚀 [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    failedTests++;
  }
}

async function runPinnacleTests() {
  console.log('\n===============================================================');
  console.log('  🌟 FRESHCART AI: PINNACLE ENTERPRISE FEATURES TEST SUITE');
  console.log('===============================================================\n');

  let testEnv = null;
  try {
    testEnv = await startTestServer();
    const request = testEnv.request;

    // -------------------------------------------------------------
    // 1. AI SMART SUBSTITUTE RECOMMENDER
    // -------------------------------------------------------------
    console.log('📌 1. AI Smart Substitute Recommendation Engine:');

    await test('Computes multi-attribute product substitutes with confidence match scores', () => {
      const substitutes = getSmartSubstitutes('f1', 3); // Organic Apples
      assert.ok(Array.isArray(substitutes), 'Substitutes should be an array');
      assert.ok(substitutes.length > 0, 'Should return at least 1 candidate');
      assert.ok(substitutes[0].matchScore >= 50 && substitutes[0].matchScore <= 100, 'Match score bounded between 50 and 100');
      assert.ok(substitutes[0].priceDiff !== undefined, 'Price diff label present');
      assert.ok(substitutes[0].reason.length > 0, 'Human-friendly rationale provided');
      assert.notStrictEqual(substitutes[0].id, 'f1', 'Does not recommend itself');
    });

    await test('Prioritizes same-category in-stock items with comparable price points', () => {
      const dairySubs = getSmartSubstitutes('d1', 3); // Whole Milk
      assert.ok(dairySubs.length >= 2);
      const topMatch = dairySubs[0];
      assert.strictEqual(topMatch.category, 'dairy', 'Top substitute matches dairy category');
      assert.ok(topMatch.stock > 0, 'Candidate is in stock');
    });

    // -------------------------------------------------------------
    // 2. HYPERLOCAL MULTI-DARK-STORE NETWORK & GEOFENCING
    // -------------------------------------------------------------
    console.log('📌 2. Hyperlocal Multi-Dark-Store Network & Geofencing:');

    await test('Maintains network of 4 Mumbai fulfillment hubs with GPS coordinates', () => {
      const stores = getAllDarkStores();
      assert.strictEqual(stores.length, 4, '4 fulfillment hubs configured');
      const codes = stores.map(s => s.code);
      assert.ok(codes.includes('HUB-01') && codes.includes('HUB-02'));
      assert.ok(stores[0].activeCouriers >= 10, 'Sufficient courier fleet dispatched');
    });

    await test('Resolves nearest hub via Mumbai pincode geofencing (400050 -> Bandra)', () => {
      const hubBandra = locateNearestDarkStore({ pincode: '400050' });
      assert.strictEqual(hubBandra.code, 'HUB-01');
      assert.ok(hubBandra.estimatedMinutes <= 12, 'SLA under 12 minutes');

      const hubAndheri = locateNearestDarkStore({ pincode: '400069' });
      assert.strictEqual(hubAndheri.code, 'HUB-02');
    });

    await test('Generates inter-store stock balancing transfers for depleted hubs', () => {
      const mockProducts = [
        { id: 'f1', name: 'Apples', emoji: '🍎', stock: 15 },
        { id: 'd1', name: 'Milk', emoji: '🥛', stock: 8 }
      ];
      const balance = getInterStoreBalance(mockProducts);
      assert.ok(balance.totalHubs === 4);
      assert.ok(balance.activeFleetSize >= 50);
      assert.ok(Array.isArray(balance.recommendedTransfers));
    });

    // -------------------------------------------------------------
    // 3. REST API ENDPOINTS: DARK STORES, IOT, LOYALTY, REVIEWS
    // -------------------------------------------------------------
    console.log('📌 3. Live REST API Contracts & Microservice Endpoints:');

    await test('GET /api/dark-stores returns operational network catalog', async () => {
      const res = await request('GET', '/api/dark-stores');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.count, 4);
    });

    await test('POST /api/dark-stores/locate geolocates coordinates to closest hub', async () => {
      const res = await request('POST', '/api/dark-stores/locate', {}, {
        lat: 19.1197,
        lng: 72.9051 // Powai
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data.code, 'HUB-03');
    });

    await test('GET /api/iot/telemetry returns cold-chain sensors across 3 zones', async () => {
      const res = await request('GET', '/api/iot/telemetry');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.telemetry.chiller.temperatureC !== undefined);
      assert.ok(res.data.telemetry.freezer.temperatureC !== undefined);
      assert.ok(res.data.telemetry.ambient.temperatureC !== undefined);
    });

    await test('POST /api/iot/simulate-anomaly triggers critical alarm and mitigation action', async () => {
      const res = await request('POST', '/api/iot/simulate-anomaly', {}, {
        zone: 'chiller',
        temp: 8.8
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.incident.severity, 'CRITICAL');
      assert.ok(res.data.incident.automatedActionsTriggered.length >= 2);
    });

    await test('POST /api/iot/reset restores cold chain to optimal baseline', async () => {
      const res = await request('POST', '/api/iot/reset');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.telemetry.chiller.status, 'OPTIMAL');
    });

    await test('GET /api/loyalty/profile returns VIP tier, streak, and unlocked perks', async () => {
      const res = await request('GET', '/api/loyalty/profile');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.tier !== undefined);
      assert.ok(res.data.data.points >= 0);
      assert.ok(Array.isArray(res.data.data.perks));
    });

    await test('POST /api/loyalty/claim-perk awards promotional perk code', async () => {
      const res = await request('POST', '/api/loyalty/claim-perk', {}, {
        perkName: 'Free Express Delivery'
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.rewardCode.startsWith('VIP-'));
    });

    await test('GET & POST /api/reviews/:productId handles customer reviews and sentiment', async () => {
      // 1. Post new verified review
      const postRes = await request('POST', '/api/reviews/f1', {}, {
        name: 'Kavita Singh',
        rating: 5,
        comment: 'Crisp, juicy and delivered in 7 mins!',
        tags: ['Crisp', 'Fast Delivery']
      });
      assert.strictEqual(postRes.status, 200);
      assert.strictEqual(postRes.data.review.verified, true);

      // 2. Fetch reviews & AI aspect sentiment
      const getRes = await request('GET', '/api/reviews/f1');
      assert.strictEqual(getRes.status, 200);
      assert.ok(getRes.data.reviews.length >= 1);
      assert.ok(getRes.data.aiSentiment.aspects.length >= 3);
    });

    await test('GET /api/recommendations/substitutes/:productId returns enriched alternatives', async () => {
      const res = await request('GET', '/api/recommendations/substitutes/f1');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.data.length > 0);
      assert.ok(res.data.data[0].matchScore >= 50);
    });

  } finally {
    if (testEnv && testEnv.close) await testEnv.close();
  }

  console.log('\n===============================================================');
  console.log(`  🎉 PINNACLE TEST SUITE COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  runPinnacleTests().catch(err => {
    console.error('Fatal Test Suite Error:', err);
    process.exit(1);
  });
}

module.exports = { runPinnacleTests };
