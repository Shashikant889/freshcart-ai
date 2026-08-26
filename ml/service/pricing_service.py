"""
FreshCart AI — Dynamic Pricing & Elasticity Service Handler
"""

from typing import Dict, Any
from ml.service.model_loader import registry
from ml.service.schemas import PriceRecommendationRequest, PriceRecommendationResponse

def get_price_recommendation(req: PriceRecommendationRequest) -> PriceRecommendationResponse:
    """
    Recommend revenue-optimal dynamic price P* based on econometric Price Elasticity (Ed) under business bounds.
    """
    model = registry.get_model("pricing")
    metadata = registry.get_metadata("pricing")
    
    is_fallback = False
    opt_p = req.base_price
    ed = -1.10
    
    cat = req.category.capitalize()
    if cat not in metadata:
        # Check lowercase / alternative casing
        for k in metadata.keys():
            if k.lower() == req.category.lower():
                cat = k
                break
                
    if model is not None and hasattr(model, "compute_optimal_price"):
        try:
            bounds = (req.min_price_ratio - 1.0, req.max_price_ratio - 1.0)
            cost = req.cost if req.cost is not None else (req.base_price * 0.60)
            opt_p, ed = model.compute_optimal_price(
                base_price=req.base_price,
                category=cat,
                cost=cost,
                bounds=bounds,
            )
        except Exception as e:
            print(f"[WARN] Error running pricing model: {e}")
            is_fallback = True
    else:
        is_fallback = True
        
    if is_fallback:
        # Rule-based fallback elasticity
        ed = -1.15
        opt_p = req.base_price * 1.05
        
    price_change_pct = ((opt_p - req.base_price) / req.base_price) * 100.0
    demand_multiplier = float((opt_p / req.base_price) ** ed)
    demand_type = "Price Elastic (|Ed| > 1)" if abs(ed) > 1.0 else "Inelastic (|Ed| <= 1)"
    
    return PriceRecommendationResponse(
        success=True,
        product_id=req.product_id,
        category=req.category,
        base_price=round(req.base_price, 2),
        recommended_price=round(opt_p, 2),
        price_change_pct=round(price_change_pct, 2),
        price_elasticity=round(ed, 3),
        demand_type=demand_type,
        estimated_demand_multiplier=round(demand_multiplier, 3),
        model_used="Log-Log OLS Elasticity Optimizer" if not is_fallback else "Rule-based Pricing Fallback",
        is_fallback=is_fallback,
    )
