# FreshCart AI: Final Live Application Demonstration Script

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Target Audience:** External Examiner, Internal Examiner, Project Guide & Evaluation Committee  
**System Prerequisites:**  
- Application Server running on `http://localhost:3000` (`node server.js`)
- Python AI Microservice running on `http://localhost:8000` (`uvicorn ml.service.app:app --port 8000`)
- Web Browser open at `http://localhost:3000` (Storefront) and `http://localhost:3000/admin.html` (Admin Portal)

---

## Demonstration Flow Overview (13 Structured Stages)

| Stage | Demonstration Phase | Target URL / Route | Primary Visual Element / Feature Demonstrated |
|---|---|---|---|
| **1** | System Initialization & Dual-Tier Startup | Terminal / Ports `3000` & `8000` | Node.js Express + Python FastAPI startup logs |
| **2** | Customer Storefront PWA Home View | `http://localhost:3000/` | PWA manifest, catalog grid across 31 SKUs |
| **3** | Bilingual NLP Search & FreshBot Recipe AI | `http://localhost:3000/#search` | Search ('seb', 'doodh'), Recipe ingredient bundler |
| **4** | Personalized Top-K Recommendations | `http://localhost:3000/#recommendations` | Hybrid CF+CB carousel (alpha=0.60, F1@10=0.5027) |
| **5** | Cart Assembly & Dynamic Pricing | `http://localhost:3000/#cart` | Bounded price adjustments ([±25%] guardrails) |
| **6** | Atomic Checkout & Real-Time Fraud Scoring | `POST /api/orders/checkout` | SQLite ACID transaction, Random Forest risk score |
| **7** | Admin Operations Dashboard & KPIs | `http://localhost:3000/admin.html` | Revenue ₹, Orders, Microservice Status = Online |
| **8** | 30-Day SARIMAX Demand Forecasting | Admin -> Demand Forecasting Tab | Interactive 30-day forecast chart (RMSE = 5.83) |
| **9** | Econometric Dynamic Pricing Sandbox | Admin -> Pricing Sandbox Tab | Category elasticity ($E_d = -0.136$), simulated lift |
| **10** | Continuous Review $(r, Q)$ Inventory | Admin -> Inventory Management Tab | Wilson EOQ, Reorder Point, automated PO table |
| **11** | Dark-Store 2D TSP Warehouse Picker Walk | Admin -> Dispatch / Picker Tab | 2D coordinate grid, Nearest-Neighbor + 2-Opt path |
| **12** | Last-Mile Delivery Fleet CVRP Dispatch | Admin -> Fleet Logistics Tab | Clarke-Wright vehicle clustering, payload meters |
| **13** | AI Service Downtime & Circuit Fallback | Port `8000` Stop -> Storefront Action | 1.5s circuit trip, seamless Node.js in-process fallback |

---

## Step-by-Step Live Demonstration Script

### Step 1: System Initialization & Dual-Tier Architecture Verification
- **Action:** Open two terminal panes.
  - Pane 1: `node server.js` -> Server running on port 3000, SQLite connected.
  - Pane 2: `uvicorn ml.service.app:app --port 8000` -> FastAPI started, in-memory singleton models loaded.
- **Spoken Script:**
  > *"Respected examiners, we begin by starting our two-tier architecture. On port 3000, our Node.js Express application server handles web traffic and database persistence. On port 8000, our Python FastAPI microservice pre-warms all scikit-learn and statsmodels artifacts into an in-memory singleton registry for sub-25ms inference."*

---

### Step 2: Customer Storefront PWA Navigation
- **Action:** Navigate to `http://localhost:3000/`. Show responsive catalog across 31 seeded SKUs (Fruits, Vegetables, Dairy, Snacks, Beverages).
- **Spoken Script:**
  > *"Here is the Customer Storefront. It is built as an installable Progressive Web Application with client-side caching via service workers. Notice the 31 seeded grocery SKUs displaying real-time stock status, unit pricing in Indian Rupees, and category filter pills."*

---

### Step 3: Bilingual NLP Smart Search & Recipe Ingredient Bundler
- **Action:**
  1. Type `"seb"` or `"doodh"` in the search bar. Observe instant translation to `"Apples"` / `"Milk"`.
  2. Click the **FreshBot Recipe Assistant** widget and select *"Paneer Butter Masala"*.
- **Spoken Script:**
  > *"Our search engine features bilingual English and Hindi phonetic mapping. For example, typing 'seb' instantly returns apples. Furthermore, our FreshBot Recipe Assistant analyzes cooking recipes and bundles all necessary ingredients into the user's cart in a single click."*

---

### Step 4: Personalized Top-K Recommendation Demo
- **Action:** Switch user profiles or click on several dairy items. Scroll to the *"Recommended for You"* carousel.
- **Spoken Script:**
  > *"As the user interacts with products, our Hybrid Recommendation Engine combines User-User Collaborative Filtering with Content-Based TF-IDF matching at a 60/40 weighting ratio. The model evaluates user affinity and extracts top-10 personalized items in 4.86 ms, achieving an F1@10 of 0.5027 and an NDCG@10 of 0.9790 on our holdout test set."*

---

