# Operations Research & Mathematical Optimization Methodology

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Domain:** Supply Chain Operations, Warehouse Order Assembly, and Last-Mile Fleet Logistics  
**Academic Target:** Final-Year Engineering Capstone (B.Tech CSE-AIML, Mumbai University)

---

## 1. Introduction

In high-velocity urban grocery e-commerce, profitability and customer satisfaction depend heavily on operational efficiency across three interconnected layers:
1. **Upstream Inventory & Procurement:** Maintaining stock availability while minimizing holding, ordering, and stockout penalty costs.
2. **Midstream Dark Store Order Assembly:** Minimizing picker walking travel distance to assemble baskets in sub-90 seconds.
3. **Downstream Last-Mile Delivery Routing:** Minimizing multi-vehicle fleet travel distance and dispatch times subject to vehicle capacity constraints.

This document details the mathematical foundations, objective functions, constraints, baseline strategies, and optimization algorithms implemented in FreshCart AI.

---

## 2. Module 1: Inventory & Procurement Optimization

### 2.1 Problem Formulation & Trade-offs
Retailers face a fundamental trade-off:
- Ordering in large batches reduces the number of orders placed (lower ordering costs) but increases average on-hand stock (higher holding costs).
- Ordering in small, frequent batches minimizes holding costs but incurs heavy administrative ordering fees and increases the risk of stockout during unexpected demand surges.

### 2.2 Mathematical Model

#### 1. Economic Order Quantity (EOQ)
Under constant demand rate $D$ (units/year), fixed ordering cost $S$ (₹/order), and annual holding cost $H = i \cdot C$ (₹/unit/year, where $i$ is holding rate and $C$ is unit wholesale cost), total annual inventory cost is:
$$\text{Total Cost}(Q) = \left(\frac{D}{Q}\right) S + \left(\frac{Q}{2}\right) H$$

Taking the first derivative with respect to batch size $Q$ and setting to zero:
$$\frac{d(\text{Total Cost})}{dQ} = -\frac{D S}{Q^2} + \frac{H}{2} = 0 \implies Q^* = \sqrt{\frac{2DS}{H}}$$

#### 2. Stochastic Safety Stock ($SS$)
When daily demand $d_t \sim (\bar{d}, \sigma_d^2)$ and supplier lead time $L \sim (\bar{L}, \sigma_L^2)$ are stochastic, the variance of lead-time demand is given by:
$$\sigma_{LTD}^2 = \bar{L} \sigma_d^2 + \bar{d}^2 \sigma_L^2$$

To achieve a target cycle service level $\alpha = 1 - P(\text{Stockout})$:
$$SS = Z_\alpha \cdot \sigma_{LTD} = Z_\alpha \sqrt{\bar{L} \sigma_d^2 + \bar{d}^2 \sigma_L^2}$$
Where $Z_\alpha$ is the standard normal critical value ($Z_{0.95} = 1.645$, $Z_{0.99} = 2.326$).

#### 3. Reorder Point (ROP)
Under a Continuous Review $(r, Q)$ policy, a purchase order of size $Q^*$ is triggered whenever the inventory position ($\text{On-Hand} + \text{On-Order}$) drops to or below $ROP$:
$$ROP = (\bar{d} \cdot \bar{L}) + SS$$

### 2.3 Baseline vs Optimization Comparison
- **Baseline Strategy:** Static heuristic threshold (order fixed 40 units whenever stock $\le 15$).
- **Optimized Strategy:** SKU-specific Continuous Review $(r, Q)$ with EOQ and stochastic ROP.

---

## 3. Module 2: Dark Store Warehouse Picking Optimization

### 3.1 Problem Formulation (2D TSP)
A micro-fulfillment dark store contains $N$ item locations on a 2D floor grid ($A_1 \dots A_5$ aisles, $x \in [0, 20]\text{m}, y \in [0, 25]\text{m}$). A picker starts at the Packing & QA Station $p_0 = (0, 0)$, visits all ordered item locations $\{p_1, p_2, \dots, p_N\}$, and returns to the packing station.

### 3.2 Objective Function
$$\min \sum_{i=0}^{N} \sum_{j=0}^{N} d(p_i, p_j) x_{ij}$$
Subject to:
$$\sum_{j=0, j \ne i}^{N} x_{ij} = 1 \quad \forall i \in \{0 \dots N\}$$
$$\sum_{i=0, i \ne j}^{N} x_{ij} = 1 \quad \forall j \in \{0 \dots N\}$$
$$\sum_{i \in S} \sum_{j \in S} x_{ij} \le |S| - 1 \quad \forall S \subset \{1 \dots N\}, 2 \le |S| \le N-1 \quad (\text{Subtour Elimination})$$
$$x_{ij} \in \{0, 1\}$$

