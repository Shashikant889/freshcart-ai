# FreshCart AI: 8-Month Academic Project Planning & Gantt Chart

This document outlines the systematic 8-month development roadmap, Work Breakdown Structure (WBS), and Gantt chart milestones for the **Final-Year Major Capstone Project** (Mumbai University / APSIT Academic Year 2025–2026).

---

## 1. 8-Month Phase Allocation & Roadmap

```
Month 1: Problem Formulation & Literature Survey
Month 2: System Architecture, UX Wireframes & Database Schema Design
Month 3: Full-Stack Grocery Retail Platform & In-Memory Test Infrastructure
Month 4: Offline Python Machine Learning Experimentation Layer
Month 5: ML Validation Audit & Operations Research Benchmarking
Month 6: Two-Tier Microservice Integration & Node.js AI Gateway
Month 7: Comprehensive System QA, Security Hardening & Empirical Latency Benchmarks
Month 8: Final Academic Documentation, Review-1 PPT & Viva Defense Preparation
```

---

## 2. Detailed Work Breakdown Structure (WBS)

### Phase 1: Problem Definition & Literature Survey (Month 1)
- Identify research gaps in retail intelligence fragmentation and delivery logistics.
- Conduct literature review across 15+ peer-reviewed papers on CF, SARIMAX, dynamic pricing, and CVRP.
- Formulate mathematical scope: EOQ, 2D TSP, and Clarke-Wright Savings.
- *Deliverable:* Literature Survey Matrix and Project Synopsis.

### Phase 2: Requirements, Architecture & Data Modeling (Month 2)
- Formulate Software Requirement Specifications (SRS).
- Design relational database schema (`schema.sql`) with 7 core entities.
- Establish DFD Level 0, Level 1, and Entity-Relationship (ER) diagrams.
- Construct PWA design system tokens and mobile wireframes.
- *Deliverable:* System Architecture Document and Initial Database Seed.

### Phase 3: Core Grocery Retail Application Development (Month 3)
- Implement Node.js + Express backend with JWT auth and SQLite/sql.js engine.
- Build Customer Storefront (Catalog, NLP Search, Cart, Checkout, Order Tracking).
- Build Admin Operations Portal (Inventory Management, Live Orders, KPIs).
- Implement ephemeral in-process test harness (`test/test-helper.js`) with 89 automated tests.
- *Deliverable:* Working Full-Stack Retail Platform and passing automated test suite.

### Phase 4: Offline Python ML Experimentation Layer (Month 4)
- Establish modular experimentation framework in `ml/python/`.
- Implement candidate models for:
  - Top-$K$ Recommendations (Popularity, TF-IDF, User-User CF, SVD, Hybrid).
  - Demand Forecasting (Moving Average, OLS, Ridge, GBR, Random Forest, SARIMAX).
  - Price Elasticity (Log-Log OLS, Constant Elasticity of Demand).
  - Fraud Detection (Z-Score Velocity, Logistic Regression, Random Forest, Isolation Forest).
- *Deliverable:* `ml/python/reports/ML_EXPERIMENT_REPORT.md` and serialized model artifacts (`.joblib`).

### Phase 5: ML Audit & Operations Research Benchmarking (Month 5)
- Perform rigorous academic audit for data leakage, synthetic-target contamination, and lookahead bias (`ML_VALIDATION_AUDIT.md`).
- Implement and benchmark operations research optimization modules:
  - Multi-item continuous review $(r, Q)$ inventory optimization (-87.64% cost reduction).
  - Dark store 2D TSP picker walk path optimization with 2-Opt (-37.48% walk distance).
  - Last-mile delivery CVRP with Clarke-Wright Savings (-61.62% fleet distance).
- *Deliverable:* `OPTIMIZATION_EXPERIMENT_REPORT.md` and `OPTIMIZATION_METHODOLOGY.md`.

### Phase 6: Multi-Service Application & AI Gateway Integration (Month 6)
- Develop dedicated Python FastAPI inference microservice (`ml/service/app.py`) with Pydantic schemas.
- Implement singleton model registry loader (`ml/service/model_loader.py`) for sub-second in-memory inference.
- Construct resilient Node.js AI Gateway client (`services/ai-client.js`) with 1.5s circuit timeout.
- Connect live routes (`routes/recommendations.js`, `routes/analytics.js`, `routes/pricing.js`, `routes/supplier.js`, `routes/dispatch.js`).
- Build dynamic Python AI health badge in Admin Dashboard.
- *Deliverable:* `docs/integration/` documentation and `test/ai-service-integration-test.js` (28/28 PASS).

### Phase 7: Final System QA, Hardening & Latency Benchmarks (Month 7)
- Perform end-to-end security and ACID database transaction audit (pre-checkout stock guards).
- Add Express JSON size limits (2MB) and global structured error handling.
- Conduct empirical latency benchmarking across all endpoints (`test/benchmark.js`).
- Achieve 100% pass rate across 7 test suites (113 assertions) and 56 master audit checks.
- *Deliverable:* `docs/testing/FINAL_SYSTEM_QA_REPORT.md` and `docs/testing/PERFORMANCE_REPORT.md`.

### Phase 8: Academic Documentation, Presentation & Defense (Month 8)
- Structure and map Mumbai University / APSIT Major Project Black Book chapters.
- Prepare Review-1 presentation slide deck in concise bullet format.
- Compile mathematical proofs, algorithm pseudocode, and examiner Q&A guide.
- Conduct mock project presentation and defense rehearsals.
- *Deliverable:* Complete Black Book Report, Slide Deck, and Academic Content Map.

---

## 3. Project Gantt Chart Matrix

| Task Name | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | Owner / Lead |
|---|---|---|---|---|---|---|---|---|---|
| **1. Literature Review & Problem Formulation** | ███ | | | | | | | | Full Team |
| **2. Architecture & Database Design** | | ███ | | | | | | | Lead Architect |
| **3. Full-Stack Storefront & Admin Portal** | | | ███ | | | | | | Full-Stack Dev |
| **4. Test Infrastructure Hardening** | | | ███ | | | | | | QA Lead |
| **5. Offline Python ML Experimentation** | | | | ███ | | | | | AI/ML Engineer |
| **6. ML Leakage Audit & Retraining** | | | | | ███ | | | | AI/ML Engineer |
| **7. Operations Optimization (EOQ, TSP, CVRP)**| | | | | ███ | | | | Optimization Lead |
| **8. FastAPI Microservice & AI Gateway** | | | | | | ███ | | | Backend Lead |
| **9. End-to-End System QA & Hardening** | | | | | | | ███ | | QA Lead |
| **10. Empirical Performance Benchmarks** | | | | | | | ███ | | Performance Lead |
| **11. Black Book Report & IEEE Paper** | | | | | | | | ███ | Full Team |
| **12. PPT Slide Deck & Viva Defense Prep** | | | | | | | | ███ | Full Team |
