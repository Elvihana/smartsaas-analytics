"""
SmartSaaS Analytics - Application Configuration
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# CORS Configuration
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000,http://127.0.0.1:8000,null",
).split(",")

# Server Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# ML Model Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.getenv("MODELS_DIR", os.path.join(BASE_DIR, "trained_models"))

MODEL_PATH = os.path.join(MODELS_DIR, "churn_model.pkl")
PREPROCESS_PATH = os.path.join(MODELS_DIR, "preprocess.pkl")
SHAP_EXPLAINER_PATH = os.path.join(MODELS_DIR, "shap_explainer.pkl")

# API Configuration
API_PREFIX = "/api"
API_VERSION = "1.0.0"
PROJECT_NAME = "SmartSaaS Analytics API"
PROJECT_DESCRIPTION = "Backend API for SmartSaaS Analytics Platform"