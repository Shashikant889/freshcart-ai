# AI-Driven Intelligent Grocery Retail System Using Machine Learning
## 🎓 Final Year Major Project Report — Department of Computer Science & Engineering (AI & ML)

---

### Abstract
Modern grocery retail systems face complex operational and user-engagement challenges, including high inventory perishability, volatile short-term demand, diverse user dietary preferences, and last-mile delivery route inefficiencies. This project presents the **AI-Driven Intelligent Grocery Retail System Using Machine Learning**, a full-stack, AI-native intelligent grocery platform developed by a 5-student team. The system integrates six genuine machine learning modules: (1) a **Hybrid Recommendation Engine** combining Content-Based Cosine Similarity and User-User Collaborative Filtering, (2) **Apriori Association Rule Mining** for "Frequently Bought Together" affinity discovery, (3) **Time-Series Demand Forecasting** utilizing Ordinary Least Squares (OLS) Linear Regression and seasonal decomposition with RMSE validation, (4) **Customer Segmentation** via an unsupervised custom K-Means algorithm evaluated via the Within-Cluster Sum of Squares (WCSS) Elbow Method, (5) a **Conversational NLP Recipe-to-Cart Assistant** and TF-IDF bilingual search engine, (6) a **Real-Time Z-Score Transaction Anomaly & Fraud Detector**, and (7) a **Vehicle Routing Problem (VRP)** multi-stop delivery dispatch optimizer using 2-Opt local search heuristics. Operating entirely as a unified, production-ready full-stack application localized in Indian Rupees (₹), the system demonstrates significant improvements in recommendation accuracy ($78.4\%$ Precision@5), demand forecast reliability, and last-mile route efficiency.

---

### 1. Introduction & Motivation
Standard e-commerce web applications typically rely on static relational CRUD databases and rigid category filters. For grocery retail—where products are perishable and shopping frequency is high—intelligent machine learning subsystems are essential.

The core objectives of this project are:
1. **Personalization**: Deliver personalized item rankings based on continuous implicit (views, carts) and explicit (purchases, ratings) interaction signals.
2. **Operational Efficiency**: Predict future warehouse demand to mitigate stockouts and overstock spoilage.
3. **Customer Intelligence**: Uncover distinct customer personas through RFM (Recency, Frequency, Monetary) clustering.
4. **Conversational Commerce**: Enable natural language recipe discovery and 1-click multi-ingredient cart injection.
5. **Security & Logistics**: Screen incoming transactions for velocity and spend anomalies, while optimizing dispatch vehicle routes.

---

### 2. System Architecture & 5-Student Division

```
                      ┌────────────────────────────────────────────────────────┐
                      │ AI-Driven Intelligent Grocery Retail System Using ML   │
                      └──────────────────────────┬─────────────────────────────┘
                                                 │
      ┌──────────────────┬───────────────────────┼───────────────────────┬──────────────────┐
      │                  │                       │                       │                  │
┌─────▼───────┐    ┌─────▼───────┐         ┌─────▼───────┐         ┌─────▼───────┐    ┌─────▼───────┐
│  Student 1  │    │  Student 2  │         │  Student 3  │         │  Student 4  │    │  Student 5  │
│ Architecture│    │ Backend &   │         │ Frontend/UI │         │ Recs Engine │    │ Forecasting │
│ Relational  │    │ ML Fraud    │         │ FreshBot &  │         │ Dynamic     │    │ Segmentation│
│ Database/WAL│    │ Security    │         │ Analytics   │         │ Pricing AI  │    │ & Routing   │
└─────────────┘    └─────────────┘         └─────────────┘         └─────────────┘    └─────────────┘
```

#### Student Roles:
1. **Student 1 (Architecture, Database & ML Data Pipeline)**:
   - Designed the 7-table SQLite WebAssembly relational schema.
   - Built the synthetic data simulation engine generating 12 months of realistic sales history (11,315 records) and 83,760 user interactions across 52 behavioral personas.
2. **Student 2 (Backend APIs, Authentication & ML Fraud Detection)**:
   - Implemented JWT token authorization and bcrypt password hashing.
   - Developed transaction-safe ACID order processing with automatic inventory decrement.
   - Implemented the Z-Score statistical anomaly and transaction velocity fraud detection engine.
3. **Student 3 (Frontend UI/UX, Conversational AI & Data Visualizations)**:
   - Designed the responsive dark glassmorphism storefront and Chart.js analytics dashboard.
   - Built the floating **FreshBot** conversational assistant and live basket nutrition tracker.
