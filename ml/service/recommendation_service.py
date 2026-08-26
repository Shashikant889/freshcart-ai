"""
FreshCart AI — Recommendation Inference Service Handler
"""

import numpy as np
from typing import List, Dict, Any, Optional
from ml.service.model_loader import registry
from ml.service.schemas import RecommendationRequest, RecommendationResponse, RecommendedItem
from ml.python.data_loader import load_products_df, load_user_interactions_df

# Cache product catalog metadata
_products_df = None

def get_products():
    global _products_df
    if _products_df is None:
        try:
            _products_df = load_products_df()
        except Exception:
            _products_df = None
    return _products_df

def get_recommendations(req: RecommendationRequest) -> RecommendationResponse:
    """
    Generate Top-K recommendations using the trained best hybrid/content model.
    Falls back gracefully to popularity or category-based ranking for cold-start cases.
    """
    model = registry.get_model("recommendation")
    metadata = registry.get_metadata("recommendation")
    model_name = metadata.get("model_name", "Hybrid Ensemble (CF + CB)")
    
    products_df = get_products()
    catalog_items = {}
    if products_df is not None:
        for _, row in products_df.iterrows():
            catalog_items[row["id"]] = {
                "name": row["name"],
                "category": row["category"],
                "price": float(row["price"]),
            }
            
    is_fallback = False
    recs: List[RecommendedItem] = []
    
    if model is not None:
        try:
            # Map user ID to matrix index if available
            u_idx = 0
            if req.user_id is not None:
                u_idx = (req.user_id - 1) % 50  # 50 trained persona indices
                
            raw_pids = model.recommend(user_idx=u_idx, top_k=req.top_k)
            
            for rank, pid in enumerate(raw_pids[:req.top_k], start=1):
                p_info = catalog_items.get(pid, {"name": f"Product {pid}", "category": "Grocery", "price": 99.0})
                
                # Apply category filter if requested
                if req.category_filter and p_info.get("category", "").lower() != req.category_filter.lower():
                    continue
                    
                score = round(1.0 - (rank * 0.05), 2)
                recs.append(RecommendedItem(
                    product_id=pid,
                    name=p_info.get("name"),
                    category=p_info.get("category"),
                    price=p_info.get("price"),
                    score=score,
                    reason="Frequently bought by shoppers like you" if rank <= 3 else "Popular in your favorite categories",
                ))
        except Exception as e:
            print(f"[WARN] Error running ML recommendation model: {e}")
            is_fallback = True
    else:
        is_fallback = True
        
    # Cold-start fallback
    if is_fallback or not recs:
        is_fallback = True
        fallback_pids = ["f1", "d1", "b1", "v2", "s1", "f2", "d3", "v1", "b2", "s2"]
        for rank, pid in enumerate(fallback_pids[:req.top_k], start=1):
            p_info = catalog_items.get(pid, {"name": f"Product {pid}", "category": "Grocery", "price": 99.0})
            recs.append(RecommendedItem(
                product_id=pid,
                name=p_info.get("name"),
                category=p_info.get("category"),
                price=p_info.get("price"),
                score=round(1.0 - (rank * 0.07), 2),
                reason="Popular Daily Essential",
            ))
            
    return RecommendationResponse(
        success=True,
        model_used=model_name if not is_fallback else "Popularity Fallback Baseline",
        version="2.0",
        recommendations=recs[:req.top_k],
        is_fallback=is_fallback,
        metadata={"total_recommended": len(recs), "requested_k": req.top_k},
    )
