# FreshCart AI: Master Academic Diagram Inventory & UML Specification

This document defines the 22 original technical diagrams required for the **Mumbai University / APSIT Major Project Black Book**, **Review-1 Presentation**, and **Semester-7 Report**.

---

## 1. Complete Diagram Matrix

| # | Diagram Name | Type | Target Chapter | Fig # Placeholder | Core Entities / Components | Source of Truth |
|---|---|---|---|---|---|---|
| **D01** | High-Level System Architecture | Architectural | Chapter 1 & 5 | Fig 1.1 / 5.1 | Storefront, Admin Portal, Express App, SQLite, FastAPI AI Microservice, Serialized Models | [server.js](file:///c:/Users/shash/demo1/server.js), [ml/service/app.py](file:///c:/Users/shash/demo1/ml/service/app.py) |
| **D02** | Two-Tier AI Gateway Integration | Architectural | Chapter 5 | Fig 5.2 | Node AI Gateway (`ai-client.js`), 1.5s Circuit Timeout, Python Service, In-Process Fallbacks | [docs/integration/INTEGRATION_ARCHITECTURE.md](file:///c:/Users/shash/demo1/docs/integration/INTEGRATION_ARCHITECTURE.md) |
| **D03** | Data Flow Diagram (DFD) — Level 0 | DFD (Context) | Chapter 5 | Fig 5.3 | Customer, Store Administrator, FreshCart Central System, Payment Processor, Supplier | [server.js](file:///c:/Users/shash/demo1/server.js) |
| **D04** | Data Flow Diagram (DFD) — Level 1 | DFD (Functional) | Chapter 5 | Fig 5.4 | Auth Process, Catalog Query, Cart/Checkout, ML Inference, Operations Optimizer, DB Datastores | `routes/` (All Express route handlers) |
| **D05** | Master Use Case Diagram | UML Behavioral | Chapter 5 | Fig 5.5 | Customer Actor, Admin Actor, Supplier Actor, System Scheduler, AI Microservice Actor | `public/js/app.js`, `public/js/admin.js` |
| **D06** | Activity Diagram — Customer Purchase Flow | UML Behavioral | Chapter 5 | Fig 5.6 | Browse $\to$ Smart Search $\to$ Add Item $\to$ Apply Coupon $\to$ Select Address $\to$ Pay $\to$ Order Confirm | `public/js/app.js`, [routes/orders.js](file:///c:/Users/shash/demo1/routes/orders.js) |
| **D07** | Activity Diagram — Autonomous AI Operational Loop | UML Behavioral | Chapter 5 | Fig 5.7 | Nightly Demand Forecast $\to$ Evaluate ROP $\to$ Auto-Draft PO $\to$ Reorder Approval $\to$ Batching | [ml/demand-forecasting.js](file:///c:/Users/shash/demo1/ml/demand-forecasting.js), [routes/supplier.js](file:///c:/Users/shash/demo1/routes/supplier.js) |
| **D08** | Sequence Diagram — Order Checkout & Stock Decrement | UML Interaction | Chapter 5 | Fig 5.8 | Customer $\to$ Storefront $\to$ Orders Route $\to$ Pre-Stock Check $\to$ Fraud Scorer $\to$ SQLite ACID Tx | [routes/orders.js](file:///c:/Users/shash/demo1/routes/orders.js) |
| **D09** | Sequence Diagram — Personalized Top-K Recommendation | UML Interaction | Chapter 5 | Fig 5.9 | Storefront $\to$ Recs Route $\to$ AI Client $\to$ FastAPI `/predict/recommendations` $\to$ Catalog Enricher | [routes/recommendations.js](file:///c:/Users/shash/demo1/routes/recommendations.js) |
| **D10** | Sequence Diagram — Transaction Fraud Scoring | UML Interaction | Chapter 5 | Fig 5.10 | Orders Route $\to$ AI Client $\to$ FastAPI `/predict/fraud` $\to$ Random Forest $\to$ Risk Score & Level | [routes/admin.js](file:///c:/Users/shash/demo1/routes/admin.js), [ml/service/fraud_service.py](file:///c:/Users/shash/demo1/ml/service/fraud_service.py) |
| **D11** | Sequence Diagram — Demand Forecasting & Stock Alert | UML Interaction | Chapter 5 | Fig 5.11 | Admin Portal $\to$ Analytics Route $\to$ FastAPI `/predict/demand` $\to$ SARIMAX Forecaster $\to$ Chart.js | [routes/analytics.js](file:///c:/Users/shash/demo1/routes/analytics.js) |
| **D12** | Entity-Relationship (ER) Diagram | Database Schema | Chapter 5 & 6 | Fig 5.12 | `users`, `products`, `orders`, `order_items`, `cart_items`, `sales_history`, `user_interactions` | `schema.sql`, [db/database.js](file:///c:/Users/shash/demo1/db/database.js) |
| **D13** | Hybrid Recommendation Workflow | Pipeline Flow | Chapter 5 & 7 | Fig 5.13 | User Interaction Matrix $\to$ Cosine Similarity + TF-IDF Tag Vectors $\to$ Weighted Sum $\to$ Top-K | [ml/python/experiments/recommendation_experiment.py](file:///c:/Users/shash/demo1/ml/python/experiments/recommendation_experiment.py) |
| **D14** | Time-Series Demand Forecasting Pipeline | Pipeline Flow | Chapter 5 & 7 | Fig 5.14 | Daily Sales Aggregation $\to$ Differencing / Stationary Test $\to$ SARIMAX Lag Step $\to$ 7-Day Forecast | [ml/python/experiments/demand_forecasting_experiment.py](file:///c:/Users/shash/demo1/ml/python/experiments/demand_forecasting_experiment.py) |
| **D15** | Dynamic Pricing & Elasticity Sandbox | Pipeline Flow | Chapter 5 & 7 | Fig 5.15 | Price-Quantity Pairs $\to$ Log-Log OLS Fit $\to$ Elasticity $E_d \to$ Revenue Maximizing $P^* \to \pm 25\%$ Clip | [ml/python/experiments/dynamic_pricing_experiment.py](file:///c:/Users/shash/demo1/ml/python/experiments/dynamic_pricing_experiment.py) |
| **D16** | Transaction Fraud & Anomaly Pipeline | Pipeline Flow | Chapter 5 & 7 | Fig 5.16 | Order Meta $\to$ Feature Normalizer $\to$ Random Forest Estimator $\to$ Z-Score Heuristic Fallback | [ml/python/experiments/fraud_detection_experiment.py](file:///c:/Users/shash/demo1/ml/python/experiments/fraud_detection_experiment.py) |
| **D17** | Inventory Continuous Review $(r, Q)$ Workflow | OR Pipeline | Chapter 5 & 7 | Fig 5.17 | Historical Demand Distribution $\to$ Lead Time Modeling $\to$ EOQ + Safety Stock $\to$ Sawtooth Curve | [ml/python/optimization/inventory_optimization.py](file:///c:/Users/shash/demo1/ml/python/optimization/inventory_optimization.py) |
| **D18** | Dark Store 2D TSP Picker Walk Path | OR Spatial Flow | Chapter 5 & 7 | Fig 5.18 | Packing Station Entry $\to$ Item Coordinate Lookup $\to$ Nearest Neighbor Path $\to$ 2-Opt Improvement | [ml/python/optimization/warehouse_optimization.py](file:///c:/Users/shash/demo1/ml/python/optimization/warehouse_optimization.py) |
| **D19** | Last-Mile CVRP Fleet Dispatch Routing | OR Spatial Flow | Chapter 5 & 7 | Fig 5.19 | Central Hub Depot $\to$ Haversine Distance Matrix $\to$ Clarke-Wright Savings $\to$ Fleet Clustering | [ml/python/optimization/delivery_optimization.py](file:///c:/Users/shash/demo1/ml/python/optimization/delivery_optimization.py) |
| **D20** | Python FastAPI Singleton Model Registry | Internal Engine | Chapter 5 | Fig 5.20 | Lifespan Startup $\to$ `joblib.load()` into RAM $\to$ In-Memory Predict $\to$ Zero-Disk-I/O Latency | [ml/service/model_loader.py](file:///c:/Users/shash/demo1/ml/service/model_loader.py) |
| **D21** | Node.js Gateway Circuit & Fallback Hierarchy | Fault Tolerance | Chapter 5 | Fig 5.21 | Request $\to$ 1500ms Timer $\to$ Python Online (200 OK) / Python Offline $\to$ In-Process Node Engine | [services/ai-client.js](file:///c:/Users/shash/demo1/services/ai-client.js) |
| **D22** | Local Multi-Service Process Topology | Deployment | Chapter 6 | Fig 6.1 | OS Loopback (`127.0.0.1`), Node HTTP Server (:3000), FastAPI Uvicorn Server (:8000), Local SQLite | [docs/integration/LOCAL_AI_SETUP.md](file:///c:/Users/shash/demo1/docs/integration/LOCAL_AI_SETUP.md) |

---

## 2. Detailed Diagram Specifications (Sample Entity Breakdowns)

### Fig 5.1: High-Level System Architecture
```
+-------------------------------------------------------------------------------+
|                             CLIENT INTERFACE LAYER                            |
|  [Storefront PWA: Vanilla JS + HTML5 + CSS]   [Admin Portal: Chart.js Canvas] |
+---------------------------------------+---------------------------------------+
                                        | HTTP REST (JSON) Port 3000
+---------------------------------------v---------------------------------------+
|                         APPLICATION SERVER LAYER (NODE.JS)                    |
|  Express 4.18  |  Auth Middleware (JWT/Bcrypt)  |  ACID Transaction Manager   |
|  Routes: /api/products, /api/cart, /api/orders, /api/admin, /api/analytics... |
+-------------------+---------------------------------------+-------------------+
                    |                                       |
     Direct SQLite Queries              Async REST Inference (Port 8000)
                    |                                       |
+-------------------v-------------------+   +---------------v-------------------+
|          DATA PERSISTENCE LAYER       |   |       AI MICROSERVICE LAYER       |
|  SQLite / sql.js Database             |   |  FastAPI 0.110+ on Uvicorn ASGI   |
|  - Products (31 SKUs)                 |   |  - Hybrid CF+CB Recommender       |
|  - Orders & Order Items (4,231)       |   |  - SARIMAX Demand Forecaster      |
|  - User Interactions (83,760)         |   |  - Log-Log OLS Elasticity Engine  |
|  - Sales History (11,315 days)        |   |  - Random Forest Fraud Scorer     |
+---------------------------------------+   |  - Continuous Review (r,Q) Solver |
                                            |  - Dark Store 2D TSP Picker       |
                                            |  - Clarke-Wright CVRP Router      |
                                            +-----------------------------------+
```

### Fig 5.12: Entity-Relationship (ER) Diagram
- **USERS** (`id` PK, `name`, `email` UNIQUE, `password_hash`, `role`, `created_at`)
- **PRODUCTS** (`id` PK, `name`, `category`, `price`, `stock`, `emoji`, `unit`, `tags`, `rating`)
- **ORDERS** (`id` PK, `user_id` FK $\to$ USERS, `subtotal`, `delivery_fee`, `tax`, `total`, `status`, `customer_name`, `address`, `phone`, `payment_method`, `created_at`)
- **ORDER_ITEMS** (`id` PK, `order_id` FK $\to$ ORDERS, `product_id` FK $\to$ PRODUCTS, `quantity`, `price_at_purchase`)
- **CART_ITEMS** (`id` PK, `user_id` FK $\to$ USERS, `product_id` FK $\to$ PRODUCTS, `quantity`, `created_at`)
- **SALES_HISTORY** (`id` PK, `product_id` FK $\to$ PRODUCTS, `date`, `quantity_sold`, `revenue`)
- **USER_INTERACTIONS** (`id` PK, `user_id` FK $\to$ USERS, `product_id` FK $\to$ PRODUCTS, `action`, `rating`, `created_at`)
