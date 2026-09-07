"""
FreshCart AI — Recommendation Inference Service Handler
"""

import numpy as np
from typing import List, Dict, Any, Optional
from ml.service.model_loader import registry
from ml.service.schemas import RecommendationRequest, RecommendationResponse, RecommendedItem
from ml.python.data_loader import load_products_df, load_user_interactions_df

import sqlite3
from ml.python.config import DB_PATH

# Cache only queried product items in memory
_cached_items: Dict[str, Dict[str, Any]] = {}

def get_items_by_ids(pids: List[str]) -> Dict[str, Dict[str, Any]]:
    missing = [pid for pid in pids if pid not in _cached_items]
    if missing:
        try:
            conn = sqlite3.connect(str(DB_PATH))
            placeholders = ','.join(['?'] * len(missing))
            cursor = conn.cursor()
            cursor.execute(f"SELECT id, name, category, price FROM products WHERE id IN ({placeholders})", missing)
            for row in cursor.fetchall():
                _cached_items[row[0]] = {"name": row[1], "category": row[2], "price": float(row[3])}
            conn.close()
        except Exception as e:
            print(f"[WARN] Error fetching items by ids: {e}")
    return _cached_items

def get_recommendations(req: RecommendationRequest) -> RecommendationResponse:
    """
    Generate Top-K recommendations using the trained best hybrid/content model.
    Falls back gracefully to popularity or category-based ranking for cold-start cases.
    """
    model = registry.get_model("recommendation")
    metadata = registry.get_metadata("recommendation")
    model_name = metadata.get("model_name", "Hybrid Ensemble (CF + CB)")
    
    is_fallback = False
    recs: List[RecommendedItem] = []
    
    if model is not None:
        try:
            # Map user ID to matrix index if available
            u_idx = 0
            if req.user_id is not None:
                u_idx = (req.user_id - 1) % 50  # 50 trained persona indices
                
            raw_pids = model.recommend(user_idx=u_idx, top_k=req.top_k)
            candidate_pids = [str(p) for p in raw_pids[:req.top_k * 2]]
            catalog_items = get_items_by_ids(candidate_pids)
            
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
        catalog_items = get_items_by_ids(fallback_pids)
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
