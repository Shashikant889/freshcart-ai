# FreshCart AI: Semester-7 Project Stage Report Blueprint

**Academic Context:** Semester-7 Major Project Stage-1 Submission  
**Department:** Computer Science & Engineering (AIML)  
**Institution:** A.P. Shah Institute of Technology, Thane  
**University:** University of Mumbai (Academic Year 2025–2026)  

---

## 1. Semester-7 Report Section Breakdown

### Section 1: Introduction
- Background of quick-commerce grocery retail and supply chain digitisation.
- Problem context: Perishable spoilage, dark store picking bottlenecks, and dynamic demand fluctuations.
- Project objective overview: Multi-tier AI-driven retail system with 4 ML modules and 3 operations optimizers.

---

### Section 2: Literature Survey
- Structured literature review table with official columns:
  `ID | Year | Authors | Exact IEEE Paper Title | IEEE Venue | IEEE Document No. | DOI | Domain | Method | Dataset | Key Finding | Limitation | Project Relevance`
- Summary of 15 recent IEEE peer-reviewed publications (2023–2026) covering hybrid recommendation, SARIMAX forecasting, dynamic price elasticity, Random Forest fraud scoring, smart inventory $(r, Q)$, warehouse 2D TSP picking, and CVRP vehicle delivery (mapped directly to [docs/academic/VERIFIED_IEEE_LITERATURE_SURVEY.md](file:///c:/Users/shash/demo1/docs/academic/VERIFIED_IEEE_LITERATURE_SURVEY.md)).

---

### Section 3: Limitations of Existing Systems
- Structural fragmentation between customer demand shaping and backend replenishment.
- High computational latency and single-point-of-failure vulnerabilities of monolithic cloud AI.
- Unconstrained algorithmic dynamic pricing leading to customer alienation.

---

### Section 4: Problem Statement, Objectives & Scope
- **Problem Statement:** Formal definition of an integrated, leak-free, and fault-tolerant retail platform.
- **Objectives:** 8 specific functional goals mapped directly to implemented code modules.
- **Scope:** Full-stack prototype covering Customer Storefront PWA, Admin Operations Portal, Python FastAPI microservice, and 7 AI/OR engines.

---

### Section 5: Proposed System Design & UML Modeling
- **5.1 High-Level Architecture Diagram:** (Fig 5.1).
- **5.2 Data Flow Diagrams (DFDs):**
  - DFD Level 0 (Context Diagram - Fig 5.3).
  - DFD Level 1 (Functional Decomposition - Fig 5.4).
- **5.3 Use Case Diagram:** (Fig 5.5).
- **5.4 Activity Diagrams:** Customer purchase flow (Fig 5.6) and autonomous replenishment loop (Fig 5.7).
- **5.5 Sequence Diagrams:** Checkout stock transaction (Fig 5.8), Top-$K$ recommendations (Fig 5.9), and fraud evaluation (Fig 5.10).
- **5.6 Key Algorithm Formulations:**
  - Hybrid Cosine/TF-IDF Collaborative Filtering.
  - $\text{SARIMAX}(1,1,1) \times (1,0,1)_7$ Demand Forecasting.
  - Log-Log OLS Price Elasticity.
  - Cost-Sensitive Random Forest Fraud Classifier.
  - Wilson EOQ & Stochastic Safety Stock ROP.
  - Dark Store 2D TSP Nearest-Neighbor + 2-Opt.
  - Clarke-Wright Savings CVRP Delivery.
- **5.7 Database Entity-Relationship (ER) Diagram:** (Fig 5.12).

---

### Section 6: Experimental Setup
- **Hardware/OS:** Windows 11 x86_64, Multi-Core CPU, 16GB RAM.
- **Software Stack:** Node.js v20.x, Python v3.12, FastAPI, Scikit-Learn, Statsmodels, SQLite.
- **Datasets:** Structured synthetic retail dataset (31 SKUs, 83,760 interactions, 11,315 sales days, 4,231 orders).

---

### Section 7: Project Planning & Gantt Chart
- 8-Month phase allocations, milestone deliverables, Work Breakdown Structure (WBS), and Gantt chart (mapped directly to [docs/academic/PROJECT_PLANNING_MAP.md](file:///c:/Users/shash/demo1/docs/academic/PROJECT_PLANNING_MAP.md)).

---

### Section 8: Expected Outcomes & Preliminary Validation
- **Recommendation:** F1@10 = **0.5027**, NDCG@10 = **0.9790**.
- **Demand Forecasting:** Out-of-sample RMSE = **5.83 units**, MAPE = **2.50%**.
- **Dynamic Pricing:** +22.21% simulated revenue lift under CED.
- **Inventory Cost:** -87.64% total inventory cost reduction, 99.88% service level.
- **Warehouse Walk:** -37.48% walk distance saved.
- **Delivery Fleet Distance:** -61.62% fleet kilometers saved.
- **Test Suite:** 113/113 automated assertions passing across 7 modular test suites.

---

### Section 9: References
- IEEE-style bibliographic citations for all surveyed literature.
