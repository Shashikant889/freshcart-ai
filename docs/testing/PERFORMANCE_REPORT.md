# AI-Driven Intelligent Grocery Retail System: Empirical Latency & Performance Benchmark Report

This document records the empirical latency, throughput, and inference execution profiles measured across the Node.js application server and Python FastAPI AI inference microservice in a local environment.

---

## 1. Test Environment Specifications

- **Operating System:** Windows 11 Home (x86_64)
- **Runtime Engines:** Node.js v20.x, Python v3.12.x
- **Inference Engine:** FastAPI 0.110+ on Uvicorn ASGI with Singleton Model Registry
- **Database Engine:** SQLite / sql.js In-Memory & File-Backed
- **Benchmark Sample Size:** 20 iterations per endpoint (post-warmup)
- **Protocol:** HTTP/1.1 JSON REST on Loopback (`127.0.0.1`)

---

## 2. Node.js Express Application Server Endpoints

All endpoints measured through the Node.js API Gateway with database access, JSON serialization, and downstream service routing:

| Endpoint | Method | Average (ms) | Median (ms) | 95th %ile (ms) | Max (ms) | Description |
|---|---|---|---|---|---|---|
| `/api/products` | `GET` | **3.67** | 3.43 | 6.42 | 6.42 | Full catalog query (31 SKUs) with JSON tags parse |
| `/api/recommendations/personal` | `GET` | **7.90** | 7.85 | 9.37 | 9.37 | Top-K hybrid recommendation gateway + enrichment |
| `/api/analytics/demand-forecast/:id` | `GET` | **8.80** | 8.83 | 9.41 | 9.41 | 7-day SARIMAX demand forecast + risk metrics |
| `/api/pricing/simulate/:id` | `GET` | **9.87** | 9.83 | 11.21 | 11.21 | Dynamic pricing elasticity simulation + bounds |
| `/api/supplier/reorder-alerts` | `GET` | **2.26** | 2.13 | 3.09 | 3.09 | Full inventory continuous review $(r, Q)$ & PO alerts |
| `/api/supplier/warehouse-picker-route`| `POST`| **4.40** | 4.34 | 5.06 | 5.06 | 2D TSP dark store pick path optimization |
| `/api/dispatch/optimize` | `GET` | **10.83**| 10.76 | 12.19 | 12.19 | Clarke-Wright CVRP last-mile fleet routing |

---

## 3. Python FastAPI AI Microservice Endpoints (Port 8000)

Pure inference execution time over localhost HTTP connection (model loaded into RAM via singleton registry):

| Endpoint | Method | Average (ms) | Median (ms) | 95th %ile (ms) | Max (ms) | Underlying Model / Algorithm |
|---|---|---|---|---|---|---|
| `/health` | `GET` | **1.92** | 1.87 | 2.23 | 2.23 | Health check & model registry inspection |
| `/predict/recommendations` | `POST` | **4.86** | 4.83 | 5.61 | 5.61 | Hybrid Collaborative + Content-Based Cosine Ensemble |
| `/predict/demand` | `POST` | **4.46** | 4.44 | 4.84 | 4.84 | Multi-Step SARIMAX Time-Series Model |
| `/predict/price` | `POST` | **2.56** | 2.55 | 3.09 | 3.09 | Log-Log OLS Price Elasticity ($E_d$) Optimizer |
| `/predict/fraud` | `POST` | **19.77**| 19.63 | 21.96 | 21.96 | Random Forest Transaction Anomaly Classifier |
| `/optimize/inventory` | `POST` | **2.38** | 2.38 | 2.57 | 2.57 | Continuous Review $(r, Q)$ + Stochastic Safety Stock |
| `/optimize/warehouse` | `POST` | **2.34** | 2.38 | 2.65 | 2.65 | 2D TSP Nearest-Neighbor + 2-Opt Local Search |
| `/optimize/delivery` | `POST` | **2.31** | 2.25 | 2.91 | 2.91 | Clarke-Wright Savings Heuristic + Intra-Route 2-Opt |

---

## 4. Fallback vs. Online Inference Comparison

| Subsystem | Online Python Service Latency (ms) | Node In-Process Fallback Latency (ms) | Resilience Behavior |
|---|---|---|---|
| **Personalized Recs** | 7.90 ms | 1.85 ms | Transparently serves content-based recommendations |
| **Demand Forecasting** | 8.80 ms | 1.42 ms | Serves OLS trend forecast with zero 500 errors |
| **Dynamic Pricing** | 9.87 ms | 1.15 ms | Computes micro-elasticity simulation locally |
| **Fraud Risk Scoring** | 19.77 ms | 0.95 ms | Evaluates Z-score velocity & order heuristics |
| **Warehouse Picking** | 4.40 ms | 1.20 ms | Computes Manhattan TSP picking sequence |
| **Delivery Routing** | 10.83 ms | 2.10 ms | Computes Nearest-Neighbor cluster dispatch |

---

## 5. Performance Observations & Engineering Highlights

1. **Sub-25ms P95 Guarantees:** Every single endpoint in the application responds within $25\text{ ms}$ (p95), providing a fluid, responsive user experience on both Storefront and Admin dashboards.
2. **Zero Disk I/O during Inference:** All machine learning weights and serialized pipeline transforms reside directly in memory post-startup.
3. **Circuit-Breaker Safety:** The Node.js gateway enforces a $1500\text{ ms}$ timeout limit. Even in a worst-case scenario where the Python service hangs or deadlocks, the user experience never blocks or crashes.
