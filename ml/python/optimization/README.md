# FreshCart AI — Operations Optimization Subsystem

This package provides mathematical optimization algorithms for grocery retail operations across three domains:

1. **Inventory Management & Procurement** (`inventory_optimization.py`)
   - Economic Order Quantity (EOQ): $Q^* = \sqrt{\frac{2DS}{H}}$
   - Stochastic Safety Stock: $SS = Z_\alpha \sqrt{L \sigma_d^2 + \bar{d}^2 \sigma_L^2}$
   - Reorder Point: $ROP = (\bar{d} L) + SS$
   - Discrete-event continuous review $(r, Q)$ simulation.

2. **Dark Store Warehouse Picking** (`warehouse_optimization.py`)
   - Micro-fulfillment dark store 2D layout grid (aisles, racks, packing station).
   - 2D Traveling Salesperson Problem (TSP).
   - Nearest-Neighbor (NN) construction + 2-Opt local search improvement.
   - Exact brute-force solver benchmark for small orders ($N \le 8$).

3. **Last-Mile Delivery Dispatch** (`delivery_optimization.py`)
   - Capacitated Vehicle Routing Problem (CVRP).
   - Haversine great-circle distance matrix computation.
   - Clarke-Wright Savings heuristic for capacity-aware vehicle clustering.
   - Intra-route 2-Opt TSP optimization.

---

## Reproducing Optimization Benchmarks

To execute all three optimization experiments and generate academic reports and plots:

```bash
.venv\Scripts\python -m ml.python.run_optimization_experiments
```

Individual modules can be executed via:
```bash
.venv\Scripts\python -m ml.python.experiments.inventory_optimization_experiment
.venv\Scripts\python -m ml.python.experiments.warehouse_optimization_experiment
.venv\Scripts\python -m ml.python.experiments.delivery_optimization_experiment
```

---

## Output Artifacts

- **Reports:**
  - `ml/python/reports/OPTIMIZATION_EXPERIMENT_REPORT.md`: Comprehensive evaluation report with empirical tables.
  - `ml/python/reports/OPTIMIZATION_METHODOLOGY.md`: Undergraduate-level mathematical derivations and proofs.
- **Metrics JSON:**
  - `ml/python/metrics/inventory_optimization_metrics.json`
  - `ml/python/metrics/warehouse_optimization_metrics.json`
  - `ml/python/metrics/delivery_optimization_metrics.json`
- **Plots (PNG):**
  - `ml/python/plots/inventory_cost_comparison.png`
  - `ml/python/plots/inventory_service_level_comparison.png`
  - `ml/python/plots/inventory_stock_trajectory.png`
  - `ml/python/plots/warehouse_layout_and_routes.png`
  - `ml/python/plots/warehouse_distance_comparison.png`
  - `ml/python/plots/warehouse_improvement_distribution.png`
  - `ml/python/plots/delivery_routes_map.png`
  - `ml/python/plots/delivery_distance_comparison.png`
  - `ml/python/plots/delivery_improvement_distribution.png`
- **Serialized Model Artifacts (Joblib):**
  - `ml/python/models/inventory_optimizer.joblib`
  - `ml/python/models/warehouse_optimizer.joblib`
  - `ml/python/models/delivery_router.joblib`
