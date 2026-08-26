"""
FreshCart AI — Singleton Model Loader & Artifact Registry
Loads pre-trained models from ml/python/models/ once on startup.
"""

import json
import joblib
from pathlib import Path
from typing import Dict, Any, Optional
from ml.service.config import MODELS_DIR

class ModelRegistry:
    """Registry holding loaded model artifacts in memory."""
    def __init__(self):
        self._models: Dict[str, Any] = {}
        self._metadata: Dict[str, Any] = {}
        self._is_loaded: bool = False

    def load_all_models(self):
        """Load all available model binaries and JSON metadata from disk."""
        print(f"[MODEL_LOADER] Loading serialized model artifacts from: {MODELS_DIR}")
        
        # 1. Recommendation Model
        self._load_artifact("recommendation", "best_recommendation_model.joblib", "best_recommendation_model.json")
        
        # 2. Demand Forecasting Model
        self._load_artifact("demand_forecasting", "best_demand_forecasting_model.joblib", "best_demand_forecasting_model.json")
        
        # 3. Dynamic Pricing Model
        self._load_artifact("pricing", "price_elasticity_model.joblib", "price_elasticity_model.json")
        
        # 4. Fraud Detection Model
        self._load_artifact("fraud_detection", "best_fraud_detection_model.joblib", "best_fraud_detection_model.json")
        
        # 5. Inventory Optimizer
        self._load_artifact("inventory_optimizer", "inventory_optimizer.joblib")
        
        # 6. Warehouse Optimizer
        self._load_artifact("warehouse_optimizer", "warehouse_optimizer.joblib")
        
        # 7. Delivery Router
        self._load_artifact("delivery_router", "delivery_router.joblib")
        
        self._is_loaded = True
        print(f"[MODEL_LOADER] Successfully loaded {len(self._models)} models into memory.")

    def _load_artifact(self, key: str, joblib_filename: str, json_filename: Optional[str] = None):
        joblib_path = MODELS_DIR / joblib_filename
        if joblib_path.exists():
            try:
                self._models[key] = joblib.load(joblib_path)
                print(f"  ✓ Loaded model: {key} ({joblib_filename})")
            except Exception as e:
                print(f"  ✗ Failed to load {joblib_filename}: {e}")
                self._models[key] = None
        else:
            print(f"  ⚠ Artifact not found: {joblib_path}")
            self._models[key] = None
            
        if json_filename:
            json_path = MODELS_DIR / json_filename
            if json_path.exists():
                try:
                    with open(json_path, "r", encoding="utf-8") as f:
                        self._metadata[key] = json.load(f)
                except Exception as e:
                    self._metadata[key] = {}
            else:
                self._metadata[key] = {}

    def get_model(self, key: str) -> Any:
        return self._models.get(key)

    def get_metadata(self, key: str) -> Dict[str, Any]:
        return self._metadata.get(key, {})

    def get_status(self) -> Dict[str, bool]:
        return {k: (v is not None) for k, v in self._models.items()}

# Global singleton instance
registry = ModelRegistry()
