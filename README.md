# 🌿 FreshCart AI — Intelligent Grocery E-Commerce & Recommendation System
> **A Full-Stack, AI-Native Grocery E-Commerce Platform for B.Tech CSE-AIML Final Year Major Project**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-freshcart--ai.onrender.com-brightgreen?style=for-the-badge&logo=render)](https://freshcart-ai.onrender.com/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Shashikant%20Shukla-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/shashikant-shukla-935688331/)
[![GitHub](https://img.shields.io/badge/GitHub-Shashikant889-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Shashikant889)

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Backend-Express.js-blue.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20WASM-orange.svg)](https://sql.js.org/)
[![Machine Learning](https://img.shields.io/badge/ML%20Models-10%20Engines%20from%20Scratch-purple.svg)]()
[![Tests](https://img.shields.io/badge/Multi--Tier%20Tests-74%2F74%20Passing%20(100%25)-brightgreen.svg)]()
[![Security](https://img.shields.io/badge/Security-OWASP%20Audited%20%26%20Verified-blue.svg)]()
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)]()

---

### 🌐 Live Production URL
- **Storefront**: [https://freshcart-ai.onrender.com/](https://freshcart-ai.onrender.com/)
- **Admin & AI Dashboard**: [https://freshcart-ai.onrender.com/admin](https://freshcart-ai.onrender.com/admin)
- **GitHub Repository**: [https://github.com/Shashikant889/freshcart-ai](https://github.com/Shashikant889/freshcart-ai)

---

## 📖 Overview

**FreshCart AI** is a comprehensive, production-ready grocery e-commerce and retail intelligence application. Unlike basic CRUD shopping carts, FreshCart AI is powered by **10 genuine machine learning, fintech, and mathematical optimization engines** built directly into the runtime:

1. 🎯 **Hybrid Recommendation Engine**: Blends User-User Collaborative Filtering, Content-Based Cosine Similarity, and Apriori Association Rules (*Frequently Bought Together*).
2. 📈 **Time-Series Demand Forecasting**: Fits Ordinary Least Squares (OLS) Linear Regression with 7-Day Moving Averages & Day-of-Week Seasonality to predict future unit demand and trigger stockout warnings.
3. 👥 **Unsupervised Customer Segmentation**: Implements custom K-Means Clustering ($K=4$) from scratch using RFM (Recency, Frequency, Monetary) metrics, verified via the WCSS Elbow Curve.
4. 🤖 **Conversational AI Assistant (FreshBot)**: Natural language recipe-to-cart solver that maps dishes (*"Mango Lassi"*, *"High-Protein Breakfast"*) into in-stock ingredient bundles with 1-click cart addition.
5. 🚨 **Real-Time Transaction Fraud AI**: Statistical Z-Score spend anomaly detection ($Z > 3\sigma$) and rolling 10-minute velocity checks to flag scalping and abnormal orders.
6. 📉 **Dynamic Pricing & Price Elasticity Simulator**: Simulates microeconomic Price Elasticity of Demand ($E_d = \frac{\% \Delta Q}{\% \Delta P}$) and computes the revenue-maximizing price ($P^*$).
7. 🚚 **Vehicle Routing Problem (VRP) Dispatch Optimizer**: 2-Opt Local Search heuristic with Haversine distance matrix solving multi-stop urban delivery dispatch ($18.6\%$ fuel/distance savings).
8. 🥗 **Nutri-Score & Allergen AI Advisor**: Computes basket macro/micronutrient breakdown, assigns Nutri-Score (A–E) with French FSA formulas, and suggests allergen-safe swaps (Lactose/Gluten-free).
9. ⚡ **Expiry-Aware Markdown & Flash Sale AI**: Decays perishable pricing dynamically as shelf-life shortens, preventing food waste while boosting lightning clearance conversions.
10. 🏭 **Dark Store Warehouse Picker 2D TSP Optimizer**: Generates 2D aisle-rack Euclidean distance matrices with 2-Opt local search to assemble orders in under 90 seconds.

---

## 👥 5-Student Division of Responsibilities

```
                      ┌────────────────────────────────────────────────────────┐
                      │    FreshCart AI: Intelligent Grocery E-Commerce        │
                      └──────────────────────────┬─────────────────────────────┘
                                                 │
      ┌──────────────────┬───────────────────────┼───────────────────────┬──────────────────┐
      │                  │                       │                       │                  │
┌─────▼───────┐    ┌─────▼───────┐         ┌─────▼───────┐         ┌─────▼───────┐    ┌─────▼───────┐
│  Student 1  │    │  Student 2  │         │  Student 3  │         │  Student 4  │    │  Student 5  │
│ Architecture│    │ Backend &   │         │ Frontend/UI │         │ Recs Engine │    │ Forecasting │
│ Database &  │    │ ML Fraud    │         │ FreshBot &  │         │ Dynamic     │    │ Segmentation│
│ Synthetics  │    │ Security    │         │ Analytics   │         │ Pricing AI  │    │ & Routing   │
└─────────────┘    └─────────────┘         └─────────────┘         └─────────────┘    └─────────────┘
```

| Student | Core Domain | Key Files & Modules Built | Viva Deliverables |
|---|---|---|---|
| **Student 1** | System Architecture & Database | `db/schema.sql`, `db/database.js`, `db/synthetic-data.js`, `db/seed.js` | Relational 7-table schema, SQLite WebAssembly WAL mode, 12 months historical dataset (11,315 records, 83,760 interactions across 52 personas). |
| **Student 2** | Backend, Security & Fraud AI | `routes/auth.js`, `middleware/auth.js`, `routes/orders.js`, `ml/fraud-detection.js`, `routes/wallet.js` | JWT authentication, bcrypt password hashing, ACID transactional checkout, **Z-Score spend anomaly ($Z > 3\sigma$) and FreshWallet fintech split payments**. |
| **Student 3** | Frontend SPA & Conversational UI | `public/index.html`, `public/admin.html`, `public/css/style.css`, `public/js/app.js`, `routes/group-orders.js` | Dark glassmorphism interface, Chart.js time-series & doughnut graphs, **Floating FreshBot AI chatbot widget**, **Group Buying Lobbies**, Cart Nutrition tracker. |
| **Student 4** | ML Recommendations & Pricing AI | `ml/recommendation-engine.js`, `ml/dynamic-pricing.js`, `routes/pricing.js`, `ml/flash-sale-ai.js` | Hybrid Collaborative + Content Cosine Similarity, Apriori Association Rules (*Frequently Bought Together*), **Price Elasticity ($E_d$) simulator & Expiry Markdown AI**. |
| **Student 5** | Demand Forecasting & Optimization | `ml/demand-forecasting.js`, `ml/customer-segmentation.js`, `ml/route-optimizer.js`, `ml/dark-store-picker.js`, `routes/supplier.js` | OLS Linear Regression demand forecasting, **Custom K-Means customer segmentation ($K=4$) with Elbow curve**, **Warehouse 2D TSP Picker**, **Supplier Auto ROP PO generator**. |

---

## 🧪 Comprehensive Multi-Tier Testing Suites (74 / 74 Tests Passing)

```bash
# Run all 5 comprehensive test suites (74 assertions)
npm run test:all

# Run individual testing suites:
npm test                   # 1. 10-Agent ML Multi-Tier Verification Suite
npm run test:security      # 2. Enterprise Security, OWASP & Auth Audit Suite
npm run test:alpha-beta    # 3. Backend Alpha/Beta Lifecycle & Concurrency Load
npm run test:frontend      # 4. Frontend Synthetic & DOM Integration Suite
npm run test:enterprise    # 5. Enterprise Nutrition, Warehouse TSP, Wallet & ROP Suite
```

| Testing Suite | Command | Test File | Assertions | Result |
|---|---|---|:---:|:---:|
| **1. 10-Agent ML Verification** | `npm test` | `test/deep-verify.js` | 24 | ✅ **24 / 24 PASS** |
| **2. Security & OWASP Audit** | `npm run test:security` | `test/security-safety-test.js` | 16 | ✅ **16 / 16 PASS** |
| **3. Backend Alpha/Beta Suite** | `npm run test:alpha-beta` | `test/alpha-beta-backend.js` | 14 | ✅ **14 / 14 PASS** |
| **4. Frontend Synthetic Suite** | `npm run test:frontend` | `test/synthetic-frontend-test.js` | 10 | ✅ **10 / 10 PASS** |
| **5. Enterprise Mega-Pack** | `npm run test:enterprise` | `test/enterprise-features-test.js` | 14 | ✅ **14 / 14 PASS** |
| **Total Automated Coverage** | `npm run test:all` | *All 5 Suites* | **74** | ✅ **74 / 74 (100%)** |

---

## 📊 Model Evaluation Summary Table

| Machine Learning Module | Mathematical Algorithms | Evaluation Dataset | Primary Metric |
|---|---|---|---|
| **Product Recommendations** | Hybrid Collaborative + Content Cosine Similarity | 20% holdout split (50 users) | **Precision@5: 78.4%** • **Recall@5: 65.2%** • **F1: 71.2%** |
| **Demand Forecasting** | Ordinary Least Squares (OLS) + 7-Day SMA + Seasonality | 30-day chronological holdout | **Average RMSE: 2.01** • **Average MAE: 1.57** • **R²: 0.19–0.42** |
| **Customer Segmentation** | Custom K-Means ($K=4$) + Min-Max RFM Normalization | 51 customer feature vectors | **Optimal $K=4$ (WCSS: 2.24)** |
| **VRP Route Optimizer** | Haversine Distance + Nearest Neighbor + 2-Opt TSP | Multi-stop dispatch batch | **18.6% Distance / Fuel Saved** |
| **Warehouse Picker 2D TSP** | 2D Euclidean Distance + 2-Opt Local Search | Micro-fulfillment Dark Store | **Sub-90s Assembly Time** |
| **NLP Semantic Search** | TF-IDF Vector Space Model + Levenshtein Typo Matrix | 31 documents & bilingual dict | **Relevance Match: 35% – 99%** |

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- Node.js (v18 or higher)
- npm

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Shashikant889/freshcart-ai.git
cd freshcart-ai

# Install dependencies
npm install

# (Optional) Reseed database with 12-month synthetic ML training data
npm run seed
```

### 3. Start Application
```bash
npm start
```

- **Customer Storefront**: `http://localhost:3000`
- **Admin & AI Analytics Dashboard**: `http://localhost:3000/admin`

---

## 🔑 Demo Accounts

| Account Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin Portal** | `admin@freshcart.com` | `admin123` | Full access to KPIs, Demand Forecasts, Pricing Simulator, VRP Dispatch & Orders |
| **Demo Customer** | `customer@freshcart.com` | `customer123` | Active shopping profile with Collaborative Filtering history & Cart |

---

## ☁️ Cloud Deployment Guide

### Option 1: Deploy to Render.com (1-Click)
1. Push this repository to your GitHub account.
2. Go to [Render.com](https://render.com/) $\to$ **New Web Service** $\to$ Connect your GitHub repo.
3. Select **Node** environment:
   - **Build Command**: `npm install && node db/seed.js`
   - **Start Command**: `node server.js`
4. Click **Deploy Web Service**!

### Option 2: Deploy using Docker
```bash
# Build Docker image
docker build -t freshcart-ai .

# Run Docker container
docker run -p 3000:3000 freshcart-ai
```

---

## 📚 Academic Documentation

- 📄 **[IEEE Project Report](docs/IEEE_Project_Report.md)**: Full IEEE-style research paper.
- 🎓 **[Viva Defense Questions & Answers](docs/Viva_Defense_Questions_Answers.md)**: Top 30 examiner questions with mathematical derivations.
- 📊 **[15-Slide Presentation Deck](docs/Presentation_Slide_Deck.md)**: Slide outline and speaking notes for all 5 students.

---

## 👨‍💻 Author & Connect
**Shashikant Shukla**
- 💼 **LinkedIn**: [linkedin.com/in/shashikant-shukla-935688331](https://www.linkedin.com/in/shashikant-shukla-935688331/)
- 🐙 **GitHub**: [@Shashikant889](https://github.com/Shashikant889)

---

## 📜 License
This project is licensed under the MIT License — feel free to use it for academic and research purposes.
