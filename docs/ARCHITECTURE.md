# FreshCart AI — System Architecture & Data Flow

This document details the architectural blueprint, component responsibilities, request lifecycle, and data flow of the **FreshCart AI** hyper-local quick-commerce platform.

---

## 1. High-Level Architectural Pattern

FreshCart AI implements a **dual-tier decoupled microservice architecture** with **zero-downtime in-process fallbacks**:

1. **Application & Gateway Tier (Node.js / Express):**
   - Serves the frontend Progressive Web App (PWA).
   - Manages stateful relational persistence via SQLite WASM (`sql.js`).
   - Enforces JWT authentication, role-based access control (RBAC), and ACID transaction guarantees.
   - Houses native JavaScript implementations of all 14 AI/ML/optimization algorithms.
2. **Specialized ML Inference Tier (Python / FastAPI):**
   - High-throughput accelerated microservice leveraging NumPy, SciPy, Scikit-Learn, and Statsmodels.
   - Pre-warms pre-trained models into memory on boot.
   - Communicates with the Node.js tier via a circuit-breaker HTTP REST bridge with sub-25ms latency.
3. **Persistence Tier (SQLite WASM):**
   - Embeds relational SQLite directly in the Node process using WebAssembly.
   - Periodically flushes changes to `db/freshcart.db`.
   - Guaranteed deterministic query execution without requiring an external database server.

```
                                ┌────────────────────────────────────────────────────────┐
                                │       Client Tier: Progressive Web App (PWA)           │
                                │   Storefront (index.html) • Admin Portal (admin.html)  │
                                └───────────────────────────┬────────────────────────────┘
                                                            │ HTTP / REST / JSON
                                                            ▼
                                ┌────────────────────────────────────────────────────────┐
                                │   Application Tier: Node.js Express Gateway (Port 3000)│
                                │  • JWT Authentication & RBAC • ACID Order Lifecycle    │
                                │  • 10,000-Product Catalog Engine • Dynamic Pagination  │
                                │  • 14 In-Process JavaScript ML Fallback Engines       │
                                └─────────────┬───────────────────────────┬──────────────┘
                                              │                           │
                     Circuit Breaker (1.5s)   │                           │ SQLite WASM Layer
                     Sub-25ms REST Gateway    │                           │
                                              ▼                           ▼
┌───────────────────────────────────────────────────────┐   ┌───────────────────────────┐
│     Inference Tier: Python FastAPI (Port 8000)        │   │    Persistence Tier       │
│  • In-Memory Singleton Model Registry                 │   │  • SQLite WASM (`sql.js`) │
│  • Serialized Artifacts (.joblib & .json)             │   │  • 10,000 Products Table  │
│  • NumPy, SciPy, Pandas, Scikit-Learn, Statsmodels    │   │  • 108 Unique Categories  │
│  • 2D TSP Solver • CVRP Clarke-Wright Dispatch        │   │  • 150,000 User Profiles  │
└───────────────────────────────────────────────────────┘   └───────────────────────────┘
```

---

## 2. End-to-End Request / Response Data Flow

### Scenario A: Customer Catalog & Search Request
```
[User Types "milk" in Search Bar]
   │
   ▼
[Browser Event Handler (app.js)]
   │ Debounces input (250ms)
   ▼
[HTTP GET /api/search/suggestions?q=milk]
   │
   ▼
[Express Gateway (server.js)]
   │ Routes to routes/search.js
   ▼
[NLP Tokenizer & Fuzzy Matcher (ml/smart-search.js)]
   │ 1. Normalizes accents & transliterates (doodh -> milk)
   │ 2. Queries SQLite index for category, title, tags
   │ 3. Computes TF-IDF substring relevance scores
   ▼
[SQLite WASM (db/database.js)]
   │ Executes parameterized statement against 'products' table
   ▼
[Response Formatted as JSON with Highlights]
   │ Returns: [{ id, name, price, category, matchHtml: "<mark>milk</mark>" }]
   ▼
[Client DOM Rendered (app.js)]
   │ Updates #smart-search-dropdown with thumbnail and keyboard navigation
```

### Scenario B: Order Placement & Fraud Scoring Lifecycle
```
[Customer Clicks "Pay & Place Order" in Checkout Modal]
   │
   ▼
[Client Form Submission (app.js)]
   │ Validates customer name, phone, address, rider instructions, payment method
   ▼
[HTTP POST /api/orders]
   │ Payload: { customerName, phone, address, items, tip, ecoBag, paymentMethod }
   ▼
[Express Gateway (server.js)]
   │ Routes to routes/orders.js
   ▼
[ACID Transaction Initiated (db/database.js)]
   │ 1. Checks inventory levels for all requested items
   │ 2. Calculates subtotal, taxes (GST 8%), delivery fee (₹0 if > ₹500), tips
   │ 3. Decrements product inventory in 'products' table
   ▼
[Fraud Risk Assessment Engine (ml/fraud-detection.js)]
   │ 1. Computes velocity heuristic (orders per user per hour)
   │ 2. Evaluates order amount Z-score vs user historical distribution
   │ 3. Scores transaction (Low / Medium / High Risk)
   ▼
[Order Stored in SQLite (db/database.js)]
   │ Inserts into 'orders' and 'order_items' tables with generated ORD-XXXX ID
   │ Commits transaction to db/freshcart.db
   ▼
[Response JSON with Order Confirmation]
   │ Returns: { success: true, orderId: "ORD-9421", status: "confirmed", eta: "10 Mins" }
   ▼
[Client Modal Updated (app.js)]
   │ Hides checkout drawer, displays #confirmation-overlay with live tracking link
```

