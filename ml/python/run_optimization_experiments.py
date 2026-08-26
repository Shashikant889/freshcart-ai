"""
FreshCart AI — Master Operations Optimization Pipeline Runner
Orchestrates experiments across:
1. Inventory & Procurement Optimization (EOQ + Stochastic ROP)
2. Dark Store Warehouse Picking Optimization (2D TSP + 2-Opt)
3. Last-Mile Delivery Fleet Optimization (CVRP + Clarke-Wright + 2-Opt)

Generates:
- ml/python/reports/OPTIMIZATION_EXPERIMENT_REPORT.md
- Plots in ml/python/plots/
- Metrics in ml/python/metrics/
- Models in ml/python/models/
"""

import sys
import json
import time
from datetime import datetime
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from ml.python.config import (
    METRICS_DIR,
    MODELS_DIR,
    PLOTS_DIR,
    REPORTS_DIR,
    RANDOM_SEED,
)
from ml.python.experiments.inventory_optimization_experiment import run_inventory_optimization_experiment
from ml.python.experiments.warehouse_optimization_experiment import run_warehouse_optimization_experiment
from ml.python.experiments.delivery_optimization_experiment import run_delivery_optimization_experiment

def generate_optimization_report(inv_res, wh_res, del_res):
    """
    Generate comprehensive IEEE-standard Operations Optimization Report:
    ml/python/reports/OPTIMIZATION_EXPERIMENT_REPORT.md
    """
    report_path = REPORTS_DIR / "OPTIMIZATION_EXPERIMENT_REPORT.md"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    inv_sum = inv_res["overall_summary"]
    wh_sum = wh_res["overall_summary"]
    del_sum = del_res["overall_summary"]
    
    # Inventory Stress Test Rows
    inv_sc_rows = []
    for sc_name, sc in inv_res["scenario_stress_tests"].items():
        inv_sc_rows.append(
            f"| **{sc_name}** | ₹{sc['total_baseline_cost_inr']:,.2f} | ₹{sc['total_optimized_cost_inr']:,.2f} | "
            f"**-{sc['cost_reduction_pct']:.2f}%** | {sc['mean_baseline_service_level']:.1f}% | {sc['mean_optimized_service_level']:.1f}% | "
            f"{sc['total_baseline_stockout_days']}d vs {sc['total_optimized_stockout_days']}d |"
        )
    inv_sc_table = "\n".join(inv_sc_rows)
    
    # Warehouse Tier Rows
    wh_tier_rows = []
    for tier_name, t in wh_res["basket_tier_breakdown"].items():
        wh_tier_rows.append(
            f"| **{tier_name}** | {t['mean_items']:.1f} SKUs | {t['naive_dist']:.1f} m | {t['opt_dist']:.1f} m | "
            f"**-{t['reduction_pct']:.2f}%** | {t['naive_time']:.1f} s | {t['opt_time']:.1f} s |"
        )
    wh_tier_table = "\n".join(wh_tier_rows)
    
    # Delivery Tier Rows
    del_tier_rows = []
    for tier_name, t in del_res["density_tier_breakdown"].items():
        del_tier_rows.append(
            f"| **{tier_name}** | {t['mean_stops']:.1f} stops | {t['base_dist']:.1f} km | {t['opt_dist']:.1f} km | "
            f"**-{t['savings_pct']:.2f}%** | {t['base_vehicles']:.1f} vs {t['opt_vehicles']:.1f} | {t['opt_util']:.1f}% |"
        )
    del_tier_table = "\n".join(del_tier_rows)
    
    lines = [
        "# Operations Research & Mathematical Optimization Experiment Report",
        "",
        "**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  ",
        "**Evaluation Framework:** Final-Year Major Capstone (B.Tech CSE-AIML, Mumbai University)  ",
        f"**Experiment Execution Date:** `{timestamp}`  ",
        f"**Random Seed:** `{RANDOM_SEED}` (Fixed for strict reproducibility)  ",
        "**Environment:** Python 3.12, NumPy, Pandas, Matplotlib, Scipy  ",
        "",
        "---",
        "",
        "## 1. Executive Summary",
        "",
        "This report provides empirical evidence and mathematical benchmarking for the three operations optimization subsystems in FreshCart AI:",
        "1. **Inventory & Procurement Optimization:** Multi-item Economic Order Quantity (EOQ) and Stochastic Reorder Point (ROP) with safety stock.",
        "2. **Dark Store Warehouse Picking:** 2D Traveling Salesperson Problem (TSP) with Nearest-Neighbor and 2-Opt local search improvement.",
        "3. **Last-Mile Delivery Routing:** Capacitated Vehicle Routing Problem (CVRP) with Clarke-Wright Savings clustering and intra-route 2-Opt TSP smoothing.",
        "",
        "All metrics reflect actual simulations across multiple randomized scenarios with zero fabricated values.",
        "",
        "---",
        "",
        "## 2. Module 1: Inventory & Procurement Optimization",
        "",
        "### 2.1 Benchmark Results (180 Simulated Days Across 31 Catalog SKUs)",
        f"- **Baseline Total Cost:** ₹{inv_sum['total_baseline_cost']:,.2f}",
        f"- **Optimized (EOQ+ROP) Total Cost:** ₹{inv_sum['total_optimized_cost']:,.2f}",
        f"- **Net Cost Reduction:** **-₹{inv_sum['total_baseline_cost'] - inv_sum['total_optimized_cost']:,.2f} ({inv_sum['cost_reduction_pct']:.2f}% savings)**",
        f"- **Baseline Mean Service Level:** {inv_sum['baseline_service_level_pct']:.2f}%",
        f"- **Optimized Mean Service Level:** **{inv_sum['optimized_service_level_pct']:.2f}%** (Target: 95.00%)",
        f"- **Total Stockout Days:** {inv_sum['baseline_stockout_days']} days (Baseline) $\\to$ **{inv_sum['optimized_stockout_days']} days (Optimized)** (-{((inv_sum['baseline_stockout_days'] - inv_sum['optimized_stockout_days'])/inv_sum['baseline_stockout_days'])*100:.1f}%)",
        "",
        "### 2.2 Scenario Sensitivity Stress Tests",
        "",
        "| Scenario | Baseline Cost | Optimized Cost | Savings % | Baseline Service Level | Optimized Service Level | Stockout Days |",
        "|---|---|---|---|---|---|---|",
        inv_sc_table,
        "",
        "---",
        "",
        "## 3. Module 2: Dark Store Warehouse Picking Optimization",
        "",
        "### 3.1 Benchmark Results (N = 100 Simulated Grocery Orders)",
        f"- **Total Naive Walk Distance:** {wh_sum['total_naive_distance_m']:,.1f} meters",
        f"- **Total 2-Opt Optimized Walk Distance:** {wh_sum['total_opt_distance_m']:,.1f} meters",
        f"- **Net Walking Distance Saved:** **-{wh_sum['total_naive_distance_m'] - wh_sum['total_opt_distance_m']:,.1f} m ({wh_sum['distance_reduction_pct']:.2f}% reduction)**",
        f"- **Total Assembly Time Saved:** **-{wh_sum['total_time_saved_sec']:,.1f} seconds ({wh_sum['time_savings_pct']:.2f}% faster)**",
        f"- **Mean Per-Order Walk Savings:** **{wh_sum['mean_order_savings_pct']:.2f}%** (Median: {wh_sum['median_order_savings_pct']:.2f}%, Std: {wh_sum['std_order_savings_pct']:.2f}%)",
        f"- **Best Case Savings:** {wh_sum['best_case_savings_pct']:.2f}% | **Worst Case Savings:** {wh_sum['worst_case_savings_pct']:.2f}%",
        "",
        "### 3.2 Performance Breakdown by Basket Size Tier",
        "",
        "| Basket Tier | Avg Item Count | Naive Walk Distance | 2-Opt Walk Distance | Walk Reduction % | Naive Assembly Time | 2-Opt Assembly Time |",
        "|---|---|---|---|---|---|---|",
        wh_tier_table,
        "",
        "---",
        "",
        "## 4. Module 3: Last-Mile Delivery Routing (CVRP)",
        "",
        "### 4.1 Benchmark Results (N = 50 Multi-Stop Dispatch Batches)",
        f"- **Total Baseline Fleet Distance:** {del_sum['total_baseline_distance_km']:,.1f} km",
        f"- **Total 2-Opt CVRP Fleet Distance:** {del_sum['total_optimized_distance_km']:,.1f} km",
        f"- **Net Fleet Distance Reduction:** **-{del_sum['total_baseline_distance_km'] - del_sum['total_optimized_distance_km']:,.1f} km ({del_sum['distance_reduction_pct']:.2f}% savings)**",
        f"- **Fleet Vehicles Required:** {del_sum['total_baseline_vehicles']} vehicles (Baseline) $\\to$ **{del_sum['total_optimized_vehicles']} vehicles (Optimized)**",
        f"- **Fleet Capacity Utilization:** {del_sum['mean_baseline_utilization_pct']:.1f}% (Baseline) $\\to$ **{del_sum['mean_optimized_utilization_pct']:.1f}% (Optimized)**",
        f"- **Mean Per-Batch Distance Savings:** **{del_sum['mean_batch_savings_pct']:.2f}%** (Median: {del_sum['median_batch_savings_pct']:.2f}%, Std: {del_sum['std_batch_savings_pct']:.2f}%)",
        f"- **Best Case Savings:** {del_sum['best_case_savings_pct']:.2f}% | **Worst Case Savings:** {del_sum['worst_case_savings_pct']:.2f}%",
        "",
        "### 4.2 Performance Breakdown by Urban Density Tier",
        "",
        "| Density Tier | Avg Drop-Offs | Baseline Fleet Distance | Optimized Fleet Distance | Distance Savings % | Vehicles (Base vs Opt) | Fleet Utilization |",
        "|---|---|---|---|---|---|---|",
        del_tier_table,
        "",
        "---",
        "",
        "## 5. Visual Artifacts Generated",
        "",
        "- `ml/python/plots/inventory_cost_comparison.png`: Category-wise inventory holding and stockout costs.",
        "- `ml/python/plots/inventory_service_level_comparison.png`: Service level resilience across demand volatility and supply delays.",
        "- `ml/python/plots/inventory_stock_trajectory.png`: Dynamic 180-day inventory sawtooth curve with ROP and safety stock thresholds.",
        "- `ml/python/plots/warehouse_layout_and_routes.png`: 2D micro-fulfillment dark store layout with baseline vs 2-opt picker paths.",
        "- `ml/python/plots/warehouse_distance_comparison.png`: Walking distance across basket size tiers.",
        "- `ml/python/plots/warehouse_improvement_distribution.png`: Histogram and distribution of picker walk reductions.",
        "- `ml/python/plots/delivery_routes_map.png`: Geographic multi-vehicle CVRP delivery route visualization from Central Hub.",
        "- `ml/python/plots/delivery_distance_comparison.png`: Total fleet travel distance across dispatch tiers.",
        "- `ml/python/plots/delivery_improvement_distribution.png`: Distribution of last-mile distance reduction percentages.",
        "",
        "---",
        "",
        "## 6. Execution & Reproduction",
        "```bash",
        ".venv\\Scripts\\python -m ml.python.run_optimization_experiments",
        "```",
    ]
    
    report_content = "\n".join(lines)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)
    print(f"\n[REPORT] Generated Optimization Report at: {report_path}")

