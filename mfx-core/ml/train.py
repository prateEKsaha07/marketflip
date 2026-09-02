import pandas as pd
from datetime import datetime
import logging
from ml.price_suggestion import PriceSuggestionModel
from ml.fraud_detection import FraudDetector
from ml.data_loader import load_training_data

logger = logging.getLogger(__name__)

def train_all_models():
    """Train all ML models"""
    logger.info("Starting ML training pipeline...")
    
    # Load data
    data = load_training_data()
    
    # 1. Price Suggestion
    logger.info("Training price suggestion model...")
    price_model = PriceSuggestionModel()
    price_results = price_model.train(data['requests'])
    price_model.save_model()
    logger.info(f"Price model results: {price_results}")
    
    # 2. Fraud Detection
    logger.info("Training fraud detection model...")
    fraud_model = FraudDetector()
    # Need labeled data for training
    fraud_model.train(data['bids'], data['fraud_labels'])
    
    logger.info("ML training complete!")

if __name__ == "__main__":
    train_all_models()