import pandas as pd
from collections import defaultdict, Counter
from typing import List, Dict, Any, Set, Tuple
from itertools import combinations
import logging

logger = logging.getLogger(__name__)

class AprioriRecommender:
    def __init__(self, min_support: float = 0.01, min_confidence: float = 0.3):
        self.min_support = min_support
        self.min_confidence = min_confidence
        self.frequent_itemsets = []
        self.rules = []

    def train(self, transactions: List[List[str]]):
        """Train Apriori model on transaction data"""
        if not transactions:
            logger.warning("No transactions for Apriori training")
            return
        
        # Generate frequent itemsets
        self.frequent_itemsets = self._generate_frequent_itemsets(transactions)
        
        # Generate association rules
        self.rules = self._generate_rules(transactions, self.frequent_itemsets)
        
        logger.info(f"Generated {len(self.rules)} association rules")

    def _generate_frequent_itemsets(self, transactions: List[List[str]]) -> List[Set[str]]:
        """Generate frequent itemsets using Apriori"""
        if not transactions:
            return []
        
        # Get all unique items
        all_items = set()
        for tx in transactions:
            all_items.update(tx)
        
        if not all_items:
            return []
        
        # Count item frequencies
        item_counts = Counter()
        for tx in transactions:
            for item in set(tx):
                item_counts[item] += 1
        
        # Filter by min support
        min_count = len(transactions) * self.min_support
        frequent_items = {item for item, count in item_counts.items() if count >= min_count}
        
        if not frequent_items:
            return []
        
        # Start with frequent 1-itemsets
        frequent_itemsets = [{item} for item in frequent_items]
        result = frequent_itemsets.copy()
        
        # Generate higher order itemsets
        k = 2
        while True:
            # Generate candidate itemsets of size k
            candidates = []
            for i in range(len(frequent_itemsets)):
                for j in range(i + 1, len(frequent_itemsets)):
                    candidate = frequent_itemsets[i] | frequent_itemsets[j]
                    if len(candidate) == k:
                        candidates.append(candidate)
            
            # Remove duplicates
            candidates = list(set(tuple(sorted(c))) for c in candidates)
            candidates = [set(c) for c in candidates]
            
            if not candidates:
                break
            
            # Count support for candidates
            candidate_counts = Counter()
            for tx in transactions:
                tx_set = set(tx)
                for candidate in candidates:
                    if candidate.issubset(tx_set):
                        candidate_counts[tuple(sorted(candidate))] += 1
            
            # Filter by min support
            frequent = []
            for candidate_tuple, count in candidate_counts.items():
                if count >= min_count:
                    frequent.append(set(candidate_tuple))
            
            if not frequent:
                break
            
            result.extend(frequent)
            frequent_itemsets = frequent
            k += 1
        
        return result

    def _generate_rules(self, transactions: List[List[str]], 
                        frequent_itemsets: List[Set[str]]) -> List[Tuple[Set[str], Set[str], float]]:
        """Generate association rules from frequent itemsets"""
        if not transactions or not frequent_itemsets:
            return []
        
        rules = []
        total_transactions = len(transactions)
        
        for itemset in frequent_itemsets:
            if len(itemset) < 2:
                continue
            
            # For each subset as antecedent
            items_list = list(itemset)
            for i in range(1, len(items_list)):
                for antecedent_indices in combinations(range(len(items_list)), i):
                    antecedent = {items_list[idx] for idx in antecedent_indices}
                    consequent = itemset - antecedent
                    
                    if not consequent:
                        continue
                    
                    # Calculate support and confidence
                    support = sum(1 for tx in transactions if itemset.issubset(set(tx))) / total_transactions
                    
                    antecedent_count = sum(1 for tx in transactions if antecedent.issubset(set(tx)))
                    if antecedent_count > 0:
                        confidence = (support * total_transactions) / antecedent_count
                        
                        if confidence >= self.min_confidence:
                            rules.append((antecedent, consequent, confidence))
        
        return rules

    def get_recommendations(self, items: List[str], top_n: int = 5) -> List[Tuple[str, float]]:
        """Get recommendations based on input items"""
        if not items or not self.rules:
            return []
        
        item_set = set(items)
        recommendations = Counter()
        
        for antecedent, consequent, confidence in self.rules:
            if antecedent.issubset(item_set):
                for item in consequent:
                    recommendations[item] += confidence
        
        return recommendations.most_common(top_n)

    def get_related_requests(self, request_id: str, 
                             request_data: Dict[str, Any],
                             all_requests: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Find related requests based on category and pincode"""
        if not all_requests:
            return []
        
        category = request_data.get('category', '')
        pincode = request_data.get('pincode', '')
        budget_min = request_data.get('budget_min', 0)
        budget_max = request_data.get('budget_max', 0)
        budget_mid = (budget_min + budget_max) / 2 if (budget_min + budget_max) > 0 else 0
        
        # Score each request
        scored_requests = []
        for req in all_requests:
            if req.get('id') == request_id:
                continue
            
            score = 0
            if req.get('category') == category:
                score += 3
            if req.get('pincode') == pincode:
                score += 2
            
            # Budget similarity
            req_min = req.get('budget_min', 0)
            req_max = req.get('budget_max', 0)
            req_mid = (req_min + req_max) / 2 if (req_min + req_max) > 0 else 0
            
            if req_mid > 0 and budget_mid > 0:
                ratio = min(budget_mid, req_mid) / max(budget_mid, req_mid)
                if ratio > 0.5:
                    score += ratio
            
            if score > 0:
                scored_requests.append({
                    **req,
                    'similarity_score': round(score, 2)
                })
        
        scored_requests.sort(key=lambda x: x.get('similarity_score', 0), reverse=True)
        return scored_requests[:5]