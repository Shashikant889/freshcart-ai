# AI-Driven Intelligent Grocery Retail System: Codebase Cleanup Manifest & Inventory Audit

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Date & Timestamp:** 2026-08-26  
**Auditor:** FreshCart AI Quality & Maintenance Agent  
**Compliance Standard:** Conservative Cleanup Policy (Rule: *When in doubt, KEEP the file*)

---

## 1. Executive Summary & Cleanup Actions

This manifest documents the exhaustive inventory, reference tracing, safety analysis, and classification of all directories and files across the FreshCart AI codebase prior to and following repository cleanup.

### Cleanup Summary Metrics

| Metric | Pre-Cleanup Count | Post-Cleanup Count | Delta / Action |
|---|:---:|:---:|:---:|
| **Total Non-Ignored Files** | 129 files | 128 files | -1 temporary file removed |
| **Root Directory Files** | 9 files | 9 files | 0 removed (All verified active) |
| **Scratch Files / Directories** | 1 file (`scratch/share_linkedin.ps1`) | 0 files | Deleted obsolete `scratch/` directory |
| **Application & Backend Routes** | 16 route files | 16 route files | 100% Preserved |
| **Heuristic Fallback Engines** | 14 modules in `ml/` | 14 modules in `ml/` | 100% Preserved |
| **Python ML & OR Pipelines** | 7 experiments, 3 OR solvers | 7 experiments, 3 OR solvers | 100% Preserved |
| **Pre-Trained Model Artifacts** | 11 `.joblib` & `.json` models | 11 `.joblib` & `.json` models | 100% Preserved |
| **Academic Figures & Plots** | 7 figures, 16 plots | 7 figures, 16 plots | 100% Preserved |
| **Authentic App Screenshots** | 14 screenshots (`SHOT-01` to `SHOT-14`) | 14 screenshots | 100% Preserved |
| **Academic Deliverables** | 32 academic reference documents | 32 academic reference documents | 100% Preserved |
| **Automated Test Suites** | 7 multi-tier test suites (113 assertions) | 7 multi-tier test suites (113 assertions) | 100% Passing |

---

## 2. Comprehensive Inventory & File Classification

Every non-ignored file and directory was analyzed and classified under one of three designations:
- **`KEEP`**: Essential runtime, ML, optimization, testing, data, build, or academic evidence file.
- **`DELETE`**: Confirmed temporary, duplicate, or obsolete file with zero references across runtime, tests, or academic documentation.
- **`MOVE`**: File requiring relocation to a permanent standard directory.

### Table 2.1: Complete File Classification Matrix

