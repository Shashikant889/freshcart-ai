# FreshCart AI — Product ID Dependency Map & Foreign Key Safety Audit

> [!IMPORTANT]
> **Zero Data Corruption Invariant**: Before executing any catalog migration, enrichment, or schema alteration, every database table, foreign key constraint, backend route handler, ML training pipeline, and test assertion referencing `products.id` must be fully documented and protected.
> Preserving only baseline SKUs `f1`–`s5` is **INSUFFICIENT**. Historical transactional tables reference **10,000 distinct product IDs** across **1,476,163 rows**.

---

## 1. Database Tier Foreign Key & Reference Map

Empirical audit of `db/freshcart.db` via `pragma_foreign_key_list` and SQL queries:

| Table Name | Referring Column | Constraint Type | Total Rows | Distinct Product IDs | Orphan Rows | Criticality |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `order_items` | `product_id` | `REFERENCES products(id)` | 292,431 | 10,000 | **0** | **CRITICAL** |
| `user_interactions` | `product_id` | `REFERENCES products(id)` | 980,427 | 10,000 | **0** | **CRITICAL** |
| `sales_history` | `product_id` | `REFERENCES products(id)` | 203,305 | 557 | **0** | **CRITICAL** |
| `cart_items` | `product_id` | `REFERENCES products(id)` | 0 (transient) | 0 | **0** | **HIGH** |
| **Total** | — | — | **1,476,163** | — | **0** | **ZERO DATA LOSS** |

### Detailed Table Implications

#### 1. `order_items` (292,431 rows)
- Every single historical order item references an existing product ID (`f1`–`s5` and `p_<subcategory>_<number>`).
- If any product ID is deleted or changed:
  - SQLite foreign key violation occurs on `PRAGMA foreign_keys = ON`.
  - Customer order history screens (`/api/orders`, `/api/orders/:id`) will fail to render product names, images, or purchase prices due to `JOIN products p ON oi.product_id = p.id`.
  - Financial order totals and reconciliation reports will be corrupted.

#### 2. `user_interactions` (980,427 rows)
- Contains behavioral interaction logs (`view`, `cart`, `purchase`, `rate`) for 150,000 users across 10,000 product IDs.
- Powers collaborative filtering (`sim_CF`), interaction matrices, and recommendation engine algorithms.
- If product IDs are renumbered or removed, the collaborative filtering engine will generate recommendations for nonexistent items or fail matrix decomposition.

#### 3. `sales_history` (203,305 rows)
- Contains chronological daily SKU sales records (`date, quantity_sold, revenue`) across 557 SKUs.
- Direct training input for:
  - Python SARIMAX demand forecasting models (`ml/service/demand_service.py`, `ml/demand-forecasting.js`).
  - Econometric dynamic pricing OLS log-log models (`ml/python/experiments/dynamic_pricing_experiment.py`).
  - Admin revenue analytics and daily sales charts (`/api/analytics/sales-trend`).
- If these 557 product IDs change, time-series continuity is broken, leading to regression test failures and zero demand forecasts.

#### 4. `cart_items` (Active Shopping Carts)
- Transient user carts storing `user_id, product_id, quantity`.
- Managed in real-time by client sessions and chatbot tools (`add_to_cart`, `remove_from_cart`).

---

## 2. Codebase Route & Service Dependency Map

### Backend Express Route Handlers (`routes/`)

