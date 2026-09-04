# 🌿 AI-Driven Intelligent Grocery Retail System Using Machine Learning

> **A Production-Grade, Full-Stack AI-Native Grocery Retail Platform with Real-Time ML Inference & Combinatorial Logistics Optimization**  
> *Scales to 10,000 Products across 108 Categories, 150,000 Users, and Real-Time Dark Store Fulfillment*  
> *B.E. CSE (Artificial Intelligence & Machine Learning) Major Project — A. P. Shah Institute of Technology, University of Mumbai*

[![CI Build](https://github.com/Shashikant889/freshcart-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Shashikant889/freshcart-ai/actions)
[![Playwright Tests](https://img.shields.io/badge/Playwright%20E2E-62%2F62%20Passing-success.svg?logo=playwright&logoColor=white)](test/playwright-e2e.js)
[![Automated Tests](https://img.shields.io/badge/Full%20Test%20Matrix-244%2F244%20Passing%20(100%25)-brightgreen.svg)](docs/COMPLETE_PROJECT_RECORD.md)
[![Docker](https://img.shields.io/badge/Docker%20%26%20Compose-Ready-blue.svg?logo=docker&logoColor=white)](docker-compose.yml)
[![Render Deploy](https://img.shields.io/badge/Render-1--Click%20Deploy-46E3B7.svg?logo=render&logoColor=white)](DEPLOYMENT.md)
[![Node.js](https://img.shields.io/badge/Node.js-v18%20%7C%20v20-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Microservice-FastAPI%200.111-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Express](https://img.shields.io/badge/Backend-Express.js%204.19-blue.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

---

## 📚 Documentation Sitemap & Technical Specifications

| Document | File Link | Focus & Coverage |
|---|---|---|
| 📋 **Complete Project Master Record** | [`COMPLETE_PROJECT_RECORD.md`](COMPLETE_PROJECT_RECORD.md) | Exhaustive 41 KB chronicle of all features, 5 Pinnacle AI models, UI revamp, and 244/244 test suite |
| 🚀 **Deployment & DevOps Guide** | [`DEPLOYMENT.md`](DEPLOYMENT.md) | Step-by-step instructions for Git, GitHub, Docker containers, and 1-click Render cloud deployment |
| 🏛️ **System Architecture** | [`docs/ARCHITECTURE_CURRENT.md`](docs/ARCHITECTURE_CURRENT.md) | Dual-tier microservice architecture, complete request/data flow, circuit breaker, and directory roles |
| 📜 **IEEE Major Research Report** | [`docs/IEEE_Project_Report.md`](docs/IEEE_Project_Report.md) | Full IEEE double-column capstone research manuscript with empirical benchmarks |
| 🎓 **Mumbai University Black Book** | [`docs/academic/FINAL_BLACK_BOOK.md`](docs/academic/FINAL_BLACK_BOOK.md) | Official APSIT / University of Mumbai Major Project dissertation |
| 🔒 **Locked IEEE References (2023–2026)** | [`docs/academic/FINAL_IEEE_REFERENCE_LOCK.md`](docs/academic/FINAL_IEEE_REFERENCE_LOCK.md) | 15 peer-reviewed IEEE Xplore indexed papers locked without citation drift |
| 🎤 **Viva Examination Guide** | [`docs/ACADEMIC_VIVA_AND_PANEL_DEFENSE_GUIDE.md`](docs/ACADEMIC_VIVA_AND_PANEL_DEFENSE_GUIDE.md) | Top 30 examiner questions with mathematical proofs and architecture defense notes |

---

## 📖 Project Overview

The **AI-Driven Intelligent Grocery Retail System Using Machine Learning** (**FreshCart AI**) is a dual-tier, full-stack intelligent grocery retail and operations research platform engineered for modern 10-minute quick-commerce dark stores. The platform unites customer-facing quick-commerce features (dynamic Bayesian bandit hero promotions, sequential transformer trajectory recommendations, bilingual NLP search, French FSA Nutri-Score analysis, and multimodal fridge vision) with backend fulfillment intelligence (PyTorch LSTM demand forecasting, star-schema OLAP with MapReduce stream processing, Bellman Q-learning perishable inventory control, 2D TSP dark store warehouse picking, and CVRP fleet dispatch).

---

## 🎨 Customer Storefront: World-Class UI & Aesthetics

The customer storefront (`http://localhost:3000/`) features an enterprise-grade design system:
- **Dual Day Mode / Night Mode System**:
  - **Day Mode (`body.light-theme`)**: Organic porcelain canvas (`#f8fafc`), crisp card borders (`#e2e8f0`), soft shadows, and WCAG AAA deep slate typography (`#0f172a`, `#334155`).
  - **Night Mode (Dark Theme - Default)**: Deep space obsidian (`#080c14`), neon glow reflections, and glassmorphism blurs (`backdrop-filter: blur(16px)`).
  - Smooth animated Sun/Moon toggle button (`#theme-toggle-btn`), persisted in `localStorage.freshcart_theme`.
- **5 Curated Luxury Accent Palettes**:
  - 🌿 **Emerald Green** (`[data-accent="emerald"]`): Fresh quick-commerce green.
  - 💎 **Sapphire Blue** (`[data-accent="sapphire"]`): High-velocity modern blue.
  - 🍇 **Amethyst Violet** (`[data-accent="amethyst"]`): Luxury organic violet.
  - 🍊 **Sunset Amber** (`[data-accent="amber"]`): Gourmet warm citrus amber.
  - 🍓 **Ruby Berry** (`[data-accent="ruby"]`): Vivid antioxidant berry crimson.
  - Interactive dropdown selector (`#accent-picker-btn`), persisted in `localStorage.freshcart_accent`.
- **5-Language Internationalization (i18n)**:
  - Built-in multi-language dictionary for 🇺🇸 English, 🇮🇳 हिंदी (Hindi), 🇪🇸 Español (Spanish), 🇫🇷 Français (French), and 🇩🇪 Deutsch (German).
  - Instantaneous DOM translation via `data-i18n` attributes and interactive selector (`#lang-toggle-btn`), persisted in `localStorage.freshcart_lang`.
- **Real-Time Notification Center Drawer**:
  - Header bell icon (`#notification-bell-btn`) with pulsing red unread counter badge (`#notification-badge`).
  - Slide-out drawer (`#notification-center-drawer`) with tabs (**All**, **Orders**, **Deals**, **Smart Fridge**), unread highlight borders, "Mark all as read", "Clear all", and time-ago timestamps.

---

## 🧠 Pinnacle AI, Machine Learning & Operations Research

| Subsystem | Algorithm / Formulation | Core Metric / Achievement | Status |
|---|---|---|:---:|
| **Big Data Analytics (BDA)** | Columnar In-Memory Star-Schema (125k events) + Distributed MapReduce Stream Processing | Sub-millisecond aggregation across 5,040 cell lattice | ✅ Verified |
| **Perishable Inventory RL** | Bellman Optimality Q-Learning Agent ($s, a, R(s,a)$) pre-trained across 2,500 simulation episodes | **-77.5% Spoilage Reduction** (18.2% $\to$ 4.1%), **98.7% Service Level** | ✅ Verified |
| **Sequential Transformer (SASRec)** | Multi-Head Self-Attention with Causal Masking ($\text{softmax}(\frac{QK^T}{\sqrt{d}} + M)V$) | Real-time storefront basket tray + dynamic attention heatmap | ✅ Verified |
| **Product Knowledge Graph (PKG)** | Heterogeneous Multi-Relational Graph (21 entities, 25 semantic edges) | 2D force-directed canvas + multi-hop allergen-safe substitutions | ✅ Verified |
| **Bayesian Multi-Armed Bandit (MAB)** | Beta-Bernoulli Conjugate Priors with Thompson Sampling ($\mathcal{O}(\log T)$ regret) | Dynamic storefront promotional hero with 1-click reward feedback | ✅ Verified |
| **Deep Learning Demand LSTM** | PyTorch 2-Layer Multivariate LSTM (40 training epochs) | **8.35% Holdout Test WAPE** (RMSE 1.84, MAE 1.41) | ✅ Verified |
| **Grounded Hybrid RAG** | BM25 + Dense Semantic Retrieval with Reciprocal Rank Fusion ($k=60$) & OWASP defense | Grounded answers with citations over verified policy corpus | ✅ Verified |
| **Dark Store Warehouse Picker** | 2D Euclidean Distance Matrix + Nearest Neighbor + 2-Opt Local Search | **37.48% Walk Distance Reduction** (0.09% gap vs exact solver) | ✅ Verified |
| **Last-Mile Delivery Dispatch** | Capacitated Vehicle Routing Problem (CVRP) Clarke-Wright Savings + 2-Opt | **61.62% Fleet Mileage Reduction**, 82.9% vehicle utilization | ✅ Verified |
| **Continuous Review Inventory** | $(r, Q)$ Policy + Stochastic Safety Stock Reorder Point ($ROP = \bar{d} L + Z \sigma_d \sqrt{L}$) | **87.64% Total Holding Cost Reduction**, 99.88% service level | ✅ Verified |

---

## 🏛️ System Architecture

```
                              ================================================
                              UNIFIED PORTAL: http://localhost:3000/
                              ================================================
                                                     │
                 ┌───────────────────────────────────┴───────────────────────────────────┐
                 ▼                                                                       ▼
    Node.js Express Server (Port 3000)                              Python FastAPI Microservice (Port 8000)
    ├─ Single Page App (Customer, Orders, Admin)                    ├─ 1. BDA Columnar Star-Schema OLAP (125k events)
    ├─ Day/Night Theme & 5-Accent Palette Engine                    ├─ 2. Autonomous RL Perishable Inventory (Q-Policy)
    ├─ 5-Language Internationalization (i18n)                       ├─ 3. SASRec Multi-Head Self-Attention (QK^T / √d)
    ├─ Real-Time Notification Center Drawer                         ├─ 4. Heterogeneous Product Knowledge Graph (PKG)
    ├─ Resilient Gateway Client (services/ai-client.js)             ├─ 5. Bayesian Multi-Armed Bandit (Thompson Sampling)
    ├─ RESTful Endpoints (17 Modular Express Routes)                ├─ 6. PyTorch 2-Layer Multivariate Demand LSTM
    ├─ In-Memory WebAssembly SQLite DB (sql.js)                      ├─ 7. Grounded RAG with Reciprocal Rank Fusion
    └─ In-Process Autonomous Heuristic Fallbacks                    ├─ 8. 5-Channel Computer Vision & Smart Fridge AI
                                                                    ├─ 9. Microeconomic Dynamic Price Elasticity
                                                                    ├─ 10. Random Forest Fraud Scoring & Anomaly
                                                                    ├─ 11. Continuous Review (r, Q) EOQ / ROP Solver
                                                                    ├─ 12. 2D Euclidean TSP Warehouse Picker Optimizer
                                                                    └─ 13. Capacitated Vehicle Routing (CVRP) Dispatcher
```

---

## 🧪 Comprehensive Automated Testing Suite (244 Assertions — 100% Passing)

The repository features 10 automated test suites executed on every continuous integration run:

| Test Suite | Command | Assertions | Result |
| :--- | :--- | :---: | :---: |
| **Playwright Real Browser E2E** | `npm run test:playwright` | 62 | **62 / 62 PASSED (100%)** ✅ |
| **Pinnacle AI Capabilities** | `npm run test:pinnacle` | 14 | **14 / 14 PASSED (100%)** ✅ |
| **AI/ML Integration Suite** | `test/ai-service-integration-test.js` | 44 | **44 / 44 PASSED (100%)** ✅ |
| **Unified Application Hardening** | `test/unified-app-hardening-test.js` | 35 | **35 / 35 PASSED (100%)** ✅ |
| **10-Agent Deep Verification** | `npm test` | 24 | **24 / 24 PASSED (100%)** ✅ |
| **Security & Safety Audit** | `npm run test:security` | 16 | **16 / 16 PASSED (100%)** ✅ |
| **Alpha/Beta Concurrency Stress** | `npm run test:alpha-beta` | 14 | **14 / 14 PASSED (100%)** ✅ |
| **Enterprise Features Suite** | `npm run test:enterprise` | 14 | **14 / 14 PASSED (100%)** ✅ |
| **PWA, Vision & Payment Suite** | `npm run test:pwa-vision` | 11 | **11 / 11 PASSED (100%)** ✅ |
| **Synthetic Frontend DOM Audit** | `npm run test:frontend` | 10 | **10 / 10 PASSED (100%)** ✅ |
| **TOTAL VERIFIED ASSERTIONS** | `npm run test:all` | **244** | **244 / 244 PASSED (100%)** ✅ |

---

## 🚀 Quick Start & Deployment

### Option 1: Local Single-Command Launch (Unified Dev Server)
Runs both Node.js Express (port 3000) and the Python FastAPI microservice (port 8000) concurrently:
```bash
# Clone and install dependencies
git clone https://github.com/Shashikant889/freshcart-ai.git
cd freshcart-ai
npm install

# Start unified development server
node scripts/dev-start.js
```
- 🛒 **Customer Storefront:** `http://localhost:3000/`
- 📊 **Admin AI Intelligence Suite:** `http://localhost:3000/admin`
- 🧠 **Python FastAPI Swagger UI:** `http://localhost:8000/docs`

### Option 2: Docker & Docker Compose
```bash
# Build and run the dual-microservice container network
docker compose up --build -d
```

### Option 3: Deploy to Render.com (1-Click)
1. Fork or push to your GitHub.
2. On [Render Dashboard](https://dashboard.render.com/), click **New +** $\to$ **Blueprint**.
3. Select your repository: `Shashikant889/freshcart-ai`.
4. Render automatically configures the Node service with `healthCheckPath: /api/health` via [`render.yaml`](render.yaml).

For complete deployment details, consult [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## 🔑 Login Credentials

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@freshcart.com` | `admin123` | Full access to Admin KPI Dashboard, BDA OLAP Cube, Q-Learning Inventory Simulator, SASRec Heatmap, PKG Canvas, MAB Console, 2D TSP Picker, and CVRP Fleet Dispatch |
| **Demo Customer** | `john@example.com` | `password123` | Storefront PWA, Day/Night Theme, 5 Accent Palettes, 5-Language i18n, Notification Center, Cart, FreshWallet, and Live Order Tracking |
| **New Customer** | *(Any email)* | *(Any password)* | Self-service registration via Storefront modal |

---

## 📜 License & Academic Affiliation

This project was developed by the Department of Computer Science & Engineering (AIML) at **A. P. Shah Institute of Technology (APSIT)**, University of Mumbai.  
Licensed under the **MIT License**.
