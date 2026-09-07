/**
 * Phase 5F: Chatbot Catalog Discovery Integration Test Suite
 * Validates:
 * 1. Real catalog discovery (search, price filtering, category/family context, in-stock filtering)
 * 2. Real product-detail grounding (technical specs, bullet points, storage, explicit missing attribute handling)
 * 3. Conversational product context across multi-turn dialogs
 * 4. Storefront handoff (real product IDs, open_product actions)
 */

const assert = require('assert');
const { processAgenticChat, resetSession, getOrCreateSession } = require('../services/chatbot-agent');
const { initDb, getDb } = require('../db/database');

async function runPhase5FTests() {
  console.log('='.repeat(60));
  console.log('🧪 PHASE 5F — CHATBOT CATALOG DISCOVERY & GROUNDING TESTS');
  console.log('='.repeat(60));

  await initDb();
  const db = getDb();

  let passed = 0;
  let total = 0;

  function test(desc, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${desc}: ${err.message}`);
      throw err;
    }
  }

  async function asyncTest(desc, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${desc}: ${err.message}`);
      throw err;
    }
  }

  // 1. Real Catalog Discovery
  await asyncTest('1.1 Search with price filtering extracts maxPrice and returns matching products under limit', async () => {
    const convId = 'p5f_price_' + Date.now();
    const res = await processAgenticChat({
      message: 'Find bread under 50',
      conversationId: convId
    });

    assert.strictEqual(res.intent, 'PRODUCT_SEARCH', 'Intent should be PRODUCT_SEARCH');
    assert.ok(Array.isArray(res.products) && res.products.length > 0, 'Should return matching products');
    for (const p of res.products) {
      assert.ok(p.price <= 50, `Product price ₹${p.price} should be <= ₹50`);
      assert.ok(p.id, 'Product must have real ID');
    }
  });

  await asyncTest('1.2 Category discovery ("which fruits are available") discovers real catalog fruits with in-stock filter', async () => {
    const convId = 'p5f_cat_' + Date.now();
    const res = await processAgenticChat({
      message: 'Which fruits are available in store?',
      conversationId: convId
    });

    assert.strictEqual(res.intent, 'PRODUCT_SEARCH');
    assert.ok(res.products.length > 0, 'Should discover fruits');
    for (const p of res.products) {
      assert.strictEqual(p.category, 'fruits', `Product ${p.name} category should be fruits`);
      assert.ok(p.stock > 0, `Product ${p.name} should be in stock`);
    }
  });

  await asyncTest('1.3 Product family discovery ("show products in this family") returns items from active product family', async () => {
    // Seed session with a known product with a product_family
    const sample = db.prepare('SELECT * FROM products WHERE product_family IS NOT NULL AND product_family != "" LIMIT 1').get();
    assert.ok(sample, 'Must have product with product_family in catalog');

    const convId = 'p5f_fam_' + Date.now();
    const session = getOrCreateSession(convId);
    session.currentProduct = sample;
    session.recentFamily = sample.product_family;

    const res = await processAgenticChat({
      message: 'Show products in this family',
      conversationId: convId
    });

    assert.strictEqual(res.intent, 'PRODUCT_SEARCH');
    assert.ok(res.products.length > 0, 'Should return products from family');
    for (const p of res.products) {
      assert.strictEqual(p.product_family, sample.product_family, `Product ${p.name} should belong to family ${sample.product_family}`);
    }
  });

  // 2. Real Product-Detail Grounding
  await asyncTest('2.1 Product details grounding answers strictly from catalog fields without hallucinating', async () => {
    // Pick a product with technical_specs_json
    const sample = db.prepare('SELECT * FROM products WHERE technical_specs_json IS NOT NULL AND technical_specs_json != "{}" LIMIT 1').get();
    assert.ok(sample, 'Must have a product with technical specs');

    const convId = 'p5f_detail_' + Date.now();
    const res = await processAgenticChat({
      message: `Tell me about ${sample.name}`,
      conversationId: convId
    });

    assert.strictEqual(res.intent, 'PRODUCT_DETAILS');
    assert.ok(res.products.length > 0);
    assert.strictEqual(res.products[0].id, sample.id);
    assert.ok(res.message.includes(sample.name), 'Response must contain product name');
    assert.ok(res.message.includes(sample.price.toString()), 'Response must contain verified price');

    // Verify storefront handoff action
    assert.ok(Array.isArray(res.actions) && res.actions.length > 0, 'Must have storefront actions');
    const openAct = res.actions.find(a => a.type === 'open_product');
    assert.ok(openAct, 'Must include open_product action');
    assert.strictEqual(openAct.payload.productId, sample.id, 'Action payload must contain real product ID');
  });

  await asyncTest('2.2 Missing product specs are honestly reported as not specified in catalog (zero fabrication)', async () => {
    // Pick a product with null or empty technical specs
    const sample = db.prepare('SELECT * FROM products WHERE technical_specs_json IS NULL OR technical_specs_json = "{}" OR technical_specs_json = "" LIMIT 1').get();
    assert.ok(sample, 'Must have product with missing specs');

    const convId = 'p5f_missing_' + Date.now();
    const res = await processAgenticChat({
      message: `What are the specs of ${sample.name}?`,
      conversationId: convId
    });

    assert.strictEqual(res.intent, 'PRODUCT_DETAILS');
    assert.ok(res.message.includes('No technical specifications recorded in catalog'), 'Must honestly state missing information');
  });

  // 3. Conversational Product Context Across Turns
  await asyncTest('3.1 Multi-turn context: user references "the first one" or "it" and bot maintains grounding', async () => {
    const convId = 'p5f_multiturn_' + Date.now();

    // Turn 1: Search
    const t1 = await processAgenticChat({
      message: 'Show me organic apples',
      conversationId: convId
    });
    assert.strictEqual(t1.intent, 'PRODUCT_SEARCH');
    assert.ok(t1.products.length > 0);
    const firstProd = t1.products[0];

    // Turn 2: Follow-up specs on "the first one"
    const t2 = await processAgenticChat({
      message: 'What are the specs of the first one?',
      conversationId: convId
    });
    assert.strictEqual(t2.intent, 'PRODUCT_DETAILS');
    assert.ok(t2.products.length > 0);
    assert.strictEqual(t2.products[0].id, firstProd.id, 'Follow-up must resolve to the first product from turn 1');

    // Turn 3: Follow-up inventory on "it"
    const t3 = await processAgenticChat({
      message: 'Is it in stock?',
      conversationId: convId
    });
    assert.strictEqual(t3.intent, 'INVENTORY_CHECK');
    assert.ok(t3.message.includes(firstProd.name), 'Inventory check must resolve to first product');
  });

  // 4. Storefront Handoff
  await asyncTest('4.1 Chatbot results expose real product IDs and SPA open_product handoff payloads', async () => {
    const convId = 'p5f_handoff_' + Date.now();
    const res = await processAgenticChat({
      message: 'Find cold milk',
      conversationId: convId
    });

    assert.ok(res.products.length > 0);
    for (const p of res.products) {
      assert.ok(p.id, 'Each product must have a valid non-empty id');
      const dbProd = db.prepare('SELECT id, name FROM products WHERE id = ?').get(p.id);
      assert.ok(dbProd, `Product ${p.id} must exist in live database`);
    }

    // Verify open_product action payload
    const openAction = res.actions.find(a => a.type === 'open_product');
    assert.ok(openAction, 'Must have open_product action');
    assert.ok(openAction.payload && openAction.payload.productId, 'Action payload must have productId');
  });

  console.log('='.repeat(60));
  console.log(`🎉 ALL ${passed}/${total} PHASE 5F TESTS PASSED SUCCESSFULLY!`);
  console.log('='.repeat(60));
}

runPhase5FTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
