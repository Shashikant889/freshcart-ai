# Product Requirements & Capabilities Gap Matrix

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Target Specification:** Master Build Directive v2.0 & Production Quick-Commerce Intelligence Stack  
**Audit Date:** September 4, 2026  

---

## 1. Capability Gap Matrix

| # | Capability Area | Specific Target Requirement | Current Implementation Status | Evidence & Verification Path | Required Remediation |
|---|---|---|---|---|---|
| **1** | **Experience Storefront** | 10,000 SKUs, category browsing, cart drawer, checkout, tracking | `IMPLEMENTED` | `public/index.html`, `public/js/app.js`, `routes/products.js` | Maintain visual polish; connect explainable AI labels |
| **2** | **Classical ML - Recommendations** | Hybrid Collaborative Filtering + Content-Based Cosine | `IMPLEMENTED` | `ml/service/recommendation_service.py`, `ml/python/models/best_recommendation_model.joblib` | Evolve to two-stage ranking pipeline with explicit machine-readable reasons |
| **3** | **Classical ML - Demand Forecasting** | 7-day multi-step time-series forecasting (SARIMAX) | `IMPLEMENTED` | `ml/service/demand_service.py`, `ml/python/models/best_demand_forecasting_model.joblib` | Add rolling origin evaluation metrics (MAE, RMSE, WAPE) |
| **4** | **Classical ML - Fraud Anomaly** | Transaction risk classification & spend anomaly scoring | `IMPLEMENTED` | `ml/service/fraud_service.py`, `ml/python/models/best_fraud_detection_model.joblib` | Add ROC-AUC and PR-AUC calibration curves |
| **5** | **Classical ML - Dynamic Pricing** | Microeconomic Log-Log price elasticity ($E_d$) simulation | `IMPLEMENTED` | `ml/service/pricing_service.py`, `ml/python/models/price_elasticity_model.joblib` | Clarify correlation vs causal bounds; add 25% safety limit |
| **6** | **Deep Learning** | Genuine neural network (LSTM/GRU) trained on daily sales history | `MISSING` | No PyTorch `.pt` file, no training loop, no loss curve | **Train PyTorch LSTM on sales history, export weights, expose `/predict/deep-demand`** |
| **7** | **NLP & Search** | Hybrid semantic vector + BM25 lexical search with intent detection | `PARTIAL` | `ml/smart-search.js` has TF-IDF & synonyms, but lacks dense vector search | **Add dense vector embedding search combined via Reciprocal Rank Fusion** |
| **8** | **RAG (Knowledge Retrieval)** | Document chunking, hybrid retrieval, grounded generation, citations | `MISSING` | `ml/recipe-assistant.js` is regex-based; no vector store or citations | **Build true local RAG pipeline with policy chunking, vector index, and citation display** |
| **9** | **RAG Abstention & Safety** | System honestly abstains when query is out-of-corpus; injection defense | `MISSING` | No prompt injection test, no formal abstention logic | **Add prompt injection tests & strict citation grounding with abstention fallback** |
| **10** | **Computer Vision** | Image feature extraction for visual search & fridge item recognition | `PARTIAL` | `ml/visual-search.js` & `ml/fridge-vision-ai.js` use color heuristics | **Integrate lightweight neural image embedding (MobileNet/ResNet) for visual cosine matching** |
| **11** | **Operations Research - Warehouse** | 2D Dark Store TSP Picker routing (2-Opt local search) | `IMPLEMENTED` | `ml/service/optimization_service.py`, `ml/dark-store-picker.js` | Expose interactive visual rack path in AI Command Center |
| **12** | **Operations Research - Fleet** | Capacitated Vehicle Routing Problem (Clarke-Wright savings) | `IMPLEMENTED` | `ml/service/optimization_service.py`, `ml/route-optimizer.js` | Add visual delivery route map in AI Command Center |
| **13** | **Operations Research - Inventory** | Multi-item EOQ & stochastic Safety Stock Reorder Point (ROP) | `IMPLEMENTED` | `ml/service/optimization_service.py` | Add service level vs inventory cost scenario slider |
| **14** | **Process Orchestration** | Unified startup of both Node (port 3000) and FastAPI (port 8000) | `PARTIAL` | `scripts/dev-start.js` checked port 8000 but didn't spawn python child process | **Update `dev-start.js` to spawn both processes concurrently with health checks** |
| **15** | **MLOps & Reproducibility** | Local experiment tracking, model registry, artifact versioning | `PARTIAL` | Serialized joblib models exist, but no centralized experiment run viewer | **Implement local experiment ledger & active model registry in `/admin`** |
| **16** | **AI Command Center** | Live telemetry, prediction explorer, loss visualizer, RAG inspector | `MISSING` | `/admin` shows basic commerce charts, not live AI model inspectability | **Upgrade `/admin` into full AI Intelligence Command Center with model cards & inspectors** |
| **17** | **AI Security & Threat Model** | OWASP GenAI Top 10 threat model & red-team test suite | `MISSING` | Security tests exist for JWT/Bcrypt, but not for GenAI/LLM prompt injection | **Create GenAI red-team test suite targeting prompt injection & data leakage** |

---

## 2. Summary Statistics

* **Total Audited Capabilities:** 17
* **Implemented:** 7 (41.2%)
* **Partial:** 4 (23.5%)
* **Missing (Immediate Build Targets):** 6 (35.3%)
  - Genuine PyTorch Deep Learning (LSTM/GRU)
  - True Local RAG Engine with citations
  - RAG Honest Abstention & Injection Defense
  - Real Computer Vision embeddings
  - Live AI Intelligence Command Center
  - GenAI Red-Team Security Suite
* **Broken / Blocked:** 0 (0.0%)
