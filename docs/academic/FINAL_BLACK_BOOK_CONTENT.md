# AI-Driven Intelligent Grocery Retail System: Master Black Book Academic Content Index & Source Registry

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Department:** Computer Science & Engineering (Artificial Intelligence & Machine Learning)  
**Institution:** A.P. Shah Institute of Technology (APSIT), Thane  
**Affiliated University:** University of Mumbai (Academic Year 2025–2026)  
**Reference Document:** [`docs/academic/FINAL_BLACK_BOOK.md`](file:///c:/Users/shash/demo1/docs/academic/FINAL_BLACK_BOOK.md)  

---

## 1. Chapter-by-Chapter Architectural & Evidence Mapping

### Front Matter & Academic Declarations
- **Title Page & Certificates:** Standard University of Mumbai & APSIT templates ([`FINAL_BLACK_BOOK.md#title-page`](file:///c:/Users/shash/demo1/docs/academic/FINAL_BLACK_BOOK.md)).
- **Identity Placeholders:** Documented in [`docs/academic/TEAM_INFORMATION_REQUIRED.md`](file:///c:/Users/shash/demo1/docs/academic/TEAM_INFORMATION_REQUIRED.md).
- **Abstract & Keywords:** 280 words detailing 7 subsystems, two-tier architecture, and empirical gains.

---

### Chapter 1: Introduction
- **1.1 Background:** Quick-commerce retail landscape, dark stores, 10–30 min delivery windows.
- **1.2 Motivation:** Perishable spoilage ($15–25\%$), razor-thin margins ($2–5\%$), dark-store picking bottlenecks.
- **1.3 Evolution of Retail AI:** Shift from static POS logging to synchronized predictive/prescriptive engines.
- **1.4 Problem Context:** Sub-25ms web latency SLA, microservice resilience, leak-free validation.
- **1.5 Project Overview:** Storefront PWA, Admin Portal, Node.js Gateway, Python FastAPI microservice.
- **1.6 Need for System:** Interconnecting customer demand shaping directly with back-end procurement and fulfillment.
- **1.7 Functional Objectives:** 8 formal engineering objectives ([`FINAL_BLACK_BOOK.md#17-functional-and-technical-objectives`](file:///c:/Users/shash/demo1/docs/academic/FINAL_BLACK_BOOK.md)).
- **1.8 Scope & Boundaries:** In-scope full-stack software harness vs out-of-scope physical warehouse robotics.
- **1.9 Contributions & Novelty:** Clear academic demarcation between foundational standard algorithms and architectural integration novelties ([`docs/academic/OUR_CONTRIBUTION.md`](file:///c:/Users/shash/demo1/docs/academic/OUR_CONTRIBUTION.md)).
- **1.10 Organization of Report:** Summary of Chapters 2 through 8.

---

### Chapter 2: Literature Survey
- **2.1 Overview:** 15 verified IEEE Xplore indexed papers published between 2023 and 2026 ([`docs/academic/FINAL_IEEE_REFERENCE_LOCK.md`](file:///c:/Users/shash/demo1/docs/academic/FINAL_IEEE_REFERENCE_LOCK.md)).
- **2.2 Comparative Matrix Table:** Full comparative table (Table 2.1) formatted as `Year | Title | Domain | Algorithm | Dataset | Key Result | Research Gap`.
- **2.3 Detailed Domain Analysis:**
  - *Recommendation:* Hybrid CF + Content Sentiment (Smachylo `[1]`, Bodduluri `[2]`, Li `[3]`).
  - *Demand Forecasting:* Weather/Calendar DL & ML on Retail Stores (Qureshi `[4]`, Kheawpeam `[5]`, Poongothai `[6]`).
  - *Dynamic Pricing:* Econometric Elasticity Sandboxes & Revenue (Kumari `[7]`, Karunakaran `[8]`).
  - *Fraud Detection:* Random Forest Ensembles & Imbalanced Classification (Raut `[9]`, Mienye `[10]`).
  - *Operations Research & Logistics:* Unified Retail, Dark Store Picking, & CVRP (Singhal `[11]`, Chavan `[12]`, de Assis `[13]`, Nugroho `[14]`, Xiao `[15]`).

---

### Chapter 3: Existing System & Limitations
- **3.1 Literature Limitations:** Subtle data leakage in time-series and fraud benchmarks, deep learning compute latency ($>100\text{ ms}$), unconstrained dynamic pricing instability.
- **3.2 Conventional Retail Limitations:** Disconnected software silos, sequential warehouse walking waste ($>30\%$), uncoordinated vehicle dispatching ($<40\%$ utilization), cloud AI single-point-of-failure risks.
- **3.3 Identified Research Gap:** Lack of an integrated, leak-free, zero-downtime architecture combining predictive ML and combinatorial OR within sub-25ms edge latencies.

---

### Chapter 4: Problem Statement, Objectives and Scope
- **4.1 Formal Problem Statement:** Formally defined in Chapter 4.1.
- **4.2 Traceability Matrix:** Table 4.1 linking OBJ-1 through OBJ-8 to implemented code files and verified metrics.
- **4.3 Scope & Operating Boundaries:** Clear boundary specification.
- **4.4 Out-of-Scope Elements:** Clarifying academic project constraints.

---

### Chapter 5: Proposed System & Technical Architecture (Major Chapter)
- **5.1 Overview:** High-level system topology.
- **5.2 Architecture & DFDs:** Fig 5.1 (High-Level Architecture), Fig 5.3 (DFD Level 0), Fig 5.4 (DFD Level 1).
- **5.3 Customer Storefront Module:** Progressive Web App ([`public/index.html`](file:///c:/Users/shash/demo1/public/index.html), [`public/js/app.js`](file:///c:/Users/shash/demo1/public/js/app.js)).
- **5.4 Admin Operations Module:** Admin Dashboard ([`public/admin.html`](file:///c:/Users/shash/demo1/public/admin.html), [`public/js/admin.js`](file:///c:/Users/shash/demo1/public/js/admin.js)).
- **5.5 Authentication & RBAC:** Bcrypt + JWT stateless claims ([`middleware/auth.js`](file:///c:/Users/shash/demo1/middleware/auth.js)).
- **5.6 Product Management:** 31 seeded SKUs, 2D coordinates, category tags.
- **5.7 Order Lifecycle & ACID Transactions:** Pre-checkout stock verification & rollback ([`routes/orders.js`](file:///c:/Users/shash/demo1/routes/orders.js), Fig 5.8).
- **5.9 Demand Forecasting:** Recursive $\text{SARIMAX}(1,1,1)\times(1,0,1)_7$ with calendar/promo regressors (Fig 5.14).
- **5.10 Dynamic Pricing:** Log-Log OLS price elasticity ($E_d$) with $[\pm 25\%]$ safety clipping (Fig 5.15).
- **5.11 Fraud Detection:** Cost-sensitive Random Forest risk classifier (Fig 5.16).
- **5.12 Inventory Optimization:** Continuous Review $(r, Q)$ with Wilson EOQ & Gaussian safety stock (Fig 5.17).
- **5.13 Warehouse Picking:** Dark-store 2D TSP Nearest-Neighbor + 2-Opt local search (Fig 5.18).
- **5.14 Delivery Logistics:** Capacitated Vehicle Routing (CVRP) Clarke-Wright Savings + 2-Opt (Fig 5.19).
- **5.15 Python AI Service:** FastAPI in-memory model registry daemon on port 8000 ([`ml/service/app.py`](file:///c:/Users/shash/demo1/ml/service/app.py), Fig 5.20).
- **5.16 Node.js AI Gateway:** Asynchronous non-blocking dispatcher with 1.5s circuit breaker ([`services/ai-client.js`](file:///c:/Users/shash/demo1/services/ai-client.js), Fig 5.2).
- **5.17 Fallback Architecture:** In-process Node.js heuristic fallback modules ([`ml/*.js`](file:///c:/Users/shash/demo1/ml/), Fig 5.21).
- **5.18 Relational Database:** SQLite 7-table schema, Entity-Relationship Diagram (Fig 5.12, Table 5.2).
- **5.19 API Architecture:** Standardized REST DTO specifications (Table 5.3).
- **5.20 Security & Hardening:** SQLi parameterized query immunity, body limit defenses, error sanitization.
- **5.21 Complexity Analysis:** Formal time and space complexity matrix for all 7 subsystems (Table 5.1).

---

### Chapter 6: Experimental Setup & Methodology
- **6.1 Hardware Configuration:** Local development host specification (Table 6.1).
- **6.2 Software Stack:** Node.js v20.x, Python v3.12, SQLite, FastAPI, Scikit-Learn, Statsmodels (Table 6.2).
- **6.3 Dataset Provenance:** 31 SKUs, 83,760 interactions, 11,315 sales records, 4,231 orders (Table 6.3).
- **6.4 Anti-Leakage Protocol:** Chronological splitting, recursive prediction feeding, synthetic feature auditing.
- **6.5 Experimental Scenarios:** 7 operational scenarios (Scenarios A through G).
- **6.6 Formal Evaluation Metrics:** Mathematical definitions for all 14 empirical evaluation metrics.

---

### Chapter 7: Results and Discussion (Authoritative Ground Truth)
- **7.1 Recommendations:** F1@10 = **0.5027**, NDCG@10 = **0.9790**, Precision@10 = **0.9760** (Table 7.1).
- **7.2 Demand Forecasting:** Out-of-sample RMSE = **5.83 units**, MAPE = **2.50%** (Table 7.2, Fig 7.1).
- **7.3 Dynamic Pricing:** Significant elasticity ($p < 0.001$), **+22.21% simulated revenue lift** (Table 7.3, Fig 7.2).
- **7.4 Fraud Detection:** ROC-AUC = **0.6087**, Recall = **0.3864** with zero leakage (Table 7.4, Fig 7.3).
- **7.5 Inventory Optimization:** **-87.64% annual cost reduction**, **99.88% cycle service level** (Table 7.5, Fig 7.4).
- **7.6 Warehouse Picking:** **-37.48% walk distance saved**, 0.09% gap vs exact in 2.34ms (Table 7.6, Fig 7.5).
- **7.7 Delivery Routing:** **-61.62% fleet travel saved**, vehicle capacity utilization = **82.9%** (Table 7.7, Fig 7.6).
- **7.8 System Performance & Latency:** All endpoints $< 25\text{ ms}$ (p95) (Table 7.8, Fig 7.7).
- **7.9 Automated Test Suite:** **113/113 assertions passing (100%)**, **56/56 master audit checks passing** (Table 7.9).
- **7.10 Ablation Studies:** Detailed component-level gain verification.

---

### Chapter 8: Conclusion & Future Work
- **8.1 Objective Fulfillment:** Formal review of OBJ-1 through OBJ-8.
- **8.2 Technical Contributions:** Architectural synergy, fault-tolerant gateway, leak-free validation.
- **8.3 Limitations:** Synthetic data provenance, single-host local environment, simulation assumptions.
- **8.4 Future Scope:** Multi-agent reinforcement learning pricing, AMR dark-store picking, dynamic real-time CVRP.

---

### References & Appendices
- **References:** 15 verified IEEE Xplore peer-reviewed publications (2023–2026) with active DOIs.
- **Appendix A:** Standardized REST API DTO contracts.
- **Appendix B:** Core mathematical pseudocode.
- **Appendix C:** Relational SQLite Schema DDL (`schema.sql`).
- **Appendix D:** Automated test suite execution audit log.
