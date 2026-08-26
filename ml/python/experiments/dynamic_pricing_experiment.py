"""
FreshCart AI — Module 3: Dynamic Pricing & Elasticity Optimization Experiment (Econometric Audit)
Estimates empirical Price Elasticity of Demand (Ed) using Log-Log OLS Regression:
    ln(Q) = beta_0 + beta_1 * ln(P) + epsilon
Evaluates on:
1. 70% Estimation Sample (Standard Errors, t-stats, p-values, 95% CI, R^2)
2. 30% Holdout Validation Sample (Out-of-Sample Prediction MAE and R^2)
3. 1,000-Run Monte Carlo Simulation comparing Base Fixed Price vs Bounded Revenue-Optimal Price:
    P* = argmax P * Q(P) subject to 0.75 * P_0 <= P <= 1.25 * P_0

Academic Label: SIMULATED / MODEL-BASED ESTIMATE under Constant Elasticity of Demand (CED).
"""

import sys
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import statsmodels.api as sm
from sklearn.metrics import mean_absolute_error, r2_score

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from ml.python.config import (
    DYNAMIC_PRICING_CONFIG,
    MODELS_DIR,
    METRICS_DIR,
    PLOTS_DIR,
    RANDOM_SEED,
    PLOT_STYLE,
)
from ml.python.data_loader import load_pricing_experiment_data

plt.rcParams.update(PLOT_STYLE)

class PriceElasticityModel:
    """Econometric Price Elasticity Estimator & Bounded Revenue Optimizer."""
    def __init__(self):
        self.category_models = {}
        self.category_stats = {}
        
    def fit(self, estimation_df: pd.DataFrame):
        categories = estimation_df["category"].unique()
        for cat in categories:
            cat_df = estimation_df[estimation_df["category"] == cat]
            X = sm.add_constant(cat_df["log_price"].values)
            y = cat_df["log_quantity"].values
            
            ols_res = sm.OLS(y, X).fit()
            self.category_models[cat] = ols_res
            
            beta_1 = float(ols_res.params[1])
            se_1 = float(ols_res.bse[1])
            t_stat = float(ols_res.tvalues[1])
            p_val = float(ols_res.pvalues[1])
            ci_lower = beta_1 - 1.96 * se_1
            ci_upper = beta_1 + 1.96 * se_1
            r2 = float(ols_res.rsquared)
            
            self.category_stats[cat] = {
                "elasticity": beta_1,
                "std_error": se_1,
                "t_stat": t_stat,
                "p_value": p_val,
                "ci_95": [ci_lower, ci_upper],
                "r_squared": r2,
                "sample_size": len(cat_df),
                "demand_type": "Price Elastic (|Ed| > 1)" if abs(beta_1) > 1.0 else "Inelastic (|Ed| <= 1)",
            }
        return self
        
    def predict_quantity(self, category: str, base_price: float, new_price: float, base_q: float = 35.0):
        ed = self.category_stats.get(category, {}).get("elasticity", -1.0)
        q = base_q * ((new_price / base_price) ** ed)
        return max(1.0, float(q))
        
    def compute_optimal_price(self, base_price: float, category: str, cost: float = 0.0, bounds=(-0.25, 0.25)):
        """
        Compute optimal price P* maximizing expected profit or revenue.
        Constrained by safety bounds [-25%, +25%].
        """
        ed = self.category_stats.get(category, {}).get("elasticity", -1.0)
        p_min = base_price * (1.0 + bounds[0])
        p_max = base_price * (1.0 + bounds[1])
        candidate_prices = np.linspace(p_min, p_max, 200)
        
        best_p = base_price
        best_objective = -1e9
        
        for p in candidate_prices:
            expected_q = 35.0 * ((p / base_price) ** ed)
            profit_or_rev = (p - cost) * expected_q
            if profit_or_rev > best_objective:
                best_objective = profit_or_rev
                best_p = p
                
        return float(best_p), float(ed)

