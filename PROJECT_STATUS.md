# Current Project Status

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Project Scope:** Final-Year Undergraduate Major Project (B.Tech CSE-AIML, Mumbai University, 4–5 Student Team)  
**Evaluation Target:** 8-Month Engineering Capstone & Academic Research Defense  
**Inspection Date:** August 26, 2026  
**Environment:** Local Development Only  

---

## 1. Existing Project Structure

The project currently resides in `c:\Users\shash\demo1` with a monolithic Node.js/Express backend, in-process mathematical and ML routines, a vanilla HTML/CSS/JS frontend SPA, and a WebAssembly-based SQLite database.

```
demo1/
├── .git/                               # Git repository metadata (LOCAL ONLY — do not touch)
├── .gitignore                          # Standard node_modules & db file exclusion
├── Dockerfile                          # Alpine Node.js 18 container configuration
├── package.json                        # Node package manifest, scripts, and dependencies
├── package-lock.json                   # Dependency lockfile
├── README.md                           # Project presentation, overview, and demo documentation
├── render.yaml                         # Render cloud service blueprint (do not alter)
├── deploy.ps1                          # Local/Render helper deployment script
├── server.js                           # Express.js application bootstrap and route registration
│
├── data/                               # Static catalog and seed data definitions
│   └── products.js                     # 31 predefined grocery product objects (INR prices, tags, categories)
│
├── db/                                 # Database persistence and data generation
│   ├── database.js                     # sql.js (SQLite WASM) wrapper with memory export persistence
│   ├── freshcart.db                    # Binary SQLite database file (~10 MB with synthetic history)
│   ├── schema.sql                      # 7 core relational tables and 8 query optimization indexes
│   ├── seed.js                         # Database reseed entrypoint (invokes synthetic data generator)
│   └── synthetic-data.js               # 12-month synthetic sales (~11,315 rows) and interactions (~50,000 logs)
│
├── docs/                               # Academic, architecture, and viva documentation
│   ├── IEEE_Project_Report.md          # Full IEEE-format major project research paper
│   ├── Presentation_Slide_Deck.md      # 15-slide defense deck with speaker notes
│   ├── Viva_Defense_Questions_Answers.md # Top 30 examiner questions with mathematical derivations
│   ├── assets/                         # Presentation graphics and feature mockups
│   ├── ci.yml                          # GitHub Actions CI workflow definition
│   ├── architecture/                   # [NEW] System architecture design documents
│   │   └── README.md
│   ├── ml/                             # [NEW] AI/ML models, derivations, and experiment reports
│   │   └── README.md
│   ├── optimization/                   # [NEW] Operations, ROP, VRP, and TSP optimization specs
│   │   └── README.md
│   ├── api/                            # [NEW] REST API endpoint matrices and contracts
│   │   └── README.md
│   └── testing/                        # [NEW] Multi-tier test suite specifications
│       └── README.md
│
├── middleware/                         # HTTP Request Middleware
│   └── auth.js                         # JWT token verification, RBAC (requireAdmin), and optionalAuth
│
├── ml/                                 # 13 Machine Learning, NLP, Heuristic & Optimization Engines
│   ├── customer-segmentation.js        # RFM extraction, Min-Max normalization, K-Means (K=4), WCSS Elbow
│   ├── dark-store-picker.js            # 2D warehouse rack coordinates, Euclidean distance matrix, 2-Opt TSP
│   ├── demand-forecasting.js           # OLS Linear Regression trend, 7/14/30-day SMA, Seasonality, RMSE/MAE
│   ├── dynamic-pricing.js              # Price Elasticity of Demand (Ed), category coefficients, optimal price P*
│   ├── flash-sale-ai.js                # Expiry decay pricing markdown and food waste prevention estimator
│   ├── fraud-detection.js              # Z-Score spend anomaly (Z > 3σ), 10-min velocity bursts, hoarding check
│   ├── fridge-vision-ai.js             # Multimodal scene presets, depletion analyzer, replenish bundles
│   ├── nutrition-advisor.js            # Macronutrient breakdown, French FSA Nutri-Score (A–E), allergen swaps
│   ├── recipe-assistant.js             # Recipe NLP keyword parser, in-stock ingredient cart bundle solver
│   ├── recommendation-engine.js        # Cosine similarity, User-User Collaborative, Hybrid, Apriori rules
│   ├── route-optimizer.js              # Haversine distance matrix, Nearest Neighbor, 2-Opt VRP dispatcher
│   ├── smart-search.js                 # TF-IDF vector space scoring, Levenshtein typo tolerance, Hindi synonyms
│   └── visual-search.js                # Color/texture signature matching simulator
│
├── public/                             # Frontend static client assets (Single-Page Application)
│   ├── admin.html                      # Executive & AI Operations Dashboard (Chart.js visualizations)
│   ├── index.html                      # Customer Storefront, Modals (Cart, FreshBot, Nutri-AI, Wallet, PWA)
│   ├── manifest.json                   # PWA web app manifest
│   ├── sw.js                           # PWA service worker for offline asset caching
│   ├── css/
│   │   ├── admin.css                   # Admin sidebar, glassmorphic cards, KPI grid styling
│   │   └── style.css                   # Customer theme, CSS variables, glassmorphism, responsive grid
│   ├── icons/                          # PWA application icons (icon-192.svg, icon-512.svg)
│   └── js/
│       ├── admin.js                    # Admin dashboard logic, Chart.js time-series/doughnut renderers
│       └── app.js                      # Monolithic customer SPA controller (~80 KB, state, cart, modals)
│
├── routes/                             # Express REST API Route Handlers (16 Route Controllers)
│   ├── admin.js                        # Admin stats, product stock/price updates, order feed
│   ├── analytics.js                    # Demand forecasts, RFM segments, stockout alerts, ML metrics
│   ├── assistant.js                    # FreshBot conversational recipe query endpoint
│   ├── auth.js                         # User registration, login, profile (/me)
│   ├── cart.js                         # Authenticated & guest cart CRUD, INR delivery fee logic
│   ├── dispatch.js                     # Urban delivery VRP optimization dispatch trigger
│   ├── group-orders.js                 # Community group buying lobbies and tier discounts
│   ├── nutrition.js                    # Cart nutrition analysis and allergen warnings
│   ├── orders.js                       # ACID checkout, inventory stock decrement, order tracking, fraud check
│   ├── pricing.js                      # Elasticity profile retrieval and price simulation
│   ├── products.js                     # Product catalog, category filter, sorting
│   ├── recommendations.js              # Hybrid recs, similar items, frequently bought together
│   ├── search.js                       # NLP smart search with Hindi translations
│   ├── supplier.js                     # Automated ROP safety stock report and warehouse picker TSP
│   ├── visual.js                       # Visual search and fridge scanning endpoints
│   └── wallet.js                       # FreshWallet balance, top-up, cashback, and split payments
│
├── scratch/                            # Local utility scripts
│   └── share_linkedin.ps1              # Project showcase helper script
│
└── test/                               # Comprehensive Automated Test Suites (85 Total Assertions)
    ├── alpha-beta-backend.js           # API lifecycle contracts and concurrent load stress tests
    ├── deep-verify.js                  # 10-Agent ML and math engine verification suite
    ├── enterprise-features-test.js     # Nutrition, warehouse TSP, wallet, group buy, supplier ROP tests
    ├── master-audit.js                 # Single-command master health and syntax auditor
    ├── pwa-vision-payment-test.js      # PWA manifest, fridge vision presets, UPI dynamic QR tests
    ├── security-safety-test.js         # OWASP, JWT, bcrypt, SQLi immunity, and RBAC security suite
    └── synthetic-frontend-test.js      # DOM integrity, client state, and bilingual dictionary tests
```

