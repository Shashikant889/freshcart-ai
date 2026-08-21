# 📊 FreshCart AI — 15-Slide Final Project Presentation Deck
## B.Tech Major Project Defense — Department of Computer Science & Engineering (AI & ML)

---

### Slide 1: Title & Team Introduction
* **Title**: AI-Powered Intelligent Grocery E-Commerce & Recommendation System (FreshCart AI)
* **Subtitle**: A Unified Microeconomic & Machine Learning Platform for Smart Retail
* **Team Members & Roll Numbers**:
  1. Student 1: System Architecture & Relational Data Engineering
  2. Student 2: Backend REST APIs, Security & Real-Time Fraud AI
  3. Student 3: Frontend SPA, Glassmorphism UI & Conversational AI (FreshBot)
  4. Student 4: Hybrid Recommender Engine & Dynamic Pricing Simulation
  5. Student 5: Time-Series Demand Forecasting, K-Means Segmentation & VRP Route Optimizer
* **Project Guide / Supervisor**: [Guide Name], Department of CSE-AIML

---

### Slide 2: Problem Statement & Motivation
* **Industry Challenges in Grocery E-Commerce**:
  - High Perishability & Spoilage: Grocery items have short shelf lives requiring accurate localized demand forecasting.
  - Cart Abandonment & Search Friction: Users struggle to discover recipe bundles or items matching dietary/budget constraints.
  - Static Pricing: Traditional e-commerce fails to account for category price elasticity ($E_d$).
  - Transaction Abuse & Scalping: High-velocity bulk hoarding of subsidized staples.
  - Inefficient Last-Mile Delivery: Non-optimized delivery routes lead to high fuel costs and delayed deliveries.

---

### Slide 3: System Overview & Core Contributions
* **Key Capabilities Built**:
  - **Hybrid AI Recommendations**: Content-Based + User-User Collaborative Filtering + Apriori Association Rules.
  - **OLS Time-Series Demand Forecasting**: Predicts next 7–30 days unit demand with automated inventory stockout risk alerts.
  - **Unsupervised Customer Segmentation**: Custom K-Means ($K=4$) with RFM feature extraction and WCSS Elbow curve.
  - **FreshBot Conversational AI**: Recipe-to-Cart NLP matching and 1-click multi-ingredient bundle checkout.
  - **Real-Time Fraud Detection**: Statistical Z-Score spend anomaly ($Z > 3\sigma$) and transaction velocity scoring.
  - **Dynamic Pricing Engine**: Microeconomic price elasticity simulation and profit-optimal price derivation ($P^*$).
  - **VRP Delivery Dispatch Optimizer**: 2-Opt local search TSP reducing delivery transit distance by $18.6\%$.

---

### Slide 4: System Architecture & Data Pipeline (Student 1)
* **Architecture Diagram**:
  - Embedded SQLite WebAssembly engine (`freshcart.db`) running ACID transactions.
  - 7-Table normalized relational schema (`users`, `products`, `cart_items`, `orders`, `order_items`, `sales_history`, `user_interactions`).
* **Synthetic Data Pipeline**:
  - 12 months of chronological sales data points (11,315 records).
  - 83,760 user interactions across 52 behavioral personas.
  - Day-of-week seasonality and conversion funnel modeling.
* **Speaking Note (Student 1)**: *"I designed the foundational relational database and synthetic training pipeline that drives all downstream ML models..."*

---

### Slide 5: Backend, Security & Transaction Management (Student 2)
* **Backend Features**:
  - Modular Express.js REST API with zero external cloud dependencies.
  - JWT Authentication (HMAC-SHA256) with `bcryptjs` password hashing (10 salt rounds).
  - ACID Transactional Checkout: Atomic inventory decrement, order creation, and interaction logging.
* **Speaking Note (Student 2)**: *"I engineered the secure REST APIs and transactional order lifecycle ensuring ACID guarantees across concurrent checkouts..."*

