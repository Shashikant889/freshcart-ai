"""
FreshCart AI — Pydantic Schemas for AI Inference & Optimization APIs
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

# Health Schema
class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "FreshCart AI Inference Service"
    version: str = "2.0.0"
    models_loaded: Dict[str, bool]
    timestamp: str

# 1. Recommendation Schemas
class RecommendationRequest(BaseModel):
    user_id: Optional[int] = Field(None, description="Customer user ID for personalized CF recommendations")
    cart_items: Optional[List[str]] = Field(default=[], description="List of product IDs currently in cart")
    top_k: int = Field(default=10, ge=1, le=50, description="Number of recommendations to return")
    category_filter: Optional[str] = Field(None, description="Optional category filter")

class RecommendedItem(BaseModel):
    product_id: str
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    score: Optional[float] = None
    reason: Optional[str] = None

class RecommendationResponse(BaseModel):
    success: bool = True
    model_used: str
    version: str = "1.0"
    recommendations: List[RecommendedItem]
    is_fallback: bool = False
    metadata: Dict[str, Any] = {}

# 2. Demand Forecasting Schemas
class DemandForecastRequest(BaseModel):
    product_id: Optional[str] = Field(None, description="Optional specific product SKU ID")
    historical_sales: Optional[List[float]] = Field(None, description="Optional custom recent historical daily sales sequence")
    horizon_days: int = Field(default=7, ge=1, le=60, description="Number of future days to forecast")

class DailyForecastPoint(BaseModel):
    day_offset: int
    predicted_quantity: float

class DemandForecastResponse(BaseModel):
    success: bool = True
    model_used: str
    horizon_days: int
    total_forecasted_units: float
    daily_forecasts: List[DailyForecastPoint]
    is_fallback: bool = False
    metadata: Dict[str, Any] = {}

# 3. Dynamic Pricing Schemas
class PriceRecommendationRequest(BaseModel):
    product_id: str
    category: str
    base_price: float = Field(..., gt=0.0)
    cost: Optional[float] = Field(None, description="Wholesale unit cost")
    min_price_ratio: float = Field(default=0.75, ge=0.5, le=1.0)
    max_price_ratio: float = Field(default=1.25, ge=1.0, le=1.5)

class PriceRecommendationResponse(BaseModel):
    success: bool = True
    product_id: str
    category: str
    base_price: float
    recommended_price: float
    price_change_pct: float
    price_elasticity: float
    demand_type: str
    estimated_demand_multiplier: float
    model_used: str
    disclaimer: str = "SIMULATED / MODEL-BASED ESTIMATE under Constant Elasticity of Demand (CED)"
    is_fallback: bool = False

# 4. Fraud Detection Schemas
class FraudScoreRequest(BaseModel):
    order_id: Optional[str] = None
    user_id: Optional[int] = None
    total: float = Field(..., ge=0.0)
    total_items: int = Field(default=1, ge=1)
    unique_skus: int = Field(default=1, ge=1)
    max_item_quantity: int = Field(default=1, ge=1)
    order_hour: Optional[int] = Field(None, ge=0, le=23)
    order_dow: Optional[int] = Field(None, ge=0, le=6)
    user_mean_spend: Optional[float] = Field(None, ge=0.0)
    user_velocity_24h: Optional[int] = Field(default=1, ge=0)
    delivery_distance_km: Optional[float] = Field(default=5.0, ge=0.0)

class FraudScoreResponse(BaseModel):
    success: bool = True
    order_id: Optional[str] = None
    risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: str  # "LOW", "MEDIUM", "HIGH"
    is_anomaly: bool
    contributing_factors: List[str]
    model_used: str
    is_fallback: bool = False

# 5. Inventory Optimization Schemas
class InventoryOptimizationRequest(BaseModel):
    sku_id: str
    name: Optional[str] = "Item"
    unit_price: float = Field(..., gt=0.0)
    avg_daily_demand: float = Field(..., gt=0.0)
    std_daily_demand: Optional[float] = Field(default=2.0, ge=0.0)
    lead_time_days: float = Field(default=2.0, ge=0.5)
    lead_time_std: float = Field(default=0.5, ge=0.0)
    current_stock: int = Field(default=0, ge=0)
    service_level: float = Field(default=0.95, ge=0.80, le=0.99)
    ordering_cost_per_po: float = Field(default=350.0, gt=0.0)
    annual_holding_rate: float = Field(default=0.20, gt=0.0)

class InventoryOptimizationResponse(BaseModel):
    success: bool = True
    sku_id: str
    name: str
    economic_order_quantity: int
    safety_stock: int
    reorder_point: int
    current_stock: int
    needs_reorder: bool
    suggested_order_quantity: int
    estimated_reorder_cost: float
    service_level: float
    model_used: str
    is_fallback: bool = False

# 6. Warehouse Optimization Schemas
class WarehouseOptimizationRequest(BaseModel):
    product_ids: List[str] = Field(..., min_length=1, description="List of product IDs to pick")

class PickStop(BaseModel):
    step: int
    product_id: str
    name: str
    aisle: str
    rack: int
    shelf: int
    zone: str
    x: float
    y: float

class WarehouseOptimizationResponse(BaseModel):
    success: bool = True
    total_items: int
    total_walking_distance_meters: float
    estimated_pick_time_seconds: float
    picking_sequence: List[PickStop]
    algorithm_used: str
    is_fallback: bool = False

# 7. Delivery Optimization Schemas
class DeliveryStop(BaseModel):
    id: str
    name: Optional[str] = "Customer"
    lat: float
    lng: float
    demand: float = Field(default=2.5, gt=0.0, description="Order weight/volume in kg")

class DeliveryOptimizationRequest(BaseModel):
    depot_lat: Optional[float] = Field(default=19.0760, description="Depot latitude")
    depot_lng: Optional[float] = Field(default=72.8777, description="Depot longitude")
    depot_name: Optional[str] = "Central Fulfillment Hub"
    vehicle_capacity_kg: float = Field(default=25.0, gt=0.0)
    orders: List[DeliveryStop] = Field(..., min_length=1)

class VehicleRoute(BaseModel):
    vehicle_id: str
    num_stops: int
    route_distance_km: float
    payload_kg: float
    capacity_utilization_pct: float
    estimated_time_hours: float
    stops: List[Dict[str, Any]]

class DeliveryOptimizationResponse(BaseModel):
    success: bool = True
    total_orders: int
    num_vehicles_used: int
    total_fleet_distance_km: float
    total_travel_time_hours: float
    avg_route_distance_km: float
    fleet_capacity_utilization_pct: float
    routes: List[VehicleRoute]
    algorithm_used: str
    is_fallback: bool = False
