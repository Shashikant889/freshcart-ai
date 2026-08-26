"""
FreshCart AI — Module 3: Last-Mile Delivery Routing & CVRP Experiment
Benchmarks:
1. Baseline: Random / FIFO Dispatch with un-optimized arrival-sequence routes
2. Optimization Strategy: Clarke-Wright Savings Heuristic + Intra-Route 2-Opt Local Search

Evaluates over N = 50 urban dispatch batches across 3 delivery density tiers:
- Light Dispatch (12 to 18 drop-offs)
- Medium Dispatch (20 to 30 drop-offs)
- High-Density Cluster (35 to 50 drop-offs)
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
from ml.python.optimization.delivery_optimization import (
    DeliveryRouter,
    DEFAULT_DEPOT,
    DEFAULT_NEIGHBORHOODS,
    haversine_distance,
)

plt.rcParams.update(PLOT_STYLE)

def generate_delivery_batches(num_batches=50, seed=42):
    """Generate synthetic urban delivery batches with realistic customer locations and order weights."""
    np.random.seed(seed)
    batches = []
    
    for b_idx in range(num_batches):
        r = np.random.rand()
        if r < 0.35:
            tier = "Light Dispatch (12-18 stops)"
            n_stops = np.random.randint(12, 19)
        elif r < 0.75:
            tier = "Medium Dispatch (20-30 stops)"
            n_stops = np.random.randint(20, 31)
        else:
            tier = "High-Density Cluster (35-50 stops)"
            n_stops = np.random.randint(35, 51)
            
        # Vehicle capacity
        cap = float(np.random.choice([20.0, 25.0, 30.0]))
        
        orders = []
        for i in range(n_stops):
            # Select random neighborhood cluster center
            center = DEFAULT_NEIGHBORHOODS[np.random.randint(0, len(DEFAULT_NEIGHBORHOODS))]
            # Add local jitter (+/- 0.5 to 2.5 km in lat/lng)
            lat_jitter = np.random.normal(0, 0.012)
            lng_jitter = np.random.normal(0, 0.012)
            
            # Order demand weight in kg (log-normal distribution centered around 3.5 kg)
            weight_kg = max(0.8, round(float(np.random.lognormal(1.1, 0.4)), 1))
            
            orders.append({
                "id": f"DELIV_{b_idx+1:02d}_{i+1:02d}",
                "name": f"Customer {center['name']} #{i+1}",
                "lat": float(center["lat"] + lat_jitter),
                "lng": float(center["lng"] + lng_jitter),
                "demand": float(weight_kg),
            })
            
        batches.append({
            "batch_id": f"BATCH_{b_idx+1:03d}",
            "tier": tier,
            "num_stops": n_stops,
            "vehicle_capacity_kg": cap,
            "orders": orders,
        })
    return batches

def run_delivery_optimization_experiment():
    print("\n" + "=" * 65)
    print("  >> RUNNING MODULE 3: DELIVERY ROUTING & CVRP EXPERIMENT")
    print("=" * 65)
    
    batches = generate_delivery_batches(num_batches=50, seed=RANDOM_SEED)
    print(f"Loaded Hub Coordinates: {DEFAULT_DEPOT['name']} ({DEFAULT_DEPOT['lat']}, {DEFAULT_DEPOT['lng']})")
    print(f"Generated Benchmark Set: {len(batches)} Multi-Stop Dispatch Batches")
    
    results = []
    visual_sample = None
    
    for batch in batches:
        orders = batch["orders"]
        cap = batch["vehicle_capacity_kg"]
        router = DeliveryRouter(depot=DEFAULT_DEPOT, vehicle_capacity_kg=cap)
        
        # 1. Baseline: FIFO Dispatch
        base_sol = router.solve_fifo_baseline(orders)
        
        # 2. Optimization: Clarke-Wright Savings + 2-Opt
        opt_sol = router.solve_clarke_wright_savings(orders)
        
        dist_saved = base_sol["total_fleet_distance_km"] - opt_sol["total_fleet_distance_km"]
        dist_saved_pct = (dist_saved / base_sol["total_fleet_distance_km"] * 100.0) if base_sol["total_fleet_distance_km"] > 0 else 0.0
        time_saved_hrs = base_sol["total_travel_time_hours"] - opt_sol["total_travel_time_hours"]
        
        results.append({
            "batch_id": batch["batch_id"],
            "tier": batch["tier"],
            "num_stops": batch["num_stops"],
            "vehicle_capacity_kg": cap,
            "baseline_distance_km": base_sol["total_fleet_distance_km"],
            "optimized_distance_km": opt_sol["total_fleet_distance_km"],
            "distance_reduction_km": dist_saved,
            "distance_reduction_pct": dist_saved_pct,
            "baseline_vehicles": base_sol["num_vehicles_used"],
            "optimized_vehicles": opt_sol["num_vehicles_used"],
            "vehicle_reduction": base_sol["num_vehicles_used"] - opt_sol["num_vehicles_used"],
            "baseline_utilization_pct": base_sol["fleet_capacity_utilization_pct"],
            "optimized_utilization_pct": opt_sol["fleet_capacity_utilization_pct"],
            "baseline_time_hours": base_sol["total_travel_time_hours"],
            "optimized_time_hours": opt_sol["total_travel_time_hours"],
            "time_saved_hours": time_saved_hrs,
        })
        
        if visual_sample is None and batch["num_stops"] >= 25:
            visual_sample = {
                "batch_id": batch["batch_id"],
                "orders": orders,
                "base_sol": base_sol,
                "opt_sol": opt_sol,
            }
            
    df_res = pd.DataFrame(results)
    
    tot_base_dist = df_res["baseline_distance_km"].sum()
    tot_opt_dist = df_res["optimized_distance_km"].sum()
    fleet_savings_pct = ((tot_base_dist - tot_opt_dist) / tot_base_dist) * 100.0
    
    tot_base_veh = df_res["baseline_vehicles"].sum()
    tot_opt_veh = df_res["optimized_vehicles"].sum()
    
    tot_base_time = df_res["baseline_time_hours"].sum()
    tot_opt_time = df_res["optimized_time_hours"].sum()
    
    mean_base_util = df_res["baseline_utilization_pct"].mean()
    mean_opt_util = df_res["optimized_utilization_pct"].mean()
    
    print("\nLast-Mile Delivery Routing Benchmark Results (N = 50 Batches):")
    print("-" * 75)
    print(f"  Total Baseline Fleet Distance:   {tot_base_dist:,.1f} km")
    print(f"  Total 2-Opt CVRP Fleet Distance: {tot_opt_dist:,.1f} km")
    print(f"  Net Fleet Distance Reduction:    -{tot_base_dist - tot_opt_dist:,.1f} km ({fleet_savings_pct:.2f}% savings)")
    print(f"  Total Fleet Vehicles Deployed:   {tot_base_veh} (Base) vs {tot_opt_veh} (Opt)")
    print(f"  Mean Vehicle Utilization:        {mean_base_util:.1f}% (Base) vs {mean_opt_util:.1f}% (Opt)")
    print(f"  Total Transit & Service Time:    {tot_base_time:,.1f} hrs (Base) vs {tot_opt_time:,.1f} hrs (Opt)")
    print(f"  Mean Per-Batch Distance Savings: {df_res['distance_reduction_pct'].mean():.2f}% (Median: {df_res['distance_reduction_pct'].median():.2f}%)")
    print(f"  Best-Case Distance Savings:      {df_res['distance_reduction_pct'].max():.2f}%")
    print(f"  Worst-Case Distance Savings:     {df_res['distance_reduction_pct'].min():.2f}%")
    print("-" * 75)
    
    # Save Metrics JSON
    tier_grp = df_res.groupby("tier").agg(
        batches=("batch_id", "count"),
        mean_stops=("num_stops", "mean"),
        base_dist=("baseline_distance_km", "mean"),
        opt_dist=("optimized_distance_km", "mean"),
        savings_pct=("distance_reduction_pct", "mean"),
        base_vehicles=("baseline_vehicles", "mean"),
        opt_vehicles=("optimized_vehicles", "mean"),
        base_util=("baseline_utilization_pct", "mean"),
        opt_util=("optimized_utilization_pct", "mean"),
    ).to_dict(orient="index")
    
    summary_data = {
        "num_batches_evaluated": len(batches),
        "overall_summary": {
            "total_baseline_distance_km": float(tot_base_dist),
            "total_optimized_distance_km": float(tot_opt_dist),
            "distance_reduction_pct": float(fleet_savings_pct),
            "total_baseline_vehicles": int(tot_base_veh),
            "total_optimized_vehicles": int(tot_opt_veh),
            "total_time_saved_hours": float(tot_base_time - tot_opt_time),
            "mean_baseline_utilization_pct": float(mean_base_util),
            "mean_optimized_utilization_pct": float(mean_opt_util),
            "mean_batch_savings_pct": float(df_res["distance_reduction_pct"].mean()),
            "median_batch_savings_pct": float(df_res["distance_reduction_pct"].median()),
            "std_batch_savings_pct": float(df_res["distance_reduction_pct"].std()),
            "best_case_savings_pct": float(df_res["distance_reduction_pct"].max()),
            "worst_case_savings_pct": float(df_res["distance_reduction_pct"].min()),
        },
        "density_tier_breakdown": tier_grp,
    }
    
    metrics_path = METRICS_DIR / "delivery_optimization_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)
    print(f"\nSaved delivery metrics to: {metrics_path}")
    
    # Save Model Artifact
    default_router = DeliveryRouter(depot=DEFAULT_DEPOT)
    model_save_path = MODELS_DIR / "delivery_router.joblib"
    joblib.dump(default_router, model_save_path)
    print(f"Saved delivery router artifact to: {model_save_path}")
    
    # Plot 1: Geographic Dispatch Map (Baseline vs Optimized Routes)
    if visual_sample:
        plot_path1 = PLOTS_DIR / "delivery_routes_map.png"
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 7))
        
        depot = DEFAULT_DEPOT
        colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"]
        
        base_sol = visual_sample["base_sol"]
        opt_sol = visual_sample["opt_sol"]
        
        for ax, sol, title in [
            (ax1, base_sol, f"Baseline FIFO Routes ({base_sol['total_fleet_distance_km']:.1f} km, {base_sol['num_vehicles_used']} Vehicles)"),
            (ax2, opt_sol, f"Clarke-Wright + 2-Opt CVRP ({opt_sol['total_fleet_distance_km']:.1f} km, {opt_sol['num_vehicles_used']} Vehicles)"),
        ]:
            # Plot Depot
            ax.plot(depot["lng"], depot["lat"], "s", color="#111827", markersize=12, label="Central Depot Hub", zorder=5)
            
            # Plot vehicle routes
            for r_idx, r in enumerate(sol["routes"]):
                col = colors[r_idx % len(colors)]
                lngs = [depot["lng"]] + [s["lng"] for s in r["stops"]] + [depot["lng"]]
                lats = [depot["lat"]] + [s["lat"] for s in r["stops"]] + [depot["lat"]]
                
                ax.plot(lngs, lats, "-o", color=col, linewidth=2.0, markersize=6, alpha=0.85, label=f"Vehicle {r_idx+1} ({r['payload_kg']:.1f}kg)")
                
            ax.set_title(title, fontsize=11, fontweight="bold")
            ax.set_xlabel("Longitude")
            ax.set_ylabel("Latitude")
            ax.grid(True, linestyle="--", alpha=0.4)
            ax.legend(loc="lower right", fontsize=8)
            
        plt.tight_layout()
        plt.savefig(plot_path1, dpi=300)
        plt.close()
        print(f"Saved delivery routes map to: {plot_path1}")
        
    # Plot 2: Fleet Distance Comparison Across Tiers
    plot_path2 = PLOTS_DIR / "delivery_distance_comparison.png"
    tier_stats = df_res.groupby("tier")[["baseline_distance_km", "optimized_distance_km"]].mean()
    
    fig, ax = plt.subplots(figsize=(10, 5))
    x = np.arange(len(tier_stats))
    width = 0.35
    
    ax.bar(x - width/2, tier_stats["baseline_distance_km"], width, label="Baseline FIFO Dispatch", color="#ef4444", alpha=0.85)
    ax.bar(x + width/2, tier_stats["optimized_distance_km"], width, label="Clarke-Wright + 2-Opt CVRP", color="#10b981", alpha=0.85)
    
    ax.set_title("Fleet Delivery Distance by Urban Density Tier")
    ax.set_ylabel("Total Fleet Distance (km)")
    ax.set_xticks(x)
    ax.set_xticklabels(tier_stats.index)
    ax.legend()
    ax.grid(True, linestyle="--", alpha=0.5, axis="y")
    
    plt.tight_layout()
    plt.savefig(plot_path2, dpi=300)
    plt.close()
    print(f"Saved delivery distance plot to: {plot_path2}")
    
    # Plot 3: Distance Savings Distribution
    plot_path3 = PLOTS_DIR / "delivery_improvement_distribution.png"
    fig, ax = plt.subplots(figsize=(9, 5))
    
    savings = df_res["distance_reduction_pct"].values
    ax.hist(savings, bins=15, color="#3b82f6", edgecolor="#1d4ed8", alpha=0.8, density=True)
    ax.axvline(np.mean(savings), color="#ef4444", linestyle="--", linewidth=2, label=f"Mean Savings: {np.mean(savings):.1f}%")
    ax.axvline(np.median(savings), color="#10b981", linestyle=":", linewidth=2, label=f"Median Savings: {np.median(savings):.1f}%")
    
    ax.set_title("Distribution of Fleet Distance Reduction Percentage (N = 50 Batches)")
    ax.set_xlabel("Fleet Distance Reduction (%)")
    ax.set_ylabel("Probability Density")
    ax.legend()
    ax.grid(True, linestyle="--", alpha=0.5)
    
    plt.tight_layout()
    plt.savefig(plot_path3, dpi=300)
    plt.close()
    print(f"Saved delivery savings distribution plot to: {plot_path3}")
    
    return summary_data

if __name__ == "__main__":
    run_delivery_optimization_experiment()
