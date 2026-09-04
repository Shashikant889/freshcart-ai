"""
AI-Driven Intelligent Grocery Retail System — FastAPI Inference & Operations Optimization Microservice
"""

import time
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware

from ml.service.config import SERVICE_NAME, SERVICE_VERSION, API_VERSION, SERVICE_HOST, SERVICE_PORT
from ml.service.model_loader import registry
from ml.service.schemas import (
    HealthResponse,
    RecommendationRequest,
    RecommendationResponse,
    DemandForecastRequest,
    DemandForecastResponse,
    DeepDemandResponse,
    PriceRecommendationRequest,
    PriceRecommendationResponse,
    FraudScoreRequest,
    FraudScoreResponse,
    InventoryOptimizationRequest,
    InventoryOptimizationResponse,
    WarehouseOptimizationRequest,
    WarehouseOptimizationResponse,
    DeliveryOptimizationRequest,
    DeliveryOptimizationResponse,
    RAGQueryRequest,
    RAGQueryResponse,
)
from ml.service.recommendation_service import get_recommendations
from ml.service.demand_service import get_demand_forecast, get_deep_learning_forecast
from ml.service.pricing_service import get_price_recommendation
from ml.service.fraud_service import score_transaction_fraud
from ml.service.optimization_service import optimize_inventory, optimize_warehouse, optimize_delivery
from ml.service.rag_service import process_rag_query, rag_retriever
from ml.service.vision_service import vision_engine
from ml.service.bda_service import bda_engine
from ml.service.rl_inventory_service import rl_engine
from ml.service.sasrec_service import sasrec_engine
from ml.service.knowledge_graph_service import kg_engine
from ml.service.bandit_service import bandit_engine



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup into memory and index RAG documents."""
    print("=================================================================")
    print(f"  Starting {SERVICE_NAME} v{SERVICE_VERSION}")
    print("=================================================================")
    registry.load_all_models()
    rag_retriever.build_index()
    print(f"  [RAG] Indexed {len(rag_retriever.chunks)} chunks across local knowledge corpus.")
    yield
    print(f"  Shutting down {SERVICE_NAME}")


app = FastAPI(
    title=SERVICE_NAME,
    version=SERVICE_VERSION,
    description="Inference, Deep Learning, RAG, and Operations Optimization API for AI-Driven Intelligent Grocery Retail System.",
    lifespan=lifespan,
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Service health and model load status endpoint."""
    status_dict = registry.get_status()
    status_dict["rag_retriever"] = len(rag_retriever.chunks) > 0
    status_dict["deep_lstm"] = True
    return HealthResponse(
        status="healthy",
        service=SERVICE_NAME,
        version=SERVICE_VERSION,
        models_loaded=status_dict,
        timestamp=datetime.now().isoformat(),
    )


