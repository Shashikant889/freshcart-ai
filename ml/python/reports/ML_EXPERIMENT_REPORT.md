# Academic Machine Learning & Optimization Experiment Report

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Evaluation Framework:** Final-Year Major Capstone (B.Tech CSE-AIML, Mumbai University)  
**Audit & Execution Date:** `2026-08-26 11:38:38`  
**Random Seed:** `42` (Fixed for strict reproducibility)  
**Environment:** Python 3.12, Scikit-Learn 1.9, Statsmodels 0.14, Pandas, NumPy, Matplotlib  

---

## 1. Executive Summary & Core Results

This report details the rigorous offline machine learning experimentation, leak-free benchmarking, and mathematical optimization for FreshCart AI. All reported numbers reflect actual empirical computations from verified holdout sets without data leakage.

### Key Empirical Findings
1. **Personalized Recommendation:** `Hybrid Ensemble (CF + CB)` achieved Top-10 ranking F1-Score of **0.5027** (Precision@10: 0.9760, Recall@10: 0.3412, NDCG@10: 0.9790) on a strict chronological interaction split.
2. **Demand Forecasting:** `SARIMAX(1,1,1)x(1,0,1)_7` achieved an out-of-sample 30-day forecast RMSE of **5.83 units** (MAPE: **2.50%**), outperforming the recursive Moving Average baseline.
3. **Dynamic Price Elasticity:** Econometric Log-Log OLS estimation validated category price elasticities with statistically significant coefficients ($p < 0.001$). Monte Carlo simulation under CED demonstrated a model-based **+22.21% Daily Revenue Lift** within $\pm 25\%$ business safety guardrails.
4. **Transaction Fraud Detection:** `Random Forest Classifier` achieved an F1-Score of **0.1365** (ROC-AUC: **0.6087**, Recall: **0.3864**) on realistic noisy transactions without target leakage.

---

## 2. Dataset Taxonomy & Provenance

The experiments utilize structured datasets extracted from `db/freshcart.db` and exported as standard CSVs in `data/synthetic/` and `data/processed/`, aligned with public retail benchmarks (Instacart & Dunnhumby):

| Dataset File | Volume | Attributes | Split Strategy |
|---|---|---|---|
| `products.csv` | 31 SKUs | `id, name, category, price, tags, stock` | Full catalog |
| `user_interactions.csv` | 83,760 events | `user_id, product_id, action, rating, created_at` | 80% chronological train / 20% test per user |
| `sales_history.csv` | 11,315 days/SKUs | `product_id, date, quantity_sold, revenue` | Chronological (305 train days / 30 holdout days) |
| `orders.csv` | 4,231 orders | `id, total, items, hour, velocity, latent_fraud` | Stratified 75% train / 25% test |

---

## 3. Module 1: Personalized Product Recommendation Benchmark

### Evaluation Protocol
- **Split:** Strict chronological split on user interaction timestamps (first 80% train, last 20% future holdout).
- **Candidate Models:** Popularity Baseline, Content-Based (TF-IDF), User-User Collaborative Filtering, SVD Matrix Factorization, Hybrid Ensemble.
- **Metrics:** Precision@K, Recall@K, F1@K, HitRate@K, NDCG@K for $K \in \{5, 10\}$.

### Experimental Benchmark Results

| Model Architecture | P@5 | R@5 | F1@5 | P@10 | R@10 | F1@10 | HitRate@10 | NDCG@10 |
|---|---|---|---|---|---|---|---|---|
| **Popularity Baseline** | 0.9400 | 0.1618 | 0.2752 | 0.9300 | 0.3183 | 0.4725 | 1.0000 | 0.9276 |
| **Content-Based (TF-IDF)** | 0.9680 | 0.1684 | 0.2858 | 0.9640 | 0.3346 | 0.4943 | 1.0000 | 0.9667 |
| **Collaborative Filtering (User-User)** | 0.9920 | 0.1747 | 0.2957 | 0.9760 | 0.3406 | 0.5022 | 1.0000 | 0.9813 |
| **Matrix Factorization (SVD)** | 0.9840 | 0.1722 | 0.2919 | 0.9740 | 0.3403 | 0.5015 | 1.0000 | 0.9756 |
| **Hybrid Ensemble (CF + CB)** | 0.9760 | 0.1706 | 0.2893 | 0.9760 | 0.3412 | 0.5027 | 1.0000 | 0.9790 |

**Best Performing Model:** `Hybrid Ensemble (CF + CB)` with **F1@10 = 0.5027** and **NDCG@10 = 0.9790**.

---

## 4. Module 2: Time-Series Demand Forecasting Benchmark

### Evaluation Protocol
- **Split:** 305 training days vs 30-day out-of-sample holdout.
- **Leakage Prevention:** Recursive multi-step forecasting where future lags are filled with model predictions $\hat{y}_{t-k}$ rather than ground-truth lookaheads.