---

## 2. Current Technology Stack

| Layer | Component | Version / Technology | Purpose |
|---|---|---|---|
| **Runtime Environment** | Node.js | v18+ | JavaScript runtime for server and in-process math engines |
| **Backend Framework** | Express.js | `^4.18.2` | RESTful API server, routing, static asset serving |
| **Database Engine** | SQLite via `sql.js` | `^1.12.0` (WebAssembly) | In-memory relational database with file-backed binary export (`freshcart.db`) |
| **Authentication & Security** | `jsonwebtoken` / `bcryptjs` | `^9.0.2` / `^2.4.3` | Signed JWT Bearer tokens and bcrypt password hashing (10 salt rounds) |
| **Identifiers** | `uuid` | `^9.0.0` | Order and transaction UUID generation |
| **Frontend Architecture** | Vanilla HTML5 / Vanilla CSS3 / Vanilla JS | ES6+ Standard | High-performance Single-Page Application (zero framework overhead) |
| **Data Visualization** | Chart.js | v4.x (CDN) | Real-time interactive charts (Demand trends, Doughnut revenue, Elbow curve) |
| **Progressive Web App** | Service Worker & Manifest | PWA Manifest v3 | Installable desktop/mobile experience with offline shell caching |
| **Typography & Styling** | Google Fonts / Vanilla CSS | Outfit & Plus Jakarta Sans | Custom dark/light glassmorphic UI design system with CSS custom properties |
| **Test Framework** | Node.js built-in `assert` & `http` | Node core modules | Multi-tier automated unit, integration, security, and synthetic tests |

---

## 3. Existing Features

