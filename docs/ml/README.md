# Machine Learning Subsystem Documentation & Academic Evaluation

This directory documents the mathematical models, offline Python experimentation layer, and real-time inference engines in **FreshCart AI**.

---

## 1. Offline Python Experimentation Framework (`ml/python/`)

FreshCart AI includes a reproducible offline Python experimentation pipeline structured as follows:

```
ml/python/
├── config.py                     # Global seeds, dataset paths, plot formatting
├── data_loader.py                # SQLite freshcart.db extractor & feature pipeline
├── requirements.txt              # Standard Python dependencies
├── run_all_experiments.py        # Master pipeline runner & auto-report generator
├── experiments/                  # Candidate model evaluation scripts
│   ├── recommendation_experiment.py      # Top-K ranking benchmarks (P@K, R@K, F1@K)
│   ├── demand_forecasting_experiment.py  # 30-day chronological forecast (MAE, RMSE, MAPE)
│   ├── dynamic_pricing_experiment.py     # Log-Log OLS price elasticity & revenue optimization
│   └── fraud_detection_experiment.py     # Supervised & unsupervised anomaly detection (ROC-AUC)
├── models/                       # Serialized model binaries (.joblib) & JSON metadata
├── metrics/                      # Raw JSON metric evaluations
├── plots/                        # Academic evaluation charts (PNG)
└── reports/
    └── ML_EXPERIMENT_REPORT.md   # IEEE-standard academic experiment report
```

### Reproducing All Offline Experiments
```bash
.venv\Scripts\python -m ml.python.run_all_experiments
```

---

## 2. 4 Core Machine Learning Modules Summary

| Subsystem | Evaluated Candidates | Best Model | Primary Academic Metric |
|---|---|---|---|
| **1. Personalized Recommendation** | Popularity, Content-Based (TF-IDF), User-User CF, Truncated SVD, Hybrid Ensemble | **Content-Based (TF-IDF)** | **F1@10 = 0.7467** (Recall@10 = 1.0000, Precision@10 = 0.5960) |
| **2. Time-Series Demand Forecasting** | 7-Day Moving Avg, OLS Regression, Ridge (L2), Random Forest, Gradient Boosting, SARIMAX | **SARIMAX $(1,1,1)\times(1,0,1)_7$** | **RMSE = 5.81 units** (MAPE = 2.48%, MAE = 4.82) |
| **3. Dynamic Price Elasticity Optimization** | Baseline Fixed Price vs Log-Log OLS Optimizer | **Log-Log OLS Bounded Optimizer** | **+22.35% Daily Revenue Lift** (+59.06% Daily Profit Lift) |
| **4. Real-Time Fraud & Anomaly Detection** | Z-Score Rule Baseline, Logistic Regression, Random Forest, Isolation Forest | **Random Forest Classifier** | **ROC-AUC = 1.0000** (F1 = 0.9647, Recall = 1.0000) |

---

## 3. High-Resolution Visualizations

Generated plots are located at:
- `ml/python/plots/recommendation_model_comparison.png`: Bar comparison across candidate recommendation architectures.
- `ml/python/plots/demand_forecast_vs_actual.png`: Out-of-sample 30-day forecast trajectories vs ground-truth demand.
- `ml/python/plots/demand_forecasting_model_comparison.png`: MAE vs RMSE error distribution across candidate time-series models.
- `ml/python/plots/price_elasticity_demand_curves.png`: Econometric log-log price elasticity curves across grocery categories.
- `ml/python/plots/pricing_revenue_simulation.png`: Category-wise Monte Carlo revenue comparison under base vs optimal pricing.
- `ml/python/plots/fraud_detection_roc_curves.png`: Multi-model ROC curves with computed AUC scores.
- `ml/python/plots/fraud_feature_importance.png`: Gini feature importance ranking for fraud detection.

---

## 4. Full Academic Report
For comprehensive mathematical formulations, proofs, and comparative tables, refer to [ML_EXPERIMENT_REPORT.md](file:///c:/Users/shash/demo1/ml/python/reports/ML_EXPERIMENT_REPORT.md).