def run_all_optimization():
    start_time = time.time()
    print("=" * 70)
    print("  FRESHCART AI: MASTER OPERATIONS OPTIMIZATION PIPELINE")
    print("=" * 70)
    
    # 1. Inventory
    inv_res = run_inventory_optimization_experiment()
    
    # 2. Warehouse
    wh_res = run_warehouse_optimization_experiment()
    
    # 3. Delivery
    del_res = run_delivery_optimization_experiment()
    
    # Generate Report
    generate_optimization_report(inv_res, wh_res, del_res)
    
    elapsed = time.time() - start_time
    
    inv_sum = inv_res["overall_summary"]
    wh_sum = wh_res["overall_summary"]
    del_sum = del_res["overall_summary"]
    
    print("\n" + "=" * 70)
    print("  OPTIMIZATION EXPERIMENT SUMMARY (EMPIRICAL RESULTS)")
    print("=" * 70)
    
    print("\nINVENTORY")
    print(f"  Baseline Cost:        ₹{inv_sum['total_baseline_cost']:,.2f}")
    print(f"  Optimized Cost:       ₹{inv_sum['total_optimized_cost']:,.2f}")
    print(f"  Cost Change:          -{inv_sum['cost_reduction_pct']:.2f}% (Savings of ₹{inv_sum['total_baseline_cost'] - inv_sum['total_optimized_cost']:,.2f})")
    print(f"  Baseline Stock-outs:  {inv_sum['baseline_stockout_days']} days")
    print(f"  Optimized Stock-outs: {inv_sum['optimized_stockout_days']} days (-{((inv_sum['baseline_stockout_days'] - inv_sum['optimized_stockout_days'])/inv_sum['baseline_stockout_days'])*100:.1f}%)")
    print(f"  Service Level:        {inv_sum['optimized_service_level_pct']:.2f}% (Baseline: {inv_sum['baseline_service_level_pct']:.2f}%)")
    
    print("\nWAREHOUSE")
    print(f"  Baseline Distance:    {wh_sum['total_naive_distance_m']:,.1f} meters")
    print(f"  Optimized Distance:   {wh_sum['total_opt_distance_m']:,.1f} meters")
    print(f"  Distance Reduction:   -{wh_sum['distance_reduction_pct']:.2f}% (Saved {wh_sum['total_naive_distance_m'] - wh_sum['total_opt_distance_m']:,.1f} m)")
    print(f"  Average Improvement:  {wh_sum['mean_order_savings_pct']:.2f}% (Median: {wh_sum['median_order_savings_pct']:.2f}%)")
    
    print("\nDELIVERY")
    print(f"  Baseline Distance:    {del_sum['total_baseline_distance_km']:,.1f} km")
    print(f"  Optimized Distance:   {del_sum['total_optimized_distance_km']:,.1f} km")
    print(f"  Distance Reduction:   -{del_sum['distance_reduction_pct']:.2f}% (Saved {del_sum['total_baseline_distance_km'] - del_sum['total_optimized_distance_km']:,.1f} km)")
    print(f"  Vehicle Utilization:  {del_sum['mean_optimized_utilization_pct']:.1f}% (Baseline: {del_sum['mean_baseline_utilization_pct']:.1f}%)")
    print(f"  Vehicles Used:        {del_sum['total_optimized_vehicles']} (Optimized) vs {del_sum['total_baseline_vehicles']} (Baseline)")
    
    print("\n" + "=" * 70)
    print(f"  ALL 3 OPTIMIZATION MODULES EXECUTED IN {elapsed:.2f}s | 100% REPRODUCIBLE")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    run_all_optimization()
