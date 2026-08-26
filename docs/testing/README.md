# Quality Assurance & Multi-Tier Testing Infrastructure

This document provides a comprehensive technical guide to the automated testing suites, test-server lifecycle, database isolation strategy, and verification commands for **FreshCart AI**.

---

## 1. Test Architecture & Server Lifecycle

FreshCart AI implements an in-process, zero-configuration ephemeral test harness located at `test/test-helper.js`.

### Ephemeral Test Server Lifecycle (`test/test-helper.js`)
Tests requiring live HTTP APIs (e.g. `test/alpha-beta-backend.js`, `test/enterprise-features-test.js`) instantiate an isolated server instance without requiring a background terminal process:

```
startTestServer()
  ├── Set process.env.NODE_ENV = 'test'
  ├── initDb({ persist: false, forceReinit: true }) ──► Loads clean SQLite buffer in RAM
  ├── createApp() ──► Instantiates Express application
  ├── server.listen(0, '127.0.0.1') ──► OS assigns dynamic ephemeral port
  └── returns { request, port, baseUrl, close }
       │
       ▼
  [Execute Test Assertions via pre-bound request()]
       │
       ▼
finally {
  await testEnv.close()
    ├── server.close() ──► Releases TCP port
    └── closeDb({ save: false }) ──► Discards memory mutations without writing to disk
}
```

### Key Lifecycle Advantages
1. **Zero Port Conflicts:** Using port `0` ensures tests can run concurrently on any free OS port.
2. **Zero Pre-requisite Setup:** Developers and CI runners do NOT need to manually run `npm start` before executing tests.
3. **Graceful Teardown:** Every test wraps execution in `try ... finally` blocks to ensure port release and memory garbage collection.

---

## 2. Test Database Strategy & Isolation

The production/demo database is stored at `db/freshcart.db` (~10 MB containing 12 months of sales history and >50,000 interaction vectors).

### In-Memory Clone Isolation
- When running in test mode (`process.env.NODE_ENV === 'test'` or `persist: false`), `db/database.js` reads the full binary dataset from `freshcart.db` into WebAssembly RAM memory.
- All writes, table updates, test order creations, and stock decrements occur **exclusively in RAM**.
- `saveDb()` checks `persistToFile` and refuses to write back to `freshcart.db`.
- When tests finish, `closeDb({ save: false })` discards the modified memory buffer, leaving `db/freshcart.db` **100% pristine and unaltered**.

---

## 3. Test Commands Reference

All test commands run out-of-the-box in any terminal environment:

| Category | Command | Target File | Scope / Assertions |
|---|---|---|---|
| **Primary Unit & ML Test** | `npm test` | `test/deep-verify.js` | 24 assertions covering schema, catalog, JWT, cart math, and 12 ML/Math engines |
| **Security & OWASP Audit** | `npm run test:security` | `test/security-safety-test.js` | 16 assertions covering RBAC, bcrypt hash strength, SQLi immunity, XSS, fraud bounds |
| **Backend Integration & Concurrency** | `npm run test:alpha-beta` | `test/alpha-beta-backend.js` | 14 assertions testing all 11 API routes, 15-user concurrency load, ACID consistency |
| **Frontend Synthetic & DOM** | `npm run test:frontend` | `test/synthetic-frontend-test.js` | 10 assertions testing DOM hierarchy, client state, bilingual Hindi dictionary, invoice generator |
| **Enterprise Features Pack** | `npm run test:enterprise` | `test/enterprise-features-test.js` | 14 assertions testing Nutrition AI, allergen safety, expiry markdown, warehouse TSP, wallet, group buy, supplier ROP |
| **PWA, Vision AI & Fintech** | `npm run test:pwa-vision` | `test/pwa-vision-payment-test.js` | 11 assertions testing PWA manifest, fridge vision presets, UPI dynamic QR matrix |
| **Complete Test Suite** | `npm run test:all` | *All 6 Suites* | **89 total assertions across all tiers (100% PASS)** |
| **Master Codebase Auditor** | `npm run audit` / `npm run check` | `test/master-audit.js` | Syntax verification across 44 JS files + static asset checks + all 6 test suites |

---

## 4. Test Suites Detailed Breakdown

### 1. 10-Agent ML Multi-Tier Verification (`test/deep-verify.js`)
- Validates 7 core SQLite tables, 31 catalog products, 12 months sales history (>10,000 entries), and user interactions (>50,000 events).
- Tests Hybrid recommendations, Apriori Association Rules, Precision@5 / Recall@5 evaluation, OLS Linear Regression demand forecasting, K-Means customer clustering, WCSS Elbow curve, Price Elasticity of Demand simulator, Z-Score transaction fraud anomaly detection, VRP 2-Opt route optimization, Visual search, and FreshBot recipe solver.

### 2. Security, OWASP & Safety Test Suite (`test/security-safety-test.js`)
- Enforces strict RBAC (non-admin token rejection on `/api/admin/*`).
- Verifies bcrypt 10 salt rounds and rejects brute-force password mismatches.
- Tests SQL injection immunity across 3 attack vectors (Auth login bypass, catalog UNION exfiltration, blind boolean injection).
- Validates input sanitization against XSS `<script>` payloads and prompt injection.
- Tests real-time transaction fraud risk scoring ($Z > 3\sigma$) and dynamic pricing mathematical bounds.

### 3. Backend Alpha & Beta Integration Suite (`test/alpha-beta-backend.js`)
- **Phase 1 (Alpha):** Comprehensive HTTP lifecycle tests for Catalog, Filter/Sort, NLP Search, Auth Register/Login/Me, Admin Dashboard, AI Recommendations, Demand Forecasting, Customer Segmentation, FreshBot Assistant, Dynamic Pricing, and Delivery Route Optimizer.
- **Phase 2 (Beta):** Concurrency stress test simulating 15 simultaneous guest carts and order checkouts completed in <150ms, plus 8 parallel AI assistant queries and ACID inventory stock validation.

