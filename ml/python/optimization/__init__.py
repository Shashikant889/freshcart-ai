"""
FreshCart AI — Operations Optimization Subsystem
Contains mathematical optimization engines for:
1. Inventory Management (EOQ, Safety Stock, Reorder Point)
2. Dark Store Warehouse Picking (2D TSP, 2-Opt Heuristic)
3. Last-Mile Delivery Routing (Capacitated VRP, Clarke-Wright Savings, 2-Opt)
"""

from ml.python.optimization.inventory_optimization import (
    InventoryOptimizer,
    simulate_inventory_policy,
)
from ml.python.optimization.warehouse_optimization import (
    WarehouseOptimizer,
    euclidean_distance,
)
from ml.python.optimization.delivery_optimization import (
    DeliveryRouter,
    haversine_distance,
)

__all__ = [
    "InventoryOptimizer",
    "simulate_inventory_policy",
    "WarehouseOptimizer",
    "euclidean_distance",
    "DeliveryRouter",
    "haversine_distance",
]
