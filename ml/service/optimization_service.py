"""
FreshCart AI — Operations Optimization Service Handler (Inventory, Warehouse, Delivery)
"""

import numpy as np
from typing import Dict, Any, List
from ml.service.model_loader import registry
from ml.service.schemas import (
    InventoryOptimizationRequest,
    InventoryOptimizationResponse,
    WarehouseOptimizationRequest,
    WarehouseOptimizationResponse,
    PickStop,
    DeliveryOptimizationRequest,
    DeliveryOptimizationResponse,
    VehicleRoute,
)
from ml.python.optimization.inventory_optimization import InventoryOptimizer
from ml.python.optimization.warehouse_optimization import WarehouseOptimizer, estimate_pick_time_seconds
from ml.python.optimization.delivery_optimization import DeliveryRouter

def optimize_inventory(req: InventoryOptimizationRequest) -> InventoryOptimizationResponse:
    """
    Compute EOQ, Safety Stock, Reorder Point, and Procurement Quantities.
    """
    opt = registry.get_model("inventory_optimizer") or InventoryOptimizer()
    
    # Generate synthetic historical array around mean/std
    np.random.seed(42)
    demands = np.random.normal(req.avg_daily_demand, req.std_daily_demand or 2.0, size=90)
    demands = np.maximum(0.5, demands)
    
    params = opt.calculate_sku_parameters(
        sku_id=req.sku_id,
        name=req.name or "Item",
        unit_price=req.unit_price,
        daily_demands=demands,
        lead_time_days=req.lead_time_days,
        lead_time_std=req.lead_time_std,
    )
    
    needs_reorder = req.current_stock <= params["rop"]
    suggested_order_qty = params["eoq"] if needs_reorder else 0
    estimated_reorder_cost = suggested_order_qty * params["unit_cost"]
    
    return InventoryOptimizationResponse(
        success=True,
        sku_id=req.sku_id,
        name=req.name or "Item",
        economic_order_quantity=params["eoq"],
        safety_stock=params["safety_stock"],
        reorder_point=params["rop"],
        current_stock=req.current_stock,
        needs_reorder=needs_reorder,
        suggested_order_quantity=suggested_order_qty,
        estimated_reorder_cost=round(estimated_reorder_cost, 2),
        service_level=req.service_level,
        model_used="Continuous Review (r, Q) with EOQ & Stochastic Safety Stock",
        is_fallback=False,
    )

def optimize_warehouse(req: WarehouseOptimizationRequest) -> WarehouseOptimizationResponse:
    """
    Optimize picker walk path in 2D dark store using 2-Opt TSP.
    """
    wh_opt = registry.get_model("warehouse_optimizer") or WarehouseOptimizer()
    
    items = wh_opt.resolve_items(req.product_ids)
    tour, dist = wh_opt.solve_2opt(items)
    
    pick_time = estimate_pick_time_seconds(dist, len(items))
    
    sequence: List[PickStop] = []
    for step_idx, node in enumerate(tour[1:], start=1):
        sequence.append(PickStop(
            step=step_idx,
            product_id=node.get("sku_id", ""),
            name=node.get("name", "Product"),
            aisle=node.get("aisle", "A1"),
            rack=node.get("rack", 1),
            shelf=node.get("shelf", 1),
            zone=node.get("zone", "General"),
            x=float(node.get("x", 0.0)),
            y=float(node.get("y", 0.0)),
        ))
        
    return WarehouseOptimizationResponse(
        success=True,
        total_items=len(items),
        total_walking_distance_meters=round(dist, 1),
        estimated_pick_time_seconds=round(pick_time, 1),
        picking_sequence=sequence,
        algorithm_used="2D TSP Nearest-Neighbor + 2-Opt Local Search",
        is_fallback=False,
    )

def optimize_delivery(req: DeliveryOptimizationRequest) -> DeliveryOptimizationResponse:
    """
    Solve Capacitated Vehicle Routing Problem (CVRP) with Clarke-Wright Savings and 2-Opt.
    """
    depot = {
        "id": "DEPOT_01",
        "name": req.depot_name or "Central Hub",
        "lat": req.depot_lat or 19.0760,
        "lng": req.depot_lng or 72.8777,
        "demand": 0.0,
    }
    
    router = DeliveryRouter(depot=depot, vehicle_capacity_kg=req.vehicle_capacity_kg)
    
    orders = [
        {
            "id": s.id,
            "name": s.name,
            "lat": s.lat,
            "lng": s.lng,
            "demand": s.demand,
        }
        for s in req.orders
    ]
    
    sol = router.solve_clarke_wright_savings(orders)
    
    routes: List[VehicleRoute] = []
    for r in sol["routes"]:
        routes.append(VehicleRoute(
            vehicle_id=r["vehicle_id"],
            num_stops=r["num_stops"],
            route_distance_km=round(r["route_distance_km"], 2),
            payload_kg=round(r["payload_kg"], 1),
            capacity_utilization_pct=round(r["capacity_utilization_pct"], 1),
            estimated_time_hours=round(r["estimated_time_hours"], 2),
            stops=r["stops"],
        ))
        
    return DeliveryOptimizationResponse(
        success=True,
        total_orders=sol["total_orders"],
        num_vehicles_used=sol["num_vehicles_used"],
        total_fleet_distance_km=round(sol["total_fleet_distance_km"], 2),
        total_travel_time_hours=round(sol["total_travel_time_hours"], 2),
        avg_route_distance_km=round(sol["avg_route_distance_km"], 2),
        fleet_capacity_utilization_pct=round(sol["fleet_capacity_utilization_pct"], 1),
        routes=routes,
        algorithm_used="Clarke-Wright Savings Heuristic + Intra-Route 2-Opt CVRP",
        is_fallback=False,
    )
