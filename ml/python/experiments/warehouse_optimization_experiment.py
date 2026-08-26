"""
FreshCart AI — Module 2: Dark Store Warehouse Picker 2D TSP Experiment
Benchmarks:
1. Baseline 1: Naive Invoice Order Sequence (Arbitrary picking sequence)
2. Baseline 2: Nearest-Neighbor (NN) Construction Heuristic
3. Optimization Strategy: Nearest Neighbor + 2-Opt Local Search Iterative Improvement
4. Exact Benchmark: Brute-Force Global Optimum (N <= 8)

Evaluates over N = 100 simulated customer orders across 3 basket tiers:
- Small Baskets (3 to 5 items)
- Medium Baskets (6 to 10 items)
- Large Assembly Batches (11 to 18 items)
"""

import sys
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as patches

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from ml.python.config import (
    MODELS_DIR,
    METRICS_DIR,
    PLOTS_DIR,
    RANDOM_SEED,
    PLOT_STYLE,
)
from ml.python.optimization.warehouse_optimization import (
    WarehouseOptimizer,
    DEFAULT_WAREHOUSE_LOCATIONS,
    PACKING_STATION,
    estimate_pick_time_seconds,
)

plt.rcParams.update(PLOT_STYLE)

def generate_random_orders(catalog_pids, num_orders=100, seed=42):
    """Generate synthetic grocery orders with realistic item count distributions."""
    np.random.seed(seed)
    orders = []
    
    for i in range(num_orders):
        # Basket tier
        r = np.random.rand()
        if r < 0.40:
            tier = "Small (3-5 items)"
            k = np.random.randint(3, 6)
        elif r < 0.80:
            tier = "Medium (6-10 items)"
            k = np.random.randint(6, 11)
        else:
            tier = "Large (11-18 items)"
            k = np.random.randint(11, 19)
            
        chosen_pids = list(np.random.choice(catalog_pids, size=k, replace=False))
        orders.append({
            "order_id": f"ORDER_{i+1:03d}",
            "tier": tier,
            "num_items": k,
            "product_ids": chosen_pids,
        })
    return orders

