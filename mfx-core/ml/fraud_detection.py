import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class FraudDetector:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False

    def _extract_features(self, bid: Dict[str, Any]) -> np.ndarray:
        """Extract features for fraud detection"""
        # Features:
        # 1. Price deviation from budget
        # 2. Response time
        # 3. Number of bids by shop
        # 4. Price variance
        # 5. Bid note length
        
        features = []
        
        # 1. Price deviation
        budget_min = bid.get('budget_min', 0)
        budget_max = bid.get('budget_max', 0)
        price = bid.get('price', 0)
        
        if budget_min > 0 and budget_max > 0:
            price_dev = (price - budget_min) / (budget_max - budget_min)
        else:
            price_dev = 0
        features.append(price_dev)
        
        # 2. Response time (in hours)
        created_at = bid.get('created_at')
        selected_at = bid.get('selected_at')
        if created_at and selected_at:
            response_time = (selected_at - created_at).total_seconds() / 3600
        else:
            response_time = 24  # Default
        features.append(min(72, response_time))
        
        # 3. Number of bids by shop
        features.append(bid.get('shop_bid_count', 1))
        
        # 4. Price variance (if multiple bids)
        features.append(bid.get('price_variance', 0))
        
        # 5. Note length
        note = bid.get('note', '')
        features.append(len(note))
        
        return np.array(features).reshape(1, -1)

    def train(self, bids: List[Dict[str, Any]], labels: List[int]):
        """Train fraud detection model"""
        if not bids or len(bids) < 10:
            logger.warning("Insufficient data for fraud detection training")
            return
        
        # Extract features
        features = []
        for bid in bids:
            features.append(self._extract_features(bid).flatten())
        
        X = np.array(features)
        y = np.array(labels)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.model.fit(X_scaled, y)
        self.is_trained = True
        
        logger.info(f"Fraud detection model trained on {len(bids)} samples")

    def predict(self, bid: Dict[str, Any]) -> Dict[str, Any]:
        """Predict if a bid is fraudulent"""
        if not self.is_trained or self.model is None:
            return {
                'is_fraud': False,
                'confidence': 0.5,
                'risk_factors': ['Model not trained - using fallback']
            }
        
        try:
            features = self._extract_features(bid)
            features_scaled = self.scaler.transform(features)
            
            # Get prediction and probability
            prediction = self.model.predict(features_scaled)[0]
            probabilities = self.model.predict_proba(features_scaled)[0]
            
            # Get risk factors
            risk_factors = self._get_risk_factors(bid, features_scaled[0])
            
            return {
                'is_fraud': bool(prediction == 1),
                'confidence': float(max(probabilities)),
                'risk_factors': risk_factors
            }
            
        except Exception as e:
            logger.error(f"Fraud prediction error: {e}")
            return {
                'is_fraud': False,
                'confidence': 0.5,
                'risk_factors': ['Error in prediction']
            }

    def _get_risk_factors(self, bid: Dict[str, Any], features: np.ndarray) -> List[str]:
        """Get risk factors for a bid"""
        risk_factors = []
        
        # Check price deviation
        if features[0] < 0 or features[0] > 1.5:
            risk_factors.append("Price is outside normal budget range")
        
        # Check response time
        if features[1] < 0.5:
            risk_factors.append("Suspiciously fast response (potential bot)")
        
        # Check shop bid count
        if features[2] > 20:
            risk_factors.append("High bid volume from this shop")
        
        # Check note length
        if features[4] == 0:
            risk_factors.append("No note provided with bid")
        
        return risk_factors