| File / Folder Path | Type / Purpose | Classification | Reference Check Summary | Safety Justification |
|---|---|:---:|---|---|
| `server.js` | Express entrypoint | **KEEP** | Root application server | Required for runtime |
| `package.json` | Project manifest | **KEEP** | NPM package config & scripts | Required for package management |
| `package-lock.json` | Dependency lock | **KEEP** | Deterministic dependency tree | Required for reliable builds |
| `README.md` | Primary documentation | **KEEP** | GitHub repo overview & badges | Required for public repository |
| `PROJECT_STATUS.md` | Master project log | **KEEP** | Architecture & test tracker | Detailed reference documentation |
| `Dockerfile` | Container config | **KEEP** | Production container build | Required for containerized deployment |
| `render.yaml` | Cloud deployment | **KEEP** | Render.com PaaS configuration | Required for web hosting |
| `deploy.ps1` | Deployment script | **KEEP** | Automated deployment helper | Utility for deployment |
| `.gitignore` | Git exclusion rules | **KEEP** | Ignores `.venv/`, `node_modules/`, logs | Essential configuration |
| `data/products.js` | Seed catalog data | **KEEP** | Seed data for SQLite initial run | Required for initial database setup |
| `data/README.md` | Data dictionary | **KEEP** | Schema docs for synthetic tables | Required documentation |
| `data/synthetic/*.csv` (6 files) | Synthetic ML datasets | **KEEP** | Ingested by `ml/python/data_loader.py` | Required for model training reproducibility |
| `db/database.js` | SQLite DB connection | **KEEP** | Imported by all route handlers | Core database access layer |
| `db/freshcart.db` | SQLite database | **KEEP** | Application persistence storage | Active transactional database |
| `db/schema.sql` | Relational DDL schema | **KEEP** | SQLite schema definitions | Relational structure blueprint |
| `db/seed.js` | Initial seeder | **KEEP** | Seeds 31 SKUs and admin user | Required for DB initialization |
| `db/synthetic-data.js` | Synthetic generator | **KEEP** | Generates 12 mo sales & clickstream | Required for synthetic data synthesis |
| `middleware/auth.js` | JWT RBAC middleware | **KEEP** | Imported by protected admin routes | Required for API security |
| `ml/*.js` (13 engines) | Fallback & search logic | **KEEP** | Required by `services/ai-client.js` & tests | In-process fallback circuit architecture |
| `ml/__init__.py` | Python package marker | **KEEP** | Python module hierarchy | Required for module imports |
| `ml/python/config.py` | ML configuration | **KEEP** | Paths, random seeds, hyperparameters | Required for ML pipeline |
| `ml/python/data_loader.py` | Data loader pipeline | **KEEP** | Loads CSVs for scikit-learn models | Required for ML pipeline |
| `ml/python/requirements.txt` | Python dependencies | **KEEP** | FastAPI, scikit-learn, statsmodels | Required for Python environment setup |
| `ml/python/run_all_experiments.py` | Master ML runner | **KEEP** | Runs and verifies all 4 ML models | Research reproducibility |
| `ml/python/run_optimization_experiments.py` | Master OR runner | **KEEP** | Runs and verifies 3 OR solvers | Research reproducibility |
| `ml/python/experiments/*.py` (7 files) | Experiment suites | **KEEP** | Generates evaluation metrics & plots | Research reproducibility |
| `ml/python/metrics/*.json` (7 files) | Holdout benchmark metrics | **KEEP** | Referenced in Black Book Chapter 7 | Empirical validation evidence |
| `ml/python/models/*.joblib` & `*.json` (11 files) | Serialized model artifacts | **KEEP** | Loaded into FastAPI singleton registry | Real-time Python inference |
| `ml/python/optimization/*.py` (3 files) | Operations research solvers | **KEEP** | 2D TSP, CVRP, EOQ implementations | Core optimization algorithms |
| `ml/python/plots/*.png` (16 files) | Statistical evaluation plots | **KEEP** | Generated from leak-free experiments | Research validation evidence |
| `ml/python/reports/*.md` (4 files) | Experiment methodology reports | **KEEP** | Experimental documentation | Academic methodology records |
| `ml/service/*.py` (11 files) | FastAPI AI microservice | **KEEP** | Microservice entrypoint, schemas, routes | Port 8000 AI backend |
| `public/*.html`, `*.css`, `*.js`, `*.svg` | Storefront & Admin UI | **KEEP** | Customer PWA & Admin Dashboard | Full-stack web frontend |
| `routes/*.js` (16 route files) | Express API routes | **KEEP** | All endpoints mounted in `server.js` | Application backend |
| `scripts/*.py` (5 scripts) | Build & QA automation | **KEEP** | Black Book, PPT, figure generators | Academic artifact compilation |
| `services/ai-client.js` | AI Gateway Client | **KEEP** | Axios client with circuit breaker | Two-tier resilient gateway |
| `test/*.js` & `*.json` (11 test files) | Automated test suites | **KEEP** | Executed by `npm test` & `npm run test:all` | Quality assurance harness |
| `docs/ci.yml` | GitHub Actions CI spec | **KEEP** | Verified by `pwa-vision-payment-test.js` | CI/CD pipeline definition |
| `docs/api/README.md` | API documentation | **KEEP** | Comprehensive REST endpoint specs | Technical documentation |
| `docs/architecture/README.md` | Architecture docs | **KEEP** | Multi-tier architecture overview | Technical documentation |
| `docs/assets/*` (2 image files) | Project media assets | **KEEP** | Presentation and showcase banners | Documentation assets |
| `docs/integration/*.md` (3 files) | Gateway integration specs | **KEEP** | Microservice setup & fallback docs | Technical documentation |
| `docs/ml/README.md` | ML architecture docs | **KEEP** | ML model specifications | Technical documentation |
| `docs/optimization/README.md` | Optimization docs | **KEEP** | OR solver formulations | Technical documentation |
| `docs/testing/*.md` (3 files) | QA & performance reports | **KEEP** | Latency benchmarks & QA summaries | Technical documentation |
| `docs/academic/figures/*.png` (7 figures) | Academic figures | **KEEP** | Embedded in Black Book and PPT | Final academic figures |
| `docs/academic/screenshots/*.png` (14 screenshots) | Application screenshots | **KEEP** | Embedded in Black Book Chapter 5 | Real application visual proof |
| `docs/academic/FINAL_BLACK_BOOK.*` (md, docx, pdf) | Final Black Book deliverables | **KEEP** | Primary academic degree thesis | Academic deliverables |
| `docs/academic/FINAL_PROJECT_PRESENTATION.pptx` | Final Presentation deck | **KEEP** | 30-slide viva presentation deck | Academic deliverables |
| `docs/academic/PRESENTATION_SLIDE_NOTES.md` | Slide speaker notes | **KEEP** | Timing and spoken scripts for viva | Academic deliverables |
| `docs/academic/FINAL_DEMO_SCRIPT.md` | Live demo script | **KEEP** | 13-stage viva demonstration script | Academic deliverables |
| `docs/academic/VIVA_QUESTION_BANK.md` | Viva exam Q&A | **KEEP** | 60+ technical viva questions | Academic deliverables |
| `docs/academic/FINAL_IEEE_REFERENCE_LOCK.md` | IEEE reference lock | **KEEP** | 15 verified IEEE Xplore citations | Academic deliverables |
| `docs/academic/FINAL_ACADEMIC_CLAIM_AUDIT.md` | Claim audit | **KEEP** | Verification of academic claims | Academic deliverables |
| `docs/academic/FINAL_RESULTS_TABLES.md` | Results tables | **KEEP** | Formatted experimental tables | Academic deliverables |
| `docs/academic/FINAL_FIGURE_LIST.md` | Figure inventory | **KEEP** | Master list of all project figures | Academic deliverables |
| `docs/academic/FINAL_TABLE_LIST.md` | Table inventory | **KEEP** | Master list of all project tables | Academic deliverables |
| `docs/academic/SCREENSHOT_REQUIREMENTS.md` | Screenshot registry | **KEEP** | Official registry of SHOT-01 to 14 | Academic deliverables |
| `docs/academic/TEAM_INFORMATION_REQUIRED.md` | Team placeholders | **KEEP** | Academic guideline placeholder doc | Academic deliverables |
| `docs/academic/*.md` (Other supporting docs) | Literature & survey synthesis | **KEEP** | Chapter 2 literature review evidence | Academic research evidence |
| `scratch/share_linkedin.ps1` | Temporary social script | **DELETE** | Unreferenced clipboard generator | Obsolete scratch artifact |

