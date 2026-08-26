# FreshCart AI: Integration Architecture & Service Gateway

## 1. System Overview

FreshCart AI adopts a **Hybrid Two-Tier Microservice Architecture**:
- **Application Tier (Node.js + Express):** Serves customer storefront and admin web applications, handles session/JWT authentication, executes transactional SQLite queries, and coordinates business workflows.
- **Intelligence Tier (Python + FastAPI):** Serves offline-trained machine learning and operations research models (Hybrid Recommender, SARIMAX Demand Forecaster, Dynamic Price Elasticity, Random Forest Fraud Detector, EOQ/ROP Inventory Optimizer, Dark Store 2D TSP Picker, and Capacitated Vehicle Routing Problem).
- **Service Gateway (`services/ai-client.js`):** A resilient, decoupled HTTP client layer inside Node.js that invokes the Python inference endpoints with sub-second timeouts and automatic, zero-downtime graceful fallback to in-process Node heuristics.

```
                    ┌──────────────────────────────────────────────┐
                    │               CLIENT APPLICATIONS            │
                    │   Storefront (app.js)  │ Admin Dash (admin.js)│
                    └──────────────────────┬───────────────────────┘
                                           │ HTTP / JSON (Port 3000)
                    ┌──────────────────────▼───────────────────────┐
                    │          NODE.JS EXPRESS APPLICATION         │
                    │       Routes: /api/recommendations,          │
                    │       /api/analytics, /api/pricing,          │
                    │       /api/orders, /api/supplier, /dispatch  │
                    └──────────────────────┬───────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │ AI Client Gateway (ai-client.js)    │
                        │ • Non-blocking async HTTP (Port 8000)│
                        │ • 1.5s Circuit Timeout               │
                        │ • Automatic Fallback Orchestrator   │
                        └─────────┬───────────────────┬───────┘
                                  │                   │
                     [Python AI Online]         [Python AI Offline]
                                  │                   │
                                  ▼                   ▼
                    ┌─────────────────────────┐ ┌─────────────────────────┐
                    │   PYTHON FASTAPI SERVICE │ │  NODE IN-PROCESS ENGINES│
                    │   (ml/service/app.py)   │ │  (ml/*.js Fallback)     │
                    │ • Hybrid (CF+CB) Recs   │ │ • Content/Cosine Recs   │
                    │ • SARIMAX Forecast      │ │ • OLS Trend Forecaster  │
                    │ • Price Elasticity Log  │ │ • Micro-Elasticity Sim  │
                    │ • Random Forest Fraud   │ │ • Z-Score Fraud Scorer  │
                    │ • EOQ & Stochastic ROP  │ │ • Heuristic Safety Stock│
                    │ • Dark Store 2D TSP     │ │ • Manhattan TSP Picker  │
                    │ • Clarke-Wright CVRP    │ │ • Greedy Nearest VRP    │
                    └─────────────┬───────────┘ └─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  PRE-TRAINED ARTIFACTS  │
                    │  (ml/python/models/*.joblib)
                    └─────────────────────────┘
```

---

## 2. API Endpoints & Request/Response Flow

| Subsystem | Node Application Endpoint | Python Inference Endpoint | Primary Algorithm | Fallback Mechanism |
|---|---|---|---|---|
| **Recommendations** | `GET /api/recommendations/personal` | `POST /predict/recommendations` | Hybrid Ensemble (CF + CB) | Content-Based Cosine Similarity + Popularity |
| **Demand Forecasting** | `GET /api/analytics/demand-forecast/:id` | `POST /predict/demand` | SARIMAX Multi-Step Time-Series | 7-Day Moving Average + Day-of-Week Seasonality |
| **Dynamic Pricing** | `GET /api/pricing/elasticity/:id` | `POST /predict/price` | Log-Log OLS Elasticity ($E_d$) | In-process Microeconomic Revenue Simulator |
| **Fraud Detection** | `POST /api/orders` | `POST /predict/fraud` | Random Forest Anomaly Classifier | Multi-Factor Statistical Z-Score Engine |
| **Inventory Optimization** | `GET /api/supplier/reorder-alerts` | `POST /optimize/inventory` | Continuous Review $(r, Q)$ with EOQ & Stochastic $SS$ | Category Heuristic Buffer Rule |
| **Warehouse Picking** | `POST /api/supplier/warehouse-picker-route` | `POST /optimize/warehouse` | 2D TSP Nearest-Neighbor + 2-Opt | Manhattan Distance Greedy Path |
| **Delivery Routing** | `GET /api/dispatch/optimize` | `POST /optimize/delivery` | Clarke-Wright Savings + 2-Opt CVRP | Nearest-Neighbor Single-Vehicle Dispatch |

---

## 3. Resilience & Graceful Fallback Strategy

To ensure high availability, the Node.js application **never crashes** if the Python AI service is stopped, unreachable, or experiencing network latency:
1. **Configurable Timeout:** Calls to the Python service enforce a strict `1500ms` request timeout.
2. **Transparent Engine Attribution:** Every response includes metadata (e.g. `engine: "python_ml"` vs `engine: "node_fallback"`) so frontend dashboards and audit logs explicitly know which model served the request.
3. **Zero Data Loss:** Fallback engines produce structurally compatible responses allowing client applications to function seamlessly without downtime.