### Step 5: Cart Assembly & Dynamic Pricing Verification
- **Action:** Add items to cart. Observe unit prices. Explain how prices adapt based on demand elasticity.
- **Spoken Script:**
  > *"When items enter the cart, our pricing engine applies Log-Log OLS price elasticity modeling. To protect customer trust and market stability, prices are strictly bounded within a 25% safety window of base retail prices, preventing unconstrained pricing swings."*

---

### Step 6: Atomic Checkout & Real-Time Fraud Risk Scoring
- **Action:** Proceed to checkout with address and simulated UPI payment. Click *"Place Order"*. Show order confirmation dialog and generated Invoice ID.
- **Spoken Script:**
  > *"During checkout, an atomic SQLite transaction begins. Before committing, the Express server dispatches transaction velocity and basket features to the Python fraud service. Our cost-sensitive Random Forest scores transaction risk in under 20 ms. Valid orders atomically decrement inventory stock and generate a verified invoice."*

---

### Step 7: Admin Operations Portal & Executive KPIs
- **Action:** Open `http://localhost:3000/admin.html`. Point to KPI metric cards (Total Revenue ₹, Orders, Low Stock Alerts, AI Service Status = Online).
- **Spoken Script:**
  > *"Now switching to the Admin Operations Portal: store managers have immediate visibility into total revenue, order volume, low stock alerts, and the real-time health of the AI microservice gateway."*

---

### Step 8: 30-Day SARIMAX Demand Forecasting Visualizer
- **Action:** Click on the **Demand Forecasting** tab in the admin panel. Select *"Fresh Organic Milk"* or *"Alphonso Mangoes"*.
- **Spoken Script:**
  > *"Here is our 30-day demand forecasting dashboard. Using SARIMAX with weekly seasonality and promotional regressors, the system plots historical sales against out-of-sample predicted demand with confidence bounds. On our 30-day temporal holdout, this model achieved an RMSE of 5.83 units with a 2.50% MAPE without lookahead data leakage."*

---

### Step 9: Dynamic Pricing & Elasticity Sandbox
- **Action:** Click on the **Pricing Sandbox** tab. Adjust price sliders and view simulated revenue curves across product categories.
- **Spoken Script:**
  > *"The Pricing Sandbox demonstrates our econometric elasticity estimates. For example, Beverages show an elasticity of -0.201, while Fruits show -0.058. In model-based simulations under Constant Elasticity of Demand assumptions, this optimal pricing strategy yields a simulated revenue lift of +22.21%."*

---

### Step 10: Continuous Review $(r, Q)$ Inventory & Automated Purchase Orders
- **Action:** Click on the **Inventory Management** tab. Show the automated Purchase Order (PO) table generated when stock $\le ROP$.
- **Spoken Script:**
  > *"This tab displays our Continuous Review $(r, Q)$ inventory policy. Using Wilson Economic Order Quantity and Gaussian safety stock at a 95% service factor, the system automatically drafts Purchase Orders whenever available stock falls below the Reorder Point. In a 365-day simulation, this policy reduced total inventory costs by 87.64% while maintaining a 99.88% cycle service level."*

---

### Step 11: Dark-Store 2D TSP Warehouse Order Picker Routing
- **Action:** Click on the **Warehouse Dispatch** tab. Select an active order batch. Observe the 2D dark-store coordinate map and the plotted pick route.
- **Spoken Script:**
  > *"Inside micro-fulfillment dark stores, picking speed is critical. Our 2D TSP solver maps item locations to Euclidean aisle coordinates, generates an initial tour via Nearest-Neighbor, and eliminates edge crossings using 2-Opt local search. In benchmark tests across 100 batches, this reduced picker walking distance by 37.48% (achieving a 0.09% gap vs exact solutions) in just 2.34 ms."*

---

### Step 12: Last-Mile Delivery Fleet Routing (CVRP)
- **Action:** Click on the **Fleet Logistics** tab. Show multi-order clustering into vehicle routes with payload capacity meters (e.g. Vehicle 1: 21.4 kg / 25 kg).
- **Spoken Script:**
  > *"For last-mile delivery, our Clarke-Wright Savings CVRP solver clusters customer delivery drop-offs subject to a 25 kg vehicle payload constraint, followed by 2-Opt route smoothing. Across 100 benchmark instances, this reduced fleet travel distance by 61.62% while elevating capacity utilization from 38.4% to 82.9%."*

---

### Step 13: High-Resilience Fallback & Circuit Breaker Demonstration
- **Action:**
  1. In the terminal, terminate the Python FastAPI microservice (`Ctrl+C` in Terminal 2).
  2. Return to the Storefront at `http://localhost:3000/` and refresh the page.
  3. Perform a search and place an order.
  4. Show in Node terminal that the circuit breaker tripped and executed in-process JavaScript fallback engines without crashing or throwing 500 errors.
- **Spoken Script:**
  > *"To demonstrate our system's fault tolerance, we have intentionally killed the Python AI microservice. Notice that when we refresh the storefront and place an order, our Node.js AI Gateway detects the offline service within 1.5 seconds, trips the circuit breaker, and falls back to in-process Node.js heuristic engines. The customer browsing and checkout flow completes smoothly with zero 500 errors."*

---

## Conclusion & Examiner Q&A Hand-Off
> **Speaker:**  
> *"This concludes our live system demonstration. We have shown all four predictive machine learning models, three combinatorial operations research optimizers, the PWA customer storefront, the admin management portal, and our fault-tolerant fallback architecture. We are now pleased to answer your questions during the viva examination."*