### Customer-Facing Storefront
1. **Catalog Browsing & Categorization:** 31 grocery products spanning 6 categories (*Fruits, Vegetables, Dairy, Bakery, Beverages, Snacks*).
2. **Smart NLP Search:** Multi-token search with TF-IDF relevance scoring, Levenshtein edit distance typo correction, and Hindi grocery synonym translation (*e.g., "seb" $\to$ Apple, "dahi" $\to$ Curd*).
3. **Cart & Delivery Logic:** Live cart drawer with INR delivery rules (Free delivery above ₹500, ₹49 fee below ₹500) and 8% GST calculation.
4. **User Authentication & Session Management:** Registration, login, JWT storage in `localStorage`, and guest cart merge capability.
5. **ACID Transactional Checkout:** Atomically creates orders, decrements product stock, logs interaction vectors, and clears user/guest cart.
6. **Order History & Real-Time Tracker:** View placed orders with status progression (*Confirmed $\to$ Packing $\to$ Out for Delivery $\to$ Delivered*).
7. **Conversational AI Assistant (FreshBot):** Chatbot widget that parses natural-language recipe requests (*"Mango Lassi"*, *"High-Protein Breakfast"*) into in-stock ingredient bundles with a 1-click "Add Bundle to Cart" action.
8. **Personalized Hybrid Recommendations:** Dynamic blending of Collaborative Filtering, Content Cosine Similarity, and Popularity rankings on the homepage.
9. **Frequently Bought Together:** Item-level Apriori association rules showing complementary items with confidence percentages.
10. **Nutri-Score & Allergen Advisor:** Calculates basket macronutrients (Calories, Protein, Carbs, Fats, Fiber), assigns French FSA Nutri-Score (A–E), detects user allergen conflicts (lactose/gluten), and suggests healthy swaps.
11. **FreshWallet & Split Payments:** In-app wallet with ₹150 welcome bonus, top-up capability, 5% cashback on orders, and split payments (Wallet + UPI/Cards).
12. **Neighborhood Group Buying Lobbies:** Community group pooling allowing neighbors to aggregate orders and unlock progressive discount tiers (5%, 8%, 10%, 15%).
13. **Snap Your Fridge & Pantry AI Scanner:** Multimodal camera/photo depletion analyzer mapping missing staples to instant replenishment carts.
14. **Gamified Lucky Spin:** Interactive wheel allowing users to win promotional discount codes.
15. **Daily Milk & Pantry Subscriptions:** Recurring daily/weekly subscription planner for perishable essentials.
16. **Bilingual Support & Dark/Light Mode:** Instant English $\leftrightarrow$ Hindi toggle and theme switcher.

### Admin & Operations Management
1. **Executive KPI Dashboard:** Real-time metrics for total revenue, total orders, average order value (AOV), registered customers, and low-stock count.
2. **AI Demand Forecasting Dashboard:** 7-day future demand curves per product/category using OLS regression, moving averages, and seasonality with confidence bounds.
3. **Dynamic Pricing Simulator:** Interactive tool to adjust product prices and simulate demand shifts based on category Price Elasticity ($E_d$), displaying revenue impact and optimal price $P^*$.
4. **VRP Delivery Dispatch Optimizer:** 2-Opt local search solver that plots optimized multi-stop delivery routes and calculates fuel/distance savings.
5. **Customer Segmentation Analytics:** 3D RFM distribution and K-Means ($K=4$) persona clusters (*VIP Champions, Loyal Shoppers, Promising Prospects, At-Risk Customers*) with WCSS Elbow curve.
6. **Automated Inventory Stockout Alerts:** Categorized stock warnings (*Critical, Low Stock, Overstock*) with actionable replenishment advice.
7. **Supplier Reorder Point (ROP) & PO Generator:** Computes safety stock ($SS = Z \cdot \sigma_d \sqrt{L}$) and reorder points ($ROP = \bar{d} L + SS$), estimating wholesale procurement budgets.
8. **Dark Store Warehouse Picker (2D TSP):** Generates optimal 2D aisle-rack picking paths to minimize order assembly time.
9. **Products CRUD:** Live stock updates and price adjustments directly reflecting in the customer catalog.
10. **Live Orders & Fraud Feed:** Real-time order stream displaying fraud risk levels (Low, Medium, High) based on spend anomalies and velocity bursts.

---

## 4. Existing Backend

The backend is built with Express.js (`server.js`) following a modular router architecture.

### Middleware
- `middleware/auth.js`:
  - `generateToken(user)`: Signs JWT containing user ID, email, name, and role with a 7-day expiration.
  - `requireAuth`: Enforces valid Bearer JWT presence in the `Authorization` header.
  - `requireAdmin`: Checks `req.user.role === 'admin'`, returning 403 Forbidden for unauthorized requests.
  - `optionalAuth`: Gracefully decodes JWT if provided, allowing seamless guest-to-authenticated experiences.

### Database Access Pattern
- `db/database.js` wraps `sql.js` providing:
  - `prepare(sql).all(...params)`: Returns rows as plain JavaScript objects.
  - `prepare(sql).get(...params)`: Returns a single row object.
  - `prepare(sql).run(...params)`: Executes mutations and returns `{ lastInsertRowid, changes }`.
  - `transaction(fn)`: Wraps operations in `BEGIN TRANSACTION` ... `COMMIT` / `ROLLBACK`.
  - `saveDb()`: Exports the in-memory SQLite database into `db/freshcart.db`.

---

## 5. Existing Frontend

The frontend is an ultra-fast, zero-dependency Single-Page Application (SPA):
- `public/index.html`: Contains full DOM markup for store layout, navigation bar, hero banner, category pills, product grid, cart drawer, auth modal, FreshBot floating widget, and feature modals (Nutrition, Wallet, Group Buy, Lucky Spin, Subscriptions, Fridge Scanner).
- `public/admin.html`: Operations portal containing sidebar navigation, executive KPI summary cards, tabbed views for Demand Forecasting, Pricing Simulator, VRP Dispatch, RFM Segmentation, Stock Alerts, ML Model Evaluation, Products CRUD, and Orders Feed.
- `public/css/style.css` & `public/css/admin.css`: Comprehensive CSS design system utilizing CSS custom variables (`--bg-dark`, `--green-500`, `--glass-bg`), backdrop blur filters, responsive CSS Grid, and custom animations.
- `public/js/app.js` (~80 KB): Client state manager maintaining cart, auth token, active category, language dictionary, modal controllers, and API fetch calls.
- `public/js/admin.js` (~27 KB): Admin controller managing Chart.js instances, tab switching, pricing simulation recalculation, and stock editing.
- `public/sw.js` & `public/manifest.json`: Progressive Web App (PWA) configuration enabling installability and offline static caching.

