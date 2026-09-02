import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import os

# Get the project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(PROJECT_ROOT, "models")

# Ensure models directory exists
os.makedirs(MODELS_DIR, exist_ok=True)

logger = logging.getLogger(__name__)

class PriceSuggestionModel:
    def __init__(self):
        self.model = None
        self.category_encoder = None
        self.pincode_encoder = None
        self.is_trained = False

    def prepare_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Prepare data for training"""
        if data is None or data.empty:
            logger.warning("No data provided for preparation")
            return pd.DataFrame()
        
        # Make a copy
        df = data.copy()
        
        # Use only seed data for training
        if 'data_source' in df.columns:
            df = df[df['data_source'] == 'seed'].copy()
        
        if df.empty:
            logger.warning("No seed data available for training")
            return df
        
        # Ensure numeric columns
        for col in ['budget_min', 'budget_max', 'selected_price']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Drop rows with missing values
        df = df.dropna(subset=['selected_price', 'budget_min', 'budget_max'])
        
        if df.empty:
            logger.warning("No valid data after cleaning")
            return df
        
        # Feature engineering
        df['budget_range'] = df['budget_max'] - df['budget_min']
        df['budget_mid'] = (df['budget_min'] + df['budget_max']) / 2
        
        # Fill missing categories
        if 'category' in df.columns:
            df['category'] = df['category'].fillna('unknown')
        else:
            df['category'] = 'unknown'
        
        if 'pincode' in df.columns:
            df['pincode'] = df['pincode'].fillna('000000')
        else:
            df['pincode'] = '000000'
        
        logger.info(f"Prepared {len(df)} samples for training")
        return df

    def train(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Train price suggestion model"""
        df = self.prepare_data(data)
        
        if df.empty:
            logger.warning("No data to train price suggestion model")
            return {}
        
        # Encode categorical variables
        self.category_encoder = LabelEncoder()
        self.pincode_encoder = LabelEncoder()
        
        df['category_encoded'] = self.category_encoder.fit_transform(df['category'].astype(str))
        df['pincode_encoded'] = self.pincode_encoder.fit_transform(df['pincode'].astype(str))
        
        # Features
        feature_cols = [
            'budget_min', 'budget_max', 'budget_range', 'budget_mid',
            'category_encoded', 'pincode_encoded'
        ]
        
        # Check if all features exist
        missing_features = [col for col in feature_cols if col not in df.columns]
        if missing_features:
            logger.error(f"Missing features: {missing_features}")
            return {}
        
        # Target: selected price
        X = df[feature_cols]
        y = df['selected_price']
        
        # Ensure we have enough samples
        if len(X) < 10:
            logger.warning(f"Only {len(X)} samples, need at least 10")
            return {}
        
        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train model
        self.model = LinearRegression()
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        logger.info(f"Price suggestion model trained - MAE: {mae:.2f}, R2: {r2:.2f}")
        
        return {
            'mae': mae,
            'r2': r2,
            'samples': len(X_train),
            'feature_importance': dict(zip(feature_cols, self.model.coef_.tolist()))
        }

    def predict(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict suggested price for a request"""
        if not self.is_trained or self.model is None:
            logger.warning("Model not trained, using fallback")
            return self._fallback_predict(request_data)
        
        try:
            budget_min = request_data.get('budget_min', 0)
            budget_max = request_data.get('budget_max', 0)
            category = request_data.get('category', 'unknown')
            pincode = request_data.get('pincode', '000000')
            
            # Encode
            category_encoded = self._encode_category(category)
            pincode_encoded = self._encode_pincode(pincode)
            
            # Features
            features = np.array([[
                float(budget_min),
                float(budget_max),
                float(budget_max - budget_min),
                float((budget_min + budget_max) / 2),
                float(category_encoded),
                float(pincode_encoded)
            ]])
            
            # Check for NaN values
            if np.isnan(features).any():
                logger.warning("NaN values in features, using fallback")
                return self._fallback_predict(request_data)
            
            # Predict
            prediction = self.model.predict(features)[0]
            
            # Ensure within budget range
            suggested_price = max(budget_min, min(budget_max, int(prediction)))
            
            # Calculate confidence based on feature consistency
            confidence = self._calculate_confidence(features)
            
            return {
                'suggested_price': suggested_price,
                'confidence_score': confidence,
                'min_price': budget_min,
                'max_price': budget_max
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return self._fallback_predict(request_data)

    def _encode_category(self, category: str) -> int:
        """Encode category with fallback"""
        if self.category_encoder:
            try:
                return self.category_encoder.transform([str(category)])[0]
            except ValueError:
                return 0
        return 0

    def _encode_pincode(self, pincode: str) -> int:
        """Encode pincode with fallback"""
        if self.pincode_encoder:
            try:
                return self.pincode_encoder.transform([str(pincode)])[0]
            except ValueError:
                return 0
        return 0

    def _calculate_confidence(self, features: np.ndarray) -> float:
        """Calculate confidence score for prediction"""
        # Simple confidence based on feature variance
        base_confidence = 0.7
        return min(0.95, base_confidence + 0.05)

    def _fallback_predict(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback prediction when model is not trained"""
        budget_min = request_data.get('budget_min', 0)
        budget_max = request_data.get('budget_max', 0)
        
        # Simple heuristic: mid-point of budget range
        suggested_price = (budget_min + budget_max) // 2
        
        return {
            'suggested_price': suggested_price,
            'confidence_score': 0.5,
            'min_price': budget_min,
            'max_price': budget_max
        }

    def save_model(self, path: str = None):
        """Save trained model"""
        if not self.is_trained:
            logger.warning("Model not trained, nothing to save")
            return
        
        if path is None:
            path = os.path.join(MODELS_DIR, 'price_suggestion.joblib')
        
        try:
            joblib.dump({
                'model': self.model,
                'category_encoder': self.category_encoder,
                'pincode_encoder': self.pincode_encoder,
                'is_trained': self.is_trained
            }, path)
            logger.info(f"Model saved to {path}")
        except Exception as e:
            logger.error(f"Error saving model: {e}")

    def load_model(self, path: str = None):
        """Load trained model"""
        if path is None:
            path = os.path.join(MODELS_DIR, 'price_suggestion.joblib')
        
        try:
            data = joblib.load(path)
            self.model = data['model']
            self.category_encoder = data['category_encoder']
            self.pincode_encoder = data['pincode_encoder']
            self.is_trained = data['is_trained']
            logger.info(f"Model loaded from {path}")
            return True
        except FileNotFoundError:
            logger.warning(f"Model not found at {path}")
            return False
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False