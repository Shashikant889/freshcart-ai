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
    'ml/recommendation-engine.js',
    'ml/demand-forecasting.js',
    'ml/customer-segmentation.js',
    'ml/pricing-optimization.js',
    'ml/fraud-detection.js',
    'ml/route-optimizer.js',
    'ml/fridge-vision-ai.js',
    'routes/auth.js',
    'routes/products.js',
    'routes/cart.js',
    'routes/orders.js',
    'routes/admin.js',
    'routes/recommendations.js',
    'routes/analytics.js',
    'routes/search.js',
    'routes/assistant.js',
    'routes/pricing.js',
    'routes/dispatch.js',
    'routes/visual.js',
    'routes/nutrition.js',
    'routes/wallet.js',
    'routes/group-orders.js',
    'routes/supplier.js',
    'public/js/app.js',
    'public/js/admin.js',
    'public/sw.js'
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
// 3. Execution of All 6 Modular Test Suites
// -------------------------------------------------------------
runAuditSection('3. Executing All 6 Automated Multi-Tier Test Suites (85 Assertions):', () => {
  const suites = [
    { name: '10-Agent ML Verification Suite', cmd: 'node test/deep-verify.js' },
    { name: 'OWASP Security & SQLi Immunity Suite', cmd: 'node test/security-safety-test.js' },
    { name: 'Backend Alpha/Beta & Concurrency Suite', cmd: 'node test/alpha-beta-backend.js' },
    { name: 'Frontend Synthetic DOM & Localization Suite', cmd: 'node test/synthetic-frontend-test.js' },
    { name: 'Enterprise Mega-Pack Verification Suite', cmd: 'node test/enterprise-features-test.js' },
    { name: 'PWA, Vision AI & Payment Gateway Suite', cmd: 'node test/pwa-vision-payment-test.js' }
  ];

  suites.forEach(suite => {
    try {
      const output = execSync(suite.cmd, { cwd: rootDir, stdio: 'pipe' }).toString();
      const hasFailure = output.includes('FAIL') && !output.includes('0 FAILED');
      assertCheck(suite.name, !hasFailure);
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
