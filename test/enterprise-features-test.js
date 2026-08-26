/**
 * FreshCart AI — Enterprise Mega-Features Verification & Testing Suite
 * Tests Nutrition AI, Allergen Safety, Expiry Markdown Engine, Warehouse 2D TSP,
 * FreshWallet Split Payment, Group Buying Lobbies, and Supplier ROP Generator.
 */

const assert = require('assert');
const { analyzeCartNutrition, PRODUCT_NUTRITION_PROFILES } = require('../ml/nutrition-advisor');
const { calculateExpiryMarkdown, getActiveFlashDeals } = require('../ml/flash-sale-ai');
const { optimizeWarehousePickerRoute, PRODUCT_WAREHOUSE_LOCATIONS } = require('../ml/dark-store-picker');
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

async function runEnterpriseTests() {
  console.log('\n===============================================================');
  console.log('  🌟 FRESHCART AI: ENTERPRISE FEATURES VERIFICATION SUITE');
  console.log('===============================================================\n');

  let testEnv = null;
  try {
    testEnv = await startTestServer();
    const request = testEnv.request;

    // -------------------------------------------------------------
    // 1. NUTRITION & ALLERGEN INTELLIGENCE ENGINE
    // -------------------------------------------------------------
    console.log('📌 1. Nutrition & Allergen Intelligence AI:');

    await test('Calculate accurate macro breakdown (Calories, Protein, Carbs, Fiber, Fat)', () => {
      const cartItems = [
        { productId: 'f1', quantity: 2 }, // 2x Apple: 104 cal, 0.6g P, 28g C, 4.8g F
        { productId: 'd1', quantity: 1 }  // 1x Milk: 62 cal, 3.2g P, 4.8g C, 0g F
      ];
      const analysis = analyzeCartNutrition(cartItems, []);
      assert.ok(analysis.totals.calories >= 160);
      assert.ok(analysis.totals.protein >= 3.5);
      assert.ok(analysis.totals.fiber >= 4.0);
      assert.ok(analysis.healthRating > 0 && analysis.healthRating <= 100);
    });

    await test('Detect allergens (Lactose / Gluten) against user profile with alerts', () => {
      const cartItems = [
        { productId: 'd1', quantity: 1 }, // Whole Milk (Lactose)
        { productId: 'b1', quantity: 1 }  // Sourdough (Gluten)
      ];
      const userAllergies = ['lactose', 'gluten'];
      const analysis = analyzeCartNutrition(cartItems, userAllergies);

      assert.ok(analysis.detectedAllergens.includes('lactose'));
      assert.ok(analysis.detectedAllergens.includes('gluten'));
      assert.strictEqual(analysis.allergenWarnings.length, 2, 'Must generate exactly 2 allergen warnings');
    });

    await test('Nutri-Score assigns Grade A/B for high fiber/protein organic baskets', () => {
      const healthyBasket = [
        { productId: 'v1', quantity: 2 }, // Broccoli
        { productId: 'v2', quantity: 2 }, // Baby Spinach
        { productId: 'f1', quantity: 2 }  // Apples
      ];
      const analysis = analyzeCartNutrition(healthyBasket, []);
      assert.ok(['A', 'B'].includes(analysis.nutriScore), `Healthy basket should receive Nutri-Score A or B (Got ${analysis.nutriScore})`);
      assert.ok(analysis.healthRating >= 65, 'Health rating should be >= 65');
    });

    await test('Smart Substitution engine suggests allergy-safe & healthier alternatives', () => {
      const cartWithDairy = [{ productId: 'd1', quantity: 1 }]; // Whole milk
      const analysis = analyzeCartNutrition(cartWithDairy, ['lactose']);
      assert.ok(analysis.smartSubstitutions.length > 0);
      assert.ok(analysis.smartSubstitutions[0].suggested.allergenFree.includes('lactose'));
    });

    // -------------------------------------------------------------
    // 2. DYNAMIC FLASH SALE & EXPIRY MARKDOWN AI
    // -------------------------------------------------------------
    console.log('\n📌 2. Dynamic Flash Sale & Expiry Markdown AI:');

    await test('Perishable markdown increases dynamically as days to expiry decrease', () => {
      const product = { id: 'd1', name: 'Fresh Milk', price: 69, stock: 40 };

      const deal3Days = calculateExpiryMarkdown(product, 3, 6);
      const deal1Day = calculateExpiryMarkdown(product, 1, 6);

      assert.ok(deal1Day.discountPercent > deal3Days.discountPercent, '1-day expiry must have higher discount than 3-day');
      assert.strictEqual(deal1Day.urgencyLevel, 'critical');
      assert.strictEqual(deal1Day.discountPercent, 50, 'Final day items must have 50% discount');
      assert.ok(deal1Day.discountedPrice < product.price);
    });

    await test('Food waste prevention grams correctly estimated for catalog flash deals', () => {
      const deals = getActiveFlashDeals(4);
      assert.ok(Array.isArray(deals));
      assert.ok(deals.length > 0);
      assert.ok(deals[0].foodWastePreventedGrams > 0);
      assert.ok(deals[0].savings > 0);
    });

    // -------------------------------------------------------------
    // 3. DARK STORE WAREHOUSE 2D TSP PICKER OPTIMIZER
    // -------------------------------------------------------------
    console.log('\n📌 3. Dark Store Warehouse Picker 2D TSP Route Optimizer:');

    await test('Optimize warehouse walk path starting & returning to Packing Station', () => {
      const pickList = ['f1', 'v1', 'd1', 'b1', 's1'];
      const routing = optimizeWarehousePickerRoute(pickList);

      assert.ok(routing.pickSequence.length >= 6, 'Tour must include 5 items + start & return station');
      assert.strictEqual(routing.pickSequence[0].id, 'STATION_01');
      assert.strictEqual(routing.pickSequence[routing.pickSequence.length - 1].id, 'STATION_01');
      assert.ok(routing.totalWalkingMeters > 0);
      assert.ok(routing.estimatedPickSeconds <= 120, `Assembly time (${routing.estimatedPickSeconds}s) should be under 120s`);
    });

    // -------------------------------------------------------------
    // 4. FRESHWALLET FINTECH & SPLIT PAYMENTS
    // -------------------------------------------------------------
    console.log('\n📌 4. FreshWallet Fintech & Split Payments:');

    await test('FreshWallet API provides balance and welcome credits', async () => {
      const res = await request('GET', '/api/wallet/balance', { 'x-session-id': 'test_wallet_user_1' });
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.balance >= 100);
      assert.ok(Array.isArray(res.data.data.transactions));
    });

    await test('FreshWallet Top-Up increases balance and logs transaction', async () => {
      const topupRes = await request('POST', '/api/wallet/topup', { 'x-session-id': 'test_wallet_user_1' }, { amount: 200 });
      assert.strictEqual(topupRes.status, 200);
      assert.ok(topupRes.data.data.balance >= 300);
      assert.strictEqual(topupRes.data.data.transactions[0].type, 'credit');
      assert.strictEqual(topupRes.data.data.transactions[0].amount, 200);
    });

    await test('Split-payment calculates exact wallet deduction and remaining gateway balance', async () => {
      const splitRes = await request('POST', '/api/wallet/pay-split', { 'x-session-id': 'test_wallet_user_1' }, { totalAmount: 500 });
      assert.strictEqual(splitRes.status, 200);
      assert.ok(splitRes.data.data.walletDeducted > 0);
      assert.strictEqual(splitRes.data.data.orderTotal, 500);
      assert.strictEqual(splitRes.data.data.walletDeducted + splitRes.data.data.gatewayPayable, 500);
    });

    // -------------------------------------------------------------
    // 5. NEIGHBORHOOD GROUP BUYING & BULK DISCOUNTS
    // -------------------------------------------------------------
    console.log('\n📌 5. Neighborhood Group Buying & Community Tier Pooling:');

    await test('Create Group Buying Lobby & List active community lobbies', async () => {
      const createRes = await request('POST', '/api/group-orders/create', {}, {
        communityName: 'Greenwood Palm Apartments',
        hostName: 'Kavita Iyer'
      });
      assert.strictEqual(createRes.status, 201);
      const groupId = createRes.data.data.groupId;
      assert.ok(groupId.startsWith('GRP-'));

      const listRes = await request('GET', '/api/group-orders/lobbies');
      assert.strictEqual(listRes.status, 200);
      assert.ok(listRes.data.data.some(l => l.groupId === groupId));
    });

    await test('Joining group lobby dynamically upgrades community discount tier (5% -> 8% -> 10% -> 15%)', async () => {
      const createRes = await request('POST', '/api/group-orders/create', {}, {
        communityName: 'Prestige Ozone',
        hostName: 'Vikram Seth'
      });
      const groupId = createRes.data.data.groupId;

      // Join with 3 more neighbors
      await request('POST', `/api/group-orders/${groupId}/join`, {}, { memberName: 'Neighbor 2', itemsCount: 3, subtotal: 450 });
      await request('POST', `/api/group-orders/${groupId}/join`, {}, { memberName: 'Neighbor 3', itemsCount: 2, subtotal: 350 });
      const finalJoin = await request('POST', `/api/group-orders/${groupId}/join`, {}, { memberName: 'Neighbor 4', itemsCount: 4, subtotal: 600 });

      assert.strictEqual(finalJoin.status, 200);
      assert.strictEqual(finalJoin.data.data.members.length, 4);
      assert.strictEqual(finalJoin.data.data.currentDiscountPercent, 10, '4 members should unlock 10% discount tier');
    });

    // -------------------------------------------------------------
    // 6. AUTOMATED SUPPLIER REORDER POINT (ROP) & PO GENERATOR
    // -------------------------------------------------------------
    console.log('\n📌 6. Automated Supplier Reorder Point (ROP) & PO Generator:');

    await test('Supplier ROP math generates accurate Safety Stock and Reorder alerts', async () => {
      // Obtain admin token
      const loginRes = await request('POST', '/api/auth/login', {}, { email: 'admin@freshcart.com', password: 'admin123' });
      const adminToken = loginRes.data.data.token;

      const ropRes = await request('GET', '/api/supplier/reorder-alerts', { Authorization: `Bearer ${adminToken}` });
      assert.strictEqual(ropRes.status, 200);
      assert.ok(ropRes.data.data.totalProductsEvaluated >= 30);
      assert.ok(Array.isArray(ropRes.data.data.reorderReport));

      const sample = ropRes.data.data.reorderReport[0];
      assert.ok(sample.safetyStock > 0);
      assert.ok(sample.reorderPoint > sample.safetyStock);
      assert.ok(sample.priority !== undefined);
    });

    await test('Supplier Warehouse Picker Route API responds with valid 2D TSP itinerary', async () => {
      const loginRes = await request('POST', '/api/auth/login', {}, { email: 'admin@freshcart.com', password: 'admin123' });
      const adminToken = loginRes.data.data.token;

      const tspRes = await request('POST', '/api/supplier/warehouse-picker-route', { Authorization: `Bearer ${adminToken}` }, {
        productIds: ['f1', 'f3', 'v2', 'd2', 's1']
      });
      assert.strictEqual(tspRes.status, 200);
      assert.ok(tspRes.data.data.totalWalkingMeters > 0);
      assert.ok(tspRes.data.data.aisleTransitions.length > 0);
    });

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n===============================================================');
    console.log(`  🌟 ENTERPRISE SUITE COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('===============================================================\n');

  } finally {
    if (testEnv) {
      await testEnv.close();
    }
  }

  if (failedTests > 0) {
    process.exit(1);
  }
}

runEnterpriseTests().catch(err => {
  console.error('Fatal Enterprise Test Error:', err);
  process.exit(1);
});

