import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  Package, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Star,
  MapPin,
  DollarSign,
  Tag
} from 'lucide-react';

const RecommendationsList = ({
  recommendations = [],
  title = 'You might also like',
  emptyMessage = 'No recommendations available',
  loading = false,
  showConfidence = true,
  showImages = true,
  compact = false,
  className = '',
  onItemClick = null,
  maxItems = 5
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  // Get confidence level color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-emerald-600';
    if (confidence >= 0.6) return 'text-blue-600';
    if (confidence >= 0.4) return 'text-amber-600';
    return 'text-rose-600';
  };

  // Get confidence label
  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High match';
    if (confidence >= 0.6) return 'Good match';
    if (confidence >= 0.4) return 'Moderate match';
    return 'Low match';
  };

  // Format confidence as percentage
  const formatConfidence = (confidence) => {
    return Math.round(confidence * 100);
  };

  // Get similarity score color
  const getSimilarityColor = (score) => {
    if (score >= 4) return 'text-emerald-600';
    if (score >= 3) return 'text-blue-600';
    if (score >= 2) return 'text-amber-600';
    return 'text-[#A0A0B0]';
  };

  // Get item name from either field
  const getItemName = (item) => {
    return item.name || item.item_name || 'Unnamed Item';
  };

  // Display items
  const displayItems = expanded ? recommendations : recommendations.slice(0, Math.min(3, maxItems));
  const hasMore = recommendations.length > 3;

  console.log('RecommendationsList render:', {
    recommendationsCount: recommendations.length,
    displayItemsCount: displayItems.length,
    recommendations: recommendations
  });

  if (loading) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-[#EEECE6] animate-pulse ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-[#F5F3EF]" />
          <div className="h-4 w-32 bg-[#F5F3EF] rounded" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#F5F3EF]" />
              <div className="flex-1">
                <div className="h-3 w-24 bg-[#F5F3EF] rounded" />
                <div className="h-2 w-16 bg-[#F5F3EF] rounded mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    console.log('No recommendations to display');
    return null;
  }

  // Compact mode
  if (compact) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-[#EEECE6] ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-[#FFBE91]" />
          <span className="text-xs font-medium text-[#1A1A2E]">{title}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {recommendations.slice(0, 5).map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (onItemClick) {
                  onItemClick(item);
                } else if (item.id) {
                  navigate(`/${item.type || 'request'}/${item.id}`);
                }
              }}
              className="px-2.5 py-1 bg-[#F8F6F0] rounded-full text-[10px] text-[#1A1A2E] hover:bg-[#FFDDB0]/30 transition-colors"
            >
              {getItemName(item)}
              {showConfidence && item.confidence && (
                <span className="ml-1 text-[8px] text-[#A0A0B0]">
                  ({formatConfidence(item.confidence)}%)
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white/80 backdrop-blur-sm rounded-xl border border-[#EEECE6] shadow-sm hover:shadow-md transition-all ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#EEECE6]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFFCE1] flex items-center justify-center">
              <Sparkles size={16} className="text-[#FFBE91]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A2E]">{title}</h3>
              <p className="text-[10px] text-[#A0A0B0]">
                {recommendations.length} items found
              </p>
            </div>
          </div>
          {recommendations.length > maxItems && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg hover:bg-[#F5F3EF] transition-colors"
            >
              {expanded ? <ChevronUp size={16} className="text-[#A0A0B0]" /> : <ChevronDown size={16} className="text-[#A0A0B0]" />}
            </button>
          )}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={expanded ? 'expanded' : 'collapsed'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {displayItems.map((item, index) => {
              const confidence = item.confidence || 0;
              const similarityScore = item.similarity_score || 0;
              const firstImage = item.image_urls && item.image_urls.length > 0 
                ? item.image_urls[0] 
                : null;
              const itemName = getItemName(item);
              
              return (
                <motion.div
                  key={item.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    if (onItemClick) {
                      onItemClick(item);
                    } else if (item.id) {
                      navigate(`/${item.type || 'auction'}/${item.id}`);
                    }
                  }}
                  className="group flex items-start gap-3 p-3 bg-[#F8F6F0] rounded-xl hover:bg-[#FFFCE1] transition-colors cursor-pointer"
                >
                  {/* Image */}
                  {showImages && firstImage ? (
                    <img
                      src={firstImage}
                      alt={itemName}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : showImages ? (
                    <div className="w-14 h-14 rounded-lg bg-[#F5F3EF] flex items-center justify-center flex-shrink-0">
                      <Package size={20} className="text-[#A0A0B0]" />
                    </div>
                  ) : null}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[#1A1A2E] truncate">
                          {itemName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {item.category && (
                            <span className="flex items-center gap-1 text-[10px] text-[#A0A0B0]">
                              <Tag size={10} />
                              {item.category}
                            </span>
                          )}
                          {item.pincode && (
                            <span className="flex items-center gap-1 text-[10px] text-[#A0A0B0]">
                              <MapPin size={10} />
                              {item.pincode}
                            </span>
                          )}
                          {item.price && (
                            <span className="flex items-center gap-1 text-[10px] text-[#A0A0B0]">
                              <DollarSign size={10} />
                              ₹{item.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Confidence Badge */}
                      {showConfidence && confidence > 0 && (
                        <div className="flex flex-col items-end">
                          <span className={`text-xs font-semibold ${getConfidenceColor(confidence)}`}>
                            {formatConfidence(confidence)}%
                          </span>
                          <span className="text-[8px] text-[#A0A0B0]">
                            {getConfidenceLabel(confidence)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Similarity Score */}
                    {similarityScore > 0 && (
                      <div className="mt-1 flex items-center gap-1">
                        <Star size={12} className={getSimilarityColor(similarityScore)} />
                        <span className="text-[10px] text-[#A0A0B0]">
                          {similarityScore.toFixed(1)} / 5 similarity
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {item.description && (
                      <p className="text-[10px] text-[#A0A0B0] mt-1 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight size={16} className="text-[#A0A0B0] group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1" />
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* View More */}
        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full mt-3 py-2 text-xs text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors flex items-center justify-center gap-1"
          >
            View {recommendations.length - 3} more recommendations
            <ChevronDown size={14} />
          </button>
        )}
        {hasMore && expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="w-full mt-3 py-2 text-xs text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors flex items-center justify-center gap-1"
          >
            Show less
            <ChevronUp size={14} />
          </button>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-[#EEECE6] flex items-center justify-between">
          <span className="text-[9px] text-[#A0A0B0] flex items-center gap-1">
            <TrendingUp size={10} />
            Based on {recommendations.length} items
          </span>
          <span className="text-[9px] text-[#A0A0B0]">
            {expanded ? 'Showing all' : `Showing ${Math.min(3, recommendations.length)} of ${recommendations.length}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default RecommendationsList;