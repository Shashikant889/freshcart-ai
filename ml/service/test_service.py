"""
FreshCart AI — Python AI Service Self-Test (FastAPI TestClient)
"""

import sys
from fastapi.testclient import TestClient
from ml.service.app import app

def run_tests():
    print("=================================================================")
    print("  TESTING PYTHON AI MICROSERVICE ENDPOINTS")
    print("=================================================================")
    
    with TestClient(app) as client:
        # 1. Health
        res = client.get("/health")
        assert res.status_code == 200, f"Health failed: {res.text}"
        data = res.json()
        print(f"  ✓ /health: status={data['status']}, models_loaded={data['models_loaded']}")
        
        # 2. Recommendations
        res = client.post("/predict/recommendations", json={"user_id": 1, "top_k": 5})
        assert res.status_code == 200, f"Rec failed: {res.text}"
        data = res.json()
        assert len(data["recommendations"]) == 5
        print(f"  ✓ /predict/recommendations: model={data['model_used']}, recs={len(data['recommendations'])}")
        
        # 3. Demand Forecasting
        res = client.post("/predict/demand", json={"product_id": "p1", "horizon_days": 7})
        assert res.status_code == 200, f"Demand failed: {res.text}"
        data = res.json()
        assert len(data["daily_forecasts"]) == 7
        print(f"  ✓ /predict/demand: model={data['model_used']}, total_units={data['total_forecasted_units']}")
        
        # 4. Dynamic Pricing
        res = client.post("/predict/price", json={"product_id": "f1", "category": "Fruits", "base_price": 120.0})
        assert res.status_code == 200, f"Pricing failed: {res.text}"
        data = res.json()
        print(f"  ✓ /predict/price: base=₹{data['base_price']} -> opt=₹{data['recommended_price']} (Ed={data['price_elasticity']})")
        
        # 5. Fraud Detection
        res = client.post("/predict/fraud", json={
            "total": 4500.0,
            "total_items": 15,
            "unique_skus": 10,
            "max_item_quantity": 3,
            "order_hour": 15,
            "order_dow": 2,
            "user_mean_spend": 800.0,
            "user_velocity_24h": 3,
        })
        assert res.status_code == 200, f"Fraud failed: {res.text}"
        data = res.json()
        print(f"  ✓ /predict/fraud: risk_score={data['risk_score']}%, level={data['risk_level']}")
        
        # 6. Inventory Optimization
        res = client.optimize = client.post("/optimize/inventory", json={
            "sku_id": "f1",
            "name": "Fresh Organic Apples",
            "unit_price": 120.0,
            "avg_daily_demand": 8.5,
            "current_stock": 10,
        })
        assert res.status_code == 200, f"Inventory failed: {res.text}"
        data = res.json()
        print(f"  ✓ /optimize/inventory: EOQ={data['economic_order_quantity']}, ROP={data['reorder_point']}, needs_reorder={data['needs_reorder']}")
        
        # 7. Warehouse Optimization
        res = client.post("/optimize/warehouse", json={"product_ids": ["f1", "d1", "b1", "v2", "s1"]})
        assert res.status_code == 200, f"Warehouse failed: {res.text}"
        data = res.json()
        print(f"  ✓ /optimize/warehouse: items={data['total_items']}, distance={data['total_walking_distance_meters']}m, time={data['estimated_pick_time_seconds']}s")
        
        # 8. Delivery Optimization
        res = client.post("/optimize/delivery", json={
            "orders": [
                {"id": "ORD_01", "name": "Customer 1", "lat": 19.080, "lng": 72.880, "demand": 3.0},
                {"id": "ORD_02", "name": "Customer 2", "lat": 19.090, "lng": 72.890, "demand": 4.5},
                {"id": "ORD_03", "name": "Customer 3", "lat": 19.070, "lng": 72.860, "demand": 2.0},
            ]
        })
        assert res.status_code == 200, f"Delivery failed: {res.text}"
        data = res.json()
        print(f"  ✓ /optimize/delivery: vehicles={data['num_vehicles_used']}, total_km={data['total_fleet_distance_km']}km, util={data['fleet_capacity_utilization_pct']}%")

    print("=================================================================")
    print("  ALL 8 PYTHON SERVICE ENDPOINTS VERIFIED SUCCESSFULLY!")
    print("=================================================================")

if __name__ == "__main__":
    run_tests()
