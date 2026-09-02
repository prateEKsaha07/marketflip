"""
ML Configuration - Centralized settings for all ML modules
"""

import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

# Create models directory if it doesn't exist
MODELS_DIR.mkdir(exist_ok=True)

# Model file paths
PRICE_MODEL_PATH = MODELS_DIR / "price_suggestion.joblib"
FRAUD_MODEL_PATH = MODELS_DIR / "fraud_detection.joblib"
RECOMMENDATION_MODEL_PATH = MODELS_DIR / "recommendations.joblib"

# ML Parameters
PRICE_MODEL_CONFIG = {
    "test_size": 0.2,
    "random_state": 42,
    "min_samples": 50
}

FRAUD_MODEL_CONFIG = {
    "n_estimators": 100,
    "max_depth": 10,
    "random_state": 42
}

APRIORI_CONFIG = {
    "min_support": 0.01,
    "min_confidence": 0.3,
    "min_lift": 1.0,
    "min_length": 2
}

FORECAST_CONFIG = {
    "default_days": 7,
    "moving_avg_window": 7,
    "min_data_points": 3
}

# ====== DATA SOURCE CONFIGURATION ======
# Use 'seed' for training, switch to 'live' once sufficient real data exists
TRAINING_DATA_SOURCE = "seed"
INFERENCE_DATA_SOURCE = "seed"  # Change to 'live' in production

# ====== ML FEATURE FLAGS ======
ENABLE_PRICE_SUGGESTION = True
ENABLE_BID_RANKING = True
ENABLE_RECOMMENDATIONS = True
ENABLE_DEMAND_FORECAST = True
ENABLE_FRAUD_DETECTION = True

# ====== LOGGING ======
ML_LOG_LEVEL = os.getenv("ML_LOG_LEVEL", "INFO")

# ====== MODEL RETRAINING ======
RETRAIN_INTERVAL_DAYS = 7
MIN_TRAINING_SAMPLES = 50