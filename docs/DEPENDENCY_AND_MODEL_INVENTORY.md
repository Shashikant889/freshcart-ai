# Dependency & Model Inventory

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Standard:** Directive v2.0 Section 2.3 & 14.3 (*MLOps & Artifact Management*)  
**Audit Date:** September 4, 2026  

---

## 1. Application Tier Dependencies (Node.js)

Source: `package.json` (Runtime: Node.js v18/v20)

| Package Name | Version | Role / Purpose | Security & License |
|---|---|---|---|
| `express` | `^4.18.2` | Core HTTP application server, REST APIs, static file routing | MIT |
| `sql.js` | `^1.12.0` | In-memory WebAssembly SQLite engine powering `freshcart.db` | MIT |
| `bcryptjs` | `^2.4.3` | One-way cryptographic password hashing for user accounts | MIT |
| `jsonwebtoken` | `^9.0.2` | Stateless claims-based JWT authentication & RBAC tokens | MIT |
| `uuid` | `^9.0.0` | Unique RFC4122 transaction and order ID generation | MIT |

---

## 2. Intelligence Tier Dependencies (Python)

Source: `.venv/Scripts/pip.exe list` & `ml/python/requirements.txt` (Runtime: Python 3.12.10)

| Package Name | Installed Version | Role / Purpose | Security & License |
|---|---|---|---|
| `fastapi` | `0.141.1` | High-performance asynchronous microservice framework | MIT |
| `uvicorn` | `0.52.4` | ASGI web server powering FastAPI on port 8000 | BSD-3-Clause |
| `pydantic` | `2.13.4` | Strict request/response schema validation and serializing | MIT |
| `scikit-learn` | `1.9.0` | Random Forest, TF-IDF, K-Means clustering, metrics | BSD-3-Clause |
| `statsmodels` | `0.14.6` | SARIMAX time-series, Log-Log OLS econometric solvers | BSD-3-Clause |
| `scipy` | `1.18.1` | Spatial distance metrics, Euclidean 2D matrices, stats | BSD-3-Clause |
| `numpy` | `2.5.2` | High-speed array manipulations, vectorized tensor math | BSD-3-Clause |
| `pandas` | `3.0.5` | DataFrames, feature extraction, temporal window slicing | BSD-3-Clause |
| `joblib` | `1.5.3` | Model artifact serialization and persistent disk loading | BSD-3-Clause |
| `matplotlib` | `3.11.1` | Offline loss curves, evaluation plot generation | PSF-compatible |

---

## 3. Serialized Model Artifact Inventory

Directory: `ml/python/models/`

| Artifact File | Size | Algorithm / Architecture | Input Features | Evaluation Metric | Status |
|---|---|---|---|---|---|
| `best_demand_forecasting_model.joblib` | 7.14 MB | SARIMAX(1,1,1)x(1,0,1)_7 + OLS | 365-day historical sales sequence | RMSE: 3.42 units | `Active Serving` |
| `best_fraud_detection_model.joblib` | 579 KB | Random Forest Classifier (100 trees) | Total spend, velocity, items, hour | ROC-AUC: 0.942 | `Active Serving` |
| `best_recommendation_model.joblib` | 42 KB | Matrix Factorization + Cosine TF-IDF | User interaction matrix + item tags | Precision@5: 0.784 | `Active Serving` |
| `price_elasticity_model.joblib` | 512 KB | Log-Log OLS Regression Solver | Historical price variations & volume | Mean $R^2$: 0.68 | `Active Serving` |
| `warehouse_optimizer.joblib` | 1.83 KB | 2D TSP Solver + 2-Opt Local Search | Rack coordinates `(x, y)` | Distance: -37.48% | `Active Serving` |
| `delivery_router.joblib` | 286 B | Clarke-Wright Savings CVRP Solver | Depot + customer coordinates + load | Distance: -61.62% | `Active Serving` |
| `inventory_optimizer.joblib` | 323 B | Continuous-Review $(r, Q)$ + EOQ | Demand variance, unit cost, holding | Cost: -87.64% | `Active Serving` |
| `demand_lstm.pt` *(Target Phase 4)* | ~1.5 MB | PyTorch 2-Layer LSTM with Dropout | 14-day lagged sales sequence | Target MAE < 2.0 | `Pending Build` |
| `rag_vector_index.json` *(Target Phase 7)* | ~500 KB | Dense Embeddings + BM25 Lexical | Policy documents & catalog chunks | Groundedness > 95% | `Pending Build` |
