"""
FreshCart AI — Module 4: Fraud Detection & Transaction Anomaly Experiment (Leak-Free Audit)
Evaluates supervised and unsupervised fraud detection models on a realistic noisy transaction dataset (Zero Target Leakage):
1. Statistical Rule Baseline (Heuristic Spend Thresholds)
2. Logistic Regression (Class-Balanced L2 Regularization)
3. Random Forest Classifier (Class-Balanced Non-linear Ensemble)
4. Isolation Forest (Unsupervised Point Anomaly Isolation)

Evaluates on: Precision, Recall, F1-Score, ROC-AUC, Confusion Matrices, and Gini Feature Importance.
"""

import sys
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    confusion_matrix,
)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from ml.python.config import (
    FRAUD_DETECTION_CONFIG,
    MODELS_DIR,
    METRICS_DIR,
    PLOTS_DIR,
    RANDOM_SEED,
    PLOT_STYLE,
)
from ml.python.data_loader import load_fraud_experiment_dataset

plt.rcParams.update(PLOT_STYLE)

class StatisticalRuleBaseline:
    """Statistical rule-based threshold baseline."""
    def __init__(self, ratio_threshold=2.5, velocity_threshold=4):
        self.ratio_threshold = ratio_threshold
        self.velocity_threshold = velocity_threshold
        
    def predict(self, X_df):
        preds = (
            (X_df["spend_to_user_mean_ratio"] > self.ratio_threshold) |
            (X_df["user_velocity_24h"] >= self.velocity_threshold)
        ).astype(int).values
        return preds
        
    def predict_proba(self, X_df):
        r = X_df["spend_to_user_mean_ratio"].values
        v = X_df["user_velocity_24h"].values
        z = (r / self.ratio_threshold) + (v / self.velocity_threshold)
        proba_1 = 1.0 / (1.0 + np.exp(-z + 2.0))
        proba_1 = np.clip(proba_1, 0.0, 1.0)
        return np.vstack([1.0 - proba_1, proba_1]).T

