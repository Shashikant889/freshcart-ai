# FreshCart AI — Synthetic Dataset & Schema Documentation

This document describes the data architecture, synthetic retail datasets, entity-relationship schemas, and deterministic generation pipelines utilized by **FreshCart AI**.

> **Important Privacy Notice:** All customer accounts, personal names, phone numbers, delivery addresses, and transactional order histories are **100% synthetically generated** via deterministic pseudo-random pipelines. No Personally Identifiable Information (PII) or real consumer data is stored or processed.

---

## 1. Dataset Scale & High-Level Summary

| Entity / Dimension | Record Count | Description | Storage Format |
|---|---|---|---|
| **Grocery Categories** | **108 Categories** | Hierarchical taxonomy mapped into 8 core departments (Produce, Dairy, Snacks, Drinks, Staples, Household, Personal Care, Frozen) | `data/categories.json` & SQLite |
| **Grocery Products (SKUs)** | **10,000 Products** | Hyper-local grocery inventory with selling price (INR), MRP, unit size, aisle-rack coordinates, Nutri-Score, and stock | SQLite `products` table |
| **Synthetic Customers** | **150,000 Users** | Synthetic customer profiles with localized Bangalore delivery coordinates, phone numbers, and dietary preferences | SQLite `users` table |
| **Historical Orders** | **65,001 Orders** | Completed delivery orders spanning 12 calendar months with itemized line items, rider tips, and payment methods | SQLite `orders` table |
| **Order Line Items** | **180,000+ Items** | Individual item linkages with unit selling price and quantity | SQLite `order_items` table |
| **Daily Sales History** | **11,316 Records** | Daily aggregated SKU sales records used to train time-series SARIMAX forecasting models | `data/synthetic/sales_history.csv` & SQLite |
| **User Interactions** | **83,761 Events** | Implicit and explicit interaction logs (view, cart add, purchase) powering hybrid recommendations | `data/synthetic/user_interactions.csv` & SQLite |
| **Active SQLite Database** | **~241 MB** | Complete local relational database file (`db/freshcart.db`) | SQLite WASM binary |

---

## 2. Relational Database Schema

The database consists of 7 normalized relational tables defined in [`db/schema.sql`](../db/schema.sql):

```
┌──────────────┐         ┌──────────────┐         ┌───────────────────┐
│    users     │1       *│    orders    │1       *│    order_items    │
│──────────────│─────────│──────────────│─────────│───────────────────│
│ id (PK)      │         │ id (PK)      │         │ id (PK)           │
│ name         │         │ user_id (FK) │         │ order_id (FK)     │
│ email        │         │ total_amount │         │ product_id (FK)   │
│ password_hash│         │ status       │         │ quantity          │
│ role         │         │ created_at   │         │ price             │
└──────────────┘         └──────────────┘         └───────────────────┘
                                                            │
                                                            │ *
                                                            │ 1
┌───────────────────┐                             ┌───────────────────┐
│ user_interactions │                             │     products      │
│───────────────────│                             │───────────────────│
│ id (PK)           │                             │ id (PK)           │
│ user_id (FK)      │                             │ name              │
│ product_id (FK)   │                             │ category          │
│ interaction_type  │                             │ price (INR)       │
│ rating / weight   │                             │ stock             │
│ timestamp         │                             │ dietary_tags      │
└───────────────────┘                             │ rack_coordinate   │
                                                  └───────────────────┘
```

### Table Definitions:
1. **`users`**: Contains credentials (salted bcrypt hashes), customer role (`customer` or `admin`), default delivery address, and preferences.
2. **`products`**: Catalog inventory storing SKU title, category, department, selling price, MRP, unit size, available stock, aisle-rack coordinate $(x, y)$, and dietary tags.
3. **`orders`**: Transaction records containing customer foreign key, subtotal, tax, delivery fee, tip, payment method, order status, and timestamp.
4. **`order_items`**: Line items linking each order to purchased products with quantity and price snapshot.
5. **`sales_history`**: Chronological daily sales aggregates per SKU used for demand forecasting.
6. **`user_interactions`**: User activity stream recording item views (`weight: 1`), cart additions (`weight: 3`), and completed purchases (`weight: 5`).
7. **`fraud_logs`**: Anomaly detection audit table recording calculated $Z$-scores, order velocities, and risk classifications.

---

## 3. Synthetic Generation Methodology

All synthetic data is generated via deterministic pseudo-random number generators (PRNG) seeded with seed `42` to ensure **100% reproducibility**:

- **Indian Grocery Product Synthesis (`scripts/generate-products.js`):**
  Combines authentic Indian grocery brands (Amul, Aashirvaad, Tata, Mother Dairy, Haldiram's, Britannia, Organic India) with standardized grocery nouns and modifiers. Pricing follows realistic quick-commerce market distributions.
- **Customer Profile Synthesis (`scripts/generate-users.js`):**
  Synthesizes realistic full names, phone numbers (`+91 98XXXXXXXX`), and delivery locations centered around Bangalore quick-commerce dark store corridors (Indiranagar, Koramangala, HSR Layout, Whitefield).
- **Retail History Synthesis (`scripts/generate-retail-history.js`):**
  Applies realistic seasonal patterns (weekend surges, holiday spikes, diurnal shopping cycles) to simulate 365 days of retail history.

---

## 4. How to Regenerate the Dataset Locally

If you clone the repository without the large binary database file, you can regenerate the entire 10,000-product / 150,000-user database locally in approximately 45 seconds:

```bash
# 1. Option A: Full Large-Scale Pipeline (10,000 Products, 108 Categories, 150,000 Users)
node scripts/generate-all-data.js

# 2. Option B: Fast Lightweight Seed (31 Core Products for quick development)
npm run seed

# 3. Validate database integrity, foreign keys, and row counts
node scripts/validate-dataset.js
```

---

## 5. Version Control & GitHub Exclusion Policy

Due to Git file size limitations:

1. **Excluded from standard Git commits:**
   - The active SQLite database binary (`db/freshcart.db` — ~241 MB) exceeds GitHub's 100 MB hard limit.
   - Backup databases (`db/freshcart.db.baseline.bak` — 9.76 MB).
   - SQLite write-ahead logs and journals (`*.db-wal`, `*.db-shm`, `*.db-journal`).
2. **Included in Git commits:**
   - Deterministic dataset generators (`scripts/generate-*.js`).
   - Category taxonomy manifest ([`data/categories.json`](../data/categories.json)).
   - Product core definition ([`data/products.js`](../data/products.js)).
   - Compact benchmark synthetic CSV datasets ([`data/synthetic/*.csv`](../data/synthetic)).
   - Relational database schema ([`db/schema.sql`](../db/schema.sql)).

This guarantees that any developer can clone the lightweight repository and recreate the complete large-scale database locally with a single command.