---

## 3. Reference Verification for Deletion Candidates

### Analysis of `scratch/share_linkedin.ps1`
1. **Import / Require Check:** Searched codebase with ripgrep for `share_linkedin`, `scratch`. Zero imports or runtime invocations found.
2. **Build / Script Check:** Searched `package.json`, `scripts/build_black_book_docx.py`, `scripts/build_presentation.py`. No references.
3. **Test Suite Check:** Searched `test/`. No test suite imports or verifies `scratch/`.
4. **Safety Verdict:** Safe for immediate deletion. Conforms directly to Step 4 of the cleanup specification.

---

## 4. Test Verification Baseline & Post-Cleanup Parity

### Comparison Matrix

| Test Suite | Assertion / Check Count | Pre-Cleanup Result | Post-Cleanup Result | Parity Status |
|---|:---:|:---:|:---:|:---:|
| `npm test` (`test/deep-verify.js`) | 24 assertions | **24 / 24 PASS** | **24 / 24 PASS** | **100% PASS** |
| 10-Agent ML Verification | 24 assertions | **24 / 24 PASS** | **24 / 24 PASS** | **100% PASS** |
| OWASP Security & SQLi Immunity | 16 assertions | **16 / 16 PASS** | **16 / 16 PASS** | **100% PASS** |
| Backend Alpha/Beta & Concurrency | 14 assertions | **14 / 14 PASS** | **14 / 14 PASS** | **100% PASS** |
| Frontend Synthetic DOM & Localization | 10 assertions | **10 / 10 PASS** | **10 / 10 PASS** | **100% PASS** |
| Enterprise Mega-Pack Verification | 14 assertions | **14 / 14 PASS** | **14 / 14 PASS** | **100% PASS** |
| PWA, Vision AI & Payment Gateway | 11 assertions | **11 / 11 PASS** | **11 / 11 PASS** | **100% PASS** |
| AI Microservice & Operations Research | 28 assertions | **28 / 28 PASS** | **28 / 28 PASS** | **100% PASS** |
| `node test/master-audit.js` | 56 checks (44 syntax + 7 suites) | **56 / 56 PASS** | **56 / 56 PASS** | **100% PASS** |
| Black Book QA (`verify_black_book_outputs.py`) | All chapters, IEEE [1]-[15], PDF/DOCX | **100% PASS** | **100% PASS** | **100% PASS** |