---

### Slide 6: Real-Time Fraud & Anomaly Detection Engine (Student 2)
* **Formulation & Logic**:
  - **Z-Score Spend Deviation**: $Z = \frac{X - \mu}{\sigma}$. Flags transactions deviating by $>3\sigma$ from user historical mean.
  - **Velocity Burst Check**: Flags $\ge 3$ orders within a 10-minute rolling window.
  - **Item Hoarding**: Detects single-item orders $\ge 10$ units.
  - **Composite Score**: $0 \dots 100$ risk rating displayed on the live Admin Orders Feed.
* **Speaking Note (Student 2)**: *"Our fraud subsystem evaluates transactions in real-time, catching spend outliers and scalping bots before dispatch..."*

---

### Slide 7: Storefront UI/UX & Conversational AI (Student 3)
* **Frontend Design System**:
  - Responsive dark-theme glassmorphism UI with CSS custom properties.
  - Live Shopping Cart drawer with free delivery progress indicator (₹500 threshold).
  - Live Cart Nutrition Tracker calculating Protein, Fiber, Calories, and Health Grade (`A+`, `A`, `B`).
* **FreshBot AI**:
  - Floating assistant capable of natural language dish parsing (*"Mango Lassi"*, *"Fruit Salad"*, *"Protein Breakfast"*).
  - 1-Click Multi-Item bundle addition into the shopping cart.
* **Speaking Note (Student 3)**: *"I created the modern glassmorphism storefront and the FreshBot conversational recipe assistant..."*

---

### Slide 8: Machine Learning Recommendation Engine (Student 4)
* **Hybrid Recommendation Formulation**:
  $$\text{Score}(u, i) = \alpha \cdot \text{Collab}(u, i) + \beta \cdot \text{Content}(u, i) + \gamma \cdot \text{Popularity}(i)$$
* **Content-Based Filtering**: Feature vectors (Category one-hot + normalized price + rating + tags) compared via Cosine Similarity:
  $$\text{sim}(\vec{A}, \vec{B}) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$$
* **User-User Collaborative Filtering**: Interaction matrix weighted by event type (View: 1, Cart: 2, Purchase: 4, Rate: $r$).
* **Speaking Note (Student 4)**: *"Our recommender combines collaborative behavior with content attributes to solve the classic cold-start problem..."*

---

### Slide 9: Association Rule Mining & Dynamic Pricing (Student 4)
* **Apriori Association Rules**:
  - Support, Confidence, and Lift for *"Frequently Bought Together"* pairs.
* **Dynamic Pricing & Price Elasticity**:
  - Models Price Elasticity of Demand: $E_d = \frac{\% \Delta Q}{\% \Delta P}$.
  - Category coefficients: Dairy ($-0.58$), Produce ($-0.82$), Fruits/Bakery ($-1.25$), Snacks ($-1.35$).
  - Profit-Optimal Price Derivation: $P^* = \frac{P_0 (E_d - 1)}{2 E_d}$.
* **Speaking Note (Student 4)**: *"We built an interactive pricing simulator that models how price adjustments impact net revenue and inventory clearance..."*

---

### Slide 10: Time-Series Demand Forecasting (Student 5)
* **Mathematical Model**:
  - Secular trend fitting via Ordinary Least Squares (OLS) closed-form Linear Regression:
    $$m = \frac{\sum (t - \bar{t})(y_t - \bar{y})}{\sum (t - \bar{t})^2}, \quad c = \bar{y} - m\bar{t}$$
  - Hybrid forecast blending OLS ($0.6$), 7-Day SMA ($0.4$), and day-of-week seasonality.
  - Generates 7–30 day predictions with $95\%$ confidence bounds.
  - Automated Inventory Stockout Risk Warnings ($\le 3$ days stock remaining).
