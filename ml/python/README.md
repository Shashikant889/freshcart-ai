# FreshCart AI — Offline Python Data Science & ML Experimentation Layer

This directory contains the reproducible Python machine learning experimentation pipeline for **FreshCart AI**, designed to provide academic evidence, empirical benchmarks, and serialized model artifacts for our final-year engineering capstone under Mumbai University.

---

## 1. Directory Structure

```
ml/python/
├── config.py                     # Centralized paths, seeds, hyperparameters, plot styling
├── data_loader.py                # Data engineering, SQLite extraction, feature processing
├── requirements.txt              # Standard Python dependencies
├── run_all_experiments.py        # Master pipeline runner & automated report generator
├── README.md                     # Documentation & reproducibility guide
│
├── experiments/                  # Modular candidate model benchmarking scripts
│   ├── recommendation_experiment.py      # Module 1: Popularity, Content-Based, CF, SVD, Hybrid
│   ├── demand_forecasting_experiment.py  # Module 2: 7d-MA, OLS, Ridge, RF, GBR, SARIMAX
│   ├── dynamic_pricing_experiment.py     # Module 3: Log-Log OLS Elasticity & Revenue Optimizer
│   └── fraud_detection_experiment.py     # Module 4: Rule Z-Score, Logistic, RF, Isolation Forest
│
├── models/                       # Serialized model binaries (.joblib) & metadata (.json)
│   ├── best_recommendation_model.joblib
│   ├── best_recommendation_model.json
│   ├── best_demand_forecasting_model.joblib
│   ├── best_demand_forecasting_model.json
│   ├── price_elasticity_model.joblib
│   ├── price_elasticity_model.json
│   ├── best_fraud_detection_model.joblib
│   └── best_fraud_detection_model.json
│
├── metrics/                      # Raw JSON metric evaluations
│   ├── recommendation_metrics.json
│   ├── demand_forecasting_metrics.json
│   ├── dynamic_pricing_metrics.json
│   └── fraud_detection_metrics.json
│
├── plots/                        # High-resolution academic evaluation charts (PNG)
│   ├── recommendation_model_comparison.png
│   ├── demand_forecast_vs_actual.png
│   ├── demand_forecasting_model_comparison.png
│   ├── price_elasticity_demand_curves.png
│   ├── pricing_revenue_simulation.png
│   ├── fraud_detection_roc_curves.png
│   └── fraud_feature_importance.png
│
└── reports/                      # Full IEEE academic evaluation report
    └── ML_EXPERIMENT_REPORT.md
```

---

## 2. Environment Setup & Installation

The experimentation layer requires Python 3.10+ (tested on Python 3.12).

```bash
# 1. Create a local virtual environment
python -m venv .venv

# 2. Activate virtual environment
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux / macOS:
source .venv/bin/activate

# 3. Install dependencies
pip install -r ml/python/requirements.txt
```

---

## 3. Running Experiments

### Execute All Experiments at Once
To run the complete data extraction, model training, evaluation, comparison, artifact generation, and report generation pipeline in one command:

```bash
.venv\Scripts\python -m ml.python.run_all_experiments
```

### Run Individual Module Experiments

```bash
# Module 1: Personalized Recommendation
.venv\Scripts\python -m ml.python.experiments.recommendation_experiment

# Module 2: Demand Forecasting
.venv\Scripts\python -m ml.python.experiments.demand_forecasting_experiment

# Module 3: Dynamic Pricing & Elasticity
.venv\Scripts\python -m ml.python.experiments.dynamic_pricing_experiment

# Module 4: Fraud Detection & Anomaly Scoring
.venv\Scripts\python -m ml.python.experiments.fraud_detection_experiment
```

---

## 4. Academic Evaluation Summary

| Subsystem | Candidate Models | Best Performer | Key Performance Metric |
|---|---|---|---|
| **1. Recommendation** | Popularity, Content-Based, User-User CF, SVD, Hybrid Ensemble | **Content-Based (TF-IDF)** | **F1@10 = 0.7467** (Recall@10 = 1.0000) |
| **2. Demand Forecasting** | 7d-MA, OLS, Ridge, Random Forest, GBR, SARIMAX | **SARIMAX $(1,1,1)\times(1,0,1)_7$** | **RMSE = 5.81 units** (MAPE = 2.48%) |
| **3. Dynamic Pricing** | Fixed Price vs Log-Log OLS Optimizer | **Log-Log OLS Optimizer** | **+22.35% Daily Revenue Lift** (+59.06% Profit Lift) |
| **4. Fraud Detection** | Z-Score Rule, Logistic Regression, Random Forest, Isolation Forest | **Random Forest Classifier** | **ROC-AUC = 1.0000** (F1 = 0.9647, Recall = 1.0000) |

Full documentation and mathematical proofs are compiled in [ML_EXPERIMENT_REPORT.md](file:///c:/Users/shash/demo1/ml/python/reports/ML_EXPERIMENT_REPORT.md).
