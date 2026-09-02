import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

class DemandForecaster:
    def __init__(self):
        self.historical_data = None

    def prepare_data(self, events: List[Dict[str, Any]]) -> pd.DataFrame:
        """Prepare time-series data from events"""
        if not events:
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(events)
        
        # Parse dates
        df['date'] = pd.to_datetime(df['created_at']).dt.date
        
        # Aggregate by date and category
        demand_by_date = df.groupby(['date', 'category']).size().reset_index(name='count')
        
        return demand_by_date

    def forecast_demand(self, df: pd.DataFrame, 
                        forecast_days: int = 7,
                        category: Optional[str] = None,
                        pincode: Optional[str] = None) -> Dict[str, Any]:
        """Forecast demand for the next N days"""
        if df.empty:
            return {'forecast': [], 'error': 'No data available'}
        
        # Filter by category if provided
        if category:
            df = df[df['category'] == category]
        
        if df.empty:
            return {'forecast': [], 'error': f'No data for category {category}'}
        
        # Simple moving average forecast
        df = df.sort_values('date')
        
        # Get daily counts
        daily_counts = df.groupby('date')['count'].sum()
        
        if len(daily_counts) < 3:
            return {'forecast': [], 'error': 'Insufficient data for forecasting'}
        
        # Calculate moving average
        window = min(7, len(daily_counts))
        moving_avg = daily_counts.rolling(window=window, min_periods=1).mean()
        
        # Last known value
        last_value = moving_avg.iloc[-1] if not moving_avg.empty else 0
        
        # Forecast future days
        forecast = []
        last_date = daily_counts.index[-1]
        
        for i in range(1, forecast_days + 1):
            future_date = last_date + timedelta(days=i)
            
            # Simple forecast: use moving average with slight variation
            variation = np.random.normal(0, 0.1)
            predicted = max(0, int(last_value * (1 + variation)))
            
            forecast.append({
                'date': future_date.isoformat(),
                'predicted_demand': predicted,
                'confidence_interval': {
                    'lower': max(0, int(predicted * 0.7)),
                    'upper': int(predicted * 1.3)
                }
            })
        
        return {
            'forecast': forecast,
            'current_demand': int(last_value),
            'trend': 'increasing' if moving_avg.iloc[-1] > moving_avg.iloc[-3] else 'decreasing'
        }

    def get_high_demand_categories(self, events: List[Dict[str, Any]], 
                                   top_n: int = 5) -> List[Dict[str, Any]]:
        """Get categories with highest demand"""
        if not events:
            return []
        
        df = pd.DataFrame(events)
        
        # Count by category
        category_counts = df['category'].value_counts().head(top_n)
        
        results = []
        for category, count in category_counts.items():
            results.append({
                'category': category,
                'request_count': count,
                'percentage': (count / len(df)) * 100
            })
        
        return results

    def get_hot_pincodes(self, events: List[Dict[str, Any]], 
                         top_n: int = 5) -> List[Dict[str, Any]]:
        """Get pincodes with highest activity"""
        if not events:
            return []
        
        df = pd.DataFrame(events)
        
        # Count by pincode
        pincode_counts = df['pincode'].value_counts().head(top_n)
        
        results = []
        for pincode, count in pincode_counts.items():
            results.append({
                'pincode': pincode,
                'activity_count': count
            })
        
        return results