| Route File | Endpoints | Product ID Usage | Failure Mode if ID Changed |
| :--- | :--- | :--- | :--- |
| `routes/orders.js` | `POST /api/orders`<br>`GET /api/orders`<br>`GET /api/orders/:id` | `JOIN products p ON c.product_id = p.id`<br>`INSERT INTO order_items (order_id, product_id, ...)` | Order placement fails; order history cards display blank product metadata. |
| `routes/cart.js` | `GET /api/cart`<br>`POST /api/cart/add`<br>`PUT /api/cart/update`<br>`DELETE /api/cart/remove/:productId` | `JOIN products p ON c.product_id = p.id`<br>`WHERE user_id = ? AND product_id = ?` | Cart items fail to display price, stock, or name; quantities cannot be updated. |
| `routes/recommendations.js` | `GET /api/recommendations`<br>`GET /api/recommendations/frequently-bought-together/:productId` | Maps AI recommendations to `products` table via `dbMap.get(r.product_id)` | Recommendation carousel shows empty cards or fallback static items. |
| `routes/admin.js` | `GET /api/admin/top-products`<br>`GET /api/admin/low-stock`<br>`POST /api/admin/optimize-warehouse` | `JOIN products p ON oi.product_id = p.id`<br>`SELECT ... FROM products WHERE id = ?`<br>`product_ids` array passed to ML optimizer | Admin analytics report missing product names; warehouse picker routes fail. |
| `routes/analytics.js` | `GET /api/analytics/summary`<br>`GET /api/analytics/sales-trend` | `JOIN products p ON sh.product_id = p.id` | Analytics sales breakdown by category and SKU return null entries. |
| `routes/supplier.js` | `GET /api/supplier/products`<br>`POST /api/supplier/warehouse-picker-route` | `SELECT product_id, SUM(quantity_sold) ... GROUP BY product_id` | Supplier stock alerts and 2D picker TSP route solvers fail to resolve warehouse rack coordinates. |
| `routes/products.js` | `GET /api/products`<br>`GET /api/products/:id` | `SELECT * FROM products WHERE id = ?`<br>`INSERT INTO user_interactions (user_id, product_id, ...)` | Product detail modal fails; click telemetry records orphaned interaction IDs. |

---

## 3. Python ML & Microservice Dependency Map

| ML Component | File Location | Product ID Usage | Strict Constraint |
| :--- | :--- | :--- | :--- |
| **Recommendation Engine** | `ml/recommendation-engine.js`<br>`ml/service/recommendation_service.py` | `user_interactions(product_id)`<br>`order_items(product_id)`<br>`getSimilarProductsContentBased(product_id)` | Product IDs must match interaction matrix indices; TF-IDF tokens depend on product descriptions. |
| **Knowledge Graph** | `ml/service/app.py`<br>`ml/service/knowledge_graph_service.py` | `GET /kg/substitutes/{product_id}`<br>`find_substitutes(product_id)` | Looks up node in graph by `product_id` (e.g. `f1` -> Organic Apples). Graph edges break if IDs change. |
| **Demand Forecasting** | `ml/demand-forecasting.js`<br>`ml/service/demand_service.py` | `SELECT ... FROM sales_history WHERE product_id = ?` | SARIMAX time-series requires historical continuous daily records tied to exact SKU ID. |
| **Dynamic Pricing** | `ml/python/experiments/dynamic_pricing_experiment.py`<br>`services/ai-client.js` | `simulatePriceChange(productId, delta)`<br>`metrics/dynamic_pricing_metrics.json` | Baseline metrics benchmarked on `f1`, `f2`, etc. Pricing bounds (±25%) depend on base product cost. |
| **Warehouse Picker (TSP)** | `ml/python/optimization/warehouse_optimization.py`<br>`ml/service/optimization_service.py` | `resolve_items(product_ids)` | Resolves product rack locations `(x, y, z)` by `product_id`. Unknown IDs are dropped from pick lists. |

---

## 4. Frontend State & User Experience Bindings

