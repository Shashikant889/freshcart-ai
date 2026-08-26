import os
import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

def capture_screenshots():
    out_dir = "docs/academic/screenshots"
    os.makedirs(out_dir, exist_ok=True)
    
    print("================================================================")
    print("  CAPTURING AUTHENTIC APPLICATION SCREENSHOTS VIA PLAYWRIGHT")
    print("================================================================")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=1.25)
        page = context.new_page()
        
        # 1. SHOT-01: Customer Storefront Home Page
        print("[CAPTURE] SHOT-01: Customer Storefront...")
        page.goto("http://localhost:3000/", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=f"{out_dir}/SHOT-01-storefront.png")
        print("  [SAVED] SHOT-01-storefront.png")
        
        # 2. SHOT-02: Login / Authentication View
        print("[CAPTURE] SHOT-02: Authentication / Login Modal...")
        page.goto("http://localhost:3000/", wait_until="networkidle")
        try:
            page.evaluate("if (typeof openLoginModal === 'function') openLoginModal(); else document.querySelector('#btn-login-modal, .btn-login, #user-btn')?.click();")
            page.wait_for_timeout(800)
        except Exception as e:
            print("  Note on login modal:", e)
        page.screenshot(path=f"{out_dir}/SHOT-02-login.png")
        print("  [SAVED] SHOT-02-login.png")
            
        # 3. SHOT-03: Product Catalogue & Smart Search
        print("[CAPTURE] SHOT-03: Product Catalogue & NLP Search...")
        page.goto("http://localhost:3000/", wait_until="networkidle")
        try:
            search_input = page.query_selector("#search-input, .search-bar input, input[type='search']")
            if search_input:
                search_input.fill("organic milk")
                page.keyboard.press("Enter")
                page.wait_for_timeout(1000)
        except Exception as e:
            print("  Note on search:", e)
        page.screenshot(path=f"{out_dir}/SHOT-03-catalogue.png")
        print("  [SAVED] SHOT-03-catalogue.png")
            
        # 4. SHOT-04: Personalized Recommendation Section
        print("[CAPTURE] SHOT-04: Personalized Recommendation Section...")
        page.goto("http://localhost:3000/", wait_until="networkidle")
        page.evaluate("window.scrollTo(0, 650)")
        page.wait_for_timeout(1000)
        page.screenshot(path=f"{out_dir}/SHOT-04-recommendation.png")
        print("  [SAVED] SHOT-04-recommendation.png")
            
        # 5. SHOT-05: Cart / Checkout Drawer
        print("[CAPTURE] SHOT-05: Cart & Dynamic Pricing Checkout...")
        page.goto("http://localhost:3000/", wait_until="networkidle")
        try:
            # Add an item to cart and open cart
            page.evaluate("document.querySelector('.btn-add-cart, button[data-action=\"add-to-cart\"], .product-card button')?.click();")
            page.wait_for_timeout(1000)
            page.evaluate("document.querySelector('#cart-sidebar')?.classList.add('open');")
            page.wait_for_timeout(600)
        except Exception as e:
            print("  Note on cart:", e)
        page.screenshot(path=f"{out_dir}/SHOT-05-checkout.png")
        print("  [SAVED] SHOT-05-checkout.png")
            
        # 6. SHOT-06: Order Confirmation & Orders Tracking
        print("[CAPTURE] SHOT-06: Order Confirmation / Store Tracking...")
        page.goto("http://localhost:3000/", wait_until="networkidle")
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(800)
        page.screenshot(path=f"{out_dir}/SHOT-06-orders.png")
        print("  [SAVED] SHOT-06-orders.png")
            
        # Authenticate Admin before capturing Admin views
        print("[AUTH] Logging in as Administrator (admin@freshcart.com)...")
        page.goto("http://localhost:3000/", wait_until="networkidle")
        page.evaluate("""async () => {
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'admin@freshcart.com', password: 'admin123' })
                });
                const d = await res.json();
                if (d.success && d.data && d.data.token) {
                    localStorage.setItem('freshcart_token', d.data.token);
                    localStorage.setItem('freshcart_user', JSON.stringify(d.data.user));
                }
            } catch (e) {
                console.error(e);
            }
        }""")
        page.wait_for_timeout(600)

        # 7. SHOT-07: Admin Dashboard Overview
        print("[CAPTURE] SHOT-07: Admin Dashboard Overview...")
        page.goto("http://localhost:3000/admin.html", wait_until="networkidle")
        page.wait_for_timeout(2000)
        page.screenshot(path=f"{out_dir}/SHOT-07-admin-dashboard.png")
        print("  [SAVED] SHOT-07-admin-dashboard.png")
        
        # 8. SHOT-08: Demand Forecasting Dashboard
        print("[CAPTURE] SHOT-08: Demand Forecasting Dashboard...")
        page.evaluate("document.querySelector(\"button[data-tab='forecasting']\")?.click();")
        page.wait_for_timeout(2000)
        page.screenshot(path=f"{out_dir}/SHOT-08-demand-forecast.png")
        print("  [SAVED] SHOT-08-demand-forecast.png")
            
        # 9. SHOT-09: Dynamic Pricing & Elasticity Sandbox
        print("[CAPTURE] SHOT-09: Dynamic Pricing Simulator...")
        page.evaluate("document.querySelector(\"button[data-tab='pricing-simulator']\")?.click();")
        page.wait_for_timeout(1500)
        page.screenshot(path=f"{out_dir}/SHOT-09-dynamic-pricing.png")
        print("  [SAVED] SHOT-09-dynamic-pricing.png")
            
        # 10. SHOT-10: Live Orders & Fraud Risk Scoring
        print("[CAPTURE] SHOT-10: Live Orders Feed & Fraud Detection...")
        page.evaluate("document.querySelector(\"button[data-tab='orders-feed']\")?.click();")
        page.wait_for_timeout(1500)
        page.screenshot(path=f"{out_dir}/SHOT-10-fraud-risk.png")
        print("  [SAVED] SHOT-10-fraud-risk.png")
            
        # 11. SHOT-11: Inventory Optimization & Stock Alerts
        print("[CAPTURE] SHOT-11: Inventory Optimization & Alerts...")
        page.evaluate("document.querySelector(\"button[data-tab='stock-alerts']\")?.click();")
        page.wait_for_timeout(1500)
        page.screenshot(path=f"{out_dir}/SHOT-11-inventory-optimization.png")
        print("  [SAVED] SHOT-11-inventory-optimization.png")
            
        # 12. SHOT-12: Warehouse Picker Route (2D TSP)
        print("[CAPTURE] SHOT-12: Dark Store Warehouse Picker Route (2D TSP)...")
        page.evaluate("document.querySelector(\"button[data-tab='warehouse-picker']\")?.click();")
        page.wait_for_timeout(1500)
        page.screenshot(path=f"{out_dir}/SHOT-12-warehouse-route.png")
        print("  [SAVED] SHOT-12-warehouse-route.png")
            
        # 13. SHOT-13: Delivery Route Optimizer (VRP)
        print("[CAPTURE] SHOT-13: Delivery Route Optimizer (VRP)...")
        page.evaluate("document.querySelector(\"button[data-tab='dispatch-routes']\")?.click();")
        page.wait_for_timeout(1500)
        page.evaluate("document.querySelector('#btn-reoptimize-routes')?.click();")
        page.wait_for_timeout(1000)
        page.screenshot(path=f"{out_dir}/SHOT-13-delivery-route.png")
        print("  [SAVED] SHOT-13-delivery-route.png")
            
        # 14. SHOT-14: AI Service Status / Gateway Health
        print("[CAPTURE] SHOT-14: AI Gateway Status Badge...")
        page.goto("http://localhost:3000/admin.html", wait_until="networkidle")
        page.wait_for_timeout(1500)
        page.screenshot(path=f"{out_dir}/SHOT-14-ai-service.png")
        print("  [SAVED] SHOT-14-ai-service.png")
            
        browser.close()
        
    print("================================================================")
    print("  ALL 14 SCREENSHOTS CAPTURED SUCCESSFULLY IN docs/academic/screenshots/")
    print("================================================================")

if __name__ == "__main__":
    capture_screenshots()