def run_warehouse_optimization_experiment():
    print("\n" + "=" * 65)
    print("  >> RUNNING MODULE 2: WAREHOUSE OPTIMIZATION EXPERIMENT")
    print("=" * 65)
    
    optimizer = WarehouseOptimizer()
    catalog_pids = list(DEFAULT_WAREHOUSE_LOCATIONS.keys())
    print(f"Loaded Dark Store Layout: {len(catalog_pids)} SKU Picking Locations across 5 Aisles")
    
    orders = generate_random_orders(catalog_pids, num_orders=100, seed=RANDOM_SEED)
    print(f"Generated Benchmark Set: {len(orders)} Grocery Orders across 3 Basket Tiers")
    
    results = []
    exact_comparison = []
    visual_sample_order = None
    
    for order in orders:
        items = optimizer.resolve_items(order["product_ids"])
        
        # 1. Naive Sequence Baseline
        naive_tour, naive_dist = optimizer.solve_naive_baseline(items)
        naive_time = estimate_pick_time_seconds(naive_dist, len(items))
        
        # 2. Nearest Neighbor Baseline
        nn_tour, nn_dist = optimizer.solve_nearest_neighbor(items)
        nn_time = estimate_pick_time_seconds(nn_dist, len(items))
        
        # 3. 2-Opt Optimizer
        opt_tour, opt_dist = optimizer.solve_2opt(items)
        opt_time = estimate_pick_time_seconds(opt_dist, len(items))
        
        # Improvement metrics
        savings_dist = naive_dist - opt_dist
        savings_pct = (savings_dist / naive_dist * 100.0) if naive_dist > 0 else 0.0
        time_saved_sec = naive_time - opt_time
        
        results.append({
            "order_id": order["order_id"],
            "tier": order["tier"],
            "num_items": order["num_items"],
            "naive_distance_m": float(naive_dist),
            "nn_distance_m": float(nn_dist),
            "opt_distance_m": float(opt_dist),
            "distance_reduction_m": float(savings_dist),
            "distance_reduction_pct": float(savings_pct),
            "naive_time_sec": float(naive_time),
            "nn_time_sec": float(nn_time),
            "opt_time_sec": float(opt_time),
            "time_reduction_sec": float(time_saved_sec),
        })
        
        # Exact comparison for small orders (N <= 8)
        if len(items) <= 7:
            exact_tour, exact_dist = optimizer.solve_exact_bruteforce(items)
            gap = (opt_dist - exact_dist) / exact_dist * 100.0 if exact_dist > 0 else 0.0
            exact_comparison.append({
                "order_id": order["order_id"],
                "num_items": len(items),
                "opt_distance_m": opt_dist,
                "exact_distance_m": exact_dist,
                "optimality_gap_pct": gap,
            })
            
        if visual_sample_order is None and order["num_items"] >= 8:
            visual_sample_order = {
                "order_id": order["order_id"],
                "items": items,
                "naive_tour": naive_tour,
                "opt_tour": opt_tour,
                "naive_dist": naive_dist,
                "opt_dist": opt_dist,
            }
            
    df_res = pd.DataFrame(results)
    
    tot_naive_dist = df_res["naive_distance_m"].sum()
    tot_nn_dist = df_res["nn_distance_m"].sum()
    tot_opt_dist = df_res["opt_distance_m"].sum()
    overall_dist_savings_pct = ((tot_naive_dist - tot_opt_dist) / tot_naive_dist) * 100.0
    
    tot_naive_time = df_res["naive_time_sec"].sum()
    tot_opt_time = df_res["opt_time_sec"].sum()
    overall_time_savings_pct = ((tot_naive_time - tot_opt_time) / tot_naive_time) * 100.0
    
    print("\nDark Store Warehouse Picker Benchmark Results (N = 100 Orders):")
    print("-" * 75)
    print(f"  Total Naive Walk Distance:      {tot_naive_dist:,.1f} meters")
    print(f"  Total Nearest-Neighbor Walk:    {tot_nn_dist:,.1f} meters")
    print(f"  Total 2-Opt Optimized Walk:     {tot_opt_dist:,.1f} meters")
    print(f"  Net Walking Distance Saved:     -{tot_naive_dist - tot_opt_dist:,.1f} m ({overall_dist_savings_pct:.2f}% reduction)")
    print(f"  Total Assembly Time Saved:      -{tot_naive_time - tot_opt_time:,.1f} sec ({overall_time_savings_pct:.2f}% faster)")
    print(f"  Mean Per-Order Walk Savings:    {df_res['distance_reduction_pct'].mean():.2f}% (Median: {df_res['distance_reduction_pct'].median():.2f}%)")
    print(f"  Best-Case Walk Reduction:       {df_res['distance_reduction_pct'].max():.2f}%")
    print(f"  Worst-Case Walk Reduction:      {df_res['distance_reduction_pct'].min():.2f}%")
    if exact_comparison:
        mean_gap = np.mean([e["optimality_gap_pct"] for e in exact_comparison])
        print(f"  Mean Optimality Gap vs Exact:   {mean_gap:.2f}% across {len(exact_comparison)} small orders")
    print("-" * 75)
    
    # Save Metrics JSON
    tier_grp = df_res.groupby("tier").agg(
        count=("order_id", "count"),
        mean_items=("num_items", "mean"),
        naive_dist=("naive_distance_m", "mean"),
        opt_dist=("opt_distance_m", "mean"),
        reduction_pct=("distance_reduction_pct", "mean"),
        naive_time=("naive_time_sec", "mean"),
        opt_time=("opt_time_sec", "mean"),
    ).to_dict(orient="index")
    
    summary_data = {
        "num_orders_evaluated": len(orders),
        "overall_summary": {
            "total_naive_distance_m": float(tot_naive_dist),
            "total_nn_distance_m": float(tot_nn_dist),
            "total_opt_distance_m": float(tot_opt_dist),
            "distance_reduction_pct": float(overall_dist_savings_pct),
            "total_time_saved_sec": float(tot_naive_time - tot_opt_time),
            "time_savings_pct": float(overall_time_savings_pct),
            "mean_order_savings_pct": float(df_res["distance_reduction_pct"].mean()),
            "median_order_savings_pct": float(df_res["distance_reduction_pct"].median()),
            "std_order_savings_pct": float(df_res["distance_reduction_pct"].std()),
            "best_case_savings_pct": float(df_res["distance_reduction_pct"].max()),
            "worst_case_savings_pct": float(df_res["distance_reduction_pct"].min()),
        },
        "basket_tier_breakdown": tier_grp,
        "exact_solver_benchmark": exact_comparison,
    }
    
    metrics_path = METRICS_DIR / "warehouse_optimization_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)
    print(f"\nSaved warehouse metrics to: {metrics_path}")
    
    # Save Model Artifact
    model_save_path = MODELS_DIR / "warehouse_optimizer.joblib"
    joblib.dump(optimizer, model_save_path)
    print(f"Saved warehouse optimizer artifact to: {model_save_path}")
    
    # Plot 1: 2D Warehouse Layout Plan and Route Trajectory Comparison
    if visual_sample_order:
        plot_path1 = PLOTS_DIR / "warehouse_layout_and_routes.png"
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 7))
        
        for ax, tour, title, col in [
            (ax1, visual_sample_order["naive_tour"], f"Baseline (Naive Invoice Walk: {visual_sample_order['naive_dist']:.1f}m)", "#ef4444"),
            (ax2, visual_sample_order["opt_tour"], f"Optimized (2-Opt TSP Walk: {visual_sample_order['opt_dist']:.1f}m)", "#10b981"),
        ]:
            # Draw warehouse grid
            ax.set_xlim(-2, 22)
            ax.set_ylim(-2, 26)
            ax.set_facecolor("#f9fafb")
            
            # Draw Aisles (A1 to A5)
            for x_aisle, a_name in [(2.0, "Aisle A1: Fruits"), (6.0, "Aisle A2: Veg"), (10.0, "Aisle A3: Dairy"), (14.0, "Aisle A4: Bakery"), (18.0, "Aisle A5: Snacks")]:
                rect = patches.Rectangle((x_aisle - 0.8, 2.0), 1.6, 21.0, linewidth=1, edgecolor="#d1d5db", facecolor="#e5e7eb", alpha=0.5)
                ax.add_patch(rect)
                ax.text(x_aisle, 24.0, a_name.split(":")[0], ha="center", fontsize=8, fontweight="bold", color="#4b5563")
                
            # Draw all warehouse catalog locations as light dots
            for pid, loc in DEFAULT_WAREHOUSE_LOCATIONS.items():
                ax.plot(loc["x"], loc["y"], "o", color="#9ca3af", markersize=5, alpha=0.6)
                
            # Draw packing station
            ax.plot(0.0, 0.0, "s", color="#1f2937", markersize=10, label="Packing Station (Start/End)")
            ax.text(0.0, -1.2, "Packing Station", ha="center", fontsize=8, fontweight="bold")
            
            # Draw Tour path
            xs = [node["x"] for node in tour] + [tour[0]["x"]]
            ys = [node["y"] for node in tour] + [tour[0]["y"]]
            ax.plot(xs, ys, "-", color=col, linewidth=2.0, alpha=0.85)
            
            # Highlight order item nodes
            for step_idx, node in enumerate(tour[1:], start=1):
                ax.plot(node["x"], node["y"], "o", color=col, markersize=8)
                ax.text(node["x"] + 0.3, node["y"] + 0.3, f"{step_idx}", fontsize=8, fontweight="bold", color="#111827")
                
            ax.set_title(title, fontsize=11, fontweight="bold")
            ax.set_xlabel("Warehouse Width X (meters)")
            ax.set_ylabel("Warehouse Length Y (meters)")
            ax.grid(True, linestyle="--", alpha=0.4)
            
        plt.tight_layout()
        plt.savefig(plot_path1, dpi=300)
        plt.close()
        print(f"Saved warehouse layout plot to: {plot_path1}")
        
    # Plot 2: Distance Comparison Across Basket Size Tiers
    plot_path2 = PLOTS_DIR / "warehouse_distance_comparison.png"
    tier_stats = df_res.groupby("tier")[["naive_distance_m", "nn_distance_m", "opt_distance_m"]].mean()
    
    fig, ax = plt.subplots(figsize=(10, 5))
    x = np.arange(len(tier_stats))
    width = 0.25
    
    ax.bar(x - width, tier_stats["naive_distance_m"], width, label="Naive Sequence", color="#ef4444", alpha=0.85)
    ax.bar(x, tier_stats["nn_distance_m"], width, label="Nearest Neighbor", color="#f59e0b", alpha=0.85)
    ax.bar(x + width, tier_stats["opt_distance_m"], width, label="2-Opt Optimized", color="#10b981", alpha=0.85)
    
    ax.set_title("Warehouse Order Picking Walk Distance by Basket Size Tier")
    ax.set_ylabel("Average Walking Distance (meters)")
    ax.set_xticks(x)
    ax.set_xticklabels(tier_stats.index)
    ax.legend()
    ax.grid(True, linestyle="--", alpha=0.5, axis="y")
    
    plt.tight_layout()
    plt.savefig(plot_path2, dpi=300)
    plt.close()
    print(f"Saved warehouse distance plot to: {plot_path2}")
    
    # Plot 3: Improvement Percentage Distribution
    plot_path3 = PLOTS_DIR / "warehouse_improvement_distribution.png"
    fig, ax = plt.subplots(figsize=(9, 5))
    
    savings = df_res["distance_reduction_pct"].values
    ax.hist(savings, bins=15, color="#10b981", edgecolor="#047857", alpha=0.8, density=True)
    ax.axvline(np.mean(savings), color="#ef4444", linestyle="--", linewidth=2, label=f"Mean Improvement: {np.mean(savings):.1f}%")
    ax.axvline(np.median(savings), color="#3b82f6", linestyle=":", linewidth=2, label=f"Median Improvement: {np.median(savings):.1f}%")
    
    ax.set_title("Distribution of Warehouse Walk Distance Reduction (N = 100 Orders)")
    ax.set_xlabel("Walking Distance Reduction (%)")
    ax.set_ylabel("Probability Density")
    ax.legend()
    ax.grid(True, linestyle="--", alpha=0.5)
    
    plt.tight_layout()
    plt.savefig(plot_path3, dpi=300)
    plt.close()
    print(f"Saved improvement distribution plot to: {plot_path3}")
    
    return summary_data

if __name__ == "__main__":
    run_warehouse_optimization_experiment()
