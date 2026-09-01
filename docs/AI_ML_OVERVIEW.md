# FreshCart AI — Machine Learning & Operations Research Overview

This document provides a comprehensive technical reference for all predictive machine learning models, econometric estimators, and combinatorial operations research algorithms active in **FreshCart AI**.

Every module is dual-implemented:
1. **Python / FastAPI Tier (`ml/service/`, `ml/python/`):** High-throughput microservice utilizing NumPy, SciPy, Scikit-Learn, and Statsmodels.
2. **Node.js Gateway In-Process Tier (`ml/*.js`):** Fully deterministic native JavaScript fallback engines guaranteeing zero downtime if the external microservice is unreachable.

---

## 1. Top-K Hybrid Recommendation Engine

### Purpose
Generates personalized product recommendations for active shoppers by balancing historical individual affinity against item content similarity, addressing both discovery and the cold-start challenge.

- **Inputs:** User ID, interaction history (views, cart adds, purchases from `user_interactions` table), catalog item feature matrix (`category`, `dietary_tags`, `brand`, `price`).
- **Processing:**
  1. Computes User-User Collaborative Filtering cosine similarity matrix across interaction vectors:
     $$\text{sim}(u, v) = \frac{\mathbf{r}_u \cdot \mathbf{r}_v}{\|\mathbf{r}_u\|_2 \|\mathbf{r}_v\|_2}$$
  2. Constructs TF-IDF item representations and computes pairwise item cosine similarity:
     $$\text{sim}_{\text{item}}(i, j) = \frac{\mathbf{t}_i \cdot \mathbf{t}_j}{\|\mathbf{t}_i\|_2 \|\mathbf{t}_j\|_2}$$
  3. Fuses scores using weighted linear interpolation ($\alpha = 0.60$ collaborative, $\beta = 0.40$ content-based):
     $$S(u, i) = \alpha \cdot S_{\text{CF}}(u, i) + \beta \cdot S_{\text{CB}}(u, i)$$
  4. Ranks items descending and excludes already purchased SKUs unless marked as recurring grocery staples.
- **Algorithm:** Hybrid User-User Collaborative Filtering + TF-IDF Vector Space Cosine Similarity.
- **Output:** Ordered array of Top-$K$ product objects with item ID, score, title, thumbnail, and price.
- **Implementation:**
  - Python: [`ml/service/recommendation_service.py`](../ml/service/recommendation_service.py), [`ml/python/experiments/recommendation_experiment.py`](../ml/python/experiments/recommendation_experiment.py)
  - Node.js Fallback: [`ml/recommendation-engine.js`](../ml/recommendation-engine.js)
- **API Endpoint:** `GET /api/recommendations/personal?limit=6` (Optional User JWT)
- **Fallback Behavior:** If user interaction history $< 3$ events or Python microservice is offline, falls back to popularity-weighted category top-sellers.
- **Current Limitations:** Static $\alpha / \beta$ weighting; offline model re-training required for new SKU indexing.
- **Verified Evaluation Metrics (50-User Leak-Free Holdout):**
  - **P@5:** 0.992 | **P@10:** 0.976
  - **R@5:** 0.175 | **R@10:** 0.341
  - **F1@5:** 0.296 | **F1@10:** 0.502
  - **NDCG@5:** 0.993 | **NDCG@10:** 0.981
  - **HitRate@10:** 1.000 | **Inference Latency:** 4.86 ms

---

## 2. 30-Day Time-Series Demand Forecasting

### Purpose
Forecasts daily SKU consumption up to 30 days into the future to guide automated replenishment purchase orders, prevent out-of-stock events, and avoid perishable overstock.

- **Inputs:** Daily chronological sales history (units sold, unit price, promotion flags, day-of-week).
- **Processing:**
  1. Aggregates transactions into an equidistant daily time series per SKU.
  2. Applies 7-day differencing to stabilize non-stationary seasonal components:
     $$\Delta_7 y_t = y_t - y_{t-7}$$
  3. Estimates autoregressive (AR) and moving average (MA) polynomials with promotional exogenous regressors.
  4. Generates mean point forecasts alongside 95% Gaussian prediction intervals ($\hat{y}_t \pm 1.96 \cdot \hat{\sigma}$).
- **Algorithm:** Autoregressive Integrated Moving Average with Exogenous Regressors: $\text{SARIMAX}(1,1,1)\times(1,0,1)_7$.
- **Output:** Array of future timestamps with projected unit demand, lower bound, and upper bound.
- **Implementation:**
  - Python: [`ml/service/demand_service.py`](../ml/service/demand_service.py), [`ml/python/models/best_demand_forecasting_model.joblib`](../ml/python/models/best_demand_forecasting_model.joblib)
  - Node.js Fallback: [`ml/demand-forecasting.js`](../ml/demand-forecasting.js) (Ordinary Least Squares with 7-day cyclical seasonality factors)
