"""
FreshCart AI — Module 1: Inventory Optimization Experiment
Benchmarks:
1. Baseline Policy: Static fixed reorder threshold & arbitrary batch size
2. Optimized Policy: Continuous Review (r, Q) with Economic Order Quantity (EOQ) & Safety Stock ROP

Evaluates across 31 SKUs over 180 simulated operating days across multiple operational scenarios:
- Scenario A: Baseline Urban Demand & Standard Supplier Lead Time
- Scenario B: High Demand Volatility (+80% variance)
- Scenario C: Supply Chain Disruption (+100% lead time delay)
"""

import sys
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from ml.python.config import (
    MODELS_DIR,
    METRICS_DIR,
    PLOTS_DIR,
    RANDOM_SEED,
    PLOT_STYLE,
)
from ml.python.data_loader import load_products_df, load_sales_time_series
from ml.python.optimization.inventory_optimization import (
    InventoryOptimizer,
    simulate_inventory_policy,
)

plt.rcParams.update(PLOT_STYLE)

def run_inventory_optimization_experiment():
    print("\n" + "=" * 65)
    print("  >> RUNNING MODULE 1: INVENTORY OPTIMIZATION EXPERIMENT")
    print("=" * 65)
    
    products = load_products_df()
    _, sales_history = load_sales_time_series()
    
    print(f"Loaded Catalog: {len(products)} SKUs across {products['category'].nunique()} categories")
    print(f"Loaded Sales History: {len(sales_history)} SKU-daily records")
    
    optimizer = InventoryOptimizer(
        service_level=0.95,
        ordering_cost_per_po=350.0,
        annual_holding_rate=0.20,
        stockout_penalty_multiplier=1.5,
    )
    
    lead_time_map = {
        "Fruits": (1.5, 0.4),
        "Vegetables": (1.5, 0.4),
        "Dairy & Bakery": (2.0, 0.5),
        "Beverages": (3.5, 0.8),
        "Organic": (3.0, 0.7),
        "Snacks": (4.0, 1.0),
    }
    
    # 1. Benchmark Across All 31 Catalog SKUs (Standard Scenario)
    sku_benchmarks = []
    sample_trajectory = None
    
    for _, p in products.iterrows():
        sku_id = p["id"]
        sku_sales = sales_history[sales_history["product_id"] == sku_id].sort_values("date")
        
        if len(sku_sales) > 0:
            demands = sku_sales["quantity_sold"].values
        else:
            np.random.seed(RANDOM_SEED)
            demands = np.random.poisson(lam=8.5, size=180)
            
        lt_mean, lt_std = lead_time_map.get(p["category"], (2.0, 0.5))
        
        params = optimizer.calculate_sku_parameters(
            sku_id=sku_id,
            name=p["name"],
            unit_price=float(p["price"]),
            daily_demands=demands,
            lead_time_days=lt_mean,
            lead_time_std=lt_std,
            wholesale_cost_ratio=0.65,
        )
        
        # Simulate Baseline vs Optimized Policy
        base_res = simulate_inventory_policy(params, demands, policy_type="baseline", sim_days=180, seed=RANDOM_SEED)
        opt_res = simulate_inventory_policy(params, demands, policy_type="optimized", sim_days=180, seed=RANDOM_SEED)
        
        cost_reduction = base_res["total_cost"] - opt_res["total_cost"]
        cost_reduction_pct = (cost_reduction / base_res["total_cost"] * 100.0) if base_res["total_cost"] > 0 else 0.0
        
        sku_benchmarks.append({
            "sku_id": sku_id,
            "name": p["name"],
            "category": p["category"],
            "price": float(p["price"]),
            "eoq": params["eoq"],
            "safety_stock": params["safety_stock"],
            "rop": params["rop"],
            "baseline_cost": base_res["total_cost"],
            "optimized_cost": opt_res["total_cost"],
            "cost_reduction_inr": cost_reduction,
            "cost_reduction_pct": cost_reduction_pct,
            "baseline_service_level": base_res["service_level"] * 100.0,
            "optimized_service_level": opt_res["service_level"] * 100.0,
            "baseline_stockout_days": base_res["stockout_days"],
            "optimized_stockout_days": opt_res["stockout_days"],
            "baseline_orders": base_res["orders_placed"],
            "optimized_orders": opt_res["orders_placed"],
            "baseline_avg_inventory": base_res["avg_inventory"],
            "optimized_avg_inventory": opt_res["avg_inventory"],
        })
        
        if sku_id == "f1" or sample_trajectory is None:
            sample_trajectory = {
                "sku_id": sku_id,
                "name": p["name"],
                "baseline_history": base_res["history_on_hand"],
                "optimized_history": opt_res["history_on_hand"],
                "demand_history": demands[:180].tolist(),
                "baseline_stockouts": base_res["history_stockouts"],
                "optimized_stockouts": opt_res["history_stockouts"],
                "rop": params["rop"],
                "safety_stock": params["safety_stock"],
            }
            
    df_results = pd.DataFrame(sku_benchmarks)
    
    # 2. Multi-Scenario Sensitivity Stress Test
    scenarios = {
        "Scenario A (Standard Demand & Lead Time)": {"volatility": 1.0, "lead_mult": 1.0},
        "Scenario B (High Volatility +80%)": {"volatility": 1.8, "lead_mult": 1.0},
        "Scenario C (Supply Delay +100%)": {"volatility": 1.0, "lead_mult": 2.0},
    }
    
    scenario_metrics = {}
    for sc_name, sc_cfg in scenarios.items():
        base_costs, opt_costs, base_sls, opt_sls, base_sos, opt_sos = [], [], [], [], [], []
        
        for _, p in products.iterrows():
            sku_id = p["id"]
            sku_sales = sales_history[sales_history["product_id"] == sku_id].sort_values("date")
            demands = sku_sales["quantity_sold"].values if len(sku_sales) > 0 else np.random.poisson(8.5, 180)
            
            # Apply scenario transformation
            sc_demands = demands * sc_cfg["volatility"]
            lt_mean, lt_std = lead_time_map.get(p["category"], (2.0, 0.5))
            lt_mean *= sc_cfg["lead_mult"]
            lt_std *= sc_cfg["lead_mult"]
            
            p_params = optimizer.calculate_sku_parameters(
                sku_id=sku_id, name=p["name"], unit_price=float(p["price"]),
                daily_demands=sc_demands, lead_time_days=lt_mean, lead_time_std=lt_std
            )
            
            b_res = simulate_inventory_policy(p_params, sc_demands, policy_type="baseline", sim_days=180)
            o_res = simulate_inventory_policy(p_params, sc_demands, policy_type="optimized", sim_days=180)
            
            base_costs.append(b_res["total_cost"])
            opt_costs.append(o_res["total_cost"])
            base_sls.append(b_res["service_level"] * 100.0)
            opt_sls.append(o_res["service_level"] * 100.0)
            base_sos.append(b_res["stockout_days"])
            opt_sos.append(o_res["stockout_days"])
            
        tot_base_c = sum(base_costs)
        tot_opt_c = sum(opt_costs)
        c_reduction = ((tot_base_c - tot_opt_c) / tot_base_c) * 100.0
        
        scenario_metrics[sc_name] = {
            "total_baseline_cost_inr": float(tot_base_c),
            "total_optimized_cost_inr": float(tot_opt_c),
            "cost_reduction_pct": float(c_reduction),
            "mean_baseline_service_level": float(np.mean(base_sls)),
            "mean_optimized_service_level": float(np.mean(opt_sls)),
            "total_baseline_stockout_days": int(sum(base_sos)),
            "total_optimized_stockout_days": int(sum(opt_sos)),
        }
        
    tot_base = df_results["baseline_cost"].sum()
    tot_opt = df_results["optimized_cost"].sum()
    net_savings_pct = ((tot_base - tot_opt) / tot_base) * 100.0
    mean_base_sl = df_results["baseline_service_level"].mean()
    mean_opt_sl = df_results["optimized_service_level"].mean()
    tot_base_stockouts = df_results["baseline_stockout_days"].sum()
    tot_opt_stockouts = df_results["optimized_stockout_days"].sum()
    
    print("\nInventory Optimization Benchmark Results (180-Day Simulation Across 31 SKUs):")
    print("-" * 75)
    print(f"  Total Baseline Inventory Cost:   ₹{tot_base:,.2f}")
    print(f"  Total Optimized Inventory Cost:  ₹{tot_opt:,.2f}")
    print(f"  Net Total Cost Reduction:        -₹{tot_base - tot_opt:,.2f} ({net_savings_pct:.2f}% savings)")
    print(f"  Baseline Mean Service Level:     {mean_base_sl:.2f}%")
    print(f"  Optimized Mean Service Level:    {mean_opt_sl:.2f}% (Target: 95.00%)")
    print(f"  Baseline Total Stockout Days:    {tot_base_stockouts} days")
    print(f"  Optimized Total Stockout Days:   {tot_opt_stockouts} days (-{((tot_base_stockouts - tot_opt_stockouts)/tot_base_stockouts)*100:.1f}%)")
    print("-" * 75)
    
    # Save Metrics JSON
    summary_data = {
        "num_skus_evaluated": len(products),
        "simulation_days": 180,
        "overall_summary": {
            "total_baseline_cost": float(tot_base),
            "total_optimized_cost": float(tot_opt),
            "cost_reduction_pct": float(net_savings_pct),
            "baseline_service_level_pct": float(mean_base_sl),
            "optimized_service_level_pct": float(mean_opt_sl),
            "baseline_stockout_days": int(tot_base_stockouts),
            "optimized_stockout_days": int(tot_opt_stockouts),
            "mean_sku_cost_reduction_pct": float(df_results["cost_reduction_pct"].mean()),
            "median_sku_cost_reduction_pct": float(df_results["cost_reduction_pct"].median()),
            "best_case_cost_reduction_pct": float(df_results["cost_reduction_pct"].max()),
            "worst_case_cost_reduction_pct": float(df_results["cost_reduction_pct"].min()),
        },
        "scenario_stress_tests": scenario_metrics,
        "sku_details": sku_benchmarks,
    }
    
    metrics_path = METRICS_DIR / "inventory_optimization_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)
    print(f"\nSaved inventory metrics to: {metrics_path}")
    
    # Save Model Artifact
    model_save_path = MODELS_DIR / "inventory_optimizer.joblib"
    joblib.dump(optimizer, model_save_path)
    print(f"Saved inventory optimizer artifact to: {model_save_path}")
    
    # Plot 1: Total Cost by Category Comparison
    plot_path1 = PLOTS_DIR / "inventory_cost_comparison.png"
    cat_grp = df_results.groupby("category")[["baseline_cost", "optimized_cost"]].sum()
    
    fig, ax = plt.subplots(figsize=(10, 5))
    x = np.arange(len(cat_grp))
    width = 0.35
    
    ax.bar(x - width/2, cat_grp["baseline_cost"], width, label="Baseline (Fixed Threshold)", color="#ef4444", alpha=0.85)
    ax.bar(x + width/2, cat_grp["optimized_cost"], width, label="Optimized (EOQ + ROP)", color="#10b981", alpha=0.85)
    
    ax.set_title("Inventory Optimization: Total Holding, Ordering & Stockout Cost (180 Days)")
    ax.set_ylabel("Total Inventory Cost (₹)")
    ax.set_xticks(x)
    ax.set_xticklabels(cat_grp.index, rotation=15, ha="right")
    ax.legend()
    ax.grid(True, linestyle="--", alpha=0.5, axis="y")
    
    plt.tight_layout()
    plt.savefig(plot_path1, dpi=300)
    plt.close()
    print(f"Saved cost comparison plot to: {plot_path1}")
    
    # Plot 2: Service Level & Stockout Days Comparison
    plot_path2 = PLOTS_DIR / "inventory_service_level_comparison.png"
    fig, ax1 = plt.subplots(figsize=(10, 5))
    
    x = np.arange(len(scenarios))
    sc_names_short = [k.split("(")[0].strip() for k in scenarios.keys()]
    
    opt_sl_vals = [scenario_metrics[k]["mean_optimized_service_level"] for k in scenarios.keys()]
    base_sl_vals = [scenario_metrics[k]["mean_baseline_service_level"] for k in scenarios.keys()]
    
    ax1.plot(x, base_sl_vals, "o--", color="#ef4444", label="Baseline Service Level (%)", linewidth=2.2, markersize=7)
    ax1.plot(x, opt_sl_vals, "s-", color="#10b981", label="Optimized (EOQ+ROP) Service Level (%)", linewidth=2.5, markersize=7)
    ax1.axhline(95.0, color="#6b7280", linestyle=":", label="Target Service Level (95%)")
    
    ax1.set_title("Inventory Service Level & Stockout Resilience across Stress Scenarios")
    ax1.set_ylabel("Service Level / Fill Rate (%)")
    ax1.set_xticks(x)
    ax1.set_xticklabels(sc_names_short)
    ax1.set_ylim(70, 102)
    ax1.legend(loc="lower left")
    ax1.grid(True, linestyle="--", alpha=0.5)
    
    plt.tight_layout()
    plt.savefig(plot_path2, dpi=300)
    plt.close()
    print(f"Saved service level comparison plot to: {plot_path2}")
    
    # Plot 3: Daily Inventory Trajectory (Sample SKU f1)
    if sample_trajectory:
        plot_path3 = PLOTS_DIR / "inventory_stock_trajectory.png"
        fig, ax = plt.subplots(figsize=(12, 5))
        
        days_x = np.arange(len(sample_trajectory["baseline_history"]))
        ax.plot(days_x, sample_trajectory["baseline_history"], label="Baseline On-Hand Stock", color="#ef4444", alpha=0.8, linewidth=1.5)
        ax.plot(days_x, sample_trajectory["optimized_history"], label="Optimized (EOQ+ROP) On-Hand Stock", color="#10b981", linewidth=2.0)
        ax.axhline(sample_trajectory["rop"], color="#f59e0b", linestyle="--", label=f"Reorder Point (ROP = {sample_trajectory['rop']})")
        ax.axhline(sample_trajectory["safety_stock"], color="#3b82f6", linestyle=":", label=f"Safety Stock (SS = {sample_trajectory['safety_stock']})")
        
        ax.set_title(f"Dynamic Inventory Trajectory Simulation: {sample_trajectory['name']} (180 Days)")
        ax.set_xlabel("Operational Day")
        ax.set_ylabel("On-Hand Inventory Units")
        ax.legend(loc="upper right", framealpha=0.95)
        ax.grid(True, linestyle="--", alpha=0.5)
        
        plt.tight_layout()
        plt.savefig(plot_path3, dpi=300)
        plt.close()
        print(f"Saved stock trajectory plot to: {plot_path3}")
        
    return summary_data

if __name__ == "__main__":
    run_inventory_optimization_experiment()
