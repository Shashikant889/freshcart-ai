# Operations Research & Mathematical Optimization Experiment Report

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Evaluation Framework:** Final-Year Major Capstone (B.Tech CSE-AIML, Mumbai University)  
**Experiment Execution Date:** `2026-08-26 12:07:47`  
**Random Seed:** `42` (Fixed for strict reproducibility)  
**Environment:** Python 3.12, NumPy, Pandas, Matplotlib, Scipy  

---

## 1. Executive Summary

This report provides empirical evidence and mathematical benchmarking for the three operations optimization subsystems in FreshCart AI:
1. **Inventory & Procurement Optimization:** Multi-item Economic Order Quantity (EOQ) and Stochastic Reorder Point (ROP) with safety stock.
2. **Dark Store Warehouse Picking:** 2D Traveling Salesperson Problem (TSP) with Nearest-Neighbor and 2-Opt local search improvement.
3. **Last-Mile Delivery Routing:** Capacitated Vehicle Routing Problem (CVRP) with Clarke-Wright Savings clustering and intra-route 2-Opt TSP smoothing.

All metrics reflect actual simulations across multiple randomized scenarios with zero fabricated values.

---

## 2. Module 1: Inventory & Procurement Optimization

### 2.1 Benchmark Results (180 Simulated Days Across 31 Catalog SKUs)
- **Baseline Total Cost:** ₹796,250.89
- **Optimized (EOQ+ROP) Total Cost:** ₹98,394.90
- **Net Cost Reduction:** **-₹697,855.99 (87.64% savings)**
- **Baseline Mean Service Level:** 89.45%
- **Optimized Mean Service Level:** **99.88%** (Target: 95.00%)
- **Total Stockout Days:** 890 days (Baseline) $\to$ **15 days (Optimized)** (-98.3%)

### 2.2 Scenario Sensitivity Stress Tests

| Scenario | Baseline Cost | Optimized Cost | Savings % | Baseline Service Level | Optimized Service Level | Stockout Days |
|---|---|---|---|---|---|---|
| **Scenario A (Standard Demand & Lead Time)** | ₹796,250.89 | ₹98,394.90 | **-87.64%** | 89.4% | 99.9% | 890d vs 15d |
| **Scenario B (High Volatility +80%)** | ₹1,303,558.91 | ₹135,593.21 | **-89.60%** | 87.4% | 99.9% | 1103d vs 20d |
| **Scenario C (Supply Delay +100%)** | ₹1,554,422.37 | ₹103,765.50 | **-93.32%** | 65.4% | 99.9% | 2312d vs 15d |

---

## 3. Module 2: Dark Store Warehouse Picking Optimization

### 3.1 Benchmark Results (N = 100 Simulated Grocery Orders)
- **Total Naive Walk Distance:** 9,685.4 meters
- **Total 2-Opt Optimized Walk Distance:** 6,055.3 meters
- **Net Walking Distance Saved:** **-3,630.2 m (37.48% reduction)**
- **Total Assembly Time Saved:** **-3,025.1 seconds (25.55% faster)**
- **Mean Per-Order Walk Savings:** **30.07%** (Median: 31.84%, Std: 17.65%)
- **Best Case Savings:** 62.45% | **Worst Case Savings:** -0.64%

### 3.2 Performance Breakdown by Basket Size Tier

| Basket Tier | Avg Item Count | Naive Walk Distance | 2-Opt Walk Distance | Walk Reduction % | Naive Assembly Time | 2-Opt Assembly Time |
|---|---|---|---|---|---|---|
| **Large (11-18 items)** | 14.9 SKUs | 185.7 m | 82.1 m | **-55.05%** | 229.4 s | 143.1 s |
| **Medium (6-10 items)** | 8.4 SKUs | 102.1 m | 63.4 m | **-36.23%** | 127.0 s | 94.8 s |
| **Small (3-5 items)** | 4.1 SKUs | 60.7 m | 50.2 m | **-15.34%** | 71.3 s | 62.5 s |

---

## 4. Module 3: Last-Mile Delivery Routing (CVRP)

### 4.1 Benchmark Results (N = 50 Multi-Stop Dispatch Batches)
- **Total Baseline Fleet Distance:** 14,502.7 km
- **Total 2-Opt CVRP Fleet Distance:** 5,566.3 km
- **Net Fleet Distance Reduction:** **-8,936.4 km (61.62% savings)**
- **Fleet Vehicles Required:** 229 vehicles (Baseline) $\to$ **225 vehicles (Optimized)**
- **Fleet Capacity Utilization:** 82.3% (Baseline) $\to$ **82.9% (Optimized)**
- **Mean Per-Batch Distance Savings:** **59.58%** (Median: 60.51%, Std: 6.68%)
- **Best Case Savings:** 69.33% | **Worst Case Savings:** 34.48%

### 4.2 Performance Breakdown by Urban Density Tier

| Density Tier | Avg Drop-Offs | Baseline Fleet Distance | Optimized Fleet Distance | Distance Savings % | Vehicles (Base vs Opt) | Fleet Utilization |
|---|---|---|---|---|---|---|
| **High-Density Cluster (35-50 stops)** | 41.4 stops | 441.4 km | 153.4 km | **-64.79%** | 6.9 vs 6.7 | 89.4% |
| **Light Dispatch (12-18 stops)** | 14.2 stops | 157.6 km | 72.8 km | **-52.92%** | 2.3 vs 2.4 | 76.3% |
| **Medium Dispatch (20-30 stops)** | 24.8 stops | 272.8 km | 107.5 km | **-60.17%** | 4.4 vs 4.3 | 82.7% |

---

## 5. Visual Artifacts Generated

- `ml/python/plots/inventory_cost_comparison.png`: Category-wise inventory holding and stockout costs.
- `ml/python/plots/inventory_service_level_comparison.png`: Service level resilience across demand volatility and supply delays.
- `ml/python/plots/inventory_stock_trajectory.png`: Dynamic 180-day inventory sawtooth curve with ROP and safety stock thresholds.
- `ml/python/plots/warehouse_layout_and_routes.png`: 2D micro-fulfillment dark store layout with baseline vs 2-opt picker paths.
- `ml/python/plots/warehouse_distance_comparison.png`: Walking distance across basket size tiers.
- `ml/python/plots/warehouse_improvement_distribution.png`: Histogram and distribution of picker walk reductions.
- `ml/python/plots/delivery_routes_map.png`: Geographic multi-vehicle CVRP delivery route visualization from Central Hub.
- `ml/python/plots/delivery_distance_comparison.png`: Total fleet travel distance across dispatch tiers.
- `ml/python/plots/delivery_improvement_distribution.png`: Distribution of last-mile distance reduction percentages.

---

## 6. Execution & Reproduction
```bash
.venv\Scripts\python -m ml.python.run_optimization_experiments
```