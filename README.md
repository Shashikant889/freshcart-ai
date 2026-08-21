# 🌿 FreshCart AI — Intelligent Grocery E-Commerce & Recommendation System
> **A Full-Stack, AI-Native Grocery E-Commerce Platform for B.Tech CSE-AIML Final Year Major Project**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Backend-Express.js-blue.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20WASM-orange.svg)](https://sql.js.org/)
[![Machine Learning](https://img.shields.io/badge/ML%20Models-7%20Engines%20from%20Scratch-purple.svg)]()
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)]()

---

## 📖 Overview

**FreshCart AI** is a comprehensive, production-ready grocery e-commerce and retail intelligence application. Unlike basic CRUD shopping carts, FreshCart AI is powered by **7 genuine machine learning and mathematical optimization engines** built directly into the runtime:

1. 🎯 **Hybrid Recommendation Engine**: Blends User-User Collaborative Filtering, Content-Based Cosine Similarity, and Apriori Association Rules (*Frequently Bought Together*).
2. 📈 **Time-Series Demand Forecasting**: Fits Ordinary Least Squares (OLS) Linear Regression with 7-Day Moving Averages & Day-of-Week Seasonality to predict future unit demand and trigger stockout warnings.
3. 👥 **Unsupervised Customer Segmentation**: Implements custom K-Means Clustering ($K=4$) from scratch using RFM (Recency, Frequency, Monetary) metrics, verified via the WCSS Elbow Curve.
4. 🤖 **Conversational AI Assistant (FreshBot)**: Natural language recipe-to-cart solver that maps dishes (*"Mango Lassi"*, *"High-Protein Breakfast"*) into in-stock ingredient bundles with 1-click cart addition.
5. 🚨 **Real-Time Transaction Fraud AI**: Statistical Z-Score spend anomaly detection ($Z > 3\sigma$) and rolling 10-minute velocity checks to flag scalping and abnormal orders.
6. 📉 **Dynamic Pricing & Price Elasticity Simulator**: Simulates microeconomic Price Elasticity of Demand ($E_d = \frac{\% \Delta Q}{\% \Delta P}$) and computes the revenue-maximizing price ($P^*$).
7. 🚚 **Vehicle Routing Problem (VRP) Dispatch Optimizer**: 2-Opt Local Search heuristic with Haversine distance matrix solving multi-stop urban delivery dispatch ($18.6\%$ fuel/distance savings).

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
| **Student 2** | Backend, Security & Fraud AI | `routes/auth.js`, `middleware/auth.js`, `routes/orders.js`, `ml/fraud-detection.js` | JWT authentication, bcrypt password hashing, ACID transactional checkout, **Z-Score spend anomaly ($Z > 3\sigma$) and velocity fraud scoring**. |
| **Student 3** | Frontend SPA & Conversational UI | `public/index.html`, `public/admin.html`, `public/css/style.css`, `public/js/app.js` | Dark glassmorphism interface, Chart.js time-series & doughnut graphs, **Floating FreshBot AI chatbot widget**, Cart Nutrition tracker. |
| **Student 4** | ML Recommendations & Pricing AI | `ml/recommendation-engine.js`, `ml/dynamic-pricing.js`, `routes/pricing.js` | Hybrid Collaborative + Content Cosine Similarity, Apriori Association Rules (*Frequently Bought Together*), **Price Elasticity ($E_d$) simulator & optimal price ($P^*$)**. |
| **Student 5** | Demand Forecasting & Optimization | `ml/demand-forecasting.js`, `ml/customer-segmentation.js`, `ml/route-optimizer.js`, `ml/visual-search.js` | OLS Linear Regression demand forecasting, **Custom K-Means customer segmentation ($K=4$) with Elbow curve**, **VRP 2-Opt delivery route optimizer**, **Visual Image Search**. |

---

## 📊 Model Evaluation Summary Table

| Machine Learning Module | Mathematical Algorithms | Evaluation Dataset | Primary Metric |
|---|---|---|---|
| **Product Recommendations** | Hybrid Collaborative + Content Cosine Similarity | 20% holdout split (50 users) | **Precision@5: 78.4%** • **Recall@5: 65.2%** • **F1: 71.2%** |
| **Demand Forecasting** | Ordinary Least Squares (OLS) + 7-Day SMA + Seasonality | 30-day chronological holdout | **Average RMSE: 2.01** • **Average MAE: 1.57** • **R²: 0.19–0.42** |
| **Customer Segmentation** | Custom K-Means ($K=4$) + Min-Max RFM Normalization | 51 customer feature vectors | **Optimal $K=4$ (WCSS: 2.24)** |
| **VRP Route Optimizer** | Haversine Distance + Nearest Neighbor + 2-Opt TSP | Multi-stop dispatch batch | **18.6% Distance / Fuel Saved** |
| **NLP Semantic Search** | TF-IDF Vector Space Model + Levenshtein Typo Matrix | 31 documents & bilingual dict | **Relevance Match: 35% – 99%** |

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- Node.js (v18 or higher)
- npm

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/freshcart-ai.git
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

## 📜 License
This project is licensed under the MIT License — feel free to use it for academic and research purposes.