### Experimental Benchmark Results (30-Day Out-of-Sample Holdout)

| Model Architecture | MAE (units) | RMSE (units) | MAPE (%) |
|---|---|---|---|
| **7-Day Moving Average (Baseline)** | 40.45 | 48.70 | 19.77% |
| **OLS Linear Regression** | 8.79 | 10.56 | 4.56% |
| **Ridge Regression (L2)** | 8.52 | 10.50 | 4.47% |
| **Random Forest Regressor** | 4.66 | 5.99 | 2.40% |
| **Gradient Boosting (GBR)** | 10.41 | 12.65 | 5.35% |
| **SARIMAX(1,1,1)x(1,0,1)_7** | 4.87 | 5.83 | 2.50% |

**Best Performing Model:** `SARIMAX(1,1,1)x(1,0,1)_7` with **RMSE = 5.83 units** and **MAPE = 2.50%**.

---

## 5. Module 3: Dynamic Price Elasticity & Revenue Optimization

### Econometric Log-Log OLS Estimation (70% Estimation Sample, N=3,905)

$$\ln(Q_i) = \beta_0 + \beta_1 \ln(P_i) + \varepsilon_i$$

| Category | Estimated $E_d$ ($\beta_1$) | Std. Error | $t$-stat | $p$-value | $R^2$ | 95% Confidence Interval | Demand Type |
|---|---|---|---|---|---|---|---|
| **fruits** | `-0.058` | 0.0117 | -5.02 | 0.0000 | 0.0320 | [-0.08, -0.04] | Inelastic (|Ed| <= 1) |
| **vegetables** | `-0.063` | 0.0112 | -5.58 | 0.0000 | 0.0403 | [-0.08, -0.04] | Inelastic (|Ed| <= 1) |
| **bakery** | `-0.105` | 0.0157 | -6.68 | 0.0000 | 0.0656 | [-0.14, -0.07] | Inelastic (|Ed| <= 1) |
| **beverages** | `-0.201` | 0.0206 | -9.78 | 0.0000 | 0.1572 | [-0.24, -0.16] | Inelastic (|Ed| <= 1) |
| **dairy** | `-0.077` | 0.0132 | -5.83 | 0.0000 | 0.0520 | [-0.10, -0.05] | Inelastic (|Ed| <= 1) |
| **snacks** | `-0.084` | 0.0143 | -5.86 | 0.0000 | 0.0522 | [-0.11, -0.06] | Inelastic (|Ed| <= 1) |

### Out-of-Sample Validation & Monte Carlo Optimization
- **Holdout Validation (30% Sample, N=1675):** Demand Prediction MAE = **5.11 units**, $R^2 = \mathbf{0.0945}$.
- **Baseline Fixed Daily Revenue:** ₹208,151.48
- **Dynamic Optimized Daily Revenue:** ₹254,382.42 (**+22.21% Net Lift**)
- **Dynamic Optimized Daily Profit:** ₹132,278.86 (**+58.87% Net Lift**)

> [!NOTE]
> **Academic Label:** SIMULATED / MODEL-BASED ESTIMATE under Constant Elasticity of Demand with $\pm 25\%$ business bounds.

---

## 6. Module 4: Real-Time Fraud & Anomaly Detection Benchmark

### Evaluation Protocol
- **Split:** 75% train (3,173 orders) / 25% test (1,058 orders), stratified by class.
- **Target Leakage Audit:** Target label is generated via latent attack simulation with realistic false-positive traps and behavioral noise. Features do not contain deterministic label rules.

### Experimental Benchmark Results (Holdout Test Set)

| Model Architecture | Precision | Recall | F1-Score | ROC-AUC |
|---|---|---|---|
| **Rule-Based / Z-Score Baseline** | 0.1034 | 0.0682 | 0.0822 | 0.5554 |
| **Logistic Regression (Balanced)** | 0.0580 | 0.5909 | 0.1057 | 0.6080 |
| **Random Forest Classifier** | 0.0829 | 0.3864 | 0.1365 | 0.6087 |
| **Isolation Forest (Unsupervised)** | 0.0000 | 0.0000 | 0.0000 | 0.5258 |

**Best Performing Model:** `Random Forest Classifier` with **F1-Score = 0.1365** and **ROC-AUC = 0.6087**.

---

## 7. Model Artifacts & Reproduction

All trained models and metadata are serialized in `ml/python/models/`:
- `best_recommendation_model.joblib`
- `best_demand_forecasting_model.joblib`
- `price_elasticity_model.joblib`
- `best_fraud_detection_model.joblib`

### Reproduction Command
```bash
.venv\Scripts\python -m ml.python.run_all_experiments
```