* **Speaking Note (Student 5)**: *"Our demand forecasting engine predicts daily SKU demand to automate inventory reordering before stockouts occur..."*

---

### Slide 11: Unsupervised Customer Segmentation (Student 5)
* **K-Means Clustering from Scratch**:
  - Feature Space: Min-Max normalized $[R, F, M]$ (Recency, Frequency, Monetary).
  - $K$-Means++ centroid initialization and iterative Euclidean convergence.
  - **Elbow Method Validation**: Evaluated WCSS for $K=2 \dots 6$, confirming optimal clustering at $K=4$ ($\text{WCSS} = 2.24$).
* **4 Distinct Personas**:
  1. 👑 Champions & VIPs (Top revenue drivers).
  2. ⭐ Loyal Regulars (Consistent staple buyers).
  3. 🌱 Budget Shoppers (Price sensitive).
  4. ⚠️ At-Risk / Lapsed ($>60$ days inactivity).
* **Speaking Note (Student 5)**: *"I implemented K-Means from scratch to segment customers into actionable marketing personas..."*

---

### Slide 12: Delivery Route Optimization & Visual Search (Student 5)
* **Vehicle Routing Problem (VRP)**:
  - Models multi-stop delivery routes using GPS Haversine distance.
  - Initialized with Nearest Neighbor heuristic and refined via **2-Opt Local Search**.
  - Visualized on an interactive Admin Canvas map; yields **$18.6\%$ average fuel/distance savings**.
* **Visual Search (Computer Vision)**:
  - 5D Color Histogram & Texture feature vectors matched via Visual Cosine Similarity.
* **Speaking Note (Student 5)**: *"We solved the multi-stop delivery dispatch problem using 2-Opt TSP heuristics, reducing fleet transit miles..."*

---

### Slide 13: Experimental Results & Model Validation Benchmarks
* **Comparative Validation Table**:

| Model Component | Algorithm | Test Dataset Split | Key Benchmark Result |
|---|---|---|---|
| **Product Recommendations** | Hybrid Collaborative + Content | 20% holdout split (50 users) | **Precision@5: 78.4%** • **Recall@5: 65.2%** • **F1: 71.2%** |
| **Demand Forecasting** | OLS + 7-Day SMA + Seasonality | 30-day chronological holdout | **Average RMSE: 2.01** • **Average MAE: 1.57** • **R²: 0.19–0.42** |
| **Customer Segmentation** | Custom K-Means ($K=4$) | 51 customer vectors | **Optimal $K=4$ (WCSS: 2.24)** |
| **Delivery Optimization** | Haversine + 2-Opt TSP | Multi-stop dispatch batch | **18.6% Distance / Fuel Saved** |
| **NLP Semantic Search** | TF-IDF + Levenshtein Typo | 31 documents & bilingual dict | **Relevance Match: 35% – 99%** |

---

### Slide 14: Live System Demonstration & Screenshots
* **Live Demo Flow**:
  1. **Customer Store**: Browse personalized recommendations $\to$ Use FreshBot for recipe bundle $\to$ Check cart nutrition $\to$ Place order in ₹.
  2. **Admin Dashboard**: View 30-day sales trends $\to$ Inspect product demand forecast curve $\to$ Test Dynamic Pricing slider $\to$ Inspect 2-Opt dispatch route map $\to$ Verify Fraud Risk flags on live orders.

---

### Slide 15: Conclusion & Future Scope
* **Summary of Achievements**:
  - Delivered a production-grade, 7-module AI-powered e-commerce ecosystem.
  - All algorithms implemented from foundational mathematical principles in pure JavaScript.
  - Complete 5-student division of responsibilities with quantitative validation.
* **Future Work**:
  - Integration with real-time GPS tracking for delivery riders.
  - Deep reinforcement learning (Q-Learning) for continuous dynamic price adjustment.
  - Multi-warehouse inventory load balancing.
* **Thank You & Q&A Session**: Ready for examiner questions!