@app.post("/predict/recommendations", response_model=RecommendationResponse, tags=["ML Inference"])
def predict_recommendations(req: RecommendationRequest):
    """Personalized Top-K Recommendations using trained Hybrid Ensemble (CF + CB)."""
    try:
        return get_recommendations(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/predict/demand", response_model=DemandForecastResponse, tags=["ML Inference"])
def predict_demand(req: DemandForecastRequest):
    """Multi-step daily demand forecasting using trained SARIMAX/Regression model."""
    try:
        return get_demand_forecast(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.get("/predict/deep-demand", response_model=DeepDemandResponse, tags=["Deep Learning"])
def predict_deep_demand():
    """Genuine PyTorch Multivariate 2-Layer LSTM Forward Pass with 95% Confidence Intervals."""
    try:
        return get_deep_learning_forecast()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/rag/query", response_model=RAGQueryResponse, tags=["RAG & Knowledge"])
def query_rag(req: RAGQueryRequest):
    """True Local RAG Pipeline: Dense + BM25 Hybrid Retrieval with Citations and Injection Defense."""
    try:
        return process_rag_query(req.query, req.max_tokens or 250)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.get("/rag/chunks", tags=["RAG & Knowledge"])
def get_rag_chunks():
    """Return all indexed document chunks and metadata for AI Command Center inspection."""
    return {
        "total_chunks": len(rag_retriever.chunks),
        "documents_indexed": list(set(c.doc_name for c in rag_retriever.chunks)),
        "chunks": [
            {
                "chunk_id": c.chunk_id,
                "document": c.doc_name,
                "section": c.section,
                "token_count": len(c.tokens),
                "snippet": c.text[:140] + "...",
            }
            for c in rag_retriever.chunks
        ],
    }


@app.post("/predict/price", response_model=PriceRecommendationResponse, tags=["ML Inference"])
def predict_price(req: PriceRecommendationRequest):
    """Dynamic Price Elasticity and optimal pricing recommendation under bounds."""
    try:
        return get_price_recommendation(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/predict/fraud", response_model=FraudScoreResponse, tags=["ML Inference"])
def predict_fraud(req: FraudScoreRequest):
    """Order fraud risk scoring and anomaly detection using Random Forest classifier."""
    try:
        return score_transaction_fraud(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/optimize/inventory", response_model=InventoryOptimizationResponse, tags=["Optimization"])
def api_optimize_inventory(req: InventoryOptimizationRequest):
    """Multi-item EOQ and stochastic safety stock reorder point (ROP) optimization."""
    try:
        return optimize_inventory(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/optimize/warehouse", response_model=WarehouseOptimizationResponse, tags=["Optimization"])
def api_optimize_warehouse(req: WarehouseOptimizationRequest):
    """Dark store picker walking route optimization using 2D TSP and 2-Opt."""
    try:
        return optimize_warehouse(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/optimize/delivery", response_model=DeliveryOptimizationResponse, tags=["Optimization"])
def api_optimize_delivery(req: DeliveryOptimizationRequest):
    """Last-mile urban fleet routing using Capacitated VRP (Clarke-Wright + 2-Opt)."""
    try:
        return optimize_delivery(req)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/predict/vision-search", tags=["Computer Vision"])
def api_vision_search(payload: dict):
    """Computer vision feature extraction and visual similarity matching."""
    try:
        query_hint = payload.get("query_hint", "red fruit")
        top_k = int(payload.get("top_k", 4))
        matches = vision_engine.search_by_visual_features(query_hint=query_hint, top_k=top_k)
        return {
            "query_hint": query_hint,
            "feature_space": "5-Channel [R, G, B, Brightness, Saturation]",
            "distance_metric": "Cosine Similarity",
            "matches": matches,
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/predict/fridge-scan", tags=["Computer Vision"])
def api_fridge_scan(payload: dict):
    """Multimodal refrigerator inventory depletion detection and replenishment generator."""
    try:
        scene_key = payload.get("scene_key", "breakfast_depleted")
        return vision_engine.analyze_fridge_inventory(scene_key=scene_key)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# -------------------------------------------------------------
# Big Data Analytics (BDA) Endpoints
# -------------------------------------------------------------
@app.get("/bda/cube", tags=["Big Data Analytics"])
def api_bda_cube():
    """Returns summarized Big Data OLAP Cube metrics."""
    return bda_engine.get_summary_metrics()


@app.api_route("/bda/slice-dice", methods=["GET", "POST"], tags=["Big Data Analytics"])
async def api_bda_slice_dice(request: Request):
    """Executes multidimensional slice-and-dice query across dark store hubs and categories."""
    payload = {}
    if request.method == "POST":
        try:
            payload = await request.json()
        except Exception:
            payload = {}
    else:
        payload = dict(request.query_params)
    hub = payload.get("hub_filter", payload.get("hub", "all"))
    cat = payload.get("category_filter", payload.get("category", "all"))
    tier = payload.get("tier_filter", payload.get("tier", "all"))
    return bda_engine.slice_and_dice(hub_filter=hub, category_filter=cat, tier_filter=tier)


@app.api_route("/bda/map-reduce", methods=["GET", "POST"], tags=["Big Data Analytics"])
async def api_bda_map_reduce(request: Request):
    """Simulates distributed MapReduce aggregation pipeline over streaming sales events."""
    payload = {}
    if request.method == "POST":
        try:
            payload = await request.json()
        except Exception:
            payload = {}
    else:
        payload = dict(request.query_params)
    group_by = payload.get("group_by", payload.get("mapper", "category"))
    if group_by in ["CATEGORY_SALES_AGG", "category"]:
        group_by = "category"
    elif group_by in ["CHANNEL_LATENCY", "fulfillment", "channel"]:
        group_by = "fulfillment"
    return {"group_by": group_by, "results": bda_engine.map_reduce_aggregate(group_by=group_by)}


# -------------------------------------------------------------
# Reinforcement Learning Inventory Policy Endpoints
# -------------------------------------------------------------
@app.get("/rl/policy", tags=["Reinforcement Learning"])
def api_rl_policy():
    """Returns converged Bellman Q-Learning policy map and comparative waste reduction metrics."""
    return rl_engine.get_optimal_policy_map()


@app.api_route("/rl/simulate", methods=["GET", "POST"], tags=["Reinforcement Learning"])
async def api_rl_simulate(request: Request):
    """Simulates autonomous restock decision based on state."""
    payload = {}
    if request.method == "POST":
        try:
            payload = await request.json()
        except Exception:
            payload = {}
    else:
        payload = dict(request.query_params)
    stock = int(payload.get("current_stock", payload.get("initial_stock", 25)))
    demand = int(payload.get("forecasted_demand", payload.get("demand", 150)))
    expiry = int(payload.get("days_to_expiry", payload.get("shelf_life", 3)))
    return rl_engine.simulate_order_decision(stock, demand, expiry)


# -------------------------------------------------------------
# SASRec Sequential Recommendation Endpoints
# -------------------------------------------------------------
@app.api_route("/sasrec/predict", methods=["GET", "POST"], tags=["Sequential Recommendation"])
async def api_sasrec_predict(request: Request):
    """Self-Attentive Sequential Recommendation for user session trajectories."""
    payload = {}
    if request.method == "POST":
        try:
            payload = await request.json()
        except Exception:
            payload = {}
    else:
        payload = dict(request.query_params)
    raw_seq = payload.get("sequence_ids", payload.get("sequence", ["p3", "p4"]))
    if isinstance(raw_seq, str):
        raw_seq = [s.strip() for s in raw_seq.split(",") if s.strip()]
    cleaned_seq = []
    for item in raw_seq:
        s_item = str(item)
        if not s_item.startswith("p") and s_item.isdigit():
            cleaned_seq.append(f"p{s_item}")
        else:
            cleaned_seq.append(s_item)
    return sasrec_engine.predict_next_item(sequence_ids=cleaned_seq or ["p3", "p4"])


# -------------------------------------------------------------
# Heterogeneous Product Knowledge Graph (PKG) Endpoints
# -------------------------------------------------------------
@app.get("/kg/graph", tags=["Knowledge Graph"])
def api_kg_graph():
    """Returns 2D force-directed knowledge graph of products, categories, allergens, and recipes."""
    return kg_engine.get_full_graph()


@app.api_route("/kg/substitutes/{product_id}", methods=["GET", "POST"], tags=["Knowledge Graph"])
def api_kg_substitutes(product_id: str):
    """Multi-hop semantic graph traversal for allergen-safe substitutions."""
    p_id = product_id if str(product_id).startswith("p") else f"p{product_id}"
    return kg_engine.find_substitutes(product_id=p_id)


# -------------------------------------------------------------
# Multi-Armed Bandit (Thompson Sampling) Endpoints
# -------------------------------------------------------------
@app.api_route("/bandit/sample", methods=["GET", "POST"], tags=["Multi-Armed Bandit"])
def api_bandit_sample():
    """Bayesian Beta-Bernoulli Thompson Sampling for dynamic hero promotion selection."""
    return bandit_engine.select_best_arm()


@app.api_route("/bandit/feedback", methods=["GET", "POST"], tags=["Multi-Armed Bandit"])
async def api_bandit_feedback(request: Request):
    """Instant Bayesian posterior update on click/conversion feedback."""
    payload = {}
    if request.method == "POST":
        try:
            payload = await request.json()
        except Exception:
            payload = {}
    else:
        payload = dict(request.query_params)
    arm_id = payload.get("arm_id", "free_shipping")
    reward_raw = payload.get("reward", payload.get("converted", False))
    converted = bool(reward_raw == 1 or reward_raw == "1" or reward_raw is True or reward_raw == "true")
    return bandit_engine.record_feedback(arm_id=arm_id, converted=converted)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ml.service.app:app", host=SERVICE_HOST, port=SERVICE_PORT, reload=False)

