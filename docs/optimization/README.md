# Operations & Mathematical Optimization Subsystem

This directory contains mathematical formulations, algorithmic specifications, and performance benchmarks for the operations and optimization engines.

## 3 Core Optimization Modules

1. **Inventory & Reorder Point (ROP) Optimization**:
   - **Inputs**: Current Stock ($S$), Lead Time in Days ($L$), Average Daily Demand ($\bar{d}$), Demand Standard Deviation ($\sigma_d$), Service Level Factor ($Z$).
   - **Safety Stock Formula**: $SS = Z \times \sigma_d \times \sqrt{L}$
   - **Reorder Point Formula**: $ROP = (\bar{d} \times L) + SS$
   - **Objective**: Minimize stockout probability while preventing costly overstock inventory holding.

2. **Dark Store Warehouse Picker Route Optimization (2D TSP)**:
   - **Inputs**: Order picking list (Product IDs), 2D Warehouse coordinates $(x, y)$ for aisles and shelf racks.
   - **Algorithm**: Euclidean Distance Matrix computation + 2-Opt Local Search Heuristic for Traveling Salesperson Problem (TSP).
   - **Objective**: Minimize total picker walking distance and order assembly time (sub-90 second target).

3. **Urban Delivery Vehicle Routing Problem (VRP)**:
   - **Inputs**: Fulfillment Hub GPS location, customer destination GPS coordinates, delivery batch size.
   - **Algorithm**: Haversine Great-Circle Distance Matrix + Nearest Neighbor Heuristic + 2-Opt Iterative Local Search.
   - **Objective**: Minimize total route distance, fleet transit time, and fuel consumption (demonstrating ~18.6% distance savings).