- **API Endpoint:** `GET /api/analytics/demand-forecast/:productId` (Admin JWT / Public preview)
- **Fallback Behavior:** Local OLS regression with day-of-week multiplier.
- **Current Limitations:** Assumes stationary variance; sudden regional macro shocks require manual adjustment.
- **Verified Evaluation Metrics (30-Day Out-of-Sample Holdout):**
  - **Mean Absolute Error (MAE):** 4.87 units
  - **Root Mean Squared Error (RMSE):** 5.83 units
  - **Mean Absolute Percentage Error (MAPE):** 2.50%
  - **Inference Latency:** 4.46 ms

---

## 3. Econometric Dynamic Pricing & Price Elasticity Optimizer

### Purpose
Models category-level customer price sensitivity to compute optimal selling prices ($P^*$) that maximize expected revenue while enforcing strict consumer protection guardrails.

- **Inputs:** Historical transaction log (quantity demanded $Q$, unit price $P$, promotional discounts, brand tier).
- **Processing:**
  1. Fits a log-log regression model to estimate constant price elasticity of demand ($E_d$):
     $$\ln(Q) = \beta_0 + E_d \ln(P) + \epsilon$$
  2. Identifies elasticity regime ($|E_d| < 1$ inelastic vs $|E_d| > 1$ elastic).
  3. Solves the first-order revenue maximization derivative:
     $$R(P) = P \cdot Q(P) = P \cdot e^{\beta_0} P^{E_d} \implies \frac{dR}{dP} = 0$$
  4. Bounds suggested price $P^*$ within strict $[\pm 25\%]$ safety guardrails relative to baseline MRP.
- **Algorithm:** Bounded Log-Log Ordinary Least Squares (OLS) Regression.
- **Output:** Elasticity coefficient $E_d$, $p$-value, $R^2$, optimal price $P^*$, and simulated revenue lift curve.
- **Implementation:**
  - Python: [`ml/service/pricing_service.py`](../ml/service/pricing_service.py), [`ml/python/models/price_elasticity_model.joblib`](../ml/python/models/price_elasticity_model.joblib)
  - Node.js Fallback: [`ml/dynamic-pricing.js`](../ml/dynamic-pricing.js)
- **API Endpoints:**
  - `GET /api/pricing/elasticity/:productId`
  - `POST /api/pricing/simulate`
- **Fallback Behavior:** Native JavaScript analytical solver using moving covariance between log-price and log-demand.
- **Current Limitations:** Cross-price elasticity between substitute products is modeled within the same subcategory only.
- **Verified Evaluation Metrics (11,315 Transaction Rows):**
  - **Price Elasticity ($E_d$):** $-0.136$ ($p < 0.001$, Inelastic grocery baseline)
  - **Simulated Revenue Lift:** $+22.21\%$ under bounded optimization
  - **Inference Latency:** 9.87 ms

---

## 4. Real-Time Transaction Fraud Detection

### Purpose
Identifies anomalous ordering behavior (bulk scalping, automated bot purchasing, unusual order velocity, credential abuse) during checkout to minimize chargebacks and inventory hoarding.

- **Inputs:** Order total, item count, user order velocity (orders in last 60 minutes), device fingerprint, payment method, delivery distance.
- **Processing:**
  1. Computes feature vector $\mathbf{x} = [\text{amount}, \text{velocity}, \Delta t, \text{is\_new\_user}, \text{items\_count}]$.
  2. Normalizes numerical features against user historical baseline ($Z$-score calculation):
     $$Z = \frac{x - \mu}{\sigma}$$
  3. Evaluates class probability using cost-sensitive ensemble trees calibrated against class imbalance.
  4. Triggers progressive interventions: Low Risk (Allow), Medium Risk (Require OTP/Verification), High Risk (Block & Flag).
- **Algorithm:** Cost-Sensitive Random Forest Classifier (100 Decision Trees) + Rule-Based Velocity Heuristics.
- **Output:** Fraud probability $[0.0, 1.0]$, Risk Category (`low`, `medium`, `high`), flagged indicators list.
- **Implementation:**
  - Python: [`ml/service/fraud_service.py`](../ml/service/fraud_service.py), [`ml/python/models/best_fraud_detection_model.joblib`](../ml/python/models/best_fraud_detection_model.joblib)
  - Node.js Fallback: [`ml/fraud-detection.js`](../ml/fraud-detection.js)
- **API Endpoint:** `POST /api/admin/orders/:id/fraud-check` (Admin JWT / Triggered synchronously in checkout)
- **Fallback Behavior:** Multi-factor heuristic scoring based on velocity thresholds and historical standard deviation.
- **Current Limitations:** Optimized for quick-commerce pattern anomalies; does not inspect credit card bank-side 3DS responses.
- **Verified Evaluation Metrics (Test Set 4,231 Orders, Zero Synthetic Leakage):**
  - **ROC-AUC:** 0.6087
  - **F1-Score:** 0.1365 (tuned for high recall on severe anomaly tail)
  - **Inference Latency:** 19.77 ms

---

## 5. RFM Customer Segmentation Engine

### Purpose
Clusters 150,000 synthetic customer accounts into distinct behavioral cohorts (e.g., Champions, At-Risk, Loyal, New Explorers) to enable targeted discount allocation and personalized catalog curation.

