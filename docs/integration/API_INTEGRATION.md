# AI-Driven Intelligent Grocery Retail System: API Integration Guide & Schema Reference

This document details the RESTful API contracts connecting the Node.js application server with the Python FastAPI AI & Optimization microservice.

---

## 1. Service Health & Model Status

### `GET /health`
Returns the operational health of the inference microservice and status of all in-memory model binaries.

#### Response Example
```json
{
  "status": "healthy",
  "service": "AI-Driven Intelligent Grocery Retail Inference Service",
  "version": "2.0.0",
  "models_loaded": {
    "recommendation": true,
    "demand_forecasting": true,
    "pricing": true,
    "fraud_detection": true,
    "inventory_optimizer": true,
    "warehouse_optimizer": true,
    "delivery_router": true
  },
  "timestamp": "2026-08-26T12:00:00.000Z"
}
```

---

## 2. Machine Learning Inference APIs

### `POST /predict/recommendations`
Generates personalized Top-$K$ recommendations using the trained **Hybrid Collaborative + Content-Based Ensemble**.

#### Request Payload
```json
{
  "user_id": 1,
  "cart_items": ["f1", "d2"],
  "top_k": 5,
  "category_filter": null
}
```

#### Response Example
```json
{
  "success": true,
  "model_used": "Hybrid Ensemble (CF + CB)",
  "version": "2.0",
  "recommendations": [
    {
      "product_id": "f1",
      "name": "Fresh Organic Apples",
      "category": "Fruits",
      "price": 120.0,
      "score": 0.95,
      "reason": "Frequently bought by shoppers like you"
    },
    {
      "product_id": "d1",
      "name": "Farm Fresh Milk",
      "category": "Dairy",
      "price": 60.0,
      "score": 0.90,
      "reason": "Popular in your favorite categories"
    }
  ],
  "is_fallback": false,
  "metadata": {
    "total_recommended": 2,
    "requested_k": 5
  }
}
```

---

### `POST /predict/demand`
Generates multi-step future demand forecasts using the trained **SARIMAX Time-Series Model**.

#### Request Payload
```json
{
  "product_id": "f1",
  "horizon_days": 7
}
```

#### Response Example
```json
{
  "success": true,
  "model_used": "SARIMAX(1,1,1)x(1,0,1)_7",
  "horizon_days": 7,
  "total_forecasted_units": 1473.4,
  "daily_forecasts": [
    { "day_offset": 1, "predicted_quantity": 210.5 },
    { "day_offset": 2, "predicted_quantity": 215.2 },
    { "day_offset": 3, "predicted_quantity": 198.4 },
    { "day_offset": 4, "predicted_quantity": 204.1 },
    { "day_offset": 5, "predicted_quantity": 222.0 },
    { "day_offset": 6, "predicted_quantity": 235.8 },
    { "day_offset": 7, "predicted_quantity": 187.4 }
  ],
  "is_fallback": false,
  "metadata": {
    "rmse": 5.83,
    "mape": 2.50
  }
}
```

---

### `POST /predict/price`
Recommends optimal dynamic price $P^*$ based on econometric **Log-Log Price Elasticity of Demand ($E_d$)** under business safety bounds.

#### Request Payload
```json
{
  "product_id": "f1",
  "category": "Fruits",
  "base_price": 120.0,
  "cost": 72.0,
  "min_price_ratio": 0.75,
  "max_price_ratio": 1.25
}
```

#### Response Example
```json
{
  "success": true,
  "product_id": "f1",
  "category": "Fruits",
  "base_price": 120.0,
  "recommended_price": 150.0,
  "price_change_pct": 25.0,
  "price_elasticity": -0.058,
  "demand_type": "Inelastic (|Ed| <= 1)",
  "demand_multiplier": 0.987,
  "model_used": "Log-Log OLS Elasticity Optimizer",
  "disclaimer": "SIMULATED / MODEL-BASED ESTIMATE under Constant Elasticity of Demand (CED)",
  "is_fallback": false
}
```

---

### `POST /predict/fraud`
Scores checkout transactions for fraud risk using the trained **Random Forest Anomaly Classifier**.

#### Request Payload
```json
{
  "order_id": "ORD-A1B2C3D4",
  "user_id": 1,
  "total": 4500.0,
  "total_items": 15,
  "unique_skus": 10,
  "max_item_quantity": 3,
  "order_hour": 15,
  "order_dow": 2,
  "user_mean_spend": 800.0,
  "user_velocity_24h": 3,
  "delivery_distance_km": 6.5
}
```

#### Response Example
```json
{
  "success": true,
  "order_id": "ORD-A1B2C3D4",
  "risk_score": 42.0,
  "risk_level": "MEDIUM",
  "is_anomaly": false,
  "contributing_factors": [
    "High order total vs user history (5.6x normal)"
  ],
  "model_used": "Random Forest Classifier",
  "is_fallback": false
}
```