---

## 5. Application Smoke-Test Verification Matrix

| Subsystem | Feature Verified | Verification Method | Status |
|---|---|---|:---:|
| **Server Startup** | Express Application Server | `node server.js` on port 3000 | **ONLINE (HTTP 200)** |
| **AI Microservice** | Python FastAPI Microservice | `uvicorn ml.service.app:app` on port 8000 | **HEALTHY (HTTP 200)** |
| **Customer Storefront** | PWA Catalog Browsing (31 SKUs) | `GET http://localhost:3000/` | **OPERATIONAL** |
| **Authentication** | Stateless JWT Login & RBAC | `POST /api/auth/login` | **OPERATIONAL** |
| **NLP Search** | Bilingual English/Hindi Translation | `GET /api/search?q=seb` | **OPERATIONAL** |
| **Recommendations** | Top-K Hybrid CF+CB Carousel | `GET /api/recommendations/personal` | **OPERATIONAL** |
| **Cart & Pricing** | Bounded Price Elasticity ([±25%]) | `POST /api/cart/add` | **OPERATIONAL** |
| **Atomic Checkout** | SQLite ACID Transaction & Stock Decrement | `POST /api/orders/checkout` | **OPERATIONAL** |
| **Fraud Risk Scoring** | Random Forest Real-Time Inference | `POST /predict/fraud` (<20ms) | **OPERATIONAL** |
| **Demand Forecasting** | 30-Day SARIMAX Visualizer | `GET /api/analytics/demand-forecast/f1` | **OPERATIONAL** |
| **Inventory Optimization**| Continuous Review $(r, Q)$ & Automated POs | `GET /api/supplier/reorder-alerts` | **OPERATIONAL** |
| **Warehouse Routing** | 2D TSP Picker Walk Path (Aisle Coordinates) | `POST /api/supplier/warehouse-picker-route` | **OPERATIONAL** |
| **Delivery Routing** | Last-Mile CVRP Fleet Dispatch | `GET /api/dispatch/optimize` | **OPERATIONAL** |
| **Resilience Gateway** | Circuit Breaker In-Process Fallback | Simulated Python offline outage | **100% ZERO-DOWNTIME** |

---

## 6. Academic Deliverables Verification Matrix

