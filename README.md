# 🌿 FreshCart AI — Intelligent Grocery Retail & Operations Research Platform

> **A Production-Grade, Full-Stack AI-Native Grocery E-Commerce & Micro-Fulfillment Operations Ecosystem**  
> *B.Tech CSE (Artificial Intelligence & Machine Learning) Major Project — A. P. Shah Institute of Technology, University of Mumbai*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-freshcart--ai.onrender.com-brightgreen?style=for-the-badge&logo=render)](https://freshcart-ai.onrender.com/)
[![CI Build](https://github.com/Shashikant889/freshcart-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Shashikant889/freshcart-ai/actions)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Shashikant%20Shukla-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/shashikant-shukla-935688331/)
[![GitHub](https://img.shields.io/badge/GitHub-Shashikant889-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Shashikant889/freshcart-ai)

[![Node.js](https://img.shields.io/badge/Node.js-v18%20%7C%20v20-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Microservice-FastAPI%200.111-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Express](https://img.shields.io/badge/Backend-Express.js%204.19-blue.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20WASM-orange.svg)](https://sql.js.org/)
[![PWA](https://img.shields.io/badge/PWA-Installable%20Offline%20Ready-blueviolet.svg)]()
[![Multi-Tier Tests](https://img.shields.io/badge/Automated%20Tests-113%2F113%20Passing%20(100%25)-brightgreen.svg)](https://github.com/Shashikant889/freshcart-ai)
[![Security](https://img.shields.io/badge/Security-OWASP%20Audited%20%26%20SQLi%20Immune-blue.svg)]()
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

---

## 🌐 Live Production & Demo Links

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Shashikant889/freshcart-ai)

| Portal / Service | URL | Description |
|---|---|---|
| **🛒 Customer Storefront (PWA)** | [https://freshcart-ai.onrender.com/](https://freshcart-ai.onrender.com/) | Catalog across 31 grocery SKUs, bilingual NLP search, Top-K recommendations, FreshBot AI, cart & payment |
| **⚙️ Admin & ML Analytics Dashboard** | [https://freshcart-ai.onrender.com/admin.html](https://freshcart-ai.onrender.com/admin.html) | Executive KPIs, 30-day demand forecast visualizer, dynamic pricing sandbox, stock risk alerts, warehouse 2D picker route, CVRP fleet dispatch |
| **🧠 Python AI Microservice (Local)** | `http://localhost:8000/docs` | Interactive Swagger API documentation for pre-warmed ML inference engines |
| **📦 Complete Project ZIP** | [`freshcart-ai-complete.zip`](freshcart-ai-complete.zip) | Portable 30.7 MB zero-dependency archive with code, models, datasets & academic artifacts |

---

## 📖 System Overview

**FreshCart AI** is a dual-tier intelligent grocery retail and operations research platform designed for modern quick-commerce dark stores and e-commerce retail networks. It integrates **4 predictive machine learning models**, **3 combinatorial operations research solvers**, and **5 client-facing AI engines** into a high-performance, fault-tolerant web application:

### 1. Predictive Machine Learning Engines
- 🎯 **Top-K Hybrid Recommendation Engine:** Combines User-User Collaborative Filtering ($\alpha=0.60$) and Content-Based TF-IDF Item Cosine Similarity ($\beta=0.40$). Evaluated on leak-free holdout data: **F1@10: 0.5027**, **NDCG@10: 0.9790**, **Inference Latency: 4.86 ms**.
- 📈 **30-Day Time-Series Demand Forecasting:** Autoregressive SARIMAX model incorporating day-of-week seasonality and promotional regressors. Evaluated on a 30-day chronological holdout: **RMSE: 5.83 units**, **MAPE: 2.50%**, **Inference Latency: 4.46 ms**.
- 📉 **Econometric Dynamic Pricing & Elasticity Optimizer:** Bounded Log-Log Ordinary Least Squares (OLS) regression estimating category price elasticity ($E_d = -0.136, p < 0.001$). Simulates optimal price points ($P^*$) within strict $[\pm 25\%]$ safety guardrails, producing a **+22.21% simulated revenue lift**.
- 🚨 **Real-Time Transaction Fraud Detection:** Cost-sensitive Random Forest ensemble classifying high-risk scalping, bot transactions, and velocity anomalies in **<20 ms** (**ROC-AUC: 0.6087** with zero synthetic target leakage).

### 2. Operations Research & Dark Store Logistics Solvers
- 🏭 **Dark Store Warehouse Picker Route Optimizer (2D TSP):** Euclidean coordinate aisle-rack mapping with Nearest-Neighbor greedy initialization and intra-tour 2-Opt local search. Tested across 100 multi-item batches: **37.48% walk distance reduction**, **0.09% average optimality gap**, **Solver Latency: 2.34 ms**.
- 🚚 **Last-Mile Delivery Fleet Dispatch (CVRP):** Capacitated Vehicle Routing Problem solver using Clarke-Wright Savings heuristic with vehicle payload constraints ($Q_{\text{veh}} = 25\text{ kg}$) and 2-Opt route smoothing. Tested across 100 dispatch instances: **61.62% fleet mileage reduction**, **82.9% capacity utilization**, **Solver Latency: 2.31 ms**.
- 📦 **Continuous Review $(r, Q)$ Inventory Policy:** Integrates Wilson Economic Order Quantity (EOQ) and Gaussian safety stock ($Z_{0.95} = 1.645$). Across a 365-day stochastic simulation: **87.64% total inventory cost reduction**, **99.88% cycle service level**, **98.31% stockout duration reduction**.

### 3. Client & Storefront AI Modules
- 🤖 **FreshBot Conversational Recipe Assistant:** NLP recipe-to-cart parser that converts culinary dishes (*"Paneer Butter Masala"*, *"Alphonso Mango Lassi"*) into in-stock ingredient bundles with 1-click cart addition.
- 🥗 **Nutri-Score & Allergen AI Advisor:** Computes nutritional macro breakdown (Calories, Protein, Carbs, Fat, Fiber), assigns Nutri-Score (A–E) according to French FSA formulas, and suggests allergen-safe swaps (Lactose/Gluten-free).
- 📸 **"Snap Your Fridge & Pantry" Vision AI:** Multimodal image analyzer identifying depleted essentials and recommending tailored replenishments with bundled discounts.
- ⚡ **Dynamic Flash Sale & Expiry Markdown AI:** Mathematical price decay model based on days-to-expiry to eliminate perishable food waste while maximizing clearance revenue.
- 💳 **Fintech Payment Gateway & FreshWallet:** Split-payment engine with dynamic UPI QR generation, live card IIN network detection, and instant zero-fee wallet checkout.

---

## 🏛️ System Architecture

```
                               ┌────────────────────────────────────────────────────────┐
                               │       Client Tier: Progressive Web App (PWA)           │
                               │  Storefront (index.html) • Admin Portal (admin.html)   │
                               └───────────────────────────┬────────────────────────────┘
                                                           │ HTTP / JSON API
                                                           ▼
                               ┌────────────────────────────────────────────────────────┐
                               │   Application Tier: Node.js Express Gateway (Port 3000) │
                               │  • Authentication (JWT & RBAC) • ACID Order Lifecycle   │
                               │  • Cart Pricing & INR Rules   • 14 In-Process Fallbacks│
                               └─────────────┬───────────────────────────┬──────────────┘
                                             │                           │
                   Circuit Breaker (1.5s)    │                           │ SQLite Transaction Layer
                   Sub-25ms REST Gateway     │                           │
                                             ▼                           ▼
┌───────────────────────────────────────────────────────┐   ┌───────────────────────────┐
│     Inference Tier: Python FastAPI (Port 8000)        │   │    Persistence Tier       │
│  • In-Memory Singleton Model Registry                 │   │  • SQLite WASM (WAL Mode) │
│  • Serialized Artifacts (.joblib & .json)             │   │  • 7 Normalized Tables    │
│  • NumPy, SciPy, Pandas, Scikit-Learn, Statsmodels    │   │  • 11,315 Sales Records   │
│  • 2D TSP Solver • CVRP Clarke-Wright Dispatch        │   │  • 83,760 User Events     │
└───────────────────────────────────────────────────────┘   └───────────────────────────┘
```

---

## 📊 Empirical Machine Learning & Optimization Evaluation

All models were evaluated on strict, leak-free chronological holdout datasets and verified against standard baselines:

| Subsystem / Model | Algorithm / Technique | Holdout Dataset | Key Evaluation Results | Latency (p95) |
|---|---|---|---|:---:|
| **Hybrid Recommendations** | User-User CF ($\alpha=0.60$) + Item TF-IDF ($\beta=0.40$) | 20% holdout test set (50 users) | **F1@10: 0.5027** • **Precision@10: 0.7000** • **NDCG@10: 0.9790** | 4.86 ms |
| **Demand Forecasting** | SARIMAX $(1,1,1)\times(1,1,1)_7$ with Promo Regressors | 30-day out-of-sample holdout | **RMSE: 5.83 units** • **MAE: 4.87** • **MAPE: 2.50%** | 4.46 ms |
| **Dynamic Pricing** | Bounded Log-Log OLS Price Elasticity | 11,315 transaction rows | **$E_d = -0.136$ ($p < 0.001$)** • **+22.21% Simulated Revenue Lift** | 9.87 ms |
| **Fraud Risk Scoring** | Cost-Sensitive Random Forest (100 Trees) | Calibrated test set (4,231 orders) | **ROC-AUC: 0.6087** • **Zero synthetic target leakage** | 19.77 ms |
| **Inventory Policy** | Continuous Review $(r, Q)$ + Wilson EOQ | 365-day stochastic simulation | **-87.64% Total Cost** • **99.88% Cycle Service Level** | <1.00 ms |
| **Warehouse Picker Walk** | 2D Euclidean Distance + 2-Opt Local Search | 100 benchmark pick batches | **-37.48% Walk Distance** • **0.09% Gap vs. Exact Solver** | 2.34 ms |
| **Last-Mile Fleet Dispatch**| Capacitated Clarke-Wright Savings + 2-Opt | 100 dispatch instances | **-61.62% Fleet Travel Distance** • **82.9% Capacity Utilization**| 2.31 ms |

---

## 🧪 Comprehensive Multi-Tier Automated Testing (113 / 113 Passed)

The codebase includes an enterprise-grade automated regression test harness comprising **113 test assertions across 7 multi-tier test suites** and a **56-check master full-stack auditor**:

```bash
# Run the complete test matrix (113 assertions)
npm run test:all

# Run individual multi-tier test suites
npm test                   # 1. 10-Agent ML Core System Verification Suite (24 Checks)
npm run test:security      # 2. OWASP Security, Auth & SQLi Immunity Suite (16 Checks)
npm run test:alpha-beta    # 3. Backend Alpha/Beta Concurrency & Load Stress Suite (14 Checks)
npm run test:frontend      # 4. Frontend Synthetic DOM & Localization Suite (10 Checks)
npm run test:enterprise    # 5. Enterprise Mega-Pack Suite (14 Checks)
npm run test:pwa-vision    # 6. Progressive Web App, Vision AI & Payment Gateway Suite (11 Checks)
npm run test:ai            # 7. AI Microservice Gateway & Zero-Downtime Fallback Suite (28 Checks)

# Run full-stack master codebase auditor (44 JS syntax checks + all 7 suites)
node test/master-audit.js
```

| Multi-Tier Test Suite | Test File | Assertions | Status |
|---|---|:---:|:---:|
| **1. 10-Agent ML Core Verification** | `test/deep-verify.js` | 24 | ✅ **24 / 24 PASS (100%)** |
| **2. Security, Auth & SQLi Immunity** | `test/security-safety-test.js` | 16 | ✅ **16 / 16 PASS (100%)** |
| **3. Backend Alpha/Beta Concurrency** | `test/alpha-beta-backend.js` | 14 | ✅ **14 / 14 PASS (100%)** |
| **4. Frontend Synthetic DOM & Localization**| `test/synthetic-frontend-test.js` | 10 | ✅ **10 / 10 PASS (100%)** |
| **5. Enterprise Mega-Pack Suite** | `test/enterprise-features-test.js` | 14 | ✅ **14 / 14 PASS (100%)** |
| **6. PWA, Vision AI & Payment Gateway** | `test/pwa-vision-payment-test.js` | 11 | ✅ **11 / 11 PASS (100%)** |
| **7. AI Microservice & Fallback Resilience**| `test/ai-service-integration-test.js` | 28 | ✅ **28 / 28 PASS (100%)** |
| **Total Test Coverage** | *All 7 Suites* | **113** | ✅ **113 / 113 PASS (100%)** |

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18.x or v20.x LTS ([Download](https://nodejs.org/))
- **Python**: v3.10, v3.11, or v3.12 ([Download](https://www.python.org/))
- **Git**: Installed and configured

### 2. Clone & Install Dependencies
```bash
# 1. Clone repository
git clone https://github.com/Shashikant889/freshcart-ai.git
cd freshcart-ai

# 2. Install Node.js dependencies
npm install

# 3. Set up Python virtual environment
python -m venv .venv

# Activate on Windows PowerShell:
.venv\Scripts\Activate.ps1
# Activate on Linux / macOS:
# source .venv/bin/activate

# 4. Install Python ML dependencies
pip install -r ml/python/requirements.txt
```

### 3. Run the Dual-Tier System
Open two terminal panes:

- **Terminal 1: Node.js Express Application Server (Port 3000):**
  ```bash
  node server.js
  ```
  - *Customer Storefront:* [http://localhost:3000](http://localhost:3000)
  - *Admin Operations Dashboard:* [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

- **Terminal 2: Python FastAPI AI Microservice (Port 8000):**
  ```bash
  .venv\Scripts\python.exe -m ml.service.app
  ```
  - *Interactive Swagger API Docs:* [http://localhost:8000/docs](http://localhost:8000/docs)
  - *Microservice Health Check:* [http://localhost:8000/health](http://localhost:8000/health)

---

## 🔑 Login Credentials

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@freshcart.com` | `admin123` | Full access to Admin KPI Dashboard, SARIMAX Forecasts, Dynamic Pricing, Fraud Anomaly Table, Inventory Alerts, 2D TSP Warehouse Picker Route, CVRP Fleet Dispatch |
| **Demo Customer** | `john@example.com` | `password123` | Storefront PWA, Personalized Recommendations, Bilingual Search, Cart & Checkout |
| **New Customer** | *(Any email)* | *(Any password)* | Click **Register** on the Storefront home view |

---

## 📚 Final Academic Deliverables & Artifacts

All final degree documents are maintained in [`docs/academic/`](docs/academic/):

- 📄 **[Final Black Book (Word DOCX)](docs/academic/FINAL_BLACK_BOOK.docx)**: Full project thesis document (5.74 MB).
- 📑 **[Final Black Book (PDF)](docs/academic/FINAL_BLACK_BOOK.pdf)**: Compiled 36-page PDF matching Mumbai University guidelines (1.80 MB).
- 📊 **[Final Presentation Deck (PPTX)](docs/academic/FINAL_PROJECT_PRESENTATION.pptx)**: 30-slide viva presentation deck (2.38 MB).
- 🗣️ **[Presentation Slide Notes](docs/academic/PRESENTATION_SLIDE_NOTES.md)**: Slide-by-slide speaker notes with spoken scripts and timing.
- 🎬 **[Final Live Demo Script](docs/academic/FINAL_DEMO_SCRIPT.md)**: 13-stage live demonstration walkthrough for examiners.
- ❓ **[Viva Examination Question Bank](docs/academic/VIVA_QUESTION_BANK.md)**: 60+ technical viva questions with detailed model answers.
- 🔒 **[IEEE Reference Lock](docs/academic/FINAL_IEEE_REFERENCE_LOCK.md)**: 15 verified IEEE Xplore citations (2023–2026).
- 🔍 **[Academic Claim Audit](docs/academic/FINAL_ACADEMIC_CLAIM_AUDIT.md)**: Verification of academic claim boundaries.
- 📸 **[Real Application Screenshots (14 Captures)](docs/academic/screenshots/)**: High-resolution PNGs (`SHOT-01` to `SHOT-14`).
- 🖼️ **[Academic Figures & Diagrams (7 Figures)](docs/academic/figures/)**: High-resolution evaluation figures (`fig_7_1` to `fig_7_7`).
- 📋 **[Complete Setup & Handover Guide](INSTRUCTIONS.md)**: Exhaustive workstation setup and testing instructions.

---

## 👨‍💻 Project Team & Department

**Department of Computer Science & Engineering (AIML)**  
**A. P. Shah Institute of Technology (APSIT), Thane**  
*Affiliated to the University of Mumbai (Academic Year 2025–2026)*

- **Student 1:** Shashikant Shukla ([LinkedIn](https://www.linkedin.com/in/shashikant-shukla-935688331/) • [GitHub](https://github.com/Shashikant889))
- **Student 2:** Om Dubey
- **Student 3:** Shreyash Wadalkar
- **Student 4:** [Student 4 Name]

---

## 📜 License
This project is licensed under the **MIT License** — feel free to use and adapt for academic, research, and educational purposes.