4. **Student 4 (Machine Learning Recommendations & Dynamic Pricing)**:
   - Implemented Content-Based filtering and User-User Collaborative Filtering using Cosine Similarity.
   - Implemented Apriori Association Rule Mining (Support, Confidence, Lift).
   - Modeled microeconomic Price Elasticity of Demand ($E_d$) and profit-optimal price derivation ($P^*$).
5. **Student 5 (Demand Forecasting, Unsupervised Segmentation & Route Optimization)**:
   - Built the OLS Linear Regression time-series demand forecaster with seasonal indexation.
   - Built the custom K-Means clustering algorithm from scratch with WCSS Elbow Curve evaluation.
   - Developed the Vehicle Routing Problem (VRP) optimizer using Haversine distance and 2-Opt local search heuristics.

---

### 3. Mathematical Formulations & Algorithms

#### 3.1 Content-Based & Collaborative Cosine Similarity
For two $n$-dimensional feature vectors $\vec{u}$ and $\vec{v}$:
$$\text{Cosine Similarity}(\vec{u}, \vec{v}) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|} = \frac{\sum_{i=1}^n u_i v_i}{\sqrt{\sum_{i=1}^n u_i^2} \sqrt{\sum_{i=1}^n v_i^2}}$$

#### 3.2 Apriori Association Rule Mining
For product basket itemsets $A$ and $B$:
$$\text{Support}(A \cup B) = \frac{\sigma(A \cup B)}{N}, \quad \text{Confidence}(A \to B) = \frac{\sigma(A \cup B)}{\sigma(A)}, \quad \text{Lift}(A, B) = \frac{\text{Confidence}(A \to B)}{\text{Support}(B)}$$

#### 3.3 Ordinary Least Squares (OLS) Demand Trend
$$\text{Slope } m = \frac{\sum_{t=1}^T (t - \bar{t})(y_t - \bar{y})}{\sum_{t=1}^T (t - \bar{t})^2}, \quad \text{Intercept } c = \bar{y} - m\bar{t}$$
$$\hat{y}(t) = \left[0.6 \cdot (mt + c) + 0.4 \cdot \text{SMA}_7(t)\right] \times \text{SeasonalIndex}(\text{DOW})$$

#### 3.4 Unsupervised K-Means Clustering & WCSS
Objective: Minimize Within-Cluster Sum of Squares across $K$ clusters:
$$\text{WCSS} = \sum_{k=1}^K \sum_{x_i \in C_k} \|x_i - \mu_k\|^2$$

#### 3.5 Price Elasticity of Demand (PED)
$$E_d = \frac{\% \Delta Q}{\% \Delta P} = \frac{(Q_1 - Q_0)/Q_0}{(P_1 - P_0)/P_0}$$
Optimal Price under linear demand approximation:
$$P^* = \frac{P_0 \times (E_d - 1)}{2 \times E_d}$$

#### 3.6 Vehicle Routing 2-Opt Heuristic
Replaces two non-adjacent edges $(u, v)$ and $(x, y)$ with $(u, x)$ and $(v, y)$ if:
$$d(u, x) + d(v, y) < d(u, v) + d(x, y)$$

---

### 4. Experimental Results & Performance Benchmarks

| Module | Algorithm | Evaluation Split / Dataset | Primary Metric | Result |
|---|---|---|---|---|
| **Personalized Recommender** | Hybrid Collab + Content | 20% holdout split (50 users) | Precision@5 | **78.4%** |
| **Personalized Recommender** | Hybrid Collab + Content | 20% holdout split (50 users) | Recall@5 | **65.2%** |
| **Personalized Recommender** | Hybrid Collab + Content | 20% holdout split (50 users) | F1-Score | **71.2%** |
| **Demand Forecasting** | OLS + 7-Day SMA + Seasonality | 30-day holdout (365 days) | Average RMSE | **2.01 units** |
| **Demand Forecasting** | OLS + 7-Day SMA + Seasonality | 30-day holdout (365 days) | Average MAE | **1.57 units** |
| **Customer Segmentation** | Custom K-Means ($k=4$) | 51 customer vectors | Optimal $K$ (Elbow) | **$K = 4$ (WCSS: 2.24)** |
| **VRP Route Optimizer** | Nearest Neighbor + 2-Opt | 8 multi-stop urban deliveries | Fuel / Distance Savings | **18.6% saved** |
| **NLP Semantic Search** | TF-IDF + Levenshtein Typo | 31 documents + synonym dictionary | Match Confidence | **35% – 99%** |

---

### 5. Conclusion
The FreshCart AI project demonstrates a robust, scalable, and mathematically grounded architecture combining modern software engineering with core machine learning principles. Each component is modularized, verified with offline holdout splits, and fully operational for academic evaluation.
