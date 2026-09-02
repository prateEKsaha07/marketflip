"""
Data Loader - Load and prepare data from Supabase for ML training
"""

import pandas as pd
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta

from auth.dependencies import supabase_admin
from ml.config import TRAINING_DATA_SOURCE

logger = logging.getLogger(__name__)


class DataLoader:
    def __init__(self, data_source: str = TRAINING_DATA_SOURCE):
        self.data_source = data_source
        self.supabase = supabase_admin

    def load_requests(self, status: Optional[str] = None) -> pd.DataFrame:
        """Load requests data"""
        try:
            query = self.supabase.table("requests").select("*")
            
            if self.data_source:
                query = query.eq("data_source", self.data_source)
            
            if status:
                query = query.eq("status", status)
            
            response = query.execute()
            data = response.data if response.data else []
            
            df = pd.DataFrame(data)
            
            if df.empty:
                logger.warning(f"No requests data found with data_source={self.data_source}")
                return df
            
            # Ensure numeric columns
            for col in ['budget_min', 'budget_max']:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            
            logger.info(f"Loaded {len(df)} requests")
            return df
            
        except Exception as e:
            logger.error(f"Error loading requests: {e}")
            return pd.DataFrame()

    def load_bids(self, status: Optional[str] = None) -> pd.DataFrame:
        """Load bids data"""
        try:
            query = self.supabase.table("bids").select("*")
            
            if self.data_source:
                query = query.eq("data_source", self.data_source)
            
            if status:
                query = query.eq("status", status)
            
            response = query.execute()
            data = response.data if response.data else []
            
            df = pd.DataFrame(data)
            
            if df.empty:
                logger.warning(f"No bids data found with data_source={self.data_source}")
                return df
            
            # Ensure numeric columns
            if 'price' in df.columns:
                df['price'] = pd.to_numeric(df['price'], errors='coerce')
            
            # Debug: print column names
            logger.debug(f"Bids columns: {df.columns.tolist()}")
            
            logger.info(f"Loaded {len(df)} bids")
            return df
            
        except Exception as e:
            logger.error(f"Error loading bids: {e}")
            return pd.DataFrame()

    def load_auctions(self) -> pd.DataFrame:
        """Load auctions data"""
        try:
            query = self.supabase.table("auctions").select("*")
            
            if self.data_source:
                query = query.eq("data_source", self.data_source)
            
            response = query.execute()
            data = response.data if response.data else []
            
            df = pd.DataFrame(data)
            
            if df.empty:
                logger.warning(f"No auctions data found with data_source={self.data_source}")
                return df
            
            # Ensure numeric columns
            for col in ['starting_price', 'current_highest_bid']:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            
            logger.info(f"Loaded {len(df)} auctions")
            return df
            
        except Exception as e:
            logger.error(f"Error loading auctions: {e}")
            return pd.DataFrame()

    def load_auction_bids(self) -> pd.DataFrame:
        """Load auction bids data"""
        try:
            query = self.supabase.table("auction_bids").select("*")
            
            if self.data_source:
                query = query.eq("data_source", self.data_source)
            
            response = query.execute()
            data = response.data if response.data else []
            
            df = pd.DataFrame(data)
            
            if df.empty:
                logger.warning(f"No auction bids data found with data_source={self.data_source}")
                return df
            
            if 'bid_amount' in df.columns:
                df['bid_amount'] = pd.to_numeric(df['bid_amount'], errors='coerce')
            
            logger.info(f"Loaded {len(df)} auction bids")
            return df
            
        except Exception as e:
            logger.error(f"Error loading auction bids: {e}")
            return pd.DataFrame()

    def load_request_events(self, event_type: Optional[str] = None) -> pd.DataFrame:
        """Load request events data"""
        try:
            query = self.supabase.table("request_events").select("*")
            
            if self.data_source:
                query = query.eq("data_source", self.data_source)
            
            if event_type:
                query = query.eq("event_type", event_type)
            
            response = query.execute()
            data = response.data if response.data else []
            
            df = pd.DataFrame(data)
            
            if df.empty:
                logger.warning(f"No request events data found with data_source={self.data_source}")
                return df
            
            # Parse dates
            if 'created_at' in df.columns:
                df['created_at'] = pd.to_datetime(df['created_at'])
            
            logger.info(f"Loaded {len(df)} request events")
            return df
            
        except Exception as e:
            logger.error(f"Error loading request events: {e}")
            return pd.DataFrame()

    def load_reliability_scores(self) -> pd.DataFrame:
        """Load shop reliability scores"""
        try:
            response = self.supabase.table("shop_reliability_scores")\
                .select("*")\
                .execute()
            
            data = response.data if response.data else []
            df = pd.DataFrame(data)
            
            logger.info(f"Loaded {len(df)} reliability scores")
            return df
            
        except Exception as e:
            logger.error(f"Error loading reliability scores: {e}")
            return pd.DataFrame()

    def load_all_for_training(self) -> Dict[str, pd.DataFrame]:
        """Load all data needed for ML training"""
        logger.info("Loading all training data...")
        
        data = {
            'requests': self.load_requests(),
            'bids': self.load_bids(),
            'auctions': self.load_auctions(),
            'auction_bids': self.load_auction_bids(),
            'request_events': self.load_request_events(),
            'reliability_scores': self.load_reliability_scores()
        }
        
        logger.info(f"Data loaded: requests={len(data['requests'])}, bids={len(data['bids'])}")
        return data

    def get_training_data(self) -> pd.DataFrame:
        """Get combined data for price suggestion training"""
        requests_df = self.load_requests()
        bids_df = self.load_bids()
        
        if requests_df.empty or bids_df.empty:
            logger.warning("Insufficient data for training")
            return pd.DataFrame()
        
        # Debug: Check column names
        logger.debug(f"Requests columns: {requests_df.columns.tolist()}")
        logger.debug(f"Bids columns: {bids_df.columns.tolist()}")
        logger.debug(f"Requests sample: {requests_df.head(1).to_dict()}")
        logger.debug(f"Bids sample: {bids_df.head(1).to_dict()}")
        
        # Check for request_id column in bids
        if 'request_id' not in bids_df.columns:
            # Try alternative column names
            alt_names = ['request_id', 'requestId', 'request']
            found = False
            for alt in alt_names:
                if alt in bids_df.columns:
                    logger.info(f"Using '{alt}' as request_id column")
                    bids_df['request_id'] = bids_df[alt]
                    found = True
                    break
            
            if not found:
                logger.error("No request_id column found in bids table!")
                logger.error(f"Available columns: {bids_df.columns.tolist()}")
                return pd.DataFrame()
        
        # Check for id column in requests
        if 'id' not in requests_df.columns:
            logger.error("No 'id' column found in requests table!")
            return pd.DataFrame()
        
        # Merge requests with their bids
        merged = pd.merge(
            bids_df, 
            requests_df, 
            left_on='request_id', 
            right_on='id', 
            suffixes=('_bid', '_request')
        )
        
        if merged.empty:
            logger.warning("No merged data found")
            return pd.DataFrame()
        
        # Filter to selected bids (status from bids table)
        merged = merged[merged['status_bid'] == 'selected']
        
        if merged.empty:
            logger.warning("No selected bids found for training")
            return pd.DataFrame()
        
        # Rename columns for clarity
        merged['selected_price'] = merged['price']
        
        # Handle column naming - check what's available
        if 'budget_min_request' in merged.columns:
            merged['budget_min'] = merged['budget_min_request']
            merged['budget_max'] = merged['budget_max_request']
            merged['category'] = merged['category_request']
            merged['pincode'] = merged['pincode_request']
        elif 'budget_min' in merged.columns and 'budget_max' in merged.columns:
            # If columns are already named correctly
            pass
        else:
            logger.warning("Budget columns not found in merged data")
            return pd.DataFrame()
        
        # Keep relevant columns
        columns_to_keep = ['request_id', 'shop_id', 'selected_price', 
                          'budget_min', 'budget_max', 'category', 
                          'pincode', 'created_at_bid']
        
        existing_columns = [col for col in columns_to_keep if col in merged.columns]
        
        if not existing_columns:
            logger.error("No valid columns found for training data")
            logger.error(f"Available columns: {merged.columns.tolist()}")
            return pd.DataFrame()
        
        result = merged[existing_columns]
        
        # Rename created_at_bid to created_at if it exists
        if 'created_at_bid' in result.columns:
            result = result.rename(columns={'created_at_bid': 'created_at'})
        
        # Ensure numeric columns
        for col in ['budget_min', 'budget_max', 'selected_price']:
            if col in result.columns:
                result[col] = pd.to_numeric(result[col], errors='coerce')
        
        # Drop rows with missing values
        result = result.dropna(subset=['selected_price', 'budget_min', 'budget_max'])
        
        logger.info(f"Prepared {len(result)} training samples")
        return result