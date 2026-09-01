# FreshCart AI — REST API Reference

This document details all **70 HTTP REST API endpoints** implemented in FreshCart AI. All endpoints return standardized JSON payloads with standard HTTP status codes.

---

## 1. Authentication & Session Management

| Endpoint | Method | Auth | Purpose | Important Parameters | Response Summary |
|---|---|:---:|---|---|---|
| `/api/auth/register` | `POST` | Public | Registers a new customer account | Body: `name`, `email`, `password`, `address` | Returns created user profile and signed JWT token |
| `/api/auth/login` | `POST` | Public | Authenticates user credentials | Body: `email`, `password` | Returns user details, role (`customer` / `admin`), and JWT token |
| `/api/auth/me` | `GET` | User (JWT) | Retrieves authenticated user profile | Header: `Authorization: Bearer <token>` | Returns current user details and loyalty coin balance |

---

## 2. Products & Catalog Engine

| Endpoint | Method | Auth | Purpose | Important Parameters | Response Summary |
|---|---|:---:|---|---|---|
| `/api/products` | `GET` | Public | Paginated product browsing with filters | Query: `page` (default 1), `limit` (default 24), `category`, `diet`, `sort`, `search` | Returns array of product items, `total` (10,000), `page`, and `totalPages` |
| `/api/products/categories` | `GET` | Public | Lists all 108 unique grocery categories | None | Returns array of distinct category names |
| `/api/categories` | `GET` | Public | Alias route for `/api/products/categories` | None | Returns array of 108 category strings |
| `/api/products/featured` | `GET` | Public | Retrieves curated featured/high-rating items | Query: `limit` (default 8) | Returns array of top-rated products |
| `/api/products/:id` | `GET` | Public | Retrieves full product specification by ID | URL: `:id` (e.g. `p_101`) | Returns complete product object with nutrition and stock |

---

## 3. Cart & Checkout Operations

| Endpoint | Method | Auth | Purpose | Important Parameters | Response Summary |
|---|---|:---:|---|---|---|
| `/api/cart` | `GET` | Optional | Retrieves active cart contents and bill | Session / Header | Returns `items`, `subtotal`, `tax`, `deliveryFee`, and `total` |
| `/api/cart/items` | `POST` | Optional | Adds a product to the cart | Body: `productId`, `quantity` | Returns updated cart object |
| `/api/cart/items/:productId` | `PUT` | Optional | Updates quantity of an item in cart | URL: `:productId`, Body: `quantity` | Returns updated cart breakdown |
| `/api/cart/items/:productId` | `DELETE` | Optional | Removes an item from cart | URL: `:productId` | Returns updated cart items array |
| `/api/cart` | `DELETE` | Optional | Empties the active cart | None | Returns empty cart structure |
| `/api/cart/coupon` | `POST` | Optional | Validates and applies promo code | Body: `code` (e.g. `INSTA50`, `FRESHFREE`) | Returns discount amount and updated payable total |
| `/api/cart/tip` | `POST` | Optional | Sets delivery partner tip | Body: `tip` (`0`, `20`, `30`, `50`, `100`) | Returns updated total with rider tip |
| `/api/cart/eco-bag` | `POST` | Optional | Toggles reusable cotton bag (+₹15) | Body: `isEcoBag` (`boolean`) | Returns updated fee breakdown |

---

## 4. Orders & Fulfillment Telemetry

| Endpoint | Method | Auth | Purpose | Important Parameters | Response Summary |
|---|---|:---:|---|---|---|
| `/api/orders` | `POST` | Optional | Places order with ACID stock decrement | Body: customer details, items, tip, payment method | Returns created `orderId`, status (`confirmed`), ETA |
| `/api/orders` | `GET` | User (JWT) | Lists customer order history | Header: `Authorization: Bearer <token>` | Returns list of past orders sorted by timestamp descending |
| `/api/orders/:id` | `GET` | Optional | Retrieves single order details | URL: `:id` | Returns order items, bill breakdown, and delivery address |
| `/api/orders/:id/track` | `GET` | Public | Real-time rider dispatch telemetry | URL: `:id` | Returns rider coordinates, stage (`packing`, `on_the_way`, `delivered`), ETA |
| `/api/orders/:id/scratch` | `POST` | User (JWT) | Claims gamification scratch reward | URL: `:id` | Returns won FreshCoins or discount voucher |
| `/api/orders/:id/invoice` | `GET` | Optional | Generates GST-compliant tax invoice | URL: `:id` | Returns printable HTML invoice with tax breakdown and verification QR |

