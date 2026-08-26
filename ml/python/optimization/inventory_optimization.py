"""
FreshCart AI — Module 1: Inventory & Procurement Optimization Engine
Implements:
1. Multi-Item Economic Order Quantity (EOQ):
       Q* = sqrt((2 * D * S) / H)
2. Stochastic Safety Stock (SS):
       SS = Z_alpha * sqrt(L * sigma_d^2 + d_bar^2 * sigma_L^2)
3. Reorder Point (ROP):
       ROP = (d_bar * L) + SS
4. Continuous Review (r, Q) Discrete Event Inventory Simulation
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional

class InventoryOptimizer:
    """
    Mathematical Inventory & Procurement Optimizer using EOQ and Stochastic ROP.
    """
    def __init__(
        self,
        service_level: float = 0.95,
        ordering_cost_per_po: float = 350.0,  # Fixed administrative & logistics cost per PO (₹)
        annual_holding_rate: float = 0.20,     # 20% annual inventory holding rate
        stockout_penalty_multiplier: float = 1.5, # Penalty cost per unmet unit relative to margin
    ):
        self.service_level = service_level
        self.ordering_cost_per_po = ordering_cost_per_po
        self.annual_holding_rate = annual_holding_rate
        self.stockout_penalty_multiplier = stockout_penalty_multiplier
        
        # Standard normal inverse CDF lookup for service levels
        self.z_table = {
            0.90: 1.282,
            0.95: 1.645,
            0.98: 2.054,
            0.99: 2.326,
        }
        self.z_score = self.z_table.get(round(service_level, 2), 1.645)

    def calculate_sku_parameters(
        self,
        sku_id: str,
        name: str,
        unit_price: float,
        daily_demands: np.ndarray,
        lead_time_days: float = 2.0,
        lead_time_std: float = 0.5,
        wholesale_cost_ratio: float = 0.65,
    ) -> Dict:
        """
        Compute theoretical EOQ, Safety Stock, and ROP for a single SKU.
        """
        unit_cost = unit_price * wholesale_cost_ratio
        avg_daily_demand = float(np.mean(daily_demands))
        std_daily_demand = float(np.std(daily_demands, ddof=1)) if len(daily_demands) > 1 else 1.0
        annual_demand = avg_daily_demand * 365.0
        
        # Annual Holding Cost per unit per year: H = i * C
        holding_cost_unit_year = self.annual_holding_rate * unit_cost
        holding_cost_unit_day = holding_cost_unit_year / 365.0
        
        # Economic Order Quantity (EOQ)
        # Q* = sqrt((2 * D * S) / H)
        if holding_cost_unit_year > 0:
            eoq = np.sqrt((2.0 * annual_demand * self.ordering_cost_per_po) / holding_cost_unit_year)
        else:
            eoq = avg_daily_demand * 14.0
        eoq = max(10, int(np.round(eoq)))
        
        # Safety Stock under stochastic demand and stochastic lead time:
        # SS = Z * sqrt(L * sigma_d^2 + d_bar^2 * sigma_L^2)
        variance_lead_demand = (lead_time_days * (std_daily_demand ** 2)) + ((avg_daily_demand ** 2) * (lead_time_std ** 2))
        safety_stock = self.z_score * np.sqrt(variance_lead_demand)
        safety_stock = max(2, int(np.ceil(safety_stock)))
        
        # Reorder Point (ROP) = Lead Time Demand + Safety Stock
        lead_time_demand = avg_daily_demand * lead_time_days
        rop = int(np.ceil(lead_time_demand + safety_stock))
        
        # Unit stockout penalty cost
        profit_margin = unit_price - unit_cost
        stockout_penalty_per_unit = profit_margin * self.stockout_penalty_multiplier
        
        return {
            "sku_id": sku_id,
            "name": name,
            "unit_price": unit_price,
            "unit_cost": unit_cost,
            "avg_daily_demand": avg_daily_demand,
            "std_daily_demand": std_daily_demand,
            "annual_demand": annual_demand,
            "lead_time_days": lead_time_days,
            "lead_time_std": lead_time_std,
            "holding_cost_unit_year": holding_cost_unit_year,
            "holding_cost_unit_day": holding_cost_unit_day,
            "ordering_cost_per_po": self.ordering_cost_per_po,
            "eoq": eoq,
            "safety_stock": safety_stock,
            "rop": rop,
            "stockout_penalty_per_unit": stockout_penalty_per_unit,
        }

def simulate_inventory_policy(
    sku_params: Dict,
    daily_demand_series: np.ndarray,
    policy_type: str = "optimized", # "baseline" or "optimized"
    sim_days: int = 180,
    initial_stock: Optional[int] = None,
    seed: int = 42,
) -> Dict:
    """
    Simulate a continuous inventory trajectory over `sim_days`.
    
    Policies:
    1. 'baseline': Fixed reorder threshold (e.g. order fixed 40 units whenever inventory <= 15).
    2. 'optimized': Continuous Review (r, Q) using EOQ and Safety Stock ROP.
    """
    np.random.seed(seed)
    
    if policy_type == "optimized":
        reorder_point = sku_params["rop"]
        order_quantity = sku_params["eoq"]
    else:
        # Baseline heuristic policy: Fixed static threshold & fixed standard batch
        reorder_point = max(10, int(sku_params["avg_daily_demand"] * 1.5))
        order_quantity = max(25, int(sku_params["avg_daily_demand"] * 4.0))
        
    if initial_stock is None:
        initial_stock = reorder_point + order_quantity
        
    on_hand = float(initial_stock)
    pipeline_orders = [] # list of (arrival_day, quantity)
    
    history_on_hand = []
    history_demand = []
    history_sales = []
    history_stockouts = []
    history_orders = []
    
    total_orders_placed = 0
    total_holding_cost = 0.0
    total_ordering_cost = 0.0
    total_stockout_penalty = 0.0
    total_unmet_demand = 0.0
    total_demand = 0.0
    total_fulfilled_demand = 0.0
    
    h_cost_day = sku_params["holding_cost_unit_day"]
    s_cost = sku_params["ordering_cost_per_po"]
    penalty_cost = sku_params["stockout_penalty_per_unit"]
    
    lead_mean = sku_params["lead_time_days"]
    lead_std = sku_params["lead_time_std"]
    
    for day in range(sim_days):
        # 1. Process Order Deliveries arriving today
        arrived_qty = 0.0
        remaining_pipeline = []
        for arr_day, qty in pipeline_orders:
            if arr_day <= day:
                arrived_qty += qty
            else:
                remaining_pipeline.append((arr_day, qty))
        pipeline_orders = remaining_pipeline
        on_hand += arrived_qty
        
        # 2. Realize Daily Demand
        if day < len(daily_demand_series):
            d_t = float(daily_demand_series[day])
        else:
            # Sample from distribution if beyond historical series
            d_t = max(0.0, np.random.normal(sku_params["avg_daily_demand"], sku_params["std_daily_demand"]))
        d_t = round(d_t, 1)
        total_demand += d_t
        
        # 3. Fulfill Demand
        if on_hand >= d_t:
            fulfilled = d_t
            unmet = 0.0
            on_hand -= d_t
        else:
            fulfilled = on_hand
            unmet = d_t - on_hand
            on_hand = 0.0
            
        total_fulfilled_demand += fulfilled
        total_unmet_demand += unmet
        
        # Calculate daily costs
        day_holding = on_hand * h_cost_day
        day_penalty = unmet * penalty_cost
        total_holding_cost += day_holding
        total_stockout_penalty += day_penalty
        
        # 4. Inventory Review & Reorder Decision
        # Inventory Position = On-Hand + On-Order
        on_order = sum(qty for _, qty in pipeline_orders)
        inventory_position = on_hand + on_order
        
        order_placed_today = 0.0
        if inventory_position <= reorder_point:
            # Place Purchase Order
            sim_lead = max(1.0, np.random.normal(lead_mean, lead_std))
            arrival_day = day + int(np.ceil(sim_lead))
            pipeline_orders.append((arrival_day, order_quantity))
            total_orders_placed += 1
            total_ordering_cost += s_cost
            order_placed_today = order_quantity
            
        history_on_hand.append(on_hand)
        history_demand.append(d_t)
        history_sales.append(fulfilled)
        history_stockouts.append(unmet)
        history_orders.append(order_placed_today)
        
    total_cost = total_holding_cost + total_ordering_cost + total_stockout_penalty
    service_level = (total_fulfilled_demand / total_demand) if total_demand > 0 else 1.0
    stockout_rate = (total_unmet_demand / total_demand) if total_demand > 0 else 0.0
    stockout_days = int(sum(1 for u in history_stockouts if u > 0))
    avg_inventory = float(np.mean(history_on_hand))
    
    return {
        "policy_type": policy_type,
        "sku_id": sku_params["sku_id"],
        "sku_name": sku_params["name"],
        "sim_days": sim_days,
        "reorder_point": reorder_point,
        "order_quantity": order_quantity,
        "total_demand": float(total_demand),
        "total_fulfilled": float(total_fulfilled_demand),
        "total_unmet": float(total_unmet_demand),
        "service_level": float(service_level),
        "stockout_rate": float(stockout_rate),
        "stockout_days": stockout_days,
        "orders_placed": total_orders_placed,
        "avg_inventory": avg_inventory,
        "holding_cost": float(total_holding_cost),
        "ordering_cost": float(total_ordering_cost),
        "stockout_penalty_cost": float(total_stockout_penalty),
        "total_cost": float(total_cost),
        "history_on_hand": history_on_hand,
        "history_stockouts": history_stockouts,
        "history_orders": history_orders,
    }
