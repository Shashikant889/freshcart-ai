# FreshCart AI — Data Engineering & Dataset Documentation

This directory contains datasets used for offline machine learning model training, academic evaluation, benchmarking, and real-time inference demonstration in **FreshCart AI**.

---

## 1. Directory Structure

```
data/
├── raw/            # Unprocessed source datasets and raw JSON/SQLite dumps
├── processed/      # Feature-engineered matrices, train/test splits, time series
├── synthetic/      # Synthetic retail data extracted from freshcart.db
├── external/       # Public retail benchmark documentation (Instacart, Dunnhumby)
└── README.md       # Dataset taxonomy, schemas, distributions, and holdout splits
```

---

## 2. Dataset Taxonomy & Provenance

| Dataset File | Nature | Source | Rows | Features / Key Columns | Purpose |
|---|---|---|---|---|---|
| `data/synthetic/products.csv` | Synthetic | `freshcart.db` catalog | 31 | `id, name, emoji, category, price, unit, description, stock, rating, tags` | Product catalog with category taxonomy and tags for Content-Based filtering |
| `data/synthetic/users.csv` | Synthetic | `freshcart.db` personas | 52 | `id, name, email, password_hash, role, created_at` | Customer demographic personas and admin accounts |
| `data/synthetic/orders.csv` | Synthetic | `freshcart.db` transactions | 4,231 | `id, user_id, subtotal, delivery_fee, tax, total, status, customer_name, address, phone, payment_method, created_at` | Order transaction headers for fraud detection and RFM customer segmentation |
| `data/synthetic/order_items.csv` | Synthetic | `freshcart.db` line items | 29,131 | `id, order_id, product_id, quantity, price_at_purchase` | Basket line items for Apriori Market Basket Association analysis |
| `data/synthetic/sales_history.csv` | Synthetic | `freshcart.db` time series | 11,315 | `id, product_id, date, quantity_sold, revenue` | 365-day chronological daily sales history for time-series demand forecasting |
| `data/synthetic/user_interactions.csv` | Synthetic | `freshcart.db` activity logs | 83,760 | `id, user_id, product_id, action, rating, created_at` | Implicit & explicit interaction logs (`view`, `cart`, `purchase`, `rating`) for Collaborative Filtering |

---

## 3. Data Processing & Holdout Splits

### Module 1: Recommendation Engine
- **Preprocessing:** Implicit feedback weighting (`purchase` = 5.0, `cart` = 3.0, `rating` = $2.0 \times \frac{r}{5}$, `view` = 1.0) aggregated into a $52 \times 31$ User-Item interaction matrix.
- **Split Strategy:** Per-user interaction masking. For every user with $\ge 5$ interactions, $20\%$ of positive interactions are held out in the test matrix ($80\%$ train / $20\%$ test).
- **Ranking Evaluation:** Top-$K$ recommendations evaluated at $K=5$ and $K=10$ on Precision@K, Recall@K, F1@K, and Hit Rate@K.

### Module 2: Demand Forecasting
- **Preprocessing:** Chronological aggregation of daily sales quantities across the catalog and per category. Engineered 5 lag features (`lag_1, lag_2, lag_3, lag_7, lag_14`), rolling window statistics (7-day, 14-day, 30-day mean & std), and calendar seasonality (day of week, is_weekend, day of month, month).
- **Split Strategy:** **Strict Chronological Split** (No random shuffling). Last 30 days allocated as the out-of-sample test horizon; first 335 days allocated as the training set.
- **Evaluation:** Evaluated on Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and Mean Absolute Percentage Error (MAPE).

### Module 3: Dynamic Price Elasticity
- **Preprocessing:** Log-Log microeconomic transformation:
  $$\ln(Q_t) = \beta_0 + \beta_1 \ln(P_t) + \sum \gamma_k X_{kt} + \varepsilon_t$$
  where $\beta_1 = \frac{\partial \ln Q}{\partial \ln P}$ represents the constant price elasticity of demand $E_d$.
- **Experimental Design:** Controlled promotional pricing variation scenarios ($\pm 5\%$ to $\pm 25\%$) evaluated across 6 product categories to verify elasticity parameter recovery and revenue optimization $P^* = \frac{P_0(E_d - 1)}{2 E_d}$.
- **Evaluation:** Model goodness-of-fit ($R^2$), elasticity estimation standard errors, simulated baseline vs optimized revenue lift, and inventory pressure metrics.

### Module 4: Fraud & Transaction Anomaly Detection
- **Preprocessing:** Feature engineering on 4,231 order transactions:
  - `total`: Order monetary value in INR.
  - `total_items`, `unique_skus`, `max_item_quantity`: Basket complexity and bulk hoarding detection.
  - `order_hour`, `order_dow`, `is_night_order`: Temporal burst indicators (11 PM - 4 AM).
  - `amount_zscore_user`: Historical user spending deviation $Z = \frac{X - \mu_{user}}{\sigma_{user}}$.
  - `amount_zscore_global`: Global population spending outlier score.
- **Split Strategy:** Stratified 75% train / 25% test split with random seed $42$.
- **Evaluation:** Evaluated on Precision, Recall, F1-Score, and Receiver Operating Characteristic Area Under Curve (ROC-AUC).

---

## 4. Benchmark Dataset Alignment

To satisfy academic engineering criteria under Mumbai University, the synthetic datasets are structured in 1-to-1 schema alignment with prominent public retail benchmarks:

1. **Instacart Market Basket Analysis Dataset (Kaggle / Instacart, 2017):**
   - 3 million grocery orders, 200,000 users, 50,000 products.
   - Used as the reference taxonomy for product category hierarchies and basket co-occurrence distributions.
2. **Dunnhumby "The Complete Journey" Retail Dataset:**
   - 2-year longitudinal household purchase dataset tracking promotions, price elasticity shifts, and customer segmentation.
