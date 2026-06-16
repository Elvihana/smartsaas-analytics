import sys
import os

# Ensure the app package is on the path when running from backend/
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configuration
from config import (
    CORS_ORIGINS,
    API_VERSION,
    PROJECT_NAME,
    PROJECT_DESCRIPTION,
)

# Routers
from routes.dashboard import router as dashboard_router
from routes.customers import router as customers_router
from routes.prediction import router as prediction_router
from routes.campaigns import router as campaigns_router
from routes.report import router as report_router
from routes.user import router as user_router

app = FastAPI(
    title=PROJECT_NAME,
    description=PROJECT_DESCRIPTION,
    version=API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration - allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(dashboard_router)
app.include_router(customers_router)
app.include_router(prediction_router)
app.include_router(campaigns_router)
app.include_router(report_router)
app.include_router(user_router)


@app.get("/")
def home():
    return {
        "message": "SmartSaaS Analytics API",
        "version": API_VERSION,
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}