- **Inputs:** Historical customer purchase metrics:
  - **Recency ($R$):** Days elapsed since last order.
  - **Frequency ($F$):** Total lifetime order count.
  - **Monetary ($M$):** Cumulative lifetime spend (INR).
- **Processing:**
  1. Standardizes RFM vectors via Z-score normalization.
  2. Initializes $K=4$ cluster centroids using $K\text{-Means++}$.
  3. Minimizes Within-Cluster Sum of Squares (WCSS) iteratively:
     $$\arg\min_{\mathbf{S}} \sum_{i=1}^{k} \sum_{\mathbf{x} \in S_i} \|\mathbf{x} - \boldsymbol{\mu}_i\|^2$$
  4. Assigns domain persona labels based on centroid coordinates.
- **Algorithm:** $K$-Means Clustering ($K=4$) with Elbow Criterion Validation.
- **Output:** Cluster ID, persona name, centroid coordinates, cohort member counts, and average order value.
- **Implementation:** [`ml/customer-segmentation.js`](../ml/customer-segmentation.js)
- **API Endpoint:** `GET /api/analytics/segments?k=4` (Admin JWT)
- **Fallback Behavior:** Fixed heuristic quartile segmentation on spend and frequency.
- **Current Limitations:** Batch processing recommended for all 150,000 users; API evaluates a 5,000-user sample for sub-second responses.

---

## 6. Combinatorial Operations Research: Dark Store Logistics

### A. Dark Store Warehouse Picker Walk Optimizer (2D TSP)
- **Purpose:** Determines the shortest pick path through physical warehouse racks for multi-item order batches.
- **Input:** 2D Cartesian coordinates $(x, y)$ of item shelf locations for a pick batch.
- **Algorithm:** Nearest Neighbor Greedy Tour Construction followed by iterative 2-Opt Local Search edge-swapping:
  $$\Delta D = (d_{A,C} + d_{B,D}) - (d_{A,B} + d_{C,D}) < 0$$
- **Output:** Ordered sequence of aisle-rack stops, total walk distance (meters), and walk path vector.
- **Implementation:** [`ml/dark-store-picker.js`](../ml/dark-store-picker.js), [`ml/python/optimization/warehouse_optimization.py`](../ml/python/optimization/warehouse_optimization.py)
- **API Endpoint:** `GET /api/dispatch/picker-route`
- **Verified Benchmark (100 Test Batches):**
  - **Walk Distance Reduction:** **37.48%** vs naive pick order
  - **Optimality Gap vs Exact ILP:** **0.09%**
  - **Solver Runtime:** 2.34 ms

### B. Last-Mile Delivery Fleet Dispatch (CVRP)
- **Purpose:** Allocates customer delivery drop-offs across a fleet of electric scooters subject to payload capacity ($Q_{\text{veh}} = 25\text{ kg}$) and 10-minute delivery time windows.
- **Input:** Dark store depot location $(x_0, y_0)$, customer delivery coordinates $(x_i, y_i)$, package weights $w_i$.
- **Algorithm:** Clarke-Wright Savings Heuristic:
  $$s(i, j) = d(0, i) + d(0, j) - d(i, j)$$
  followed by intra-route 2-Opt smoothing.
- **Output:** Vehicle-to-order assignment matrix, delivery sequence per driver, total fleet mileage (km), and vehicle capacity utilization.
- **Implementation:** [`ml/route-optimizer.js`](../ml/route-optimizer.js), [`ml/python/optimization/delivery_optimization.py`](../ml/python/optimization/delivery_optimization.py)
- **API Endpoint:** `GET /api/dispatch/route`
- **Verified Benchmark (50 Multi-Vehicle Batches):**
  - **Fleet Travel Distance Reduction:** **61.62%** vs individual dispatch
  - **Mean Fleet Capacity Utilization:** **82.93%**
  - **Total Driver Hours Saved:** 406.2 hours across simulation
  - **Solver Runtime:** 2.31 ms

### C. Continuous Review $(r, Q)$ Inventory Policy
- **Purpose:** Optimizes reorder point ($r$) and batch size ($Q$) for each SKU to balance holding costs against stockout penalties.
- **Algorithm:** Wilson Economic Order Quantity (EOQ) coupled with Gaussian safety stock:
  $$Q^* = \sqrt{\frac{2 D S}{H}}, \quad r = D \cdot L + Z_{\alpha} \cdot \sigma_L$$
- **Output:** Reorder point $r$, order batch $Q^*$, safety buffer stock, and stockout probability.
- **Implementation:** [`ml/python/optimization/inventory_optimization.py`](../ml/python/optimization/inventory_optimization.py), [`routes/analytics.js`](../routes/analytics.js)
- **API Endpoint:** `GET /api/analytics/stock-alerts`
- **Verified Benchmark (365-Day Stochastic Simulation):**
  - **Total Inventory Cost Reduction:** **87.64%**
  - **Cycle Service Level:** **99.88%**
  - **Stockout Duration Reduction:** **98.31%**
