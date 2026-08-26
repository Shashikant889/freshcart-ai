"""
FreshCart AI — Python AI Inference Service Configuration
"""

import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ML_DIR = BASE_DIR / "ml"
MODELS_DIR = ML_DIR / "python" / "models"
DATA_DIR = BASE_DIR / "data"

# Server Settings
SERVICE_HOST = os.getenv("AI_SERVICE_HOST", "127.0.0.1")
SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", "8000"))
API_PREFIX = ""
DEBUG_MODE = os.getenv("AI_SERVICE_DEBUG", "false").lower() == "true"

# Service Metadata
SERVICE_NAME = "FreshCart AI Inference Microservice"
SERVICE_VERSION = "2.0.0"
API_VERSION = "v1"