### Scenario C: AI Recommendation Request with Zero-Downtime Fallback
```
[Storefront Requests Personalized Recommendations]
   │
   ▼
[HTTP GET /api/recommendations/personal?limit=6]
   │
   ▼
[AI Client Service Bridge (services/ai-client.js)]
   │
   ├──▶ [Attempt Primary: Python FastAPI Microservice (Port 8000)]
   │       If response received within 1500ms:
   │       Returns pre-warmed Scikit-Learn hybrid CF + TF-IDF model predictions
   │
   └──▶ [Fallback: Local Node.js Engine (ml/recommendation-engine.js)]
           Triggered if Python service is offline, timed out, or returns error
           Calculates cosine similarity matrix in-process using SQLite interaction logs
           Latency: < 5ms (Zero interruption to end user)
   │
   ▼
[Client Card Grid Rendered (app.js)]
```

---

## 3. Directory Structure & Responsibilities

| Directory Path | Architectural Responsibility |
|---|---|
| [`server.js`](../server.js) | Application entry point. Boots Express HTTP server, mounts middleware, registers API routes, serves static frontend files, and handles global uncaught errors. |
| [`routes/`](../routes) | Express REST route controllers. Validates request schemas, checks authentication/authorization, and coordinates business logic between database models and ML services. |
| [`services/`](../services) | Supporting infrastructure services. Contains [`ai-client.js`](../services/ai-client.js) (circuit-breaker HTTP client for Python microservice) and [`image-resolver.js`](../services/image-resolver.js) (resolves product thumbnails and SVG fallback assets). |
| [`middleware/`](../middleware) | Custom Express middleware. Contains [`auth.js`](../middleware/auth.js) for HMAC-SHA256 JWT verification and Role-Based Access Control (`requireAuth`, `requireAdmin`, `optionalAuth`). |
| [`db/`](../db) | Database persistence layer. [`database.js`](../db/database.js) manages the `sql.js` WASM engine, connection caching, and write-through persistence. [`schema.sql`](../db/schema.sql) declares the 7 relational tables. [`seed.js`](../db/seed.js) seeds initial records. |
| [`ml/`](../ml) | JavaScript AI/ML algorithms. Implements in-process demand forecasting, dynamic pricing, fraud risk scoring, hybrid recommendations, 2D TSP dark store picker walk, CVRP fleet dispatch, and RFM K-Means customer segmentation. |
| [`ml/python/`](../ml/python) | Python training pipelines, experimental notebooks, serialized model weights (`.joblib`, `.json`), and research plots. |
| [`ml/service/`](../ml/service) | FastAPI Python microservice running on port 8000. Serves pre-trained models via asynchronous HTTP endpoints with Pydantic validation. |
| [`public/`](../public) | Static web client. Contains [`index.html`](../public/index.html) (Storefront PWA), [`admin.html`](../public/admin.html) (Admin Dashboard), [`css/style.css`](../public/css/style.css) (Glassmorphism design system), and [`js/app.js`](../public/js/app.js) (client state and interactions). |
| [`data/`](../data) | Reference datasets. Contains [`categories.json`](../data/categories.json) (108 mapped categories), [`products.js`](../data/products.js), and synthetic benchmark CSV files. |
| [`scripts/`](../scripts) | Automation scripts. Contains synthetic data generators (`generate-all-data.js`, `generate-products.js`, `generate-users.js`), dev server runners (`dev-start.js`), and QA audit tools. |
| [`test/`](../test) | Multi-tier test harness. Contains master audit runners, synthetic DOM tests, security validation, concurrency benchmarks, and integration tests. |
| [`docs/`](../docs) | Architectural specifications, academic documentation (Black Book thesis, presentation decks), and verification reports. |

---

## 4. State Management & Frontend Architecture

The customer storefront is architected as an **interactive, dependency-free Single Page Application (SPA)** implemented in Vanilla JavaScript:

- **Centralized Reactive State:**
  ```javascript
  const state = {
    products: [],
    categories: [],
    departments: [],
    activeDepartment: 'all',
    activeCategory: null,
    cart: { items: [], total: 0 },
    user: null,
    searchQuery: '',
    page: 1,
    limit: 24,
    totalPages: 417,
    totalProducts: 10000,
    dietaryFilter: 'all',
    sortOption: 'rating-desc',
    activeTip: 20,
    isEcoBag: true,
    appliedCoupon: null
  };
  ```
- **Virtual Event Bus:** All user actions (pagination jump, category filter, tip select, search keystroke) update `state` and trigger focused DOM patch routines (`renderProducts()`, `renderPaginationControls()`, `renderCartPanel()`).
- **Tabular Numeric Consistency:** All price figures, currency amounts, and pagination counters utilize `font-variant-numeric: tabular-nums` to eliminate layout shift during rapid updates.
- **Micro-Animations & Viewport Clamping:** Modals implement bounded viewports (`max-height: min(88vh, 740px)`) with sticky headers and pinned primary action buttons.