### 4. Synthetic Frontend & DOM Integration (`test/synthetic-frontend-test.js`)
- Verifies all 15 required interactive navigation control IDs and 11 core modal containers in `public/index.html`.
- Verifies CSS design tokens in `public/css/style.css` (`--bg-dark`, `--green-500`, `--glass-bg`).
- Validates cart price calculations, delivery fee thresholds (₹500 threshold), and GST tax invoice generation.
- Tests bilingual English $\leftrightarrow$ Hindi dictionary parity across all UI strings.

### 5. Enterprise Mega-Features Suite (`test/enterprise-features-test.js`)
- Tests Macronutrient calculations (Calories, Protein, Carbs, Fats, Fiber) and French FSA Nutri-Score assignment (Grade A/B).
- Tests allergen warning triggers (Lactose / Gluten) and smart dietary substitution suggestions.
- Tests dynamic expiry markdown decay calculations and food waste prevention estimations.
- Tests Dark Store Warehouse 2D TSP Picker route optimization (sub-90s walk path).
- Tests FreshWallet top-up, cashback, and split payments.
- Tests Neighborhood Group Buying lobbies and community tier discount upgrades (5% $\to$ 8% $\to$ 10% $\to$ 15%).
- Tests Automated Supplier Reorder Point (ROP) and safety stock calculations.

### 6. PWA, Vision AI & Fintech Gateway (`test/pwa-vision-payment-test.js`)
- Validates PWA manifest (`manifest.json`) against W3C standalone specifications.
- Validates offline Service Worker (`sw.js`) fetch interception and SVG icon assets.
- Tests Multimodal Fridge Vision depletion presets and replenishment bundle discounts.
- Tests UPI dynamic QR payment payload generation and card network IIN prefix identification.

---

## 5. Expected Output

### Running `npm run test:all`
```
===============================================================
  🤖 10-AGENT MULTI-TIER SYSTEM VERIFICATION & AUDIT SUITE
===============================================================
  ... (24 assertions)
  🎉 ALL 10 AGENTS AUDIT COMPLETE: 24 PASSED, 0 FAILED

===============================================================
  🔒 FRESHCART AI: COMPREHENSIVE SECURITY & SAFETY TEST SUITE
===============================================================
  ... (16 assertions)
  🛡️ SECURITY & SAFETY AUDIT COMPLETE: 16 PASSED, 0 FAILED

===============================================================
  🧪 FRESHCART AI: BACKEND ALPHA & BETA TESTING SUITE
===============================================================
  ... (14 assertions)
  🏁 ALPHA TESTING: 11 / 11 PASSED
  🏁 BETA TESTING:  3 / 3 PASSED
  🎯 TOTAL BACKEND ALPHA/BETA SCORE: 14 / 14

===============================================================
  🎨 FRESHCART AI: SYNTHETIC FRONTEND UNIT & DOM TEST SUITE
===============================================================
  ... (10 assertions)
  🎉 FRONTEND SYNTHETIC AUDIT COMPLETE: 10 PASSED, 0 FAILED

===============================================================
  🌟 FRESHCART AI: ENTERPRISE FEATURES VERIFICATION SUITE
===============================================================
  ... (14 assertions)
  🌟 ENTERPRISE SUITE COMPLETE: 14 PASSED, 0 FAILED

===============================================================
  📱 FRESHCART AI: PWA, VISION AI & GATEWAY TEST SUITE
===============================================================
  ... (11 assertions)
  🎉 PWA, VISION & GATEWAY SUITE COMPLETE: 11 PASSED, 0 FAILED
```

### Running `npm run audit`
```
====================================================================
  🌿 FRESHCART AI: MASTER FULL-STACK SYSTEM & CODEBASE AUDITOR
====================================================================

📌 1. Codebase Syntax & Lint Verification (node -c):
  ✅ [PASS] 44 JS files verified without syntax errors

📌 2. Frontend Assets, PWA Manifest & Design System Tokens:
  ✅ [PASS] 4 static and structural checks verified

📌 3. Executing All 6 Automated Multi-Tier Test Suites (89 Assertions):
  ✅ [PASS] 10-Agent ML Verification Suite
  ✅ [PASS] OWASP Security & SQLi Immunity Suite
  ✅ [PASS] Backend Alpha/Beta & Concurrency Suite
  ✅ [PASS] Frontend Synthetic DOM & Localization Suite
  ✅ [PASS] Enterprise Mega-Pack Verification Suite
  ✅ [PASS] PWA, Vision AI & Payment Gateway Suite

====================================================================
  🎯 MASTER AUDIT COMPLETE: 54 PASSED, 0 FAILED (Total: 54)
====================================================================

  🌟 [STATUS: 100% HEALTHY] Entire codebase and all features are operational!
```

---

## 6. Troubleshooting & Common Issues

| Issue | Root Cause | Solution |
|---|---|---|
| `EADDRINUSE` during tests | Hardcoded port assignment collision | The test harness automatically uses `server.listen(0)` to dynamically bind to available OS ports. |
| Tests fail with missing tables | Uninitialized SQLite database | The test helper calls `initDb({ persist: false, forceReinit: true })` which creates an in-memory database cloned from `freshcart.db` or generates schema. |
| Database corrupted after test run | Test mutations saved to disk | The test helper disables file persistence (`persist: false`) and discards changes on close (`closeDb({ save: false })`). |
| Standalone server cannot start | Port 3000 occupied by background process | Set a custom port before starting: `$env:PORT=3001; npm start` on Windows PowerShell or `PORT=3001 npm start` on Linux/macOS. |