---

## 3. Operations Research & Optimization APIs

### `POST /optimize/inventory`
Computes **Economic Order Quantity ($Q^*$)**, **Stochastic Safety Stock ($SS$)**, and **Reorder Point ($ROP$)**.

#### Request Payload
```json
{
  "sku_id": "f1",
  "name": "Fresh Organic Apples",
  "unit_price": 120.0,
  "avg_daily_demand": 8.5,
  "std_daily_demand": 2.4,
  "lead_time_days": 2.0,
  "current_stock": 10,
  "service_level": 0.95
}
```

#### Response Example
```json
{
  "success": true,
  "sku_id": "f1",
  "name": "Fresh Organic Apples",
  "economic_order_quantity": 369,
  "safety_stock": 6,
  "reorder_point": 26,
  "current_stock": 10,
  "needs_reorder": true,
  "suggested_order_quantity": 369,
  "estimated_reorder_cost": 28782.0,
  "service_level": 0.95,
  "model_used": "Continuous Review (r, Q) with EOQ & Stochastic Safety Stock",
  "is_fallback": false
}
```

---

### `POST /optimize/warehouse`
Calculates the optimal picker walk path on the 2D dark store layout using **2-Opt Traveling Salesperson Problem (TSP)**.

#### Request Payload
```json
{
  "product_ids": ["f1", "d1", "b1", "v2", "s1"]
}
```

#### Response Example
```json
{
  "success": true,
  "total_items": 5,
  "total_walking_distance_meters": 40.4,
  "estimated_pick_time_seconds": 58.7,
  "picking_sequence": [
    { "step": 1, "product_id": "f1", "name": "Fresh Organic Apples", "aisle": "A1", "rack": 1, "shelf": 2, "zone": "Fruits", "x": 2.0, "y": 3.5 },
    { "step": 2, "product_id": "v2", "name": "Organic Tomatoes", "aisle": "A2", "rack": 2, "shelf": 2, "zone": "Vegetables", "x": 6.0, "y": 7.0 },
    { "step": 3, "product_id": "d1", "name": "Farm Fresh Milk", "aisle": "A3", "rack": 1, "shelf": 1, "zone": "Cold Dairy", "x": 10.0, "y": 4.0 },
    { "step": 4, "product_id": "b1", "name": "Sourdough Bread", "aisle": "A4", "rack": 1, "shelf": 2, "zone": "Bakery", "x": 14.0, "y": 5.0 },
    { "step": 5, "product_id": "s1", "name": "Roasted Cashews", "aisle": "A6", "rack": 1, "shelf": 1, "zone": "Dry Essentials", "x": 18.0, "y": 4.0 }
  ],
  "algorithm_used": "2D TSP Nearest-Neighbor + 2-Opt Local Search",
  "is_fallback": false
}
```

---

### `POST /optimize/delivery`
Solves the **Capacitated Vehicle Routing Problem (CVRP)** using the Clarke-Wright Savings heuristic and intra-route 2-Opt smoothing.

#### Request Payload
```json
{
  "vehicle_capacity_kg": 25.0,
  "orders": [
    { "id": "ORD_01", "name": "Customer 1", "lat": 19.080, "lng": 72.880, "demand": 3.0 },
    { "id": "ORD_02", "name": "Customer 2", "lat": 19.090, "lng": 72.890, "demand": 4.5 },
    { "id": "ORD_03", "name": "Customer 3", "lat": 19.070, "lng": 72.860, "demand": 2.0 }
  ]
}
```

#### Response Example
```json
{
  "success": true,
  "total_orders": 3,
  "num_vehicles_used": 1,
  "total_fleet_distance_km": 7.87,
  "total_travel_time_hours": 0.55,
  "avg_route_distance_km": 7.87,
  "fleet_capacity_utilization_pct": 38.0,
  "routes": [
    {
      "vehicle_id": "VEH-01",
      "num_stops": 3,
      "route_distance_km": 7.87,
      "payload_kg": 9.5,
      "capacity_utilization_pct": 38.0,
      "estimated_time_hours": 0.55,
      "stops": [
        { "id": "ORD_03", "name": "Customer 3", "lat": 19.070, "lng": 72.860, "demand": 2.0 },
        { "id": "ORD_01", "name": "Customer 1", "lat": 19.080, "lng": 72.880, "demand": 3.0 },
        { "id": "ORD_02", "name": "Customer 2", "lat": 19.090, "lng": 72.890, "demand": 4.5 }
      ]
    }
  ],
  "algorithm_used": "Clarke-Wright Savings Heuristic + Intra-Route 2-Opt CVRP",
  "is_fallback": false
}
```
