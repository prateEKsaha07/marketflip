"""
Model Utilities - Shared helper functions for ML models
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
import json

logger = logging.getLogger(__name__)


def safe_divide(a: float, b: float, default: float = 0.0) -> float:
    """Safe division to avoid division by zero"""
    if b == 0:
        return default
    return a / b


def normalize_value(value: float, min_val: float, max_val: float) -> float:
    """Normalize a value to range [0, 1]"""
    if max_val == min_val:
        return 0.5
    return max(0, min(1, (value - min_val) / (max_val - min_val)))


def calculate_percentile(data: List[float], percentile: float) -> float:
    """Calculate percentile of a list"""
    if not data:
        return 0
    sorted_data = sorted(data)
    index = int(len(sorted_data) * percentile / 100)
    return sorted_data[min(index, len(sorted_data) - 1)]


def get_category_encoder(categories: List[str]) -> Dict[str, int]:
    """Create a simple category encoder"""
    return {cat: idx for idx, cat in enumerate(sorted(set(categories)))}


def encode_categories(df: pd.DataFrame, column: str, encoder: Dict[str, int]) -> pd.Series:
    """Encode categories using a pre-built encoder"""
    return df[column].map(lambda x: encoder.get(x, 0)).fillna(0).astype(int)


def train_test_split_by_time(df: pd.DataFrame, 
                             date_column: str, 
                             test_size: float = 0.2) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Split data by time for time-series validation"""
    if date_column not in df.columns:
        # Fallback to random split
        mask = np.random.rand(len(df)) < (1 - test_size)
        return df[mask], df[~mask]
    
    df = df.sort_values(date_column)
    split_idx = int(len(df) * (1 - test_size))
    train = df.iloc[:split_idx]
    test = df.iloc[split_idx:]
    return train, test


def calculate_mae(y_true: List[float], y_pred: List[float]) -> float:
    """Calculate Mean Absolute Error"""
    if not y_true or not y_pred or len(y_true) != len(y_pred):
        return 0
    return sum(abs(a - b) for a, b in zip(y_true, y_pred)) / len(y_true)


def calculate_rmse(y_true: List[float], y_pred: List[float]) -> float:
    """Calculate Root Mean Squared Error"""
    if not y_true or not y_pred or len(y_true) != len(y_pred):
        return 0
    mse = sum((a - b) ** 2 for a, b in zip(y_true, y_pred)) / len(y_true)
    return np.sqrt(mse)


def calculate_r2(y_true: List[float], y_pred: List[float]) -> float:
    """Calculate R-squared score"""
    if not y_true or not y_pred or len(y_true) != len(y_pred):
        return 0
    mean_y = sum(y_true) / len(y_true)
    ss_total = sum((y - mean_y) ** 2 for y in y_true)
    if ss_total == 0:
        return 1
    ss_residual = sum((a - b) ** 2 for a, b in zip(y_true, y_pred))
    return 1 - (ss_residual / ss_total)


def get_time_based_features(datetime_obj: datetime) -> Dict[str, Any]:
    """Extract time-based features from datetime"""
    return {
        'hour': datetime_obj.hour,
        'day_of_week': datetime_obj.weekday(),
        'month': datetime_obj.month,
        'is_weekend': 1 if datetime_obj.weekday() >= 5 else 0,
        'is_business_hours': 1 if 9 <= datetime_obj.hour <= 17 else 0
    }


def aggregate_by_date(df: pd.DataFrame, date_column: str, value_column: str) -> pd.DataFrame:
    """Aggregate data by date"""
    if date_column not in df.columns:
        return pd.DataFrame()
    
    df['date'] = pd.to_datetime(df[date_column]).dt.date
    result = df.groupby('date')[value_column].agg(['mean', 'count', 'sum']).reset_index()
    result.columns = ['date', 'mean_value', 'count', 'sum_value']
    return result


def moving_average(data: List[float], window: int) -> List[float]:
    """Calculate moving average of a list"""
    if not data or window <= 0:
        return []
    result = []
    for i in range(len(data)):
        start = max(0, i - window + 1)
        result.append(sum(data[start:i+1]) / (i - start + 1))
    return result


def detect_outliers(df: pd.DataFrame, column: str, threshold: float = 3.0) -> pd.Series:
    """Detect outliers using Z-score method"""
    if column not in df.columns or df[column].empty:
        return pd.Series([False] * len(df))
    
    mean = df[column].mean()
    std = df[column].std()
    
    if std == 0:
        return pd.Series([False] * len(df))
    
    z_scores = (df[column] - mean) / std
    return pd.Series(abs(z_scores) > threshold)


def memory_usage(df: pd.DataFrame) -> str:
    """Get memory usage of a DataFrame in MB"""
    return f"{df.memory_usage(deep=True).sum() / 1024 / 1024:.2f} MB"


def save_results(results: Dict[str, Any], path: str):
    """Save results to JSON file"""
    with open(path, 'w') as f:
        json.dump(results, f, indent=2, default=str)


def load_results(path: str) -> Dict[str, Any]:
    """Load results from JSON file"""
    with open(path, 'r') as f:
        return json.load(f)


def calculate_reliability_badge(reliability_score: float) -> Dict[str, Any]:
    """Calculate reliability badge based on score"""
    if reliability_score >= 80:
        return {
            'label': 'Highly Reliable',
            'color': 'emerald',
            'icon': '⭐',
            'class': 'bg-emerald-100 text-emerald-700'
        }
    elif reliability_score >= 60:
        return {
            'label': 'Reliable',
            'color': 'blue',
            'icon': '✅',
            'class': 'bg-blue-100 text-blue-700'
        }
    elif reliability_score >= 40:
        return {
            'label': 'Moderately Reliable',
            'color': 'amber',
            'icon': '⚠️',
            'class': 'bg-amber-100 text-amber-700'
        }
    else:
        return {
            'label': 'Needs Improvement',
            'color': 'rose',
            'icon': '❌',
            'class': 'bg-rose-100 text-rose-700'
        }