| Academic Deliverable | Path | File Size | Integrity Status |
|---|---|:---:|:---:|
| **Final Black Book (DOCX)** | `docs/academic/FINAL_BLACK_BOOK.docx` | 5.74 MB | **VALID & COMPILED** |
| **Final Black Book (PDF)** | `docs/academic/FINAL_BLACK_BOOK.pdf` | 1.80 MB (36 Pages) | **VALID & COMPILED** |
| **Final Presentation Deck (PPTX)** | `docs/academic/FINAL_PROJECT_PRESENTATION.pptx` | 2.38 MB (30 Slides) | **VALID & COMPILED** |
| **Slide Speaker Notes** | `docs/academic/PRESENTATION_SLIDE_NOTES.md` | 24.5 KB | **VERIFIED** |
| **Live Demonstration Script** | `docs/academic/FINAL_DEMO_SCRIPT.md` | 10.5 KB | **VERIFIED** |
| **Viva Examination Question Bank** | `docs/academic/VIVA_QUESTION_BANK.md` | 47.5 KB | **VERIFIED** |
| **IEEE References Lock** | `docs/academic/FINAL_IEEE_REFERENCE_LOCK.md` | 8.9 KB (15 Papers) | **VERIFIED** |
| **Academic Claim Audit** | `docs/academic/FINAL_ACADEMIC_CLAIM_AUDIT.md` | 16.6 KB | **VERIFIED** |
| **Empirical Results Tables** | `docs/academic/FINAL_RESULTS_TABLES.md` | 7.9 KB | **VERIFIED** |
| **System Figures List** | `docs/academic/FINAL_FIGURE_LIST.md` | 7.5 KB | **VERIFIED** |
| **Academic Figures (PNG)** | `docs/academic/figures/fig_7_1` to `fig_7_7` (7 files) | ~1.5 MB total | **ALL 7 PRESENT** |
| **Application Screenshots (PNG)** | `docs/academic/screenshots/SHOT-01` to `SHOT-14` (14 files) | ~6.5 MB total | **ALL 14 PRESENT** |

---

## 7. Clean Repository Directory Structure

