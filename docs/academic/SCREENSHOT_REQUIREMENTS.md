# FreshCart AI: Official Real Application Screenshot Registry

**Project Title:** AI-Driven Intelligent Grocery Retail System Using Machine Learning  
**Department:** Computer Science & Engineering (AIML), A. P. Shah Institute of Technology  
**Affiliated University:** University of Mumbai (Academic Year 2025–2026)  
**Confirmed Student Team:**  
1. Shashikant Shukla (Moodle ID: `[STUDENT_1_MOODLE_ID]`, PRN: `[STUDENT_1_PRN]`)  
2. Om Dubey (Moodle ID: `[STUDENT_2_MOODLE_ID]`, PRN: `[STUDENT_2_PRN]`)  
3. Shreyash Wadalkar (Moodle ID: `[STUDENT_3_MOODLE_ID]`, PRN: `[STUDENT_3_PRN]`)  
4. [STUDENT 4 NAME — DO NOT GUESS] (Moodle ID: `[STUDENT_4_MOODLE_ID]`, PRN: `[STUDENT_4_PRN]`)  
**Project Guide:** `[PROJECT_GUIDE_NAME_AND_TITLE]`  

---

## Master Screenshot Inventory (14 Authentic Captures)

All screenshots have been captured directly from the live running application (`http://localhost:3000` and `http://localhost:8000`) and saved as high-resolution PNGs in [`docs/academic/screenshots/`](file:///c:/Users/shash/demo1/docs/academic/screenshots).

| ID | Filename | Application Route | Description & Key Visible Features | Status |
|---|---|---|---|---|
| **SHOT-01** | `SHOT-01-storefront.png` | `http://localhost:3000/` | **Customer Storefront Home View:** Header navigation, hero banner, category pills (Fruits, Vegetables, Dairy, Snacks, Beverages), 31 product cards with INR prices and stock badges. | **CAPTURED** |
| **SHOT-02** | `SHOT-02-login.png` | `http://localhost:3000/` | **Authentication Modal:** User login/registration dialog supporting stateless JWT authentication. | **CAPTURED** |
| **SHOT-03** | `SHOT-03-catalogue.png` | `http://localhost:3000/#search` | **Bilingual NLP Smart Search:** Real-time search query ("organic milk") returning filtered catalog items. | **CAPTURED** |
| **SHOT-04** | `SHOT-04-recommendation.png` | `http://localhost:3000/#recommendations` | **Personalized Recommendations:** Top-K hybrid recommendation carousel (Collaborative Filtering + TF-IDF, $\alpha=0.60$). | **CAPTURED** |
| **SHOT-05** | `SHOT-05-checkout.png` | `http://localhost:3000/#cart` | **Cart Drawer & Dynamic Pricing:** Active shopping cart drawer showing unit pricing, subtotal, and checkout action. | **CAPTURED** |
| **SHOT-06** | `SHOT-06-orders.png` | `http://localhost:3000/#orders` | **Orders & Store Tracking:** Customer order status, transaction summary, and delivery tracking. | **CAPTURED** |
| **SHOT-07** | `SHOT-07-admin-dashboard.png` | `http://localhost:3000/admin.html` | **Admin Dashboard Overview:** Executive KPIs (Total Revenue ₹, Orders, Customers, Precision@5), 30-day sales trend chart, category revenue doughnut, top revenue products table. | **CAPTURED** |
| **SHOT-08** | `SHOT-08-demand-forecast.png` | Admin -> `tab-forecasting` | **Time-Series Demand Forecasting:** Product selector, statistical forecast stats, interactive 30-day SARIMAX demand prediction chart. | **CAPTURED** |
| **SHOT-09** | `SHOT-09-dynamic-pricing.png` | Admin -> `tab-pricing-simulator` | **Dynamic Pricing & Elasticity Simulator:** Product selector, interactive pricing slider with $[-50\%, +50\%]$ range, category price elasticity badge, simulated revenue impact. | **CAPTURED** |
| **SHOT-10** | `SHOT-10-fraud-risk.png` | Admin -> `tab-orders-feed` | **Live Orders Feed & Fraud Risk Scoring:** Orders table displaying customer details, total amount, and ML Fraud Risk Assessment badges. | **CAPTURED** |
| **SHOT-11** | `SHOT-11-inventory-optimization.png` | Admin -> `tab-stock-alerts` | **Automated Inventory & Stock Risk Alerts:** Table comparing current stock vs 7-day predicted demand run-rates with AI recommended actions. | **CAPTURED** |
| **SHOT-12** | `SHOT-12-warehouse-route.png` | Admin -> `tab-warehouse-picker` | **Dark Store Warehouse Picker Route Optimization:** Real-time 2D Euclidean coordinate grid, 5 aisle zones, Packing Station start/end, optimized 2D TSP walk path polyline, turn-by-turn pick sequence table, and walk distance savings. | **CAPTURED** |
| **SHOT-13** | `SHOT-13-delivery-route.png` | Admin -> `tab-dispatch-routes` | **Delivery Route Optimizer (VRP / TSP):** Metric cards, multi-stop GPS dispatch map canvas, turn-by-turn itinerary table with leg distances. | **CAPTURED** |
| **SHOT-14** | `SHOT-14-ai-service.png` | Admin -> `ai-service-badge` | **Python AI Gateway Health Status:** Active status indicator confirming live FastAPI microservice connectivity (v2.0.0). | **CAPTURED** |

---

## Quality Assurance & Verification
1. **Resolution:** 1920 × 1080 desktop viewport with 1.25 device scale factor.
2. **Authenticity:** 100% generated from the live running application services (Node.js port 3000, FastAPI port 8000). Zero mock/synthetic screenshots.
3. **Data Security:** No sensitive personal passwords or API secrets exposed.
