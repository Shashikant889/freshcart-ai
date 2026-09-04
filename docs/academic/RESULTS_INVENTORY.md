# AI-Driven Intelligent Grocery Retail System: Master Academic Results & Benchmarks Inventory

This document compiles all empirical numerical findings, holdout metrics, ablation comparisons, and generated plot paths across all 7 AI/ML and Operations Research subsystems.

---

## 1. Machine Learning Benchmarks Summary (Leak-Free Holdout Sets)

### 1.1 Recommendation Engine (80% Chronological Train / 20% Future Holdout)
*Source File:* [ml/python/reports/ML_EXPERIMENT_REPORT.md](file:///c:/Users/shash/demo1/ml/python/reports/ML_EXPERIMENT_REPORT.md#L45-L53)

| Model Architecture | Precision@10 | Recall@10 | F1@10 | HitRate@10 | NDCG@10 | Ranking Winner |
|---|---|---|---|---|---|---|
| **Popularity Baseline** | 0.9300 | 0.3183 | 0.4725 | 1.0000 | 0.9276 | |
| **Content-Based (TF-IDF)** | 0.9640 | 0.3346 | 0.4943 | 1.0000 | 0.9667 | |
| **Collaborative Filtering (User-User)** | 0.9760 | 0.3406 | 0.5022 | 1.0000 | **0.9813** | |
| **Matrix Factorization (SVD)** | 0.9740 | 0.3403 | 0.5015 | 1.0000 | 0.9756 | |
| **Hybrid Ensemble (CF + CB)** | **0.9760** | **0.3412** | **0.5027** | **1.0000** | 0.9790 | **BEST OVERALL** |

---

### 1.2 Time-Series Demand Forecasting (305 Train Days / 30-Day Out-of-Sample Holdout)
*Source File:* [ml/python/reports/ML_EXPERIMENT_REPORT.md](file:///c:/Users/shash/demo1/ml/python/reports/ML_EXPERIMENT_REPORT.md#L65-L74)

| Model Architecture | MAE (Units) | RMSE (Units) | MAPE (%) | Ranking Winner |
|---|---|---|---|---|
| **7-Day Moving Average Baseline** | 40.45 | 48.70 | 19.77% | |
| **Ordinary Least Squares (OLS)** | 8.79 | 10.56 | 4.56% | |
| **Ridge Regression (L2 Penalty)** | 8.52 | 10.50 | 4.47% | |
| **Random Forest Regressor** | 4.66 | 5.99 | 2.40% | |
| **Gradient Boosting Regressor (GBR)**| 10.41 | 12.65 | 5.35% | |
| **SARIMAX(1,1,1)x(1,0,1)_7** | **4.87** | **5.83** | **2.50%** | **BEST OVERALL** |

---

### 1.3 Dynamic Price Elasticity ($E_d$) & Revenue Optimization (N=5,580 Observations)
*Source File:* [ml/python/reports/ML_EXPERIMENT_REPORT.md](file:///c:/Users/shash/demo1/ml/python/reports/ML_EXPERIMENT_REPORT.md#L84-L98)

| Category | Elasticity $E_d$ | Std. Error | $t$-statistic | $p$-value | 95% Confidence Interval | Demand Characteristic |
|---|---|---|---|---|---|---|
| **Fruits** | **-0.058** | 0.0117 | -5.02 | $p < 0.001$ | `[-0.08, -0.04]` | Highly Inelastic |
| **Vegetables** | **-0.063** | 0.0112 | -5.58 | $p < 0.001$ | `[-0.08, -0.04]` | Highly Inelastic |
| **Dairy** | **-0.077** | 0.0132 | -5.83 | $p < 0.001$ | `[-0.10, -0.05]` | Inelastic |
| **Snacks** | **-0.084** | 0.0143 | -5.86 | $p < 0.001$ | `[-0.11, -0.06]` | Inelastic |
| **Bakery** | **-0.105** | 0.0157 | -6.68 | $p < 0.001$ | `[-0.14, -0.07]` | Inelastic |
| **Beverages** | **-0.201** | 0.0206 | -9.78 | $p < 0.001$ | `[-0.24, -0.16]` | Relatively Elastic |

- **Holdout Validation (30% Split, N=1,675):** Demand MAE = **5.11 units**, $R^2 = \mathbf{0.0945}$.
- **Simulated Revenue Lift under $\pm 25\%$ Bounds:** ₹208,151.48 $\to$ ₹254,382.42 (**+22.21% Net Lift**).
- **Simulated Profit Lift:** ₹83,260.59 $\to$ ₹132,278.86 (**+58.87% Net Lift**).

---

### 1.4 Real-Time Transaction Fraud Detection (Stratified 75% Train / 25% Test, N=4,231 Orders)
*Source File:* [ml/python/reports/ML_EXPERIMENT_REPORT.md](file:///c:/Users/shash/demo1/ml/python/reports/ML_EXPERIMENT_REPORT.md#L112-L120)

| Model Architecture | Precision | Recall | F1-Score | ROC-AUC | PR-AUC |
|---|---|---|---|---|---|
| **Rule-Based / Z-Score Baseline** | 0.1034 | 0.0682 | 0.0822 | 0.5554 | 0.0712 |
| **Logistic Regression (Balanced)** | 0.0580 | **0.5909** | 0.1057 | 0.6080 | 0.0924 |
| **Isolation Forest (Unsupervised)** | 0.0000 | 0.0000 | 0.0000 | 0.5258 | 0.0489 |
| **Random Forest Classifier** | **0.0829** | 0.3864 | **0.1365** | **0.6087** | **0.1185** |

---

## 2. Operations Research & Optimization Benchmarks

### 2.1 Inventory & Procurement (180 Simulated Days Across 31 Catalog SKUs)
*Source File:* [ml/python/reports/OPTIMIZATION_EXPERIMENT_REPORT.md](file:///c:/Users/shash/demo1/ml/python/reports/OPTIMIZATION_EXPERIMENT_REPORT.md#L24-L39)

- **Total Inventory Cost:** ₹796,250.89 (Baseline) $\to$ **₹98,394.90 (Optimized)** $\implies$ **-87.64% Cost Reduction**
- **Service Level Delivered:** 89.45% (Baseline) $\to$ **99.88% (Optimized)** (Target was 95.00%)
- **Stockout Days:** 890 days (Baseline) $\to$ **15 days (Optimized)** $\implies$ **-98.3% Stockout Reduction**

---

### 2.2 Dark Store Warehouse Picking (N = 100 Multi-Item Orders)
*Source File:* [ml/python/reports/OPTIMIZATION_EXPERIMENT_REPORT.md](file:///c:/Users/shash/demo1/ml/python/reports/OPTIMIZATION_EXPERIMENT_REPORT.md#L44-L59)

- **Total Walk Distance:** 9,685.4 m (Naive) $\to$ **6,055.3 m (2-Opt TSP)** $\implies$ **-37.48% Walking Distance Saved**
- **Total Assembly Time:** 11,841.1 s $\to$ **8,816.0 s** $\implies$ **-25.55% Order Assembly Speedup**
- **Optimality Gap vs Exact Brute-Force Solver:** **0.09%** across 53 small orders ($N \le 8$).

---

### 2.3 Last-Mile Delivery Routing (N = 50 Dispatch Batches)
*Source File:* [ml/python/reports/OPTIMIZATION_EXPERIMENT_REPORT.md](file:///c:/Users/shash/demo1/ml/python/reports/OPTIMIZATION_EXPERIMENT_REPORT.md#L64-L80)

- **Total Fleet Travel Distance:** 14,502.7 km (Baseline FIFO) $\to$ **5,566.3 km (Clarke-Wright CVRP)** $\implies$ **-61.62% Fleet Distance Saved**
- **Fleet Vehicles Deployed:** 229 vehicles (Baseline) $\to$ **225 vehicles (Optimized)**
- **Mean Fleet Capacity Utilization:** 82.3% (Baseline) $\to$ **82.9% (Optimized)**

---

## 3. Real-Time Latency Benchmarks
*Source File:* [docs/testing/PERFORMANCE_REPORT.md](file:///c:/Users/shash/demo1/docs/testing/PERFORMANCE_REPORT.md)

| Endpoint Type | Endpoint Name | Mean Latency (ms) | 95th Percentile Latency (ms) |
|---|---|---|---|
| **Node.js Gateway** | `GET /api/products` | 3.67 ms | 6.42 ms |
| **Node.js Gateway** | `GET /api/recommendations/personal` | 7.90 ms | 9.37 ms |
| **Node.js Gateway** | `GET /api/analytics/demand-forecast/f1` | 8.80 ms | 9.41 ms |
| **Node.js Gateway** | `GET /api/pricing/simulate/f1` | 9.87 ms | 11.21 ms |
| **Node.js Gateway** | `GET /api/supplier/reorder-alerts` | 2.26 ms | 3.09 ms |
| **Node.js Gateway** | `POST /api/supplier/warehouse-picker-route` | 4.40 ms | 5.06 ms |
| **Node.js Gateway** | `GET /api/dispatch/optimize` | 10.83 ms | 12.19 ms |
| **Python Inference**| `POST /predict/recommendations` | 4.86 ms | 5.61 ms |
| **Python Inference**| `POST /predict/demand` | 4.46 ms | 4.84 ms |
| **Python Inference**| `POST /predict/price` | 2.56 ms | 3.09 ms |
| **Python Inference**| `POST /predict/fraud` | 19.77 ms | 21.96 ms |
| **Python Optimization** | `POST /optimize/inventory` | 2.38 ms | 2.57 ms |
| **Python Optimization** | `POST /optimize/warehouse` | 2.34 ms | 2.65 ms |
| **Python Optimization** | `POST /optimize/delivery` | 2.31 ms | 2.91 ms |

---

## 4. Visual Result Artifacts (Generated PNG Plots)

1. `ml/python/plots/inventory_cost_comparison.png`
2. `ml/python/plots/inventory_service_level_comparison.png`
3. `ml/python/plots/inventory_stock_trajectory.png`
4. `ml/python/plots/warehouse_layout_and_routes.png`
5. `ml/python/plots/warehouse_distance_comparison.png`
6. `ml/python/plots/warehouse_improvement_distribution.png`
7. `ml/python/plots/delivery_routes_map.png`
8. `ml/python/plots/delivery_distance_comparison.png`
9. `ml/python/plots/delivery_improvement_distribution.png`
