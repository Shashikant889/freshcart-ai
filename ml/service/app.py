"""
FreshCart AI — FastAPI Inference & Operations Optimization Microservice
"""

import time
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from ml.service.config import SERVICE_NAME, SERVICE_VERSION, API_VERSION, SERVICE_HOST, SERVICE_PORT
from ml.service.model_loader import registry
from ml.service.schemas import (
    HealthResponse,
    RecommendationRequest,
    RecommendationResponse,
    DemandForecastRequest,
    DemandForecastResponse,
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
)
from ml.service.recommendation_service import get_recommendations
from ml.service.demand_service import get_demand_forecast
from ml.service.pricing_service import get_price_recommendation
from ml.service.fraud_service import score_transaction_fraud
from ml.service.optimization_service import optimize_inventory, optimize_warehouse, optimize_delivery


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup into memory."""
    print("=================================================================")
    print(f"  Starting {SERVICE_NAME} v{SERVICE_VERSION}")
    print("=================================================================")
    registry.load_all_models()
    yield
    print(f"  Shutting down {SERVICE_NAME}")


app = FastAPI(
    title=SERVICE_NAME,
    version=SERVICE_VERSION,
    description="Inference and operations optimization API for FreshCart AI intelligent grocery platform.",
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
    return HealthResponse(
        status="healthy",
        service=SERVICE_NAME,
        version=SERVICE_VERSION,
        models_loaded=registry.get_status(),
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ml.service.app:app", host=SERVICE_HOST, port=SERVICE_PORT, reload=False)
