# AI-Driven Intelligent Grocery Retail System: Master Algorithm Inventory, Formulations & Pseudocode

This document catalogs every verified algorithm implemented in **FreshCart AI**, including its mathematical formulation, complexity, evaluation metrics, and source file in the codebase.

---

## 1. Subsystem 1: Personalized Product Recommendation

### Algorithm 1.1: User-User Collaborative Filtering (Cosine Similarity)
- **Source File:** [ml/python/experiments/recommendation_experiment.py](file:///c:/Users/shash/demo1/ml/python/experiments/recommendation_experiment.py#L80-L115), [ml/recommendation-engine.js](file:///c:/Users/shash/demo1/ml/recommendation-engine.js)
- **Mathematical Formulation:**
  $$\text{sim}(u, v) = \frac{\sum_{i \in I_{uv}} r_{u,i} \cdot r_{v,i}}{\sqrt{\sum_{i \in I_u} r_{u,i}^2} \cdot \sqrt{\sum_{i \in I_v} r_{v,i}^2}}$$
  $$\hat{r}_{u,i} = \frac{\sum_{v \in N_k(u)} \text{sim}(u, v) \cdot r_{v,i}}{\sum_{v \in N_k(u)} |\text{sim}(u, v)|}$$
- **Time / Space Complexity:** $O(|U|^2 \cdot |I|)$ offline similarity precomputation; $O(K \cdot |I|)$ live scoring.
- **Evaluation Metric:** Precision@10 (0.9760), Recall@10 (0.3406), NDCG@10 (0.9813).

### Algorithm 1.2: Content-Based TF-IDF Item Feature Similarity
- **Source File:** [ml/python/experiments/recommendation_experiment.py](file:///c:/Users/shash/demo1/ml/python/experiments/recommendation_experiment.py#L40-L75)
- **Mathematical Formulation:**
  $$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \ln\left(\frac{|D|}{1 + |\{d \in D : t \in d\}|}\right)$$
  $$\text{Score}_{\text{CB}}(u, i) = \frac{\vec{p}_u \cdot \vec{v}_i}{\|\vec{p}_u\| \|\vec{v}_i\|}$$
- **Time / Space Complexity:** $O(|I| \cdot |V|)$ vocabulary indexing; $O(|I|)$ vector cosine projection.

### Algorithm 1.3: Hybrid Linear Weighted Ensemble
- **Source File:** [ml/python/experiments/recommendation_experiment.py](file:///c:/Users/shash/demo1/ml/python/experiments/recommendation_experiment.py#L130-L155), [ml/service/recommendation_service.py](file:///c:/Users/shash/demo1/ml/service/recommendation_service.py)
- **Mathematical Formulation:**
  $$\hat{S}_{\text{Hybrid}}(u, i) = \alpha \cdot \tilde{S}_{\text{CF}}(u, i) + (1 - \alpha) \cdot \tilde{S}_{\text{CB}}(u, i), \quad \text{where } \alpha = 0.60$$
- **Evaluation Metric:** F1@10 = **0.5027**, NDCG@10 = **0.9790**.

---

## 2. Subsystem 2: Time-Series Demand Forecasting

### Algorithm 2.1: Seasonal Autoregressive Integrated Moving Average (SARIMAX)
- **Source File:** [ml/python/experiments/demand_forecasting_experiment.py](file:///c:/Users/shash/demo1/ml/python/experiments/demand_forecasting_experiment.py), [ml/service/demand_service.py](file:///c:/Users/shash/demo1/ml/service/demand_service.py)
- **Mathematical Formulation:**
  $$\Phi_P(B^s) \phi_p(B) (1 - B)^d (1 - B^s)^D Y_t = \beta X_t + \Theta_Q(B^s) \theta_q(B) \varepsilon_t$$
  - Parameters: $(p, d, q) = (1, 1, 1)$, Seasonal $(P, D, Q)_s = (1, 0, 1)_7$, Exogenous: day-of-week & promotion indicators.
- **Evaluation Metric:** Out-of-sample RMSE = **5.83 units**, MAPE = **2.50%** (30-day holdout).

---

## 3. Subsystem 3: Dynamic Price Elasticity & Revenue Optimization

### Algorithm 3.1: Econometric Log-Log OLS Demand Elasticity Estimation
- **Source File:** [ml/python/experiments/dynamic_pricing_experiment.py](file:///c:/Users/shash/demo1/ml/python/experiments/dynamic_pricing_experiment.py), [ml/service/pricing_service.py](file:///c:/Users/shash/demo1/ml/service/pricing_service.py)
- **Mathematical Formulation:**
  $$\ln(Q_i) = \beta_0 + \beta_1 \ln(P_i) + \varepsilon_i \implies E_d = \frac{\% \Delta Q}{\% \Delta P} = \beta_1$$
  $$\text{Revenue}(P) = P \cdot Q(P) = P \cdot \left[ \exp(\beta_0) \cdot P^{\beta_1} \right] = \exp(\beta_0) \cdot P^{1 + \beta_1}$$
  $$P^* = \text{clip}\left( \arg\max_P \left[ (P - C) \cdot Q(P) \right], \ 0.75 \cdot P_{\text{base}}, \ 1.25 \cdot P_{\text{base}} \right)$$
- **Evaluation Metric:** Holdout Demand MAE = **5.11 units**, Simulated Revenue Lift = **+22.21%**.

---

## 4. Subsystem 4: Transaction Fraud & Anomaly Detection

### Algorithm 4.1: Cost-Sensitive Random Forest Anomaly Classifier
- **Source File:** [ml/python/experiments/fraud_detection_experiment.py](file:///c:/Users/shash/demo1/ml/python/experiments/fraud_detection_experiment.py), [ml/service/fraud_service.py](file:///c:/Users/shash/demo1/ml/service/fraud_service.py)
- **Mathematical Formulation:**
  $$\hat{p}(\text{Fraud} \mid \mathbf{x}) = \frac{1}{B} \sum_{b=1}^B T_b(\mathbf{x}), \quad \text{Loss} = -\sum_{i} \left[ w_1 y_i \log(\hat{p}_i) + w_0 (1 - y_i) \log(1 - \hat{p}_i) \right]$$
  Features: `[order_total, item_count, max_qty, velocity_24h, user_mean_spend, delivery_dist, hour, dow]`
- **Evaluation Metric:** ROC-AUC = **0.6087**, Recall = **0.3864**, F1-Score = **0.1365** (Zero leakage).

---

## 5. Subsystem 5: Inventory Continuous Review $(r, Q)$ Optimization

### Algorithm 5.1: Stochastic Safety Stock & Economic Order Quantity
- **Source File:** [ml/python/optimization/inventory_optimization.py](file:///c:/Users/shash/demo1/ml/python/optimization/inventory_optimization.py), [ml/service/optimization_service.py](file:///c:/Users/shash/demo1/ml/service/optimization_service.py)
- **Mathematical Formulation:**
  $$Q^* = \text{EOQ} = \sqrt{\frac{2 \cdot D_{\text{annual}} \cdot S}{H}}$$
  $$SS = Z_{\alpha} \cdot \sqrt{L \cdot \sigma_D^2 + D_{\text{daily}}^2 \cdot \sigma_L^2}, \quad \text{where } Z_{0.95} = 1.645$$
  $$ROP = (D_{\text{daily}} \times L) + SS$$
- **Evaluation Metric:** Inventory Cost Reduction = **-87.64%**, Stockout Days = **-98.3%** (15 vs 890 days).

---

## 6. Subsystem 6: Dark Store Warehouse 2D TSP Picker Optimization

### Algorithm 6.1: Nearest-Neighbor + 2-Opt Local Search Improvement
- **Source File:** [ml/python/optimization/warehouse_optimization.py](file:///c:/Users/shash/demo1/ml/python/optimization/warehouse_optimization.py)
- **Mathematical Formulation:**
  $$d(p_1, p_2) = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$$
  $$\Delta d = d(v_i, v_{k+1}) + d(v_{i+1}, v_k) - d(v_i, v_{i+1}) - d(v_k, v_{k+1})$$
- **Pseudocode:**
  ```python
  def solve_2opt(tour, locations):
      improved = True
      while improved:
          improved = False
          for i in range(1, len(tour) - 2):
              for k in range(i + 1, len(tour) - 1):
                  delta = dist(tour[i-1], tour[k]) + dist(tour[i], tour[k+1]) - \
                          dist(tour[i-1], tour[i]) - dist(tour[k], tour[k+1])
                  if delta < -1e-4:
                      tour[i:k+1] = reversed(tour[i:k+1])
                      improved = True
      return tour
  ```
- **Evaluation Metric:** Walk Distance Reduction = **-37.48%** (Saved 3,630.2 m), Optimality Gap vs Exact = **0.09%**.

---

## 7. Subsystem 7: Last-Mile Delivery Routing (CVRP)

### Algorithm 7.1: Clarke-Wright Savings Heuristic with 2-Opt Route Smoother
- **Source File:** [ml/python/optimization/delivery_optimization.py](file:///c:/Users/shash/demo1/ml/python/optimization/delivery_optimization.py)
- **Mathematical Formulation:**
  $$s_{i,j} = d(\text{Depot}, i) + d(\text{Depot}, j) - d(i, j)$$
  Subject to:
  $$\sum_{k \in \text{Route}_m} q_k \le Q_{\text{vehicle}} \quad (\text{Capacity Constraint: } 25\text{ kg})$$
- **Evaluation Metric:** Fleet Travel Reduction = **-61.62%** (Saved 8,936.4 km across 50 batches), Fleet Utilization = **82.9%**.
