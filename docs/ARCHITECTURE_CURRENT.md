# Current System Architecture & Runtime Contracts

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Directive Version:** Antigravity Master Build Directive v2.0  
**Status:** Dual-Tier Local Architecture (Baseline)  

---

## 1. Architectural Topology

The system is structured as a **Hybrid Two-Tier Local Microservice Platform**:

```
                       ┌────────────────────────────────────────────────────────┐
                       │               CLIENT BROWSERS & INTERFACES             │
                       │   Storefront SPA (app.js)  │   Command Center (admin.js)│
                       └───────────────────────────┬────────────────────────────┘
                                                   │ HTTP / REST (Port 3000)
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                APPLICATION SERVER TIER (Node.js + Express)                             │
│                                                                                                        │
│  ├── Express Routing Controllers (`routes/*`): products, cart, checkout, admin, search, nutrition       │
│  ├── Session & Authentication: JWT, Bcrypt password hashing, RBAC (customer / admin)                   │
│  ├── Database Engine: WebAssembly SQLite (`db/database.js`) -> `freshcart.db` (10K products, 150K users) │
│  └── Service Gateway (`services/ai-client.js`):                                                        │
│        ├── Health detection of Python microservice (Port 8000)                                         │
│        ├── Circuit-breaker & timeout handling (800ms limit)                                            │
│        └── In-process JavaScript fallback engines (OLS regression, Apriori, K-Means, 2-Opt)             │
└──────────────────────────────────────────────────┬─────────────────────────────────────────────────────┘
                                                   │ JSON RPC / HTTP (Port 8000)
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                INTELLIGENCE & OPTIMIZATION TIER (Python + FastAPI)                     │
│                                                                                                        │
│  ├── FastAPI Framework: `ml/service/app.py` running via Uvicorn (Port 8000)                             │
│  ├── Model Registry: `ml/service/model_loader.py` loading serialized models on startup                 │
│  ├── Inference Modules:                                                                                │
│  │     ├── Recommendations: `ml/service/recommendation_service.py` (Hybrid CF + CB)                    │
│  │     ├── Demand Forecasting: `ml/service/demand_service.py` (SARIMAX & Linear Trend)                 │
│  │     ├── Dynamic Pricing: `ml/service/pricing_service.py` (Log-Log OLS Price Elasticity)             │
│  │     └── Fraud Scoring: `ml/service/fraud_service.py` (Random Forest Anomaly Classifier)             │
│  └── Operations Optimization Modules:                                                                  │
│        ├── Inventory Optimization: Multi-item EOQ and stochastic safety stock ROP                      │
│        ├── Warehouse Picking: 2D Dark Store TSP Picker routing with 2-Opt heuristic                    │
│        └── Delivery Fleet Dispatch: Capacitated Vehicle Routing Problem (Clarke-Wright Savings)        │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. API Contract Specifications

### A. Intelligence Tier Endpoints (`http://127.0.0.1:8000`)
* `GET /health`: Returns service status and a dictionary of loaded model booleans.
* `POST /predict/recommendations`: Payload `{ user_id: int, top_k: int }` $\to$ Returns ranked array of product recommendations with scores and justifications.
* `POST /predict/demand`: Payload `{ product_id: str, horizon_days: int }` $\to$ Returns daily unit demand forecast and confidence bounds.
* `POST /predict/price`: Payload `{ product_id: str, category: str, base_price: float }` $\to$ Returns optimal price $P^*$ bounded within 25% safety window and estimated elasticity $E_d$.
* `POST /predict/fraud`: Payload `{ total: float, total_items: int, user_velocity_24h: int, ... }` $\to$ Returns anomaly risk score and categorical risk level (`LOW`, `MEDIUM`, `HIGH`).
* `POST /optimize/inventory`: Payload `{ sku_id: str, unit_price: float, avg_daily_demand: float, current_stock: int }` $\to$ Returns EOQ, safety stock, and reorder point.
* `POST /optimize/warehouse`: Payload `{ product_ids: list[str] }` $\to$ Returns sequenced picking path coordinates, total distance, and estimated pick duration.
* `POST /optimize/delivery`: Payload `{ orders: list[OrderGeo] }` $\to$ Returns vehicle fleet assignment routes, total kilometers, and payload capacity utilization.

### B. Application Server Proxy Endpoints (`http://localhost:3000/api`)
* `/api/products`: Catalog search, filtering, and pagination over 10,000 SKUs.
* `/api/recommendations/personal`: Invokes `/predict/recommendations` via gateway with in-process fallback.
* `/api/analytics/demand-forecast/:id`: Invokes `/predict/demand` with historical trends.
* `/api/pricing/simulate/:id`: Invokes dynamic pricing elasticity simulator.
* `/api/checkout`: Executes ACID transactions, order stock decrements, and real-time fraud risk evaluation.
* `/api/admin/warehouse-picker`: Invokes dark store picker path optimizer.
* `/api/admin/fleet-dispatch`: Invokes CVRP delivery route optimizer.

---

## 3. Fallback & Resilience Protocol

1. **Sub-second Timeout:** `services/ai-client.js` enforces an 800ms timeout for all external Python microservice calls.
2. **Explicit Fallback Logging:** If the Python microservice is offline, the gateway logs:
   `[AI_GATEWAY_FALLBACK] Python microservice unavailable on port 8000. Engaging in-process heuristic engine.`
3. **Parity of Contract:** Both Python endpoints and in-process fallback engines return identical JSON schema structures so client UI rendering is never interrupted.
