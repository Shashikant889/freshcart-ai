"""
FreshCart AI — Module 3: Last-Mile Delivery Routing & Fleet Optimizer (CVRP)
Implements:
1. Haversine Great-Circle Distance Metric for Urban Coordinates
2. Capacitated Vehicle Routing Problem (CVRP) Model
3. Baseline Strategies: FIFO / Random Dispatch, Naive Sequential Clustering
4. Optimization Strategy: Clarke-Wright Savings Heuristic + Intra-Route 2-Opt TSP Smoothing
5. Fleet Metrics: Distance (km), Travel Time, Vehicle Utilization %, Fleet Efficiency
"""

import numpy as np
from typing import Dict, List, Tuple, Optional

# Default Fulfillment Depot (Central Hub)
DEFAULT_DEPOT = {
    "id": "DEPOT_01",
    "name": "FreshCart Central Hub",
    "lat": 19.0760, # Mumbai Central
    "lng": 72.8777,
    "demand": 0.0,
}

# Standard Urban Delivery Neighborhood Coordinates
DEFAULT_NEIGHBORHOODS = [
    {"name": "Bandra West", "lat": 19.0596, "lng": 72.8295},
    {"name": "Andheri East", "lat": 19.1136, "lng": 72.8697},
    {"name": "Powai Hiranandani", "lat": 19.1197, "lng": 72.9051},
    {"name": "Juhu Tara", "lat": 19.0883, "lng": 72.8263},
    {"name": "Dadar Central", "lat": 19.0178, "lng": 72.8478},
    {"name": "Worli Seaface", "lat": 19.0134, "lng": 72.8153},
    {"name": "Kurla West", "lat": 19.0726, "lng": 72.8845},
    {"name": "Ghatkopar East", "lat": 19.0860, "lng": 72.9090},
    {"name": "Lower Parel", "lat": 18.9953, "lng": 72.8300},
    {"name": "Santacruz East", "lat": 19.0805, "lng": 72.8415},
    {"name": "Chembur East", "lat": 19.0522, "lng": 72.8994},
    {"name": "Vile Parle West", "lat": 19.0988, "lng": 72.8381},
    {"name": "Malad West", "lat": 19.1874, "lng": 72.8484},
    {"name": "Goregaon East", "lat": 19.1663, "lng": 72.8526},
    {"name": "Borivali West", "lat": 19.2307, "lng": 72.8567},
]

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate great-circle distance between two GPS points in kilometers.
    """
    r_earth = 6371.0  # Earth radius in km
    phi1, phi2 = np.radians(lat1), np.radians(lat2)
    delta_phi = np.radians(lat2 - lat1)
    delta_lambda = np.radians(lon2 - lon1)
    
    a = (
        np.sin(delta_phi / 2.0) ** 2
        + np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))
    return float(r_earth * c)

def compute_route_distance(route: List[Dict], depot: Dict) -> float:
    """Calculate round-trip distance of a single vehicle route: Depot -> Stops -> Depot."""
    if not route:
        return 0.0
    full_tour = [depot] + route + [depot]
    dist = 0.0
    for i in range(len(full_tour) - 1):
        dist += haversine_distance(
            full_tour[i]["lat"], full_tour[i]["lng"],
            full_tour[i + 1]["lat"], full_tour[i + 1]["lng"]
        )
    return float(dist)

def two_opt_route(route: List[Dict], depot: Dict) -> List[Dict]:
    """
    Optimize customer stop order for a single vehicle route using 2-Opt local search.
    """
    if len(route) <= 2:
        return list(route)
        
    best_route = list(route)
    best_dist = compute_route_distance(best_route, depot)
    improved = True
    iteration = 0
    
    while improved and iteration < 50:
        improved = False
        iteration += 1
        n = len(best_route)
        
        for i in range(n - 1):
            for k in range(i + 1, n):
                # 2-opt swap on customer stops
                new_route = best_route[:i] + list(reversed(best_route[i:k + 1])) + best_route[k + 1:]
                new_dist = compute_route_distance(new_route, depot)
                
                if new_dist < best_dist - 1e-4:
                    best_route = new_route
                    best_dist = new_dist
                    improved = True
                    break
            if improved:
                break
                
    return best_route

class DeliveryRouter:
    """
    Capacitated Vehicle Routing Problem (CVRP) Solver.
    """
    def __init__(
        self,
        depot: Optional[Dict] = None,
        vehicle_capacity_kg: float = 25.0,  # Max payload per e-bike/van (kg)
        avg_speed_kmh: float = 22.0,        # Average urban speed in traffic (km/h)
        service_time_min_per_stop: float = 6.0, # Drop-off / verification time per stop (minutes)
    ):
        self.depot = depot or DEFAULT_DEPOT
        self.vehicle_capacity_kg = vehicle_capacity_kg
        self.avg_speed_kmh = avg_speed_kmh
        self.service_time_min_per_stop = service_time_min_per_stop

    def solve_fifo_baseline(self, orders: List[Dict]) -> Dict:
        """
        Baseline 1: Random / FIFO Dispatch.
        Orders are assigned to vehicles sequentially in arrival order until capacity fills.
        Stops within each vehicle are visited in arbitrary FIFO sequence without 2-Opt.
        """
        if not orders:
            return self._empty_solution()
            
        routes = []
        current_route = []
        current_load = 0.0
        
        for order in orders:
            demand = order.get("demand", 2.5)
            if current_load + demand > self.vehicle_capacity_kg and current_route:
                routes.append(current_route)
                current_route = [order]
                current_load = demand
            else:
                current_route.append(order)
                current_load += demand
                
        if current_route:
            routes.append(current_route)
            
        return self._format_solution(routes, orders, solver_name="FIFO Baseline")

    def solve_clarke_wright_savings(self, orders: List[Dict]) -> Dict:
        """
        Optimization Strategy:
        1. Clarke-Wright Savings Heuristic for optimal vehicle clustering.
        2. Intra-Route 2-Opt TSP optimization for each cluster.
        """
        if not orders:
            return self._empty_solution()
            
        n = len(orders)
        # 1. Initialize N individual routes: Depot -> Customer i -> Depot
        routes = [[order] for order in orders]
        route_loads = [order.get("demand", 2.5) for order in orders]
        
        # 2. Compute pairwise savings: S(i, j) = d(D, i) + d(D, j) - d(i, j)
        savings = []
        for i in range(n):
            for j in range(i + 1, n):
                d_0i = haversine_distance(self.depot["lat"], self.depot["lng"], orders[i]["lat"], orders[i]["lng"])
                d_0j = haversine_distance(self.depot["lat"], self.depot["lng"], orders[j]["lat"], orders[j]["lng"])
                d_ij = haversine_distance(orders[i]["lat"], orders[i]["lng"], orders[j]["lat"], orders[j]["lng"])
                s_ij = d_0i + d_0j - d_ij
                savings.append((s_ij, i, j))
                
        # Sort savings descending
        savings.sort(key=lambda x: x[0], reverse=True)
        
        # 3. Merge routes greedily subject to capacity constraints
        def find_route_index(order_id):
            for r_idx, r in enumerate(routes):
                for node in r:
                    if node["id"] == order_id:
                        return r_idx
            return -1

        for s_ij, i, j in savings:
            if s_ij <= 0:
                break
                
            node_i = orders[i]
            node_j = orders[j]
            
            r_idx_i = find_route_index(node_i["id"])
            r_idx_j = find_route_index(node_j["id"])
            
            if r_idx_i == r_idx_j or r_idx_i == -1 or r_idx_j == -1:
                continue
                
            route_i = routes[r_idx_i]
            route_j = routes[r_idx_j]
            load_combined = route_loads[r_idx_i] + route_loads[r_idx_j]
            
            if load_combined <= self.vehicle_capacity_kg:
                # Merge routes if node i is an endpoint of route_i and node j is an endpoint of route_j
                if route_i[-1]["id"] == node_i["id"] and route_j[0]["id"] == node_j["id"]:
                    merged = route_i + route_j
                elif route_j[-1]["id"] == node_j["id"] and route_i[0]["id"] == node_i["id"]:
                    merged = route_j + route_i
                elif route_i[0]["id"] == node_i["id"] and route_j[0]["id"] == node_j["id"]:
                    merged = list(reversed(route_i)) + route_j
                elif route_i[-1]["id"] == node_i["id"] and route_j[-1]["id"] == node_j["id"]:
                    merged = route_i + list(reversed(route_j))
                else:
                    continue
                    
                # Replace route_i with merged, delete route_j
                routes[r_idx_i] = merged
                route_loads[r_idx_i] = load_combined
                routes.pop(r_idx_j)
                route_loads.pop(r_idx_j)
                
        # 4. Apply 2-Opt local search improvement to each individual vehicle route
        optimized_routes = []
        for r in routes:
            opt_r = two_opt_route(r, self.depot)
            optimized_routes.append(opt_r)
            
        return self._format_solution(optimized_routes, orders, solver_name="Clarke-Wright + 2-Opt")

    def _format_solution(self, routes: List[List[Dict]], all_orders: List[Dict], solver_name: str) -> Dict:
        """Format solution metrics across fleet."""
        route_details = []
        total_fleet_distance = 0.0
        total_payload = 0.0
        
        for v_idx, r in enumerate(routes):
            r_dist = compute_route_distance(r, self.depot)
            r_demand = sum(o.get("demand", 2.5) for o in r)
            travel_time_hours = r_dist / self.avg_speed_kmh
            service_time_hours = (len(r) * self.service_time_min_per_stop) / 60.0
            total_route_time_hours = travel_time_hours + service_time_hours
            
            total_fleet_distance += r_dist
            total_payload += r_demand
            
            route_details.append({
                "vehicle_id": f"VEHICLE_{v_idx + 1:02d}",
                "num_stops": len(r),
                "route_distance_km": float(r_dist),
                "payload_kg": float(r_demand),
                "capacity_utilization_pct": float((r_demand / self.vehicle_capacity_kg) * 100.0),
                "estimated_time_hours": float(total_route_time_hours),
                "stops": [{"id": o["id"], "name": o.get("name", ""), "lat": o["lat"], "lng": o["lng"], "demand": o.get("demand", 2.5)} for o in r],
            })
            
        num_vehicles = len(routes)
        total_capacity_available = num_vehicles * self.vehicle_capacity_kg
        fleet_utilization = (total_payload / total_capacity_available * 100.0) if total_capacity_available > 0 else 0.0
        
        avg_route_dist = (total_fleet_distance / num_vehicles) if num_vehicles > 0 else 0.0
        max_route_dist = max((r["route_distance_km"] for r in route_details), default=0.0)
        
        total_travel_time_hours = sum(r["estimated_time_hours"] for r in route_details)
        
        return {
            "solver_name": solver_name,
            "total_orders": len(all_orders),
            "num_vehicles_used": num_vehicles,
            "total_fleet_distance_km": float(total_fleet_distance),
            "total_travel_time_hours": float(total_travel_time_hours),
            "avg_route_distance_km": float(avg_route_dist),
            "max_route_distance_km": float(max_route_dist),
            "total_payload_delivered_kg": float(total_payload),
            "fleet_capacity_utilization_pct": float(fleet_utilization),
            "routes": route_details,
        }

    def _empty_solution(self) -> Dict:
        return {
            "solver_name": "Empty",
            "total_orders": 0,
            "num_vehicles_used": 0,
            "total_fleet_distance_km": 0.0,
            "total_travel_time_hours": 0.0,
            "avg_route_distance_km": 0.0,
            "max_route_distance_km": 0.0,
            "total_payload_delivered_kg": 0.0,
            "fleet_capacity_utilization_pct": 0.0,
            "routes": [],
        }