---

## 6. Existing Database

### Database Engine
- `sql.js` (SQLite compiled to WebAssembly) reading from and writing to binary database file `db/freshcart.db` (~10 MB).

### Schema (7 Relational Tables)
1. `users` (`id` INTEGER PK, `name` TEXT, `email` TEXT UNIQUE, `password_hash` TEXT, `role` TEXT, `created_at` TEXT)
2. `products` (`id` TEXT PK, `name` TEXT, `emoji` TEXT, `category` TEXT, `price` REAL, `unit` TEXT, `description` TEXT, `stock` INTEGER, `rating` REAL, `tags` TEXT JSON)
3. `orders` (`id` TEXT PK, `user_id` INTEGER FK, `subtotal` REAL, `delivery_fee` REAL, `tax` REAL, `total` REAL, `status` TEXT, `customer_name` TEXT, `address` TEXT, `phone` TEXT, `payment_method` TEXT, `created_at` TEXT)
4. `order_items` (`id` INTEGER PK, `order_id` TEXT FK, `product_id` TEXT FK, `quantity` INTEGER, `price_at_purchase` REAL)
5. `cart_items` (`id` INTEGER PK, `user_id` INTEGER FK, `product_id` TEXT FK, `quantity` INTEGER, UNIQUE(user_id, product_id))
6. `user_interactions` (`id` INTEGER PK, `user_id` INTEGER FK, `product_id` TEXT FK, `action` TEXT, `rating` REAL, `created_at` TEXT)
7. `sales_history` (`id` INTEGER PK, `product_id` TEXT FK, `date` TEXT, `quantity_sold` INTEGER, `revenue` REAL)

### Indexes
- 8 database indexes created on `user_interactions(user_id, product_id, action)`, `sales_history(product_id, date)`, `orders(user_id, created_at)`, and `order_items(order_id, product_id)`.

### Seed & Synthetic Data
- `db/seed.js` and `db/synthetic-data.js` generate:
  - 31 realistic grocery products with INR prices.
  - 1 admin account (`admin@freshcart.com` / `admin123`) and 51 customer personas.
  - 12 months of daily sales records (~11,315 historical entries).
  - Over 50,000 user interaction logs (views, cart additions, purchases, ratings) tailored to customer persona preferences.

---

## 7. Existing AI/ML

The codebase contains 13 JavaScript mathematical and AI modules implemented directly in the Node.js runtime:

