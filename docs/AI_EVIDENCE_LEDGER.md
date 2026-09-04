# AI & Operations Research Evidence Ledger

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Standard:** Directive v2.0 Section 4.1 (*Anti-Hallucination Evidence Protocol*)  
**Audit Date:** September 4, 2026  

---

## 1. Zero-Hallucination Capability Ledger

Every capability claimed in project documentation or UI is indexed below with its exact source code path, training routine, evaluation metric, and runtime proof.

| Field | 1. Hybrid Recommender | 2. Time-Series Demand Forecasting | 3. Transaction Fraud Anomaly Detection |
|---|---|---|---|
| **Capability** | Personalized Top-$K$ Recommendation | Perishable Grocery Demand Prediction | Real-Time Checkout Anomaly & Fraud Scoring |
| **Claim** | Combines Collaborative & Content-Based signals for personalized ranking | 7-day multi-step forward demand forecasting with seasonal adjustment | Detects velocity and spend outliers to mitigate chargeback risk |
| **Implementation** | `ml/service/recommendation_service.py`, `ml/recommendation-engine.js` | `ml/service/demand_service.py`, `ml/demand-forecasting.js` | `ml/service/fraud_service.py`, `ml/fraud-detection.js` |
| **Inputs** | `user_id`, `cart_items`, user interaction history | `product_id`, historical daily sales quantities, day of week | `order_total`, `item_count`, user 24h order velocity, average user spend |
| **Model / Algorithm** | Hybrid Ensemble (Matrix Factorization CF + Cosine Content TF-IDF) | SARIMAX(1,1,1)x(1,0,1)_7 and OLS Linear Trend Extrapolation | Random Forest Classifier (100 estimators) + Z-Score Spend Outlier |
| **Training** | `ml/python/experiments/recommendation_experiment.py` | `ml/python/experiments/demand_forecasting_experiment.py` | `ml/python/experiments/fraud_detection_experiment.py` |
| **Inference** | `POST http://127.0.0.1:8000/predict/recommendations` | `POST http://127.0.0.1:8000/predict/demand` | `POST http://127.0.0.1:8000/predict/fraud` |
| **Evaluation** | Precision@5: 0.784, Recall@5: 0.612, NDCG@5: 0.741 | RMSE: 3.42 units, MAE: 2.18 units, WAPE: 8.4% | ROC-AUC: 0.942, PR-AUC: 0.812 (1.04% fraud prevalence) |
| **Runtime Proof** | Verified via `ml/service/test_service.py` (`recs=5`) | Verified via `ml/service/test_service.py` (`total_units=1473.4`) | Verified via `ml/service/test_service.py` (`risk_score=42.0%`) |
| **Limitations** | Cold-start users fall back to popularity; requires ongoing interaction logs | Cannot anticipate unforeseen exogenous black-swan demand shocks | High class imbalance requires periodic threshold re-calibration |
| **Status** | `IMPLEMENTED` | `IMPLEMENTED` | `IMPLEMENTED` |

---

| Field | 4. Microeconomic Dynamic Pricing | 5. 2D Dark Store Warehouse Picking | 6. Capacitated Vehicle Routing (CVRP) |
|---|---|---|---|
| **Capability** | Price Elasticity of Demand & Optimal Price ($P^*$) | Physical Picker Path Route Optimization | Urban Multi-Drop Fleet Dispatch Routing |
| **Claim** | Calculates item price elasticity $E_d$ and derives profit-maximizing price | Minimizes walking transit distance between warehouse rack bins | Clusters stops and solves vehicle delivery routing under load constraints |
| **Implementation** | `ml/service/pricing_service.py`, `ml/dynamic-pricing.js` | `ml/service/optimization_service.py`, `ml/dark-store-picker.js` | `ml/service/optimization_service.py`, `ml/route-optimizer.js` |
| **Inputs** | `product_id`, `category`, historical price points & sales volume | List of product SKU rack coordinates `[(x1, y1), ...]` | Depot coordinates, delivery customer coordinates, order payload weights |
| **Model / Algorithm** | Closed-form Log-Log OLS Regression ($\ln Q = \alpha + \beta \ln P$) | Travelling Salesperson Problem (TSP) with 2-Opt Local Search Heuristic | Clarke-Wright Savings Algorithm + 2-Opt Tour Improvement |
| **Training** | `ml/python/experiments/dynamic_pricing_experiment.py` | Combinatorial heuristic (instance-based solver) | Combinatorial heuristic (instance-based solver) |
| **Inference** | `POST http://127.0.0.1:8000/predict/price` | `POST http://127.0.0.1:8000/optimize/warehouse` | `POST http://127.0.0.1:8000/optimize/delivery` |
| **Evaluation** | Mean $R^2 = 0.68$, strictly bounded within $\pm 25\%$ safety band | Distance reduction: 37.48% vs. naive order; 58.7s pick time | Fleet distance reduction: 61.62% vs. unrouted round-trips |
| **Runtime Proof** | Verified via `ml/service/test_service.py` ($E_d = -0.058$) | Verified via `ml/service/test_service.py` (40.4m pick distance) | Verified via `ml/service/test_service.py` (7.87 km total distance) |
| **Limitations** | Assumes ceteris paribus; correlation-based elasticity | Assumes 2D orthogonal grid aisles without congestion blocking | Euclidean distance metric approximates real street network distance |
| **Status** | `IMPLEMENTED` | `IMPLEMENTED` | `IMPLEMENTED` |

---

| Field | 7. Deep Learning Demand Forecaster | 8. True Local RAG Engine | 9. Computer Vision Embedding Search |
|---|---|---|---|
| **Capability** | Multivariate LSTM Neural Network Forecasting | Hybrid RAG with Grounded Citations & Abstention | Convolutional Feature Embedding Visual Search |
| **Claim** | Captures non-linear temporal dependencies across lookback windows | Answers questions strictly from policy corpus with source IDs | Matches user images against catalog image embeddings |
| **Implementation** | To be built in Phase 4 (`ml/python/models/demand_lstm.pt`) | To be built in Phase 7 (`ml/service/rag_service.py`) | To be built in Phase 8 (`ml/service/vision_service.py`) |
| **Inputs** | Multi-day lagged sales sequence + day-of-week + promotions | Natural language customer/policy query + document chunks | User uploaded photo or fridge shelf image |
| **Model / Algorithm** | 2-Layer LSTM with Dropout (0.2) + Linear Dense Head | Dense Vector Embeddings + BM25 Sparse Lexical + RRF Reranking | MobileNetV2 / ResNet Feature Extractor + Cosine Distance |
| **Training** | PyTorch training script on historical sales sequences | Document chunking & local vector index creation | Pretrained ImageNet feature weights with catalog indexing |
| **Inference** | `POST http://127.0.0.1:8000/predict/deep-demand` | `POST http://127.0.0.1:8000/rag/query` | `POST http://127.0.0.1:8000/vision/search` |
| **Evaluation** | Target: Out-of-sample MAE < 2.0, loss convergence curve | Target: Groundedness > 95%, honest abstention on out-of-domain | Target: Top-3 retrieval accuracy on product catalog images |
| **Runtime Proof** | Scheduled Phase 4 delivery | Scheduled Phase 7 delivery | Scheduled Phase 8 delivery |
| **Limitations** | Requires clean sequential training data without zero-filling distortion | Dependent on quality and granularity of local corpus chunks | Edge camera distortion and poor lighting conditions |
| **Status** | `MISSING` (Phase 4 Target) | `MISSING` (Phase 7 Target) | `MISSING` (Phase 8 Target) |
