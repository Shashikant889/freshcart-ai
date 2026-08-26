# FreshCart AI: Major Project Review-1 Presentation Slide-by-Slide Blueprint

**Format Guidelines (Official APSIT Specifications):**
- Concise bullet points only (strictly NO wall-of-text paragraphs).
- High visual emphasis with architectural and mathematical clarity.
- Minimum font size equivalent: 18–24pt for body, 32–40pt for titles.
- Total Slides: 24.

---

## Slide 1: Title Slide
- **Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning
- **Degree:** Bachelor of Engineering in Computer Science & Engineering (AIML)
- **Institution:** A.P. Shah Institute of Technology, Thane (Affiliated to University of Mumbai)
- **Academic Year:** 2025–2026
- **Team Members:**
  - `[STUDENT_1_NAME]` (`[STUDENT_1_MOODLE_ID]`)
  - `[STUDENT_2_NAME]` (`[STUDENT_2_MOODLE_ID]`)
  - `[STUDENT_3_NAME]` (`[STUDENT_3_MOODLE_ID]`)
  - `[STUDENT_4_NAME]` (`[STUDENT_4_MOODLE_ID]`)
- **Project Guide:** `[PROJECT_GUIDE_NAME_AND_TITLE]`

---

## Slide 2: Presentation Outline
- Introduction & Problem Motivation
- Literature Survey & Identified Research Gap
- Problem Statement, Objectives & Scope
- Proposed Multi-Tier System Architecture
- Machine Learning & Operations Research Methodology
- Experimental Setup & Empirical Results
- Performance Benchmarks & Fault-Tolerant Fallback
- Project Planning & Roadmap
- Conclusion & References

---

## Slide 3: Introduction & Retail Context
- Rapid expansion of quick-commerce (10–30 minute grocery delivery).
- Grocery retailing operates on razor-thin margins (2–5%) and high perishable spoilage (15–25%).
- Demands real-time synchronization between front-end customer demand and back-end dark store operations.
- **FreshCart AI:** An end-to-end intelligent retail platform integrating 4 ML engines with 3 Operations Research optimizers.

---

## Slide 4: Real-World Motivation & Industry Inefficiencies
- **Inventory Mismatch:** Inaccurate forecasts cause stockouts (lost sales) or overstocking (expired goods).
- **Dark Store Bottlenecks:** Manual order picking leads to worker fatigue and delayed 10-min dispatch.
- **Last-Mile Delivery Costs:** Urban traffic and suboptimal fleet routing inflate per-drop logistics costs.
- **Static Pricing Deficit:** Inability to dynamically adjust prices based on perishable shelf-life and demand elasticity.

---

## Slide 5: Literature Survey Matrix (Recent IEEE 2023–2026)
- Summary of 15 verified IEEE Xplore indexed peer-reviewed publications:
  - *Recommendation:* Hybrid CF + Content Sentiment (Smachylo 2024 `[1]`, Bodduluri 2024 `[2]`, Li 2023 `[3]`).
  - *Demand Forecasting:* Exogenous Deep Learning & ML (Qureshi 2024 `[4]`, Kheawpeam 2023 `[5]`, Poongothai 2024 `[6]`).
  - *Dynamic Pricing:* Bounded Elasticity & Revenue Strategy (Kumari 2024 `[7]`, Karunakaran 2024 `[8]`).
  - *Fraud Detection:* Random Forest & Cost-Sensitive Learning (Raut 2024 `[9]`, Mienye 2024 `[10]`).
  - *Smart Retail & Logistics:* Multi-Tier Systems, 2D TSP, & CVRP (Singhal 2024 `[11]`, Chavan 2025 `[12]`, de Assis 2024 `[13]`, Nugroho 2025 `[14]`, Xiao 2024 `[15]`).

---

## Slide 6: Existing System Limitations
- **Intelligence Fragmentation:** Recommendation, forecasting, pricing, and routing exist as disconnected silos.
- **Academic Data Leakage:** Published models frequently suffer from lookahead bias and temporal shuffle leakage.
- **Fragile Cloud Dependency:** Outages in third-party AI APIs bring down the entire checkout storefront.
- **Runaway Pricing Risks:** Unconstrained reinforcement learning pricing generates consumer-unfriendly price spikes.

---

## 7. Slide 7: Identified Research Gap
- Lack of a **unified, full-stack open architecture** linking:
  - Personalized Demand Shaping $\leftrightarrow$ Automated ROP Replenishment $\leftrightarrow$ Dark Store TSP $\leftrightarrow$ CVRP Delivery.