---

## 5. Machine Learning & Recommendations

| Endpoint | Method | Auth | Purpose | Important Parameters | Response Summary |
|---|---|:---:|---|---|---|
| `/api/recommendations/personal` | `GET` | Optional | Top-K personalized hybrid recommendations | Query: `limit` (default 6), User JWT | Returns ranked products tailored to user affinity |
| `/api/recommendations/fbt/:productId` | `GET` | Public | Frequently Bought Together (Apriori mining) | URL: `:productId` | Returns bundled complementary grocery items |
| `/api/recommendations/similar/:productId` | `GET` | Public | Content-based TF-IDF cosine recommendations | URL: `:productId` | Returns items with similar attributes and category |
| `/api/recommendations/trending` | `GET` | Public | Fast-moving popular SKUs | Query: `limit` | Returns top trending items by velocity |

---

## 6. NLP Smart Search & Autocomplete

| Endpoint | Method | Auth | Purpose | Important Parameters | Response Summary |
|---|---|:---:|---|---|---|
| `/api/search` | `GET` | Public | Multi-token search with Hindi synonyms | Query: `q` (e.g. `doodh`, `seb`, `organic`) | Returns matching products scored by relevance |
| `/api/search/suggestions` | `GET` | Public | Instant autocomplete dropdown suggestions | Query: `q` | Returns title suggestions with `<mark>` substring matches, prices, and thumbnails |

---

## 7. Analytics & Demand Forecasting

| Endpoint | Method | Auth | Purpose | Important Parameters | Response Summary |
|---|---|:---:|---|---|---|
| `/api/analytics/demand-forecast/:productId` | `GET` | Public | 30-day time-series SARIMAX forecast | URL: `:productId` | Returns projected daily demand with 95% confidence intervals |
| `/api/analytics/segments` | `GET` | Admin (JWT) | RFM K-Means customer segmentation cohorts | Query: `k` (default 4) | Returns cluster centroids, persona labels, member counts |
| `/api/analytics/stock-alerts` | `GET` | Admin (JWT) | Continuous review $(r, Q)$ inventory risks | None | Returns items at or below reorder threshold |
| `/api/analytics/sales-trends` | `GET` | Admin (JWT) | Historical sales time-series | Query: `days` (default 30) | Returns daily aggregate revenue and volume |
| `/api/analytics/category-revenue` | `GET` | Admin (JWT) | Revenue breakdown by department | None | Returns percentage revenue share per category |
| `/api/analytics/ml-metrics` | `GET` | Admin (JWT) | Evaluated accuracy metrics of all models | None | Returns verified MAE, RMSE, MAPE, ROC-AUC, and F1 scores |

---

## 8. Econometric Pricing & Elasticity

| Endpoint | Method | Auth | Purpose | Important Parameters | Response Summary |
|---|---|:---:|---|---|---|
| `/api/pricing/elasticity/:productId` | `GET` | Admin (JWT) | Log-Log OLS price elasticity evaluation | URL: `:productId` | Returns elasticity $E_d$, $p$-value, and revenue optimal price $P^*$ |
| `/api/pricing/simulate` | `POST` | Admin (JWT) | Simulates revenue curve across price multipliers | Body: `productId`, `multipliers` | Returns projected demand and revenue points |
| `/api/pricing/flash-sale` | `GET` | Public | Dynamic perishable clearance markdowns | None | Returns near-expiry items with automated discount decay |

---

## 9. Dark Store Logistics & Routing

| Endpoint | Method | Auth | Purpose | Important Parameters | Response Summary |
|---|---|:---:|---|---|---|
| `/api/dispatch/route` | `GET` | Admin (JWT) | CVRP Clarke-Wright multi-vehicle fleet dispatch | Query: `ordersCount` (default 20) | Returns vehicle routes, mileage savings, and payload utilization |
| `/api/dispatch/picker-route` | `GET` | Admin (JWT) | 2D TSP dark store warehouse picker walk | Query: `itemsCount` (default 10) | Returns ordered shelf pick sequence, total walk distance (m), coordinates |

