# Data Lineage, Contracts & Temporal Leakage Prevention

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Standard:** Directive v2.0 Section 5 (*Data Engineering & Data Quality*)  
**Audit Date:** September 4, 2026  

---

## 1. Relational Data Domains & Scale

The system operates over a production-scale relational schema hosted in SQLite (`db/freshcart.db`, ~252 MB):

| Domain | Table Name | Record Count | Primary Key | Key Foreign Relations | Integrity Constraints |
|---|---|---|---|---|---|
| **Products** | `products` | 10,000 SKUs | `id` (TEXT) | None | Non-negative price, valid unit, JSON tag array |
| **Categories** | `categories` | 108 Sub-Depts | Derived | Indexed in `products` | 8 macro departments, 108 micro categories |
| **Users** | `users` | 150,000 Profiles | `id` (INTEGER) | None | Unique email, Bcrypt hash, Role in ('customer', 'admin') |
| **Orders** | `orders` | 65,000+ Records | `id` (TEXT UUID) | `user_id` $\to$ `users(id)` | Status in ('confirmed', 'delivered', 'cancelled') |
| **Order Items** | `order_items` | 180,000+ Lines | `id` (INTEGER) | `order_id`, `product_id` | Quantity $\ge 1$, price at purchase locked |
| **Interactions** | `user_interactions` | 350,000+ Events | `id` (INTEGER) | `user_id`, `product_id` | Action in ('view', 'cart', 'purchase', 'rate') |
| **Sales History** | `sales_history` | 36,500 Daily Aggs | `id` (INTEGER) | `product_id` $\to$ `products(id)` | ISO date format, non-negative quantity and revenue |

---

## 2. Temporal Partitioning & Leakage Prevention Protocol

In strict adherence to Directive Section 6.2 (*Leakage Prevention*), time-series forecasting and recommendation models must enforce strict temporal boundaries:

```
+------------------------------------------+--------------------+--------------------+
|            TRAINING PERIOD               | VALIDATION PERIOD  |  HOLDOUT TEST SET  |
|         Days 1 to 300 (82.2%)            | Days 301-335 (9.6%)| Days 336-365 (8.2%)|
+------------------------------------------+--------------------+--------------------+
                                           ▲                    ▲
                                     Train/Val Split       Val/Test Split
                                    (No Future Leakage)   (Strict Holdout)
```

### Mandatory Rules Enforced:
1. **No Future Lookahead:** When computing rolling 7-day or 14-day lagged sales features for day $T$, only data strictly prior to timestamp $T$ ($t < T$) is included.
2. **Scaler Isolation:** All feature scalers (`StandardScaler`, `MinMaxScaler`) are fit strictly on the Training Period (Days 1–300) and applied via `.transform()` on validation and holdout sets.
3. **Fraud Label Isolation:** Post-outcome fraud flags (such as chargeback dispute confirmations) are strictly barred from the feature set available at checkout decision time.
4. **Interaction Timestamp Sequencing:** Recommendation session candidate generation processes interaction logs chronologically; future views cannot influence earlier recommendation batches.

---

## 3. End-to-End Data Lineage Model

For every live AI decision presented in the UI or AI Command Center, the system tracks a 4-part provenance signature:

$$\text{Provenance Signature} = \langle \text{Dataset Hash}, \text{Feature Pipeline Version}, \text{Model Binary Version}, \text{Inference Timestamp} \rangle$$

```
   Raw Relational Tables (freshcart.db)
               │
               ▼ (Feature Generation Scripts: ml/python/data_loader.py)
   Feature Store / Matrix Cache
   • RFM Matrices (Recency, Frequency, Monetary)
   • 14-Day Lagged Demand Tensor Sequence
   • TF-IDF Product Content Embeddings
   • User-Item Interaction Co-occurrence Matrix
               │
               ▼ (Model Training & Serialization: ml/python/experiments/*)
   Model Artifacts (ml/python/models/*.joblib, *.pt)
               │
               ▼ (FastAPI Inference Gateway: ml/service/*)
   Live Predictions & Operational Decisions
   • Top-5 Ranked Products + Machine-Readable Reason
   • 7-Day Demand Forecast + Confidence Band
   • Dynamic Bounded Price Recommendation ($P^*$)
   • Warehouse 2D TSP Picker Order Route
```