| Module | Core Algorithm / Math | Input Data | Output / Functionality | Academic Evaluation |
|---|---|---|---|---|
| **1. Recommendation Engine** (`ml/recommendation-engine.js`) | Cosine Similarity $\frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|\|\mathbf{v}\|}$, User-User Collaborative Filtering, Apriori Association Rules | User interactions matrix (views, carts, purchases), product tag vectors | Ranked personalized recommendations, item similarity, "Frequently Bought Together" with Support, Confidence, Lift | Precision@5: 78.4%, Recall@5: 65.2%, F1@5: 71.2% (20% holdout split) |
| **2. Demand Forecasting** (`ml/demand-forecasting.js`) | Ordinary Least Squares (OLS) Linear Regression $y = mx + c$, 7/14/30-day Moving Averages, Day-of-Week Seasonality | 12-month `sales_history` chronological series | 7-day to 30-day predicted unit quantities, revenue forecast, confidence intervals, stockout/overstock risk levels | RMSE: 2.01, MAE: 1.57, MAPE: 14.2% (30-day holdout test split) |
| **3. Dynamic Pricing** (`ml/dynamic-pricing.js`) | Microeconomic Price Elasticity of Demand $E_d = \frac{\% \Delta Q}{\% \Delta P}$, Revenue Optimization $P^* = \frac{P_0(E_d - 1)}{2 E_d}$ | Category elasticity constants, 7-day baseline demand, proposed price | Simulated demand shifts, net revenue differential, optimal price recommendation with bounded limits | Microeconomic revenue gain simulations (+4% to +18%) |
| **4. Fraud Detection** (`ml/fraud-detection.js`) | Statistical Z-Score $Z = \frac{X - \mu}{\sigma}$, Rolling 10-minute velocity burst window, item hoarding heuristics | Incoming order details, past user order totals, recent timestamp logs | Composite risk score (0–100), risk tier (Low, Medium, High), actionable audit flags | $Z > 3.0\sigma$ extreme outlier detection, velocity threshold alarms |
| **5. Customer Segmentation** (`ml/customer-segmentation.js`) | Recency-Frequency-Monetary (RFM) extraction, Min-Max Normalization, K-Means Clustering ($K=4$), WCSS Elbow Method | `orders` and `users` history | 4 customer persona clusters (Champions, Loyalists, Potential, At-Risk), targeted marketing strategies | WCSS: 2.24 at $K=4$, validated monotonic Elbow Curve |
| **6. Urban Delivery VRP** (`ml/route-optimizer.js`) | Haversine Great-Circle distance matrix, Nearest Neighbor heuristic, 2-Opt local search iterative edge swapping | Warehouse GPS hub, batch customer destination GPS coordinates | Optimal delivery sequence, total transit distance, turn-by-turn itinerary | 18.6% distance and fuel reduction vs unoptimized sequence |
| **7. Dark Store Warehouse Picker** (`ml/dark-store-picker.js`) | 2D Euclidean Distance Matrix, 2-Opt Traveling Salesperson Problem (TSP) | 2D $(x, y)$ aisle/rack coordinates for order product items | Shortest walk path starting/ending at packing station | Sub-90 second order pick assembly path |
| **8. Expiry Markdown AI** (`ml/flash-sale-ai.js`) | Dynamic exponential decay pricing based on remaining shelf life | Product expiry dates, base prices | Dynamic flash clearance discount percentage, estimated grams of food waste prevented | Prevents perishable write-offs |
| **9. Nutri-Score & Allergen AI** (`ml/nutrition-advisor.js`) | Macronutrient summation, French FSA Nutri-Score scoring algorithm | Cart item nutritional profiles (Calories, Protein, Carbs, Fat, Fiber) | Basket Nutri-Score grade (A–E), allergen warnings (lactose/gluten), healthy food substitutions | Clinical nutrition FSA standard compliance |
| **10. Recipe-to-Cart FreshBot** (`ml/recipe-assistant.js`) | NLP rule-based token matching, ingredient synonym parsing | Natural language user recipe prompts | Recipe ingredient breakdown, pantry stock availability check, bundled discount cart insertion | High-intent cart conversion |
| **11. Smart Semantic Search** (`ml/smart-search.js`) | TF-IDF vector space relevance scoring, Levenshtein edit distance typo correction, Hindi-English dictionary | User search query strings, product catalog metadata | Ranked product results with match confidence scores | Handles spelling mistakes and bilingual queries |
| **12. Fridge Depletion Vision AI** (`ml/fridge-vision-ai.js`) | Heuristic scene analyzer, grocery depletion preset mapping | Image metadata / preset category triggers | Missing essential items detection, automatic replenishment basket generation | Streamlined reorder workflow |
| **13. Visual Similarity Search** (`ml/visual-search.js`) | Simulated color histogram and visual texture signature matching | Image input hints | Closest visually matching catalog products | Multimodal search support |

---

## 8. Existing APIs

16 REST API controllers mounted on Express:

| Base Route | Handler File | Key Endpoints | Auth Scope | Description |
|---|---|---|---|---|
| `/api/auth` | `routes/auth.js` | `POST /register`, `POST /login`, `GET /me` | Public / `requireAuth` | JWT authentication and profile retrieval |
| `/api/products` | `routes/products.js` | `GET /`, `GET /:id`, `GET /categories` | Public | Catalog listing, category filtering, price/rating sorting |
| `/api/search` | `routes/search.js` | `GET /?q=...` | Public | NLP smart search with typo tolerance and Hindi translations |
| `/api/cart` | `routes/cart.js` | `GET /`, `POST /add`, `PUT /update`, `DELETE /remove` | `optionalAuth` | Session/User cart management, INR delivery rules |
| `/api/orders` | `routes/orders.js` | `POST /`, `GET /`, `GET /:id`, `GET /track/:id` | `optionalAuth` | ACID order creation, stock updates, tracking, fraud check |
| `/api/recommendations` | `routes/recommendations.js` | `GET /personal`, `GET /similar/:id`, `GET /frequently-bought-together/:id` | `optionalAuth` | Hybrid recommendations, similar items, Apriori bundles |
| `/api/analytics` | `routes/analytics.js` | `GET /demand-forecast/:id`, `GET /segments`, `GET /stock-alerts`, `GET /ml-metrics` | `optionalAuth` | Time-series forecast, RFM segmentation, ML metrics |
| `/api/pricing` | `routes/pricing.js` | `GET /elasticity/:id`, `GET /simulate/:id`, `GET /all` | Public | Price elasticity coefficients, $P^*$ simulations |
| `/api/dispatch` | `routes/dispatch.js` | `POST /optimize-route` | Public | Urban delivery vehicle route optimization (VRP) |
| `/api/admin` | `routes/admin.js` | `GET /dashboard`, `GET /products`, `PUT /products/:id`, `GET /orders` | `requireAdmin` | Executive KPIs, stock/price adjustments, order feed |
| `/api/nutrition` | `routes/nutrition.js` | `POST /analyze-cart`, `GET /product/:id` | Public | Nutri-Score calculation, macro breakdown, allergen checks |
| `/api/wallet` | `routes/wallet.js` | `GET /balance`, `POST /topup`, `POST /pay-split` | `optionalAuth` | FreshWallet balance, top-up, cashback, split payments |
| `/api/group-orders` | `routes/group-orders.js` | `POST /create`, `GET /lobbies`, `POST /:id/join` | Public | Community group buying lobbies and tier discounts |
| `/api/supplier` | `routes/supplier.js` | `GET /reorder-alerts`, `POST /warehouse-picker-route` | `requireAdmin` | Automated ROP safety stock report, warehouse TSP |
| `/api/visual` | `routes/visual.js` | `POST /search-by-image`, `POST /fridge-scan` | Public | Fridge depletion scanning and visual similarity |
| `/api/assistant` | `routes/assistant.js` | `POST /chat` | Public | FreshBot recipe-to-cart conversational interface |