| Frontend Feature | Location | Mechanism | Risk if Product ID Changed |
| :--- | :--- | :--- | :--- |
| **Active Cart** | `public/js/app.js` (lines 1266, 1728) | `state.cart.items.find(i => i.productId === productId)` | Client cart quantity updates mismatch server state. |
| **Wishlist** | `public/js/app.js` (line 4251) | `localStorage.getItem('wishlist')` stores array of `productId` strings | User's saved favorite products fail to resolve. |
| **Comparison Tool** | `public/js/app.js` (line 4340) | `state.compareList` stores array of `productId` strings | Compare modal shows blank columns. |
| **Recently Viewed** | `public/js/app.js` (line 1537) | `state.recentlyViewed` stores array of `productId` strings | Recently viewed carousel fails to fetch products. |
| **Barcode Scanner** | `public/js/app.js` (line 4751) | `simulateBarcodeScan(productId)` | Barcode camera scanner simulation fails. |
| **Verified Reviews** | `public/js/app.js` (line 4900) | `openReviewsModal(productId)` -> `/api/reviews/${productId}` | Product reviews modal displays error. |
| **Conversational Agent** | `services/chatbot-agent.js` (line 914) | Chatbot tools `add_to_cart(productId)`, `track_order()` | Conversational AI Benchmark (66/66) fails tool calling. |

---

## 5. Test Suite Invariants & Hardcoded SKU Assertions

The following test suites have strict assertions on product IDs. Any change to these IDs will cause instant test failure:

| Test Suite | Assertions | Key Tested SKUs |
| :--- | :--- | :--- |
| `test/deep-verify.js` (24/24 PASS) | `assert.strictEqual(resApple[0].product.id, 'f1')`<br>`assert.strictEqual(matchesRed[0].product.id, 'f1')`<br>`forecastProductDemand('f1', 7)`<br>`simulatePriceChange('f1', 10)` | `f1` (Organic Apples), `d1` (Whole Milk), `v2` (Red Tomatoes) |
| `test/ai-service-integration-test.js` | `forecastDemand({ productId: 'f1' })`<br>`recommendPrice({ productId: 'f1' })`<br>`optimizeWarehouse({ productIds: ['f1', 'd1', 'b1', 'v2', 's1'] })` | `f1`, `d1`, `b1`, `v2`, `s1` |
| `test/benchmark.js` | Performance benchmarks on `/predict/demand` (`f1`), `/predict/price` (`f1`), `/optimize/warehouse` (`f1, v2, d1, b1, s2`) | `f1`, `v2`, `d1`, `b1`, `s2` |
| `test/pinnacle-features-test.js` | `getSmartSubstitutes('f1', 3)`<br>`assert.notStrictEqual(substitutes[0].id, 'f1')` | `f1` |
| `test/examiner-walkthrough-test.js` | `items: [{ id: 'f1', price: 120, quantity: 2 }, { id: 'd1', price: 69, quantity: 1 }]` | `f1`, `d1` |
| `test/security-safety-test.js` | Concurrency & inventory race conditions on `f1`, SQL injection tests | `f1`, `d1` |
| `test/unified-app-hardening-test.js` | Cart validation with `{ productId: 'f1', quantity: -5 }` | `f1` |

---

## 6. Migration Strategy Safety Rule: In-Place Identity Preservation

To guarantee **ZERO regressions**, **ZERO orphaned records**, and **100% test preservation**:

1. **Immutable Primary Keys for Historical SKUs**:
   - The 10,000 product IDs currently referenced in `order_items`, `user_interactions`, and `sales_history` (`f1`–`s5` and `p_*`) **MUST NOT BE DROPPED OR REPLACED**.
   - These records must be **enriched in-place** (updating `barcode`, `image_url`, `brand`, `ingredients_text`, `allergens`, `nutriments_json`, `source_dataset`, `license`, `license_url`).

2. **Dual-Key Mapping Table (`source_record_id` / `barcode` <-> `id`)**:
   - Add/maintain indexes on `barcode` (`idx_products_barcode`) and `source_record_id`.
   - API endpoints must support querying by both internal ID (`f1`) and external barcode (`8901233000018`) or ASIN (`B07H9GMYXS`).

3. **New SKUs Allocation**:
   - Any additional products ingested beyond the historical 10,000 must use a collision-free ID format (e.g. `off_<barcode>` or `abo_<asin>`), strictly avoiding mutation of existing IDs.