Where $d(p_i, p_j) = \sqrt{(x_i - x_j)^2 + (y_i - y_j)^2}$ is Euclidean walking distance.

### 3.3 Algorithms & Heuristics
1. **Naive Sequence Baseline:** Picker walks to items in arbitrary invoice order.
2. **Nearest-Neighbor (NN) Heuristic:** At each step, choose the closest unvisited item:
   $$p_{next} = \arg\min_{p \in \text{Unvisited}} d(p_{current}, p)$$
3. **2-Opt Local Search Improvement:** Iteratively checks pairs of non-adjacent edges $(u, u+1)$ and $(v, v+1)$. If reversing the sub-tour segment $[u+1 \dots v]$ yields shorter total distance, the swap is accepted:
   $$\Delta d = [d(p_u, p_v) + d(p_{u+1}, p_{v+1})] - [d(p_u, p_{u+1}) + d(p_v, p_{v+1})]$$
   If $\Delta d < 0$, reverse tour sub-sequence from $u+1$ to $v$.
4. **Exact Brute-Force Solver:** Evaluates all $N!$ permutations for small orders ($N \le 8$) to compute the true theoretical optimality gap.

---

## 4. Module 3: Last-Mile Delivery Routing (CVRP)

### 4.1 Problem Formulation (CVRP)
Given:
- Fulfillment Depot $D_0 = (\text{lat}_0, \text{lng}_0)$
- Fleet of $K$ homogeneous delivery vehicles, each with payload capacity $C_{\text{max}}$ (kg)
- $N$ customer drop-offs, each with location $c_i = (\text{lat}_i, \text{lng}_i)$ and parcel demand weight $q_i$

### 4.2 Distance Metric (Haversine Formula)
To accurately compute surface distance between geographical coordinates:
$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$d(c_i, c_j) = 2 R \cdot \arctan2(\sqrt{a}, \sqrt{1-a})$$
Where $R = 6,371\text{ km}$ is Earth's radius, $\phi$ is latitude, and $\lambda$ is longitude.

### 4.3 Objective Function & Constraints
$$\min \sum_{k=1}^{K} \sum_{i=0}^{N} \sum_{j=0}^{N} d(c_i, c_j) x_{ijk}$$
Subject to:
$$\sum_{i=1}^{N} q_i y_{ik} \le C_{\text{max}} \quad \forall k \in \{1 \dots K\} \quad (\text{Vehicle Capacity})$$
$$\sum_{k=1}^{K} y_{ik} = 1 \quad \forall i \in \{1 \dots N\} \quad (\text{Unique Visit})$$
$$\sum_{j=1}^{N} x_{0jk} = \sum_{i=1}^{N} x_{i0k} = 1 \quad \forall k \in \{1 \dots K\} \quad (\text{Depot Round-Trip})$$

### 4.4 Optimization Strategy: Clarke-Wright Savings + 2-Opt
1. **Savings Calculation:** For all customer pairs $(i, j)$, compute route combining savings:
   $$S(i, j) = d(D_0, i) + d(D_0, j) - d(i, j)$$
2. **Greedy Merging:** Sort savings descending and merge individual vehicle routes $(D_0 \to i \to D_0)$ and $(D_0 \to j \to D_0)$ whenever combined payload $\sum q \le C_{\text{max}}$.
3. **Intra-Route 2-Opt Smoothing:** Apply 2-Opt local search to optimize the visiting sequence within each vehicle's cluster.

---

## 5. Summary of Evaluation Metrics

| Domain | Primary Metrics | Objective |
|---|---|---|
| **Inventory** | Total Cost (₹), Holding Cost, Ordering Cost, Stockout Days, Fill Rate (%) | Minimize total operating cost while maintaining $\ge 95\%$ service level |
| **Warehouse** | Total Walking Distance (m), Assembly Time (s), % Distance Reduction | Minimize picker travel distance and assembly bottlenecks |
| **Delivery** | Total Fleet Distance (km), Vehicles Required, Fleet Capacity Utilization (%) | Minimize fleet transit distance and maximize payload density |

---

## 6. Assumptions & Limitations

1. **Synthetic Operational Parameters:** Wholesale costs (65% of MRP), holding rate (20%/year), and ordering costs (₹350/PO) are calibrated to urban Indian grocery standards.
2. **2D Aisle Simplification:** The dark store model uses Euclidean walking paths; complex physical barrier routing in 3D multi-tier mezzanines would require grid graphs (A* / Dijkstra).
3. **Deterministic Capacity vs Dynamic Traffic:** CVRP models fixed vehicle capacities; live dispatch in production can incorporate dynamic Google Maps traffic matrices.