---

## 9. Existing Tests

7 comprehensive test suites located in `test/` totaling **89 assertions across all application tiers (100% passing)**:

1. **10-Agent ML Multi-Tier Verification Suite (`test/deep-verify.js`):**
   - 24 assertions covering database schema, catalog integrity, JWT security, cart delivery rules, ACID order placement, and all 12 mathematical/ML engines.
   - Command: `npm test` $\to$ **24 / 24 PASS (100%)**.

2. **Enterprise Security & OWASP Audit (`test/security-safety-test.js`):**
   - 16 assertions covering unauthenticated rejection, forged JWT signature detection, RBAC non-admin blocking, bcrypt 10-round salt verification, SQL injection immunity on 3 attack vectors, XSS sanitation, adversarial prompt resilience, and fraud risk score bounding.
   - Command: `npm run test:security` $\to$ **16 / 16 PASS (100%)**.

3. **Backend Alpha & Beta Integration Suite (`test/alpha-beta-backend.js`):**
   - 14 assertions testing live HTTP endpoint contracts across all 11 routes and multi-user concurrency stress with ACID audit.
   - Uses `test/test-helper.js` ephemeral server harness (no manual server required).
   - Command: `npm run test:alpha-beta` $\to$ **14 / 14 PASS (100%)**.

4. **Synthetic Frontend Unit & DOM Suite (`test/synthetic-frontend-test.js`):**
   - 10 assertions verifying DOM element IDs, navigation controls, client state calculations, bilingual Hindi translation completeness, and invoice generation.
   - Command: `npm run test:frontend` $\to$ **10 / 10 PASS (100%)**.

5. **Enterprise Mega-Features Suite (`test/enterprise-features-test.js`):**
   - 14 assertions testing Nutrition AI macros, Allergen safety, Expiry markdown, Warehouse 2D TSP, FreshWallet split payment, Group Buying lobbies, and Supplier ROP calculations.
   - Uses `test/test-helper.js` ephemeral server harness with async assertion awaiting.
   - Command: `npm run test:enterprise` $\to$ **14 / 14 PASS (100%)**.

6. **PWA, Vision AI & Payment Gateway Suite (`test/pwa-vision-payment-test.js`):**
   - 11 assertions testing PWA manifest compliance, Fridge Vision scene presets, depletion calculations, and UPI dynamic QR matrix generation.
   - Command: `npm run test:pwa-vision` $\to$ **11 / 11 PASS (100%)**.

7. **Master System & Codebase Auditor (`test/master-audit.js`):**
   - Syntax validation (`node -c`) across 44 JS files, static asset integrity checks, and composite execution of all 6 test suites.
   - Command: `npm run audit` or `npm run check` $\to$ **54 / 54 CHECKS PASS (100%)**.

---

## 10. Existing Configuration

- `package.json`: Configured with npm scripts (`start`, `dev`, `seed`, `test`, `test:security`, `test:alpha-beta`, `test:frontend`, `test:enterprise`, `test:pwa-vision`, `test:all`, `audit`, `check`).
- `Dockerfile`: Multi-stage build using `node:18-alpine` exposing port 3000.
- `render.yaml`: Standard Node web service configuration for Render.
- `.gitignore`: Standard exclusion for `node_modules`, `.env`, `freshcart.db`, and OS files.
- `deploy.ps1`: PowerShell helper script for local verification and automated deployment preparation.

---

## 11. What Is Working

1. **Full-Stack E-Commerce Flow:** Browsing, searching, filtering, adding to cart, user registration/login, placing orders, and decrementing stock operate without runtime errors.
2. **In-Process Mathematical & AI Engines:** Hybrid recommendations, OLS regression forecasting, customer RFM clustering, price elasticity simulations, fraud scoring, and 2-Opt routing algorithms execute deterministically with high performance in Node.js.
3. **Admin Operations Dashboard:** Interactive Chart.js charts, KPI metric cards, pricing elasticity sandbox, and inventory alerts update dynamically based on database state.
4. **Security & Authentication:** Password hashing via bcrypt, signed JWT authentication, and RBAC endpoint protection are fully enforced.
5. **100% Automated Multi-Tier Testing:** All 6 test suites and the master audit pass out-of-the-box (`npm test`, `npm run test:all`, `npm run audit`) with **89/89 assertions passing** and zero database pollution.
6. **Ephemeral Test Server Harness:** In-process Express server (`test/test-helper.js`) provides zero-port-conflict execution and in-memory DB isolation.
8. **Operations Research & Mathematical Optimization Pipeline:**
   - Complete optimization suite under `ml/python/optimization/` and `ml/python/experiments/`.
   - Continuous Review $(r, Q)$ Inventory Optimization with EOQ and Stochastic Safety Stock ROP (-87.64% total cost reduction, 99.88% service level across 31 SKUs).
   - Dark Store Warehouse Picking 2D TSP with 2-Opt local search (-37.48% walk distance reduction across 100 benchmark orders, 0.09% optimality gap vs exact solver).
   - Last-Mile Delivery Capacitated Vehicle Routing Problem (CVRP) with Clarke-Wright Savings and 2-Opt (-61.62% fleet distance reduction, 82.9% vehicle utilization across 50 urban dispatch batches).
   - Full evaluation report in `ml/python/reports/OPTIMIZATION_EXPERIMENT_REPORT.md` and methodology in `ml/python/reports/OPTIMIZATION_METHODOLOGY.md`.

