#!/usr/bin/env python3
"""
Test script for ML features
Run: python -m ml.test_ml
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from ml.data_loader import DataLoader
from ml.price_suggestion import PriceSuggestionModel
from ml.bid_ranking import BidRanker
from ml.recommendations import AprioriRecommender
from ml.demand_forecast import DemandForecaster
from ml.fraud_detection import FraudDetector
from ml.model_utils import calculate_reliability_badge

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_data_loader():
    """Test data loading"""
    logger.info("=" * 50)
    logger.info("TEST: Data Loader")
    logger.info("=" * 50)
    
    loader = DataLoader()
    
    # Load requests
    requests = loader.load_requests()
    logger.info(f"Loaded {len(requests)} requests")
    
    # Load bids
    bids = loader.load_bids()
    logger.info(f"Loaded {len(bids)} bids")
    
    # Load training data
    training_data = loader.get_training_data()
    logger.info(f"Loaded {len(training_data)} training samples")
    
    return training_data


def test_price_suggestion(training_data):
    """Test price suggestion model"""
    logger.info("=" * 50)
    logger.info("TEST: Price Suggestion")
    logger.info("=" * 50)
    
    model = PriceSuggestionModel()
    
    # Train
    results = model.train(training_data)
    if results:
        logger.info(f"Price model trained - MAE: {results.get('mae', 0):.2f}, R2: {results.get('r2', 0):.2f}")
    else:
        logger.warning("Price model training skipped - insufficient data")
        return
    
    # Save model
    model.save_model()
    logger.info("Model saved")
    
    # Test prediction
    test_request = {
        'budget_min': 2000,
        'budget_max': 5000,
        'category': 'electronics',
        'pincode': '490001'
    }
    
    prediction = model.predict(test_request)
    logger.info(f"Price suggestion: ₹{prediction['suggested_price']}")
    logger.info(f"   Confidence: {prediction['confidence_score']:.2f}")


def test_bid_ranking():
    """Test bid ranking"""
    logger.info("=" * 50)
    logger.info("TEST: Bid Ranking")
    logger.info("=" * 50)
    
    ranker = BidRanker()
    
    # Sample bids
    bids = [
        {'shop_id': 'shop1', 'price': 1500},
        {'shop_id': 'shop2', 'price': 2000},
        {'shop_id': 'shop3', 'price': 1200},
        {'shop_id': 'shop4', 'price': 2500},
    ]
    
    reliability_scores = {
        'shop1': 85,
        'shop2': 70,
        'shop3': 45,
        'shop4': 90
    }
    
    ranked = ranker.rank_bids(bids, 1000, 3000, reliability_scores)
    
    for i, bid in enumerate(ranked, 1):
        badge = calculate_reliability_badge(bid.get('reliability_score', 0))
        logger.info(f"  {i}. Shop {bid['shop_id']} - ₹{bid['price']} (Reliability: {badge['label']})")
    
    logger.info("Bid ranking test complete")


def test_demand_forecast():
    """Test demand forecasting"""
    logger.info("=" * 50)
    logger.info("TEST: Demand Forecasting")
    logger.info("=" * 50)
    
    # Sample events
    events = []
    from datetime import datetime, timedelta
    for i in range(30):
        events.append({
            'created_at': (datetime.now() - timedelta(days=i)).isoformat(),
            'category': 'electronics',
            'pincode': '490001',
            'data_source': 'seed'
        })
    
    forecaster = DemandForecaster()
    df = forecaster.prepare_data(events)
    
    if not df.empty:
        forecast = forecaster.forecast_demand(df, forecast_days=7, category='electronics')
        logger.info(f"Demand forecast: Current demand = {forecast.get('current_demand', 0)}")
        logger.info(f"   Trend: {forecast.get('trend', 'stable')}")
        logger.info(f"   Forecasted days: {len(forecast.get('forecast', []))}")
    else:
        logger.warning("No data for demand forecasting")


def test_recommendations():
    """Test Apriori recommendations"""
    logger.info("=" * 50)
    logger.info("TEST: Recommendations")
    logger.info("=" * 50)
    
    recommender = AprioriRecommender()
    
    # Sample transactions
    transactions = [
        ['electronics', 'smartphone', 'headphones'],
        ['electronics', 'laptop', 'mouse'],
        ['furniture', 'sofa', 'table'],
        ['electronics', 'smartphone', 'case'],
        ['electronics', 'laptop', 'bag'],
        ['furniture', 'chair', 'table'],
        ['books', 'novel', 'fiction'],
        ['electronics', 'headphones', 'speaker'],
    ]
    
    recommender.train(transactions)
    logger.info(f"Generated {len(recommender.rules)} association rules")
    
    recommendations = recommender.get_recommendations(['electronics', 'smartphone'])
    if recommendations:
        logger.info("Recommendations:")
        for item, score in recommendations:
            logger.info(f"   - {item} (confidence: {score:.2f})")
    else:
        logger.info("   No recommendations found")


def run_all_tests():
    """Run all ML tests"""
    logger.info("\n" + "=" * 60)
    logger.info("RUNNING ML TESTS")
    logger.info("=" * 60 + "\n")
    
    # Test 1: Data Loader
    training_data = test_data_loader()
    
    # Test 2: Price Suggestion
    if not training_data.empty and len(training_data) >= 10:
        test_price_suggestion(training_data)
    else:
        logger.warning("Insufficient data for price suggestion test")
    
    # Test 3: Bid Ranking
    test_bid_ranking()
    
    # Test 4: Demand Forecast
    test_demand_forecast()
    
    # Test 5: Recommendations
    test_recommendations()
    
    logger.info("\n" + "=" * 60)
    logger.info("ALL TESTS COMPLETE")
    logger.info("=" * 60)


if __name__ == "__main__":
    run_all_tests()