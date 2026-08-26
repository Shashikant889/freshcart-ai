"""
FreshCart AI — Module 2: Demand Forecasting Experiment (Leak-Free Recursive Multi-Step Forecast)
Implements, benchmarks, and evaluates time-series forecasting models:
1. 7-Day Moving Average (Recursive Baseline)
2. Ordinary Least Squares (OLS) Linear Regression (Recursive Multi-Step)
3. Ridge Regression (L2 Regularized Recursive Multi-Step)
4. Random Forest Regressor (Recursive Multi-Step)
5. Gradient Boosting Regressor (GBR Recursive Multi-Step)
6. SARIMAX (Dynamic Out-of-Sample Forecast)

Strict chronological train/test split: 30-day out-of-sample holdout horizon with zero lookahead leakage.
"""

import sys
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
import statsmodels.api as sm
from statsmodels.tsa.statespace.sarimax import SARIMAX

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from ml.python.config import (
    DEMAND_FORECASTING_CONFIG,
    MODELS_DIR,
    METRICS_DIR,
    PLOTS_DIR,
    RANDOM_SEED,
    PLOT_STYLE,
)
from ml.python.data_loader import load_sales_time_series

plt.rcParams.update(PLOT_STYLE)

def calculate_metrics(y_true, y_pred):
    """Compute MAE, RMSE, and MAPE with epsilon protection."""
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    non_zero = y_true > 0
    mape = np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100.0
    return {
        "MAE": float(mae),
        "RMSE": float(rmse),
        "MAPE": float(mape),
    }

def construct_train_features(daily_df):
    """Construct autoregressive feature matrix for training set."""
    df = daily_df.copy()
    for lag in [1, 2, 3, 7, 14]:
        df[f"lag_{lag}"] = df["total_quantity"].shift(lag)
    df["rolling_mean_7"] = df["total_quantity"].shift(1).rolling(7).mean()
    df["rolling_std_7"] = df["total_quantity"].shift(1).rolling(7).std()
    df["rolling_mean_14"] = df["total_quantity"].shift(1).rolling(14).mean()
    df["rolling_mean_30"] = df["total_quantity"].shift(1).rolling(30).mean()
    df = df.dropna().reset_index(drop=True)
    return df

def recursive_multistep_forecast(model, train_series, test_df, feature_cols):
    """
    Perform leak-free recursive multi-step forecasting for H=30 steps.
    Future lags are filled with prior predictions rather than ground-truth lookaheads.
    """
    history = list(train_series)
    predictions = []
    
    for _, test_row in test_df.iterrows():
        # Build feature vector from current history state
        lag_1 = history[-1]
        lag_2 = history[-2]
        lag_3 = history[-3]
        lag_7 = history[-7]
        lag_14 = history[-14]
        
        rolling_mean_7 = np.mean(history[-7:])
        rolling_std_7 = np.std(history[-7:], ddof=1) if len(history) >= 7 else 0.0
        rolling_mean_14 = np.mean(history[-14:])
        rolling_mean_30 = np.mean(history[-30:])
        
        feat_dict = {
            "day_of_week": test_row["day_of_week"],
            "is_weekend": test_row["is_weekend"],
            "day_of_month": test_row["day_of_month"],
            "month": test_row["month"],
            "lag_1": lag_1,
            "lag_2": lag_2,
            "lag_3": lag_3,
            "lag_7": lag_7,
            "lag_14": lag_14,
            "rolling_mean_7": rolling_mean_7,
            "rolling_std_7": rolling_std_7,
            "rolling_mean_14": rolling_mean_14,
            "rolling_mean_30": rolling_mean_30,
        }
        
        x_vec = np.array([[feat_dict[c] for c in feature_cols]])
        pred_val = float(model.predict(x_vec)[0])
        pred_val = max(0.0, pred_val)  # non-negative constraint
        
        predictions.append(pred_val)
        history.append(pred_val)  # Append prediction to history for next step
        
    return np.array(predictions)

