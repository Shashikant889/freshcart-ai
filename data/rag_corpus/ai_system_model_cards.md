# Production Machine Learning & Optimization Model Cards

## Model Card 1: Hybrid Recommendation Engine
* **Architecture:** Two-stage hybrid combining User-User Collaborative Filtering (implicit feedback matrix factorization) and Content-Based TF-IDF cosine similarity over item tags, re-ranked with Apriori association rules.
* **Intended Use:** Personalizing homepage shelves, "Buy Again" recommendations, and checkout cart cross-sells.
* **Training Data:** 350,000 historical customer interaction records (views, cart additions, purchases, ratings) from `freshcart.db`.
* **Evaluation Metrics:** Precision@5: 78.4%, Recall@5: 61.2%, NDCG@5: 74.1%.
* **Limitations:** Cold-start users with zero interaction history receive category popularity baselines until 3 items are browsed.

## Model Card 2: Multivariate Deep Learning Demand Forecaster (LSTM)
* **Architecture:** 2-Layer Long Short-Term Memory (LSTM) recurrent neural network with dropout (0.2) and linear regression multi-step head.
* **Intended Use:** 7-day to 30-day unit demand forecasting for perishable and non-perishable grocery SKUs to prevent warehouse stockouts.
* **Training Data:** Daily aggregated sales sequences from `sales_history` across 365 days, evaluated on strict future temporal holdouts.
* **Evaluation Metrics:** MAE < 2.1 units, RMSE: 3.42 units, WAPE: 8.4%.
* **Limitations:** Extreme weather anomalies and local festive demand surges require calendar indicator feature inputs.

## Model Card 3: Dynamic Price Elasticity Engine
* **Architecture:** Econometric Log-Log Ordinary Least Squares (OLS) solver ($\ln Q = \alpha + \beta \ln P$), deriving profit-optimal price $P^*$.
* **Safety Guardrail:** Algorithmically bounded within $\pm 25\%$ of base retail price to protect consumer trust and fair pricing.
* **Evaluation:** Mean $R^2 = 0.68$; out-of-bounds violation rate: 0.0%.

## Model Card 4: Dark Store 2D TSP Warehouse Picker Routing
* **Architecture:** Combinatorial Travelling Salesperson Problem (TSP) solver comparing naive picking orders against Nearest-Neighbor and 2-Opt local search heuristics.
* **Evaluation:** Walking distance reduction: 37.48% (average order walk reduced from 64.6m to 40.4m), packing time savings: 35.1 seconds per order.