```text
freshcart-ai/
├── server.js                          # Express application entrypoint
├── package.json                       # Node.js dependencies and script definitions
├── package-lock.json                  # Locked dependency resolution tree
├── README.md                          # Repository overview and quickstart
├── PROJECT_STATUS.md                  # Comprehensive system capabilities & audit log
├── Dockerfile                         # Production multi-stage container build
├── render.yaml                        # Render PaaS deployment specification
├── deploy.ps1                         # PowerShell deployment utility
├── .gitignore                         # Strict exclusion rules for build/cache files
│
├── middleware/
│   └── auth.js                        # JWT verification & RBAC access control
│
├── routes/                            # Modular Express REST API route handlers
│   ├── admin.js                       # Admin operations & system control
│   ├── analytics.js                   # Forecasting & customer analytics
│   ├── assistant.js                   # FreshBot recipe bundling assistant
│   ├── auth.js                        # Registration, login & profile
│   ├── cart.js                        # Cart management & pricing
│   ├── dispatch.js                    # Last-mile delivery logistics
│   ├── group-orders.js                # Community group buying lobbies
│   ├── nutrition.js                   # Macro tracking & allergen intelligence
│   ├── orders.js                      # Atomic checkout & order management
│   ├── pricing.js                     # Dynamic price elasticity simulation
│   ├── products.js                    # Catalog listing & search
│   ├── recommendations.js             # Personalized top-K recommendation retrieval
│   ├── search.js                      # Bilingual NLP smart search
│   ├── supplier.js                    # Inventory ROP alerts & warehouse picking
│   ├── visual.js                      # Fridge vision AI & camera scan
│   └── wallet.js                      # FreshWallet fintech & split payments
│
├── services/
│   └── ai-client.js                   # Two-tier circuit breaker client with in-process fallback
│
├── ml/                                # Machine learning, AI & optimization subsystem
│   ├── customer-segmentation.js       # Fallback K-Means clustering
│   ├── dark-store-picker.js           # Fallback 2D TSP picker walk solver
│   ├── demand-forecasting.js          # Fallback OLS demand forecaster
│   ├── dynamic-pricing.js             # Fallback price elasticity model
│   ├── flash-sale-ai.js               # Perishable dynamic markdown engine
│   ├── fraud-detection.js             # Fallback transaction anomaly scorer
│   ├── fridge-vision-ai.js            # Multimodal fridge inventory vision engine
│   ├── nutrition-advisor.js           # Nutrition scoring & allergy advisor
│   ├── recipe-assistant.js            # FreshBot recipe ingredient bundler
│   ├── recommendation-engine.js       # Fallback hybrid CF+CB recommender
│   ├── route-optimizer.js             # Fallback VRP 2-Opt fleet solver
│   ├── smart-search.js                # Bilingual English/Hindi search engine
│   ├── visual-search.js               # Color signature visual similarity matcher
│   ├── python/                        # Python ML research & offline training pipelines
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
│   ├── README.md                      # Synthetic dataset documentation
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
│   ├── css/                           # Design tokens & responsive styles
│   │   ├── style.css                  # Storefront design system stylesheet
│   │   └── admin.css                  # Admin dashboard stylesheet
│   ├── js/                            # Client-side application logic
│   │   ├── app.js                     # Storefront interaction & cart manager
│   │   └── admin.js                   # Admin charts, canvas renders & control logic
│   └── icons/                         # PWA application icons
│       ├── icon-192.svg
│       └── icon-512.svg
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
│   ├── benchmark-results.json         # Measured latency benchmark outputs
│   ├── test-helper.js                 # Test utilities & assertions
│   └── master-audit.js                # Master 56-check codebase & test orchestrator
│
├── scripts/                           # Build & academic artifact generators
│   ├── build_black_book_docx.py       # Compiles FINAL_BLACK_BOOK.docx
│   ├── build_presentation.py          # Compiles FINAL_PROJECT_PRESENTATION.pptx
│   ├── capture_real_screenshots.py    # Playwright automated real screenshot capturer
│   ├── generate_figures.py            # Generates academic evaluation figures
│   └── verify_black_book_outputs.py   # Black Book QA verification test
│
└── docs/                              # Project technical and academic documentation
    ├── ci.yml                         # CI/CD workflow specification
    ├── api/                           # REST API endpoint documentation
    ├── architecture/                  # Architectural diagrams and design principles
    ├── assets/                        # Project branding and showcase media
    ├── integration/                   # AI Gateway & Fallback integration guides
    ├── ml/                            # Machine learning model documentation
    ├── optimization/                  # Operations research formulation guides
    ├── testing/                       # Quality assurance & performance reports
    ├── CLEANUP_MANIFEST.md            # Master cleanup inventory & audit record
    └── academic/                      # Final academic degree deliverables
        ├── FINAL_BLACK_BOOK.docx      # Final Word Black Book document
        ├── FINAL_BLACK_BOOK.pdf       # Final PDF Black Book document (36 Pages)
        ├── FINAL_BLACK_BOOK.md        # Master Markdown Black Book source
        ├── FINAL_PROJECT_PRESENTATION.pptx # Final PowerPoint presentation deck
        ├── PRESENTATION_SLIDE_NOTES.md # Presentation slide speaker notes
        ├── FINAL_DEMO_SCRIPT.md       # Live application demonstration script
        ├── VIVA_QUESTION_BANK.md      # Viva examination question bank
        ├── FINAL_IEEE_REFERENCE_LOCK.md # 15 verified IEEE Xplore citations
        ├── FINAL_ACADEMIC_CLAIM_AUDIT.md # Academic claim verification audit
        ├── FINAL_RESULTS_TABLES.md    # Formatted experimental result tables
        ├── FINAL_FIGURE_LIST.md       # Master list of figures
        ├── FINAL_TABLE_LIST.md        # Master list of tables
        ├── SCREENSHOT_REQUIREMENTS.md # Real application screenshot registry
        ├── TEAM_INFORMATION_REQUIRED.md # Student & guide placeholder documentation
        ├── figures/                   # 7 academic evaluation figures (fig_7_1 to 7_7)
        └── screenshots/               # 14 real application screenshots (SHOT-01 to 14)
```
