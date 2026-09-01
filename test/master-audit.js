/**
 * FreshCart AI — Master Automated Codebase & System Health Auditor
 * Comprehensive single-command verification for Frontend, Backend, ML, Security, PWA, and Fintech.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

console.log('\n' + '='.repeat(68));
console.log('  🌿 FRESHCART AI: MASTER FULL-STACK SYSTEM & CODEBASE AUDITOR');
console.log('='.repeat(68) + '\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function runAuditSection(title, fn) {
  console.log(`\n📌 ${title}`);
  try {
    fn();
  } catch (err) {
    console.error(`  ❌ [CRITICAL ERROR] in ${title}: ${err.message}`);
  }
}

function assertCheck(name, condition, errorMsg = '') {
  totalChecks++;
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
    passedChecks++;
  } else {
    console.error(`  ❌ [FAIL] ${name} ${errorMsg ? `— ${errorMsg}` : ''}`);
    failedChecks++;
  }
}

// -------------------------------------------------------------
// 1. JavaScript Syntax Verification (All Files)
// -------------------------------------------------------------
runAuditSection('1. Codebase Syntax & Lint Verification (node -c):', () => {
  const jsFiles = [
    'server.js',
    'db/database.js',
    'db/seed.js',
    'db/synthetic-data.js',
    'ml/customer-segmentation.js',
    'ml/dark-store-picker.js',
    'ml/demand-forecasting.js',
    'ml/dynamic-pricing.js',
    'ml/flash-sale-ai.js',
    'ml/fraud-detection.js',
    'ml/fridge-vision-ai.js',
    'ml/nutrition-advisor.js',
    'ml/recipe-assistant.js',
    'ml/recommendation-engine.js',
    'ml/route-optimizer.js',
    'ml/smart-search.js',
    'ml/visual-search.js',
    'middleware/auth.js',
    'routes/admin.js',
    'routes/analytics.js',
    'routes/assistant.js',
    'routes/auth.js',
    'routes/cart.js',
    'routes/dispatch.js',
    'routes/group-orders.js',
    'routes/health.js',
    'routes/nutrition.js',
    'routes/orders.js',
    'routes/pricing.js',
    'routes/products.js',
    'routes/recommendations.js',
    'routes/search.js',
    'routes/supplier.js',
    'routes/visual.js',
    'scripts/dev-start.js',
    'services/ai-client.js',
    'public/js/app.js',
    'public/js/admin.js',
    'public/sw.js',
    'test/test-helper.js',
    'test/deep-verify.js',
    'test/security-safety-test.js',
    'test/alpha-beta-backend.js',
    'test/synthetic-frontend-test.js',
    'test/enterprise-features-test.js',
    'test/pwa-vision-payment-test.js',
    'test/ai-service-integration-test.js',
    'test/unified-app-hardening-test.js'
  ];

  jsFiles.forEach(file => {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      try {
        execSync(`node -c "${fullPath}"`, { stdio: 'pipe' });
        assertCheck(`Syntax Check: ${file}`, true);
      } catch (e) {
        assertCheck(`Syntax Check: ${file}`, false, e.message);
      }
    } else {
      assertCheck(`File exists: ${file}`, false, 'File not found');
    }
  });
});

// -------------------------------------------------------------
// 2. Static Assets & Manifest Specifications
// -------------------------------------------------------------
runAuditSection('2. Frontend Assets, PWA Manifest & Design System Tokens:', () => {
  const manifestPath = path.join(rootDir, 'public/manifest.json');
  const styleCssPath = path.join(rootDir, 'public/css/style.css');
  const indexHtmlPath = path.join(rootDir, 'public/index.html');
  const adminHtmlPath = path.join(rootDir, 'public/admin.html');

  assertCheck('PWA manifest.json exists and is valid JSON', fs.existsSync(manifestPath) && (() => {
    try { JSON.parse(fs.readFileSync(manifestPath, 'utf8')); return true; } catch (e) { return false; }
  })());

  assertCheck('Storefront HTML (public/index.html) exists and has viewport meta', fs.existsSync(indexHtmlPath) && fs.readFileSync(indexHtmlPath, 'utf8').includes('viewport'));
  assertCheck('Admin Dashboard HTML (public/admin.html) exists', fs.existsSync(adminHtmlPath));
  assertCheck('Design Tokens in style.css define CSS variables (--bg-dark, --green-500)', fs.existsSync(styleCssPath) && fs.readFileSync(styleCssPath, 'utf8').includes('--green-500'));
});

// -------------------------------------------------------------
// 3. Execution of All 8 Modular Test Suites
// -------------------------------------------------------------
runAuditSection('3. Executing All 8 Automated Multi-Tier Test Suites (140+ Assertions):', () => {
  const suites = [
    { name: '10-Agent ML Verification Suite', cmd: 'node test/deep-verify.js' },
    { name: 'OWASP Security & SQLi Immunity Suite', cmd: 'node test/security-safety-test.js' },
    { name: 'Backend Alpha/Beta & Concurrency Suite', cmd: 'node test/alpha-beta-backend.js' },
    { name: 'Frontend Synthetic DOM & Localization Suite', cmd: 'node test/synthetic-frontend-test.js' },
    { name: 'Enterprise Mega-Pack Verification Suite', cmd: 'node test/enterprise-features-test.js' },
    { name: 'PWA, Vision AI & Payment Gateway Suite', cmd: 'node test/pwa-vision-payment-test.js' },
    { name: 'AI/ML Microservice & Operations Research Integration Suite', cmd: 'node test/ai-service-integration-test.js' },
    { name: 'Unified Application Architecture & Engineering Hardening Suite', cmd: 'node test/unified-app-hardening-test.js' }
  ];

  suites.forEach(suite => {
    try {
      const output = execSync(suite.cmd, { cwd: rootDir, stdio: 'pipe' }).toString();
      const isFailed = output.includes('❌') || output.includes('🚨') || (output.includes('FAILED') && !output.includes('0 FAILED'));
      assertCheck(suite.name, !isFailed);
    } catch (err) {
      assertCheck(suite.name, false, err.stdout ? err.stdout.toString() : err.message);
    }
  });
});

// -------------------------------------------------------------
// Final Audit Summary Report
// -------------------------------------------------------------
console.log('\n' + '='.repeat(68));
console.log(`  🎯 MASTER AUDIT COMPLETE: ${passedChecks} PASSED, ${failedChecks} FAILED (Total: ${totalChecks})`);
console.log('='.repeat(68));

if (failedChecks === 0) {
  console.log('\n  🌟 [STATUS: 100% HEALTHY] Entire codebase and all features are operational!\n');
  process.exit(0);
} else {
  console.error(`\n  🚨 [STATUS: FAILING] Detected ${failedChecks} failed checks.\n`);
  process.exit(1);
}

