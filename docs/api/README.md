# REST API Specifications & Contracts

This directory contains endpoint definitions, request/response schemas, authentication protocols, and error contracts for the FreshCart AI backend.

## API Endpoint Matrix

| Domain | Base Path | Key Methods | Description |
|---|---|---|---|
| **Authentication** | `/api/auth` | `POST /register`, `POST /login`, `GET /me` | JWT token issuance, bcrypt verification, role claims |
| **Catalog** | `/api/products` | `GET /`, `GET /:id`, `GET /categories` | Product listing, category filter, sorting |
| **Search** | `/api/search` | `GET /?q=...` | NLP TF-IDF search, typo correction, bilingual mapping |
| **Cart** | `/api/cart` | `GET /`, `POST /add`, `PUT /update`, `DELETE /remove` | User & guest cart management, INR delivery logic |
| **Orders** | `/api/orders` | `POST /`, `GET /`, `GET /:id`, `GET /track/:id` | ACID transactional checkout, fraud scoring, order lifecycle |
| **Recommendations**| `/api/recommendations`| `GET /personal`, `GET /similar/:id`, `GET /frequently-bought-together/:id` | Collaborative, Content, Hybrid, and Apriori rules |
| **Analytics & ML** | `/api/analytics` | `GET /demand-forecast/:id`, `GET /segments`, `GET /stock-alerts`, `GET /ml-metrics` | Time-series forecasting, RFM K-Means, ML metrics |
| **Dynamic Pricing** | `/api/pricing` | `GET /elasticity/:id`, `GET /simulate/:id`, `GET /all` | Price elasticity coefficients, $P^*$ simulation |
| **VRP Dispatch** | `/api/dispatch` | `POST /optimize-route` | Urban delivery vehicle route optimization |
| **Admin Operations** | `/api/admin` | `GET /dashboard`, `GET /products`, `PUT /products/:id`, `GET /orders` | Executive KPIs, inventory management, orders feed |
| **Nutrition AI** | `/api/nutrition` | `POST /analyze-cart`, `GET /product/:id` | Nutri-Score calculation, macro breakdown, allergen checks |
| **FreshWallet** | `/api/wallet` | `GET /balance`, `POST /topup`, `POST /pay-split` | Wallet credits, cashback, split payment gateway |
| **Group Buying** | `/api/group-orders` | `POST /create`, `GET /lobbies`, `POST /:id/join` | Community pool lobbies with tier discounts |
| **Supplier Ops** | `/api/supplier` | `GET /reorder-alerts`, `POST /warehouse-picker-route` | Automated ROP safety stock, warehouse TSP routes |
| **Vision AI** | `/api/visual` | `POST /search-by-image`, `POST /fridge-scan` | Multimodal fridge depletion scanner & visual similarity |
| **AI Assistant** | `/api/assistant` | `POST /chat` | Recipe parsing to in-stock ingredient cart bundles |