def run_demand_forecasting_experiment():
    print("\n" + "=" * 60)
    print("  >> RUNNING MODULE 2: DEMAND FORECASTING EXPERIMENT (LEAK-FREE)")
    print("=" * 60)
    
    daily_total, _ = load_sales_time_series()
    print(f"Loaded Aggregated Daily Sales Series: {len(daily_total)} total observations")
    print(f"Date range: {daily_total['date'].min().strftime('%Y-%m-%d')} to {daily_total['date'].max().strftime('%Y-%m-%d')}")
    
    test_days = DEMAND_FORECASTING_CONFIG["test_days"]
    raw_train_df = daily_total.iloc[:-test_days].copy().reset_index(drop=True)
    test_df = daily_total.iloc[-test_days:].copy().reset_index(drop=True)
    
    print(f"Chronological Split: {len(raw_train_df)} Training days | {len(test_df)} Test days (Horizon: {test_days}d)")
    
    # Feature columns for regression models
    feature_cols = [
        "day_of_week",
        "is_weekend",
        "day_of_month",
        "month",
        "lag_1",
        "lag_2",
        "lag_3",
        "lag_7",
        "lag_14",
        "rolling_mean_7",
        "rolling_std_7",
        "rolling_mean_14",
        "rolling_mean_30",
    ]
    
    train_feat_df = construct_train_features(raw_train_df)
    X_train = train_feat_df[feature_cols].values
    y_train = train_feat_df["total_quantity"].values
    
    y_test = test_df["total_quantity"].values
    train_series = raw_train_df["total_quantity"].values
    
    results = {}
    predictions = {"Date": test_df["date"].dt.strftime("%Y-%m-%d").tolist(), "Actual": y_test.tolist()}
    fitted_models = {}
    
    # 1. 7-Day Moving Average Baseline (Recursive)
    ma_history = list(train_series)
    y_pred_ma = []
    for _ in range(test_days):
        ma_val = float(np.mean(ma_history[-7:]))
        y_pred_ma.append(ma_val)
        ma_history.append(ma_val)
    y_pred_ma = np.array(y_pred_ma)
    results["7-Day Moving Average (Baseline)"] = calculate_metrics(y_test, y_pred_ma)
    predictions["7-Day Moving Average (Baseline)"] = y_pred_ma.tolist()
    
    # 2. Ordinary Least Squares (OLS) Linear Regression (Recursive Multi-Step)
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    y_pred_lr = recursive_multistep_forecast(lr, train_series, test_df, feature_cols)
    results["OLS Linear Regression"] = calculate_metrics(y_test, y_pred_lr)
    predictions["OLS Linear Regression"] = y_pred_lr.tolist()
    fitted_models["OLS Linear Regression"] = lr
    
    # 3. Ridge Regression (Recursive Multi-Step)
    ridge = Ridge(alpha=10.0, random_state=RANDOM_SEED)
    ridge.fit(X_train, y_train)
    y_pred_ridge = recursive_multistep_forecast(ridge, train_series, test_df, feature_cols)
    results["Ridge Regression (L2)"] = calculate_metrics(y_test, y_pred_ridge)
    predictions["Ridge Regression (L2)"] = y_pred_ridge.tolist()
    fitted_models["Ridge Regression (L2)"] = ridge
    
    # 4. Random Forest Regressor (Recursive Multi-Step)
    rf = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=RANDOM_SEED)
    rf.fit(X_train, y_train)
    y_pred_rf = recursive_multistep_forecast(rf, train_series, test_df, feature_cols)
    results["Random Forest Regressor"] = calculate_metrics(y_test, y_pred_rf)
    predictions["Random Forest Regressor"] = y_pred_rf.tolist()
    fitted_models["Random Forest Regressor"] = rf
    
    # 5. Gradient Boosting Regressor (Recursive Multi-Step)
    gbr = GradientBoostingRegressor(n_estimators=100, learning_rate=0.05, max_depth=4, random_state=RANDOM_SEED)
    gbr.fit(X_train, y_train)
    y_pred_gbr = recursive_multistep_forecast(gbr, train_series, test_df, feature_cols)
    results["Gradient Boosting (GBR)"] = calculate_metrics(y_test, y_pred_gbr)
    predictions["Gradient Boosting (GBR)"] = y_pred_gbr.tolist()
    fitted_models["Gradient Boosting (GBR)"] = gbr
    
    # 6. SARIMAX Time Series Model (Dynamic Out-of-Sample Forecast)
    try:
        sarimax = SARIMAX(
            train_series,
            order=(1, 1, 1),
            seasonal_order=(1, 0, 1, 7),
            enforce_stationarity=False,
            enforce_invertibility=False,
        )
        sarimax_res = sarimax.fit(disp=False, maxiter=200)
        y_pred_sarimax = sarimax_res.forecast(steps=test_days)
        results["SARIMAX(1,1,1)x(1,0,1)_7"] = calculate_metrics(y_test, y_pred_sarimax)
        predictions["SARIMAX(1,1,1)x(1,0,1)_7"] = y_pred_sarimax.tolist()
        fitted_models["SARIMAX(1,1,1)x(1,0,1)_7"] = sarimax_res
    except Exception as e:
        print(f"  [WARN] SARIMAX fitting failed: {e}")
        
    # Print Table
    print("\nDemand Forecasting Benchmark Results (30-Day Out-of-Sample Holdout):")
    print("-" * 65)
    print(f"{'Model Name':<32} | {'MAE':<9} {'RMSE':<9} {'MAPE (%)':<9}")
    print("-" * 65)
    for name, m in results.items():
        print(f"{name:<32} | {m['MAE']:<9.2f} {m['RMSE']:<9.2f} {m['MAPE']:<9.2f} %")
    print("-" * 65)
    
    # Save Metrics JSON
    metrics_path = METRICS_DIR / "demand_forecasting_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved forecasting metrics to: {metrics_path}")
    
    # Best Model (lowest RMSE)
    best_name = min(results.keys(), key=lambda k: results[k]["RMSE"])
    best_rmse = results[best_name]["RMSE"]
    best_mape = results[best_name]["MAPE"]
    print(f"[BEST] Top Demand Forecasting Model: '{best_name}' (RMSE = {best_rmse:.2f}, MAPE = {best_mape:.2f}%)")
    
    # Save Best Model Artifact
    if best_name in fitted_models:
        model_save_path = MODELS_DIR / "best_demand_forecasting_model.joblib"
        joblib.dump(fitted_models[best_name], model_save_path)
        metadata = {
            "model_name": best_name,
            "rmse": best_rmse,
            "mape": best_mape,
            "metrics": results[best_name],
            "feature_columns": feature_cols,
            "forecast_horizon_days": test_days,
        }
        with open(MODELS_DIR / "best_demand_forecasting_model.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2)
        print(f"Saved forecasting model artifact to: {model_save_path}")
        
    # Generate Forecast Comparison Plots
    plot_path = PLOTS_DIR / "demand_forecast_vs_actual.png"
    fig, ax = plt.subplots(figsize=(12, 6))
    
    dates = pd.to_datetime(predictions["Date"])
    ax.plot(dates, predictions["Actual"], label="Ground-Truth Actual", color="#111827", linewidth=2.5, marker="o", markersize=4)
    
    palette = {"7-Day Moving Average (Baseline)": "#9ca3af", "OLS Linear Regression": "#3b82f6", "Random Forest Regressor": "#10b981", "SARIMAX(1,1,1)x(1,0,1)_7": "#ef4444", "Gradient Boosting (GBR)": "#8b5cf6"}
    
    for name, preds in predictions.items():
        if name not in ["Date", "Actual"] and name in palette:
            ax.plot(dates, preds, label=f"{name} (MAPE: {results[name]['MAPE']:.1f}%)", color=palette[name], linewidth=1.8, linestyle="--" if "Baseline" in name else "-")
            
    ax.set_title("Demand Forecasting: 30-Day Out-of-Sample Holdout Trajectory Comparison")
    ax.set_xlabel("Forecast Date")
    ax.set_ylabel("Total Units Demanded")
    ax.legend(loc="upper left", framealpha=0.95)
    ax.grid(True, linestyle="--", alpha=0.5)
    
    plt.tight_layout()
    plt.savefig(plot_path, dpi=300)
    plt.close()
    print(f"Saved demand forecast plot to: {plot_path}")
    
    # Error Bar Comparison Plot
    plot_path_bar = PLOTS_DIR / "demand_forecasting_model_comparison.png"
    fig, ax = plt.subplots(figsize=(10, 5))
    m_names = list(results.keys())
    x = np.arange(len(m_names))
    width = 0.35
    
    rmse_vals = [results[m]["RMSE"] for m in m_names]
    mae_vals = [results[m]["MAE"] for m in m_names]
    
    ax.bar(x - width/2, mae_vals, width, label="MAE (units)", color="#3b82f6", alpha=0.9)
    ax.bar(x + width/2, rmse_vals, width, label="RMSE (units)", color="#ef4444", alpha=0.9)
    
    ax.set_title("Demand Forecasting: Error Metric Comparison (30-Day Holdout)")
    ax.set_ylabel("Error in Units")
    ax.set_xticks(x)
    ax.set_xticklabels(m_names, rotation=20, ha="right")
    ax.legend()
    ax.grid(True, linestyle="--", alpha=0.5, axis="y")
    
    plt.tight_layout()
    plt.savefig(plot_path_bar, dpi=300)
    plt.close()
    print(f"Saved model error comparison plot to: {plot_path_bar}")
    
    return results

if __name__ == "__main__":
    run_demand_forecasting_experiment()