def run_fraud_detection_experiment():
    print("\n" + "=" * 60)
    print("  >> RUNNING MODULE 4: FRAUD & ANOMALY DETECTION EXPERIMENT (LEAK-FREE)")
    print("=" * 60)
    
    df = load_fraud_experiment_dataset()
    print(f"Loaded Orders Dataset: {len(df)} total transactions")
    
    feature_cols = [
        "total",
        "total_items",
        "unique_skus",
        "max_item_quantity",
        "order_hour",
        "order_dow",
        "is_weekend",
        "user_mean_spend",
        "spend_to_user_mean_ratio",
        "user_velocity_24h",
        "delivery_distance_km",
    ]
    
    X = df[feature_cols]
    y = df["is_fraud"].values
    fraud_count = int(np.sum(y))
    fraud_rate = (fraud_count / len(y)) * 100.0
    print(f"Class Balance: {fraud_count} Fraudulent Transactions ({fraud_rate:.2f}%) vs {len(y) - fraud_count} Legitimate")
    
    # Train / Test Split (75% / 25% Stratified)
    X_train_df, X_test_df, y_train, y_test = train_test_split(
        X, y, test_size=FRAUD_DETECTION_CONFIG["test_ratio"], random_state=RANDOM_SEED, stratify=y
    )
    print(f"Stratified Split: {len(X_train_df)} Training orders | {len(X_test_df)} Test orders")
    
    # Feature Scaling (Fitted only on train)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_df)
    X_test_scaled = scaler.transform(X_test_df)
    
    results = {}
    roc_data = {}
    cm_data = {}
    fitted_models = {}
    
    # 1. Statistical Rule Baseline
    rule_model = StatisticalRuleBaseline()
    y_pred_rule = rule_model.predict(X_test_df)
    y_prob_rule = rule_model.predict_proba(X_test_df)[:, 1]
    
    results["Rule-Based / Z-Score Baseline"] = {
        "Precision": float(precision_score(y_test, y_pred_rule, zero_division=0)),
        "Recall": float(recall_score(y_test, y_pred_rule, zero_division=0)),
        "F1-Score": float(f1_score(y_test, y_pred_rule, zero_division=0)),
        "ROC-AUC": float(roc_auc_score(y_test, y_prob_rule)),
    }
    roc_data["Rule-Based / Z-Score Baseline"] = roc_curve(y_test, y_prob_rule)
    cm_data["Rule-Based / Z-Score Baseline"] = confusion_matrix(y_test, y_pred_rule).tolist()
    
    # 2. Logistic Regression (Balanced)
    lr = LogisticRegression(class_weight="balanced", random_state=RANDOM_SEED, max_iter=500)
    lr.fit(X_train_scaled, y_train)
    y_pred_lr = lr.predict(X_test_scaled)
    y_prob_lr = lr.predict_proba(X_test_scaled)[:, 1]
    
    results["Logistic Regression (Balanced)"] = {
        "Precision": float(precision_score(y_test, y_pred_lr, zero_division=0)),
        "Recall": float(recall_score(y_test, y_pred_lr, zero_division=0)),
        "F1-Score": float(f1_score(y_test, y_pred_lr, zero_division=0)),
        "ROC-AUC": float(roc_auc_score(y_test, y_prob_lr)),
    }
    roc_data["Logistic Regression (Balanced)"] = roc_curve(y_test, y_prob_lr)
    cm_data["Logistic Regression (Balanced)"] = confusion_matrix(y_test, y_pred_lr).tolist()
    fitted_models["Logistic Regression (Balanced)"] = lr
    
    # 3. Random Forest Classifier
    rf = RandomForestClassifier(n_estimators=100, max_depth=6, class_weight="balanced", random_state=RANDOM_SEED)
    rf.fit(X_train_df, y_train)
    y_pred_rf = rf.predict(X_test_df)
    y_prob_rf = rf.predict_proba(X_test_df)[:, 1]
    
    results["Random Forest Classifier"] = {
        "Precision": float(precision_score(y_test, y_pred_rf, zero_division=0)),
        "Recall": float(recall_score(y_test, y_pred_rf, zero_division=0)),
        "F1-Score": float(f1_score(y_test, y_pred_rf, zero_division=0)),
        "ROC-AUC": float(roc_auc_score(y_test, y_prob_rf)),
    }
    roc_data["Random Forest Classifier"] = roc_curve(y_test, y_prob_rf)
    cm_data["Random Forest Classifier"] = confusion_matrix(y_test, y_pred_rf).tolist()
    fitted_models["Random Forest Classifier"] = rf
    
    # 4. Isolation Forest (Unsupervised Anomaly Isolation)
    iso = IsolationForest(contamination=0.04, random_state=RANDOM_SEED)
    iso.fit(X_train_df)
    iso_preds_raw = iso.predict(X_test_df)
    y_pred_iso = (iso_preds_raw == -1).astype(int)
    iso_scores = -iso.score_samples(X_test_df)
    
    results["Isolation Forest (Unsupervised)"] = {
        "Precision": float(precision_score(y_test, y_pred_iso, zero_division=0)),
        "Recall": float(recall_score(y_test, y_pred_iso, zero_division=0)),
        "F1-Score": float(f1_score(y_test, y_pred_iso, zero_division=0)),
        "ROC-AUC": float(roc_auc_score(y_test, iso_scores)),
    }
    roc_data["Isolation Forest (Unsupervised)"] = roc_curve(y_test, iso_scores)
    cm_data["Isolation Forest (Unsupervised)"] = confusion_matrix(y_test, y_pred_iso).tolist()
    fitted_models["Isolation Forest (Unsupervised)"] = iso
    
    # Print Table
    print("\nFraud Detection Benchmark Results (Out-of-Sample Holdout Set):")
    print("-" * 75)
    print(f"{'Model Name':<32} | {'Precision':<10} {'Recall':<10} {'F1-Score':<10} {'ROC-AUC':<10}")
    print("-" * 75)
    for name, m in results.items():
        print(f"{name:<32} | {m['Precision']:<10.4f} {m['Recall']:<10.4f} {m['F1-Score']:<10.4f} {m['ROC-AUC']:<10.4f}")
    print("-" * 75)
    
    # Save Metrics JSON
    metrics_path = METRICS_DIR / "fraud_detection_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump({"benchmark_results": results, "confusion_matrices": cm_data}, f, indent=2)
    print(f"\nSaved fraud detection metrics to: {metrics_path}")
    
    # Determine best model by F1-Score
    best_name = max(results.keys(), key=lambda k: results[k]["F1-Score"])
    best_f1 = results[best_name]["F1-Score"]
    best_auc = results[best_name]["ROC-AUC"]
    print(f"[BEST] Top Fraud Detection Model: '{best_name}' (F1 = {best_f1:.4f}, ROC-AUC = {best_auc:.4f})")
    
    # Save Model Artifact
    model_save_path = MODELS_DIR / "best_fraud_detection_model.joblib"
    joblib.dump(fitted_models[best_name], model_save_path)
    metadata = {
        "model_name": best_name,
        "f1_score": best_f1,
        "roc_auc": best_auc,
        "metrics": results[best_name],
        "feature_columns": feature_cols,
        "scaler_used": best_name == "Logistic Regression (Balanced)",
    }
    with open(MODELS_DIR / "best_fraud_detection_model.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved fraud model artifact to: {model_save_path}")
    
    # Plot 1: ROC Curves
    plot_path_roc = PLOTS_DIR / "fraud_detection_roc_curves.png"
    fig, ax = plt.subplots(figsize=(8, 6))
    
    colors = {"Rule-Based / Z-Score Baseline": "#9ca3af", "Logistic Regression (Balanced)": "#3b82f6", "Random Forest Classifier": "#10b981", "Isolation Forest (Unsupervised)": "#f59e0b"}
    
    for name, (fpr, tpr, _) in roc_data.items():
        auc_val = results[name]["ROC-AUC"]
        ax.plot(fpr, tpr, label=f"{name} (AUC = {auc_val:.3f})", color=colors.get(name, "#000"), linewidth=2.0)
        
    ax.plot([0, 1], [0, 1], "k--", alpha=0.5, label="Random Guess (AUC = 0.500)")
    ax.set_title("Fraud Detection: Receiver Operating Characteristic (ROC) Curves")
    ax.set_xlabel("False Positive Rate (1 - Specificity)")
    ax.set_ylabel("True Positive Rate (Recall)")
    ax.legend(loc="lower right", framealpha=0.95)
    ax.grid(True, linestyle="--", alpha=0.5)
    
    plt.tight_layout()
    plt.savefig(plot_path_roc, dpi=300)
    plt.close()
    print(f"Saved ROC curves plot to: {plot_path_roc}")
    
    # Plot 2: Feature Importance (from Random Forest)
    plot_path_imp = PLOTS_DIR / "fraud_feature_importance.png"
    importances = rf.feature_importances_
    sorted_idx = np.argsort(importances)
    
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.barh(np.array(feature_cols)[sorted_idx], importances[sorted_idx], color="#10b981", alpha=0.85)
    ax.set_title("Random Forest Gini Feature Importances for Fraud Risk Scoring")
    ax.set_xlabel("Mean Decrease in Impurity (Gini Importance)")
    ax.grid(True, linestyle="--", alpha=0.5, axis="x")
    
    plt.tight_layout()
    plt.savefig(plot_path_imp, dpi=300)
    plt.close()
    print(f"Saved feature importance plot to: {plot_path_imp}")
    
    return results

if __name__ == "__main__":
    run_fraud_detection_experiment()
