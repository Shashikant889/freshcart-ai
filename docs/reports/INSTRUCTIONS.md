# FreshCart AI: Complete Setup, Execution & Handover Instructions

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Department:** Computer Science & Engineering (AIML), A. P. Shah Institute of Technology  
**Affiliated University:** University of Mumbai (Academic Year 2025–2026)  
**Version:** 2.0.0 (Production & Academic Release)

---

## 1. System Requirements & Prerequisites

Ensure the following runtimes are installed on your workstation:
- **Node.js:** v18.x or v20.x LTS ([Download Node.js](https://nodejs.org/))
- **Python:** v3.10, v3.11, or v3.12 64-bit ([Download Python](https://www.python.org/))
- **Git:** (Optional, for version control)
- **Web Browser:** Google Chrome, Microsoft Edge, or Firefox

---

## 2. Step-by-Step Installation

### Step 2.1: Install Node.js Application Dependencies
Open a terminal in the project root directory and run:
```bash
npm install
```

### Step 2.2: Set Up Python Virtual Environment & ML Dependencies
In the same terminal (or a new terminal pane):

**On Windows (PowerShell):**
```powershell
# 1. Create virtual environment
python -m venv .venv

# 2. Activate virtual environment
.venv\Scripts\Activate.ps1

# 3. Install Python machine learning libraries
pip install -r ml/python/requirements.txt
```

**On Linux / macOS:**
```bash
# 1. Create virtual environment
python3 -m venv .venv

# 2. Activate virtual environment
source .venv/bin/activate

# 3. Install Python machine learning libraries
pip install -r ml/python/requirements.txt
```

---

## 3. Starting the Two-Tier System

FreshCart AI runs as a synchronized two-tier architecture:

### 🔹 Terminal 1: Node.js Express Application Server (Port 3000)
Handles customer web traffic, admin operations, cart pricing, and SQLite database transactions.
```bash
node server.js
```
- **Storefront App:** [http://localhost:3000](http://localhost:3000)
- **Admin & ML Management Dashboard:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

### 🔹 Terminal 2: Python FastAPI Inference Microservice (Port 8000)
Hosts pre-warmed serialized machine learning models (SARIMAX, Hybrid CF+CB, Log-Log Elasticity, Random Forest Fraud Detection, and Operations Research Solvers) in an in-memory singleton registry.
```bash
# Windows
.venv\Scripts\python.exe -m ml.service.app

# Linux / macOS
.venv/bin/python -m ml.service.app
```
- **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Microservice Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

> **Note on High Availability & Fallback:**  
> If the Python microservice is stopped, the Express server's built-in **Circuit Breaker** (`services/ai-client.js`) automatically trips within 1.5 seconds and falls back to in-process Node.js heuristic engines (`ml/*.js`) with zero 500 errors.

---

## 4. Default Login Credentials

| Role | Email Address | Password | Permissions / Capabilities |
|---|---|---|---|
| **Administrator** | `admin@freshcart.com` | `admin123` | Full access to Admin KPI Dashboard, 30-Day Demand Forecasting, Dynamic Pricing Sandbox, Fraud Scoring Table, Stock Alerts, 2D TSP Warehouse Picker Route, CVRP Fleet Dispatch |
| **Demo Customer** | `john@example.com` | `password123` | Customer Storefront PWA, Personalized Recommendations, Bilingual Search, Cart & Checkout |
| **New Customer** | *(Any email)* | *(Any password)* | Click **Register** on the Storefront home view |

---

## 5. Directory Structure & Key Files

```text
freshcart-ai/
│
├── server.js                          # Express application entrypoint (Port 3000)
├── package.json                       # Node.js dependencies and script definitions
├── package-lock.json                  # Deterministic dependency lockfile
├── README.md                          # Repository overview and setup guide
├── INSTRUCTIONS.md                    # This complete setup and handover guide
├── PROJECT_STATUS.md                  # Comprehensive technical capabilities ledger
│
├── routes/                            # 16 Modular Express REST API route handlers
│   ├── admin.js                       # Admin operations & analytics
│   ├── analytics.js                   # Forecasting & customer segments
│   ├── assistant.js                   # FreshBot recipe ingredient bundler
│   ├── auth.js                        # JWT authentication & profile
│   ├── cart.js                        # Cart management & pricing
│   ├── dispatch.js                    # Last-mile delivery logistics (CVRP)
│   ├── group-orders.js                # Community group buying lobbies
│   ├── nutrition.js                   # Macro tracking & allergen intelligence
│   ├── orders.js                      # Atomic checkout & order management
│   ├── pricing.js                     # Dynamic price elasticity simulation
│   ├── products.js                    # Catalog listing & search
│   ├── recommendations.js             # Personalized top-K recommendation retrieval
│   ├── search.js                      # Bilingual NLP smart search
│   ├── supplier.js                    # Inventory ROP alerts & warehouse picking (2D TSP)
│   ├── visual.js                      # Fridge vision AI & camera scan
│   └── wallet.js                      # FreshWallet fintech & split payments
│
├── services/
│   └── ai-client.js                   # Two-tier circuit breaker client with in-process fallback
│
├── ml/                                # Machine learning, AI & optimization subsystem
│   ├── *.js                           # 14 Node heuristic fallback engines
│   ├── python/                        # Offline training, experiments, models & OR solvers
│   │   ├── config.py                  # ML configuration & seed parameters
│   │   ├── data_loader.py             # Data loader & preprocessing utilities
│   │   ├── requirements.txt           # Python library dependencies
│   │   ├── run_all_experiments.py     # Master experiment execution runner
│   │   ├── run_optimization_experiments.py # Master OR solver runner
│   │   ├── experiments/               # 7 rigorous leak-free experiment scripts
│   │   ├── metrics/                   # 7 JSON benchmark evaluation results
│   │   ├── models/                    # 11 serialized .joblib & .json model artifacts
│   │   ├── optimization/              # 3 operations research heuristic modules
│   │   ├── plots/                     # 16 high-resolution academic evaluation plots
│   │   └── reports/                   # 4 detailed methodology & audit reports
│   └── service/                       # High-performance FastAPI inference microservice (Port 8000)
│       ├── app.py                     # FastAPI application router & lifecycle
│       ├── config.py                  # Service configuration
│       ├── model_loader.py            # In-memory singleton model registry
│       ├── schemas.py                 # Pydantic validation schemas
│       ├── test_service.py            # Microservice self-test suite
│       └── *_service.py               # Dedicated domain inference handlers
│
├── data/                              # Seed data and synthetic training records
│   ├── products.js                    # Seed catalog definition (31 SKUs)
│   └── synthetic/                     # 6 CSV training datasets (sales, interactions, orders)
│
├── db/                                # SQLite relational persistence layer
│   ├── database.js                    # Database connection wrapper & transaction manager
│   ├── freshcart.db                   # Active SQLite relational database file
│   ├── schema.sql                     # Relational schema DDL definition
│   ├── seed.js                        # Database initial seeder
│   └── synthetic-data.js              # Synthetic dataset generation engine
│
├── public/                            # Client-side Progressive Web Application (PWA)
│   ├── index.html                     # Customer storefront application interface
│   ├── admin.html                     # Admin management & analytics dashboard
│   ├── manifest.json                  # PWA Web App Manifest
│   ├── sw.js                          # Service Worker offline caching engine
│   ├── css/                           # Storefront (style.css) & Admin (admin.css) styles
│   └── js/                            # Storefront (app.js) & Admin (admin.js) logic
│
├── test/                              # Comprehensive multi-tier test harness
│   ├── deep-verify.js                 # 10-Agent core system verification suite
│   ├── security-safety-test.js        # OWASP security & SQLi immunity suite
│   ├── alpha-beta-backend.js          # API functional & load concurrency suite
│   ├── synthetic-frontend-test.js     # Synthetic DOM & localization test suite
│   ├── enterprise-features-test.js    # Enterprise mega-pack verification suite
│   ├── pwa-vision-payment-test.js     # PWA, Vision AI & Payment Gateway suite
│   ├── ai-service-integration-test.js # AI microservice & fallback resilience suite
│   ├── benchmark.js                   # Endpoint latency performance benchmarking
│   └── master-audit.js                # Master 56-check codebase & test orchestrator
│
├── scripts/                           # Automation scripts
│   ├── build_black_book_docx.py       # Compiles FINAL_BLACK_BOOK.docx
│   ├── build_presentation.py          # Compiles FINAL_PROJECT_PRESENTATION.pptx
│   ├── capture_real_screenshots.py    # Playwright automated real screenshot capturer
│   ├── generate_figures.py            # Generates academic evaluation figures
│   └── verify_black_book_outputs.py   # Black Book QA verification test
│
└── docs/academic/                     # Final Academic Degree Deliverables
    ├── FINAL_BLACK_BOOK.docx          # Final Word Black Book document (5.74 MB)
    ├── FINAL_BLACK_BOOK.pdf           # Final PDF Black Book document (1.80 MB, 36 Pages)
    ├── FINAL_BLACK_BOOK.md            # Master Markdown Black Book source
    ├── FINAL_PROJECT_PRESENTATION.pptx # Final PowerPoint presentation deck (2.38 MB, 30 Slides)
    ├── PRESENTATION_SLIDE_NOTES.md    # Slide-by-slide speaker notes for viva
    ├── FINAL_DEMO_SCRIPT.md           # 13-stage live demonstration walkthrough
    ├── VIVA_QUESTION_BANK.md          # 60+ technical viva questions and model answers
    ├── FINAL_IEEE_REFERENCE_LOCK.md   # 15 verified IEEE Xplore citations (2023–2026)
    ├── FINAL_ACADEMIC_CLAIM_AUDIT.md  # Academic claim verification audit
    ├── FINAL_RESULTS_TABLES.md        # Formatted experimental result tables
    ├── FINAL_FIGURE_LIST.md           # Master list of figures
    ├── FINAL_TABLE_LIST.md            # Master list of tables
    ├── SCREENSHOT_REQUIREMENTS.md     # Real application screenshot registry
    ├── figures/                       # 7 academic evaluation figures (fig_7_1 to 7_7)
    └── screenshots/                   # 14 real application screenshots (SHOT-01 to 14)
```

---

## 6. Automated Testing & Verification Commands

To verify full system health, run the following test commands:

### 1. Core 10-Agent Verification Suite (24 Checks)
```bash
npm test
```
*Validates database integrity, JWT auth, bilingual search, cart rules, transaction ACID safety, and all 12 ML/OR heuristic engines.*

### 2. All 7 Multi-Tier Test Suites (113 Assertions)
```bash
npm run test:all
```
*Executes the complete test matrix:*
- 10-Agent ML Verification Suite (24/24)
- OWASP Security & SQL Injection Immunity Suite (16/16)
- Backend Alpha/Beta API & Concurrency Stress Suite (14/14)
- Frontend Synthetic DOM & Localization Suite (10/10)
- Enterprise Mega-Pack Suite (14/14)
- PWA, Vision AI & Payment Gateway Suite (11/11)
- AI Microservice & Fallback Resilience Suite (28/28)

### 3. Master Codebase Auditor (56 Checks)
```bash
node test/master-audit.js
```
*Performs syntax compilation checks on all 44 JavaScript source files and orchestrates all 7 test suites.*

### 4. Black Book Quality Assurance Verification
```bash
python scripts/verify_black_book_outputs.py
```
*Verifies all 8 chapters, 15 IEEE citations, and academic safety rules across the generated DOCX and PDF deliverables.*

---

## 7. Recompiling Documents & Retraining Models (If Needed)

### To Recompile the Black Book Word Document & PDF:
```bash
python scripts/build_black_book_docx.py
python -c "from docx2pdf import convert; convert('docs/academic/FINAL_BLACK_BOOK.docx', 'docs/academic/FINAL_BLACK_BOOK.pdf')"
```

### To Recompile the PowerPoint Presentation Deck:
```bash
python scripts/build_presentation.py
```

### To Retrain Machine Learning Models & Reproduce Experiment Plots:
```bash
# Run all 4 ML experiments
python ml/python/run_all_experiments.py

# Run all 3 Operations Research benchmarks
python ml/python/run_optimization_experiments.py
```

### To Re-capture All 14 Live Application Screenshots:
Ensure Node server (Port 3000) and Python FastAPI (Port 8000) are running, then execute:
```bash
python scripts/capture_real_screenshots.py
```

---

## 8. Common Troubleshooting & FAQs

### Q1: Port 3000 or Port 8000 is already in use
- **Find process on Port 3000 / 8000 (Windows PowerShell):**
  ```powershell
  Get-NetTCPConnection -LocalPort 3000, 8000 | Select-Object OwningProcess
  Stop-Process -Id <PID> -Force
  ```

### Q2: PowerShell says `Execution of scripts is disabled on this system`
- **Solution:** Run this command once in PowerShell:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```

### Q3: How do I demonstrate microservice fault tolerance during the viva exam?
1. Open the Storefront ([http://localhost:3000](http://localhost:3000)).
2. Stop the Python microservice (`Ctrl+C` in Terminal 2).
3. Search for items or checkout on the Storefront.
4. Show that the Node.js Express server automatically falls back to in-process heuristic algorithms (`ml/*.js`) with zero 500 errors.

---

## 9. Academic Project Summary

- **Students:** Shashikant Shukla, Om Dubey, Shreyash Wadalkar, and [Student 4]
- **Guide:** [Project Guide Name and Title]
- **Institution:** A. P. Shah Institute of Technology (APSIT), Thane
- **Key Modules:**
  1. *Customer Storefront PWA:* 31 SKUs, Bilingual English/Hindi search, FreshBot Recipe AI
  2. *Hybrid Recommendations:* Collaborative Filtering + TF-IDF (F1@10: 0.5027, NDCG@10: 0.9790)
  3. *SARIMAX Demand Forecasting:* 30-Day forecast (RMSE: 5.83 units, MAPE: 2.50%)
  4. *Log-Log Dynamic Pricing:* Price elasticity ($E_d = -0.136$), +22.21% simulated revenue lift
  5. *Random Forest Fraud Detection:* Real-time risk scoring (<20ms, ROC-AUC: 0.6087)
  6. *Inventory Optimization:* Continuous Review $(r, Q)$ policy (87.64% cost reduction)
  7. *Warehouse Picker 2D TSP:* Nearest-Neighbor + 2-Opt (37.48% walk distance saved)
  8. *Last-Mile CVRP Fleet Dispatch:* Clarke-Wright Savings + 2-Opt (61.62% fleet distance saved)
  9. *Two-Tier Fault-Tolerant AI Gateway:* 1.5s circuit breaker with sub-25ms response