- Absence of **sub-25ms zero-downtime resilient gateways** capable of seamless in-process fallback during microservice downtime.

---

## Slide 8: Problem Statement
> *"To design, develop, and benchmark an integrated, resilient, and leak-free AI-driven grocery retail system that combines personalized recommendation, time-series demand forecasting, econometric dynamic pricing, and real-time transaction fraud detection with mathematical inventory, warehouse, and delivery optimization under a zero-downtime microservice architecture."*

---

## Slide 9: Project Objectives & Scope
- **Key Objectives:**
  1. Build leak-free ML models for recommendations, demand forecasting, pricing, and fraud detection.
  2. Implement mathematical algorithms for continuous review $(r, Q)$, dark store 2D TSP, and fleet CVRP.
  3. Establish a two-tier Node.js $\leftrightarrow$ Python FastAPI architecture with 1.5s circuit fallback.
  4. Develop interactive Storefront PWA and Admin Operations Analytics dashboards.
- **Scope:** Full-stack enterprise prototype for local and edge retail execution.

---

## Slide 10: Proposed System Architecture (High-Level)
- *Visual:* Architecture Diagram (Fig 5.1).
- **Client Layer:** Storefront PWA (Customer) & Admin Portal (Store Operations).
- **Application Layer (Node.js):** REST API Gateway, JWT Authentication, ACID SQLite Database.
- **AI Microservice Layer (Python FastAPI):** In-memory singleton model registry executing ML & OR solvers.
- **Persistence Layer:** Relational SQLite schema with 7 core tables.

---

## Slide 11: Two-Tier AI Gateway & Resilient Fallback Design
- *Visual:* AI Circuit & Fallback Diagram (Fig 5.2 / 5.21).
- **Normal Operation:** Node.js dispatches non-blocking async HTTP requests to FastAPI (Port 8000).
- **Circuit Breaker:** 1500ms timeout threshold.
- **Outage Scenario:** Node.js catches connection failure and immediately activates in-process heuristic engines (`ml/*.js`).
- **Guarantee:** **Zero 500 errors, zero UI blocking, 100% store uptime**.

---

## Slide 12: AI/ML Methodology: Personalization & Forecasting
- **Top-$K$ Hybrid Recommendation:**
  - Combines User-User Cosine Collaborative Filtering ($\alpha = 0.60$) with Content-Based TF-IDF Item Similarity.
  - Formulated on strict chronological interaction splits (80% train / 20% holdout).
- **Time-Series Demand Forecasting:**
  - $\text{SARIMAX}(1,1,1) \times (1,0,1)_7$ with day-of-week and promotional exogenous regressors.
  - Multi-step recursive forecasting without lookahead ground-truth leakage.

---

## Slide 13: AI/ML Methodology: Pricing & Fraud Detection
- **Econometric Dynamic Pricing:**
  - Log-Log Ordinary Least Squares (OLS) estimating Price Elasticity of Demand ($E_d = \beta_1$).
  - Bounded optimal price $P^* \in [0.75 P_{\text{base}}, 1.25 P_{\text{base}}]$ to safeguard consumer trust.
- **Transaction Fraud Anomaly Detection:**
  - Cost-sensitive Random Forest Classifier on normalized velocity and basket features.
  - Evaluated on realistic noisy transactions with synthetic attack traps.

---

## Slide 14: Operations Research: Inventory Optimization
- **Continuous Review $(r, Q)$ Policy:**
  - **Economic Order Quantity:** $Q^* = \sqrt{\frac{2 D S}{H}}$
  - **Stochastic Safety Stock:** $SS = Z_{\alpha} \sqrt{L \sigma_D^2 + D^2 \sigma_L^2} \quad (Z_{0.95} = 1.645)$
  - **Reorder Point:** $ROP = (D \cdot L) + SS$
- Automatically triggers prioritized Purchase Orders (POs) when stock crosses ROP.

---

## Slide 15: Operations Research: Warehouse TSP & CVRP Delivery
- **Dark Store 2D TSP Picker Optimization:**
  - Models dark store aisles as a 2D Euclidean coordinate graph.
  - Nearest-Neighbor greedy construction + intra-tour 2-Opt local search improvement.
- **Last-Mile Delivery CVRP:**
  - Clarke-Wright Savings heuristic: $s_{ij} = d(D, i) + d(D, j) - d(i, j)$ subject to vehicle capacity ($25\text{ kg}$).

---

## Slide 16: Database & Data Architecture
- *Visual:* Entity-Relationship (ER) Diagram (Fig 5.12).
- **Core Entities:** `users`, `products`, `orders`, `order_items`, `cart_items`, `sales_history`, `user_interactions`.
- **Integrity:** ACID transactions enforce atomic order placement and non-negative inventory updates.