def run_dynamic_pricing_experiment():
    print("\n" + "=" * 60)
    print("  >> RUNNING MODULE 3: DYNAMIC PRICING & ELASTICITY EXPERIMENT")
    print("=" * 60)
    
    estimation_df, validation_df, products = load_pricing_experiment_data()
    print(f"Loaded Catalog Products: {len(products)} items across {products['category'].nunique()} categories")
    print(f"Dataset Partition: {len(estimation_df)} Estimation obs (70%) | {len(validation_df)} Holdout Validation obs (30%)")
    
    # 1. Fit Econometric Model
    model = PriceElasticityModel()
    model.fit(estimation_df)
    
    print("\nEconometric Log-Log OLS Estimation (70% Estimation Sample):")
    print("-" * 85)
    print(f"{'Category':<16} | {'Ed (beta_1)':<12} {'Std. Error':<11} {'t-stat':<8} {'p-value':<8} {'R-squared':<10} {'95% CI':<15}")
    print("-" * 85)
    for cat, s in model.category_stats.items():
        ci_str = f"[{s['ci_95'][0]:.2f}, {s['ci_95'][1]:.2f}]"
        print(f"{cat:<16} | {s['elasticity']:<12.3f} {s['std_error']:<11.4f} {s['t_stat']:<8.2f} {s['p_value']:<8.4f} {s['r_squared']:<10.4f} {ci_str:<15}")
    print("-" * 85)
    
    # 2. Out-of-Sample Validation on 30% Holdout
    val_preds = []
    for _, row in validation_df.iterrows():
        pred_q = model.predict_quantity(row["category"], row["base_price"], row["simulated_price"], base_q=35.0)
        val_preds.append(pred_q)
    validation_df["pred_quantity"] = val_preds
    
    oos_mae = mean_absolute_error(validation_df["quantity_demanded"], validation_df["pred_quantity"])
    oos_r2 = r2_score(validation_df["quantity_demanded"], validation_df["pred_quantity"])
    print(f"\nOut-of-Sample Validation on Unseen Price Shocks (N={len(validation_df)}):")
    print(f"  Holdout Demand MAE: {oos_mae:.2f} units | Holdout R-squared: {oos_r2:.4f}")
    
    # 3. Monte Carlo Simulation: Base Fixed vs Bounded Dynamic Revenue Optimal
    np.random.seed(RANDOM_SEED)
    mc_rounds = DYNAMIC_PRICING_CONFIG["mc_simulations"]
    sim_results = []
    
    for _, prod in products.iterrows():
        base_p = prod["price"]
        cat = prod["category"]
        opt_p, ed = model.compute_optimal_price(base_p, cat, bounds=(-0.25, 0.25))
        unit_cost = base_p * 0.60
        
        noise = np.random.normal(0, 0.05, size=mc_rounds)
        base_demand = np.maximum(1.0, 35.0 * np.exp(noise))
        opt_demand = np.maximum(1.0, 35.0 * ((opt_p / base_p) ** ed) * np.exp(noise))
        
        base_rev = base_demand * base_p
        opt_rev = opt_demand * opt_p
        
        base_profit = (base_p - unit_cost) * base_demand
        opt_profit = (opt_p - unit_cost) * opt_demand
        
        sim_results.append({
            "product_id": prod["id"],
            "product_name": prod["name"],
            "category": cat,
            "base_price": base_p,
            "optimal_price": opt_p,
            "price_delta_pct": ((opt_p - base_p) / base_p) * 100.0,
            "elasticity": ed,
            "mean_base_revenue": float(np.mean(base_rev)),
            "mean_opt_revenue": float(np.mean(opt_rev)),
            "revenue_lift_pct": float(((np.mean(opt_rev) - np.mean(base_rev)) / np.mean(base_rev)) * 100.0),
            "mean_base_profit": float(np.mean(base_profit)),
            "mean_opt_profit": float(np.mean(opt_profit)),
            "profit_lift_pct": float(((np.mean(opt_profit) - np.mean(base_profit)) / np.mean(base_profit)) * 100.0),
        })
        
    sim_df_res = pd.DataFrame(sim_results)
    
    tot_base_rev = sim_df_res["mean_base_revenue"].sum()
    tot_opt_rev = sim_df_res["mean_opt_revenue"].sum()
    tot_rev_lift_pct = ((tot_opt_rev - tot_base_rev) / tot_base_rev) * 100.0
    
    tot_base_prof = sim_df_res["mean_base_profit"].sum()
    tot_opt_prof = sim_df_res["mean_opt_profit"].sum()
    tot_prof_lift_pct = ((tot_opt_prof - tot_base_prof) / tot_base_prof) * 100.0
    
    print("\nMonte Carlo Pricing Simulation Results (Across 31 Products, 1000 Runs):")
    print("  [Academic Label: SIMULATED / MODEL-BASED ESTIMATE]")
    print("-" * 75)
    print(f"  Fixed Base Daily Revenue:      ₹{tot_base_rev:,.2f}")
    print(f"  Dynamic Optimized Revenue:     ₹{tot_opt_rev:,.2f}")
    print(f"  Net Daily Revenue Lift:        +₹{tot_opt_rev - tot_base_rev:,.2f} (+{tot_rev_lift_pct:.2f}%)")
    print(f"  Fixed Base Daily Profit:       ₹{tot_base_prof:,.2f}")
    print(f"  Dynamic Optimized Profit:      ₹{tot_opt_prof:,.2f}")
    print(f"  Net Daily Profit Lift:         +₹{tot_opt_prof - tot_base_prof:,.2f} (+{tot_prof_lift_pct:.2f}%)")
    print("-" * 75)
    
    # Save Metrics JSON
    metrics_data = {
        "category_elasticities": model.category_stats,
        "out_of_sample_validation": {
            "validation_samples": len(validation_df),
            "mae": oos_mae,
            "r2": oos_r2,
        },
        "simulation_summary": {
            "num_products": len(products),
            "mc_runs": mc_rounds,
            "baseline_daily_revenue": tot_base_rev,
            "optimized_daily_revenue": tot_opt_rev,
            "net_revenue_lift_pct": tot_rev_lift_pct,
            "baseline_daily_profit": tot_base_prof,
            "optimized_daily_profit": tot_opt_prof,
            "net_profit_lift_pct": tot_prof_lift_pct,
        },
        "product_optimizations": sim_results,
    }
    
    metrics_path = METRICS_DIR / "dynamic_pricing_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"\nSaved pricing metrics to: {metrics_path}")
    
    # Save Model Artifact
    model_save_path = MODELS_DIR / "price_elasticity_model.joblib"
    joblib.dump(model, model_save_path)
    with open(MODELS_DIR / "price_elasticity_model.json", "w", encoding="utf-8") as f:
        json.dump(metrics_data["category_elasticities"], f, indent=2)
    print(f"Saved pricing model artifact to: {model_save_path}")
    
    # Generate Plots
    # Plot 1: Demand Curves
    plot_path1 = PLOTS_DIR / "price_elasticity_demand_curves.png"
    fig, axes = plt.subplots(2, 3, figsize=(14, 9))
    axes = axes.flatten()
    
    cat_list = list(model.category_stats.keys())
    for i, cat in enumerate(cat_list[:6]):
        cat_df = estimation_df[estimation_df["category"] == cat]
        ed = model.category_stats[cat]["elasticity"]
        r2 = model.category_stats[cat]["r_squared"]
        
        p_ratios = cat_df["price_ratio"].values
        q_vals = cat_df["quantity_demanded"].values
        
        axes[i].scatter(p_ratios, q_vals, alpha=0.35, color="#3b82f6", s=18, label="Estimation Points")
        
        fit_p = np.linspace(0.75, 1.25, 100)
        fit_q = 35.0 * (fit_p ** ed)
        axes[i].plot(fit_p, fit_q, color="#ef4444", linewidth=2.2, label=f"Fit: Ed={ed:.2f} (R²={r2:.2f})")
        
        axes[i].set_title(f"Category: {cat}")
        axes[i].set_xlabel("Price Ratio (P / P_base)")
        axes[i].set_ylabel("Quantity Demanded")
        axes[i].grid(True, linestyle="--", alpha=0.5)
        axes[i].legend(loc="upper right", fontsize=8)
        
    plt.tight_layout()
    plt.savefig(plot_path1, dpi=300)
    plt.close()
    print(f"Saved demand curves plot to: {plot_path1}")
    
    # Plot 2: Revenue Lift Comparison by Category
    plot_path2 = PLOTS_DIR / "pricing_revenue_simulation.png"
    cat_grp = sim_df_res.groupby("category")[["mean_base_revenue", "mean_opt_revenue"]].sum()
    
    fig, ax = plt.subplots(figsize=(10, 5))
    x = np.arange(len(cat_grp))
    width = 0.35
    
    ax.bar(x - width/2, cat_grp["mean_base_revenue"], width, label="Base Fixed Revenue (₹)", color="#6b7280", alpha=0.85)
    ax.bar(x + width/2, cat_grp["mean_opt_revenue"], width, label="Dynamic Optimal Revenue (₹)", color="#10b981", alpha=0.85)
    
    ax.set_title("Simulated Category Daily Revenue Lift (Monte Carlo, N=1,000)")
    ax.set_ylabel("Daily Revenue (₹)")
    ax.set_xticks(x)
    ax.set_xticklabels(cat_grp.index, rotation=15, ha="right")
    ax.legend()
    ax.grid(True, linestyle="--", alpha=0.5, axis="y")
    
    plt.tight_layout()
    plt.savefig(plot_path2, dpi=300)
    plt.close()
    print(f"Saved revenue simulation plot to: {plot_path2}")
    
    return metrics_data

if __name__ == "__main__":
    run_dynamic_pricing_experiment()