---

## 10. Admin Management

| Endpoint | Method | Auth | Purpose | Important Parameters | Response Summary |
|---|---|:---:|---|---|---|
| `/api/admin/dashboard` | `GET` | Admin (JWT) | Executive KPI summary | None | Returns total orders, revenue (INR), customer count, and product count |
| `/api/admin/ai-health` | `GET` | Admin (JWT) | Python AI microservice probe | None | Returns microservice health status and circuit breaker latency |
| `/api/admin/products` | `GET` | Admin (JWT) | Admin inventory view | Query: `page`, `limit`, `search` | Returns full inventory table with restock triggers |
| `/api/admin/products/:id` | `PUT` | Admin (JWT) | Modifies price or stock level | URL: `:id`, Body: `price`, `stock` | Returns updated product record |
| `/api/admin/orders` | `GET` | Admin (JWT) | Admin order management queue | Query: `status`, `limit` | Returns list of all orders across dark store |
| `/api/admin/orders/:id/fraud-check` | `POST` | Admin (JWT) | Evaluates real-time fraud risk score | URL: `:id` | Returns fraud probability $[0, 1]$ and risk classification |
| `/api/admin/orders/:id/status` | `PUT` | Admin (JWT) | Advances fulfillment status | URL: `:id`, Body: `status` | Returns updated order state |
| `/api/admin/users` | `GET` | Admin (JWT) | Customer accounts directory | Query: `page`, `limit` | Returns customer profiles with spend and orders |

---

## 11. Conversational AI, Nutrition, Vision & Fintech

| Endpoint | Method | Auth | Purpose | Important Parameters | Response Summary |
|---|---|:---:|---|---|---|
| `/api/assistant/recipe` | `POST` | Public | FreshBot recipe ingredient bundle solver | Body: `recipe` (e.g. *"Paneer Tikka"*) | Returns recognized ingredients, bundled price, 1-click cart add action |
| `/api/assistant/chat` | `POST` | Public | General quick-commerce conversational query | Body: `message` | Returns contextual customer support response |
| `/api/nutrition/analyze/:productId` | `GET` | Public | Computes French FSA Nutri-Score & macros | URL: `:productId` | Returns Nutri-Score grade (A-E), calories, protein, fat, carbs |
| `/api/nutrition/basket` | `POST` | Public | Full cart nutritional analysis | Body: `items` | Returns aggregated basket health score and allergen warnings |
| `/api/visual/fridge` | `POST` | Public | "Snap Your Fridge" replenishment recommender | Body: `imageHint` (color/label) | Returns detected depleted items with reorder discounts |
| `/api/visual/search` | `POST` | Public | Visual signature matching | Body: `color`, `shape` | Returns matching catalog products |
| `/api/wallet/balance` | `GET` | User (JWT) | FreshWallet balance & FreshCoins | User JWT | Returns available credit and coin conversion rate |
| `/api/wallet/pay` | `POST` | User (JWT) | Instant wallet checkout deduction | Body: `amount`, `orderId` | Returns payment confirmation receipt |
| `/api/group-orders/create` | `POST` | User (JWT) | Initiates collaborative group order session | Body: `sessionName` | Returns shareable 6-character room code |
| `/api/group-orders/:code` | `GET` | User (JWT) | Polls real-time collaborative group cart | URL: `:code` | Returns combined participant items and split totals |
| `/api/supplier/inventory-turnover` | `GET` | Admin (JWT) | Calculates inventory turnover ratio | None | Returns turnover rate and days-sales-of-inventory |
| `/api/supplier/abc-analysis` | `GET` | Admin (JWT) | Pareto ABC revenue classification | None | Returns Class A (80%), B (15%), C (5%) SKU lists |
| `/api/supplier/purchase-orders` | `GET` | Admin (JWT) | Automated replenishment purchase orders | None | Returns generated supplier POs based on $(r, Q)$ policy |
| `/api/health` | `GET` | Public | Service health & uptime probe | None | Returns `{ success: true, status: "healthy", timestamp }` |