---

## Slide 17: Experimental Setup & Datasets
- **Hardware/OS:** Windows 11 x86_64, Multi-Core CPU, 16GB RAM.
- **Software Stack:** Node.js v20.x, Python v3.12, FastAPI, Scikit-Learn, Statsmodels, SQLite.
- **Dataset Scale:** 31 SKUs, 83,760 interactions, 11,315 daily sales logs, 4,231 order transactions.

---

## Slide 18: Empirical Results: Machine Learning Models
- **Recommendation:** Hybrid CF+CB achieved **F1@10 = 0.5027**, **NDCG@10 = 0.9790** (P@10: 0.9760).
- **Demand Forecasting:** SARIMAX achieved out-of-sample **RMSE = 5.83 units**, **MAPE = 2.50%**.
- **Dynamic Pricing:** Statistically significant elasticities ($p < 0.001$), **+22.21% simulated revenue lift**.
- **Fraud Detection:** Random Forest achieved **ROC-AUC = 0.6087**, **Recall = 0.3864** without leakage.

---

## Slide 19: Empirical Results: Operations Optimization
- **Inventory Cost:** ₹796,250 $\to$ ₹98,394 (**-87.64% Cost Reduction**, **-98.3% Stockouts**, 99.88% Service Level).
- **Warehouse Walk:** 9,685 m $\to$ 6,055 m (**-37.48% Walking Distance Saved**, 0.09% gap vs exact).
- **Delivery Travel:** 14,502 km $\to$ 5,566 km (**-61.62% Fleet Distance Saved**, 82.9% Utilization).

---

## Slide 20: Performance & Latency Benchmarks
- *Visual:* Latency Benchmark Chart.
- Node.js Catalog Browse: **3.67 ms**
- Node.js Recommendations Gateway: **7.90 ms**
- Python SARIMAX Forecast: **4.46 ms**
- Python 2D TSP Picker: **2.34 ms**
- Python CVRP Delivery: **2.31 ms**
- **All endpoints respond in under 25ms (p95).**

---

## Slide 21: Key Contributions & Technical Novelty
1. **End-to-End Synergy:** First open prototype synchronizing customer ML demand shaping with physical dark store picking and delivery.
2. **Methodological Rigor:** Zero-leakage temporal benchmarking eliminating academic over-optimism.
3. **High-Resilience Edge Architecture:** Sub-1.5s circuit breaker with 100% in-process fallback coverage.
4. **Comprehensive Test Suite:** 113 automated test assertions and 56 master audit checks passing at 100%.

---

## Slide 22: Conclusion & Future Work
- **Conclusion:** Successful delivery of a stable, production-grade, and academically defensible intelligent grocery retail platform.
- **Future Scope:**
  - Multi-agent deep reinforcement learning for competitive market pricing.
  - Multi-depot dynamic CVRP with electric vehicle charging stops.
  - Automated Mobile Robot (AMR) dark store physical picking.

---

## Slide 23: References (Verified IEEE 2023–2026)
- [1] P. Smachylo and L. Zhuravchak, "Enhancing Recommender Systems: A Hybrid Approach," in *Proc. IEEE CSIT*, 2024.
- [2] K. C. Bodduluri et al., "Exploring the Landscape of Hybrid Recommendation Systems in E-Commerce," *IEEE Access*, 2024.
- [3] N. U. H. Qureshi et al., "Demand Forecasting in Supply Chain Management for Rossmann Stores," *IEEE Access*, 2024.
- [4] A. Kumari and S. M. Kumar, "Dynamic Pricing: Trends, Challenges and New Frontiers," in *Proc. IEEE InC4*, 2024.
- [5] R. Raut et al., "Credit Card Fraud Detection Using Ensemble Modeling," in *Proc. IEEE OTCON*, 2024.
- [6] K. Singhal et al., "Smart Retail: Utilizing ML for Demand, Price, and Inventory," in *Proc. IEEE CICN*, 2024.
- [7] R. F. de Assis et al., "Optimising Warehouse Order Picking: Real Case Application," *IEEE Access*, 2024.
- [8] E. Nugroho and G. Girsang, "Three-Layer Multi-Objective VRP Solver with 2-opt," in *Proc. IEEE ICE3IS*, 2025.

---

## Slide 24: Thank You & Viva Defense Q&A
- **Questions & Discussion**
- *Project Demonstrations Available:* Storefront PWA, Admin Operations Portal, Python AI Microservice, Latency Benchmarks.