---

## 12. What Is Incomplete / Academic Gaps

To satisfy the standards of a major final-year B.Tech CSE-AIML engineering project under Mumbai University, the following gaps will be addressed in the next phases:

1. **Application & Dashboard Integration (Phase 5):**
   - Ensure that offline ML insights, model weights, and optimization outputs are cleanly surfaced and synchronized with the Customer Storefront and Admin Operations dashboards.
   - Refactor client scripts (`public/js/app.js`, `public/js/admin.js`) into modular components while preserving zero-dependency speed and responsive aesthetics.
2. **Academic Project Report & Defense Package (Phase 6):**
   - IEEE format report, examiner slide deck, and Viva defense notes.

---

## 13. Problems / Technical Debt

1. **`sql.js` In-Memory Buffer Synchronization:**
   - `sql.js` exports the entire database binary buffer to disk on write (`saveDb()`). For large transaction volumes or concurrent writes, this can become an I/O bottleneck compared to native SQLite WAL mode (`better-sqlite3`).
2. **Cross-Price Elasticity Matrices:**
   - The current elasticity model estimates self-price elasticity ($\frac{\partial \ln Q_i}{\partial \ln P_i}$). Future work can incorporate cross-price elasticity matrices ($\frac{\partial \ln Q_i}{\partial \ln P_j}$) for substitute goods.

---

## 14. Recommended Architecture

To maintain a clean separation of concerns, the system adopts a **Layered Clean Architecture** combining a high-performance Node.js application server with a dedicated Python ML/Data Science research pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                                 │
│   Customer Storefront SPA (HTML5/CSS3/JS)   │   Admin AI Dashboard (Chart.js)│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST APIs / JSON (JWT / RBAC)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                       APPLICATION & BUSINESS LOGIC LAYER                    │
│   Catalog & Cart Management  │  ACID Order Processing  │  Fintech FreshWallet│
│   Group Buying Lobbies       │  Pantry Subscriptions   │  Bilingual Engine   │
└──────────────────┬──────────────────────────────────────────┬───────────────┘
                   │                                          │
┌──────────────────▼───────────────────┐   ┌──────────────────▼───────────────┐
│       AI / ML INFERENCE SERVICES     │   │      OPERATIONS & OPTIMIZATION   │
│ • Hybrid Recommender (Collab+Content)│   │ • Inventory Reorder Point (ROP)  │
│ • Time-Series Demand Forecaster      │   │ • Warehouse Picker 2D TSP        │
│ • Dynamic Price Elasticity Simulator │   │ • Urban Vehicle Routing (VRP)    │
│ • Z-Score & Classifier Fraud Scorer  │   │ • Expiry Markdown Optimizer      │
└──────────────────┬───────────────────┘   └──────────────────┬───────────────┘
                   │                                          │
┌──────────────────▼──────────────────────────────────────────▼───────────────┐
│                            DATA PERSISTENCE LAYER                           │
│   Relational Schema (Users, Products, Orders, Items, Interactions, Sales)   │
│   SQLite Database (`freshcart.db`) with Optimized Multi-Column Indexes      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ ETL / Feature Extraction
┌──────────────────────────────────────▼──────────────────────────────────────┐
│               OFFLINE PYTHON DATA SCIENCE & RESEARCH PIPELINE               │
│   Raw Public & Synthetic Datasets ──► Preprocessing & Feature Engineering    │
│   ──► Model Training & Validation ──► Metric Evaluation (RMSE, F1, ROC-AUC) │
│   ──► Operations Optimization (EOQ, TSP 2-Opt, CVRP Clarke-Wright)          │
│   ──► Model Artifacts / Weights Export ──► Academic Benchmark Reports       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 15. Recommended Development Roadmap

### Phase 1: Test Suite Hardening & In-Process Test Harness (COMPLETED)
- Ephemeral in-process test server harness implemented (`test/test-helper.js`).
- 89/89 automated test assertions passing across all 6 suites.

### Phase 2: Data Engineering & Dataset Integration (COMPLETED)
- Structured `data/` pipeline created (`data/raw/`, `data/processed/`, `data/synthetic/`, `data/external/`).
- Documented in `data/README.md` with schema, holdout splits, and benchmark alignment.

