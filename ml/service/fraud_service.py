"""
FreshCart AI — Transaction Fraud Detection Service Handler
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List
from ml.service.model_loader import registry
from ml.service.schemas import FraudScoreRequest, FraudScoreResponse

def score_transaction_fraud(req: FraudScoreRequest) -> FraudScoreResponse:
    """
    Score order transaction for fraud and anomalous behavior using Random Forest classifier.
    """
    model = registry.get_model("fraud_detection")
    metadata = registry.get_metadata("fraud_detection")
    
    is_fallback = False
    risk_score = 12.0
    contributing_factors: List[str] = []
    
    # Feature construction
    user_mean = req.user_mean_spend or (req.total * 0.70)
    spend_ratio = req.total / (user_mean + 1e-5)
    
    if spend_ratio > 2.5:
        contributing_factors.append(f"High order total vs user history ({spend_ratio:.1f}x normal)")
    if req.total_items > 25:
        contributing_factors.append(f"Abnormal bulk quantity ({req.total_items} items)")
    if req.user_velocity_24h >= 4:
        contributing_factors.append(f"Rapid velocity ({req.user_velocity_24h} orders in 24h)")
    if req.order_hour is not None and (req.order_hour >= 1 and req.order_hour <= 4):
        contributing_factors.append("Late night order window (1:00 AM - 4:00 AM)")
    if (req.delivery_distance_km or 0.0) > 15.0:
        contributing_factors.append(f"Extended delivery distance ({req.delivery_distance_km:.1f} km)")
        
    if model is not None:
        try:
            feat_df = pd.DataFrame([{
                "total": req.total,
                "total_items": req.total_items,
                "unique_skus": req.unique_skus,
                "max_item_quantity": req.max_item_quantity,
                "order_hour": req.order_hour if req.order_hour is not None else 14,
                "order_dow": req.order_dow if req.order_dow is not None else 3,
                "is_weekend": 1 if req.order_dow in [5, 6] else 0,
                "user_mean_spend": user_mean,
                "spend_to_user_mean_ratio": spend_ratio,
                "user_velocity_24h": req.user_velocity_24h,
                "delivery_distance_km": req.delivery_distance_km or 5.0,
            }])
            
            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(feat_df)
                fraud_prob = float(probs[0, 1])
                risk_score = round(fraud_prob * 100.0, 1)
            else:
                risk_score = 45.0 if contributing_factors else 10.0
        except Exception as e:
            print(f"[WARN] Error running ML fraud model: {e}")
            is_fallback = True
    else:
        is_fallback = True
        
    if is_fallback:
        # Rule-based fallback calculation
        base = 5.0
        if spend_ratio > 2.5:
            base += 35.0
        if req.user_velocity_24h >= 4:
            base += 30.0
        if req.total_items > 25:
            base += 20.0
        risk_score = min(99.0, base)
        
    if risk_score >= 65.0:
        risk_level = "HIGH"
        is_anomaly = True
    elif risk_score >= 35.0:
        risk_level = "MEDIUM"
        is_anomaly = False
    else:
        risk_level = "LOW"
        is_anomaly = False
        
    if not contributing_factors:
        contributing_factors.append("Standard transaction profile within normal bounds")
        
    return FraudScoreResponse(
        success=True,
        order_id=req.order_id,
        risk_score=risk_score,
        risk_level=risk_level,
        is_anomaly=is_anomaly,
        contributing_factors=contributing_factors,
        model_used=metadata.get("model_name", "Random Forest Classifier") if not is_fallback else "Statistical Z-Score Fallback",
        is_fallback=is_fallback,
    )
