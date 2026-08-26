"""
FreshCart AI — Python Machine Learning Experimentation Configuration
Centralized configuration, path management, random seeds, and plot styling.
"""

import os
from pathlib import Path

# Paths
MODULE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = MODULE_DIR.parent.parent

DB_PATH = PROJECT_ROOT / "db" / "freshcart.db"

DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
SYNTHETIC_DATA_DIR = DATA_DIR / "synthetic"
EXTERNAL_DATA_DIR = DATA_DIR / "external"

EXPERIMENTS_DIR = MODULE_DIR / "experiments"
MODELS_DIR = MODULE_DIR / "models"
METRICS_DIR = MODULE_DIR / "metrics"
PLOTS_DIR = MODULE_DIR / "plots"
REPORTS_DIR = MODULE_DIR / "reports"

# Ensure all directories exist
for d in [
    RAW_DATA_DIR,
    PROCESSED_DATA_DIR,
    SYNTHETIC_DATA_DIR,
    EXTERNAL_DATA_DIR,
    EXPERIMENTS_DIR,
    MODELS_DIR,
    METRICS_DIR,
    PLOTS_DIR,
    REPORTS_DIR,
]:
    d.mkdir(parents=True, exist_ok=True)

# Global Reproducibility Seed
RANDOM_SEED = 42

# Matplotlib Plot Styling
PLOT_STYLE = {
    "figure.figsize": (10, 6),
    "figure.dpi": 300,
    "axes.grid": True,
    "grid.alpha": 0.3,
    "grid.linestyle": "--",
    "axes.titlesize": 14,
    "axes.labelsize": 12,
    "xtick.labelsize": 10,
    "ytick.labelsize": 10,
    "legend.fontsize": 10,
    "lines.linewidth": 2,
}

# Module-specific experiment configs
RECOMMENDATION_CONFIG = {
    "k_values": [5, 10],
    "test_ratio": 0.20,
    "min_interactions_per_user": 5,
    "implicit_weights": {
        "purchase": 5.0,
        "cart": 3.0,
        "view": 1.0,
        "rating": 2.0,
    },
}

DEMAND_FORECASTING_CONFIG = {
    "test_days": 30,
    "lags": [1, 2, 3, 7, 14],
    "rolling_windows": [7, 14, 30],
    "top_k_products_forecast": 5,  # Top products for individual series modeling
}

DYNAMIC_PRICING_CONFIG = {
    "price_change_bounds": (-0.25, 0.25),  # Maximum +/- 25% price deviation
    "elasticity_log_log": True,
    "mc_simulations": 1000,
}

FRAUD_DETECTION_CONFIG = {
    "test_ratio": 0.25,
    "contamination_rate": 0.04,  # Estimated baseline fraud/anomaly proportion (~4%)
    "z_score_threshold": 3.0,
}