### Phase 3: Python ML Offline Training & Benchmarking Suite (COMPLETED)
- Reproducible offline Python ML experimentation framework under `ml/python/`.
- Trained, benchmarked, and evaluated candidate models for all 4 core AI modules.
- Generated plots in `ml/python/plots/`, serialized artifacts in `ml/python/models/`, and academic report `ml/python/reports/ML_EXPERIMENT_REPORT.md`.

### Phase 4: Operations Optimization Engineering & Benchmarking (COMPLETED)
- Formalized and evaluated all 3 operations optimization engines:
  - **Inventory Optimization:** Multi-item Continuous Review $(r, Q)$ with EOQ and Stochastic Safety Stock ROP.
  - **Dark Store Warehouse Picking:** 2D TSP with Nearest-Neighbor and 2-Opt local search improvement (benchmarked against exact solver).
  - **Last-Mile Delivery Routing:** Capacitated Vehicle Routing Problem (CVRP) with Clarke-Wright Savings and 2-Opt.
- Generated reports `ml/python/reports/OPTIMIZATION_EXPERIMENT_REPORT.md` and `ml/python/reports/OPTIMIZATION_METHODOLOGY.md`.

### Phase 5: Application & Dashboard Integration (COMPLETED)
- Python FastAPI microservice implemented (`ml/service/app.py`) exposing all 7 AI/ML and Optimization subsystems.
- Node.js AI Gateway client (`services/ai-client.js`) with 1.5s circuit timeout and automated graceful fallback to in-process Node engines.
- Express routes updated to consume Python AI with full backward compatibility.
- End-to-end integration test suite (`test/ai-service-integration-test.js`) created with 28/28 assertions passing.
- 113 total automated test assertions across 7 suites and 56/56 master audit checks passing.
- Comprehensive documentation in `docs/integration/`.

### Phase 5.5: Final System Quality Assurance & Hardening (COMPLETED)
- Full end-to-end functional audit across Customer and Admin user flows.
- Pre-checkout inventory stock verification added to `routes/orders.js`.
- Express JSON body size limits (2MB) and global error handling middleware implemented in `server.js` (no raw stack trace leakage).
- Live empirical latency benchmark completed across all Node and Python endpoints (`test/benchmark.js` -> `docs/testing/PERFORMANCE_REPORT.md`).
- Master audit and full regression verification passing with 100% success rate (56/56 master audit checks, 113/113 assertions).
- Comprehensive audit report generated in `docs/testing/FINAL_SYSTEM_QA_REPORT.md`.

### Phase 5.8: Academic Content Mapping & Submission Blueprint (COMPLETED)
- Created 10 comprehensive academic planning and mapping blueprints under `docs/academic/`.
- Mapped Major Project Black Book chapters matching Mumbai University & APSIT requirements (`BLACK_BOOK_MAP.md`).
- Formatted Review-1 Presentation slide-by-slide blueprint in concise bullet form (`REVIEW_1_PPT_MAP.md`).
- Mapped Semester-7 project requirements (`SEMESTER_7_MAP.md`).
- Cataloged 22 original UML, architectural, and process diagrams (`DIAGRAM_INVENTORY.md`).
- Formulated and mapped mathematical equations for all 7 subsystems (`ALGORITHM_INVENTORY.md`).
- Cross-verified all empirical results, metrics, and ablation tables (`RESULTS_INVENTORY.md`).
- Structured 15-paper literature survey matrix across 11 retail domains (`LITERATURE_RESEARCH_PLAN.md`).
- Documented strict placeholders for team and institutional details (`TEAM_INFORMATION_REQUIRED.md`).
- Mapped 8-month development timeline, WBS, and Gantt chart (`PROJECT_PLANNING_MAP.md`).

### Phase 6: Final Literature Lock & Major Project Black Book Generation (COMPLETED)
- Verified and locked 15 peer-reviewed IEEE Xplore indexed research papers published exclusively between 2023 and 2026 (`docs/academic/FINAL_IEEE_REFERENCE_LOCK.md`).
- Generated the complete official APSIT / University of Mumbai Major Project Black Book manuscript (`docs/academic/FINAL_BLACK_BOOK.md`).
- Authored the structured Black Book content index and source registry (`docs/academic/FINAL_BLACK_BOOK_CONTENT.md`).
- Created companion academic deliverables:
  - Master Figure List with 21 system and empirical diagrams (`docs/academic/FINAL_FIGURE_LIST.md`).
  - Master Table List with 17 system and empirical tables (`docs/academic/FINAL_TABLE_LIST.md`).
  - Master Consolidated Empirical Results Tables (`docs/academic/FINAL_RESULTS_TABLES.md`).
  - Application Screenshot Requirements Catalog (`docs/academic/SCREENSHOT_REQUIREMENTS.md`).
- Maintained 100% academic integrity (no fabricated names, hardware, or publication claims; clearly distinguished standard algorithms from project engineering novelty).
- Full regression test suite passing at 100% (113/113 assertions, 56/56 master audit checks).

---

## 16. Current Operational State & Readiness

**Current State:**
All core software engineering, machine learning pipelines, operations research solvers, two-tier microservice gateways, automated test suites, empirical benchmarks, locked IEEE literature surveys, and the official Mumbai University Major Project Black Book dissertation are **100% complete, verified, and operational**.



