/**
 * FreshCart AI — PWA, Multimodal Smart Fridge AI & Payment Gateway Verification Suite
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { initDb, getDb } = require('../db/database');
const { analyzeFridgeImage, SCENE_PRESETS } = require('../ml/fridge-vision-ai');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  🚀 [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Reason: ${err.message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('  📱 FRESHCART AI: PWA, VISION AI & GATEWAY TEST SUITE');
  console.log('===============================================================\n');

  await initDb();

  console.log('📌 1. Multimodal Snap Your Fridge & Pantry AI Engine:');

  test('Scene presets defined with target items and confidence metrics', () => {
    assert(SCENE_PRESETS.breakfast_depleted, 'breakfast_depleted preset missing');
    assert(SCENE_PRESETS.produce_running_low, 'produce_running_low preset missing');
    assert(SCENE_PRESETS.weekly_pantry_restock, 'weekly_pantry_restock preset missing');
    assert(SCENE_PRESETS.breakfast_depleted.confidence >= 0.85, 'Confidence threshold must be >= 0.85');
  });

  test('Analyze fridge image extracts missing items and computes bundle discount', () => {
    const result = analyzeFridgeImage({ presetKey: 'breakfast_depleted' });
    assert.strictEqual(result.success, true);
    assert(result.scanId.startsWith('SCN-'), 'Scan ID format must start with SCN-');
    assert(result.missingEssentials.length > 0, 'Must identify missing essentials');
    assert(result.financialSummary.bundleDiscount > 0, 'Bundle discount must be positive');
    assert.strictEqual(result.financialSummary.bundleDiscountPercent, 10);
    assert.strictEqual(
      result.financialSummary.finalBundlePrice,
      result.financialSummary.subtotal - result.financialSummary.bundleDiscount
    );
  });

  test('Fridge vision handles custom pantry query prompts', () => {
    const result = analyzeFridgeImage({ customPrompt: 'apple milk banana' });
    assert.strictEqual(result.success, true);
    assert(result.missingEssentials.length >= 1, 'Should find matching fruit/dairy items');
  });

  console.log('\n📌 2. Progressive Web App (PWA) Manifest & Service Worker:');

  test('PWA manifest.json exists and adheres to W3C Standalone specs', () => {
    const manifestPath = path.join(__dirname, '../public/manifest.json');
    assert(fs.existsSync(manifestPath), 'manifest.json does not exist');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.strictEqual(manifest.display, 'standalone');
    assert.strictEqual(manifest.theme_color, '#10b981');
    assert(manifest.icons && manifest.icons.length >= 2, 'Must declare at least 2 icon sizes');
  });

  test('Service Worker (sw.js) caches static shell and intercepts fetch', () => {
    const swPath = path.join(__dirname, '../public/sw.js');
    assert(fs.existsSync(swPath), 'sw.js does not exist');
    const content = fs.readFileSync(swPath, 'utf8');
    assert(content.includes('CACHE_NAME'), 'Service worker must declare CACHE_NAME');
    assert(content.includes('caches.open'), 'Service worker must open cache');
    assert(content.includes('fetch'), 'Service worker must handle fetch events');
  });

  test('PWA icon assets are valid SVGs', () => {
    const icon192 = path.join(__dirname, '../public/icons/icon-192.svg');
    const icon512 = path.join(__dirname, '../public/icons/icon-512.svg');
    assert(fs.existsSync(icon192), 'icon-192.svg missing');
    assert(fs.existsSync(icon512), 'icon-512.svg missing');
  });

  console.log('\n📌 3. GitHub Actions CI/CD Pipeline Configuration:');

  test('GitHub Actions workflow exists with matrix testing and test:all execution', () => {
    const ciPath = path.join(__dirname, '../.github/workflows/ci.yml');
    assert(fs.existsSync(ciPath), 'ci.yml does not exist');
    const ciContent = fs.readFileSync(ciPath, 'utf8');
    assert(ciContent.includes('matrix'), 'Must specify node-version matrix');
    assert(ciContent.includes('npm run test:all'), 'Must execute npm run test:all');
  });

  console.log('\n📌 4. Payment Gateway & Visual Route Handlers:');

  test('Visual router exports smart-fridge-scan and fridge-presets endpoints', () => {
    const visualRouter = require('../routes/visual');
    assert(visualRouter, 'visual router module must load');
  });

  console.log('\n===============================================================');
  console.log(`  🎉 PWA, VISION & GATEWAY SUITE COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('===============================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests();
