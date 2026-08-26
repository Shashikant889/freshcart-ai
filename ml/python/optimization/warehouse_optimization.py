"""
FreshCart AI — Module 2: Dark Store Warehouse Picker 2D TSP Route Optimizer
Implements:
1. Micro-Fulfillment Dark Store 2D Grid Layout (Aisles, Racks, Shelves, Packing Station)
2. Exact Brute-Force Solver (Global Optimum for N <= 8)
3. Nearest Neighbor (NN) Heuristic Construction
4. 2-Opt Local Search Iterative Route Optimization
5. Route Metrics: Distance (m), Walking Time, Pick Duration
"""

import itertools
import numpy as np
from typing import Dict, List, Tuple, Optional

# Physical Dark Store Coordinate Map (in meters)
# Grid: 20m x 25m Micro-Fulfillment Center
DEFAULT_WAREHOUSE_LOCATIONS = {
    # Fruits Zone (Aisle A1, x = 2.0m)
    "f1": {"aisle": "A1", "rack": 1, "shelf": 2, "x": 2.0, "y": 3.5, "zone": "Fruits", "name": "Fresh Apples"},
    "f2": {"aisle": "A1", "rack": 2, "shelf": 1, "x": 2.0, "y": 7.0, "zone": "Fruits", "name": "Organic Bananas"},
    "f3": {"aisle": "A1", "rack": 3, "shelf": 3, "x": 2.0, "y": 10.5, "zone": "Fruits", "name": "Sweet Oranges"},
    "f4": {"aisle": "A1", "rack": 4, "shelf": 2, "x": 2.0, "y": 14.0, "zone": "Fruits", "name": "Alphonso Mangoes"},
    "f5": {"aisle": "A1", "rack": 5, "shelf": 1, "x": 2.0, "y": 17.5, "zone": "Fruits", "name": "Green Grapes"},
    "f6": {"aisle": "A1", "rack": 6, "shelf": 2, "x": 2.0, "y": 21.0, "zone": "Fruits", "name": "Pomegranates"},

    # Vegetables Zone (Aisle A2, x = 6.0m)
    "v1": {"aisle": "A2", "rack": 1, "shelf": 1, "x": 6.0, "y": 3.5, "zone": "Vegetables", "name": "Red Tomatoes"},
    "v2": {"aisle": "A2", "rack": 2, "shelf": 2, "x": 6.0, "y": 7.0, "zone": "Vegetables", "name": "Farm Potatoes"},
    "v3": {"aisle": "A2", "rack": 3, "shelf": 1, "x": 6.0, "y": 10.5, "zone": "Vegetables", "name": "Fresh Onions"},
    "v4": {"aisle": "A2", "rack": 4, "shelf": 3, "x": 6.0, "y": 14.0, "zone": "Vegetables", "name": "Crisp Spinach"},
    "v5": {"aisle": "A2", "rack": 5, "shelf": 2, "x": 6.0, "y": 17.5, "zone": "Vegetables", "name": "Green Capsicum"},
    "v6": {"aisle": "A2", "rack": 6, "shelf": 1, "x": 6.0, "y": 21.0, "zone": "Vegetables", "name": "Fresh Broccoli"},

    # Cold Dairy & Eggs Zone (Aisle A3, x = 10.0m)
    "d1": {"aisle": "A3", "rack": 1, "shelf": 1, "x": 10.0, "y": 4.0, "zone": "Cold Dairy", "name": "Toned Fresh Milk"},
    "d2": {"aisle": "A3", "rack": 2, "shelf": 2, "x": 10.0, "y": 8.0, "zone": "Cold Dairy", "name": "Natural Curd"},
    "d3": {"aisle": "A3", "rack": 3, "shelf": 3, "x": 10.0, "y": 12.0, "zone": "Cold Dairy", "name": "Salted Butter"},
    "d4": {"aisle": "A3", "rack": 4, "shelf": 2, "x": 10.0, "y": 16.0, "zone": "Cold Dairy", "name": "Fresh Paneer"},
    "d5": {"aisle": "A3", "rack": 5, "shelf": 1, "x": 10.0, "y": 20.0, "zone": "Eggs", "name": "Organic Farm Eggs"},

    # Bakery Zone (Aisle A4, x = 14.0m)
    "b1": {"aisle": "A4", "rack": 1, "shelf": 2, "x": 14.0, "y": 5.0, "zone": "Bakery", "name": "Whole Wheat Bread"},
    "b2": {"aisle": "A4", "rack": 2, "shelf": 1, "x": 14.0, "y": 10.0, "zone": "Bakery", "name": "Brown Bread"},
    "b3": {"aisle": "A4", "rack": 3, "shelf": 3, "x": 14.0, "y": 15.0, "zone": "Bakery", "name": "Butter Croissant"},

    # Snacks & Beverages (Aisle A5, x = 18.0m)
    "s1": {"aisle": "A5", "rack": 1, "shelf": 2, "x": 18.0, "y": 6.0, "zone": "Snacks", "name": "Potato Chips"},
    "s2": {"aisle": "A5", "rack": 2, "shelf": 3, "x": 18.0, "y": 12.0, "zone": "Snacks", "name": "Almond Cookies"},
    "s3": {"aisle": "A5", "rack": 3, "shelf": 1, "x": 18.0, "y": 18.0, "zone": "Beverages", "name": "Orange Juice"},
}

PACKING_STATION = {
    "sku_id": "STATION_01",
    "name": "Packing & QA Station #1",
    "x": 0.0,
    "y": 0.0,
    "aisle": "ENTRY",
    "rack": 0,
    "shelf": 0,
    "zone": "Station",
}

