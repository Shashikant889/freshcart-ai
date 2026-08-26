# FreshCart AI: Final Master List of System Figures & Diagrams

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Department:** Computer Science & Engineering (AIML), A.P. Shah Institute of Technology  
**Affiliated University:** University of Mumbai (Academic Year 2025–2026)  

---

## 1. Master List of System Figures

| Fig. No. | Exact Figure Title | Diagram Type | Implemented Source / Evidence Reference | Target Chapter |
|---|---|---|---|---|
| **Fig 5.1** | High-Level System Architecture of FreshCart AI | Tiered System Architecture | [`server.js`](file:///c:/Users/shash/demo1/server.js), [`ml/service/app.py`](file:///c:/Users/shash/demo1/ml/service/app.py) | Chapter 5.2 |
| **Fig 5.2** | Two-Tier AI Integration & Fallback Circuit Architecture | Microservice Integration Architecture | [`services/ai-client.js`](file:///c:/Users/shash/demo1/services/ai-client.js), [`docs/integration/`](file:///c:/Users/shash/demo1/docs/integration/) | Chapter 5.16 |
| **Fig 5.3** | Context Data Flow Diagram (DFD Level 0) | Structured Analysis Diagram | [`routes/`](file:///c:/Users/shash/demo1/routes/), [`public/`](file:///c:/Users/shash/demo1/public/) | Chapter 5.2 |
| **Fig 5.4** | Functional Data Flow Diagram (DFD Level 1) | Structured Analysis Diagram | [`routes/orders.js`](file:///c:/Users/shash/demo1/routes/orders.js), [`routes/dispatch.js`](file:///c:/Users/shash/demo1/routes/dispatch.js) | Chapter 5.2 |
| **Fig 5.5** | Master Use Case Diagram (Customer & Admin Roles) | UML Behavioral Diagram | [`public/index.html`](file:///c:/Users/shash/demo1/public/index.html), [`public/admin.html`](file:///c:/Users/shash/demo1/public/admin.html) | Chapter 5.3 & 5.4 |
| **Fig 5.6** | Activity Diagram — Customer Browsing, Cart & Checkout | UML Activity Diagram | [`public/js/app.js`](file:///c:/Users/shash/demo1/public/js/app.js), [`routes/cart.js`](file:///c:/Users/shash/demo1/routes/cart.js) | Chapter 5.7 |
| **Fig 5.7** | Activity Diagram — Autonomous Inventory Replenishment Loop | UML Activity Diagram | [`ml/python/optimization/inventory_optimization.py`](file:///c:/Users/shash/demo1/ml/python/optimization/inventory_optimization.py) | Chapter 5.12 |
| **Fig 5.8** | Sequence Diagram — Atomic Order Checkout & Stock Decrement | UML Interaction Diagram | [`routes/orders.js`](file:///c:/Users/shash/demo1/routes/orders.js), [`db/database.js`](file:///c:/Users/shash/demo1/db/database.js) | Chapter 5.7 |
| **Fig 5.9** | Sequence Diagram — Personalized Top-$K$ Recommendation Retrieval | UML Interaction Diagram | [`services/ai-client.js`](file:///c:/Users/shash/demo1/services/ai-client.js), [`ml/service/recommendation_service.py`](file:///c:/Users/shash/demo1/ml/service/recommendation_service.py) | Chapter 5.8 |
| **Fig 5.10** | Sequence Diagram — Real-Time Transaction Fraud Risk Scoring | UML Interaction Diagram | [`routes/orders.js`](file:///c:/Users/shash/demo1/routes/orders.js), [`ml/service/fraud_service.py`](file:///c:/Users/shash/demo1/ml/service/fraud_service.py) | Chapter 5.11 |
| **Fig 5.11** | Sequence Diagram — 30-Day SKU Demand Forecasting & Stock Alert | UML Interaction Diagram | [`routes/analytics.js`](file:///c:/Users/shash/demo1/routes/analytics.js), [`ml/service/demand_service.py`](file:///c:/Users/shash/demo1/ml/service/demand_service.py) | Chapter 5.9 |
| **Fig 5.12** | Entity-Relationship (ER) Diagram (Relational SQLite Schema) | Data Architecture Diagram | `schema.sql`, [`db/database.js`](file:///c:/Users/shash/demo1/db/database.js) | Chapter 5.18 |
| **Fig 5.13** | Hybrid Recommendation Engine Workflow Pipeline | Machine Learning Pipeline | [`ml/python/experiments/recommendation_experiment.py`](file:///c:/Users/shash/demo1/ml/python/experiments/recommendation_experiment.py) | Chapter 5.8 |
| **Fig 5.14** | Recursive Time-Series SARIMAX Forecasting Workflow | Machine Learning Pipeline | [`ml/python/experiments/demand_forecasting_experiment.py`](file:///c:/Users/shash/demo1/ml/python/experiments/demand_forecasting_experiment.py) | Chapter 5.9 |
| **Fig 5.15** | Econometric Dynamic Pricing & Elasticity Optimization Workflow | Machine Learning Pipeline | [`ml/python/experiments/dynamic_pricing_experiment.py`](file:///c:/Users/shash/demo1/ml/python/experiments/dynamic_pricing_experiment.py) | Chapter 5.10 |
| **Fig 5.16** | Cost-Sensitive Transaction Fraud Detection Pipeline | Machine Learning Pipeline | [`ml/python/experiments/fraud_detection_experiment.py`](file:///c:/Users/shash/demo1/ml/python/experiments/fraud_detection_experiment.py) | Chapter 5.11 |
| **Fig 5.17** | Continuous Review $(r, Q)$ Inventory Policy State Machine | Operations Research Pipeline | [`ml/python/optimization/inventory_optimization.py`](file:///c:/Users/shash/demo1/ml/python/optimization/inventory_optimization.py) | Chapter 5.12 |
| **Fig 5.18** | Dark Store 2D TSP Picker Walk Path Optimization Workflow | Operations Research Pipeline | [`ml/python/optimization/warehouse_optimization.py`](file:///c:/Users/shash/demo1/ml/python/optimization/warehouse_optimization.py) | Chapter 5.13 |
| **Fig 5.19** | Capacitated Vehicle Routing Problem (CVRP) Dispatch Workflow | Operations Research Pipeline | [`ml/python/optimization/delivery_optimization.py`](file:///c:/Users/shash/demo1/ml/python/optimization/delivery_optimization.py) | Chapter 5.14 |
| **Fig 5.20** | Python FastAPI In-Memory Singleton Model Registry Architecture | Microservice Architecture | [`ml/service/app.py`](file:///c:/Users/shash/demo1/ml/service/app.py) | Chapter 5.15 |
| **Fig 5.21** | Node.js AI Gateway Circuit Breaker & Fallback Hierarchy | Fault Tolerance Architecture | [`services/ai-client.js`](file:///c:/Users/shash/demo1/services/ai-client.js), [`ml/*.js`](file:///c:/Users/shash/demo1/ml/) | Chapter 5.17 |
| **Fig 7.1** | Out-of-Sample Demand Forecasting: Actual vs. Predicted Units | Empirical Evaluation Plot | [`ml/python/reports/demand_forecast_plot.png`](file:///c:/Users/shash/demo1/ml/python/reports/demand_forecast_plot.png) | Chapter 7.2 |
| **Fig 7.2** | Price Elasticity of Demand Curves across Product Categories | Empirical Evaluation Plot | [`ml/python/reports/price_elasticity_plot.png`](file:///c:/Users/shash/demo1/ml/python/reports/price_elasticity_plot.png) | Chapter 7.3 |
| **Fig 7.3** | Fraud Anomaly Detection: ROC Curve and Precision-Recall Tradeoff | Empirical Evaluation Plot | [`ml/python/reports/fraud_roc_plot.png`](file:///c:/Users/shash/demo1/ml/python/reports/fraud_roc_plot.png) | Chapter 7.4 |
| **Fig 7.4** | Inventory Holding, Ordering & Stockout Cost Reduction Comparison | Optimization Benchmark Plot | [`ml/python/reports/inventory_cost_plot.png`](file:///c:/Users/shash/demo1/ml/python/reports/inventory_cost_plot.png) | Chapter 7.5 |
| **Fig 7.5** | Dark Store Picker Travel Distance Reduction Comparison | Optimization Benchmark Plot | [`ml/python/reports/warehouse_distance_plot.png`](file:///c:/Users/shash/demo1/ml/python/reports/warehouse_distance_plot.png) | Chapter 7.6 |
| **Fig 7.6** | Last-Mile Delivery Fleet Distance & Vehicle Utilization Comparison | Optimization Benchmark Plot | [`ml/python/reports/delivery_routing_plot.png`](file:///c:/Users/shash/demo1/ml/python/reports/delivery_routing_plot.png) | Chapter 7.7 |
| **Fig 7.7** | End-to-End API Gateway & Solver Latency Benchmarks (p95 ms) | System Performance Plot | [`docs/testing/PERFORMANCE_REPORT.md`](file:///c:/Users/shash/demo1/docs/testing/PERFORMANCE_REPORT.md) | Chapter 7.8 |