def euclidean_distance(p1: Dict, p2: Dict) -> float:
    """Compute Euclidean walking distance between two 2D coordinates in meters."""
    dx = p1["x"] - p2["x"]
    dy = p1["y"] - p2["y"]
    return float(np.sqrt(dx * dx + dy * dy))

def compute_tour_distance(tour: List[Dict]) -> float:
    """Calculate total walking distance (m) along a sequential tour including return to station."""
    if len(tour) < 2:
        return 0.0
    total_dist = 0.0
    for i in range(len(tour) - 1):
        total_dist += euclidean_distance(tour[i], tour[i + 1])
    # Add return from last node to packing station (first node)
    total_dist += euclidean_distance(tour[-1], tour[0])
    return float(total_dist)

def estimate_pick_time_seconds(
    distance_meters: float,
    num_items: int,
    walk_speed_mps: float = 1.2,
    pick_time_per_item_sec: float = 5.0,
) -> float:
    """
    Estimate total order assembly time: Walking Time + Item Retrieval Time.
    """
    walk_time = distance_meters / walk_speed_mps
    pick_time = num_items * pick_time_per_item_sec
    return float(walk_time + pick_time)

class WarehouseOptimizer:
    """
    Solves 2D Traveling Salesperson Problem for micro-fulfillment grocery picking.
    """
    def __init__(self, locations_map: Optional[Dict] = None):
        self.locations_map = locations_map or DEFAULT_WAREHOUSE_LOCATIONS
        self.station = PACKING_STATION

    def resolve_items(self, product_ids: List[str]) -> List[Dict]:
        """Resolve product IDs to warehouse physical coordinates."""
        unique_ids = list(dict.fromkeys(product_ids))
        items = []
        for pid in unique_ids:
            loc = self.locations_map.get(pid, {
                "aisle": "A1", "rack": 1, "shelf": 1, "x": 2.0, "y": 5.0, "zone": "General", "name": f"Product {pid}"
            })
            items.append({
                "sku_id": pid,
                "name": loc["name"],
                "aisle": loc["aisle"],
                "rack": loc["rack"],
                "shelf": loc["shelf"],
                "zone": loc["zone"],
                "x": loc["x"],
                "y": loc["y"],
            })
        return items

    def solve_naive_baseline(self, items: List[Dict]) -> Tuple[List[Dict], float]:
        """
        Baseline 1: Naive invoice order (un-optimized picking sequence).
        Picker visits items in exact arbitrary arrival order, returning to station.
        """
        if not items:
            return [self.station], 0.0
        tour = [self.station] + items
        dist = compute_tour_distance(tour)
        return tour, dist

    def solve_nearest_neighbor(self, items: List[Dict]) -> Tuple[List[Dict], float]:
        """
        Baseline 2: Greedy Nearest-Neighbor construction heuristic.
        """
        if not items:
            return [self.station], 0.0
            
        unvisited = list(items)
        current = self.station
        tour = [current]
        
        while unvisited:
            nearest_idx = 0
            shortest_dist = float("inf")
            for i, item in enumerate(unvisited):
                d = euclidean_distance(current, item)
                if d < shortest_dist:
                    shortest_dist = d
                    nearest_idx = i
            next_node = unvisited.pop(nearest_idx)
            tour.append(next_node)
            current = next_node
            
        dist = compute_tour_distance(tour)
        return tour, dist

    def solve_2opt(self, items: List[Dict], max_iterations: int = 100) -> Tuple[List[Dict], float]:
        """
        Optimization Strategy: Nearest-Neighbor initialization + 2-Opt Local Search Improvement.
        Untangles crossing tour edges until 2-opt local optimality is reached.
        """
        if not items:
            return [self.station], 0.0
        if len(items) <= 2:
            return self.solve_nearest_neighbor(items)
            
        # 1. Initialize with Nearest Neighbor tour
        init_tour, _ = self.solve_nearest_neighbor(items)
        best_tour = list(init_tour)
        best_dist = compute_tour_distance(best_tour)
        
        improved = True
        iteration = 0
        n = len(best_tour)
        
        while improved and iteration < max_iterations:
            improved = False
            iteration += 1
            
            # Test all edge reversals between index i and k (preserving station at index 0)
            for i in range(1, n - 1):
                for k in range(i + 1, n):
                    # 2-opt swap: reverse the sub-segment from i to k
                    new_tour = best_tour[:i] + list(reversed(best_tour[i:k + 1])) + best_tour[k + 1:]
                    new_dist = compute_tour_distance(new_tour)
                    
                    if new_dist < best_dist - 1e-4:
                        best_tour = new_tour
                        best_dist = new_dist
                        improved = True
                        break
                if improved:
                    break
                    
        return best_tour, best_dist

    def solve_exact_bruteforce(self, items: List[Dict]) -> Tuple[List[Dict], float]:
        """
        Exact Global Optimum solver (for N <= 8) by evaluating all N! permutations.
        """
        if not items:
            return [self.station], 0.0
        if len(items) > 8:
            raise ValueError("Exact solver is restricted to N <= 8 due to O(N!) factorial complexity.")
            
        best_tour = None
        best_dist = float("inf")
        
        for perm in itertools.permutations(items):
            candidate_tour = [self.station] + list(perm)
            d = compute_tour_distance(candidate_tour)
            if d < best_dist:
                best_dist = d
                best_tour = candidate_tour
                
        return best_tour, best_dist
